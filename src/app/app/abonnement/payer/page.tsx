import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { CheckoutPanel } from "@/components/billing/checkout-panel";
import { CheckNow, PaymentWait, TalentCheckout } from "@/components/talent/billing/checkout";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { dynamic } from "@/i18n/dynamic";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { startTrialAction } from "@/server/actions/checkout";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { paymentProvider } from "@/server/payments";
import { listDialCountries } from "@/server/services/places";
import {
  liveSubscription,
  localMask,
  PAYMENT_EXPIRY_MS,
  purchasablePlan,
  quoteCheckout,
  TRIAL_DAYS,
} from "@/server/services/subscriptions";
import { inOrganizationSpace } from "@/server/talent-space";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("paiement");
  return { title: t("seo"), robots: { index: false } };
}

/** The only contact of Jumanly (CLAUDE.md § 8): by e-mail, never by phone. */
const CONTACT_EMAIL = "assistant@jumanly.io";

/**
 * Paiement (planche talent-4 § 7): the order, Mobile Money or card, the number with its dialling
 * code, the confirmation on the phone, then the receipt. The result is shown on the same address
 * (`&paiement=`), so the provider's return and the polling stay as they are. An organization's
 * member keeps the former checkout until the recruiter redesign.
 */
export default async function PayPage({ searchParams }: PageProps<"/app/abonnement/payer">) {
  const params = await searchParams;
  const user = await requireUser("/app/abonnement");
  const code = typeof params.forfait === "string" ? params.forfait : "";
  const plan = code ? await db.plan.findUnique({ where: { code } }) : null;
  const t = await getTranslations();
  const paymentId = typeof params.paiement === "string" ? params.paiement : undefined;

  if (await inOrganizationSpace(user.id)) {
    if (!plan) redirect("/app/abonnement");
    return (
      <div className="jm-page flex flex-col gap-5 lg:gap-6">
        <AppPageHeader title={t("checkout.title")} />
        <CheckoutPanel
          user={user}
          planCode={plan.code}
          context="billing"
          paymentId={paymentId}
          trial={params.essai === "1"}
          continueHref="/app/abonnement"
          freeHref="/app/abonnement"
        />
      </div>
    );
  }
  if (!plan) redirect("/app/abonnement/formules");

  const d = dynamic(t);
  const now = new Date();
  const subject = { type: "user" as const, id: user.id };
  const amount = (cents: number) => t("abonnement.amount", { amount: formatUsd(cents) });
  const opName = (operator: string | null) =>
    operator && d.has(`checkout.mm.operators.${operator}`)
      ? d(`checkout.mm.operators.${operator}`)
      : "";
  const head = (
    <FlowHead
      back="/app/abonnement/formules"
      backLabel={t("paiement.back")}
      title={t("paiement.title")}
      end={
        <Link href="/app/abonnement" className="t-bi t-press" aria-label={t("paiement.close")}>
          <TalentIcon name="fermer" size="s" />
        </Link>
      }
    />
  );

  // The answer of the provider: waiting, received, refused or expired.
  if (paymentId) {
    const payment = await db.payment.findFirst({
      where: { id: paymentId, subjectType: "user", subjectId: user.id },
    });
    if (payment) {
      const operator = opName(payment.operator);
      const number = payment.msisdnMasked ?? "";
      if (payment.status === "pending") {
        const expiresAt = new Date(payment.createdAt.getTime() + PAYMENT_EXPIRY_MS);
        return (
          <div className="t-flux t-conf t-w4-conf">
            <span className="t-rond-att" aria-hidden>
              <TalentIcon name="horloge" />
            </span>
            <h1 className="t-h2s">{t("paiement.waiting.title")}</h1>
            <p>
              {payment.method === "card"
                ? t("paiement.waiting.textCard", { amount: amount(payment.amountCents) })
                : t("paiement.waiting.text", {
                    operator,
                    amount: amount(payment.amountCents),
                    number,
                  })}
            </p>
            <PaymentWait
              paymentId={payment.id}
              expiresAt={expiresAt.toISOString()}
              labels={{
                status: t("paiement.waiting.status", {
                  minutes: "{minutes}",
                  seconds: "{seconds}",
                }),
                statusShort: t("paiement.waiting.statusShort"),
              }}
            />
            <SheetButton target="paiement-rien" className="t-bt t-txt t-press">
              {t("paiement.waiting.nothing")}
            </SheetButton>
            <Sheet
              id="paiement-rien"
              title={t("paiement.nothing.title")}
              closeLabel={t("paiement.close")}
            >
              <ul className="t-verre t-liste t-lignes t-rien">
                {[
                  t("paiement.nothing.network"),
                  t("paiement.nothing.number", { number }),
                  t("paiement.nothing.wait"),
                ].map((line) => (
                  <li key={line} className="t-li">
                    <TalentIcon name="valider" size="s" />
                    <span className="t-t">
                      <span>{line}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="t-gar">
                <TalentIcon name="cadenas" size="s" />
                <span>{t("paiement.nothing.never")}</span>
              </p>
              <p className="t-aide-c">
                {t("paiement.nothing.reference", { reference: payment.providerRef })}
              </p>
              <CheckNow paymentId={payment.id} label={t("paiement.nothing.check")} />
            </Sheet>
          </div>
        );
      }
      if (payment.status === "succeeded") {
        // The reference the person can quote: the invoice's number, else the provider's.
        const invoice = await db.invoice.findUnique({
          where: { paymentId: payment.id },
          select: { number: true },
        });
        const method =
          payment.method === "mobile_money"
            ? operator
            : t(
                payment.method === "card"
                  ? "paiement.method.card"
                  : payment.method === "cash"
                    ? "paiement.method.cash"
                    : "paiement.method.bankTransfer",
              );
        return (
          <div className="t-flux t-conf t-w4-conf">
            <span className="t-rond-ok" aria-hidden>
              <TalentIcon name="valider" />
            </span>
            <h1 className="t-h2s">{t("paiement.success.title")}</h1>
            <p>
              {t("paiement.success.text", {
                plan: plan.name,
                date: formatDate(payment.periodEnd),
              })}
            </p>
            <dl className="t-verre t-liste t-lignes t-recu-l">
              <div className="t-li">
                <dt>{t("paiement.success.amount")}</dt>
                <dd>
                  {t("paiement.success.amountValue", {
                    amount: amount(payment.amountCents),
                    method,
                  })}
                </dd>
              </div>
              <div className="t-li">
                <dt>{t("paiement.success.reference")}</dt>
                <dd>{invoice?.number ?? payment.providerRef}</dd>
              </div>
            </dl>
            <Link href="/app/abonnement" className="t-bt t-p t-pl t-press">
              {t("paiement.success.cta", { plan: plan.name })}
            </Link>
          </div>
        );
      }
      const failed = payment.status === "failed";
      return (
        <div className="t-flux t-conf t-w4-conf">
          <span className="t-rond-ko" aria-hidden>
            <TalentIcon name={failed ? "fermer" : "horloge"} />
          </span>
          <h1 className="t-h2s">
            {failed ? t("paiement.failed.title") : t("paiement.expired.title")}
          </h1>
          <p>{failed ? t("paiement.failed.text") : t("paiement.expired.text")}</p>
          <Link
            href={`/app/abonnement/payer?forfait=${plan.code}`}
            className="t-bt t-p t-pl t-press"
          >
            {t("paiement.retry")}
          </Link>
          <Link href="/app/abonnement" className="t-bt t-txt t-press">
            {t("paiement.keep")}
          </Link>
          <p className="t-gar">
            <TalentIcon name="message" size="s" />
            <span>
              {t("paiement.debited", { email: CONTACT_EMAIL, reference: payment.providerRef })}
            </span>
          </p>
        </div>
      );
    }
  }

  // A trial started where online payment is not open yet.
  if (params.essai === "1") {
    const current = await liveSubscription(db, subject, now);
    if (current?.status === "trialing") {
      return (
        <div className="t-flux t-conf t-w4-conf">
          <span className="t-rond-ok" aria-hidden>
            <TalentIcon name="valider" />
          </span>
          <h1 className="t-h2s">{t("paiement.trial.title", { plan: plan.name })}</h1>
          <p>
            {t("paiement.trial.done", {
              plan: plan.name,
              date: formatDate(current.currentPeriodEnd),
            })}
          </p>
          <Link href="/app/abonnement" className="t-bt t-p t-pl t-press">
            {t("paiement.success.cta", { plan: plan.name })}
          </Link>
        </div>
      );
    }
  }

  const buyable = await purchasablePlan(db, subject, plan.code);
  const quote = buyable ? await quoteCheckout(db, subject, plan.code, now) : null;
  if (quote?.kind === "downgrade") redirect(`/app/abonnement/formules?formule=${plan.code}`);
  if (!quote) {
    return (
      <div className="t-flux">
        {head}
        <p className="t-gar">
          <TalentIcon name="aide" size="s" />
          <span>{t("paiement.unavailable")}</span>
        </p>
        <Link href="/app/abonnement/formules" className="t-bt t-sec t-pl t-press">
          {t("formules.title")}
        </Link>
      </div>
    );
  }

  const current = quote.kind === "upgrade" ? await liveSubscription(db, subject, now) : null;
  const periodValue = t("talentW4.pay.periodValue", {
    start: formatDate(quote.periodStart),
    end: formatDate(quote.periodEnd),
  });
  // The « Récapitulatif » at the right on a tablet or a computer (planche web talent-4 § 7).
  const recap = (
    <>
      <h2 className="t-h4">{t("talentW4.pay.recap")}</h2>
      <dl>
        <div>
          <dt>{t("talentW4.pay.plan")}</dt>
          <dd>{t("paiement.summary", { plan: plan.name })}</dd>
        </div>
        <div>
          <dt>{t("talentW4.pay.period")}</dt>
          <dd>{periodValue}</dd>
        </div>
        <div>
          <dt>{t("talentW4.pay.renewal")}</dt>
          <dd>{t("talentW4.pay.renewalValue")}</dd>
        </div>
        {quote.creditCents > 0 && (
          <div>
            <dt>{t("talentW4.pay.credit")}</dt>
            <dd>{amount(quote.creditCents)}</dd>
          </div>
        )}
        <div className="t-w4-tot">
          <dt>{t("talentW4.pay.total")}</dt>
          <dd>{amount(quote.totalCents)}</dd>
        </div>
      </dl>
    </>
  );
  const summary = (
    <div className="t-verre t-recu">
      <div>
        <b>{t("paiement.summary", { plan: plan.name })}</b>
        <span>
          {t("paiement.period", {
            start: formatDate(quote.periodStart),
            end: formatDate(quote.periodEnd),
          })}
        </span>
        {quote.creditCents > 0 && (
          <span>
            {t("paiement.credit", {
              credit: amount(quote.creditCents),
              plan: current?.plan.name ?? "",
            })}
          </span>
        )}
      </div>
      <span className="t-m">{amount(quote.totalCents)}</span>
    </div>
  );
  const provider = paymentProvider();
  if (!provider) {
    return (
      <div className="t-flux">
        {head}
        {summary}
        <p className="t-gar">
          <TalentIcon name="horloge" size="s" />
          <span>{t("paiement.trial.text", { plan: plan.name, days: TRIAL_DAYS })}</span>
        </p>
        <form action={startTrialAction} className="t-verre t-fort t-bas-f">
          <input type="hidden" name="plan" value={plan.code} />
          <input type="hidden" name="context" value="billing" />
          <button type="submit" className="t-bt t-p t-pl t-press">
            {t("paiement.trial.cta", { plan: plan.name })}
          </button>
        </form>
      </div>
    );
  }

  const [countries, lastPayments] = await Promise.all([
    listDialCountries(db),
    db.payment.findMany({
      where: {
        subjectType: "user",
        subjectId: user.id,
        method: "mobile_money",
        status: "succeeded",
      },
      orderBy: { createdAt: "desc" },
      select: { operator: true, msisdnMasked: true },
      take: 10,
    }),
  ]);
  const lastNumber = (operator: string) =>
    lastPayments.find((payment) => payment.operator === operator && payment.msisdnMasked)
      ?.msisdnMasked ?? null;
  const operators = (
    provider.methods.includes("mobile_money") ? (provider.operators ?? []) : []
  ).map((operator) => {
    const last = lastNumber(operator);
    return { code: operator, name: opName(operator), last: last ? localMask(last) : null };
  });
  const error = (key: string) => d(`paiement.error.${key}`);

  return (
    <div className="t-flux t-w4 t-large">
      <div className="t-w4-h">
        {head}
        <p className="t-w4-web t-w4-sub">{t("paiement.summary", { plan: plan.name })}</p>
      </div>
      {provider.id === "fake" && (
        <p className="t-gar">
          <TalentIcon name="aide" size="s" />
          <span>{t("paiement.fake")}</span>
        </p>
      )}
      <TalentCheckout
        plan={plan.code}
        operators={operators}
        cards={provider.methods.includes("card")}
        countries={countries.map(({ code: iso, name, dialCode }) => ({
          code: iso,
          name,
          dialCode,
        }))}
        country={user.country ?? "CD"}
        summary={summary}
        recap={recap}
        labels={{
          mm: t("paiement.mm"),
          methods: t("paiement.methods.aria"),
          card: t("paiement.card.title"),
          cardText: t("paiement.card.text"),
          note: t("paiement.note"),
          noteCard: t("paiement.noteCard"),
          pay: t("paiement.pay", { total: amount(quote.totalCents) }),
          paying: t("paiement.paying"),
          change: t("paiement.change"),
          number: t("paiement.number.label"),
          placeholder: t("paiement.number.placeholder"),
          help: t("paiement.number.help"),
          receipt: t("talentW4.pay.receipt"),
          dial: {
            label: t("paiement.dial.label"),
            choose: t("paiement.dial.label"),
            title: t("paiement.dial.title"),
            search: t("paiement.dial.search"),
            none: t("paiement.dial.none"),
            close: t("paiement.dial.close"),
            sections: {
              central: t("access.countries.section.central"),
              westEast: t("access.countries.section.westEast"),
              outside: t("access.countries.section.outside"),
              all: t("access.countries.section.all"),
            },
          },
          errors: {
            operatorRequired: error("operatorRequired"),
            numberRequired: error("numberRequired"),
            numberInvalid: error("numberInvalid"),
            duplicate: error("duplicate"),
            failed: error("failed"),
            "failed.text": error("failed"),
          },
        }}
      />
    </div>
  );
}
