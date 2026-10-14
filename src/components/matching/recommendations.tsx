import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand/ai-orb";
import { Badge, ScoreBadge } from "@/components/ui";
import { db } from "@/server/db";
import { recommendedCourses, recommendedJobs } from "@/server/matching/service";
import { catalogLevelOf, opensCourse } from "@/server/services/learn";

/** Score from which a job counts as « correspond à votre profil » on the dashboard. */
const THRESHOLD = 70;

/**
 * Jobs recommended to a talent (§ 8.7), each with its score and a « Pourquoi ? » link to the
 * detail on the job page. Nothing is shown when the talent switched the calculation off.
 */
export async function RecommendedJobs({ userId }: { userId: string }) {
  const t = await getTranslations();
  const top = await recommendedJobs(db, userId, 20);
  const strong = top.filter((item) => item.explanation.score >= THRESHOLD);
  const jobs = await db.job.findMany({
    where: { id: { in: top.slice(0, 3).map((item) => item.jobId) } },
    select: { id: true, slug: true, title: true, organization: { select: { name: true } } },
  });
  return (
    <section aria-labelledby="reco-jobs" className="flex flex-col gap-3 rounded-card bg-blanc p-6">
      <h2 id="reco-jobs" className="flex items-center gap-2 text-h2">
        <AiOrb />
        {t("talent.dashboard.ai.title")}
      </h2>
      <p>
        {strong.length > 0
          ? t("talent.dashboard.ai.matches.text", { count: strong.length, threshold: THRESHOLD })
          : t("talent.dashboard.ai.matches.none")}
      </p>
      {top.length > 0 && (
        <ul className="flex flex-col divide-y divide-brume">
          {top.slice(0, 3).map(({ jobId, explanation }) => {
            const job = jobs.find((item) => item.id === jobId);
            if (!job) return null;
            return (
              <li key={jobId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="flex flex-col">
                  <Link href={`/app/jobs/${job.slug}`} className="font-semibold underline">
                    {job.title}
                  </Link>
                  <span className="text-sm text-ardoise">{job.organization.name}</span>
                </span>
                <span className="flex items-center gap-3">
                  <ScoreBadge score={explanation.score} band={explanation.band} />
                  <Link href={`/app/jobs/${job.slug}#compatibilite`} className="text-sm underline">
                    {t("talent.dashboard.ai.why")}
                  </Link>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/app/jobs" className="self-start text-sm font-medium underline">
        {t("talent.dashboard.ai.cta")}
      </Link>
    </section>
  );
}

/** Courses that close the gaps most frequent in the talent's best jobs (§ 8.7). */
export async function RecommendedCourses({ userId }: { userId: string }) {
  const t = await getTranslations();
  const catalog = await catalogLevelOf(db, userId);
  const courses = await recommendedCourses(db, userId, {
    opens: (required) => opensCourse(catalog, required),
    take: 3,
  });
  if (courses.length === 0) return null;
  return (
    <section
      aria-labelledby="reco-courses"
      className="flex flex-col gap-3 rounded-card bg-blanc p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="reco-courses" className="flex items-center gap-2 text-h2">
          <AiOrb />
          {t("career.plan.courses")}
        </h2>
        <Link href="/comment-fonctionne-le-matching" className="text-sm underline">
          {t("ai.recoCourses.link")}
        </Link>
      </div>
      <ul className="flex flex-col gap-3">
        {courses.map((course) => (
          <li key={course.slug} className="flex flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              <Link href={`/app/learn/${course.slug}`} className="font-semibold underline">
                {course.title}
              </Link>
              {course.open && (
                <Badge tone="success">{t("match.why.talent.courses.included")}</Badge>
              )}
            </span>
            <span className="text-sm text-ardoise">
              {t("ai.recoCourses.reason.demand", { percent: course.percent })}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-ardoise">{t("ai.recoCourses.why")}</p>
    </section>
  );
}
