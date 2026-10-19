import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HireBilling } from "@/components/billing/hire-billing";
import { InvoiceRows } from "@/components/talent/billing/invoice-rows";
import { OperatorTile } from "@/components/talent/billing/operator";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { AI_CREDITS_KEY } from "@/server/ai";
import { downgradeSubscription } from "@/server/actions/billing";
import { outcomeConsentAction } from "@/server/actions/partners";
import { switchSpace } from "@/server/actions/hire";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan, usage, type Subject } from "@/server/entitlements";
import { effectiveStatus, GRACE_DAYS } from "@/server/entitlements/periods";
import { ownedOrganization } from "@/server/services/accounts";
import { myLicenses } from "@/server/services/partners";
import { liveSubscription, localMask } from "@/server/services/subscriptions";
import { inOrganizationSpace } from "@/server/talent-space";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("abonnement");
  return { title: t("seo"), robots: { index: false } };
}

const DAY = 86_400_000;
/** How long « Vous êtes revenu à Free » stays after a paid plan ended. */
const BACK_TO_FREE_DAYS = 30;

/** Quotas of the month shown on the page (planche talent-4 § 7), by entitlement key. */
const QUOTA_ROWS = [
  { key: AI_CREDITS_KEY, label: "credits", icon: "orbi", tone: "t-w4-k4" },
  { key: "career.interview.text.monthly", label: "text", icon: "entretien", tone: "t-w4-k1" },
  { key: "career.interview.voice.monthly", label: "voice", icon: "micro", tone: "t-w4-k2" },
] as const;

type Params = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

function Row({
  className,
  href,
  icon,
  tone,
  title,
  text,
  end,
}: {
  className?: string;
  href?: string;
  icon: ReactNode;
  tone?: "t-c1" | "t-c2" | "t-c3";
  title: string;
  text?: string;
  end?: ReactNode;
}) {
  const body = (
    <>
      <span className={cx("t-cases", tone)} aria-hidden>
        {icon}
      </span>
      <span className="t-t">
        <b>{title}</b>
        {text && <span>{text}</span>}
      </span>
      {end ?? (href ? <TalentIcon name="suivant" /> : null)}
    </>
  );
  return (
    <li className={className}>
      {href ? (
        <Link href={href} className="t-li t-press">
          {body}
        </Link>
      ) : (
        <div className="t-li">{body}</div>
      )}
    </li>
  );
}

const icon = (name: TalentIconName) => <TalentIcon name={name} size="s" />;

/**
 * Abonnement (planche talent-4 § 7): the plan in force and until when, the quotas of the month,
 * changing plan, the last way of paying, the invoices. Everything comes from the database and the
 * entitlements, never from a plan's name. An organization's member keeps the former page.
 */
export default async function SubscriptionPage({ searchParams }: PageProps<"/app/abonnement">) {
  const params: Params = await searchParams;
  const user = await requireUser("/app/abonnement");
  if (await inOrganizationSpace(user.id)) return <HireBilling params={params} />;

  const t = await getTranslations();
  const d = dynamic(t);
  const now = new Date();
  const subject: Subject = { type: "user", id: user.id };
  const where = { subjectType: subject.type, subjectId: subject.id };
  const [plan, current, licenses, quotas, plans, invoices, lastPaid, lastOwn, org, recent] =
    await Promise.all([
      resolvePlan(db, subject, now),
      liveSubscription(db, subject, now),
      myLicenses(db, user.id, now),
      Promise.all(QUOTA_ROWS.map((row) => usage(db, subject, row.key, now))),
      db.plan.findMany({
        where: { family: "talent", active: true, isPublic: true },
        orderBy: { sortOrder: "asc" },
      }),
      db.invoice.count({ where }),
      db.payment.findFirst({
        where: { ...where, status: "succeeded" },
        orderBy: { createdAt: "desc" },
        select: { method: true, operator: true, msisdnMasked: true },
      }),
      db.subscription.findFirst({
        where: { ...where, source: { not: "license" }, status: { not: "trialing" } },
        orderBy: { currentPeriodEnd: "desc" },
        include: { plan: true },
      }),
      ownedOrganization(db, user.id),
      db.invoice.findMany({
        where,
        orderBy: { issuedAt: "desc" },
        take: 2,
        include: { payment: { select: { method: true, operator: true } } },
      }),
    ]);
  if (!plan) return null;

  const status = current ? effectiveStatus(current, now) : null;
  const daysLeft = current
    ? Math.max(0, Math.ceil((current.currentPeriodEnd.getTime() - now.getTime()) / DAY))
    : 0;
  const licence = licenses.find((item) => !item.pending);
  const canceled = !!current && (status === "canceled" || current.cancelAtPeriodEnd);
  const freePlan = plans.find((item) => item.priceCents === 0);
  const opName = (code: string | null) =>
    code && d.has(`checkout.mm.operators.${code}`) ? d(`checkout.mm.operators.${code}`) : "";

  const price = plan.priceCents ?? 0;
  const head =
    price > 0
      ? t("abonnement.current.paid", { plan: plan.planName, price: formatUsd(price) })
      : t("abonnement.current.free", { plan: plan.planName });
  const until =
    plan.status === "sponsored"
      ? licence
        ? t("abonnement.current.sponsoredUntil", {
            sponsor: licence.sponsorName,
            date: formatDate(licence.endDate),
          })
        : t("abonnement.current.sponsored")
      : !current
        ? t("abonnement.current.freeText")
        : status === "trialing"
          ? t("abonnement.current.trialUntil", { date: formatDate(current.currentPeriodEnd) })
          : status === "past_due"
            ? t("abonnement.current.pastDue", {
                date: formatDate(new Date(current.currentPeriodEnd.getTime() + GRACE_DAYS * DAY)),
              })
            : canceled
              ? t("abonnement.current.canceledUntil", {
                  date: formatDate(current.currentPeriodEnd),
                })
              : t("abonnement.current.paidUntil", { date: formatDate(current.currentPeriodEnd) });

  const renewHref = current
    ? `/app/abonnement/payer?forfait=${current.pendingPlan?.code ?? current.plan.code}`
    : null;
  const backToFree =
    !current &&
    plan.status === "free" &&
    lastOwn &&
    (lastOwn.plan.priceCents ?? 0) > 0 &&
    effectiveStatus(lastOwn, now) === "expired" &&
    now.getTime() - lastOwn.currentPeriodEnd.getTime() < BACK_TO_FREE_DAYS * DAY;
  const activated = licenses.find((item) => item.id === one(params.licence));
  const others = plans
    .filter((item) => item.id !== plan.planId && (item.priceCents ?? 0) > 0)
    .map((item) => item.name);
  const method = lastPaid
    ? lastPaid.method === "mobile_money"
      ? t("abonnement.method.mobileMoney", {
          operator: opName(lastPaid.operator),
          number: localMask(lastPaid.msisdnMasked ?? ""),
        })
      : lastPaid.method === "card"
        ? t("abonnement.method.card")
        : t("abonnement.method.other")
    : null;

  return (
    <div className="t-flux t-w4 t-large">
      <FlowHead back="/app/compte" backLabel={t("abonnement.back")} title={t("abonnement.title")} />

      {one(params.resiliation) && <Notice tone="ok">{t("abonnement.notice.resiliation")}</Notice>}
      {one(params.reactivation) && <Notice tone="ok">{t("abonnement.notice.reactivation")}</Notice>}
      {one(params.changement) && <Notice tone="ok">{t("abonnement.notice.changement")}</Notice>}
      {one(params.consentement) && <Notice tone="ok">{t("abonnement.notice.consent")}</Notice>}
      {activated && (
        <Notice tone="ok">
          {activated.pending
            ? t("abonnement.notice.licencePending", {
                plan: activated.planName,
                sponsor: activated.sponsorName,
              })
            : t("abonnement.notice.licence", {
                plan: activated.planName,
                sponsor: activated.sponsorName,
                date: formatDate(activated.endDate),
              })}
        </Notice>
      )}
      {backToFree && freePlan && (
        <Notice>{t("abonnement.notice.backToFree", { freePlan: freePlan.name })}</Notice>
      )}
      {current &&
        renewHref &&
        status === "active" &&
        !canceled &&
        !current.pendingPlan &&
        daysLeft <= 7 && (
          <p role="status" className="t-gar t-renouv">
            <TalentIcon name="horloge" size="s" />
            <span>
              {t("abonnement.notice.renew", {
                plan: current.plan.name,
                date: formatDate(current.currentPeriodEnd),
              })}
            </span>
            <Link href={renewHref} className="t-bt t-p t-s t-press">
              {t("abonnement.notice.renewCta")}
            </Link>
          </p>
        )}

      <section aria-labelledby="abo-formule" className="t-verre t-fo-act t-w4-abo">
        <div className="t-t">
          <small id="abo-formule">{t("abonnement.current.label")}</small>
          <b>{head}</b>
          <span>{until}</span>
          {current?.pendingPlan && (
            <span>
              {t("abonnement.current.scheduled", {
                plan: current.pendingPlan.name,
                date: formatDate(current.currentPeriodEnd),
              })}
            </span>
          )}
        </div>
        {status === "past_due" && renewHref && (
          <Link href={renewHref} className="t-bt t-p t-s t-press t-w4-tel">
            {t("abonnement.notice.renewCta")}
          </Link>
        )}
        <div className="t-w4-web t-bts">
          {renewHref && (
            <Link
              href={renewHref}
              className={cx("t-bt t-m t-press", status === "past_due" ? "t-p" : "t-sec")}
            >
              {status === "past_due"
                ? t("abonnement.notice.renewCta")
                : t("talentW4.billing.extend")}
            </Link>
          )}
          <Link href="/app/abonnement/formules" className="t-bt t-p t-m t-press">
            {t("talentW4.billing.change")}
          </Link>
        </div>
      </section>
      {current?.pendingPlan && (
        <form action={downgradeSubscription} className="t-annule-chg">
          <input type="hidden" name="family" value="talent" />
          <input type="hidden" name="plan" value="" />
          <button type="submit" className="t-bt t-txt t-s t-press">
            {t("abonnement.current.scheduledCancel")}
          </button>
        </form>
      )}

      <ul aria-label={t("abonnement.quotas.label")} className="t-verre t-quotas t-w4-q4">
        {QUOTA_ROWS.map((row, index) => {
          const { used, limit } = quotas[index];
          const name = t(`abonnement.quota.${row.label}`);
          const left = Math.max(0, limit - used);
          return (
            <li key={row.key} className="t-quota">
              <span className={cx("t-cases t-w4-web", row.tone)} aria-hidden>
                <TalentIcon name={row.icon} size="s" />
              </span>
              <div className="t-l">
                <b>{name}</b>
                <span className={limit > 0 ? "t-w4-tel" : undefined}>
                  {limit < 0
                    ? t("abonnement.quota.unlimited")
                    : limit === 0
                      ? t("abonnement.quota.none")
                      : t("abonnement.quota.left", { left, limit })}
                </span>
                {limit > 0 && (
                  <span className="t-w4-web t-w4-n" aria-hidden>
                    {left} <small>{t("talentW4.billing.of", { limit })}</small>
                  </span>
                )}
              </div>
              {limit > 0 && (
                <span
                  role="progressbar"
                  aria-label={t("abonnement.quota.aria", { name, left, limit })}
                  aria-valuemin={0}
                  aria-valuemax={limit}
                  aria-valuenow={left}
                  className="t-barre"
                >
                  <i style={{ width: `${Math.round((left / limit) * 100)}%` }} />
                </span>
              )}
            </li>
          );
        })}
        <li className="t-quota">
          <span className="t-cases t-w4-web t-w4-k3" aria-hidden>
            <TalentIcon name="candidature" size="s" />
          </span>
          <div className="t-l">
            <b>{t("abonnement.quota.applications")}</b>
            <span className="t-w4-tel">{t("abonnement.quota.applicationsValue")}</span>
            <span className="t-w4-web t-w4-n">{t("abonnement.quota.unlimited")}</span>
          </div>
          <span className="t-w4-web t-w4-qs">{t("talentW4.billing.applications")}</span>
        </li>
      </ul>

      <ul
        aria-label={t("abonnement.title")}
        className={cx("t-verre t-liste t-lignes", !licenses.length && !org && "t-w4-tel")}
      >
        <Row
          className="t-w4-tel"
          href="/app/abonnement/formules"
          icon={icon("progression")}
          tone="t-c2"
          title={t("abonnement.change.title")}
          text={others.join(", ")}
        />
        <Row
          className="t-w4-tel"
          icon={
            lastPaid?.method === "mobile_money" && lastPaid.operator ? (
              <OperatorTile code={lastPaid.operator} name={opName(lastPaid.operator)} />
            ) : (
              icon("portefeuille")
            )
          }
          tone={lastPaid?.method === "mobile_money" ? undefined : "t-c1"}
          title={t("abonnement.method.title")}
          text={method ?? t("abonnement.method.none")}
        />
        <Row
          className="t-w4-tel"
          href="/app/abonnement/factures"
          icon={icon("document")}
          title={t("abonnement.invoices.title")}
          text={t("abonnement.invoices.text", { count: invoices })}
        />
        {licenses.map((item) => (
          <li key={item.id}>
            <SheetButton target={`licence-${item.id}`} className="t-li t-press">
              <span className="t-cases t-c1" aria-hidden>
                <TalentIcon name="certificat" size="s" />
              </span>
              <span className="t-t">
                <b>{t("sponsored.card.title", { sponsorName: item.sponsorName })}</b>
                <span>
                  {t("sponsored.card.period", {
                    startDate: formatDate(item.startDate),
                    endDate: formatDate(item.endDate),
                  })}
                </span>
              </span>
              <TalentIcon name="suivant" />
            </SheetButton>
          </li>
        ))}
        {org && (
          <li>
            <form action={switchSpace}>
              <input type="hidden" name="space" value={org.id} />
              <button type="submit" className="t-li t-press">
                <span className="t-cases" aria-hidden>
                  <TalentIcon name="entreprise" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("abonnement.organization.title", { org: org.name })}</b>
                  <span>{t("abonnement.organization.text")}</span>
                </span>
                <TalentIcon name="suivant" />
              </button>
            </form>
          </li>
        )}
      </ul>

      <p className="t-gar t-w4-tel">
        <TalentIcon name="horloge" size="s" />
        <span>{t("abonnement.note")}</span>
      </p>

      {/* Ordinateur et tablette (planche web talent-4 § 7) : le moyen de paiement à gauche, les
          deux dernières factures à droite. */}
      <div className="t-w4-g2e t-w4-web">
        <div className="t-w4-col">
          <h2 className="t-ck-t t-w4-sech">{t("abonnement.method.title")}</h2>
          <ul className="t-verre t-liste t-lignes">
            <Row
              icon={
                lastPaid?.method === "mobile_money" && lastPaid.operator ? (
                  <OperatorTile code={lastPaid.operator} name={opName(lastPaid.operator)} />
                ) : (
                  icon("portefeuille")
                )
              }
              tone={lastPaid?.method === "mobile_money" ? undefined : "t-c1"}
              title={
                lastPaid?.method === "mobile_money" && lastPaid.operator
                  ? opName(lastPaid.operator)
                  : t("abonnement.method.title")
              }
              text={
                lastPaid?.method === "mobile_money"
                  ? [localMask(lastPaid.msisdnMasked ?? ""), t("talentW4.billing.methodDefault")]
                      .filter(Boolean)
                      .join(" · ")
                  : (method ?? t("abonnement.method.none"))
              }
            />
          </ul>
          <p className="t-gar">
            <TalentIcon name="horloge" size="s" />
            <span>{t("abonnement.note")}</span>
          </p>
        </div>
        <div className="t-w4-col">
          <div className="t-w4-sec">
            <h2>{t("abonnement.invoices.title")}</h2>
            <Link href="/app/abonnement/factures">{t("talentW4.billing.invoicesAll")}</Link>
          </div>
          {recent.length > 0 ? (
            <InvoiceRows invoices={recent} />
          ) : (
            <p className="t-gar">
              <TalentIcon name="document" size="s" />
              <span>{t("talentW4.billing.invoicesNone")}</span>
            </p>
          )}
        </div>
      </div>

      {licenses.map((item) => (
        <Sheet
          key={item.id}
          id={`licence-${item.id}`}
          title={t("sponsored.card.title", { sponsorName: item.sponsorName })}
          // Just activated: the sponsor's data question is asked at once.
          defaultOpen={item.id === activated?.id}
          closeLabel={t("formules.close")}
        >
          <p className="t-vide-t">
            {item.pending
              ? t("sponsored.pending.text", {
                  sponsorName: item.sponsorName,
                  plan: item.planName,
                  currentPlan: plan.planName,
                })
              : t("sponsored.card.free")}
          </p>
          <p className="t-gar">
            <TalentIcon name="confidentialite" size="s" />
            <span>{t("sponsored.card.privacy", { sponsorName: item.sponsorName })}</span>
          </p>
          <b>{t("sponsored.consent.title", { sponsorName: item.sponsorName })}</b>
          <p className="t-vide-t">
            {t("sponsored.consent.text", {
              sponsorName: item.sponsorName,
              dataDescription: t("sponsored.consent.dataDescription"),
              purpose: t("sponsored.consent.purpose"),
            })}
          </p>
          {item.consentAsked && (
            <p className="t-vide-t">
              {item.consented
                ? t("sponsored.consent.status.accepted")
                : t("sponsored.consent.status.declined")}
            </p>
          )}
          <form action={outcomeConsentAction} className="t-bts">
            <input type="hidden" name="licenseId" value={item.id} />
            <button type="submit" name="answer" value="decline" className="t-bt t-sec t-m t-press">
              {t("sponsored.consent.decline")}
            </button>
            <button
              type="submit"
              name="answer"
              value="accept"
              className="t-bt t-p t-m t-pl t-press"
            >
              {t("sponsored.consent.accept")}
            </button>
          </form>
          <p className="t-aide-c">{t("sponsored.consent.withdraw")}</p>
        </Sheet>
      ))}
    </div>
  );
}
