import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { ReportForm } from "@/components/connect/report-form";
import { DisputePanel } from "@/components/matching/dispute-panel";
import { TalentWhy } from "@/components/matching/talent-why";
import { JobBody } from "@/components/site/job-body";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  ExplainedScore,
  Select,
  TextArea,
  VerifiedBadge,
} from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { applyAction, toggleSaveAction } from "@/server/actions/jobs";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { gapCourses, matchForUser, type MatchState } from "@/server/matching/service";
import { getJob } from "@/server/queries/public";
import { contractFilterOf, parseCriteria, remoteFilterOf } from "@/server/services/jobs";
import { catalogLevelOf, opensCourse } from "@/server/services/learn";
import { listPublicPlans, planForCatalogLevel } from "@/server/services/plans";

export async function generateMetadata({
  params,
}: PageProps<"/app/jobs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("talent.jobs.detail");
  const data = await getJob(slug);
  return {
    title: { absolute: t("seo", { jobTitle: data?.job.title ?? "" }) },
    robots: { index: false },
  };
}

/**
 * A job seen by a signed-in talent, with the application form (partie 06 § 3). Applying is free:
 * no entitlement, no quota, no plan is checked here or in the action (golden rule n° 1).
 */
export default async function TalentJobPage({
  params,
  searchParams,
}: PageProps<"/app/jobs/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const user = await requireUser(`/app/jobs/${slug}`);
  const data = await getJob(slug);
  if (!data) notFound();
  const { job, open } = data;
  const t = await getTranslations();
  const profile = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      documents: {
        where: { kind: "cv" },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
        select: { id: true, title: true },
      },
    },
  });
  const jobRow = await db.job.findUnique({ where: { slug }, select: { id: true } });
  const application =
    profile && jobRow
      ? await db.application.findUnique({
          where: { jobId_profileId: { jobId: jobRow.id, profileId: profile.id } },
          select: { id: true, createdAt: true },
        })
      : null;
  const saved = jobRow
    ? await db.savedJob.findUnique({
        where: { userId_jobId: { userId: user.id, jobId: jobRow.id } },
      })
    : null;
  const match: MatchState | null = jobRow ? await matchForUser(db, user.id, jobRow.id) : null;
  const [gaps, catalogLevel, plans, dispute] =
    match?.state === "ok" && jobRow
      ? await Promise.all([
          gapCourses(db, user.id, jobRow.id),
          catalogLevelOf(db, user.id),
          listPublicPlans(db),
          db.matchDispute.findFirst({
            where: { userId: user.id, jobId: jobRow.id },
            orderBy: { createdAt: "desc" },
            select: { status: true, scoreBefore: true, scoreAfter: true, resolution: true },
          }),
        ])
      : [[], "free", [], null];
  const courseAccess = (requiredLevel: string) => ({
    open: opensCourse(catalogLevel, requiredLevel),
    plan: planForCatalogLevel(plans, requiredLevel)?.name ?? null,
  });
  const company = job.organization.name;
  const criteria = parseCriteria(job.knockoutCriteria);
  const cvs = profile?.documents ?? [];
  const salary =
    job.salaryMin !== null && job.salaryMax !== null
      ? t("ui.salary.range", { min: formatUsd(job.salaryMin), max: formatUsd(job.salaryMax) })
      : job.salaryMin !== null
        ? t("ui.salary.from", { min: formatUsd(job.salaryMin) })
        : t("talent.jobs.card.salary.undisclosed");
  const outcome = typeof query.candidature === "string" ? query.candidature : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/jobs" className="text-sm underline">
        {t("talent.jobs.detail.backToJobs")}
      </Link>
      {outcome === "envoyee" && (
        <Alert
          tone="success"
          title={t("talent.jobs.apply.success.title")}
          action={
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/app/jobs/candidatures" size="sm">
                {t("talent.jobs.apply.success.track")}
              </ButtonLink>
              <ButtonLink href="/app/jobs" variant="tertiary" size="sm">
                {t("talent.jobs.apply.success.continue")}
              </ButtonLink>
            </div>
          }
        >
          {t("talent.jobs.apply.success.body", { company })}
        </Alert>
      )}
      {outcome === "deja" && <Alert tone="info" title={t("talent.jobs.apply.already")} />}
      {outcome === "close" && <Alert tone="warning" title={t("talent.jobs.detail.closed")} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col items-start gap-3 rounded-card bg-blanc p-6">
            <p className="text-eyebrow text-ardoise">{t("talent.jobs.detail.eyebrow")}</p>
            <div className="flex flex-wrap gap-2">
              <Badge tone="jobs">
                {t(`jobs.search.contract.${contractFilterOf(job.contractType)}`)}
              </Badge>
              <Badge tone="neutral">{t(`jobs.search.remote.${remoteFilterOf(job.remote)}`)}</Badge>
            </div>
            <h1 className="text-h1">{job.title}</h1>
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              {t("job.header.company", { company })}
              {job.organization.verifiedAt && <VerifiedBadge />}
            </p>
            <dl className="grid w-full gap-3 text-[15px] sm:grid-cols-2">
              <div>
                <dt className="text-ardoise">{t("talent.jobs.detail.facts.location")}</dt>
                <dd>{t("job.header.location", { city: job.city, country: job.country })}</dd>
              </div>
              <div>
                <dt className="text-ardoise">{t("talent.jobs.detail.facts.salary")}</dt>
                <dd>{salary}</dd>
              </div>
              {job.closesAt && (
                <div>
                  <dt className="text-ardoise">{t("talent.jobs.detail.facts.deadline")}</dt>
                  <dd>{formatDate(job.closesAt)}</dd>
                </div>
              )}
            </dl>
            {jobRow && (
              <form action={toggleSaveAction}>
                <input type="hidden" name="job" value={job.slug} />
                <input type="hidden" name="back" value={`/app/jobs/${job.slug}`} />
                <Button
                  type="submit"
                  variant="tertiary"
                  size="sm"
                  aria-pressed={Boolean(saved)}
                  icon={<Icon name="favori" className="size-4" />}
                >
                  {saved ? t("talent.jobs.card.unsave") : t("talent.jobs.detail.save")}
                </Button>
              </form>
            )}
          </header>
          <div className="rounded-card bg-blanc p-6">
            <JobBody job={job} />
          </div>
          {match?.state === "ok" && (
            <>
              <section
                id="compatibilite"
                aria-label={t("talent.jobs.detail.compatibility.title")}
                className="scroll-mt-24 rounded-card bg-blanc p-6"
              >
                <TalentWhy
                  explanation={match.explanation}
                  jobTitle={job.title}
                  gaps={gaps}
                  courseAccess={courseAccess}
                />
              </section>
              <DisputePanel
                jobSlug={job.slug}
                company={company}
                hasApplication={Boolean(application)}
                outcome={typeof query.revision === "string" ? query.revision : undefined}
                dispute={dispute}
              />
            </>
          )}
        </div>

        <aside className="flex flex-col gap-4 self-start">
          {match?.state === "ok" ? (
            <ExplainedScore
              title={t("talent.jobs.detail.compatibility.title")}
              score={match.explanation.score}
              explanation={
                <div className="flex flex-col gap-2">
                  <p>{t(`match.band.${match.explanation.band}.text`)}</p>
                  {gaps.length > 0 && (
                    <p>
                      {t("talent.jobs.detail.compatibility.gap", {
                        skills: gaps.map((gap) => gap.skill).join(", "),
                      })}
                    </p>
                  )}
                  <a href="#compatibilite" className="font-medium text-lime underline">
                    {t("talent.jobs.detail.compatibility.see")}
                  </a>
                </div>
              }
            />
          ) : (
            <div className="flex flex-col gap-2 rounded-card bg-gradient-ai p-6 text-blanc">
              <h2 className="text-h2">{t("talent.jobs.detail.compatibility.title")}</h2>
              {match?.state === "optedOut" ? (
                <>
                  <p className="text-[15px] leading-6">{t("match.score.optedOut")}</p>
                  <Link
                    href="/app/parametres?onglet=confidentialite"
                    className="text-sm font-medium text-lime underline"
                  >
                    {t("talent.jobs.detail.compatibility.optedOutCta")}
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-[15px] leading-6">{t("match.score.unavailable")}</p>
                  <Link href="/app/profil" className="text-sm font-medium text-lime underline">
                    {t("talent.jobs.detail.compatibility.incompleteCta")}
                  </Link>
                </>
              )}
            </div>
          )}
          <section
            id="postuler"
            aria-labelledby="apply-title"
            className="flex scroll-mt-24 flex-col gap-4 rounded-card bg-blanc p-6"
          >
            <h2 id="apply-title" className="text-h2">
              {t("talent.jobs.apply.title", { jobTitle: job.title })}
            </h2>
            {application ? (
              <>
                <p>{t("talent.jobs.detail.applied.text", { date: application.createdAt })}</p>
                <ButtonLink href="/app/jobs/candidatures" variant="secondary">
                  {t("talent.jobs.detail.applied.track")}
                </ButtonLink>
              </>
            ) : !open ? (
              <Alert tone="warning" title={t("talent.jobs.detail.closed")} />
            ) : (
              <form action={applyAction} className="flex flex-col gap-4">
                <input type="hidden" name="job" value={job.slug} />
                <p className="text-sm font-medium text-feuille-fonce">
                  {t("talent.jobs.apply.free")}
                </p>
                {cvs.length === 0 && (
                  <Alert tone="info" title={t("talent.jobs.apply.cv.none")}>
                    <Link href="/app/career/cv" className="font-medium underline">
                      {t("talent.jobs.apply.cv.create")}
                    </Link>
                  </Alert>
                )}
                <Select
                  id="apply-cv"
                  name="cv"
                  label={t("talent.jobs.apply.cv.text")}
                  defaultValue={cvs[0]?.id ?? ""}
                  options={[
                    ...cvs.map((cv) => ({ value: cv.id, label: cv.title })),
                    { value: "", label: t("talent.jobs.apply.cv.profileOnly") },
                  ]}
                />
                <TextArea
                  id="apply-letter"
                  name="coverLetter"
                  label={`${t("talent.jobs.apply.letter.text")} · ${t("talent.jobs.apply.letter.optional")}`}
                  placeholder={t("talent.jobs.apply.letter.placeholder")}
                  rows={6}
                  maxLength={5000}
                />
                {criteria.length > 0 && (
                  <p className="text-sm text-ardoise">{t("talent.jobs.detail.knockout.hint")}</p>
                )}
                <p className="text-sm text-ardoise">{t("talent.jobs.apply.profileShared")}</p>
                <Button type="submit" size="lg" fullWidth>
                  {t("talent.jobs.apply.submit")}
                </Button>
              </form>
            )}
          </section>
          {job.organization.description && (
            <div className="flex flex-col gap-3 rounded-card bg-creme p-6">
              <h2 className="text-h2">{t("job.company.title", { company })}</h2>
              <p className="text-[15px] leading-6">{job.organization.description}</p>
            </div>
          )}
          {jobRow && (
            <section
              id="signaler"
              aria-labelledby="signaler-titre"
              className="flex flex-col gap-2 rounded-card bg-blanc p-6"
            >
              <h2 id="signaler-titre" className="font-semibold text-h3">
                {t("report.title.job")}
              </h2>
              {query.signalement === "ok" && <Alert tone="success" title={t("report.success")} />}
              {query.signalement === "deja" && <Alert title={t("report.already")} />}
              <p className="text-sm text-ardoise">{t("job.safety.text")}</p>
              <details open={query.signaler === "1"}>
                <summary className="cursor-pointer text-sm font-medium underline">
                  {t("job.cta.report")}
                </summary>
                <ReportForm
                  targetType="job"
                  targetId={jobRow.id}
                  back={`/app/jobs/${slug}#signaler`}
                />
              </details>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
