import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Alert, Badge, Button, Table, Td, Th, TextArea, TextField } from "@/components/ui";
import { criterionText } from "@/components/matching/talent-why";
import { cx } from "@/lib/cx";
import { formatDate, formatRelativeDays } from "@/lib/dates";
import { resolveDisputeAction, saveWeightsAction } from "@/server/actions/admin";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { activeWeights, disputeReasons } from "@/server/matching/service";
import { criterionKeys } from "@/server/matching/types";
import {
  openDisputes,
  scoreDistribution,
  usageReport,
  weightsHistory,
} from "@/server/services/ai-admin";

const tabs = { consommation: "usage", poids: "weights", revisions: "disputes" } as const;
type Tab = keyof typeof tabs;

const featureText: Record<string, "cvParse" | "cvCoach" | "diagnostic"> = {
  cv_parse: "cvParse",
  cv_coach: "cvCoach",
  diagnostic: "diagnostic",
};

const statusKey = { open: "open", in_review: "inReview" } as const;

/** IA et matching (partie 07, partie 08 § 8.10): consumption, weights, human reviews. */
export default async function AdminAi({ searchParams }: PageProps<"/admin/ia">) {
  const params = await searchParams;
  const admin = await requireAdmin();
  if (!admin) notFound();
  const t = await getTranslations();
  const format = await getFormatter();
  const writable = canWriteAdmin(admin);
  const tab: Tab =
    typeof params.onglet === "string" && params.onglet in tabs
      ? (params.onglet as Tab)
      : "consommation";
  const disputes = await openDisputes(db);
  const money = (micro: number) =>
    format.number(micro / 1_000_000, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 4,
    });

  return (
    <>
      <h1 className="text-h1">{t("admin.ai.title")}</h1>
      <nav aria-label={t("admin.ai.title")} className="flex flex-wrap gap-2">
        {(Object.keys(tabs) as Tab[]).map((id) => (
          <Link
            key={id}
            href={`/admin/ia?onglet=${id}`}
            aria-current={tab === id ? "page" : undefined}
            className={cx(
              "rounded-pill px-4 py-2 text-[15px] font-medium",
              tab === id ? "bg-sapin text-blanc" : "bg-blanc",
            )}
          >
            {id === "revisions"
              ? [t("admin.ai.tab.disputes"), `(${disputes.length})`].join(" ")
              : t(`admin.ai.tab.${tabs[id]}`)}
          </Link>
        ))}
      </nav>

      {tab === "consommation" && <UsageTab money={money} />}
      {tab === "poids" && (
        <WeightsTab writable={writable} ok={params.ok === "1"} error={params.erreur === "1"} />
      )}
      {tab === "revisions" && (
        <section aria-labelledby="disputes" className="flex flex-col gap-4">
          <h2 id="disputes" className="text-h2">
            {t("admin.ai.disputes.title")}
          </h2>
          {params.ok === "1" && <Alert tone="success" title={t("admin.ai.disputes.resolved")} />}
          {params.erreur === "reponse" && (
            <Alert tone="error" title={t("admin.ai.disputes.responseMissing")} />
          )}
          {disputes.length === 0 ? (
            <p className="rounded-card bg-blanc p-6">{t("admin.ai.disputes.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {disputes.map((dispute) => {
                const reason = (disputeReasons as readonly string[]).includes(dispute.reason)
                  ? t(`ai.dispute.what.${dispute.reason as (typeof disputeReasons)[number]}`)
                  : dispute.reason;
                const status = dispute.status === "in_review" ? "in_review" : "open";
                return (
                  <li key={dispute.id} className="flex flex-col gap-3 rounded-card bg-blanc p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={status === "open" ? "warning" : "ai"}>
                        {t(`ai.dispute.status.${statusKey[status]}`)}
                      </Badge>
                      <span className="text-sm text-ardoise">
                        {[
                          formatDate(dispute.createdAt),
                          formatRelativeDays(dispute.createdAt),
                        ].join(" · ")}
                      </span>
                    </div>
                    <dl className="grid gap-1 text-sm sm:grid-cols-[max-content_1fr] sm:gap-x-4">
                      <dt className="font-semibold">{t("admin.ai.disputes.col.talent")}</dt>
                      <dd>{[dispute.user.name, dispute.user.email].filter(Boolean).join(" · ")}</dd>
                      <dt className="font-semibold">{t("admin.ai.disputes.col.job")}</dt>
                      <dd>
                        {dispute.job
                          ? [dispute.job.title, dispute.job.organization.name].join(" · ")
                          : dispute.jobId}
                      </dd>
                      <dt className="font-semibold">{t("admin.ai.disputes.col.reason")}</dt>
                      <dd>{reason}</dd>
                    </dl>
                    <p className="text-sm font-medium">
                      {t("admin.ai.disputes.scoreBefore", { score: dispute.scoreBefore })}
                    </p>
                    <p className="rounded-md bg-creme p-3 text-sm whitespace-pre-line">
                      {dispute.details}
                    </p>
                    {dispute.notifyRecruiter && (
                      <p className="text-sm">{t("admin.ai.disputes.recruiterNotified")}</p>
                    )}
                    {writable && (
                      <form action={resolveDisputeAction} className="flex flex-col gap-3">
                        <input type="hidden" name="id" value={dispute.id} />
                        <TextArea
                          id={`resolution-${dispute.id}`}
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
                          <Button type="submit" name="outcome" value="corrected" size="sm">
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
      )}
    </>
  );
}

async function UsageTab({ money }: { money: (micro: number) => string }) {
  const t = await getTranslations();
  const [usage, bands, plans] = await Promise.all([
    usageReport(db),
    scoreDistribution(db),
    db.plan.findMany({ select: { code: true, name: true } }),
  ]);
  const featureLabel = (feature: string) =>
    featureText[feature] ? t(`admin.ai.usage.feature.${featureText[feature]}`) : feature;
  const planLabel = (code: string) =>
    code ? (plans.find((plan) => plan.code === code)?.name ?? code) : t("admin.ai.usage.plan.none");
  const totalScores = bands.reduce((sum, item) => sum + item.count, 0);

  const table = (
    caption: string,
    column: string,
    rows: typeof usage.byFeature,
    label: (key: string) => string,
  ) => (
    <Table caption={caption}>
      <thead>
        <tr>
          <Th>{column}</Th>
          <Th>{t("admin.ai.usage.col.calls")}</Th>
          <Th>{t("admin.ai.usage.col.failures")}</Th>
          <Th>{t("admin.ai.usage.col.tokens")}</Th>
          <Th>{t("admin.ai.usage.col.cost")}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            <Td>{label(row.key)}</Td>
            <Td>{row.calls}</Td>
            <Td>{row.failures}</Td>
            <Td>{[row.inputTokens, row.outputTokens].join(" / ")}</Td>
            <Td>{money(row.costMicroUsd)}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <>
      <section aria-labelledby="usage" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="usage" className="text-h2">
            {t("admin.ai.tab.usage")}
          </h2>
          <p className="text-sm text-ardoise">
            {[
              t("admin.ai.usage.period"),
              t("admin.ai.usage.cost.text", { amount: money(usage.total), currency: "" }).trim(),
            ].join(" · ")}
          </p>
        </div>
        {usage.unpriced.length > 0 && (
          <Alert
            tone="warning"
            title={t("admin.ai.usage.noPrice", { models: usage.unpriced.join(", ") })}
          />
        )}
        {usage.byFeature.length === 0 ? (
          <p className="rounded-card bg-blanc p-6">{t("admin.ai.usage.empty")}</p>
        ) : (
          <>
            <h3 className="font-semibold text-h3">{t("admin.ai.usage.byFeature")}</h3>
            {table(
              t("admin.ai.usage.byFeature"),
              t("admin.ai.usage.col.feature"),
              usage.byFeature,
              featureLabel,
            )}
            <h3 className="font-semibold text-h3">{t("admin.ai.usage.byPlan")}</h3>
            {table(
              t("admin.ai.usage.byPlan"),
              t("admin.ai.usage.col.plan"),
              usage.byPlan,
              planLabel,
            )}
          </>
        )}
        <p className="text-sm text-ardoise">{t("admin.ai.usage.cost.perFeature")}</p>
      </section>

      <section aria-labelledby="scores" className="flex flex-col gap-3 rounded-card bg-blanc p-6">
        <h2 id="scores" className="text-h2">
          {t("admin.ai.scores.title")}
        </h2>
        {totalScores === 0 ? (
          <p>{t("admin.ai.scores.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {bands.map((item) => (
              <li key={item.band} className="flex flex-col gap-1">
                <span className="flex justify-between text-sm">
                  <span>
                    {[t(`match.band.${item.band}.text`), t(`match.band.${item.band}.range`)].join(
                      " · ",
                    )}
                  </span>
                  <span>{t("admin.ai.scores.count", { count: item.count })}</span>
                </span>
                <span aria-hidden className="h-2 rounded-pill bg-brume">
                  <span
                    className="block h-2 rounded-pill bg-sapin"
                    style={{ width: `${Math.round((100 * item.count) / totalScores)}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="audit" className="flex flex-col gap-2">
        <h2 id="audit" className="text-h2">
          {t("admin.ai.audit.title")}
        </h2>
        <p className="text-sm">{t("admin.ai.audit.desc")}</p>
      </section>
    </>
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
    <section id="poids" aria-labelledby="weights" className="flex flex-col gap-4">
      <h2 id="weights" className="text-h2">
        {t("admin.ai.weights.title")}
      </h2>
      <p className="text-sm">{t("admin.ai.weights.subtitle")}</p>
      <p className="text-sm font-medium">
        {history.length > 0
          ? t("admin.ai.weights.version", { version: weights.version })
          : t("admin.ai.weights.default")}
      </p>
      {ok && <Alert tone="success" title={t("admin.ai.weights.saved")} />}
      {error && <Alert tone="error" title={t("admin.ai.weights.error")} />}
      <form action={saveWeightsAction} className="flex flex-col gap-4 rounded-card bg-blanc p-6">
        <fieldset className="grid gap-3 sm:grid-cols-2" disabled={!writable}>
          <legend className="sr-only">{t("admin.ai.weights.title")}</legend>
          {criterionKeys.map((key) => (
            <TextField
              key={key}
              id={`weight-${key}`}
              name={key}
              type="number"
              min={0}
              max={100}
              step={1}
              required
              defaultValue={weights.values[key]}
              label={t(`match.criterion.${criterionText[key]}.text`)}
            />
          ))}
        </fieldset>
        <p className="text-sm text-ardoise">
          {[t("admin.ai.weights.bands.title"), t("admin.ai.weights.bands.hint")].join(" : ")}
        </p>
        {writable && (
          <>
            <TextField
              id="weights-note"
              name="note"
              maxLength={300}
              label={t("admin.ai.weights.note")}
            />
            <p className="text-sm">{t("admin.ai.weights.impact")}</p>
            <Button type="submit" className="self-start">
              {t("admin.ai.weights.save")}
            </Button>
          </>
        )}
      </form>
      <div className="flex flex-col gap-1 rounded-card bg-blanc p-6">
        <h3 className="font-semibold text-h3">{t("admin.ai.weights.excluded.title")}</h3>
        <p className="text-sm">{t("admin.ai.weights.excluded.body")}</p>
      </div>
      {history.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-h3">{t("admin.ai.weights.history")}</h3>
          <ul className="flex flex-col gap-1 text-sm">
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
        </div>
      )}
    </section>
  );
}
