import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { JobBody } from "@/components/site/job-body";
import { Alert, Badge, Button, ButtonLink, Select, TextArea, VerifiedBadge } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { applyAction, toggleSaveAction } from "@/server/actions/jobs";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getJob } from "@/server/queries/public";
import { contractFilterOf, parseCriteria, remoteFilterOf } from "@/server/services/jobs";

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
        </div>

        <aside className="flex flex-col gap-4 self-start">
          <div className="flex flex-col gap-2 rounded-card bg-gradient-ai p-6 text-blanc">
            <h2 className="text-h2">{t("talent.jobs.detail.compatibility.title")}</h2>
            <p className="text-[15px] leading-6">{t("talent.jobs.detail.scoreLater")}</p>
          </div>
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
        </aside>
      </div>
    </div>
  );
}
