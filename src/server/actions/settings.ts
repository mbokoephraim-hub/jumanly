"use server";

import { APIError, createEmailVerificationToken } from "better-auth/api";
import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { passwordProblem, VERIFY_LINK_HOURS } from "@/lib/password";
import { sendEmailChangeLink, sendPasswordChanged } from "@/server/account-emails";
import { emailDeliveryAvailable } from "@/server/adapters/email";
import { auth } from "@/server/auth";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { SPACE_COOKIE } from "@/server/hire-context";
import {
  AccountDeletionError,
  eraseAccount,
  ownedOrganizations,
} from "@/server/services/account-deletion";
import { mutedAfter, NOTIFICATION_CATEGORIES } from "@/server/services/notifications";

/**
 * Where each part of the settings lives (planche talent-4 § 8): the list, then one page per
 * section; the account deletion is a sheet of the list. An organization's member is sent from
 * these pages to its own settings page (`?onglet=`), kept until its redesign.
 */
const sectionPaths: Record<string, string> = {
  compte: "/app/parametres",
  securite: "/app/parametres/securite",
  confidentialite: "/app/parametres/confidentialite",
  notifications: "/app/parametres/notifications",
  donnees: "/app/parametres",
};

function back(tab: string, params: Record<string, string>): never {
  const query = new URLSearchParams(tab === "donnees" ? { supprimer: "1", ...params } : params);
  // The answer may come back to the same address: the page must render again.
  refresh();
  redirect(`${sectionPaths[tab] ?? "/app/parametres"}?${query}`);
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

/**
 * « Changer d'adresse » (Ephraïm, 27/10/2026): a link goes to the new address; the account's
 * address changes once it is opened. An address already used answers the same way (nothing leaks).
 * The link is the one of Better Auth's change of address (verify-email, change-email-verification),
 * but it is sent here rather than through `auth.api.changeEmail`, which hides a failed sending and
 * answered « Lien envoyé » when nothing left (Ephraïm, 27/10/2026).
 */
export async function changeEmailAction(
  raw: string,
): Promise<
  { ok: true; email: string } | { ok: false; error: "invalid" | "same" | "failed" | "unavailable" }
> {
  const parsed = z
    .email()
    .max(254)
    .safeParse(
      String(raw ?? "")
        .trim()
        .toLowerCase(),
    );
  const user = await requireUser("/app/parametres");
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (parsed.data === user.email.toLowerCase()) return { ok: false, error: "same" };
  if (!emailDeliveryAvailable()) return { ok: false, error: "unavailable" };
  if (await db.user.findUnique({ where: { email: parsed.data }, select: { id: true } }))
    return { ok: true, email: parsed.data };
  try {
    const context = await auth.$context;
    const token = await createEmailVerificationToken(
      context.secret,
      user.email,
      parsed.data,
      VERIFY_LINK_HOURS * 60 * 60,
      { requestType: "change-email-verification" },
    );
    const callbackURL = encodeURIComponent("/app/parametres?adresse=changee");
    const url = `${context.baseURL}/verify-email?token=${token}&callbackURL=${callbackURL}`;
    await sendEmailChangeLink(parsed.data, url, user.firstName);
  } catch (error) {
    console.error("[e-mail] Changement d'adresse : le lien n'est pas parti.", error);
    return { ok: false, error: "failed" };
  }
  return { ok: true, email: parsed.data };
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
 * « Supprimer mon compte » (Ephraïm, 22/10/2026): at once and for good, no grace period. Everything
 * of the person is erased; the same e-mail can sign up again as a new account.
 */
export async function deleteAccount(formData: FormData) {
  const user = await requireUser("/app/parametres");
  if (
    String(formData.get("confirm") ?? "")
      .trim()
      .toUpperCase() !== "SUPPRIMER"
  ) {
    back("donnees", { erreur: "confirm" });
  }
  if ((await ownedOrganizations(db, user.id)).blocking) back("donnees", { erreur: "owner" });
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
  try {
    await eraseAccount(db, user.id);
  } catch (error) {
    if (error instanceof AccountDeletionError) back("donnees", { erreur: "owner" });
    throw error;
  }
  const jar = await cookies();
  for (const cookie of jar.getAll()) {
    if (cookie.name.includes("better-auth") || cookie.name === SPACE_COOKIE)
      jar.delete(cookie.name);
  }
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

const notificationsSchema = z.object({
  categories: z.array(z.enum(NOTIFICATION_CATEGORIES as [string, ...string[]])),
  emails: z.enum(["1", "0"]),
  newsletter: z.literal("on").optional(),
});

/** Paramètres › Notifications: the categories kept on, the e-mail reminders, the news. */
export async function updateNotifications(formData: FormData) {
  const user = await requireUser("/app/parametres/notifications");
  const parsed = notificationsSchema.safeParse({
    categories: formData.getAll("category").map(String),
    emails: formData.get("emails") ?? "1",
    newsletter: formData.get("newsletter") ?? undefined,
  });
  if (!parsed.success) back("notifications", { erreur: "required" });
  const kept = new Set(parsed.data.categories);
  await db.user.update({
    where: { id: user.id },
    data: {
      notificationsMuted: mutedAfter(user.notificationsMuted, NOTIFICATION_CATEGORIES, kept),
      notificationEmails: parsed.data.emails === "1",
      newsletter: parsed.data.newsletter === "on",
    },
  });
  back("notifications", { ok: "1" });
}

const appearanceSchema = z.object({ appearance: z.enum(["auto", "light", "dark"]) });

/**
 * Apparence Auto, Clair ou Sombre (docs/refonte-mobile, brief § 2.10): kept on the account. The
 * switch on Compte changes the page at once; without JavaScript the form posts and the page comes
 * back in the chosen appearance.
 */
export async function updateAppearance(formData: FormData) {
  const parsed = appearanceSchema.safeParse(Object.fromEntries(formData));
  const user = await requireUser("/app/compte");
  if (!parsed.success) return;
  await db.user.update({
    where: { id: user.id },
    data: { appearance: parsed.data.appearance },
  });
  // The shell (layout) carries the appearance: it must render again, not only the page.
  refresh();
}
