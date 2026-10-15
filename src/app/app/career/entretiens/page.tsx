import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import {
  AiBrand,
  AiPanel,
  card,
  cardTitle,
  CareerTabs,
  eyebrow,
  IconTile,
  pillClass,
} from "@/components/career/kit";
import { Alert, EmptyState, Select, Table, Td, TextField, Th } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { startInterviewAction } from "@/server/actions/career-interviews";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  getInterview,
  interviewDurations,
  interviewJobs,
  interviewLevels,
  interviewModes,
  interviewQuota,
  interviewTypes,
  listInterviews,
  questionCount,
  quotaKey,
  type FeedbackLine,
} from "@/server/services/interview-sim";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.interviews");
  return { title: t("title"), robots: { index: false } };
}

/**
 * Interview simulations (partie 07 § 3, `career.interview.text.monthly` and `.voice.monthly`):
 * the two modes with their monthly quota, the session setup and the past sessions.
 */
export default async function InterviewsPage({
  searchParams,
}: PageProps<"/app/career/entretiens">) {
  const query = await searchParams;
  const user = await requireUser("/app/career/entretiens");
  const t = await getTranslations();
  const [text, voice, plans, sessions, jobs] = await Promise.all([
    interviewQuota(db, user.id, "text"),
    interviewQuota(db, user.id, "voice"),
    listPublicPlans(db),
    listInterviews(db, user.id),
    interviewJobs(db, user.id),
  ]);
  const quotas = { text, voice };
  const open = interviewModes.filter((mode) => quotas[mode].limit !== 0);
  const chosen = open.includes(query.mode as "voice") ? (query.mode as "voice") : open[0];
  const typeLabel = (type: string) =>
    t(`career.interviews.setup.type.${type as (typeof interviewTypes)[number]}`);
  const modeLabel = (mode: string) => t(`career.interviews.mode.${mode as "text"}.text`);
  const lastDone = sessions.find((session) => session.status === "completed");
  const latest = lastDone ? await getInterview(db, user.id, lastDone.id) : null;
  const feedback = latest?.feedbackData ?? null;
  const line = (item: FeedbackLine) =>
    "text" in item ? item.text : t(`career.interviews.feedback.rule.${item.code}`);

  return (
    <>
      <AppPageHeader
        eyebrow={t("career.interviews.subtitle")}
        title={t("career.interviews.title")}
      />
      <CareerTabs active="interviews" />

      {query.erreur === "consent" && (
        <Alert title={t("career.interviews.error.consent")}>
          <Link href="/app/parametres?onglet=confidentialite" className="font-medium underline">
            {t("ai.consent.declined.cta")}
          </Link>
        </Alert>
      )}
      {query.erreur === "quota" && typeof query.renouvellement === "string" && (
        <Alert
          tone="warning"
          title={t("career.interviews.quota.reached", { date: new Date(query.renouvellement) })}
        />
      )}
      {query.erreur === "invalid" && (
        <Alert tone="error" title={t("career.interviews.error.invalid")} />
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 flex-col gap-5">
          <form
            id="preparer"
            action={startInterviewAction}
            aria-labelledby="interview-setup"
            className={cx(card, "flex scroll-mt-24 flex-col gap-5 lg:p-[26px]")}
          >
            <h2 id="interview-setup" className={cardTitle}>
              {t("career.interviews.setup.title")}
            </h2>
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">{t("career.interviews.setup.mode")}</legend>
              {interviewModes.map((mode) => {
                const quota = quotas[mode];
                const locked = quota.limit === 0;
                const reached = quota.limit > 0 && quota.used >= quota.limit;
                return (
                  <label
                    key={mode}
                    className={cx(
                      "relative flex flex-col gap-2 rounded-[22px] p-4 ring-[1.5px] ring-brume ring-inset lg:p-[18px]",
                      locked
                        ? "cursor-not-allowed bg-creme/60"
                        : "cursor-pointer has-checked:bg-lime-clair/50 has-checked:ring-2 has-checked:ring-sapin",
                    )}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <IconTile icon={mode === "voice" ? "mic" : "doc"} size="sm" />
                      {locked ? (
                        <span className="flex items-center gap-1 rounded-pill bg-gris-clair px-2.5 py-1 text-[11px] font-semibold">
                          <Icon name="lock" className="size-3" />
                          {t("career.interviews.mode.locked", {
                            plan: talentPlanFor(plans, quotaKey(mode)),
                          })}
                        </span>
                      ) : (
                        <input
                          type="radio"
                          name="mode"
                          value={mode}
                          defaultChecked={mode === chosen}
                          className="size-5 accent-sapin"
                        />
                      )}
                    </span>
                    <span className="text-[17px] font-semibold">{modeLabel(mode)}</span>
                    <span className="text-xs text-ardoise">
                      {t(`career.interviews.mode.${mode}.desc`)}
                    </span>
                    {!locked && (
                      <>
                        <span className="text-[13px] font-semibold">
                          {quota.limit < 0
                            ? t("billing.quotas.unlimited")
                            : t(`career.interviews.quota.${mode}`, {
                                used: quota.used,
                                quota: quota.limit,
                              })}
                        </span>
                        {quota.limit > 0 && (
                          <span aria-hidden className="h-1.5 rounded-pill bg-brume">
                            <span
                              className="block h-full rounded-pill bg-sapin"
                              style={{
                                width: `${Math.min(100, (quota.used / quota.limit) * 100)}%`,
                              }}
                            />
                          </span>
                        )}
                      </>
                    )}
                    {reached && (
                      <span className="text-xs text-corail-fonce">
                        {t("career.interviews.quota.reached", { date: quota.resetsAt })}
                      </span>
                    )}
                  </label>
                );
              })}
            </fieldset>

            {open.length > 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    id="interview-job-title"
                    name="jobTitle"
                    label={t("career.interviews.setup.job.text")}
                    placeholder={t("career.interviews.setup.job.placeholder")}
                    minLength={2}
                    maxLength={120}
                    required
                  />
                  {jobs.length > 0 && (
                    <Select
                      id="interview-job"
                      name="jobId"
                      label={t("career.interviews.setup.job.fromOffer")}
                      defaultValue=""
                      options={[
                        { value: "", label: t("career.interviews.setup.job.none") },
                        ...jobs.map((job) => ({ value: job.id, label: job.title })),
                      ]}
                    />
                  )}
                </div>
                <Choice
                  name="type"
                  legend={t("career.interviews.setup.type.text")}
                  value="hr"
                  options={interviewTypes.map((type) => ({ value: type, label: typeLabel(type) }))}
                />
                <div className="flex flex-wrap gap-x-8 gap-y-5">
                  <Choice
                    name="level"
                    legend={t("career.interviews.setup.level.text")}
                    value="standard"
                    track
                    options={interviewLevels.map((level) => ({
                      value: level,
                      label: t(`career.interviews.setup.level.${level}`),
                    }))}
                  />
                  <Choice
                    name="durationMinutes"
                    legend={t("career.interviews.setup.duration.text")}
                    value="10"
                    track
                    options={interviewDurations.map((minutes) => ({
                      value: String(minutes),
                      label: t("career.interviews.setup.duration.value", { minutes }),
                      title: t("career.interviews.setup.questions", {
                        count: questionCount(minutes),
                      }),
                    }))}
                  />
                </div>
                <p className="text-xs text-ardoise">{t("career.interviews.session.hint")}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <button type="submit" className={pillClass("lime", "md", "h-12 px-6")}>
                    <Icon name="mic" className="size-4" />
                    {t("career.interviews.setup.start")}
                  </button>
                  {open.includes("voice") && (
                    <p className="max-w-[360px] text-xs text-ardoise">
                      {t("career.interviews.voice.micPermission")}
                    </p>
                  )}
                </div>
              </>
            )}
          </form>

          <section aria-labelledby="history" className="flex flex-col gap-3">
            <h2 id="history" className="text-[22px] font-semibold tracking-tight">
              {t("career.interviews.history.title")}
            </h2>
            {sessions.length === 0 ? (
              <EmptyState title={t("career.interviews.history.empty")} />
            ) : (
              <Table caption={t("career.interviews.history.title")}>
                <thead>
                  <tr>
                    <Th>{t("career.interviews.history.session")}</Th>
                    <Th>{t("career.interviews.history.date")}</Th>
                    <Th>{t("career.interviews.history.mode")}</Th>
                    <Th>
                      <span className="sr-only">{t("career.interviews.history.open")}</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-t border-brume">
                      <Td>
                        <span className="flex min-w-[170px] flex-col">
                          <span className="font-semibold">{typeLabel(session.type)}</span>
                          <span className="text-xs text-ardoise">{session.jobTitle}</span>
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap">{formatDate(session.createdAt)}</Td>
                      <Td>
                        <span className="inline-flex items-center gap-1 rounded-pill bg-gris-clair px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap">
                          {session.mode === "voice" && <Icon name="mic" className="size-3" />}
                          {modeLabel(session.mode)}
                        </span>
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        {session.status === "active" ? (
                          <Link
                            href={`/app/career/entretiens/${session.id}`}
                            className="font-semibold text-up-texte hover:underline"
                          >
                            {t("career.interviews.history.open")}
                          </Link>
                        ) : (
                          <Link
                            href={`/app/career/entretiens/${session.id}#retour`}
                            className="font-semibold text-up-texte hover:underline"
                          >
                            {t("career.interviews.history.feedback")}
                          </Link>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </section>
        </div>

        <AiPanel labelledBy="interview-feedback" className="self-start">
          {latest && feedback ? (
            <>
              <p className={cx(eyebrow, "text-neon")}>{t("career.interviews.feedback.title")}</p>
              <h2 id="interview-feedback" className="text-xl leading-tight font-semibold">
                {t("career.interviews.feedback.overall")}
              </h2>
              <p className="text-xs text-blanc/75">
                {t("career.interviews.feedback.latest", {
                  type: typeLabel(latest.type),
                  date: latest.createdAt,
                })}
                {" · "}
                {modeLabel(latest.mode)}
              </p>
              {feedback.summary && (
                <p className="text-sm leading-5 text-blanc/90">{line(feedback.summary)}</p>
              )}
              {feedback.criteria.length > 0 && (
                <dl className="flex flex-col gap-2.5">
                  {feedback.criteria.map((criterion) => (
                    <div
                      key={criterion.key}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5 border-b border-blanc/10 pb-2.5 text-[13px]"
                    >
                      <dt>{t(`career.interviews.feedback.criteria.${criterion.key}`)}</dt>
                      <dd className="font-semibold text-neon">
                        {t(`career.interviews.feedback.level.${criterion.level}`)}
                      </dd>
                      <dd aria-hidden className="col-span-2 h-1.5 rounded-pill bg-blanc/15">
                        <span
                          className={cx(
                            "block h-full rounded-pill bg-lime",
                            levelWidth[criterion.level],
                          )}
                        />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {(feedback.strengths.length > 0 || feedback.improvements.length > 0) && (
                <div className="flex flex-col gap-3 rounded-[18px] bg-sapin/40 p-4 ring-1 ring-blanc/10">
                  {(["strengths", "improvements"] as const).map((key) =>
                    feedback[key].length > 0 ? (
                      <div key={key} className="flex flex-col gap-1">
                        <h3 className="text-sm font-semibold">
                          {t(
                            key === "strengths"
                              ? "career.interviews.feedback.strengths"
                              : "career.interviews.feedback.improve",
                          )}
                        </h3>
                        <ul className="flex flex-col gap-1 text-xs leading-[17px] text-blanc/85">
                          {feedback[key].slice(0, 2).map((item, index) => (
                            <li key={index}>{line(item)}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null,
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Link href="#preparer" className={pillClass("lime", "sm")}>
                  {t("career.interviews.feedback.again")}
                </Link>
                <Link
                  href={`/app/career/entretiens/${latest.id}#retour`}
                  className={pillClass("ghost", "sm")}
                >
                  {t("career.interviews.feedback.perQuestion")}
                </Link>
              </div>
              <p className="text-xs leading-[17px] text-blanc/75">
                {feedback.source === "ai"
                  ? t("career.interviews.feedback.disclaimer")
                  : t("career.interviews.feedback.rules")}
              </p>
            </>
          ) : (
            <>
              <AiBrand />
              <h2 id="interview-feedback" className="text-xl leading-tight font-semibold">
                {t("career.interviews.feedback.title")}
              </h2>
              <p className="text-sm leading-5 text-blanc/90">
                {t("career.interviews.feedback.none")}
              </p>
              <p className="text-xs leading-[17px] text-blanc/75">
                {t("career.interviews.voice.noRecording")}
              </p>
            </>
          )}
        </AiPanel>
      </div>
    </>
  );
}

const levelWidth = { solid: "w-[85%]", developing: "w-[60%]", toWork: "w-[35%]" } as const;

/** Pills (type) or a segmented track (level, duration) of radios. */
function Choice({
  name,
  legend,
  value,
  options,
  track = false,
}: {
  name: string;
  legend: string;
  value: string;
  options: { value: string; label: string; title?: string }[];
  track?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className={cx("flex flex-wrap gap-2", track && "gap-1 rounded-pill bg-creme p-1")}>
        {options.map((option) => (
          <label
            key={option.value}
            title={option.title}
            className={cx(
              "flex h-9 cursor-pointer items-center rounded-pill px-3.5 text-[13px] font-semibold has-checked:bg-sapin has-checked:text-blanc has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sapin",
              !track && "ring-1 ring-brume ring-inset has-checked:ring-sapin",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === value}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
