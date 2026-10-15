"use server";

/**
 * Jumanly Partners actions (E9). Partner side: session, then partner membership, then the service
 * (which checks the batch belongs to the partner). Beneficiary side: session, rate limit, then
 * activation. Order of partie 03: validate → session → role → service.
 */
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/dates";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { mailLicenseActivated, mailLicenseInvite } from "@/server/partner-emails";
import { requirePartner } from "@/server/partner-context";
import { allowAttempt, clientIp } from "@/server/rate-limit";
import { once } from "@/server/services/billing-jobs";
import { notify } from "@/server/services/notifications";
import {
  activateLicense,
  answerOutcomeConsent,
  createLink,
  disableLink,
  generateCodes,
  inviteByEmail,
  licenseEnd,
  lowBatchAlert,
  PartnerError,
  pendingInvitations,
  revokeCode,
} from "@/server/services/partners";

const LICENSES = "/app/partenaire/licences";
const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);

function back(batchId: string, section: string, params: Record<string, string | number>): never {
  const query = new URLSearchParams({ lot: batchId });
  for (const [key, value] of Object.entries(params)) query.set(key, String(value));
  redirect(`${LICENSES}?${query}#${section}`);
}

/** Runs a partner service call; a PartnerError comes back as `erreur=<code>` on the page. */
async function guarded<T>(batchId: string, section: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof PartnerError)
      back(batchId, section, { erreur: error.code, ...error.values });
    throw error;
  }
}

export async function generateCodesAction(formData: FormData) {
  const { ctx } = await requirePartner(LICENSES);
  const batchId = id(formData.get("batchId"));
  const count = await guarded(batchId, "codes", () =>
    generateCodes(db, ctx, Object.fromEntries(formData)),
  );
  back(batchId, "codes", { ok: "codes", n: count });
}

export async function revokeCodeAction(formData: FormData) {
  const { ctx } = await requirePartner(LICENSES);
  const batchId = id(formData.get("batchId"));
  await guarded(batchId, "codes", () => revokeCode(db, ctx, id(formData.get("id"))));
  back(batchId, "codes", { ok: "revoque" });
}

export async function createLinkAction(formData: FormData) {
  const { ctx } = await requirePartner(LICENSES);
  const batchId = id(formData.get("batchId"));
  await guarded(batchId, "lien", () => createLink(db, ctx, Object.fromEntries(formData)));
  back(batchId, "lien", { ok: "lien" });
}

export async function disableLinkAction(formData: FormData) {
  const { ctx } = await requirePartner(LICENSES);
  const batchId = id(formData.get("batchId"));
  await guarded(batchId, "lien", () => disableLink(db, ctx, id(formData.get("id"))));
  back(batchId, "lien", { ok: "lienOff" });
}

async function sendInvitations(
  batchId: string,
  invitations: { email: string; firstName: string | null; code: string }[],
) {
  const batch = await db.licenseBatch.findUniqueOrThrow({
    where: { id: batchId },
    include: { partnerOrg: { select: { name: true } }, plan: { select: { name: true } } },
  });
  const endDate = formatDate(licenseEnd(new Date(), batch.months, batch.endsAt));
  for (const invitation of invitations) {
    await mailLicenseInvite(invitation.email, {
      firstName: invitation.firstName,
      sponsorName: batch.partnerOrg.name,
      plan: batch.plan.name,
      endDate,
      code: invitation.code,
    });
  }
}

export async function inviteEmailsAction(formData: FormData) {
  const { ctx } = await requirePartner(LICENSES);
  const batchId = id(formData.get("batchId"));
  const file = formData.get("file");
  const uploaded =
    file instanceof File && file.size > 0 && file.size <= 1_000_000 ? await file.text() : "";
  const typed = String(formData.get("emails") ?? "").slice(0, 100_000);
  const outcome = await guarded(batchId, "import", () =>
    inviteByEmail(db, ctx, {
      batchId,
      text: [uploaded, typed].filter(Boolean).join("\n"),
      consent: formData.get("consent") === "on",
    }),
  );
  await sendInvitations(batchId, outcome.invitations);
  back(batchId, "import", {
    ok: "invitations",
    sent: outcome.invitations.length,
    valides: outcome.valid,
    invalid: outcome.invalid,
    doublons: outcome.duplicates,
    deja: outcome.alreadyInvited,
  });
}

export async function resendInvitationsAction(formData: FormData) {
  const { ctx } = await requirePartner(LICENSES);
  const batchId = id(formData.get("batchId"));
  const invitations = await guarded(batchId, "import", () => pendingInvitations(db, ctx, batchId));
  await sendInvitations(batchId, invitations);
  back(batchId, "import", { ok: "relance", n: invitations.length });
}

// ─── Beneficiary ───────────────────────────────────────────────────────────────

export async function activateLicenseAction(formData: FormData) {
  const code = String(formData.get("code") ?? "").slice(0, 40);
  const token = String(formData.get("lien") ?? "").slice(0, 64);
  const query = new URLSearchParams(token ? { lien: token } : { code });
  const user = await requireUser(`/activer?${query}`);
  const allowed = await allowAttempt("activate", `${user.id}:${(await clientIp()) ?? ""}`);
  if (!allowed) redirect(`/activer?${query}&erreur=tooManyAttempts`);

  const result = await activateLicense(db, user, token ? { token } : { code });
  if (!result.ok) {
    if (result.startDate) query.set("debut", result.startDate.toISOString().slice(0, 10));
    if (result.maskedEmail) query.set("adresse", result.maskedEmail);
    query.set("erreur", result.error);
    redirect(`/activer?${query}`);
  }

  const pending = result.status === "pending";
  await notify(db, {
    userIds: [user.id],
    type: pending ? "licenseOnHold" : "licenseActivated",
    payload: {
      plan: pending ? (result.currentPlan ?? "") : result.planName,
      licensePlan: result.planName,
      sponsorName: result.sponsorName,
      date: formatDate(pending ? result.startDate : result.endDate),
    },
    href: "/app/abonnement",
  });
  await mailLicenseActivated(user, {
    sponsorName: result.sponsorName,
    plan: result.planName,
    date: result.endDate,
    onHold: pending,
  });

  const license = await db.license.findUniqueOrThrow({
    where: { id: result.licenseId },
    select: { batchId: true },
  });
  const low = await lowBatchAlert(db, license.batchId);
  if (low) {
    await once(db, `licensesLow:${low.batch.id}:${low.available}`, () =>
      notify(db, {
        userIds: low.managerIds,
        type: "licensesLow",
        payload: { count: low.available, batchName: low.batch.name },
        href: `${LICENSES}?lot=${low.batch.id}`,
      }),
    );
  }
  redirect(`/app/abonnement?licence=${result.licenseId}`);
}

export async function outcomeConsentAction(formData: FormData) {
  const user = await requireUser("/app/abonnement");
  const licenseId = id(formData.get("licenseId"));
  await answerOutcomeConsent(db, user.id, licenseId, formData.get("answer") === "accept");
  redirect(`/app/abonnement?consentement=1#licence-${licenseId}`);
}
