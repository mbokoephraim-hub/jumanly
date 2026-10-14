"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DELETION_GRACE_DAYS, passwordProblem } from "@/lib/password";
import { sendPasswordChanged } from "@/server/account-emails";
import { auth } from "@/server/auth";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { ownedOrganization } from "@/server/services/accounts";

function back(tab: string, params: Record<string, string>): never {
  redirect(`/app/parametres?${new URLSearchParams({ onglet: tab, ...params })}`);
}

const nameField = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[\p{L}\p{M}' .-]+$/u);

const accountSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  country: z.string().trim().length(2),
  city: z.string().trim().min(1).max(120),
});

export async function updateAccount(formData: FormData) {
  const user = await requireUser("/app/parametres");
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) back("compte", { erreur: "required" });
  const input = parsed.data;
  await db.user.update({
    where: { id: user.id },
    data: { ...input, name: `${input.firstName} ${input.lastName}` },
  });
  back("compte", { ok: "1" });
}

export async function changePassword(formData: FormData) {
  const user = await requireUser("/app/parametres");
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const problem = passwordProblem(next);
  if (problem) back("securite", { erreur: problem });
  if (next !== confirm) back("securite", { erreur: "passwordMismatch" });
  if (next === current) back("securite", { erreur: "passwordSameAsOld" });
  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: { currentPassword: current, newPassword: next, revokeOtherSessions: true },
    });
  } catch (error) {
    const code =
      error instanceof APIError ? ((error.body as { code?: string } | undefined)?.code ?? "") : "";
    back("securite", {
      erreur: code.includes("PASSWORD_COMPROMISED") ? "passwordCommon" : "wrongPassword",
    });
  }
  await sendPasswordChanged(user.email, user.firstName, new Date()).catch(() => undefined);
  back("securite", { ok: "password" });
}

export async function revokeSession(formData: FormData) {
  await requireUser("/app/parametres");
  const token = String(formData.get("token") ?? "");
  await auth.api
    .revokeSession({ headers: await headers(), body: { token } })
    .catch(() => undefined);
  back("securite", { ok: "session" });
}

export async function revokeOtherSessions() {
  await requireUser("/app/parametres");
  await auth.api.revokeOtherSessions({ headers: await headers() }).catch(() => undefined);
  back("securite", { ok: "session" });
}

/** Two-step verification by e-mail code (required for platform administrators). */
export async function setTwoFactor(formData: FormData) {
  await requireUser("/app/parametres");
  const password = String(formData.get("password") ?? "");
  const enable = formData.get("enable") === "1";
  try {
    if (enable) {
      await auth.api.enableTwoFactor({ headers: await headers(), body: { password } });
    } else {
      await auth.api.disableTwoFactor({ headers: await headers(), body: { password } });
    }
  } catch {
    back("securite", { erreur: "wrongPassword" });
  }
  back("securite", { ok: "2fa" });
}

const privacySchema = z.object({
  visibility: z.enum(["private", "recruiters", "anonymous"]),
  ai: z.literal("on").optional(),
  matching: z.literal("on").optional(),
  newsletter: z.literal("on").optional(),
  contactRequests: z.literal("on").optional(),
});

export async function updatePrivacy(formData: FormData) {
  const user = await requireUser("/app/parametres");
  const parsed = privacySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) back("confidentialite", { erreur: "required" });
  const input = parsed.data;
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        aiConsentAt: input.ai ? (user.aiConsentAt ?? new Date()) : null,
        newsletter: input.newsletter === "on",
      },
    }),
    db.talentProfile.upsert({
      where: { userId: user.id },
      update: {
        visibility: input.visibility,
        matchingEnabled: input.matching === "on",
        acceptsContactRequests: input.contactRequests === "on",
      },
      create: {
        userId: user.id,
        visibility: input.visibility,
        matchingEnabled: input.matching === "on",
        acceptsContactRequests: input.contactRequests === "on",
      },
    }),
  ]);
  back("confidentialite", { ok: "1" });
}

/**
 * Deletion request: effective after DELETION_GRACE_DAYS unless the person signs in again
 * (the session hook cancels it). An organization owner must hand over the organization first.
 */
export async function scheduleDeletion(formData: FormData) {
  const user = await requireUser("/app/parametres");
  if (
    String(formData.get("confirm") ?? "")
      .trim()
      .toUpperCase() !== "SUPPRIMER"
  ) {
    back("donnees", { erreur: "confirm" });
  }
  if (await ownedOrganization(db, user.id)) back("donnees", { erreur: "owner" });
  const account = await db.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
    select: { password: true },
  });
  if (account?.password) {
    const context = await auth.$context;
    const valid = await context.password.verify({
      hash: account.password,
      password: String(formData.get("password") ?? ""),
    });
    if (!valid) back("donnees", { erreur: "wrongPassword" });
  }
  await db.user.update({
    where: { id: user.id },
    data: { deletionScheduledAt: new Date(Date.now() + DELETION_GRACE_DAYS * 86_400_000) },
  });
  await db.session.deleteMany({ where: { userId: user.id } });
  redirect("/connexion?suppression=1");
}

/** « Réduire les animations » (docs/experience-animee § 0.4): kept on the account. */
export async function updateDisplay(formData: FormData) {
  const user = await requireUser("/app/parametres");
  await db.user.update({
    where: { id: user.id },
    data: { reduceMotion: formData.get("reduceMotion") === "on" },
  });
  back("compte", { ok: "1" });
}
