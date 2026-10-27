import { SkillsTab } from "@/components/admin/skills-tab";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon } from "@/components/brand/icon";
import {
  AdminDone,
  AdminPageHeader,
  AdminTabs,
  AuditNotice,
  ReasonField,
  SectionRule,
  SensitivePanel,
  Tag,
  adminCard,
  adminLabel,
  adminTitle,
} from "@/components/admin/kit";
import { WeightsEditor } from "@/components/admin/ia-weights";
import { Alert, Button, Table, Td, Th, TextArea } from "@/components/ui";
import { criterionText } from "@/components/matching/talent-why";
import { cx } from "@/lib/cx";
import { formatDate, formatRelativeDays } from "@/lib/dates";
import { resolveDisputeAction, saveWeightsAction } from "@/server/actions/admin";
import { canWriteArea } from "@/server/auth/roles";
import { requireAdminArea } from "@/server/auth/session";
import { db } from "@/server/db";
import { activeWeights, disputeReasons } from "@/server/matching/service";
import { criterionKeys } from "@/server/matching/types";
import {
  configuredModels,
  exhaustedCredits,
  monthBudget,
  openDisputes,
  PLAN_COST_ALERT,
  planCosts,
  scoreDistribution,
  usageReport,
  weightsHistory,
} from "@/server/services/ai-admin";
import { formatUsd } from "@/lib/money";

const tabs = {
  consommation: "usage",
  poids: "weights",
  competences: "skills",
  revisions: "disputes",
  journal: "audit",
} as const;
type Tab = keyof typeof tabs;

/** AI features (`AiUsage.feature`) → their name in « Consommation par fonction ». */
const featureText: Record<
  string,
  | "cvParse"
  | "cvCoach"
  | "diagnostic"
  | "documents"
  | "linkedin"
  | "interviewText"
  | "cvAnalysis"
  | "jobDraft"
  | "learnCoach"
  | "orbiChat"
> = {
  cv_parse: "cvParse",
  cv_coach: "cvCoach",
  cv_tailor: "cvCoach",
  diagnostic: "diagnostic",
  diagnostic_followup: "diagnostic",
  career_document: "documents",
  proofread: "documents",
  linkedin: "linkedin",
  interview_feedback: "interviewText",
  interview_questions: "interviewText",
  hire_cv_analysis: "cvAnalysis",
  job_writer: "jobDraft",
  learn_coach: "learnCoach",
  orbi_chat: "orbiChat",
  chat_summary: "orbiChat",
};

const statusKey = { open: "open", in_review: "inReview" } as const;

/** Colors of the four score bands (mockup 07-09, « Bandes de score »): low in Brume, never red. */
const bands = [
  { band: "veryHigh", color: "bg-lime", width: 15 },
  { band: "high", color: "bg-menthe-claire", width: 15 },
  { band: "partial", color: "bg-ambre-fond", width: 20 },
  { band: "low", color: "bg-brume", width: 50 },
] as const;

type Disputes = Awaited<ReturnType<typeof openDisputes>>;

/** Rows whose features share a name (cv_coach and cv_tailor…) are added up into one line. */
function merge<Row extends Usage["byFeature"][number]>(rows: Row[], name: (key: string) => string) {
  const map = new Map<string, Row>();
  for (const row of rows) {
    const label = name(row.key);
    const seen = map.get(label);
    if (!seen) {
      map.set(label, { ...row });
      continue;
    }
    seen.calls += row.calls;
    seen.credits += row.credits;
    // People can use two features of one name: the larger count is a floor, not a double count.
    seen.people = Math.max(seen.people, row.people);
    seen.failures += row.failures;
    seen.inputTokens += row.inputTokens;
    seen.outputTokens += row.outputTokens;
    seen.costMicroUsd += row.costMicroUsd;
  }
  return [...map.values()].sort((a, b) => b.calls - a.calls);
}
type Usage = Awaited<ReturnType<typeof usageReport>>;

/** IA et matching (partie 07, partie 08 § 8.10): consumption, weights, human reviews, audit. */
export default async function AdminAi({ searchParams }: PageProps<"/admin/ia">) {
  const params = await searchParams;
  const admin = await requireAdminArea("ai");
  if (!admin) notFound();
  const t = await getTranslations();
  const format = await getFormatter();
  const writable = canWriteArea(admin.platformRole, "ai");
  const tab: Tab =
    typeof params.onglet === "string" && params.onglet in tabs
      ? (params.onglet as Tab)
      : "consommation";
  const [disputes, usage] = await Promise.all([openDisputes(db), usageReport(db)]);
  const money = (micro: number, digits = 4) =>
    format.number(micro / 1_000_000, {
      style: "currency",
      currency: "USD",
      currencyDisplay: "code",
      maximumFractionDigits: digits,
    });
  const featureLabel = (feature: string) =>
    featureText[feature] ? t(`admin.ai.usage.feature.${featureText[feature]}`) : feature;

  return (
    <>
      <AdminPageHeader title={t("admin.ai.title")} />
      <AdminTabs
        label={t("admin.ai.title")}
        items={(Object.keys(tabs) as Tab[]).map((id) => ({
          href: `/admin/ia?onglet=${id}`,
          current: tab === id,
          label:
            id === "revisions" && disputes.length > 0
              ? [t("admin.ai.tab.disputes"), `(${disputes.length})`].join(" ")
              : t(`admin.ai.tab.${tabs[id]}`),
        }))}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          {tab === "consommation" && <UsageTab usage={usage} money={money} label={featureLabel} />}
          {tab === "poids" && (
            <WeightsTab writable={writable} ok={params.ok === "1"} error={params.erreur === "1"} />
          )}
          {tab === "revisions" && (
            <DisputesTab
              disputes={disputes}
              writable={writable}
              ok={params.ok === "1"}
              missing={params.erreur === "reponse"}
            />
          )}
          {tab === "competences" && <SkillsTab params={params} writable={writable} />}
          {tab === "journal" && <AuditTab />}
        </div>
        <aside className="flex min-w-0 flex-col gap-4">
          <UsageCard usage={usage} money={money} label={featureLabel} />
          {tab !== "revisions" && <DisputesCard disputes={disputes} />}
          <AuditNotice />
        </aside>
      </div>
    </>
  );
}

/** Dark AI-gradient card « Consommation · Par fonction » (mockup 07-09). */
async function UsageCard({
  usage,
  money,
  label,
}: {
  usage: Usage;
  money: (micro: number, digits?: number) => string;
  label: (feature: string) => string;
}) {
  const t = await getTranslations("admin.ai");
  const calls = usage.byFeature.reduce((sum, row) => sum + row.calls, 0);
  // Share of the estimated cost; of the calls while no call has a price.
  const byCost = usage.total > 0;
  const merged = new Map<string, number>();
  for (const row of usage.byFeature) {
    const name = label(row.key);
    merged.set(name, (merged.get(name) ?? 0) + (byCost ? row.costMicroUsd : row.calls));
  }
  const whole = byCost ? usage.total : calls;
  const shares = [...merged.entries()]
    .map(([name, amount]) => ({ name, percent: whole ? Math.round((100 * amount) / whole) : 0 }))
    .sort((a, b) => b.percent - a.percent);
  const top = Math.max(1, ...shares.map((item) => item.percent));
  return (
    <section
      aria-labelledby="ia-usage-card"
      className="relative isolate flex flex-col gap-2.5 overflow-hidden rounded-[24px] bg-gradient-ai p-5 text-blanc"
    >
      <span
        aria-hidden
        className="absolute -top-[70px] -right-[70px] -z-10 size-[220px] bg-[url(/marque/formes/forme-orbites-lime.svg)] bg-contain bg-no-repeat opacity-20"
      />
      <div className="flex items-center justify-between gap-3">
        <h2 id="ia-usage-card" className={cx(adminLabel, "text-neon")}>
          {[t("tab.usage"), t("usage.byFeature")].join(" · ")}
        </h2>
        <AiOrb size={22} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <p className="flex flex-col">
          <span className="text-[22px] leading-7 font-semibold tracking-[-0.02em]">
            {money(usage.total, 2)}
          </span>
          <span className="text-[11px] leading-[15px] text-blanc/70">{t("usage.cost.label")}</span>
        </p>
        <p className="flex flex-col">
          <span className="text-[22px] leading-7 font-semibold tracking-[-0.02em]">{calls}</span>
          <span className="text-[11px] leading-[15px] text-blanc/70">{t("usage.calls")}</span>
        </p>
      </div>
      {shares.length === 0 ? (
        <p className="text-[12px] leading-[17px] text-blanc/80">{t("usage.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {shares.map((item) => (
            <li key={item.name} className="flex flex-col gap-1">
              <span className="flex justify-between gap-3 text-[11px] leading-[15px]">
                <span>{item.name}</span>
                <span className="font-semibold">{t("usage.share", { percent: item.percent })}</span>
              </span>
              <span aria-hidden className="h-[5px] overflow-hidden rounded-pill bg-blanc/18">
                <span
                  className="block h-full rounded-pill bg-lime"
                  style={{ width: `${(100 * item.percent) / top}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] leading-[15px] text-blanc/70">
        {[t("usage.period"), t("usage.cost.perFeature")].join(" · ")}
      </p>
    </section>
  );
}

/** Side card « Révisions humaines demandées »: the oldest open reviews. */
async function DisputesCard({ disputes }: { disputes: Disputes }) {
  const t = await getTranslations();
  const disputeReason = await disputeReasonText();
  const now = new Date();
  const days = (date: Date) =>
    t("admin.ai.disputes.days", {
      count: Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000)),
    });
  return (
    <section aria-labelledby="ia-disputes-card" className={cx(adminCard, "flex flex-col gap-2.5")}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="ia-disputes-card" className="text-[16px] leading-[22px] font-semibold">
          {t("admin.ai.disputes.title")}
        </h2>
        {disputes.length > 0 && <Tag tone="warning">{disputes.length}</Tag>}
      </div>
      {disputes.length === 0 ? (
        <p className="text-[12.5px] text-ardoise">{t("admin.ai.disputes.empty")}</p>
      ) : (
        <>
          <ul className="flex flex-col">
            {disputes.slice(0, 3).map((dispute, index) => (
              <li
                key={dispute.id}
                className={cx("flex flex-col gap-1 py-2.5", index > 0 && "border-t border-brume")}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/admin/ia?onglet=revisions#ia-dispute-${dispute.id}`}
                    className="text-[12.5px] leading-[17px] font-semibold hover:underline"
                  >
                    {[dispute.user.name, dispute.job?.title].filter(Boolean).join(" · ")}
                  </Link>
                  <span className="shrink-0 text-[11px] text-ardoise">
                    {days(dispute.createdAt)}
                  </span>
                </span>
                <span className="text-[11px] leading-[15px] text-ardoise">
                  {disputeReason(dispute.reason)}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/ia?onglet=revisions"
            className="inline-flex h-8 items-center self-start rounded-pill px-3.5 text-[12px] font-semibold ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40"
          >
            {t("admin.ai.disputes.seeAll")}
          </Link>
        </>
      )}
      <p className="text-[11px] leading-[15px] text-ardoise">{t("admin.ai.audit.desc")}</p>
    </section>
  );
}

async function disputeReasonText() {
  const t = await getTranslations("ai.dispute.what");
  return (reason: string) =>
    (disputeReasons as readonly string[]).includes(reason)
      ? t(reason as (typeof disputeReasons)[number])
      : reason;
}

/** « Bandes de score »: the four display thresholds (partie 08). */
async function BandsCard() {
  const t = await getTranslations();
  return (
    <section aria-labelledby="ia-bands" className={cx(adminCard, "flex flex-col gap-3")}>
      <h2 id="ia-bands" className="text-[16px] leading-[22px] font-semibold">
        {t("admin.ai.weights.bands.title")}
      </h2>
      <span aria-hidden className="flex h-3.5 flex-row-reverse overflow-hidden rounded-pill">
        {bands.map((item) => (
          <span key={item.band} className={item.color} style={{ width: `${item.width}%` }} />
        ))}
      </span>
      <ul className="flex flex-col gap-2">
        {bands.map((item) => (
          <li key={item.band} className="flex items-center gap-2 text-[11px] leading-[15px]">
            <span aria-hidden className={cx("size-2.5 shrink-0 rounded-full", item.color)} />
            <span className="flex-1 font-medium">{t(`match.band.${item.band}.text`)}</span>
            <span className="text-ardoise">{t(`match.band.${item.band}.range`)}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] leading-[15px] text-ardoise">{t("admin.ai.weights.bands.hint")}</p>
    </section>
  );
}

/** Sapin card « Données exclues du calcul » (lock): fixed list, rule 4 of CLAUDE.md. */
async function ExcludedCard() {
  const t = await getTranslations("admin.ai.weights.excluded");
  return (
    <section
      aria-labelledby="ia-excluded"
      className="flex flex-col gap-2.5 rounded-[24px] bg-sapin p-5 text-blanc"
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-lime text-sapin"
        >
          <Icon name="lock" className="size-[18px]" />
        </span>
        <h2 id="ia-excluded" className="text-[16px] leading-[22px] font-semibold">
          {t("title")}
        </h2>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {t("list")
          .split(",")
          .map((item) => (
            <li
              key={item}
              className="inline-flex h-[26px] items-center rounded-pill bg-blanc/10 px-2.5 text-[11px] font-semibold"
            >
              {item.trim()}
            </li>
          ))}
      </ul>
      <p className="text-[11px] leading-[15px] text-blanc/70">{t("locked")}</p>
    </section>
  );
}

async function WeightsTab({
  writable,
  ok,
  error,
}: {
  writable: boolean;
  ok: boolean;
  error: boolean;
}) {
  const t = await getTranslations();
  const [weights, history] = await Promise.all([activeWeights(db), weightsHistory(db)]);
  return (
    <form id="poids" action={saveWeightsAction} className="flex flex-col gap-4">
      {ok && (
        <AdminDone title={t("admin.ai.weights.saved")} journal="/admin/journal?action=matching" />
      )}
      {error && <Alert tone="error" title={t("admin.ai.weights.error")} />}
      <section aria-labelledby="ia-weights" className={cx(adminCard, "flex flex-col gap-3")}>
        <WeightsEditor
          disabled={!writable}
          rows={criterionKeys.map((key) => ({
            key,
            value: weights.values[key],
            label: t(`match.criterion.${criterionText[key]}.text`),
            desc: t(`admin.ai.weights.desc.${criterionText[key]}`),
          }))}
          labels={{
            criterion: t("admin.ai.weights.criterion"),
            value: t("admin.ai.weights.value"),
            total: t("admin.ai.weights.total", { total: "{total}" }),
            error: t("admin.ai.weights.error"),
          }}
          header={
            <div className="flex items-start gap-2.5">
              <AiOrb size={30} className="mt-0.5" />
              <div className="flex flex-col">
                <h2 id="ia-weights" className={adminTitle}>
                  {t("admin.ai.weights.title")}
                </h2>
                <p className="text-[11px] leading-4 text-ardoise">
                  {t("admin.ai.weights.subtitle")}
                </p>
                <p className="mt-1 text-[11px] leading-4 font-medium">
                  {history.length > 0
                    ? t("admin.ai.weights.version", { version: weights.version })
                    : t("admin.ai.weights.default")}
                </p>
              </div>
            </div>
          }
        />
        <p className="flex items-start gap-2.5 rounded-[12px] bg-creme px-3 py-2.5 text-[11px] leading-4">
          <Icon name="notification" className="size-4 shrink-0" />
          {t("admin.ai.weights.impact")}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <BandsCard />
        <ExcludedCard />
      </div>

      {writable && (
        <>
          <SectionRule>{t("admin.sensitive.label")}</SectionRule>
          <SensitivePanel
            title={t("admin.ai.weights.save")}
            text={t("admin.ai.weights.impact")}
            tone="neutral"
          >
            <ReasonField id="ia-weights-note" name="note" maxLength={300} />
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="reset" variant="tertiary">
                {t("common.cancel")}
              </Button>
              <Button type="submit" variant="secondary">
                {t("admin.ai.weights.save")}
              </Button>
            </div>
          </SensitivePanel>
        </>
      )}
    </form>
  );
}

async function UsageTab({
  usage,
  money,
  label,
}: {
  usage: Usage;
  money: (micro: number, digits?: number) => string;
  label: (feature: string) => string;
}) {
  const t = await getTranslations();
  const [distribution, plans, budget, exhausted] = await Promise.all([
    scoreDistribution(db),
    db.plan.findMany({ select: { code: true, name: true, priceCents: true, interval: true } }),
    monthBudget(db),
    exhaustedCredits(db),
  ]);
  const costs = planCosts(usage.byPlan, plans);
  const alerts = costs.filter((row) => row.alert);
  const models = configuredModels();
  const percent = (share: number) => Math.round(share * 100);
  const planLabel = (code: string) =>
    code ? (plans.find((plan) => plan.code === code)?.name ?? code) : t("admin.ai.usage.plan.none");
  const totalScores = distribution.reduce((sum, item) => sum + item.count, 0);
  const color = Object.fromEntries(bands.map((item) => [item.band, item.color]));

  const table = (
    id: string,
    caption: string,
    column: string,
    rows: Usage["byFeature"],
    name: (key: string) => string,
  ) => (
    <section aria-labelledby={id} className={cx(adminCard, "flex flex-col gap-3")}>
      <h2 id={id} className="text-[16px] leading-[22px] font-semibold">
        {caption}
      </h2>
      <div className="-mx-5 lg:-mx-[22px]">
        <Table caption={caption}>
          <thead>
            <tr>
              <Th>{column}</Th>
              <Th>{t("admin.ai.usage.col.calls")}</Th>
              <Th>{t("admin.ai.usage.col.credits")}</Th>
              <Th>{t("admin.ai.usage.col.people")}</Th>
              <Th>{t("admin.ai.usage.col.failures")}</Th>
              <Th>{t("admin.ai.usage.col.tokens")}</Th>
              <Th>{t("admin.ai.usage.col.cost")}</Th>
            </tr>
          </thead>
          <tbody>
            {merge(rows, name).map((row) => (
              <tr key={row.key}>
                <Td>{name(row.key)}</Td>
                <Td>{row.calls}</Td>
                <Td>{row.credits}</Td>
                <Td>{row.people}</Td>
                <Td>{row.failures}</Td>
                <Td>{[row.inputTokens, row.outputTokens].join(" / ")}</Td>
                <Td>{money(row.costMicroUsd)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </section>
  );

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={adminTitle}>{t("admin.ai.tab.usage")}</h2>
        <p className="text-[13px] text-ardoise">
          {[
            t("admin.ai.usage.period"),
            t("admin.ai.usage.cost.text", { amount: money(usage.total), currency: "" }).trim(),
            t("admin.ai.usage.creditsTotal", { count: usage.credits }),
          ].join(" · ")}
        </p>
      </div>
      {budget.level === "over" && <Alert tone="error" title={t("admin.ai.budget.over")} />}
      {budget.level === "near" && <Alert tone="warning" title={t("admin.ai.budget.near")} />}
      {alerts.map((row) => (
        <Alert
          key={row.key}
          tone="warning"
          title={t("admin.ai.cost.alert", {
            percent: percent(row.share ?? 0),
            plan: row.name ?? row.key,
          })}
        />
      ))}
      <div className="grid gap-4 md:grid-cols-3">
        <section aria-labelledby="ia-budget" className={cx(adminCard, "flex flex-col gap-2")}>
          <h2 id="ia-budget" className="text-[16px] leading-[22px] font-semibold">
            {t("admin.ai.budget.title")}
          </h2>
          {budget.budgetMicroUsd === null ? (
            <>
              <p className="text-[13px] font-semibold">
                {t("admin.ai.budget.spent", { spent: money(budget.spentMicroUsd, 2) })}
              </p>
              <p className="text-[12px] leading-[17px] text-ardoise">{t("admin.ai.budget.none")}</p>
            </>
          ) : (
            <>
              <p className="text-[13px] font-semibold">
                {t("admin.ai.budget.value", {
                  spent: money(budget.spentMicroUsd, 2),
                  budget: money(budget.budgetMicroUsd, 2),
                  percent: percent(budget.share ?? 0),
                })}
              </p>
              <span aria-hidden className="h-2 overflow-hidden rounded-pill bg-creme">
                <span
                  className={cx(
                    "block h-2 rounded-pill",
                    budget.level === "over"
                      ? "bg-corail"
                      : budget.level === "near"
                        ? "bg-ambre"
                        : "bg-lime",
                  )}
                  style={{ width: `${Math.min(100, percent(budget.share ?? 0))}%` }}
                />
              </span>
            </>
          )}
        </section>
        <section aria-labelledby="ia-exhausted" className={cx(adminCard, "flex flex-col gap-2")}>
          <h2 id="ia-exhausted" className="text-[16px] leading-[22px] font-semibold">
            {t("admin.ai.usage.col.credits")}
          </h2>
          <p className="text-[13px] leading-5">{t("admin.ai.exhausted", { count: exhausted })}</p>
        </section>
        <section aria-labelledby="ia-models" className={cx(adminCard, "flex flex-col gap-2")}>
          <h2 id="ia-models" className="text-[16px] leading-[22px] font-semibold">
            {t("admin.ai.models.title")}
          </h2>
          <dl className="flex flex-col gap-2 text-[12.5px]">
            {(
              [
                ["default", models.default],
                ["fast", models.fast],
              ] as const
            ).map(([tier, model]) => (
              <div key={tier} className="flex flex-col gap-0.5">
                <dt className="text-[11.5px] text-ardoise">{t(`admin.ai.models.${tier}`)}</dt>
                <dd className="font-semibold [overflow-wrap:anywhere]">
                  {model ? <code>{model}</code> : t("admin.ai.models.unset")}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-[11.5px] leading-4 text-ardoise">{t("admin.ai.models.text")}</p>
        </section>
      </div>
      {usage.unpriced.length > 0 && (
        <Alert
          tone="warning"
          title={t("admin.ai.usage.noPrice", { models: usage.unpriced.join(", ") })}
        />
      )}
      {usage.byFeature.length === 0 ? (
        <p className={cx(adminCard, "text-[13.5px]")}>{t("admin.ai.usage.empty")}</p>
      ) : (
        <>
          {table(
            "ia-by-feature",
            t("admin.ai.usage.byFeature"),
            t("admin.ai.usage.col.feature"),
            usage.byFeature,
            label,
          )}
          {table(
            "ia-by-plan",
            t("admin.ai.usage.byPlan"),
            t("admin.ai.usage.col.plan"),
            usage.byPlan,
            planLabel,
          )}
          <section aria-labelledby="ia-cost" className={cx(adminCard, "flex flex-col gap-3")}>
            <h2 id="ia-cost" className="text-[16px] leading-[22px] font-semibold">
              {t("admin.ai.cost.title")}
            </h2>
            <p className="text-[12.5px] leading-[18px] text-ardoise">
              {t("admin.ai.cost.text", { percent: percent(PLAN_COST_ALERT) })}
            </p>
            <div className="-mx-5 lg:-mx-[22px]">
              <Table caption={t("admin.ai.cost.title")}>
                <thead>
                  <tr>
                    <Th>{t("admin.ai.usage.col.plan")}</Th>
                    <Th>{t("admin.ai.usage.col.people")}</Th>
                    <Th>{t("admin.ai.cost.col.perPerson")}</Th>
                    <Th>{t("admin.ai.cost.col.price")}</Th>
                    <Th>{t("admin.ai.cost.col.share")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map((row) => (
                    <tr key={row.key}>
                      <Td>{planLabel(row.key)}</Td>
                      <Td>{row.people}</Td>
                      <Td>{money(row.perPersonMicroUsd)}</Td>
                      <Td>
                        {row.monthlyCents === null
                          ? t("admin.ai.cost.quote")
                          : row.monthlyCents === 0
                            ? t("admin.ai.cost.free")
                            : `${formatUsd(row.monthlyCents)} USD`}
                      </Td>
                      <Td>
                        {row.share === null ? (
                          "·"
                        ) : (
                          <Tag tone={row.alert ? "warning" : "success"}>
                            {t("admin.ai.usage.share", { percent: percent(row.share) })}
                          </Tag>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            {alerts.length === 0 && (
              <p className="text-[12px] text-ardoise">
                {t("admin.ai.cost.ok", { percent: percent(PLAN_COST_ALERT) })}
              </p>
            )}
          </section>
        </>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="ia-scores" className={cx(adminCard, "flex flex-col gap-3")}>
          <h2 id="ia-scores" className="text-[16px] leading-[22px] font-semibold">
            {t("admin.ai.scores.title")}
          </h2>
          {totalScores === 0 ? (
            <p className="text-[12.5px] text-ardoise">{t("admin.ai.scores.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {distribution.map((item) => (
                <li key={item.band} className="flex flex-col gap-1">
                  <span className="flex justify-between gap-3 text-[11.5px]">
                    <span className="font-medium">{t(`match.band.${item.band}.text`)}</span>
                    <span className="text-ardoise">
                      {t("admin.ai.scores.count", { count: item.count })}
                    </span>
                  </span>
                  <span aria-hidden className="h-2 overflow-hidden rounded-pill bg-creme">
                    <span
                      className={cx("block h-2 rounded-pill", color[item.band])}
                      style={{ width: `${Math.round((100 * item.count) / totalScores)}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <BandsCard />
      </div>
    </>
  );
}

async function DisputesTab({
  disputes,
  writable,
  ok,
  missing,
}: {
  disputes: Disputes;
  writable: boolean;
  ok: boolean;
  missing: boolean;
}) {
  const t = await getTranslations();
  const disputeReason = await disputeReasonText();
  return (
    <section aria-labelledby="ia-disputes" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="ia-disputes" className={adminTitle}>
          {t("admin.ai.disputes.title")}
        </h2>
        <Tag tone="warning">{disputes.length}</Tag>
      </div>
      {ok && <Alert tone="success" title={t("admin.ai.disputes.resolved")} />}
      {missing && <Alert tone="error" title={t("admin.ai.disputes.responseMissing")} />}
      {disputes.length === 0 ? (
        <p className={cx(adminCard, "text-[13.5px]")}>{t("admin.ai.disputes.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {disputes.map((dispute) => {
            const status = dispute.status === "in_review" ? "in_review" : "open";
            return (
              <li
                key={dispute.id}
                id={`ia-dispute-${dispute.id}`}
                className={cx(adminCard, "flex scroll-mt-6 flex-col gap-3")}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone={status === "open" ? "warning" : "menthe"}>
                    {t(`ai.dispute.status.${statusKey[status]}`)}
                  </Tag>
                  <Tag tone="neutral">
                    {t("admin.ai.disputes.scoreBefore", { score: dispute.scoreBefore })}
                  </Tag>
                  <span className="ml-auto text-[11.5px] text-ardoise">
                    {[formatDate(dispute.createdAt), formatRelativeDays(dispute.createdAt)].join(
                      " · ",
                    )}
                  </span>
                </div>
                <h3 className="text-[15px] leading-5 font-semibold">
                  {dispute.job
                    ? [dispute.job.title, dispute.job.organization.name].join(" · ")
                    : dispute.jobId}
                </h3>
                <dl className="grid gap-1 text-[13px] leading-5 sm:grid-cols-[max-content_1fr] sm:gap-x-4">
                  <dt className="text-ardoise">{t("admin.ai.disputes.col.talent")}</dt>
                  <dd className="font-medium break-words">
                    {[dispute.user.name, dispute.user.email].filter(Boolean).join(" · ")}
                  </dd>
                  <dt className="text-ardoise">{t("admin.ai.disputes.col.reason")}</dt>
                  <dd className="font-medium">{disputeReason(dispute.reason)}</dd>
                </dl>
                <p className="rounded-[14px] bg-creme px-3.5 py-3 text-[13px] leading-5 whitespace-pre-line">
                  {dispute.details}
                </p>
                {dispute.notifyRecruiter && (
                  <p className="flex items-center gap-1.5 text-[12px] text-ardoise">
                    <Icon name="info" className="size-3.5 shrink-0" />
                    {t("admin.ai.disputes.recruiterNotified")}
                  </p>
                )}
                {writable && (
                  <form action={resolveDisputeAction} className="flex flex-col gap-3">
                    <input type="hidden" name="id" value={dispute.id} />
                    <TextArea
                      id={`ia-resolution-${dispute.id}`}
                      name="resolution"
                      rows={3}
                      maxLength={2000}
                      label={t("admin.ai.disputes.response")}
                      hint={t("admin.ai.disputes.responseHint")}
                    />
                    <div className="flex flex-wrap gap-2">
                      {status === "open" && (
                        <Button
                          type="submit"
                          name="outcome"
                          value="in_review"
                          size="sm"
                          variant="tertiary"
                        >
                          {t("admin.ai.disputes.take")}
                        </Button>
                      )}
                      <Button
                        type="submit"
                        name="outcome"
                        value="corrected"
                        size="sm"
                        variant="tertiary"
                      >
                        {t("admin.ai.disputes.correct")}
                      </Button>
                      <Button
                        type="submit"
                        name="outcome"
                        value="confirmed"
                        size="sm"
                        variant="secondary"
                      >
                        {t("admin.ai.disputes.confirm")}
                      </Button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const auditActions = {
  "matching.weights.update": "weights",
  "match.dispute.in_review": "inReview",
  "match.dispute.corrected": "corrected",
  "match.dispute.confirmed": "confirmed",
} as const;

/** « Journal d'audit »: the matching decisions (weights, reviews) and the weight versions. */
async function AuditTab() {
  const t = await getTranslations();
  const [entries, history] = await Promise.all([
    db.auditLog.findMany({
      where: { action: { in: Object.keys(auditActions) } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, action: true, createdAt: true, actorId: true },
    }),
    weightsHistory(db),
  ]);
  const actors = await db.user.findMany({
    where: {
      id: {
        in: [
          ...new Set(
            entries.map((entry) => entry.actorId).filter((id): id is string => Boolean(id)),
          ),
        ],
      },
    },
    select: { id: true, name: true },
  });
  return (
    <>
      <section aria-labelledby="ia-audit" className={cx(adminCard, "flex flex-col gap-3")}>
        <h2 id="ia-audit" className={adminTitle}>
          {t("admin.ai.audit.title")}
        </h2>
        <p className="text-[12.5px] leading-[18px] text-ardoise">{t("admin.ai.audit.desc")}</p>
        {entries.length === 0 ? (
          <p className="text-[13px]">{t("admin.ai.audit.empty")}</p>
        ) : (
          <ul className="flex flex-col">
            {entries.map((entry, index) => {
              const actor = actors.find((user) => user.id === entry.actorId);
              return (
                <li
                  key={entry.id}
                  className={cx(
                    "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5 text-[13px]",
                    index > 0 && "border-t border-brume",
                  )}
                >
                  <span className="font-medium">
                    {t(
                      `admin.ai.audit.action.${auditActions[entry.action as keyof typeof auditActions]}`,
                    )}
                  </span>
                  <span className="text-[11.5px] text-ardoise">
                    {[
                      formatDate(entry.createdAt),
                      actor ? t("admin.ai.audit.by", { name: actor.name }) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {history.length > 0 && (
        <section aria-labelledby="ia-history" className={cx(adminCard, "flex flex-col gap-2")}>
          <h2 id="ia-history" className="text-[16px] leading-[22px] font-semibold">
            {t("admin.ai.weights.history")}
          </h2>
          <ul className="flex flex-col gap-1 text-[13px]">
            {history.map((row) => (
              <li key={row.id}>
                {[
                  t("admin.ai.weights.historyItem", {
                    version: row.version,
                    date: formatDate(row.activeFrom),
                  }),
                  row.note,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
