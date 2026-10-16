import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { ApplicationStats } from "@/components/jobs/application-stats";
import { AppPageHeader } from "@/components/app/page-header";
import { AiBrand, AiPanel, Why, pillClass } from "@/components/career/kit";
import { tag, tagTone } from "@/components/jobs/talent-kit";
import { criterionText } from "@/components/matching/talent-why";
import { Alert, CompanyLogo, EmptyState, segmentedItem, segmentedList } from "@/components/ui";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { formatRelative } from "@/lib/dates";
import { withdrawAction } from "@/server/actions/jobs";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { matchesForUser } from "@/server/matching/service";
import {
  applicationTracker,
  isClosedStatus,
  listApplications,
  talentStatus,
  type TalentApplicationStatus,
} from "@/server/services/applications";
import { jobCards, matchingJobIds, parseJobFilters } from "@/server/services/jobs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.jobs.applications");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/** Status pill colours (mockup 03-19): the stage reached in Lime, a test in Néon, ended in Brume. */
const statusTone: Record<TalentApplicationStatus, string> = {
  sent: tagTone.brume,
  viewed: tagTone.menthe,
  shortlisted: tagTone.lime,
  test: tagTone.neon,
  interview: "bg-lime text-sapin",
  offer: tagTone.sapin,
  hired: tagTone.sapin,
  notSelected: tagTone.brume,
  withdrawn: tagTone.brume,
  jobClosed: tagTone.brume,
};

/** A new offer is suggested in the side panel from this score. */
const STRONG_MATCH = 85;

const stageName = (payload: unknown) =>
  payload && typeof payload === "object" && "to" in payload && typeof payload.to === "string"
    ? payload.to
    : null;

const bandOf = (explanation: unknown) =>
  explanation &&
  typeof explanation === "object" &&
  "band" in explanation &&
  typeof explanation.band === "string"
    ? explanation.band
    : null;

/**
 * « Mes candidatures » (partie 07 § 5, mockup 03-19): each application with the steps the recruiter
 * defined, its history and next appointment, the CV that was sent and the withdrawal. The score is
 * the one frozen when the talent applied; it never decides anything.
 */
export default async function ApplicationsPage({
  searchParams,
}: PageProps<"/app/jobs/candidatures">) {
  const params = await searchParams;
  const user = await requireUser("/app/jobs/candidatures");
  const t = await getTranslations("talent.jobs.applications");
  const tr = await getTranslations();
  const d = dynamic(tr);
  const format = await getFormatter();
  const now = new Date();
  const applications = (await listApplications(db, user.id)).map((application) => ({
    ...application,
    talentStatus: talentStatus(application, now),
  }));
  const active = applications.filter((item) => !isClosedStatus(item.talentStatus));
  const closed = applications.filter((item) => isClosedStatus(item.talentStatus));
  const tab =
    params.onglet === "terminees"
      ? "terminees"
      : params.onglet === "toutes"
        ? "toutes"
        : "en-cours";
  const shown = tab === "terminees" ? closed : tab === "toutes" ? applications : active;
  const tabs = [
    { id: "en-cours", label: t("tab.active", { count: active.length }) },
    { id: "terminees", label: t("tab.closed", { count: closed.length }) },
    { id: "toutes", label: t("tab.all") },
  ];
  const statuses = applications.map((item) => item.talentStatus);
  const reached = (kinds: TalentApplicationStatus[]) =>
    statuses.filter((status) => kinds.includes(status)).length;

  // Side panel: the best open offer the talent has not applied to yet, when it is very compatible.
  const appliedJobs = new Set(applications.map((item) => item.jobId));
  const candidates = (await matchingJobIds(db, parseJobFilters({}), now, 60)).filter(
    (id) => !appliedJobs.has(id),
  );
  const scores = await matchesForUser(db, user.id, candidates, now);
  const strong = candidates
    .flatMap((id) => {
      const match = scores.get(id);
      return match?.state === "ok" && match.explanation.score >= STRONG_MATCH
        ? [{ id, explanation: match.explanation }]
        : [];
    })
    .sort((a, b) => b.explanation.score - a.explanation.score);
  const [suggested] = strong[0] ? await jobCards(db, [strong[0].id]) : [];
  const reviewSlug = active.find((item) => item.matchScore !== null)?.job.slug;

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <AppPageHeader title={t("title")} subtitle={t("subtitle")} />
      {params.ok === "retiree" && <Alert tone="success" title={t("withdrawn.toast")} />}
      <nav
        aria-label={t("title")}
        className={cx(segmentedList, "[scrollbar-width:none] overflow-x-auto")}
      >
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/app/jobs/candidatures?onglet=${item.id}`}
            aria-current={tab === item.id ? "page" : undefined}
            className={segmentedItem(tab === item.id)}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          {applications.length === 0 ? (
            <EmptyState
              title={t("empty.text")}
              action={
                <Link href="/app/jobs" className={pillClass("dark")}>
                  {t("empty.cta")}
                </Link>
              }
            />
          ) : shown.length === 0 ? (
            <p className="rounded-[24px] bg-blanc p-6 text-center text-sm text-ardoise">
              {t("tab.empty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {shown.map((application, index) => {
                const status = application.talentStatus;
                const ended = isClosedStatus(status);
                const jobHref = `/app/jobs/${application.job.slug}`;
                const band = bandOf(application.matchExplanation);
                const lastChange = application.events.at(-1)?.createdAt ?? application.updatedAt;
                const updated = t("updated", { time: formatRelative(lastChange, now) });
                const steps = ended ? [] : applicationTracker(application, status);
                const reachedIndex = steps.findIndex((step) => step.state === "current");
                const progress =
                  steps.length > 1
                    ? (reachedIndex < 0 ? steps.length - 1 : reachedIndex) / (steps.length - 1)
                    : 0;
                const interview = application.interviews.find(
                  (item) => item.startsAt && item.startsAt > now,
                );
                const conversation = application.conversation;
                const withdrawable = application.status === "active" && !ended;
                const score =
                  application.matchScore !== null ? (
                    <span
                      className={cx(tag, "h-[26px] bg-gradient-ai text-blanc")}
                      aria-label={
                        band
                          ? t("score", {
                              score: application.matchScore,
                              band: d(`match.band.${band}.text`),
                            })
                          : undefined
                      }
                    >
                      <Icon name="intelligence" className="size-3 text-neon" />
                      {tr("talent.jobs.card.compatibility.text", {
                        score: application.matchScore,
                      })}
                    </span>
                  ) : null;
                const why =
                  application.matchScore !== null ? (
                    <Link
                      href={`${jobHref}#compatibilite`}
                      className="jm-tap flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap text-[#14745F] hover:underline"
                    >
                      <Icon name="eye" className="size-3.5" />
                      {tr("common.why")}
                      <span className="sr-only">{application.job.title}</span>
                    </Link>
                  ) : null;
                const withdraw = withdrawable ? (
                  <details className="group/withdraw w-full lg:w-auto">
                    <summary className="cursor-pointer list-none text-[13px] text-ardoise hover:text-sapin hover:underline [&::-webkit-details-marker]:hidden">
                      {t("withdraw.text")}
                    </summary>
                    <form
                      action={withdrawAction}
                      className="mt-3 flex flex-col items-start gap-3 rounded-[18px] bg-creme p-4 text-sm lg:absolute lg:right-6 lg:z-20 lg:w-80 lg:shadow-menu"
                    >
                      <input type="hidden" name="id" value={application.id} />
                      <p className="font-semibold">{t("withdraw.confirm.title")}</p>
                      <p>{t("withdraw.confirm.body")}</p>
                      <button
                        type="submit"
                        className={pillClass("dark", "sm", "bg-[#B3261E] hover:bg-[#B3261E]/90")}
                      >
                        {t("withdraw.confirm.cta")}
                      </button>
                    </form>
                  </details>
                ) : null;
                const sentCv =
                  application.cvSnapshot !== null ? (
                    <a
                      href={`/app/jobs/candidatures/${application.id}/cv`}
                      className={pillClass("outline", "sm")}
                    >
                      {t("viewSentCv")}
                    </a>
                  ) : null;

                return (
                  <li
                    key={application.id}
                    className={cx(
                      "relative flex flex-col gap-4 rounded-[24px] bg-blanc p-4 lg:px-6 lg:py-[22px]",
                      !ended && "has-[details[name=application-detail][open]]:ring-2",
                      "ring-sapin",
                    )}
                  >
                    <div className="flex items-start gap-3 lg:gap-4">
                      <CompanyLogo
                        name={application.job.organization.name}
                        size="md"
                        className="size-11! rounded-[14px]! text-base! lg:size-[52px]! lg:rounded-[16px]! lg:text-lg!"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1 pr-8 lg:pr-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-[15px] leading-5 font-semibold tracking-[-0.01em] lg:text-base">
                            <Link href={jobHref} className="hover:underline">
                              {application.job.title}
                            </Link>
                          </h2>
                          <span className={cx(tag, statusTone[status], "max-lg:hidden")}>
                            {t(`status.${status}`)}
                          </span>
                        </div>
                        <p className="text-xs text-ardoise lg:text-[13px]">
                          {application.job.organization.name}
                          <span aria-hidden className="mx-1">
                            {"·"}
                          </span>
                          {t("sentOn", { date: application.createdAt })}
                          {!ended && (
                            <span className="max-lg:hidden">
                              <span aria-hidden className="mx-1">
                                {"·"}
                              </span>
                              {updated}
                            </span>
                          )}
                        </p>
                      </div>
                      {!ended && (
                        <div className="hidden shrink-0 flex-col items-end gap-1.5 pr-10 lg:flex">
                          {score}
                          {why}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 lg:hidden">
                      <span className={cx(tag, statusTone[status])}>{t(`status.${status}`)}</span>
                      {!ended && score}
                    </div>

                    {steps.length > 0 && (
                      <ol aria-label={t("tracker")} className="relative flex items-start">
                        <span
                          aria-hidden
                          className="absolute top-3 h-[3px] rounded-full bg-brume"
                          style={{ left: `${50 / steps.length}%`, right: `${50 / steps.length}%` }}
                        />
                        <span
                          aria-hidden
                          className="absolute top-3 h-[3px] rounded-full bg-lime"
                          style={{
                            left: `${50 / steps.length}%`,
                            width: `calc((100% - ${100 / steps.length}%) * ${progress})`,
                          }}
                        />
                        {steps.map((step) => (
                          <li
                            key={step.key}
                            aria-current={step.state === "current" ? "step" : undefined}
                            className="relative z-10 flex flex-1 flex-col items-center gap-1.5"
                          >
                            <span
                              aria-hidden
                              className={cx(
                                "flex size-[26px] items-center justify-center rounded-full",
                                step.state === "done" && "bg-lime text-sapin",
                                step.state === "current" &&
                                  "bg-sapin text-neon shadow-[0_0_0_5px_#E4FAD0]",
                                step.state === "next" &&
                                  "bg-blanc ring-[1.5px] ring-brume ring-inset",
                              )}
                            >
                              {step.state === "done" && <Icon name="check" className="size-3.5" />}
                              {step.state === "current" && (
                                <span className="size-2 rounded-full bg-neon" />
                              )}
                            </span>
                            <span
                              className={cx(
                                "text-center text-[11px] leading-[14px] max-lg:sr-only",
                                step.state === "current" ? "font-semibold" : "text-ardoise",
                              )}
                            >
                              {t(`status.${step.status}`)}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}

                    {!ended && (
                      <div className="flex items-center justify-between gap-2 text-xs text-ardoise lg:hidden">
                        <span>{updated}</span>
                        {why}
                      </div>
                    )}

                    {application.events.length > 0 && (
                      <details
                        name="application-detail"
                        open={tab !== "terminees" && index === 0 && !ended}
                        className="group/detail"
                      >
                        <summary
                          aria-label={t("toggle", { job: application.job.title })}
                          className="absolute top-4 right-4 flex size-8 cursor-pointer list-none items-center justify-center rounded-full text-sapin hover:bg-creme lg:top-[30px] lg:right-5 [&::-webkit-details-marker]:hidden"
                        >
                          <Icon
                            name="chev-d"
                            className="size-[18px] transition-transform group-open/detail:rotate-180"
                          />
                        </summary>
                        <div className="flex flex-col gap-4 rounded-[18px] bg-creme px-[18px] py-4 lg:flex-row lg:gap-5">
                          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                            <p className="text-[11px] font-semibold tracking-[0.09em] text-ardoise uppercase">
                              {t("timeline.text")}
                            </p>
                            <ol className="flex flex-col gap-2.5">
                              {[...application.events].reverse().map((event, position) => (
                                <li
                                  key={event.id}
                                  className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[13px]"
                                >
                                  <span
                                    aria-hidden
                                    className={cx(
                                      "size-2 shrink-0 rounded-full",
                                      position === 0 ? "bg-sapin" : "bg-[#8A9794]",
                                    )}
                                  />
                                  <span className="w-24 text-ardoise">
                                    {format.dateTime(event.createdAt, { dateStyle: "medium" })}
                                  </span>
                                  <span className={cx(position === 0 && "font-semibold")}>
                                    {event.type === "stage_changed"
                                      ? t("event.stage_changed", {
                                          stage: stageName(event.payload) ?? application.stage.name,
                                        })
                                      : event.type === "viewed"
                                        ? t("status.viewed")
                                        : event.type === "withdrawn"
                                          ? t("event.withdrawn")
                                          : event.type === "decision"
                                            ? t("event.decision")
                                            : t("event.submitted")}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </div>
                          <div className="flex flex-col gap-2 lg:w-[260px]">
                            {interview?.startsAt && (
                              <p className="flex items-center gap-2.5 rounded-[14px] bg-lime px-3 py-2.5 text-sapin">
                                <Icon name="calendrier" className="size-[18px] shrink-0" />
                                <span className="flex flex-col">
                                  <span className="text-[13px] font-semibold">
                                    {tr("connect.invite.format", {
                                      mode: tr(
                                        `connect.invite.mode.${interview.mode === "audio" ? "call" : interview.mode}`,
                                      ),
                                      minutes: interview.durationMinutes,
                                    })}
                                  </span>
                                  <span className="text-xs">
                                    {tr("connect.invite.time", {
                                      time: format.dateTime(interview.startsAt, {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        timeZone: interview.timezone,
                                      }),
                                      timezone: interview.timezone,
                                    })}
                                  </span>
                                </span>
                              </p>
                            )}
                            <p className="text-xs text-ardoise">{t("status.help")}</p>
                          </div>
                        </div>
                      </details>
                    )}

                    {status === "notSelected" && (
                      <div className="flex flex-col items-start gap-2 rounded-[18px] bg-brume/60 px-4 py-3 text-[13px] lg:flex-row lg:items-center lg:gap-3">
                        <Icon name="info" className="size-[18px] shrink-0 max-lg:hidden" />
                        <span className="flex-1">{t("notSelected.note")}</span>
                        <Link
                          href="/app/jobs?vue=recommandees"
                          className="font-semibold whitespace-nowrap text-feuille-fonce hover:underline"
                        >
                          {t("notSelected.cta")}
                        </Link>
                      </div>
                    )}
                    {status === "hired" && (
                      <Alert
                        tone="success"
                        title={t("hired.note", { firstName: user.firstName ?? user.name })}
                      />
                    )}

                    {/* Desktop: every action in one row. */}
                    <div className="hidden flex-wrap items-center gap-2 lg:flex">
                      {conversation && (
                        <Link
                          href={`/app/messages/${conversation.id}`}
                          className={pillClass("dark", "sm")}
                        >
                          <Icon name="message" className="size-4" />
                          {t("messages", { count: conversation._count.messages })}
                        </Link>
                      )}
                      <Link href={jobHref} className={pillClass("outline", "sm")}>
                        {t("viewJob")}
                      </Link>
                      {sentCv}
                      <span className="flex-1" />
                      {withdraw}
                    </div>

                    {/* Phone: the conversation first, the rest behind « … ». */}
                    <div className="flex items-center gap-2 lg:hidden">
                      <Link
                        href={conversation ? `/app/messages/${conversation.id}` : jobHref}
                        className={pillClass(conversation ? "dark" : "outline", "sm", "flex-1")}
                      >
                        {conversation ? t("openConversation") : t("viewJob")}
                      </Link>
                      {(conversation || sentCv || withdraw) && (
                        <details className="group/more relative">
                          <summary
                            aria-label={t("more")}
                            className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full bg-blanc text-sapin ring-1 ring-brume ring-inset [&::-webkit-details-marker]:hidden"
                          >
                            <Icon name="more" className="size-[18px]" />
                          </summary>
                          <div className="absolute right-0 bottom-full z-20 mb-2 flex w-[min(20rem,calc(100vw-4rem))] flex-col items-start gap-3 rounded-[18px] bg-blanc p-4 shadow-menu ring-1 ring-sapin/8">
                            {conversation && (
                              <Link href={jobHref} className="text-sm font-semibold underline">
                                {t("viewJob")}
                              </Link>
                            )}
                            {application.cvSnapshot !== null && (
                              <a
                                href={`/app/jobs/candidatures/${application.id}/cv`}
                                className="text-sm font-semibold underline"
                              >
                                {t("viewSentCv")}
                              </a>
                            )}
                            {withdraw}
                          </div>
                        </details>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="flex items-center justify-center gap-2 text-xs text-ardoise lg:hidden">
            <Icon name="check" className="size-3.5 text-feuille" />
            {tr("talent.jobs.sidebar.free")}
          </p>
        </div>

        <aside className="flex flex-col gap-4 max-lg:hidden">
          <ApplicationStats
            headingId="applications-counts"
            counts={{
              sent: statuses.length,
              viewed: statuses.filter(
                (status) => status !== "sent" && status !== "withdrawn" && status !== "jobClosed",
              ).length,
              interviews: reached(["interview"]),
              offers: reached(["offer", "hired"]),
            }}
          />

          {suggested && strong[0] && (
            <AiPanel labelledBy="applications-ai">
              <AiBrand />
              <h2 id="applications-ai" className="text-lg leading-6 font-semibold">
                {t("ai.title", { count: strong.length })}
              </h2>
              <p className="text-[13px] text-blanc/80">
                {t("ai.job", {
                  job: suggested.title,
                  company: suggested.organization.name,
                  score: Math.round(strong[0].explanation.score),
                })}
              </p>
              {(() => {
                const fitting = strong[0].explanation.criteria
                  .filter((criterion) => criterion.value >= 0.8)
                  .slice(0, 2)
                  .map((criterion) => d(`match.criterion.${criterionText[criterion.key]}.text`));
                return fitting.length > 0 ? (
                  <Why dark>{t("ai.reason", { criteria: fitting.join(", ") })}</Why>
                ) : null;
              })()}
              <Link
                href={`/app/jobs/${suggested.slug}`}
                className={pillClass("lime", "sm", "self-start")}
              >
                {t("viewJob")}
              </Link>
            </AiPanel>
          )}

          {reviewSlug && (
            <section
              aria-labelledby="applications-review"
              className="flex flex-col gap-2 rounded-[24px] bg-blanc p-5"
            >
              <h2 id="applications-review" className="text-[15px] font-semibold">
                {t("review.title")}
              </h2>
              <p className="text-[13px] text-ardoise">{t("review.body")}</p>
              <Link
                href={`/app/jobs/${reviewSlug}#revision`}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-feuille-fonce hover:underline"
              >
                <Icon name="alerte" className="size-4" />
                {t("reportError")}
              </Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
