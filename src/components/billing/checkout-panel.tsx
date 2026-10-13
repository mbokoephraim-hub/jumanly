import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Alert, Button, ButtonLink } from "@/components/ui";
import { pickMessages } from "@/i18n/client-messages";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { startTrialAction } from "@/server/actions/checkout";
import type { CurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { addMonths } from "@/server/entitlements/periods";
import { paymentProvider } from "@/server/payments";
import { billingSubject } from "@/server/services/accounts";
import { liveSubscription, purchasablePlan, TRIAL_DAYS } from "@/server/services/subscriptions";
import { CheckoutForm, PaymentPoller } from "./checkout-form";

/**
 * Paying for a plan (partie 09 § 9.3): summary, method, then the provider's answer. Used by
 * sign-up step 5 and by « Mon abonnement ». Paying is never required to use the account.
 */
export async function CheckoutPanel({
  user,
  planCode,
  context,
  paymentId,
  trial,
  continueHref,
  freeHref,
}: {
  user: CurrentUser;
  planCode: string;
  context: "signup" | "billing";
  paymentId?: string;
  trial?: boolean;
  continueHref: string;
  freeHref: string;
}) {
  const t = await getTranslations();
  const plan = await db.plan.findUnique({ where: { code: planCode } });
  const subject = plan ? await billingSubject(db, user.id, plan.family) : null;
  const buyable = subject && plan ? await purchasablePlan(db, subject, plan.code) : null;
  if (!plan || !subject || !buyable) {
    return (
      <Alert
        tone="warning"
        title={t("billing.change.unavailable")}
        action={<ButtonLink href={freeHref}>{t("checkout.failed.keepFree")}</ButtonLink>}
      />
    );
  }
  const now = new Date();
  const timeZone = undefined;

  if (trial) {
    const current = await liveSubscription(db, subject, now);
    if (current?.status === "trialing") {
      return (
        <Alert
          tone="success"
          title={t("signup.payment.trial.title", { plan: plan.name })}
          action={<ButtonLink href={continueHref}>{t("signup.payment.trial.cta")}</ButtonLink>}
        >
          {t("signup.payment.trial.text", {
            plan: plan.name,
            endDate: formatDate(current.currentPeriodEnd, timeZone),
          })}
        </Alert>
      );
    }
  }

  if (paymentId) {
    const payment = await db.payment.findFirst({
      where: { id: paymentId, subjectType: subject.type, subjectId: subject.id },
    });
    if (payment) {
      const operator = payment.operator
        ? t(`checkout.mm.operators.${payment.operator}` as "checkout.mm.operators.mpesa")
        : "";
      if (payment.status === "succeeded") {
        return (
          <Alert
            tone="success"
            title={t("checkout.success.title")}
            action={<ButtonLink href={continueHref}>{t("checkout.success.cta")}</ButtonLink>}
          >
            <p>
              {t("checkout.success.text", {
                plan: plan.name,
                endDate: formatDate(payment.periodEnd, timeZone),
                email: user.email,
              })}
            </p>
            <p className="text-ardoise text-caption">
              {t("checkout.success.reference", { reference: payment.providerRef })}
            </p>
          </Alert>
        );
      }
      if (payment.status === "pending") {
        return (
          <div className="flex flex-col gap-4 rounded-card bg-blanc p-6">
            <h2 className="text-h2">{t("checkout.mm.waiting.title")}</h2>
            <p>
              {t("checkout.mm.waiting.text", {
                localAmount: formatUsd(payment.amountCents),
                localCurrency: "USD",
                maskedNumber: payment.msisdnMasked ?? "",
                operator,
              })}
            </p>
            <ol className="list-decimal pl-5 text-[15px]">
              <li>{t("checkout.mm.waiting.step1")}</li>
              <li>{t("checkout.mm.waiting.step2", { operator })}</li>
              <li>{t("checkout.mm.waiting.step3")}</li>
            </ol>
            <p className="text-sm text-ardoise">{t("checkout.mm.waiting.keepOpen")}</p>
            <p className="text-sm font-medium">{t("checkout.mm.waiting.never")}</p>
            <PaymentPoller paymentId={payment.id} />
          </div>
        );
      }
      const failed = payment.status === "failed";
      return (
        <Alert
          tone="error"
          title={failed ? t("checkout.failed.title") : t("checkout.expired.title")}
          action={
            <span className="flex flex-wrap gap-4">
              <Link
                href={
                  context === "signup"
                    ? "/inscription/paiement"
                    : `/app/abonnement/payer?forfait=${plan.code}`
                }
                className="font-medium underline"
              >
                {failed ? t("checkout.failed.retry") : t("checkout.expired.retry")}
              </Link>
              <Link href={freeHref} className="font-medium underline">
                {t("checkout.failed.keepFree")}
              </Link>
            </span>
          }
        >
          {failed ? t("checkout.failed.text") : t("checkout.expired.text")}
        </Alert>
      );
    }
  }

  const provider = paymentProvider();
  const total = formatUsd(plan.priceCents ?? 0);
  const current = await liveSubscription(db, subject, now);
  const start =
    current?.planId === plan.id && current.currentPeriodEnd > now ? current.currentPeriodEnd : now;
  const messages = await getMessages();

  return (
    <div className="flex flex-col gap-5">
      <section
        className="flex flex-col gap-2 rounded-card bg-creme p-5"
        aria-labelledby="checkout-summary"
      >
        <h2 id="checkout-summary" className="font-semibold">
          {t("checkout.summary.title")}
        </h2>
        <p>{t("checkout.summary.plan", { plan: plan.name })}</p>
        <p className="text-sm text-ardoise">
          {t("checkout.summary.period", {
            startDate: formatDate(start, timeZone),
            endDate: formatDate(addMonths(start, 1), timeZone),
          })}
        </p>
        <p className="text-lg font-semibold">{t("checkout.summary.total", { total })}</p>
      </section>
      {provider ? (
        <>
          {provider.id === "fake" && <Alert tone="warning" title={t("checkout.fake")} />}
          <NextIntlClientProvider messages={pickMessages(messages, ["checkout", "common"])}>
            <CheckoutForm
              plan={plan.code}
              context={context}
              total={total}
              operators={provider.operators ?? []}
            />
          </NextIntlClientProvider>
          <p className="text-sm text-ardoise">{t("checkout.secure")}</p>
        </>
      ) : (
        <form action={startTrialAction} className="flex flex-col items-start gap-3">
          <input type="hidden" name="plan" value={plan.code} />
          <input type="hidden" name="context" value={context} />
          <p>{t("checkout.trial.text", { plan: plan.name, days: TRIAL_DAYS })}</p>
          <Button type="submit" size="lg">
            {t("checkout.trial.cta", { plan: plan.name })}
          </Button>
        </form>
      )}
      <p className="text-sm">{t("checkout.applyFree")}</p>
    </div>
  );
}
