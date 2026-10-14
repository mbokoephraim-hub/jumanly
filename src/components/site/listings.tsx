import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CourseCard, JobCard, type MatchBand } from "@/components/ui";
import { formatDate, formatRelativeDays } from "@/lib/dates";
import { durationParts } from "@/lib/format";
import type { CourseSummary } from "@/server/services/courses";
import { contractFilterOf, remoteFilterOf, type JobSummary } from "@/server/services/jobs";
import { planForCatalogLevel, type PublicPlan } from "@/server/services/plans";

/** Course card fed by the database: the required plan is computed from entitlements, never named. */
export function CourseListing({
  course,
  plans,
  href,
  status,
}: {
  course: CourseSummary;
  plans: PublicPlan[];
  /** The signed-in catalog links to `/app/learn/…` and adds progress or a lock. */
  href?: string;
  status?: ReactNode;
}) {
  const t = useTranslations();
  const duration = durationParts(course.durationMinutes);
  return (
    <CourseCard
      title={course.title}
      href={href ?? `/formations/${course.slug}`}
      level={t(`trainings.filters.level.${course.level}`)}
      lessons={course.lessonCount}
      duration={t(`ui.duration.${duration.key}`, duration.values)}
      certificate={course.certificateEnabled}
      category={course.category ?? undefined}
      plan={planForCatalogLevel(plans, course.requiredLevel)?.name}
      image={course.coverUrl ?? undefined}
      status={status}
    />
  );
}

const NEW_DAYS = 3;

export function JobListing({
  job,
  now,
  href,
  match,
}: {
  job: JobSummary;
  now: Date;
  href?: string;
  match?: { score: number; band: MatchBand };
}) {
  const t = useTranslations();
  const isNew =
    job.publishedAt !== null && now.getTime() - job.publishedAt.getTime() < NEW_DAYS * 86_400_000;
  return (
    <JobCard
      title={job.title}
      href={href ?? `/offres/${job.slug}`}
      company={job.organization.name}
      city={job.city}
      country={job.country}
      remote={remoteFilterOf(job.remote)}
      contract={t(`jobs.search.contract.${contractFilterOf(job.contractType)}`)}
      deadline={job.closesAt ? formatDate(job.closesAt) : undefined}
      published={job.publishedAt ? formatRelativeDays(job.publishedAt, now) : undefined}
      verified={job.organization.verifiedAt !== null}
      isNew={isNew}
      match={match}
    />
  );
}
