"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { invalidate } from "@/server/entitlements";
import type { Prisma } from "@/generated/prisma/client";
import { approveJob, refuseJob, resolveReport } from "@/server/services/moderation";
import { hiringTeam, notify } from "@/server/services/notifications";

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
  });
  invalidate();
  updateTag("plans");
  redirect(withParam(path, "ok", "1"));
}

// ─── Moderation (partie 10 § 10.7) ────────────────────────────────────────────────

export async function moderateJob(formData: FormData) {
  const admin = await adminWriter();
  const jobId = String(formData.get("job") ?? "");
  const decision = formData.get("decision");
  const job =
    decision === "approve"
      ? await approveJob(db, admin.id, jobId)
      : await refuseJob(db, admin.id, jobId, String(formData.get("reason") ?? ""));
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
  redirect(`/admin/offres?ok=${decision === "approve" ? "approuvee" : "refusee"}`);
}

export async function resolveReportAction(formData: FormData) {
  const admin = await adminWriter();
  const action = formData.get("action") === "hide" ? "hide" : "dismiss";
  await resolveReport(db, admin.id, String(formData.get("report") ?? ""), action);
  updateTag("jobs");
  redirect("/admin/signalements?ok=1");
}
