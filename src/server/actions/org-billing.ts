"use server";

import { refresh } from "next/cache";
import { getFormatter, getTranslations } from "next-intl/server";
import { z } from "zod";
import { absoluteUrl } from "@/server/account-emails";
import { db } from "@/server/db";
import { invalidate } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { paymentProvider } from "@/server/payments";
import { orgPayment, scheduleOrgDowngrade } from "@/server/services/org-billing";
import { refreshPayment, startCheckout } from "@/server/services/subscriptions";

/**
 * The gestures of Formule et facturation (étape 3, A4). Order of CLAUDE.md: validate → session →
 * role → service. The owner and the administrators pay for their organization; the provider's
 * answer (webhook or status read) is the source of truth, never the browser.
 */
const PAGE = "/app/organisation/facturation";

const operators = ["mpesa", "orange", "airtel"] as const;
const code = z.string().min(1).max(60);

const paymentSchema = z.intersection(
  z.object({ planCode: code }),
  z.discriminatedUnion("method", [
    z.object({
      method: z.literal("mobile_money"),
      operator: z.enum(operators),
      number: z
        .string()
        .trim()
        .transform((value) => value.replace(/[\s.-]/g, ""))
        .pipe(z.string().regex(/^\+\d{8,15}$/)),
    }),
    z.object({ method: z.literal("card") }),
  ]),
);

export type OrgPaymentResult =
  | { ok: true; paymentId: string; status: string }
  | { ok: false; error: "number" | "duplicate" | "unavailable" };

/** « Payer » in the window of « Renouveler maintenant » or « Passer à … » (upgrade, at once). */
export async function orgStartPaymentAction(raw: unknown): Promise<OrgPaymentResult> {
  const parsed = paymentSchema.safeParse(raw);
  const { user, ctx } = await requireHire(PAGE, "administer");
  if (!parsed.success) return { ok: false, error: "number" };
  const provider = paymentProvider();
  if (!provider) return { ok: false, error: "unavailable" };
  const input = parsed.data;
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const result = await startCheckout(db, provider, {
    subject,
    planCode: input.planCode,
    method: input.method,
    payerId: user.id,
    email: user.email,
    country: user.country ?? "",
    msisdn: input.method === "mobile_money" ? input.number : undefined,
    operator: input.method === "mobile_money" ? input.operator : undefined,
    returnUrl: absoluteUrl(PAGE),
  });
  if (result.status !== "started") return { ok: false, error: result.status };
  // The provider may answer at once (cards, fake provider).
  const payment = await refreshPayment(db, provider, result.paymentId);
  invalidate(subject);
  return { ok: true, paymentId: result.paymentId, status: payment?.status ?? "pending" };
}

/** Polled while waiting: only a payment of the administrator's organization is read. */
export async function orgPaymentStatusAction(paymentId: string) {
  const { ctx } = await requireHire(PAGE, "administer");
  const payment = await orgPayment(db, ctx, String(paymentId).slice(0, 60));
  if (!payment) return null;
  const provider = paymentProvider();
  if (payment.status !== "pending" || !provider) return payment.status;
  const updated = await refreshPayment(db, provider, payment.id);
  if (updated?.status === "succeeded") invalidate({ type: "organization", id: ctx.organizationId });
  return updated?.status ?? null;
}

/** After the payment window closes on a success: every figure of the page is read again. */
export async function orgBillingRefreshAction() {
  await requireHire(PAGE, "administer");
  refresh();
}

export type OrgDowngradeResult = { ok: true; text: string } | { ok: false; text: string };

/** A cheaper plan at the end of the paid period, or (`null`) keeping the plan in force. */
export async function orgScheduleDowngradeAction(planCode: string | null) {
  const parsed = code.nullable().safeParse(planCode);
  const { ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgFormula");
  if (!parsed.success) return { ok: false, text: t("error") } satisfies OrgDowngradeResult;
  const result = await scheduleOrgDowngrade(db, ctx, parsed.data);
  if (!result) return { ok: false, text: t("error") } satisfies OrgDowngradeResult;
  refresh();
  const format = await getFormatter();
  const date = format.dateTime(result.until, { day: "numeric", month: "long" });
  return {
    ok: true,
    text: result.plan ? t("downgrade.done", { plan: result.plan, date }) : t("downgrade.canceled"),
  } satisfies OrgDowngradeResult;
}
