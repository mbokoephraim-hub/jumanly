import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Alert, Badge, Button, EmptyState, Select, TextField } from "@/components/ui";
import { startInterviewAction } from "@/server/actions/career-interviews";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  interviewDurations,
  interviewJobs,
  interviewLevels,
  interviewModes,
  interviewQuota,
  interviewTypes,
  listInterviews,
  questionCount,
  quotaKey,
} from "@/server/services/interview-sim";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.interviews");
  return { title: { absolute: t("title") }, robots: { index: false } };
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

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/career" className="text-sm underline">
        {t("career.home.eyebrow")}
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{t("career.interviews.title")}</h1>
        <p className="text-ardoise">{t("career.interviews.subtitle")}</p>
      </header>

      <ul className="grid gap-4 md:grid-cols-2">
        {interviewModes.map((mode) => {
          const quota = quotas[mode];
          const reached = quota.limit > 0 && quota.used >= quota.limit;
          return (
            <li key={mode} className="flex flex-col gap-2 rounded-card bg-blanc p-5">
              <h2 className="font-semibold text-h3">{modeLabel(mode)}</h2>
              <p className="text-sm text-ardoise">{t(`career.interviews.mode.${mode}.desc`)}</p>
              {quota.limit === 0 ? (
                <Badge tone="sapin">
                  {t("career.interviews.mode.locked", {
                    plan: talentPlanFor(plans, quotaKey(mode)),
                  })}
                </Badge>
              ) : (
                <p className="text-sm font-medium">
                  {quota.limit < 0
                    ? t("billing.quotas.unlimited")
                    : t(`career.interviews.quota.${mode}`, {
                        used: quota.used,
                        quota: quota.limit,
                      })}
                </p>
              )}
              {reached && (
                <p className="text-sm text-corail-fonce">
                  {t("career.interviews.quota.reached", { date: quota.resetsAt })}
                </p>
              )}
            </li>
          );
        })}
      </ul>

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

      {open.length > 0 && (
        <form
          id="preparer"
          action={startInterviewAction}
          className="flex scroll-mt-24 flex-col gap-4 rounded-card bg-blanc p-6"
        >
          <h2 className="text-h2">{t("career.interviews.setup.title")}</h2>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-label">{t("career.interviews.setup.mode")}</legend>
            <div className="flex flex-wrap gap-4">
              {open.map((mode) => (
                <label key={mode} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    value={mode}
                    defaultChecked={mode === chosen}
                    className="size-5 accent-sapin"
                  />
                  {modeLabel(mode)}
                </label>
              ))}
            </div>
          </fieldset>
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
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              id="interview-type"
              name="type"
              label={t("career.interviews.setup.type.text")}
              defaultValue="hr"
              options={interviewTypes.map((type) => ({ value: type, label: typeLabel(type) }))}
            />
            <Select
              id="interview-level"
              name="level"
              label={t("career.interviews.setup.level.text")}
              defaultValue="standard"
              options={interviewLevels.map((level) => ({
                value: level,
                label: t(`career.interviews.setup.level.${level}`),
              }))}
            />
            <Select
              id="interview-duration"
              name="durationMinutes"
              label={t("career.interviews.setup.duration.text")}
              defaultValue="10"
              options={interviewDurations.map((minutes) => ({
                value: String(minutes),
                label: [
                  t("career.interviews.setup.duration.value", { minutes }),
                  t("career.interviews.setup.questions", { count: questionCount(minutes) }),
                ].join(" · "),
              }))}
            />
          </div>
          <p className="text-sm text-ardoise">{t("career.interviews.session.hint")}</p>
          <div>
            <Button type="submit">{t("career.interviews.setup.start")}</Button>
          </div>
        </form>
      )}

      <section aria-labelledby="history" className="flex flex-col gap-3">
        <h2 id="history" className="text-h2">
          {t("career.interviews.history.title")}
        </h2>
        {sessions.length === 0 ? (
          <EmptyState title={t("career.interviews.history.empty")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-blanc p-4"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-semibold">{session.jobTitle}</span>
                  <span className="text-sm text-ardoise">
                    {t("career.interviews.history.item", {
                      type: typeLabel(session.type),
                      date: session.createdAt,
                      mode: modeLabel(session.mode),
                    })}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  {session.status === "active" && (
                    <Badge tone="warning">{t("career.interviews.history.inProgress")}</Badge>
                  )}
                  <Link href={`/app/career/entretiens/${session.id}`} className="underline">
                    {t("career.interviews.history.open")}
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
