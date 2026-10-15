"use server";

import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { notFound, redirect } from "next/navigation";
import type { ZodType } from "zod";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { sendSubscriptionChanged } from "@/server/billing-emails";
import { db } from "@/server/db";
import { reportError } from "@/server/observability";
import {
  AdminBillingError,
  cancelSchema,
  cancelSubscription,
  changePlanSchema,
  changeSubscriptionPlan,
  createPlan,
  deletePlan,
  duplicatePlan,
  duplicatePlanSchema,
  extendSchema,
  extendSubscription,
  manualPaymentSchema,
  newPlanSchema,
  planReasonSchema,
  recordManualPayment,
  withdrawPlan,
} from "@/server/services/admin-billing";
import { billingRecipients } from "@/server/services/billing-events";

/**
 * Forfaits et abonnements (Admin v2, étape 5): administrators only (support agents read), a
 * reason each time, recorded in the journal; the holder is told by e-mail. Order: validate →
 * session → role → service.
 */

const PLANS = "/admin/forfaits";
const SUBSCRIPTIONS = "/admin/abonnements";

function backOf(formData: FormData, page: string) {
  const back = String(formData.get("back") ?? "");
  return back.startsWith(page) ? back : page;
}

function withParam(path: string, key: string, value: string) {
  const [base, hash] = path.split("#");
  const url = `${base}${base!.includes("?") ? "&" : "?"}${key}=${value}`;
  return hash ? `${url}#${hash}` : url;
}

/** Back to the card without the open panel. */
function cardOf(back: string) {
  const [path, query = ""] = back.split("?");
  const params = new URLSearchParams(query);
  for (const key of ["action", "ok", "erreur"]) params.delete(key);
  const text = params.toString();
  return text ? `${path}?${text}` : path!;
}

async function writer() {
  const admin = await requireAdmin();
  if (!admin) notFound();
  if (!canWriteAdmin(admin)) redirect("/admin?erreur=lecture");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  return { actorId: admin.id, ip };
}

function parse<T>(schema: ZodType<T>, formData: FormData, back: string): T {
  const input = schema.safeParse(Object.fromEntries(formData));
  if (!input.success) {
    const reason = input.error.issues.some((issue) => issue.path[0] === "reason");
    redirect(withParam(back, "erreur", reason ? "motif" : "champs"));
  }
  return input.data;
}

/** Runs a service; a known refusal goes back to the form with its code. */
async function attempt<T>(back: string, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof AdminBillingError) redirect(withParam(back, "erreur", error.code));
    throw error;
  }
}

// ─── Plans ─────────────────────────────────────────────────────────────────────

export async function createPlanAction(formData: FormData) {
  const context = await writer();
  const back = backOf(formData, PLANS);
  const input = parse(newPlanSchema, formData, back);
  const plan = await attempt(back, () => createPlan(db, context, input));
  updateTag("plans");
  redirect(`${PLANS}/${plan.code}?ok=cree`);
}

export async function duplicatePlanAction(formData: FormData) {
  const context = await writer();
  const back = backOf(formData, PLANS);
  const input = parse(duplicatePlanSchema, formData, back);
  const plan = await attempt(back, () => duplicatePlan(db, context, input));
  updateTag("plans");
  redirect(`${PLANS}/${plan.code}?ok=copie`);
}

export async function withdrawPlanAction(formData: FormData) {
  const context = await writer();
  const back = backOf(formData, PLANS);
  const input = parse(planReasonSchema, formData, back);
  await attempt(back, () => withdrawPlan(db, context, input));
  updateTag("plans");
  redirect(withParam(cardOf(back), "ok", "retire"));
}

export async function deletePlanAction(formData: FormData) {
  const context = await writer();
  const back = backOf(formData, PLANS);
  const input = parse(planReasonSchema, formData, back);
  const plan = await attempt(back, () => deletePlan(db, context, input));
  updateTag("plans");
  redirect(`${PLANS}?famille=${plan.family}&ok=supprime`);
}

// ─── Subscriptions ─────────────────────────────────────────────────────────────

async function tell(
  subscription: { subjectType: "user" | "organization"; subjectId: string },
  kind: Parameters<typeof sendSubscriptionChanged>[1],
  input: Parameters<typeof sendSubscriptionChanged>[2],
) {
  const recipients = await billingRecipients(db, subscription.subjectType, subscription.subjectId);
  for (const person of recipients) {
    await sendSubscriptionChanged(person, kind, input).catch((error) =>
      reportError(error, { message: "E-mail d'abonnement non envoyé" }),
    );
  }
}

export async function extendSubscriptionAction(formData: FormData) {
  const context = await writer();
  const back = backOf(formData, SUBSCRIPTIONS);
  const input = parse(extendSchema, formData, back);
  const updated = await attempt(back, () => extendSubscription(db, context, input));
  await tell(updated, "extended", {
    plan: updated.plan.name,
    date: updated.currentPeriodEnd,
    reason: input.reason,
  });
  redirect(withParam(cardOf(back), "ok", "prolonge"));
}

export async function changeSubscriptionPlanAction(formData: FormData) {
  const context = await writer();
  const back = backOf(formData, SUBSCRIPTIONS);
  const input = parse(changePlanSchema, formData, back);
  const { subscription, plan, previous } = await attempt(back, () =>
    changeSubscriptionPlan(db, context, input),
  );
  await tell(subscription, input.when === "now" ? "planNow" : "planTerm", {
    plan: previous.name,
    newPlan: plan.name,
    date: subscription.currentPeriodEnd,
    reason: input.reason,
  });
  redirect(withParam(cardOf(back), "ok", input.when === "now" ? "forfait" : "forfaitEcheance"));
}

export async function cancelSubscriptionAction(formData: FormData) {
  const context = await writer();
  const back = backOf(formData, SUBSCRIPTIONS);
  const input = parse(cancelSchema, formData, back);
  const subscription = await attempt(back, () => cancelSubscription(db, context, input));
  await tell(subscription, input.when === "now" ? "cancelNow" : "cancelTerm", {
    plan: subscription.plan.name,
    date: input.when === "now" ? new Date() : subscription.currentPeriodEnd,
    reason: input.reason,
  });
  redirect(withParam(cardOf(back), "ok", input.when === "now" ? "resilie" : "resilieEcheance"));
}

/** The receipt and the invoice leave with the payment (`paymentSucceeded`). */
export async function recordManualPaymentAction(formData: FormData) {
  const context = await writer();
  const back = backOf(formData, SUBSCRIPTIONS);
  const input = parse(manualPaymentSchema, formData, back);
  const payment = await attempt(back, () => recordManualPayment(db, context, input));
  // The holder's subscription may be a new one: the card follows it.
  const target = payment.subscriptionId
    ? `${SUBSCRIPTIONS}?abonnement=${payment.subscriptionId}`
    : cardOf(back);
  redirect(withParam(target, "ok", "paiement"));
}
