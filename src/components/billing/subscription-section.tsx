import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { PlanFamily } from "@/generated/prisma/client";
import { Icon, type IconName } from "@/components/brand/icon";
import { Character } from "@/components/brand/character";
import { Alert, Badge, Button, ButtonLink, TextField, type BadgeTone } from "@/components/ui";
import { quotaRows } from "@/config/quotas";
import { dynamic, numbered } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { formatDate, formatShortDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { paymentMethodKey } from "@/lib/payment-method";
import {
  cancelSubscription,
  downgradeSubscription,
  resumeSubscription,
  saveBillingDetailsAction,
} from "@/server/actions/billing";
import { db } from "@/server/db";
import { parseLimit, resolvePlan, usage, type Subject } from "@/server/entitlements";
import { effectiveStatus, GRACE_DAYS } from "@/server/entitlements/periods";
import { liveSubscription, paymentHistory } from "@/server/services/subscriptions";

const DAY = 86_400_000;
/** How long « Vous êtes revenu à Free » stays on the page after a paid plan ended. */
const BACK_TO_FREE_DAYS = 30;

async function capacityUsed(subject: Subject, key: string): Promise<number> {
  if (subject.type !== "organization") return 0;
  if (key === "org.seats") {
    return db.membership.count({ where: { organizationId: subject.id, status: "active" } });
  }
  if (key === "jobs.active.max") {
    return db.job.count({ where: { organizationId: subject.id, status: "published" } });
  }
  return 0;
}

/** Lime check in a round disc, before a reassuring line (mockup 05-02). */
function CheckDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex size-6 shrink-0 items-center justify-center rounded-full bg-lime text-sapin",
        className,
      )}
    >
      <Icon name="check" className="size-3.5" />
    </span>
  );
}

/** « Candidater reste gratuit… » band, shown at the top of the page and in the cancel panel. */
export function ApplyFreeBand({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 rounded-[16px] bg-lime-clair px-[18px] py-3 text-[13px] leading-[19px] font-medium">
      <CheckDot />
      <span className="pt-0.5">{children}</span>
    </p>
  );
}

const cardClass = "rounded-[24px] bg-blanc p-5 lg:p-6";

/**
 * One subscription (the person's, or their organization's), as in mockup 05-02: the current plan
 * on Sapin with its days-left ring, the quotas, the plan change, the invoice details and the
 * payment history. Everything shown is read from the database and the entitlements.
 */
export async function SubscriptionSection({
  subject,
  family,
  families,
  heading,
  cancelOpen = false,
}: {
  subject: Subject;
  /** Family used to find who pays (talent, or an organization family). */
  family: PlanFamily;
  families: PlanFamily[];
  heading?: string;
  /** « Résilier » was chosen: the cancel panel is open (`?resilier=<family>`). */
  cancelOpen?: boolean;
}) {
  const tAll = await getTranslations();
  const d = dynamic(tAll);
  const t = await getTranslations("billing");
  const tCheckout = await getTranslations("checkout");
  const tRenewal = await getTranslations("renewal.banner");
  const tQuota = await getTranslations("quota.warn");
  const tDown = await getTranslations("downgradeFree");
  const now = new Date();
  const plan = await resolvePlan(db, subject, now);
  if (!plan) return null;
  const current = await liveSubscription(db, subject, now);
  const status = current ? effectiveStatus(current, now) : null;
  const daysLeft = current
    ? Math.max(0, Math.ceil((current.currentPeriodEnd.getTime() - now.getTime()) / DAY))
    : 0;
  const periodDays = current
    ? Math.max(
        1,
        Math.round(
          (current.currentPeriodEnd.getTime() - current.currentPeriodStart.getTime()) / DAY,
        ),
      )
    : 1;

  const gauges = await Promise.all(
    quotaRows
      .filter((row) => row.key in plan.values)
      .map(async (row) => {
        const max = parseLimit(plan.values[row.key]);
        const used =
          row.kind === "quota"
            ? (await usage(db, subject, row.key, now)).used
            : await capacityUsed(subject, row.key);
        return { ...row, max, used };
      }),
  );

  const where = { subjectType: subject.type, subjectId: subject.id };
  const [plans, history, details, lastPaid, lastOwn] = await Promise.all([
    db.plan.findMany({
      where: { family: { in: families }, active: true, isPublic: true },
      orderBy: [{ sortOrder: "asc" }],
    }),
    paymentHistory(db, subject),
    db.billingDetails.findUnique({
      where: { subjectType_subjectId: { subjectType: subject.type, subjectId: subject.id } },
    }),
    db.payment.findFirst({
      where: { ...where, status: "succeeded" },
      orderBy: { createdAt: "desc" },
      select: { method: true, operator: true, msisdnMasked: true },
    }),
    current
      ? null
      : db.subscription.findFirst({
          where: { ...where, source: { not: "license" }, status: { not: "trialing" } },
          orderBy: { currentPeriodEnd: "desc" },
          include: { plan: true },
        }),
  ]);
  const freePlan = plans.find((item) => item.priceCents === 0);
  const prefix = `billing-${subject.type}`;
  const renewHref = current
    ? `/app/abonnement/payer?forfait=${current.pendingPlan?.code ?? current.plan.code}`
    : "";
  const cancelHref = `/app/abonnement?resilier=${family}#resilier-${family}`;
  const currentPrice = plan.priceCents ?? 0;
  const statusKey =
    status === "past_due"
      ? "pastDue"
      : status === "trialing" || status === "canceled" || status === "sponsored"
        ? status
        : "active";
  const statusTone: Record<typeof statusKey, BadgeTone> = {
    active: "lime",
    trialing: "new",
    pastDue: "warning",
    canceled: "white",
    sponsored: "lime",
  };
  const canCancel = !!current && status !== "trialing" && status !== "canceled";
  const opName = (code: string | null) =>
    code && d.has(`checkout.mm.operators.${code}`) ? d(`checkout.mm.operators.${code}`) : "";
  const methodText = lastPaid
    ? lastPaid.method === "card"
      ? tCheckout("method.card.text")
      : lastPaid.method === "mobile_money"
        ? t("current.method.mobileMoney", {
            operator: opName(lastPaid.operator),
            maskedNumber: lastPaid.msisdnMasked ?? "",
          })
        : t(`history.method.${paymentMethodKey[lastPaid.method] as "bankTransfer" | "cash"}`)
    : null;

  // Features of the plan in force, from its texts (`contentKey`), never from its name.
  const limitValue = (key: string) => parseLimit(plan.values[key]);
  const features = numbered(d, `${plan.contentKey}.f`, {
    price: formatUsd(currentPrice),
    seats: limitValue("org.seats") || limitValue("org.seats.min"),
    jobs: limitValue("jobs.active.max"),
  });

  // The first quota past 80 % (but not reached) gets the warning band of mockup 05-02.
  const warned = gauges.find(
    (gauge) => gauge.max > 0 && gauge.used >= gauge.max * 0.8 && gauge.used < gauge.max,
  );
  const backToFree =
    !current &&
    plan.status === "free" &&
    lastOwn &&
    (lastOwn.plan.priceCents ?? 0) > 0 &&
    effectiveStatus(lastOwn, now) === "expired" &&
    now.getTime() - lastOwn.currentPeriodEnd.getTime() < BACK_TO_FREE_DAYS * DAY
      ? lastOwn
      : null;

  const infoRow = (icon: IconName, text: string) => (
    <p className="flex items-start gap-2">
      <Icon name={icon} className="mt-px size-4 shrink-0 text-feuille" />
      <span>{text}</span>
    </p>
  );

  return (
    <section className="flex flex-col gap-5" aria-label={heading ?? t("current.title")}>
      {heading && <h2 className="text-[22px] font-semibold tracking-tight">{heading}</h2>}
      {current && status === "past_due" && (
        <Alert
          tone="warning"
          title={tRenewal("grace.text", {
            plan: current.plan.name,
            graceEndDate: formatDate(
              new Date(current.currentPeriodEnd.getTime() + GRACE_DAYS * DAY),
            ),
          })}
          action={<ButtonLink href={renewHref}>{t("current.renew")}</ButtonLink>}
        />
      )}
      {current && status === "active" && daysLeft <= 7 && !current.pendingPlan && (
        <Alert
          title={
            daysLeft === 0
              ? tRenewal("today", { plan: current.plan.name })
              : tRenewal("upcoming", {
                  plan: current.plan.name,
                  days: daysLeft,
                  date: formatDate(current.currentPeriodEnd),
                })
          }
          action={<ButtonLink href={renewHref}>{t("current.renew")}</ButtonLink>}
        />
      )}

      {backToFree && (
        <div
          className={cx(cardClass, "jm-rise flex flex-col gap-3 lg:p-[26px]")}
          aria-labelledby={`${prefix}-back`}
        >
          <div className="flex items-end gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <h3 id={`${prefix}-back`} className="text-xl font-semibold tracking-tight">
                {tDown("title", { freePlan: freePlan?.name ?? "" })}
              </h3>
              <p className="text-[13.5px] leading-5">
                {tDown("text", { plan: backToFree.plan.name })}
              </p>
            </div>
            <span className="jm-float hidden shrink-0 sm:block">
              <Character name="amani" pose="repos" height={150} />
            </span>
          </div>
          <div className="flex flex-col gap-1.5 rounded-[16px] bg-lime-clair p-3.5">
            <p className="flex items-center gap-2 text-[13px] font-semibold">
              <Icon name="check" className="size-4 text-up-texte" />
              {tDown("kept.title")}
            </p>
            <p className="text-xs leading-4">
              {subject.type === "organization" ? tDown("kept.org") : tDown("kept.talent")}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 rounded-[16px] bg-creme p-3.5">
            <p className="flex items-center gap-2 text-[13px] font-semibold">
              <Icon name="pause" className="size-4" />
              {tDown("paused.title")}
            </p>
            <p className="text-xs leading-4">
              {subject.type === "organization"
                ? tDown("paused.org", {
                    jobs: limitValue("jobs.active.max"),
                    seats: limitValue("org.seats"),
                  })
                : tDown("paused.talent", { plan: backToFree.plan.name })}
            </p>
          </div>
          <p className="flex items-center gap-2 text-[13px] font-medium">
            <Icon name="jobs" className="size-4 text-feuille-fonce" />
            {tDown("applyFree")}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {backToFree.plan.isPurchasable && backToFree.plan.active && (
              <ButtonLink href={`/app/abonnement/payer?forfait=${backToFree.plan.code}`}>
                {tDown("cta", { plan: backToFree.plan.name })}
              </ButtonLink>
            )}
            <ButtonLink href="/app" variant="tertiary">
              {tDown("secondary", { freePlan: freePlan?.name ?? "" })}
            </ButtonLink>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        {/* Current plan: white card with the days-left ring (Admin v4: light palette). */}
        <div className="relative isolate flex flex-col gap-3.5 overflow-hidden rounded-[22px] border border-sapin/8 bg-blanc p-5 text-sapin lg:px-6 lg:py-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-ardoise">{t("current.title")}</p>
            {current ? (
              <Badge tone={statusTone[statusKey]}>
                {t(`current.status.${statusKey}`, {
                  endDate: formatDate(current.currentPeriodEnd),
                })}
              </Badge>
            ) : (
              plan.status === "sponsored" && (
                <Badge tone="lime">{t("current.status.sponsored")}</Badge>
              )
            )}
          </div>
          <div className="flex items-center gap-5">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-[26px] leading-[1.1] font-semibold tracking-[-0.02em] lg:text-[30px]">
                {t("current.plan", { plan: plan.planName })}
              </p>
              <p className="text-[15px] font-semibold text-feuille-fonce">
                {current
                  ? t("current.price", { price: formatUsd(current.plan.priceCents ?? 0) })
                  : currentPrice > 0
                    ? t("current.price", { price: formatUsd(currentPrice) })
                    : t("current.free")}
              </p>
            </div>
            {current && (
              <div aria-hidden className="relative size-[64px] shrink-0 lg:size-[76px]">
                <svg viewBox="0 0 96 96" className="size-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="43.5"
                    fill="none"
                    stroke="var(--color-gris-clair)"
                    strokeWidth="9"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="43.5"
                    fill="none"
                    stroke="var(--color-feuille)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={`${Math.min(1, daysLeft / periodDays)} 1`}
                    className="jm-ring-arc"
                  />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-sm font-semibold lg:text-base">
                  {t("current.ring", { days: daysLeft })}
                </span>
              </div>
            )}
          </div>
          {current ? (
            <div className="flex flex-col gap-2 text-[13px] text-ardoise">
              {infoRow(
                "calendrier",
                t("current.period", {
                  startDate: formatDate(current.currentPeriodStart),
                  endDate: formatDate(current.currentPeriodEnd),
                }),
              )}
              {infoRow(
                "horloge",
                t("current.nextRenewalDays", {
                  date: formatDate(current.currentPeriodEnd),
                  days: daysLeft,
                }),
              )}
              {methodText &&
                infoRow("mobile-money", t("current.method.text", { method: methodText }))}
            </div>
          ) : (
            plan.status !== "sponsored" && (
              <div className="flex flex-col gap-1.5">
                <p className="font-semibold">{t("current.freeTitle")}</p>
                <p className="text-[13px] leading-5 text-ardoise">{t("current.freeText")}</p>
              </div>
            )
          )}
          {current?.pendingPlan && (
            <form
              action={downgradeSubscription}
              className="flex flex-wrap items-center gap-3 rounded-[16px] bg-creme px-4 py-3 text-[13px]"
            >
              <input type="hidden" name="family" value={family} />
              <input type="hidden" name="plan" value="" />
              <span className="flex-1">
                {t("current.scheduled.text", {
                  plan: current.pendingPlan.name,
                  date: formatDate(current.currentPeriodEnd),
                })}
              </span>
              <Button type="submit" variant="tertiary" size="sm">
                {t("current.scheduled.cancel")}
              </Button>
            </form>
          )}
          <div className="mt-1 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            {current ? (
              <>
                {status !== "trialing" && (
                  <ButtonLink href={renewHref} icon={<Icon name="check" />}>
                    {t("current.renew")}
                  </ButtonLink>
                )}
                <ButtonLink href={`#${prefix}-change`} variant="tertiary">
                  {t("current.change")}
                </ButtonLink>
                {status === "canceled" ? (
                  <form action={resumeSubscription} className="flex">
                    <input type="hidden" name="family" value={family} />
                    <Button type="submit" variant="tertiary" className="w-full">
                      {t("current.resume")}
                    </Button>
                  </form>
                ) : (
                  canCancel && (
                    <Link
                      href={cancelHref}
                      className="inline-flex h-10 items-center justify-center rounded-pill px-[18px] text-[13px] font-semibold text-sapin hover:bg-creme"
                    >
                      {t("current.cancel")}
                    </Link>
                  )
                )}
              </>
            ) : (
              plan.status !== "sponsored" && (
                <ButtonLink href={`#${prefix}-change`}>{t("current.freeCta")}</ButtonLink>
              )
            )}
          </div>
          <div className="flex-1" />
          {features.length > 0 && (
            <div className="flex flex-col gap-2.5 rounded-[16px] bg-creme px-4 py-3">
              <p className="text-xs font-medium text-ardoise">{t("current.includes")}</p>
              <ul className="flex flex-wrap gap-1.5">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-pill bg-blanc px-3 py-1.5 text-[11px] leading-4 font-medium ring-1 ring-brume ring-inset"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Quotas. */}
        <div className={cx(cardClass, "flex flex-col gap-4")}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <h3 className="text-xl font-semibold tracking-tight">{t("quotas.title")}</h3>
              <p className="text-[13px] text-ardoise">
                {t("quotas.subtitle", { resetDate: formatDate(plan.periodEnd) })}
              </p>
            </div>
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-creme"
            >
              <Icon name="statistiques" className="size-[18px]" />
            </span>
          </div>
          {warned && (
            <div className="flex items-start gap-2.5 rounded-[14px] bg-ambre-fond px-3.5 py-2.5 text-ambre-texte">
              <Icon name="notification" className="mt-px size-[18px] shrink-0" />
              <div className="flex flex-col">
                <p className="text-[13px] font-semibold">{tQuota("title")}</p>
                <p className="text-xs">
                  {tQuota("text", {
                    left: warned.max - warned.used,
                    limit: warned.max,
                    quotaName: t(`quotas.${warned.label}`),
                    resetDate: formatDate(plan.periodEnd),
                  })}
                </p>
              </div>
            </div>
          )}
          <ul className="flex flex-col gap-4">
            {gauges.map((gauge) => {
              const label = t(`quotas.${gauge.label}`);
              if (gauge.max === 0 || gauge.max < 0) {
                return (
                  <li key={gauge.key} className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-medium">{label}</span>
                    <Badge tone="neutral">
                      {gauge.max < 0 ? t("quotas.unlimited") : t("quotas.none")}
                    </Badge>
                  </li>
                );
              }
              const ratio = Math.min(1, gauge.used / gauge.max);
              const left = Math.max(0, gauge.max - gauge.used);
              const reached = gauge.used >= gauge.max;
              const high = ratio >= 0.8;
              return (
                <li key={gauge.key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-medium">{label}</span>
                    {reached ? (
                      <Badge tone="error" className="h-[22px]">
                        {t("quotas.reached")}
                      </Badge>
                    ) : high ? (
                      <Badge tone="warning" className="h-[22px]">
                        {t("quotas.left", { count: left })}
                      </Badge>
                    ) : (
                      <span className="text-xs text-ardoise">
                        {t("quotas.left", { count: left })}
                      </span>
                    )}
                  </div>
                  <span
                    role="progressbar"
                    aria-label={t("quotas.gaugeLabel", {
                      name: label,
                      used: gauge.used,
                      limit: gauge.max,
                    })}
                    aria-valuemin={0}
                    aria-valuemax={gauge.max}
                    aria-valuenow={Math.min(gauge.used, gauge.max)}
                    className="block h-2 overflow-hidden rounded-pill bg-brume"
                  >
                    <span
                      className={cx(
                        "jm-fill block h-full rounded-pill",
                        reached ? "bg-corail" : high ? "bg-ambre" : "bg-feuille",
                      )}
                      style={{ width: `${Math.max(ratio * 100, 0)}%` }}
                    />
                  </span>
                  <span className="text-xs text-ardoise">
                    {t("quotas.usage", { used: gauge.used, limit: gauge.max })}
                  </span>
                </li>
              );
            })}
            <li className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium">{t("quotas.applications")}</span>
              <Badge tone="lime" icon={<Icon name="check" />}>
                {t("quotas.applicationsValue")}
              </Badge>
            </li>
          </ul>
          <p className="text-xs leading-4 text-ardoise">{t("quotas.help")}</p>
        </div>
      </div>

      {cancelOpen && canCancel && current && (
        <form
          id={`resilier-${family}`}
          action={cancelSubscription}
          aria-labelledby={`${prefix}-cancel`}
          className={cx(
            cardClass,
            "jm-rise flex scroll-mt-24 flex-col gap-3.5 shadow-[0_24px_60px_rgb(11_26_31/0.16)] lg:max-w-[620px] lg:p-[26px]",
          )}
        >
          <input type="hidden" name="family" value={family} />
          <div className="flex items-start justify-between gap-3">
            <h3 id={`${prefix}-cancel`} className="text-xl font-semibold tracking-tight">
              {t("cancel.title", { plan: current.plan.name })}
            </h3>
            <Link
              href="/app/abonnement"
              aria-label={tAll("a11y.close")}
              className="touch-target flex size-8 shrink-0 items-center justify-center rounded-full bg-creme hover:bg-brume"
            >
              <Icon name="fermer" className="size-[15px]" />
            </Link>
          </div>
          <p className="text-[13.5px] leading-5">
            {t("cancel.text", {
              endDate: formatDate(current.currentPeriodEnd),
              freePlan: freePlan?.name ?? "",
            })}
          </p>
          <ApplyFreeBand>{t("applyFree")}</ApplyFreeBand>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <ButtonLink href="/app/abonnement" variant="secondary">
              {t("cancel.keep")}
            </ButtonLink>
            <Button type="submit" variant="tertiary">
              {t("cancel.confirm")}
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* Plan change. */}
        <div
          id={`${prefix}-change`}
          className={cx(cardClass, "flex min-w-0 scroll-mt-24 flex-col gap-4")}
        >
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div className="flex flex-col">
              <h3 className="text-xl font-semibold tracking-tight">{t("change.title")}</h3>
              <p className="text-[13px] text-ardoise">{t("change.subtitle")}</p>
            </div>
            <Link
              href="/tarifs"
              className="inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold whitespace-nowrap text-feuille-fonce hover:underline"
            >
              {tAll("common.seePlans")}
              <Icon name="chev-r" className="size-3.5" />
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((item) => {
              const price = item.priceCents;
              const isCurrent = item.id === plan.planId;
              const action = isCurrent ? (
                <span className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-pill bg-lime-clair text-xs font-semibold text-up-texte">
                  <Icon name="check" className="size-3.5" />
                  {t("change.current")}
                </span>
              ) : price === null ? (
                <ButtonLink href="/contact?sujet=devis" variant="tertiary" size="sm" fullWidth>
                  {t("change.quote")}
                </ButtonLink>
              ) : price > currentPrice && item.isPurchasable ? (
                <ButtonLink href={`/app/abonnement/payer?forfait=${item.code}`} size="sm" fullWidth>
                  {t("change.upgrade", { plan: item.name })}
                </ButtonLink>
              ) : price > 0 && current && item.isPurchasable ? (
                <form action={downgradeSubscription}>
                  <input type="hidden" name="family" value={family} />
                  <input type="hidden" name="plan" value={item.code} />
                  <Button type="submit" variant="tertiary" size="sm" fullWidth>
                    {t("change.downgrade", { plan: item.name })}
                  </Button>
                </form>
              ) : price === 0 && canCancel ? (
                // Back to the free plan = cancelling at the end of the paid period.
                <ButtonLink href={cancelHref} variant="tertiary" size="sm" fullWidth>
                  {t("change.downgrade", { plan: item.name })}
                </ButtonLink>
              ) : (
                <span className="text-center text-xs text-ardoise">{t("change.unavailable")}</span>
              );
              return (
                <li
                  key={item.id}
                  className={cx(
                    "flex min-w-0 flex-col gap-2.5 rounded-[20px] bg-blanc p-4 ring-inset",
                    isCurrent ? "ring-2 ring-sapin" : "ring-[1.5px] ring-brume",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-semibold">{item.name}</span>
                    {item.recommended && (
                      <Badge tone="sapin">{tAll("signup.plan.recommended")}</Badge>
                    )}
                  </span>
                  <span className="text-lg font-semibold tracking-[-0.02em]">
                    {price === null
                      ? t("upgrade.summary.price")
                      : price === 0
                        ? t("current.free")
                        : t("current.price", { price: formatUsd(price) })}
                  </span>
                  <span className="mt-auto">{action}</span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs leading-4 text-ardoise">{t("change.note")}</p>
        </div>

        {/* Invoice details. */}
        <form
          action={saveBillingDetailsAction}
          className={cx(cardClass, "flex flex-col gap-3 lg:p-[22px]")}
          aria-labelledby={`${prefix}-details`}
        >
          <div className="flex flex-col">
            <h3 id={`${prefix}-details`} className="text-base font-semibold tracking-tight">
              {t("invoiceDetails.title")}
            </h3>
            <p className="text-xs text-ardoise">{t("invoiceDetails.text")}</p>
          </div>
          <input type="hidden" name="family" value={family} />
          <TextField
            id={`${prefix}-name`}
            name="name"
            required
            maxLength={160}
            defaultValue={details?.name ?? ""}
            label={t("invoiceDetails.name.label")}
          />
          <TextField
            id={`${prefix}-address`}
            name="address"
            maxLength={400}
            defaultValue={details?.address ?? ""}
            label={t("invoiceDetails.address.label")}
          />
          {subject.type === "organization" && (
            <TextField
              id={`${prefix}-tax`}
              name="taxId"
              maxLength={60}
              defaultValue={details?.taxId ?? ""}
              label={t("invoiceDetails.taxId.label")}
              hint={t("invoiceDetails.taxId.help")}
            />
          )}
          <TextField
            id={`${prefix}-email`}
            name="email"
            type="email"
            maxLength={200}
            defaultValue={details?.email ?? ""}
            label={t("invoiceDetails.email.label")}
          />
          <Button type="submit" variant="secondary" className="self-start">
            {t("invoiceDetails.save")}
          </Button>
          <p className="text-xs text-ardoise">
            {t("help.text", {
              email: subject.type === "organization" ? t("help.emailPro") : t("help.emailPersonal"),
            })}
          </p>
        </form>
      </div>

      {/* Payment history: a table on a wide screen, one block per payment on a phone. */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xl font-semibold tracking-tight">{t("history.title")}</h3>
          {history.some((payment) => payment.invoice) && (
            <p className="text-xs text-ardoise">{t("history.pdfNote")}</p>
          )}
        </div>
        {history.length === 0 ? (
          <p className={cx(cardClass, "text-sm text-ardoise")}>{t("history.empty")}</p>
        ) : (
          <div role="table" aria-label={t("history.title")} className="rounded-[24px] bg-blanc">
            <div role="rowgroup" className="hidden lg:block">
              <div
                role="row"
                className="grid grid-cols-[120px_1.7fr_1.2fr_100px_120px_1fr] gap-3 px-[18px] pt-4 pb-2.5 text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-ardoise uppercase"
              >
                <span role="columnheader">{t("history.col.date")}</span>
                <span role="columnheader">{t("history.col.description")}</span>
                <span role="columnheader">{t("history.col.method")}</span>
                <span role="columnheader">{t("history.col.amount")}</span>
                <span role="columnheader">{t("history.col.status")}</span>
                <span role="columnheader">{t("history.col.invoice")}</span>
              </div>
            </div>
            <div role="rowgroup">
              {history.map((payment, index) => {
                const statusName = payment.status === "succeeded" ? "paid" : payment.status;
                const tone: BadgeTone =
                  payment.status === "succeeded"
                    ? "success"
                    : payment.status === "failed"
                      ? "error"
                      : payment.status === "pending"
                        ? "warning"
                        : "neutral";
                return (
                  <div
                    key={payment.id}
                    role="row"
                    className={cx(
                      "grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3.5 text-[13px] lg:min-h-14 lg:grid-cols-[120px_1.7fr_1.2fr_100px_120px_1fr] lg:gap-y-0 lg:px-[18px] lg:py-1.5",
                      index > 0 && "border-t border-brume",
                      index === 0 && "lg:border-t lg:border-brume",
                    )}
                  >
                    <span role="cell" className="font-semibold lg:font-medium">
                      {formatShortDate(payment.createdAt)}
                    </span>
                    <span
                      role="cell"
                      className="col-start-1 row-start-2 text-xs lg:col-auto lg:row-auto lg:text-[13px]"
                    >
                      {t("history.description", {
                        plan: payment.plan.name,
                        startDate: formatDate(payment.periodStart),
                        endDate: formatDate(payment.periodEnd),
                      })}
                    </span>
                    <span
                      role="cell"
                      className="col-start-1 row-start-3 text-xs text-ardoise lg:col-auto lg:row-auto lg:text-[13px]"
                    >
                      {payment.method === "mobile_money"
                        ? t("history.method.mobileMoney", {
                            operator: opName(payment.operator),
                          })
                        : t(
                            `history.method.${paymentMethodKey[payment.method] as "card" | "bankTransfer" | "cash"}`,
                          )}
                    </span>
                    <span
                      role="cell"
                      className="col-start-2 row-start-1 text-right font-semibold lg:col-auto lg:row-auto lg:text-left"
                    >
                      {tCheckout("summary.amount", { amount: formatUsd(payment.amountCents) })}
                    </span>
                    <span
                      role="cell"
                      className="col-start-2 row-start-2 justify-self-end lg:col-auto lg:row-auto lg:justify-self-start"
                    >
                      <Badge tone={tone}>{t(`history.status.${statusName}`)}</Badge>
                    </span>
                    <span
                      role="cell"
                      className="col-start-2 row-start-3 justify-self-end lg:col-auto lg:row-auto lg:justify-self-start"
                    >
                      {payment.invoice ? (
                        <a
                          href={`/app/abonnement/factures/${payment.invoice.id}/pdf`}
                          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-feuille-fonce hover:underline"
                          aria-label={t("history.downloadAlt", {
                            number: payment.invoice.number,
                          })}
                        >
                          <span className="flex size-9 items-center justify-center rounded-full bg-creme lg:size-auto lg:bg-transparent">
                            <Icon name="telecharger" className="size-4" />
                          </span>
                          <span className="hidden lg:inline">{t("history.download")}</span>
                        </a>
                      ) : null}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
