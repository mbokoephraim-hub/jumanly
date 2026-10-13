"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { formatUsd } from "@/lib/money";
import { sendPaymentReceipt } from "@/server/account-emails";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { paymentProvider } from "@/server/payments";
import { billingSubject } from "@/server/services/accounts";
import { refreshPayment, startCheckout, startTrial } from "@/server/services/subscriptions";
import { absoluteUrl } from "@/server/account-emails";

export type CheckoutFormState = {
  status: "idle" | "invalid" | "error";
  errors?: Record<string, string>;
  /** Text key under `checkout`. */
  error?: string;
  values?: Record<string, string>;
};

const contexts = ["signup", "billing"] as const;
type CheckoutContext = (typeof contexts)[number];

/** Where the checkout lives: sign-up step 5, or « Mon abonnement ». */
function checkoutPath(context: CheckoutContext, planCode: string, paymentId?: string) {
  const params = new URLSearchParams();
  if (context === "billing") params.set("forfait", planCode);
  if (paymentId) params.set("paiement", paymentId);
  const base = context === "signup" ? "/inscription/paiement" : "/app/abonnement/payer";
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

const checkoutSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("mobile_money"),
    plan: z.string().min(1).max(60),
    context: z.enum(contexts),
    operator: z.string().min(1, "operatorRequired").max(30),
    number: z
      .string()
      .trim()
      .min(1, "numberRequired")
      .transform((value) => value.replace(/[\s.-]/g, ""))
      .pipe(z.string().regex(/^\+?\d{8,15}$/, "numberInvalid")),
  }),
  z.object({
    method: z.literal("card"),
    plan: z.string().min(1).max(60),
    context: z.enum(contexts),
  }),
]);

async function sendReceiptIfPaid(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { plan: true },
  });
  if (!payment || payment.status !== "succeeded") return;
  const user = await requireUser();
  const t = await getTranslations("checkout.method");
  await sendPaymentReceipt(user.email, {
    firstName: user.firstName,
    plan: payment.plan.name,
    amount: formatUsd(payment.amountCents),
    method: payment.method === "card" ? t("card.text") : t("mobileMoney.text"),
    startDate: payment.periodStart,
    endDate: payment.periodEnd,
  }).catch((error) => console.error("Reçu non envoyé", error));
}

/** Order (CLAUDE.md): validate → session → who pays → service. */
export async function startPayment(
  _: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const values = Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, String(value)]),
  );
  const parsed = checkoutSchema.safeParse(values);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { status: "invalid", errors, values };
  }
  const input = parsed.data;
  const user = await requireUser();
  const plan = await db.plan.findUnique({ where: { code: input.plan } });
  const subject = plan ? await billingSubject(db, user.id, plan.family) : null;
  const provider = paymentProvider();
  if (!plan || !subject || !provider) return { status: "error", error: "failed.text", values };

  const result = await startCheckout(db, provider, {
    subject,
    planCode: plan.code,
    method: input.method,
    email: user.email,
    country: user.country ?? "",
    msisdn: input.method === "mobile_money" ? input.number : undefined,
    operator: input.method === "mobile_money" ? input.operator : undefined,
    returnUrl: absoluteUrl(checkoutPath(input.context, plan.code)),
  });
  if (result.status === "duplicate") return { status: "error", error: "duplicate", values };
  if (result.status === "unavailable") return { status: "error", error: "failed.text", values };
  // The provider may answer at once (cards, fake provider): check before showing the wait screen.
  await refreshPayment(db, provider, result.paymentId);
  await sendReceiptIfPaid(result.paymentId);
  redirect(checkoutPath(input.context, plan.code, result.paymentId));
}

/** Polled by the waiting screen; the provider's answer is the source of truth. */
export async function checkPayment(paymentId: string) {
  const user = await requireUser();
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  const provider = paymentProvider();
  if (!payment || !provider || payment.status !== "pending") return payment?.status ?? null;
  const subject = await billingSubject(
    db,
    user.id,
    payment.subjectType === "user" ? "talent" : "rh",
  );
  if (subject?.id !== payment.subjectId) return null;
  const updated = await refreshPayment(db, provider, paymentId);
  if (updated?.status === "succeeded") await sendReceiptIfPaid(paymentId);
  return updated?.status ?? null;
}

/** Before online payment exists in an environment: the paid plan starts as a trial. */
export async function startTrialAction(formData: FormData) {
  const planCode = String(formData.get("plan") ?? "");
  const context = contexts.find((value) => value === formData.get("context")) ?? "billing";
  const user = await requireUser();
  const plan = await db.plan.findUnique({ where: { code: planCode } });
  const subject = plan ? await billingSubject(db, user.id, plan.family) : null;
  if (plan && subject) await startTrial(db, subject, plan.code);
  redirect(`${checkoutPath(context, planCode)}${context === "signup" ? "?" : "&"}essai=1`);
}
