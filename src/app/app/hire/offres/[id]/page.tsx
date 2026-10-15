import type { Metadata } from "next";
import Link from "next/link";
import { ModerationChanges } from "@/components/hire/moderation-changes";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { CopyButton } from "@/components/career/copy-button";
import { pillClass } from "@/components/career/kit";
import { JobSettings } from "@/components/hire/job-settings";
import {
  Initials,
  Kpi,
  MenuChip,
  OrgMark,
  jobStatusTone,
  menuItem,
  moreButton,
  stageTone,
  statusKey,
  type StageTone,
} from "@/components/hire/kit";
import { PipelineBoard, type BoardCard } from "@/components/hire/pipeline-board";
import { tag } from "@/components/jobs/talent-kit";
import { ScoreButton, WhyPopover } from "@/components/matching/why-popover";
import { SuccessBurst } from "@/components/motion/success-burst";
import { TabRail } from "@/components/motion/tab-rail";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { Alert } from "@/components/ui";
import { cx } from "@/lib/cx";
import { siteUrl } from "@/lib/seo";
import { moveApplicationAction, publishJobAction } from "@/server/actions/hire";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import type { MatchExplanation } from "@/server/matching/types";
import { applicationMatches } from "@/server/matching/service";
import {
  getPipeline,
  HireError,
  hirePermissions,
  listOrgJobs,
  pipelineDetails,
  RESPONSE_GOAL_DAYS,
} from "@/server/services/hire";
import { cheapestPlanWhere, levelOf, listPublicPlans } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.pipeline");
  return { title: t("title"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * Pipeline of a job (partie 07 § 4, mockup 04-04): the job's figures, one column per stage with
 * drag and drop, the score on the AI gradient with its « Pourquoi ? ». Each card also moves with
 * a small form (keyboard, no JavaScript); « Non retenu » opens the decision form. With
 * `hire.matching.level` the cards show the score frozen at application and can be sorted or
 * narrowed by compatibility; nobody is ever hidden or rejected by the score alone (§ 8.6).
 */
export default async function PipelinePage({
  params,
  searchParams,
}: PageProps<"/app/hire/offres/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { space, ctx } = await requireHire(`/app/hire/offres/${id}`, "readApplications");
  const t = await getTranslations("hire");
  const all = await getTranslations();
  const format = await getFormatter();
  const { job, stages, applications } = await getPipeline(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const permissions = hirePermissions(ctx.role);
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [matchingLevel, details, jobs, plans] = await Promise.all([
    level(db, subject, "hire.matching.level"),
    pipelineDetails(db, ctx, job, applications),
    listOrgJobs(db, ctx),
    listPublicPlans(db),
  ]);
  const withMatching = matchingLevel !== "none";
  const explainable = matchingLevel === "explainable";
  const matches = withMatching
    ? await applicationMatches(db, applications)
    : new Map<string, never>();
  const scoreOf = (applicationId: string) => {
    const match = matches.get(applicationId);
    return match && match !== "disabled" ? match : null;
  };
  // Average of the scores shown on the cards (computed here, not the stored snapshot).
  const shownScores = applications
    .map((application) => scoreOf(application.id)?.score)
    .filter((value): value is number => value !== undefined)
    .sort((a, b) => b - a);
  const meanOf = (values: number[]) =>
    values.length
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : null;
  const compatibility = {
    average: meanOf(shownScores),
    top: meanOf(shownScores.slice(0, 10)),
  };
  const byScore = withMatching && query.tri === "score";
  const narrowed = withMatching && query.compat === "haut";
  const list = byScore
    ? [...applications].sort((a, b) => (scoreOf(b.id)?.score ?? -1) - (scoreOf(a.id)?.score ?? -1))
    : [...applications].reverse();
  // The compatibility filter only narrows the view; the other candidates stay in the pipeline.
  const visible = narrowed
    ? list.filter((application) => {
        const band = scoreOf(application.id)?.band;
        return band === "veryHigh" || band === "high";
      })
    : list;
  const matchingPlan = withMatching
    ? null
    : (cheapestPlanWhere(plans, ["rh", "company"], (plan) =>
        ["suggestions", "explainable"].includes(levelOf(plan, "hire.matching.level")),
      )?.name ?? null);
  const explainPlan = explainable
    ? null
    : (cheapestPlanWhere(
        plans,
        ["rh", "company"],
        (plan) => levelOf(plan, "hire.matching.level") === "explainable",
      )?.name ?? null);
  const base = `/app/hire/offres/${job.id}`;
  const hrefWith = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams();
    for (const key of ["tri", "compat", "vue", "etape"]) {
      const value = one(query[key]);
      if (value) next.set(key, value);
    }
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const text = next.toString();
    return text ? `${base}?${text}` : base;
  };
  const back = hrefWith({});
  const listView = query.vue === "liste";
  const columns = stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    tone: stageTone[stage.kind as StageTone] ?? "bg-brume",
    folded: stage.kind === "hired" || stage.kind === "rejected",
  }));
  const countOf = (stageId: string) =>
    visible.filter((application) => application.stageId === stageId).length;
  const wantedStage = one(query.etape);
  const mobileStage =
    stages.find((stage) => stage.id === wantedStage)?.id ??
    stages.find((stage) => countOf(stage.id) > 0 && stage.kind !== "rejected")?.id ??
    stages[0]!.id;
  const publicUrl = `${siteUrl()}/offres/${job.slug}`;
  const messages = await getMessages();
  const days = (value: number) =>
    format.number(value, { maximumFractionDigits: 1, minimumFractionDigits: 0 });

  const whyPanel = (applicationId: string, name: string, match: MatchExplanation) => (
    <WhyPopover
      id={applicationId}
      name={name}
      match={match}
      explainable={explainable}
      explainPlan={explainPlan}
      link={{
        href: `/app/hire/candidats/${applicationId}#score-title`,
        label: t("pipeline.action.view"),
      }}
    />
  );

  const cards: BoardCard[] = visible.map((application) => {
    const person = application.profile.user;
    const extra = details.cards.get(application.id)!;
    const match = scoreOf(application.id);
    const stage = stages.find((item) => item.id === application.stageId)!;
    const others = stages.filter((item) => item.id !== stage.id);
    const unseen = !application.viewedAt && application.status === "active";
    const moving = permissions.manage && application.status !== "withdrawn";
    const profileHref = `/app/hire/candidats/${application.id}`;
    const body = (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <Initials name={person.name} size={34} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Link
              href={profileHref}
              className="truncate text-[13.5px] leading-[18px] font-semibold hover:underline"
            >
              {person.name}
            </Link>
            {person.city && (
              <span className="truncate text-[11.5px] leading-4 text-ardoise">{person.city}</span>
            )}
          </div>
          {match && (
            <div className="flex flex-col items-end gap-1 lg:hidden">
              <ScoreButton
                id={application.id}
                score={all("ui.percent", { value: match.score })}
                aria={t("pipeline.card.score.aria", {
                  score: match.score,
                  band: all(`match.band.${match.band}.text`),
                })}
              />
              <span className="flex items-center gap-1 text-[11px] font-medium text-sapin">
                <Icon name="eye" className="size-3.5" />
                {all("ai.card.why")}
              </span>
            </div>
          )}
          {moving && (
            <MenuChip
              group={`card-${job.id}`}
              align="right"
              label={t("pipeline.card.menu")}
              summary={<Icon name="more" className="size-4" />}
              summaryClassName={cx(moreButton, "size-7 ring-0 max-lg:hidden")}
            >
              <Link href={profileHref} className={menuItem}>
                <Icon name="profil" />
                {t("pipeline.action.view")}
              </Link>
              <p className="px-3 pt-2 text-[11px] font-semibold tracking-[0.08em] text-ardoise uppercase">
                {t("pipeline.action.moveTo")}
              </p>
              {others.map((item) => (
                <form key={item.id} action={moveApplicationAction}>
                  <input type="hidden" name="application" value={application.id} />
                  <input type="hidden" name="back" value={back} />
                  <input type="hidden" name="stage" value={item.id} />
                  <button type="submit" className={menuItem}>
                    <span
                      aria-hidden
                      className={cx("size-2 rounded-full", stageTone[item.kind as StageTone])}
                    />
                    {item.name}
                  </button>
                </form>
              ))}
            </MenuChip>
          )}
        </div>
        {(extra.skills.length > 0 || match) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {extra.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-pill bg-gris-clair px-2.5 py-1 text-[11px] leading-[14px] font-semibold"
              >
                {skill}
              </span>
            ))}
            {match && (
              <span className="ml-auto max-lg:hidden">
                <ScoreButton
                  id={application.id}
                  score={all("ui.percent", { value: match.score })}
                  aria={t("pipeline.card.score.aria", {
                    score: match.score,
                    band: all(`match.band.${match.band}.text`),
                  })}
                />
              </span>
            )}
          </div>
        )}
        {extra.certified && (
          <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-feuille-fonce">
            <Icon name="certificat" className="size-3.5" />
            {t("pipeline.card.certificate")}
          </p>
        )}
        {application.status === "withdrawn" && (
          <span className={cx(tag, "self-start bg-gris-clair")}>
            {t("pipeline.card.withdrawn")}
          </span>
        )}
        <div className="flex items-center justify-between gap-2 text-[11px] leading-4 whitespace-nowrap text-ardoise">
          {extra.rating ? (
            <span
              className="text-[12px] tracking-[0.1em] text-feuille-fonce"
              role="img"
              aria-label={t("pipeline.card.rating.aria", { rating: extra.rating })}
            >
              {"★".repeat(extra.rating)}
              <span className="text-brume">{"★".repeat(5 - extra.rating)}</span>
            </span>
          ) : (
            <span>{t("pipeline.card.notRated")}</span>
          )}
          {extra.interviewAt ? (
            <span className="flex items-center gap-1">
              <Icon name="calendrier" className="size-3.5" />
              {format.dateTime(extra.interviewAt, { dateStyle: "short", timeStyle: "short" })}
            </span>
          ) : extra.notes > 0 ? (
            <span className="flex items-center gap-1">
              <Icon name="message" className="size-3.5" />
              {t("pipeline.card.comments", { count: extra.notes })}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              {unseen && (
                <span className="rounded-pill bg-lime px-1.5 py-px text-[10px] font-bold text-sapin">
                  {t("jobs.row.new", { count: 1 })}
                </span>
              )}
              <Icon name="horloge" className="size-3.5" />
              {format.relativeTime(application.createdAt)}
            </span>
          )}
        </div>
        {/* Phones: the actions of the mockup under each card. */}
        <div className="flex items-center gap-2 lg:hidden">
          {moving && (
            <Link
              href={`/app/hire/entretiens?candidature=${application.id}#planifier`}
              className={pillClass("dark", "sm", "flex-1")}
            >
              <Icon name="calendrier" className="size-4" />
              {t("pipeline.action.schedule")}
            </Link>
          )}
          <Link href={profileHref} className={pillClass("outline", "sm", "flex-1")}>
            {t("pipeline.action.view")}
          </Link>
          {moving && (
            <MenuChip
              group={`card-m-${job.id}`}
              align="right"
              label={t("pipeline.card.menu")}
              summary={<Icon name="more" className="size-4" />}
              summaryClassName={cx(moreButton, "size-9")}
            >
              <p className="px-3 pt-2 text-[11px] font-semibold tracking-[0.08em] text-ardoise uppercase">
                {t("pipeline.action.moveTo")}
              </p>
              {others.map((item) => (
                <form key={item.id} action={moveApplicationAction}>
                  <input type="hidden" name="application" value={application.id} />
                  <input type="hidden" name="back" value={back} />
                  <input type="hidden" name="stage" value={item.id} />
                  <button type="submit" className={menuItem}>
                    <span
                      aria-hidden
                      className={cx("size-2 rounded-full", stageTone[item.kind as StageTone])}
                    />
                    {item.name}
                  </button>
                </form>
              ))}
            </MenuChip>
          )}
        </div>
        {match && whyPanel(application.id, person.name, match)}
      </div>
    );
    return {
      id: application.id,
      stageId: application.stageId,
      name: person.name,
      movable: moving,
      body,
    };
  });

  const chip =
    "inline-flex h-10 items-center gap-2 rounded-pill bg-blanc px-4 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset hover:bg-creme";
  const chipOn =
    "inline-flex h-10 items-center gap-2 rounded-pill bg-sapin px-4 text-[13px] font-semibold text-blanc";

  return (
    <div className="jm-page flex flex-col gap-4 lg:gap-5">
      {query.ok === "deplacee" && <ToastOnLoad message={t("pipeline.moved.notified")} />}
      <AppPageHeader
        eyebrow={t("pipeline.eyebrow", { org: space.organization.name })}
        title={t("pipeline.title")}
        actions={
          permissions.manage ? (
            <Link href="/app/hire/offres/nouvelle" className={pillClass("lime", "md")}>
              <Icon name="plus" className="size-4" />
              {t("pipeline.newJob")}
            </Link>
          ) : undefined
        }
      />

      {query.publiee === "1" && (
        <SuccessBurst
          title={t("jobForm.publish.success.title")}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <CopyButton
                value={publicUrl}
                label={t("jobForm.publish.success.share")}
                copiedLabel={all("toast.linkCopied")}
                className={pillClass("lime", "sm")}
              />
              <Link href={`/offres/${job.slug}`} className={pillClass("outline", "sm")}>
                {t("jobForm.preview.title")}
              </Link>
            </div>
          }
        >
          <p className="text-[14px] text-ardoise">{t("jobForm.publish.success.body")}</p>
        </SuccessBurst>
      )}
      {query.publiee === "verification" && <Alert title={t("jobForm.publish.success.review")} />}
      {job.status === "rejected" && job.moderationReason && (
        <Alert tone="error" title={t("jobs.rejected.reason", { reason: job.moderationReason })} />
      )}
      {job.status === "changes_requested" && (
        <ModerationChanges
          job={job}
          fixHref={permissions.manage ? `/app/hire/offres/${job.id}/modifier` : undefined}
        />
      )}
      {!permissions.manage && <Alert title={t("pipeline.permission.readOnly")} />}

      <section
        aria-label={t("dashboard.kpi.applications.text")}
        className="grid gap-4 max-lg:hidden lg:grid-cols-4"
      >
        <Kpi
          label={t("dashboard.kpi.applications.text")}
          value={String(applications.length)}
          number={applications.length}
          icon="equipe"
          disc="bg-lime-clair"
        >
          <span className={cx(tag, "bg-lime-clair")}>
            {t("dashboard.kpi.applications.delta", { count: details.thisWeek })}
          </span>
        </Kpi>
        <Kpi
          label={t("dashboard.kpi.responseTime.text")}
          value={
            details.responseDays === null
              ? t("dashboard.kpi.none")
              : t("dashboard.kpi.responseTime.value", { days: days(details.responseDays) })
          }
          icon="horloge"
          disc="bg-neon/50"
        >
          <span className={cx(tag, "bg-gris-clair")}>
            {t("dashboard.kpi.responseTime.goal", { days: RESPONSE_GOAL_DAYS })}
          </span>
        </Kpi>
        <Kpi
          label={t("dashboard.kpi.interviews.text")}
          value={String(details.interviews)}
          number={details.interviews}
          icon="calendrier"
          disc="bg-menthe-claire"
        >
          <span className={cx(tag, "bg-gris-clair")}>
            {t("dashboard.kpi.interviews.week", { count: details.interviewsThisWeek })}
          </span>
        </Kpi>
        <Kpi
          label={t("dashboard.kpi.avgCompatibility.text")}
          value={
            withMatching && compatibility.average !== null
              ? all("ui.percent", { value: compatibility.average })
              : t("dashboard.kpi.none")
          }
          icon="intelligence"
          ai
        >
          {withMatching && compatibility.top !== null ? (
            <span className={cx(tag, "bg-gris-clair")}>
              {t("dashboard.kpi.avgCompatibility.top", { score: compatibility.top })}
            </span>
          ) : matchingPlan ? (
            <span className="text-[11px] text-ardoise">
              {t("pipeline.matching.locked", { plan: matchingPlan })}
            </span>
          ) : null}
        </Kpi>
      </section>

      <section
        aria-labelledby="pipeline-job"
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3"
      >
        <div className="flex min-w-0 items-center gap-3 rounded-[22px] bg-blanc py-2.5 pr-2.5 pl-3 lg:rounded-pill">
          <OrgMark name={space.organization.name} size={34} />
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 id="pipeline-job" className="truncate text-[15px] leading-5 font-semibold">
              {job.title}
            </h2>
            <span className="text-[11.5px] text-ardoise lg:hidden">
              {t("pipeline.summary", {
                count: applications.length,
                days: details.responseDays === null ? "—" : days(details.responseDays),
              })}
            </span>
          </div>
          <span className={cx(tag, jobStatusTone[job.status])}>
            {t(`jobs.status.${statusKey[job.status]}`)}
          </span>
          <MenuChip
            group="pipeline-job"
            align="right"
            label={t("pipeline.jobSelect")}
            summary={
              <>
                <span className="max-lg:hidden">{t("pipeline.jobSelect")}</span>
                <Icon name="chev-d" className="size-4" />
              </>
            }
            summaryClassName="flex h-9 items-center gap-1.5 rounded-pill px-2.5 text-[12px] text-ardoise hover:bg-creme"
          >
            {jobs
              .filter((item) => item.status !== "draft")
              .slice(0, 12)
              .map((item) => (
                <Link
                  key={item.id}
                  href={`/app/hire/offres/${item.id}`}
                  aria-current={item.id === job.id ? "page" : undefined}
                  className={cx(menuItem, "aria-[current=page]:font-semibold")}
                >
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  <span className="text-[11px] text-ardoise">{item._count.applications}</span>
                </Link>
              ))}
          </MenuChip>
        </div>
        <div className="flex flex-wrap items-center gap-2 max-lg:hidden">
          <Link
            href={hrefWith({ vue: null })}
            aria-current={listView ? undefined : "page"}
            className={listView ? chip : chipOn}
          >
            <Icon name="grid" className="size-4" />
            {t("pipeline.view.board")}
          </Link>
          <Link
            href={hrefWith({ vue: "liste" })}
            aria-current={listView ? "page" : undefined}
            className={listView ? chipOn : chip}
          >
            {t("pipeline.view.list")}
          </Link>
          {withMatching && (
            <MenuChip
              group="pipeline-filter"
              summaryClassName={chip}
              summary={
                <>
                  <Icon name="filtre" className="size-4" />
                  {[t("pipeline.filters"), narrowed ? "1" : null].filter(Boolean).join(" · ")}
                </>
              }
            >
              <Link
                href={hrefWith({ compat: "haut" })}
                aria-current={narrowed ? "true" : undefined}
                className={menuItem}
              >
                {narrowed && <Icon name="check" />}
                {[
                  t("pipeline.filter.score.text"),
                  [all("match.band.veryHigh.text"), all("match.band.high.text")].join(" · "),
                ].join(" : ")}
              </Link>
              <Link href={hrefWith({ compat: null })} className={menuItem}>
                {t("pipeline.filter.reset")}
              </Link>
            </MenuChip>
          )}
        </div>
        <span className="flex-1 max-lg:hidden" />
        {permissions.manage &&
          (job.status === "draft" ||
            job.status === "rejected" ||
            job.status === "changes_requested") && (
            <form action={publishJobAction}>
              <input type="hidden" name="id" value={job.id} />
              <button type="submit" className={pillClass("dark", "md")}>
                {t("jobForm.publish.text")}
              </button>
            </form>
          )}
        {permissions.manage && job.status !== "closed" && job.status !== "archived" && (
          <Link
            href={`/app/hire/offres/${job.id}/modifier`}
            className={cx(pillClass("outline", "md"), "max-lg:hidden")}
          >
            <Icon name="edit" className="size-4" />
            {t("jobs.action.edit")}
          </Link>
        )}
      </section>

      {applications.length > 0 && (
        <TabRail name={`pipeline-${job.id}`} className="lg:hidden">
          <div className="flex w-max gap-2">
            {stages.map((stage) => (
              <Link
                key={stage.id}
                href={hrefWith({ etape: stage.id })}
                data-drop-stage={stage.id}
                aria-current={stage.id === mobileStage ? "page" : undefined}
                className={cx(
                  "flex h-11 shrink-0 items-center gap-2 rounded-pill px-4 text-[14px] font-semibold transition-colors data-[drop-over]:bg-lime data-[drop-over]:text-sapin",
                  stage.id === mobileStage
                    ? "bg-sapin text-blanc"
                    : "bg-blanc text-sapin ring-[1.5px] ring-brume ring-inset",
                )}
              >
                {stage.name}
                <span className={stage.id === mobileStage ? "text-lime" : "text-ardoise"}>
                  {countOf(stage.id)}
                </span>
              </Link>
            ))}
          </div>
        </TabRail>
      )}

      {applications.length > 0 && (withMatching || matchingPlan) && (
        <div className="flex flex-col gap-2 rounded-[18px] bg-blanc px-4 py-3 lg:flex-row lg:items-center lg:gap-4 lg:rounded-pill lg:px-5">
          <p className="flex flex-1 items-start gap-2 text-[12.5px] leading-[18px] lg:items-center lg:text-[13px]">
            <Icon name="eye" className="mt-px size-4 shrink-0" />
            {withMatching
              ? t("pipeline.aiNotice")
              : t("pipeline.matching.locked", { plan: matchingPlan! })}
          </p>
          {narrowed && (
            <Link
              href={hrefWith({ compat: null })}
              className="inline-flex items-center gap-2 self-start rounded-pill px-3 py-1.5 text-[12px] font-semibold ring-[1.5px] ring-brume ring-inset hover:bg-creme"
            >
              {[
                t("pipeline.filter.score.text"),
                [all("match.band.veryHigh.text"), all("match.band.high.text")].join(" · "),
              ].join(" : ")}
              <Icon name="fermer" className="size-3.5" />
              <span className="sr-only">{t("pipeline.filter.reset")}</span>
            </Link>
          )}
          {withMatching && (
            <Link
              href={hrefWith({ tri: byScore ? null : "score" })}
              className="inline-flex items-center gap-1.5 self-start text-[12px] font-medium text-ardoise hover:text-sapin"
            >
              <Icon name="sort" className="size-3.5" />
              {byScore ? t("pipeline.stage.sortByDate") : t("pipeline.stage.sortByScore")}
            </Link>
          )}
        </div>
      )}

      {applications.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-[24px] bg-blanc px-6 py-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-lime-clair">
            <Icon name="equipe" className="size-6" />
          </span>
          <p className="max-w-md text-[14px]">{t("pipeline.empty.text")}</p>
          {job.status === "published" && (
            <CopyButton
              value={publicUrl}
              label={t("pipeline.empty.cta")}
              copiedLabel={all("toast.linkCopied")}
              className={pillClass("lime", "sm")}
            />
          )}
        </section>
      ) : visible.length === 0 ? (
        <p className="rounded-[18px] bg-blanc px-5 py-6 text-center text-[13px] text-ardoise">
          {t("pipeline.filter.none")}
        </p>
      ) : listView ? (
        <ul className="flex flex-col gap-2.5">
          {cards.map((card) => (
            <li key={card.id} className="rounded-[18px] bg-blanc p-3.5 lg:px-5">
              <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-ardoise uppercase">
                {stages.find((stage) => stage.id === card.stageId)?.name}
              </p>
              {card.body}
            </li>
          ))}
        </ul>
      ) : (
        <NextIntlClientProvider messages={{ hire: { pipeline: messages.hire.pipeline } }}>
          <PipelineBoard
            columns={columns}
            cards={cards}
            canMove={permissions.manage}
            mobileStage={mobileStage}
          />
        </NextIntlClientProvider>
      )}

      {permissions.manage && (
        <JobSettings ctx={ctx} job={job} ok={one(query.ok)} error={one(query.erreur)} />
      )}
      <p className="text-[12px] text-ardoise">{t("dashboard.fairness")}</p>
    </div>
  );
}
