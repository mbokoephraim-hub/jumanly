import type { ReactNode } from "react";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Character } from "@/components/brand/character";
import { Icon, type IconName } from "@/components/brand/icon";
import { Alert, Button, ButtonLink } from "@/components/ui";
import { pickMessages } from "@/i18n/client-messages";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
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
  PAYMENT_EXPIRY_MS,
  purchasablePlan,
  quoteCheckout,
  TRIAL_DAYS,
} from "@/server/services/subscriptions";
import { CheckoutForm, PaymentCountdown, PaymentPoller } from "./checkout-form";
import { SuccessBurst } from "@/components/motion/success-burst";

/** Round mark with a check, before a reassuring line. */
function CheckDot() {
  return (
    <span
      aria-hidden
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-lime text-sapin"
    >
      <Icon name="check" className="size-3.5" />
    </span>
  );
}

/** « Moyen de paiement › Informations › Confirmation » (mockups 05-03 and 05-04). */
async function CheckoutSteps({ current }: { current: number }) {
  const t = await getTranslations("checkout.steps");
  const steps = [t("method"), t("details"), t("confirm")];
  return (
    <ol aria-label={t("label")} className="relative grid grid-cols-3 lg:mx-auto lg:w-[86%]">
      <span
        aria-hidden
        className="absolute top-3.5 right-[16.6%] left-[16.6%] h-0.5 rounded-pill bg-brume"
      />
      <span
        aria-hidden
        className="jm-fill absolute top-3.5 left-[16.6%] h-0.5 origin-left rounded-pill bg-lime"
        style={{ width: `${(current / (steps.length - 1)) * 66.8}%` }}
      />
      {steps.map((label, index) => {
        const done = index < current;
        const now = index === current;
        return (
          <li
            key={label}
            aria-current={now ? "step" : undefined}
            className="relative flex flex-col items-center gap-1.5 text-center"
          >
            <span
              aria-hidden
              className={cx(
                "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                done && "bg-lime text-sapin",
                now && "bg-sapin text-lime shadow-[0_0_0_4px_rgb(166_242_107/0.55)]",
                !done && !now && "bg-blanc text-sapin ring-[1.5px] ring-brume ring-inset",
              )}
            >
              {done ? <Icon name="check" className="size-3.5" /> : index + 1}
            </span>
            <span className={cx("text-[11px] leading-4 lg:text-xs", now && "font-semibold")}>
              {label}
              {(done || now) && <span className="sr-only"> {done ? t("done") : t("current")}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Result of a payment (mockup 05-05): a character over a tinted band, a round mark, the title,
 * the text and the next step. Used for success, failure and an expired request.
 */
function ResultCard({
  tone,
  title,
  children,
  actions,
}: {
  tone: "success" | "failure" | "expired";
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  const success = tone === "success";
  const mark: IconName = success ? "check" : tone === "expired" ? "horloge" : "fermer";
  return (
    <section
      role="status"
      className="mx-auto flex w-full max-w-[628px] flex-col overflow-hidden rounded-[28px] bg-blanc"
    >
      <div
        aria-hidden
        className={cx(
          "relative flex h-[150px] items-end justify-center overflow-hidden lg:h-[210px]",
          success ? "bg-lime-clair" : "bg-brume",
        )}
      >
        {success && (
          <span className="absolute inset-0 bg-[url(/marque/motifs/motif-points-clair.svg)] bg-[length:240px] opacity-60" />
        )}
        <span className="jm-rise relative -mb-6">
          <Character
            name={success ? "kofi" : "nadia"}
            pose={success ? "joie" : "perplexe"}
            height={success ? 190 : 180}
          />
        </span>
      </div>
      <div className="flex flex-col items-center gap-3 px-5 pb-7 text-center lg:px-10 lg:pb-10">
        <span
          aria-hidden
          className={cx(
            "jm-pop relative -mt-7 flex size-14 items-center justify-center rounded-full ring-4 ring-blanc",
            success && "bg-lime text-sapin",
            tone === "failure" && "bg-down-fond text-down-texte",
            tone === "expired" && "bg-ambre-fond text-ambre-texte",
          )}
        >
          <Icon name={mark} className="size-6" />
        </span>
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight lg:text-[26px]">
          {title}
        </h2>
        <div className="flex max-w-[420px] flex-col items-center gap-3 text-sm leading-[22px] lg:text-[15px]">
          {children}
        </div>
        <div className="mt-2 flex w-full flex-col items-center gap-2.5">{actions}</div>
      </div>
    </section>
  );
}

/**
 * Paying for a plan (partie 09 § 9.3): summary, method, then the provider's answer. Used by
 * sign-up step 5 and by « Mon abonnement » (mockups 05-03 to 05-05). Paying is never required to
 * use the account.
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
  const d = dynamic(t);
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
  const checkoutHref =
    context === "signup" ? "/inscription/paiement" : `/app/abonnement/payer?forfait=${plan.code}`;
  const messages = await getMessages();
  const applyFree = (
    <p className="flex items-start gap-2.5 rounded-[16px] bg-lime-clair px-4 py-3 text-left text-[13px] leading-[19px] font-medium">
      <CheckDot />
      <span className="pt-0.5">{t("checkout.applyFree")}</span>
    </p>
  );

  if (trial) {
    const current = await liveSubscription(db, subject, now);
    if (current?.status === "trialing") {
      return (
        <SuccessBurst
          title={t("signup.payment.trial.title", { plan: plan.name })}
          action={<ButtonLink href={continueHref}>{t("signup.payment.trial.cta")}</ButtonLink>}
        >
          <p>
            {t("signup.payment.trial.text", {
              plan: plan.name,
              endDate: formatDate(current.currentPeriodEnd, timeZone),
            })}
          </p>
        </SuccessBurst>
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
      const reference = t("checkout.success.reference", { reference: payment.providerRef });
      if (payment.status === "succeeded") {
        return (
          <ResultCard
            tone="success"
            title={t("checkout.success.title")}
            actions={
              <span className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
                <ButtonLink
                  href={continueHref}
                  size="lg"
                  iconAfter={<Icon name="chev-r" className="size-4" />}
                >
                  {t("checkout.success.cta")}
                </ButtonLink>
                {payment.invoice && (
                  <ButtonLink
                    href={`/app/abonnement/factures/${payment.invoice.id}/pdf`}
                    prefetch={false}
                    variant="tertiary"
                    size="lg"
                    icon={<Icon name="telecharger" className="size-[18px]" />}
                  >
                    {t("checkout.success.invoice")}
                  </ButtonLink>
                )}
              </span>
            }
          >
            <p>
              {t("checkout.success.text", {
                plan: plan.name,
                endDate: formatDate(payment.periodEnd, timeZone),
                email: user.email,
              })}
            </p>
            <p className="rounded-pill bg-brume px-3.5 py-1.5 text-xs font-semibold">{reference}</p>
          </ResultCard>
        );
      }
      if (payment.status === "pending") {
        const expiresAt = new Date(payment.createdAt.getTime() + PAYMENT_EXPIRY_MS);
        const steps = [
          t("checkout.mm.waiting.step1"),
          t("checkout.mm.waiting.step2", { operator }),
          t("checkout.mm.waiting.step3"),
        ];
        return (
          <section
            aria-labelledby="checkout-waiting"
            className="flex flex-col gap-5 rounded-[28px] bg-blanc p-5 lg:p-7"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
              <div className="relative isolate flex h-[220px] shrink-0 items-end justify-end overflow-hidden rounded-[24px] bg-sapin pr-8 lg:h-[300px] lg:w-[300px] lg:justify-center lg:pr-0">
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 bg-[url(/marque/motifs/motif-orbites-sombre.svg)] bg-[length:300px] opacity-40"
                />
                <span className="absolute top-4 left-4 flex flex-col items-start gap-2">
                  <NextIntlClientProvider messages={pickMessages(messages, ["checkout"])}>
                    <PaymentCountdown expiresAt={expiresAt.toISOString()} />
                  </NextIntlClientProvider>
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-blanc/12 px-3 text-xs font-semibold text-blanc">
                    <Icon name="mobile-money" className="size-3.5" />
                    {t("checkout.summary.amount", { amount: formatUsd(payment.amountCents) })}
                  </span>
                </span>
                <span className="jm-float -mb-2">
                  <Character name="amani" pose="telephone" height={200} />
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
                <span className="inline-flex h-6 items-center gap-1.5 rounded-pill bg-lime px-2.5 text-[11px] font-semibold text-sapin">
                  <Icon name="horloge" className="size-3.5" />
                  {t("checkout.mm.waiting.status")}
                </span>
                <h2
                  id="checkout-waiting"
                  className="text-[22px] leading-tight font-semibold tracking-tight lg:text-[26px]"
                >
                  {t("checkout.mm.waiting.title")}
                </h2>
                <p className="text-sm leading-[21px] lg:text-[15px]">
                  {t("checkout.mm.waiting.text", {
                    localAmount: formatUsd(payment.amountCents),
                    localCurrency: t("checkout.summary.currency"),
                    maskedNumber: payment.msisdnMasked ?? "",
                    operator,
                  })}
                </p>
                <ol className="jm-steps flex w-full flex-col">
                  {steps.map((step, index) => (
                    <li
                      key={step}
                      className={cx(
                        "flex items-center gap-3 py-3 text-sm lg:text-[15px]",
                        index > 0 && "border-t border-brume",
                      )}
                    >
                      <span
                        aria-hidden
                        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lime-clair text-xs font-semibold text-sapin"
                      >
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <p className="flex items-start gap-2.5 rounded-[16px] bg-creme px-4 py-3 text-[13px] leading-[19px]">
                <Icon name="notification" className="mt-px size-4 shrink-0" />
                {t("checkout.mm.waiting.keepOpen")}
              </p>
              <p className="flex items-start gap-2.5 rounded-[16px] bg-ambre-fond px-4 py-3 text-[13px] leading-[19px] text-ambre-texte">
                <Icon name="securite" className="mt-px size-4 shrink-0" />
                {t("checkout.mm.waiting.never")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-ardoise">{reference}</p>
              <p role="status" className="flex items-center gap-2 text-[13px] text-ardoise">
                <span aria-hidden className="jm-pulse size-2 rounded-full bg-feuille" />
                {t("checkout.mm.checking")}
              </p>
            </div>
            <PaymentPoller paymentId={payment.id} />
          </section>
        );
      }
      const failed = payment.status === "failed";
      const reason =
        failed && payment.failureReason
          ? [
              `checkout.failed.reason.${payment.failureReason}`,
              `checkout.card.error.${payment.failureReason}`,
            ].find((key) => d.has(key))
          : undefined;
      return (
        <div className="flex flex-col gap-4">
          <ResultCard
            tone={failed ? "failure" : "expired"}
            title={failed ? t("checkout.failed.title") : t("checkout.expired.title")}
            actions={
              <>
                <span className="flex w-full max-w-[380px] flex-col gap-2.5">
                  <ButtonLink href={checkoutHref} variant="secondary" size="lg" fullWidth>
                    {failed ? t("checkout.failed.retry") : t("checkout.expired.retry")}
                  </ButtonLink>
                  {failed && (
                    <ButtonLink href={checkoutHref} variant="tertiary" size="lg" fullWidth>
                      {t("checkout.failed.otherMethod")}
                    </ButtonLink>
                  )}
                </span>
                <Link
                  href={freeHref}
                  className="inline-flex min-h-11 items-center text-[13px] font-semibold text-feuille-fonce hover:underline"
                >
                  {t("checkout.failed.keepFree")}
                </Link>
                {applyFree}
              </>
            }
          >
            <p>{failed ? t("checkout.failed.text") : t("checkout.expired.text")}</p>
            {reason && (
              <p className="flex items-center gap-2 rounded-[12px] bg-down-fond px-3.5 py-2 text-[13px] text-down-texte">
                <Icon name="mobile-money" className="size-4 shrink-0" />
                {d(reason, { operator })}
              </p>
            )}
          </ResultCard>
          <p className="mx-auto flex w-full max-w-[628px] items-start gap-3 rounded-[20px] bg-blanc px-5 py-3.5 text-[13px] leading-5">
            <Icon name="message" className="mt-0.5 size-4 shrink-0" />
            {t("checkout.debitedNotActivated", { reference: payment.providerRef })}
          </p>
        </div>
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
          <ButtonLink href={`/app/abonnement#billing-${subject.type}-change`}>
            {t("billing.downgrade.confirm")}
          </ButtonLink>
        }
      />
    );
  }
  const total = formatUsd(quote.totalCents);
  const current = quote.kind === "upgrade" ? await liveSubscription(db, subject, now) : null;
  const split = context === "billing";

  const row = "flex items-baseline justify-between gap-4 text-[13px] leading-5 lg:text-sm";
  const summary = (
    <section
      className="flex flex-col gap-3.5 rounded-[24px] bg-blanc p-5 lg:p-6"
      aria-labelledby="checkout-summary"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="checkout-summary" className="text-xl font-semibold tracking-tight">
          {t("checkout.summary.title")}
        </h2>
        <span className="inline-flex h-6 items-center rounded-pill bg-lime px-2.5 text-[11px] font-semibold">
          {plan.name}
        </span>
      </div>
      <div className="flex items-center gap-3.5 rounded-[18px] bg-lime p-3.5">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-sapin text-lime"
        >
          <Icon name="etoile" className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[15px] font-semibold">{plan.name}</span>
          <span className="text-xs">
            {t("checkout.summary.period", {
              startDate: formatDate(quote.periodStart, timeZone),
              endDate: formatDate(quote.periodEnd, timeZone),
            })}
          </span>
        </span>
      </div>
      <p className={row}>
        <span className="text-ardoise">{t("billing.upgrade.summary.price")}</span>
        <span className="text-right font-semibold">
          {t("checkout.summary.amount", { amount: formatUsd(quote.priceCents) })}
        </span>
      </p>
      {quote.creditCents > 0 && (
        <>
          <p className={row}>
            <span className="text-ardoise">
              {t("billing.upgrade.summary.credit", { currentPlan: current?.plan.name ?? "" })}
            </span>
            <span className="text-right font-semibold whitespace-nowrap">
              {t("checkout.summary.creditValue", { credit: formatUsd(quote.creditCents) })}
            </span>
          </p>
          <p className="text-xs leading-4 text-ardoise">{t("billing.upgrade.prorataNote")}</p>
        </>
      )}
      <div className="flex items-center justify-between gap-4 border-t border-brume pt-3.5">
        <p className="text-base font-semibold lg:text-[17px]">
          {t("checkout.summary.total", { total })}
        </p>
        <span className="inline-flex h-6 items-center rounded-pill bg-brume px-2.5 text-[11px] font-semibold">
          {t("checkout.summary.currency")}
        </span>
      </div>
      <p className="flex items-start gap-2.5 rounded-[16px] bg-creme px-4 py-3 text-xs leading-[17px]">
        <Icon name="securite" className="mt-px size-4 shrink-0" />
        {t("checkout.secure")}
      </p>
      {split && applyFree}
      <p className="text-xs leading-[17px] text-ardoise">
        {interpolate(t("checkout.terms.text", { terms: slot("terms") }), {
          terms: (
            <Link href="/conditions" className="font-semibold text-sapin underline">
              {t("checkout.terms.link")}
            </Link>
          ),
        })}
      </p>
      {split && (
        <Link
          href="/app/abonnement"
          className="inline-flex min-h-11 items-center justify-center gap-1.5 self-center text-[13px] font-semibold hover:underline"
        >
          <Icon name="chev-l" className="size-4" />
          {t("checkout.cancel")}
        </Link>
      )}
    </section>
  );

  const method = provider ? (
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
    </>
  ) : (
    <form action={startTrialAction} className="flex flex-col items-start gap-3">
      <input type="hidden" name="plan" value={plan.code} />
      <input type="hidden" name="context" value={context} />
      <p>{t("checkout.trial.text", { plan: plan.name, days: TRIAL_DAYS })}</p>
      <Button type="submit" size="lg" fullWidth>
        {t("checkout.trial.cta", { plan: plan.name })}
      </Button>
    </form>
  );

  if (!split) {
    return (
      <div className="flex flex-col gap-5">
        {summary}
        <div className="flex flex-col gap-4 rounded-[24px] bg-blanc p-5 lg:p-[22px]">{method}</div>
      </div>
    );
  }
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <div className="lg:hidden">
        <CheckoutSteps current={1} />
      </div>
      <div className="lg:col-start-2 lg:row-start-1">{summary}</div>
      <div className="flex min-w-0 flex-col gap-5 rounded-[24px] bg-blanc p-5 lg:col-start-1 lg:row-start-1 lg:p-7">
        <div className="hidden lg:block">
          <CheckoutSteps current={1} />
        </div>
        {method}
      </div>
    </div>
  );
}
