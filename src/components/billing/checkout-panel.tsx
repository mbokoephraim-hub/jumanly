import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { Alert, Button, ButtonLink } from "@/components/ui";
import { pickMessages } from "@/i18n/client-messages";
import { formatDate } from "@/lib/dates";
import { interpolate, slot } from "@/lib/interpolate";
import { formatUsd } from "@/lib/money";
import { startTrialAction } from "@/server/actions/checkout";
import type { CurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { paymentProvider } from "@/server/payments";
import { billingSubject } from "@/server/services/accounts";
import {
  liveSubscription,
  purchasablePlan,
  quoteCheckout,
  TRIAL_DAYS,
} from "@/server/services/subscriptions";
import { CheckoutForm, PaymentPoller } from "./checkout-form";
import { SuccessBurst } from "@/components/motion/success-burst";

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
      include: { invoice: { select: { id: true } } },
    });
    if (payment) {
      const operator = payment.operator
        ? t(`checkout.mm.operators.${payment.operator}` as "checkout.mm.operators.mpesa")
        : "";
      if (payment.status === "succeeded") {
        return (
          <SuccessBurst
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
            {payment.invoice && (
              <a
                href={`/app/abonnement/factures/${payment.invoice.id}/pdf`}
                className="font-medium underline"
              >
                {t("checkout.success.invoice")}
              </a>
            )}
          </SuccessBurst>
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
            <p className="text-ardoise text-caption">
              {t("checkout.success.reference", { reference: payment.providerRef })}
            </p>
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
  const quote = await quoteCheckout(db, subject, plan.code, now);
  if (!quote) {
    return (
      <Alert
        tone="warning"
        title={t("billing.change.unavailable")}
        action={<ButtonLink href={freeHref}>{t("checkout.failed.keepFree")}</ButtonLink>}
      />
    );
  }
  if (quote.kind === "downgrade") {
    // A cheaper plan takes over at the end of the paid period (partie 05 § 6).
    const current = await liveSubscription(db, subject, now);
    return (
      <Alert
        title={t("billing.downgrade.text", {
          currentPlan: current?.plan.name ?? "",
          plan: plan.name,
          endDate: formatDate(current?.currentPeriodEnd ?? now, timeZone),
        })}
        action={
          <ButtonLink href="/app/abonnement#changer">{t("billing.downgrade.confirm")}</ButtonLink>
        }
      />
    );
  }
  const total = formatUsd(quote.totalCents);
  const current = quote.kind === "upgrade" ? await liveSubscription(db, subject, now) : null;
  const messages = await getMessages();

  const row = "flex items-baseline justify-between gap-4 text-sm";
  return (
    <div className="flex flex-col gap-5">
      <section
        className="flex flex-col gap-2.5 rounded-[24px] bg-blanc p-5 lg:p-[22px]"
        aria-labelledby="checkout-summary"
      >
        <h2
          id="checkout-summary"
          className="text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase"
        >
          {t("checkout.summary.title")}
        </h2>
        <p className={row}>
          <span className="text-ardoise">{t("signup.payment.summary.plan")}</span>
          <span className="text-right font-semibold">{plan.name}</span>
        </p>
        <p className={row}>
          <span className="text-ardoise">{t("signup.payment.summary.period")}</span>
          <span className="text-right">
            {t("checkout.summary.period", {
              startDate: formatDate(quote.periodStart, timeZone),
              endDate: formatDate(quote.periodEnd, timeZone),
            })}
          </span>
        </p>
        {quote.creditCents > 0 && (
          <>
            <p className={row}>
              <span className="text-ardoise">
                {t("billing.upgrade.summary.credit", { currentPlan: current?.plan.name ?? "" })}
              </span>
              <span className="text-right">
                {t("checkout.summary.credit", { credit: formatUsd(quote.creditCents) })}
              </span>
            </p>
            <p className="text-xs text-ardoise">{t("billing.upgrade.prorataNote")}</p>
          </>
        )}
        <p className="mt-1 flex items-baseline justify-between gap-4 border-t border-brume pt-3.5">
          <span className="text-sm font-semibold">{t("signup.payment.summary.total")}</span>
          <span className="text-xl font-bold">
            {t("signup.payment.summary.totalValue", { price: total })}
          </span>
        </p>
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
              note={t("signup.payment.prepaid")}
            />
          </NextIntlClientProvider>
          <p className="flex items-start gap-2.5 px-1 text-xs leading-[17px] text-ardoise">
            <Icon name="securite" className="mt-px size-4 shrink-0" />
            <span>
              {t("checkout.secure")}{" "}
              {interpolate(t("checkout.terms.text", { terms: slot("terms") }), {
                terms: (
                  <Link href="/conditions" className="underline">
                    {t("checkout.terms.link")}
                  </Link>
                ),
              })}
            </span>
          </p>
        </>
      ) : (
        <form
          action={startTrialAction}
          className="flex flex-col items-start gap-3 rounded-[24px] bg-blanc p-5"
        >
          <input type="hidden" name="plan" value={plan.code} />
          <input type="hidden" name="context" value={context} />
          <p>{t("checkout.trial.text", { plan: plan.name, days: TRIAL_DAYS })}</p>
          <Button type="submit" size="lg" fullWidth>
            {t("checkout.trial.cta", { plan: plan.name })}
          </Button>
        </form>
      )}
      {context === "billing" && <p className="text-sm">{t("checkout.applyFree")}</p>}
    </div>
  );
}
