"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { invalidate } from "@/server/entitlements";
import type { Prisma } from "@/generated/prisma/client";
import { approveJob, refuseJob } from "@/server/services/moderation";
import { hiringTeam, notify } from "@/server/services/notifications";
import { disputeResolutionSchema, resolveDispute } from "@/server/matching/service";
import { criterionKeys } from "@/server/matching/types";
import { saveWeights, weightsInputSchema } from "@/server/services/ai-admin";
import { recordRefund, refundSchema } from "@/server/services/billing-admin";
import { mailOrgVerification } from "@/server/hire-emails";
import { decideVerification, verificationDecisionSchema } from "@/server/services/verification";
import { mailPartnerInvite } from "@/server/partner-emails";
import {
  createBatch,
  createPartner,
  inviteManager,
  PartnerError,
} from "@/server/services/partners";

/** Every admin write: an administrator with write access (support agents read only), then audit. */
async function adminWriter() {
  const admin = await requireAdmin();
  if (!admin) notFound();
  if (!canWriteAdmin(admin)) redirect("/admin?erreur=lecture");
  return admin;
}

async function audit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Prisma.InputJsonValue,
) {
  const requestHeaders = await headers();
  await db.auditLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      metadata,
      ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    },
  });
}

const userActionSchema = z.object({
  userId: z.string().min(1),
  back: z.string().startsWith("/admin/utilisateurs").default("/admin/utilisateurs"),
});

function withParam(path: string, key: string, value: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${key}=${value}`;
}

export async function setUserStatus(formData: FormData) {
  const admin = await adminWriter();
  const input = userActionSchema
    .extend({
      status: z.enum(["active", "suspended"]),
      reason: z.string().trim().max(500).default(""),
    })
    .safeParse(Object.fromEntries(formData));
  if (!input.success) redirect("/admin/utilisateurs");
  const { userId, status, reason, back } = input.data;
  if (userId === admin.id) redirect(withParam(back, "erreur", "soi"));
  if (status === "suspended" && !reason) redirect(withParam(back, "erreur", "motif"));
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { status } }),
    ...(status === "suspended" ? [db.session.deleteMany({ where: { userId } })] : []),
  ]);
  await audit(
    admin.id,
    status === "suspended" ? "user.suspend" : "user.unsuspend",
    "user",
    userId,
    { reason },
  );
  redirect(withParam(back, "ok", "1"));
}

export async function setUserRole(formData: FormData) {
  const admin = await adminWriter();
  const input = userActionSchema
    .extend({ role: z.enum(["user", "content_editor", "support_agent", "platform_admin"]) })
    .safeParse(Object.fromEntries(formData));
  if (!input.success) redirect("/admin/utilisateurs");
  const { userId, role, back } = input.data;
  if (userId === admin.id) redirect(withParam(back, "erreur", "soi"));
  const before = await db.user.findUnique({
    where: { id: userId },
    select: { platformRole: true },
  });
  if (!before) redirect(back);
  await db.user.update({ where: { id: userId }, data: { platformRole: role } });
  await audit(admin.id, "user.role", "user", userId, { from: before.platformRole, to: role });
  redirect(withParam(back, "ok", "1"));
}

/** "true"/"false" for a feature, a level name, or an integer (-1 = unlimited, "contract"). */
function validValue(type: string, value: string) {
  if (type === "boolean") return value === "true" || value === "false";
  if (type === "limit")
    return (/^-?\d+$/.test(value) && Number(value) >= -1) || value === "contract";
  return /^[a-z0-9_-]{1,40}$/.test(value);
}

/**
 * Plan edit (partie 05): fields and entitlement values, applied at once without redeploy.
 * `jobs.apply` stays true whatever is sent: applying is free for everyone.
 */
export async function updatePlan(formData: FormData) {
  const admin = await adminWriter();
  const code = String(formData.get("code") ?? "");
  const plan = await db.plan.findUnique({ where: { code }, include: { entitlements: true } });
  if (!plan) notFound();
  const path = `/admin/forfaits/${plan.code}`;

  const fields = z
    .object({
      name: z.string().trim().min(1).max(60),
      tagline: z.string().trim().max(200),
      price: z.string().trim(),
      sortOrder: z.coerce.number().int().min(0).max(999),
      isPublic: z.literal("on").optional(),
      isPurchasable: z.literal("on").optional(),
      recommended: z.literal("on").optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!fields.success) redirect(withParam(path, "erreur", "champs"));
  // Admin v2, étape 5: every version of a plan says why it changed.
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3 || reason.length > 1000) redirect(withParam(path, "erreur", "motif"));
  const { price } = fields.data;
  let priceCents: number | null = null;
  if (price !== "") {
    if (!/^\d+(\.\d{1,2})?$/.test(price)) redirect(withParam(path, "erreur", "prix"));
    priceCents = Math.round(Number(price) * 100);
  }

  const changes: { key: string; from: string; to: string }[] = [];
  for (const entitlement of plan.entitlements) {
    const sent = formData.get(`e:${entitlement.key}`);
    let value =
      entitlement.type === "boolean"
        ? sent === "true"
          ? "true"
          : "false"
        : String(sent ?? "").trim();
    if (entitlement.key === "jobs.apply") value = "true";
    if (sent === null && entitlement.type !== "boolean") continue;
    if (!validValue(entitlement.type, value)) {
      redirect(withParam(path, "erreur", `valeur&cle=${encodeURIComponent(entitlement.key)}`));
    }
    if (value !== entitlement.value)
      changes.push({ key: entitlement.key, from: entitlement.value, to: value });
  }

  const data = {
    name: fields.data.name,
    tagline: fields.data.tagline,
    priceCents,
    sortOrder: fields.data.sortOrder,
    isPublic: fields.data.isPublic === "on",
    isPurchasable: fields.data.isPurchasable === "on",
    recommended: fields.data.recommended === "on",
  };
  await db.$transaction([
    db.plan.update({ where: { id: plan.id }, data }),
    ...changes.map((change) =>
      db.planEntitlement.update({
        where: { planId_key: { planId: plan.id, key: change.key } },
        data: { value: change.to },
      }),
    ),
  ]);
  await audit(admin.id, "plan.update", "plan", plan.id, {
    code: plan.code,
    fields: data,
    before: {
      name: plan.name,
      tagline: plan.tagline,
      priceCents: plan.priceCents,
      sortOrder: plan.sortOrder,
      isPublic: plan.isPublic,
      isPurchasable: plan.isPurchasable,
      recommended: plan.recommended,
    },
    entitlements: changes,
    reason,
  });
  invalidate();
  updateTag("plans");
  redirect(withParam(path, "ok", "1"));
}

// ─── Moderation (partie 10 § 10.7) ────────────────────────────────────────────────

export async function moderateJob(formData: FormData) {
  const jobId = String(formData.get("job") ?? "").slice(0, 60);
  const decision = formData.get("decision");
  // Refusing or unpublishing is sensitive: the reason is required (Admin v2, étape 7).
  const reason = String(formData.get("reason") ?? "").trim();
  if (decision !== "approve" && reason.length < 3)
    redirect(
      `/admin/offres?id=${encodeURIComponent(jobId)}&action=${formData.get("panel") === "depublier" ? "depublier" : "refuser"}&erreur=motif`,
    );
  const admin = await adminWriter();
  const job =
    decision === "approve"
      ? await approveJob(db, admin.id, jobId)
      : await refuseJob(db, admin.id, jobId, reason);
  if (job) {
    updateTag("jobs");
    updateTag(`job:${job.slug}`);
    const team = await hiringTeam(db, job.organizationId);
    await notify(db, {
      userIds: team.map((member) => member.id),
      type: decision === "approve" ? "jobApproved" : "jobRejected",
      payload: { jobTitle: job.title },
      href:
        decision === "approve"
          ? `/app/hire/offres/${job.id}`
          : `/app/hire/offres/${job.id}/modifier`,
    });
  }
  redirect(
    `/admin/offres?ok=${decision === "approve" ? "approuvee" : "refusee"}&id=${encodeURIComponent(jobId)}`,
  );
}

/** New version of the matching weights (total 100), audited in the service. */
export async function saveWeightsAction(formData: FormData) {
  const input = weightsInputSchema.safeParse({
    ...Object.fromEntries(criterionKeys.map((key) => [key, Number(formData.get(key))])),
    note: formData.get("note") ?? "",
  });
  const admin = await adminWriter();
  if (!input.success) redirect("/admin/ia?onglet=poids&erreur=1#poids");
  await saveWeights(db, admin.id, input.data);
  refresh();
  redirect("/admin/ia?onglet=poids&ok=1");
}

/** Human review of a disputed score; confirming needs an answer for the talent. */
export async function resolveDisputeAction(formData: FormData) {
  const input = disputeResolutionSchema.safeParse({
    id: formData.get("id"),
    outcome: formData.get("outcome"),
    resolution: formData.get("resolution") ?? "",
  });
  const admin = await adminWriter();
  if (!input.success) redirect("/admin/ia?onglet=revisions&erreur=1");
  if (input.data.outcome === "confirmed" && !input.data.resolution) {
    redirect("/admin/ia?onglet=revisions&erreur=reponse");
  }
  await resolveDispute(db, admin.id, input.data);
  refresh();
  redirect(`/admin/ia?onglet=revisions${input.data.outcome === "in_review" ? "" : "&ok=1"}`);
}

/** A refund already made with the provider, recorded here (partie 09 § 9.2). */
export async function refundPaymentAction(formData: FormData) {
  const input = refundSchema.safeParse({
    payment: formData.get("payment"),
    reference: formData.get("reference") ?? "",
  });
  const admin = await adminWriter();
  if (!input.success) redirect("/admin/abonnements?erreur=remboursement");
  await recordRefund(db, admin.id, input.data);
  refresh();
  redirect(
    `/admin/abonnements?ok=remboursement&paiement=${encodeURIComponent(input.data.payment)}`,
  );
}

/** Verification of an organization (E8): approved or refused with a reason, owners told by e-mail. */
export async function decideVerificationAction(formData: FormData) {
  const organizationId = String(formData.get("organization") ?? "").slice(0, 60);
  const raw = {
    decision: formData.get("decision"),
    reason: String(formData.get("reason") ?? ""),
  };
  const input = verificationDecisionSchema.safeParse(raw);
  const admin = await adminWriter();
  if (!input.success) redirect(`/admin/organisations?erreur=motif#org-${organizationId}`);
  const done = await decideVerification(db, admin.id, organizationId, input.data);
  if (!done) redirect("/admin/organisations?erreur=motif");
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: {
      name: true,
      memberships: {
        where: { role: "org_owner", status: "active" },
        select: { user: { select: { email: true, firstName: true } } },
      },
    },
  });
  for (const membership of organization.memberships) {
    await mailOrgVerification(membership.user, {
      org: organization.name,
      verified: input.data.decision === "verify",
      reason: input.data.reason,
    });
  }
  updateTag("jobs");
  refresh();
  redirect(
    `/admin/organisations?ok=${input.data.decision === "verify" ? "verifiee" : "refusee"}&org=${encodeURIComponent(organization.name)}`,
  );
}

// ─── Partners (E9) ──────────────────────────────────────────────────────────────

const PARTNERS = "/admin/partenaires";

async function partnerWrite<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof PartnerError) redirect(`${PARTNERS}?erreur=${error.code}`);
    throw error;
  }
}

export async function createPartnerAction(formData: FormData) {
  const admin = await adminWriter();
  const { org, invitation } = await partnerWrite(() =>
    createPartner(db, admin.id, Object.fromEntries(formData)),
  );
  await mailPartnerInvite(invitation.email, {
    org: org.name,
    date: invitation.expiresAt,
    token: invitation.token,
  });
  redirect(`${PARTNERS}?ok=partenaire#partner-${org.id}`);
}

export async function invitePartnerManagerAction(formData: FormData) {
  const admin = await adminWriter();
  const organizationId = String(formData.get("organization") ?? "").slice(0, 60);
  const org = await db.organization.findFirst({ where: { id: organizationId, type: "partner" } });
  if (!org) notFound();
  const invitation = await partnerWrite(() =>
    inviteManager(db, admin.id, org.id, String(formData.get("email") ?? "")),
  );
  await audit(admin.id, "partner.inviteManager", "organization", org.id, {});
  await mailPartnerInvite(invitation.email, {
    org: org.name,
    date: invitation.expiresAt,
    token: invitation.token,
  });
  redirect(`${PARTNERS}?ok=invitation#partner-${org.id}`);
}

export async function createBatchAction(formData: FormData) {
  const admin = await adminWriter();
  const batch = await partnerWrite(() => createBatch(db, admin.id, Object.fromEntries(formData)));
  redirect(`${PARTNERS}?ok=lot#partner-${batch.partnerOrgId}`);
}
