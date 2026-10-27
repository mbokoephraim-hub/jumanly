import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { AiOrb, Icon, type IconName } from "@/components/brand";
import { HeaderAction } from "@/components/app/header-action";
import { AdminPageHeader, adminCard, adminTitle, FilterMenu, Tag } from "@/components/admin/kit";
import { Alert, ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { requireAdmin, requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  DASHBOARD_PERIODS,
  dashboardData,
  type DashboardPeriod,
  type FamilyKey,
} from "@/server/services/admin-dashboard";
import {
  activeAccounts,
  attentionItems,
  type AttentionKind,
  costIndicators,
  planListHref,
  planUsage,
} from "@/server/services/admin-insights";

/** Text key of each AI feature in `admin.ai.usage.feature.*`; the others are « Autres ». */
type AiFeatureText =
  | "cvCoach"
  | "interviewText"
  | "cvParse"
  | "documents"
  | "linkedin"
  | "diagnostic"
  | "jobDraft"
  | "learnCoach"
  | "orbiChat";
const aiFeature: Record<string, AiFeatureText> = {
  cv_coach: "cvCoach",
  cv_tailor: "cvCoach",
  interview_questions: "interviewText",
  interview_feedback: "interviewText",
  cv_parse: "cvParse",
  career_document: "documents",
  proofread: "documents",
  linkedin: "linkedin",
  diagnostic: "diagnostic",
  diagnostic_followup: "diagnostic",
  job_writer: "jobDraft",
  learn_coach: "learnCoach",
  orbi_chat: "orbiChat",
  chat_summary: "orbiChat",
};

const familyTone: Record<FamilyKey, string> = {
  talent: "bg-lime",
  rh: "bg-neon",
  company: "bg-sapin",
  partner: "bg-menthe",
};
// Admin v3: the share bars take the family color as a gradient.
const familyBar: Record<FamilyKey, string> = {
  talent: "bg-linear-to-r from-neon via-lime to-feuille",
  rh: "bg-linear-to-r from-[#f4fbc0] to-neon",
  company: "bg-linear-to-r from-ia to-sapin",
  partner: "bg-linear-to-r from-menthe-claire to-menthe",
};

const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const signed = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${number.format(Math.abs(value))}`;

type Delta = { value: number; kind: "percent" | "points"; lowerIsBetter?: boolean };

type Kpi = {
  key:
    | "activeUsers"
    | "usersFree"
    | "usersPaid"
    | "usersSponsored"
    | "conversion"
    | "mrr"
    | "renewal"
    | "aiCost"
    | "activeCompanies"
    | "institutionalRevenue";
  value: string;
  icon: IconName;
  disc: string;
  delta?: Delta;
};

const DAY_MS = 86_400_000;

const attentionIcon: Record<AttentionKind, IconName> = {
  payments: "mobile-money",
  reports: "securite",
  disputes: "intelligence",
  verifications: "entreprise",
  jobs: "jobs",
  aiSpike: "alerte",
  expiring: "horloge",
};

/** Change between two values, as a percentage of the previous one (null when there is none). */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Indicateurs (mockup 07-01): the platform's health over a period, compared with the period before,
 * the activity month by month, what is waiting, and the split by family and plan.
 */
export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  await connection();
  if (!(await requireAdmin())) {
    // Content editors land on the courses, the only part of the admin they use.
    if (await requireCourseEditor()) redirect("/admin/formations");
    notFound();
  }
  const t = await getTranslations("admin");
  const days = (DASHBOARD_PERIODS.find((value) => String(value) === params.periode) ??
    30) as DashboardPeriod;
  const compare = params.comparer !== "0";
  const href = (next: { periode?: number; comparer?: boolean }) => {
    const query = new URLSearchParams();
    const period = next.periode ?? days;
    if (period !== 30) query.set("periode", String(period));
    if (!(next.comparer ?? compare)) query.set("comparer", "0");
    const text = query.toString();
    return text ? `/admin?${text}` : "/admin";
  };
  const today = new Date();
  const data = await dashboardData(db, today, days);
  const { current: now, previous: before, revenue, revenueBefore } = data;
  const none = t("dashboard.kpi.none");
  const usd = (cents: number) =>
    t("dashboard.kpi.value.currency", { amount: formatUsd(cents), currency: "USD" });
  const percent = (value: number | null) =>
    value === null ? t("dashboard.kpi.none") : t("dashboard.kpi.value.percent", { value });
  const pointsDelta = (a: number | null, b: number | null): Delta | undefined =>
    a === null || b === null ? undefined : { value: a - b, kind: "points" };
  const pct = (a: number, b: number, lowerIsBetter = false): Delta | undefined => {
    const value = percentChange(a, b);
    return value === null ? undefined : { value, kind: "percent", lowerIsBetter };
  };

  const [usage, attention, activeNow, activeBefore] = await Promise.all([
    planUsage(db, today, days),
    attentionItems(db, today),
    activeAccounts(db, new Date(today.getTime() - days * DAY_MS), today),
    activeAccounts(
      db,
      new Date(today.getTime() - 2 * days * DAY_MS),
      new Date(today.getTime() - days * DAY_MS),
    ),
  ]);
  const costs = await costIndicators(db, today, days, revenue.revenueCents, revenue.aiCostMicroUsd);

  // The four figures that say how Jumanly is doing, then the others.
  const hero: Kpi[] = [
    {
      key: "activeUsers",
      value: number.format(activeNow),
      icon: "profil",
      disc: "bg-neon",
      delta: pct(activeNow, activeBefore),
    },
    {
      key: "mrr",
      value: usd(now.mrrCents),
      icon: "mobile-money",
      disc: "bg-lime-clair",
      delta: pct(now.mrrCents, before.mrrCents),
    },
    {
      key: "conversion",
      value: percent(revenue.conversion),
      icon: "up",
      disc: "bg-[#ddf3eb]",
      delta: pointsDelta(revenue.conversion, revenueBefore.conversion),
    },
    {
      key: "aiCost",
      value: usd(Math.round(revenue.aiCostMicroUsd / 10_000)),
      icon: "intelligence",
      disc: "bg-[#fbf6c9]",
      delta: pct(revenue.aiCostMicroUsd, revenueBefore.aiCostMicroUsd, true),
    },
  ];
  const kpis: Kpi[] = [
    {
      key: "usersFree",
      value: number.format(now.usersFree),
      icon: "profil",
      disc: "bg-gris-clair",
      delta: pct(now.usersFree, before.usersFree),
    },
    {
      key: "usersPaid",
      value: number.format(now.usersPaid),
      icon: "portefeuille",
      disc: "bg-lime-clair",
      delta: pct(now.usersPaid, before.usersPaid),
    },
    {
      key: "usersSponsored",
      value: number.format(now.usersSponsored),
      icon: "certificat",
      disc: "bg-[#fbf6c9]",
      delta: pct(now.usersSponsored, before.usersSponsored),
    },
    {
      key: "renewal",
      value: percent(revenue.renewal),
      icon: "horloge",
      disc: "bg-[#fbf6c9]",
      delta: pointsDelta(revenue.renewal, revenueBefore.renewal),
    },
    {
      key: "activeCompanies",
      value: number.format(now.activeCompanies),
      icon: "entreprise",
      disc: "bg-[#fbf6c9]",
      delta: pct(now.activeCompanies, before.activeCompanies),
    },
    {
      key: "institutionalRevenue",
      value: usd(data.institutionalCents),
      icon: "certificat",
      disc: "bg-[#ddf3eb]",
      delta: pct(data.institutionalCents, data.institutionalBeforeCents),
    },
  ];

  const aiTotal = data.ai.byFeature.reduce((sum, row) => sum + row.calls, 0);
  const aiGroups = new Map<AiFeatureText | "other", number>();
  for (const row of data.ai.byFeature) {
    const key = aiFeature[row.key] ?? "other";
    aiGroups.set(key, (aiGroups.get(key) ?? 0) + row.calls);
  }
  const aiRows = [...aiGroups.entries()]
    .filter(([key]) => key !== "other")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const aiOther = aiTotal - aiRows.reduce((sum, [, calls]) => sum + calls, 0);
  const aiShare = (calls: number) => (aiTotal ? Math.round((100 * calls) / aiTotal) : 0);
  const attentionTotal = attention.reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      <AdminPageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.banner.subtitle", { days })}
        stats={[
          { label: t("dashboard.banner.attention"), value: number.format(attentionTotal) },
          { label: t("dashboard.kpi.activeUsers"), value: number.format(activeNow) },
          { label: t("dashboard.kpi.mrr"), value: usd(now.mrrCents) },
        ]}
        action={
          attention[0] && (
            <HeaderAction
              href={attention[0].href}
              icon="alerte"
              label={t("dashboard.attention.first", {
                item: t(`dashboard.attention.kind.${attention[0].kind}`, {
                  count: attention[0].count,
                }),
              })}
            />
          )
        }
      />
      {params.erreur === "lecture" && <Alert tone="warning" title={t("notAllowed")} />}

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <FilterMenu
          label={t("dashboard.periodValue", { days })}
          group="periode"
          options={DASHBOARD_PERIODS.map((value) => ({
            href: href({ periode: value }),
            label: t("dashboard.periodOption", { days: value }),
            current: value === days,
          }))}
          tone="sapin"
        />
        <Link
          href={href({ comparer: !compare })}
          role="switch"
          aria-checked={compare}
          className="flex items-center gap-2.5 text-[13px] font-medium"
        >
          <span
            aria-hidden
            className={cx(
              "relative inline-block h-[26px] w-11 shrink-0 rounded-pill transition-colors",
              compare ? "bg-sapin" : "bg-brume",
            )}
          >
            <i
              className={cx(
                "absolute top-[3px] size-5 rounded-full transition-[left]",
                compare ? "left-[21px] bg-lime" : "left-[3px] bg-blanc",
              )}
            />
          </span>
          {t("dashboard.compare")}
        </Link>
        <a
          href={`/admin/indicateurs.csv?periode=${days}`}
          download
          className="inline-flex h-10 items-center justify-center gap-2 rounded-pill bg-blanc px-[18px] text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40 lg:ml-auto"
        >
          <Icon name="telecharger" className="size-[15px]" />
          {t("dashboard.export")}
        </a>
      </div>

      {/* The four key figures. */}
      <ul
        aria-label={t("dashboard.hero")}
        className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3.5"
      >
        {hero.map((kpi, index) => (
          <li
            key={kpi.key}
            className={cx(
              "jm-admin-card flex min-w-0 flex-col gap-2 rounded-[24px] px-[18px] py-[18px] lg:px-[22px]",
              // Admin v3: the first figure stands on the signature gradient (Sapin text).
              index === 0 ? "jm-admin-feature" : "bg-blanc",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[12.5px] leading-4 font-semibold">
                {t(`dashboard.kpi.${kpi.key}`)}
              </span>
              <span
                aria-hidden
                className={cx(
                  "grid size-9 shrink-0 place-items-center rounded-full",
                  index === 0 ? "bg-blanc/70" : kpi.disc,
                )}
              >
                <Icon name={kpi.icon} className="size-[18px]" />
              </span>
            </div>
            <p
              className={cx(
                "font-semibold tracking-[-0.03em]",
                kpi.value === none
                  ? "py-1 text-[14px] leading-5 font-medium tracking-normal text-ardoise"
                  : "text-[26px] leading-8 lg:text-[32px] lg:leading-10",
              )}
            >
              {kpi.value}
            </p>
            {compare && kpi.delta && <DeltaTag delta={kpi.delta} />}
          </li>
        ))}
      </ul>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* What needs attention, the most urgent first. */}
        <section aria-labelledby="admin-alerts" className={cx(adminCard, "flex flex-col gap-1")}>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <h2 id="admin-alerts" className={adminTitle}>
                {t("dashboard.attention.title")}
              </h2>
              <p className="text-[11.5px] text-ardoise">{t("dashboard.attention.hint")}</p>
            </div>
            <Tag tone={attentionTotal > 0 ? "warning" : "success"}>
              {number.format(attentionTotal)}
            </Tag>
          </div>
          {attention.length === 0 ? (
            <p className="flex items-center gap-2.5 py-3 text-[13px] text-ardoise">
              <Icon name="valider" className="size-4 text-feuille" />
              {t("dashboard.alerts.empty")}
            </p>
          ) : (
            <ol className="flex flex-col">
              {attention.map((item, index) => (
                <li key={item.kind} className="border-gris-clair not-first:border-t">
                  <div className="flex items-start gap-3 py-3">
                    <span
                      aria-hidden
                      className={cx(
                        "grid size-10 shrink-0 place-items-center rounded-[14px] text-sapin",
                        index === 0 || item.overdue ? "bg-ambre-fond" : "jm-admin-tile",
                      )}
                    >
                      <Icon name={attentionIcon[item.kind]} className="size-[18px]" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="text-[13.5px] leading-[19px] font-semibold">
                        {t(`dashboard.attention.kind.${item.kind}`, { count: item.count })}
                      </p>
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] leading-4 text-ardoise">
                        {item.overdue && (
                          <Tag tone="error" className="h-5">
                            {t("dashboard.attention.overdue")}
                          </Tag>
                        )}
                        {item.kind !== "aiSpike" && item.kind !== "expiring" && (
                          <span>{t("dashboard.attention.oldest", { days: item.oldestDays })}</span>
                        )}
                      </p>
                      <details className="group/why text-[12px] leading-[17px]">
                        <summary className="w-fit cursor-pointer list-none font-semibold underline underline-offset-2 [&::-webkit-details-marker]:hidden">
                          {t("dashboard.attention.why")}
                        </summary>
                        <p className="mt-1.5 rounded-[10px] bg-creme px-3 py-2">
                          {t(`dashboard.attention.reason.${item.kind}`, item.why)}{" "}
                          {t("dashboard.attention.rank", { score: item.score })}
                        </p>
                      </details>
                    </div>
                    <Link
                      href={item.href}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill bg-sapin px-3.5 text-[12.5px] font-semibold text-blanc hover:bg-nuit"
                    >
                      {t("dashboard.attention.open")}
                      <Icon name="chev-r" className="size-3.5" />
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Costs and what they say. */}
        <section aria-labelledby="admin-costs" className={cx(adminCard, "flex flex-col gap-3")}>
          <div className="flex items-center justify-between gap-3">
            <h2 id="admin-costs" className={adminTitle}>
              {t("dashboard.costs.title")}
            </h2>
            <span aria-hidden className="grid size-9 place-items-center rounded-full bg-[#fbf6c9]">
              <Icon name="portefeuille" className="size-4" />
            </span>
          </div>
          <dl className="flex flex-col">
            {(
              [
                ["cac", costs.cacCents === null ? none : usd(costs.cacCents)],
                [
                  "costPerUser",
                  costs.costPerUserCents === null ? none : usd(costs.costPerUserCents),
                ],
                [
                  "grossMargin",
                  costs.grossMargin === null
                    ? none
                    : t("dashboard.kpi.value.percent", { value: costs.grossMargin }),
                ],
              ] as const
            ).map(([key, value]) => (
              <div
                key={key}
                className="flex items-baseline justify-between gap-3 border-gris-clair py-2.5 not-first:border-t"
              >
                <dt className="text-[12.5px] text-ardoise">{t(`dashboard.kpi.${key}`)}</dt>
                <dd
                  className={cx(
                    "text-right font-semibold",
                    value === none ? "text-[12.5px] font-medium text-ardoise" : "text-[17px]",
                  )}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-[11.5px] leading-4 text-ardoise">
            {costs.entered
              ? t("dashboard.costs.total", { amount: usd(costs.totalCents) })
              : t("dashboard.costs.empty")}
          </p>
          <ButtonLink href="/admin/indicateurs/couts" variant="secondary" size="sm">
            {t(costs.entered ? "dashboard.costs.edit" : "dashboard.costs.enter")}
          </ButtonLink>
        </section>
      </div>

      <ul
        aria-label={t("dashboard.more")}
        className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6 lg:gap-3"
      >
        {kpis.map((kpi) => (
          <li
            key={kpi.key}
            className="jm-admin-card flex min-w-0 flex-col gap-1.5 rounded-[20px] bg-blanc px-4 py-3.5"
          >
            <span className="flex items-start justify-between gap-2 text-[11.5px] leading-4 font-medium text-ardoise">
              {t(`dashboard.kpi.${kpi.key}`)}
              <span
                aria-hidden
                className={cx("grid size-7 shrink-0 place-items-center rounded-full", kpi.disc)}
              >
                <Icon name={kpi.icon} className="size-3.5" />
              </span>
            </span>
            <p
              className={cx(
                "font-semibold tracking-[-0.02em]",
                kpi.value === none
                  ? "text-[13px] leading-5 font-medium tracking-normal text-ardoise"
                  : "text-[19px] leading-6",
              )}
            >
              {kpi.value}
            </p>
            {compare && kpi.delta && <DeltaTag delta={kpi.delta} compact />}
          </li>
        ))}
      </ul>

      {/* Plans in use, free plans included. */}
      <section
        aria-labelledby="admin-plans-used"
        className={cx(adminCard, "flex min-w-0 flex-col gap-4")}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="admin-plans-used" className={adminTitle}>
            {t("dashboard.plansUsed.title")}
          </h2>
          <span className="text-[11.5px] text-ardoise">{t("dashboard.plansUsed.hint")}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {usage.map((group) => (
            <div
              key={group.family}
              className="flex flex-col gap-2.5 rounded-[18px] bg-creme/60 p-4"
            >
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className={cx("size-3 shrink-0 rounded-full", familyTone[group.family])}
                />
                <h3 className="flex-1 text-[15px] leading-5 font-semibold">
                  {t(`dashboard.family.${group.family}`)}
                </h3>
                <span className="text-[12px] text-ardoise">
                  {t("dashboard.plansUsed.accounts", { count: group.total })}
                </span>
              </div>
              <ul className="flex flex-col gap-1">
                {group.plans.map((plan) => {
                  const share = group.total ? Math.round((100 * plan.count) / group.total) : 0;
                  const change = plan.count - plan.previous;
                  return (
                    <li key={plan.code}>
                      <Link
                        href={planListHref(plan.family, plan.code)}
                        className="flex flex-col gap-1.5 rounded-[12px] px-2.5 py-2 hover:bg-blanc focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus-visible:outline-none"
                      >
                        <span className="flex items-baseline justify-between gap-3 text-[13px]">
                          <span className="font-semibold">
                            {plan.name}
                            {plan.sponsored > 0 && (
                              <span className="ml-1.5 text-[11px] font-medium text-ardoise">
                                {t("dashboard.plansUsed.sponsored", { count: plan.sponsored })}
                              </span>
                            )}
                          </span>
                          <span className="flex items-baseline gap-2">
                            {compare && change !== 0 && (
                              <span
                                className={cx(
                                  "text-[11px] font-semibold",
                                  change > 0 ? "text-up-texte" : "text-down-texte",
                                )}
                              >
                                {signed(change)}
                              </span>
                            )}
                            <span className="font-semibold">{number.format(plan.count)}</span>
                            <span className="w-9 text-right text-[11px] text-ardoise">
                              {t("dashboard.kpi.value.percent", { value: share })}
                            </span>
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className="block h-2 overflow-hidden rounded-pill bg-blanc"
                        >
                          <span
                            className={cx("block h-full rounded-pill", familyBar[group.family])}
                            style={{ width: `${share}%` }}
                          />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <section
          aria-labelledby="admin-activity"
          className={cx(adminCard, "flex min-w-0 flex-col gap-3")}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="admin-activity" className={adminTitle}>
              {t("dashboard.activity.title")}
            </h2>
            <span className="inline-flex h-[30px] items-center rounded-pill px-3.5 text-[12.5px] font-medium ring-[1.5px] ring-brume ring-inset">
              {t("dashboard.activity.monthly")}
            </span>
          </div>
          <ActivityChart
            months={data.activity.months}
            series={[
              { key: "signups", tone: "#3da14f", values: data.activity.signups },
              { key: "applications", tone: "#0f3f37", values: data.activity.applications },
              { key: "jobs", tone: "#2fd3a6", values: data.activity.jobs },
              { key: "certificates", tone: "#f2b33d", values: data.activity.certificates },
            ]}
            labels={{
              signups: t("dashboard.activity.signups"),
              applications: t("dashboard.activity.applications"),
              jobs: t("dashboard.activity.jobs"),
              certificates: t("dashboard.activity.certificates"),
            }}
            aria={t("dashboard.activity.aria", {
              from: monthName(data.activity.months[0]),
              to: monthName(data.activity.months.at(-1)!),
            })}
          />
        </section>

        <section
          aria-labelledby="admin-ai"
          className="relative isolate flex flex-col gap-3 overflow-hidden rounded-[24px] bg-gradient-ai p-5 text-blanc lg:p-[22px]"
        >
          <span
            aria-hidden
            className="absolute -top-16 -right-16 -z-10 size-48 rounded-full ring-1 ring-blanc/15"
          />
          <span
            aria-hidden
            className="absolute -top-6 -right-6 -z-10 size-24 rounded-full ring-1 ring-blanc/15"
          />
          <div className="flex items-center gap-2.5">
            <AiOrb size={26} />
            <h2
              id="admin-ai"
              className="text-[11px] font-semibold tracking-[0.12em] text-neon uppercase"
            >
              {t("dashboard.kpi.aiCost")}
            </h2>
          </div>
          <p className="text-[30px] leading-9 font-semibold tracking-[-0.03em]">
            {usd(Math.round(data.ai.total / 10_000))}
          </p>
          {aiTotal === 0 ? (
            <p className="text-[12px] text-blanc/70">{t("dashboard.ai.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {[
                ...aiRows,
                ...(aiOther > 0 ? [["other", aiOther] as [AiFeatureText | "other", number]] : []),
              ].map(([key, calls]) => (
                <li key={key} className="flex flex-col gap-1.5">
                  <span className="flex justify-between text-[11.5px]">
                    <span>
                      {key === "other" ? t("dashboard.ai.other") : t(`ai.usage.feature.${key}`)}
                    </span>
                    <span className="font-semibold">
                      {t("dashboard.kpi.value.percent", { value: aiShare(calls) })}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="block h-1.5 overflow-hidden rounded-pill bg-blanc/15"
                  >
                    <span
                      className="block h-full rounded-pill bg-lime"
                      style={{ width: `${aiShare(calls)}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/ia"
            className="mt-1 inline-flex h-8 w-fit items-center gap-1.5 rounded-pill bg-blanc/10 px-3.5 text-[12px] font-semibold ring-1 ring-blanc/22 ring-inset hover:bg-blanc/18"
          >
            {t("dashboard.ai.link")}
            <Icon name="chev-r" className="size-3.5" />
          </Link>
        </section>
      </div>
    </>
  );

  function monthName(date: Date) {
    return new Intl.DateTimeFormat("fr-FR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }
}

/** Change against the previous period: Lime clair when good news, pale Corail otherwise. */
async function DeltaTag({ delta, compact = false }: { delta: Delta; compact?: boolean }) {
  const t = await getTranslations("admin.dashboard.kpi");
  const good = delta.lowerIsBetter ? delta.value <= 0 : delta.value >= 0;
  const text =
    delta.kind === "points"
      ? t("deltaPoints", { count: Math.abs(delta.value), value: signed(delta.value) })
      : t("deltaPercent", { value: signed(delta.value) });
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag tone={delta.value === 0 ? "neutral" : good ? "success" : "error"} className="h-[22px]">
        {text}
        {delta.value !== 0 && (
          <Icon name={delta.value > 0 ? "up" : "down"} className="size-[11px]" />
        )}
      </Tag>
      {!compact && (
        <span className="hidden text-[11px] text-ardoise xl:inline">{t("vsPrevious")}</span>
      )}
      {delta.lowerIsBetter && <span className="sr-only">{t("lowerIsBetter")}</span>}
    </div>
  );
}

/** Multi-series line chart drawn on the server (no chart library: light pages). */
function ActivityChart({
  months,
  series,
  labels,
  aria,
}: {
  months: Date[];
  series: {
    key: "signups" | "applications" | "jobs" | "certificates";
    tone: string;
    values: number[];
  }[];
  labels: Record<string, string>;
  aria: string;
}) {
  const width = 560;
  const height = 260;
  const left = 44;
  const bottom = 30;
  const top = 14;
  const max = Math.max(1, ...series.flatMap((line) => line.values));
  const step = niceStep(max);
  const ceiling = Math.ceil(max / step) * step;
  const x = (index: number) =>
    left + (index * (width - left - 14)) / Math.max(1, months.length - 1);
  const y = (value: number) => top + (1 - value / ceiling) * (height - top - bottom);
  const ticks = Array.from({ length: Math.round(ceiling / step) + 1 }, (_, index) => index * step);
  const month = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });
  return (
    <>
      <ul className="flex flex-wrap gap-x-3.5 gap-y-1.5">
        {series.map((line) => (
          <li key={line.key} className="flex items-center gap-1.5 text-[11px]">
            <i
              aria-hidden
              className="block h-[3px] w-3.5 rounded-sm"
              style={{ background: line.tone }}
            />
            {labels[line.key]}
          </li>
        ))}
      </ul>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={aria}
        className="h-auto w-full"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={left}
              x2={width - 8}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#dce5e1"
              strokeDasharray="4 4"
            />
            <text x={0} y={y(tick) + 4} fontSize="12" fill="#5b6b68">
              {number.format(tick)}
            </text>
          </g>
        ))}
        {months.map((date, index) => (
          <text
            key={date.toISOString()}
            x={x(index)}
            y={height - 8}
            fontSize="12"
            fill="#5b6b68"
            textAnchor="middle"
          >
            {month.format(date)}
          </text>
        ))}
        {series.map((line) => (
          <g key={line.key}>
            <polyline
              fill="none"
              stroke={line.tone}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={line.values.map((value, index) => `${x(index)},${y(value)}`).join(" ")}
            />
            <circle
              cx={x(line.values.length - 1)}
              cy={y(line.values.at(-1) ?? 0)}
              r="5"
              fill="#fff"
              stroke={line.tone}
              strokeWidth="2.5"
            />
          </g>
        ))}
      </svg>
    </>
  );
}

function niceStep(max: number) {
  const raw = max / 3;
  const power = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((factor) => factor * power).find((value) => value >= raw) ?? power * 10;
}
