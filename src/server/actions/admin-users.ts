"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/server/auth";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { confirmationCallback } from "@/server/services/signup-confirmation";
import {
  addCredits,
  addCreditsSchema,
  AdminUserError,
  deleteUser,
  deleteUserSchema,
  grantPlan,
  grantPlanSchema,
  markEmailVerified,
  removeOverride,
  removeOverrideSchema,
  revokePlan,
  revokePlanSchema,
} from "@/server/services/admin-users";

/**
 * Fiche utilisateur (Admin v2, étape 3): administrators only (support agents read), every action
 * audited with its reason. Order: validate → session → role → service.
 */

const PAGE = "/admin/utilisateurs";

function backOf(formData: FormData) {
  const back = String(formData.get("back") ?? "");
  return back.startsWith(PAGE) ? back : PAGE;
}

function withParam(path: string, key: string, value: string) {
  const [base, hash] = path.split("#");
  const url = `${base}${base!.includes("?") ? "&" : "?"}${key}=${value}`;
  return hash ? `${url}#${hash}` : url;
}

/** Back to the card without the open panel (`action`, `etape`, `motif`). */
function cardOf(back: string) {
  const [path, query = ""] = back.split("?");
  const params = new URLSearchParams(query);
  for (const key of ["action", "etape", "motif", "ok", "erreur"]) params.delete(key);
  const text = params.toString();
  return text ? `${path}?${text}` : path!;
}

async function writer() {
  const admin = await requireAdmin();
  if (!admin) notFound();
  if (!canWriteAdmin(admin)) redirect("/admin?erreur=lecture");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  return { admin, context: { actorId: admin.id, ip } };
}

/** Runs a service and goes back to the card with `ok` or `erreur`. */
async function run(formData: FormData, done: string, work: () => Promise<unknown>) {
  const back = backOf(formData);
  try {
    await work();
  } catch (error) {
    if (error instanceof AdminUserError)
      redirect(withParam(back, "erreur", error.code === "notFound" ? "champs" : error.code));
    throw error;
  }
  redirect(withParam(cardOf(back), "ok", done));
}

function invalid(formData: FormData): never {
  redirect(withParam(backOf(formData), "erreur", "champs"));
}

const userOnly = z.object({ userId: z.string().min(1) });

async function target(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, status: true },
  });
  if (!user || user.status === "deleted") notFound();
  return user;
}

/** « Renvoyer l'e-mail de vérification »: a new confirmation link to the account's address. */
export async function resendVerificationAction(formData: FormData) {
  const { context } = await writer();
  const input = userOnly.safeParse(Object.fromEntries(formData));
  if (!input.success) invalid(formData);
  const user = await target(input.data.userId);
  await run(formData, "codeSent", async () => {
    try {
      // Without the administrator's session: Better Auth would refuse another person's address.
      await auth.api.sendVerificationEmail({
        body: { email: user.email, callbackURL: confirmationCallback() },
      });
    } catch {
      throw new AdminUserError("confirm");
    }
    await db.auditLog.create({
      data: { ...context, action: "user.email.resend", targetType: "user", targetId: user.id },
    });
  });
}

/** « Envoyer un lien de réinitialisation du mot de passe ». */
export async function sendResetLinkAction(formData: FormData) {
  const { context } = await writer();
  const input = userOnly.safeParse(Object.fromEntries(formData));
  if (!input.success) invalid(formData);
  const user = await target(input.data.userId);
  await run(formData, "resetSent", async () => {
    try {
      await auth.api.requestPasswordReset({
        headers: await headers(),
        body: { email: user.email, redirectTo: "/reinitialiser" },
      });
    } catch {
      throw new AdminUserError("confirm");
    }
    await db.auditLog.create({
      data: { ...context, action: "user.password.reset", targetType: "user", targetId: user.id },
    });
  });
}

export async function verifyEmailAction(formData: FormData) {
  const { context } = await writer();
  const input = userOnly
    .extend({ reason: z.string().trim().min(3).max(500) })
    .safeParse(Object.fromEntries(formData));
  if (!input.success) redirect(withParam(backOf(formData), "erreur", "motif"));
  await run(formData, "verified", () =>
    markEmailVerified(db, context, input.data.userId, input.data.reason),
  );
}

export async function grantPlanAction(formData: FormData) {
  const { context } = await writer();
  const input = grantPlanSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) invalid(formData);
  await run(formData, "planGranted", () => grantPlan(db, context, input.data));
}

export async function revokePlanAction(formData: FormData) {
  const { context } = await writer();
  const input = revokePlanSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) invalid(formData);
  await run(formData, "planRevoked", () => revokePlan(db, context, input.data));
}

export async function addCreditsAction(formData: FormData) {
  const { context } = await writer();
  const input = addCreditsSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) invalid(formData);
  await run(formData, "creditsAdded", () => addCredits(db, context, input.data));
}

export async function removeOverrideAction(formData: FormData) {
  const { context } = await writer();
  const input = removeOverrideSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) invalid(formData);
  await run(formData, "overrideRemoved", () => removeOverride(db, context, input.data));
}

/** Second step of « Supprimer le compte »: reason given at step one, e-mail typed to confirm. */
export async function deleteUserAction(formData: FormData) {
  const { context } = await writer();
  const input = deleteUserSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) invalid(formData);
  await run(formData, "deleted", () => deleteUser(db, context, input.data));
}
