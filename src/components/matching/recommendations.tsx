import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon } from "@/components/brand/icon";
import { ScoreBadge } from "@/components/ui";
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

/**
 * Courses that close the gaps most frequent in the talent's best jobs (§ 8.7), in the green AI
 * block of the Learn catalog (mockup 03-03), each with its reason.
 */
export async function RecommendedCourses({ userId, goal }: { userId: string; goal?: string }) {
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
      className="relative flex flex-col gap-4 overflow-hidden rounded-[24px] bg-[linear-gradient(120deg,#14745f_0%,#1f9e78_60%,#2fbf8a_100%)] p-5 text-blanc lg:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="reco-courses"
          className="flex items-center gap-3 text-lg leading-6 font-bold lg:text-[22px]"
        >
          <span
            aria-hidden
            className="size-8 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,#E3F67C,#A6F26B_55%,#4caf50)]"
          />
          {goal ? t("ai.recoCourses.title", { goal }) : t("career.plan.courses")}
        </h2>
        <Link
          href="/comment-fonctionne-le-matching"
          className="flex items-center gap-1.5 rounded-pill bg-blanc/15 px-3 py-1.5 text-xs font-semibold text-lime hover:bg-blanc/25"
        >
          <Icon name="eye" className="size-3.5" />
          {t("ai.recoCourses.link")}
        </Link>
      </div>
      <ul className="grid gap-3 md:grid-cols-3">
        {courses.map((course) => (
          <li key={course.slug} className="flex flex-col gap-2.5 rounded-[18px] bg-sapin/80 p-4">
            <span className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-blanc/10"
              >
                <Icon name="competence" className="size-4" />
              </span>
              <Link
                href={`/app/learn/${course.slug}`}
                className="text-[15px] leading-5 font-semibold hover:underline"
              >
                {course.title}
              </Link>
            </span>
            <span className="text-xs leading-[17px] text-blanc/80">
              {t("ai.recoCourses.reason.demand", { percent: course.percent })}
            </span>
            {course.open && (
              <span className="mt-auto text-xs font-semibold text-lime">
                {t("match.why.talent.courses.included")}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="flex items-start gap-2 text-xs text-blanc/85">
        <Icon name="eye" className="mt-px size-3.5 shrink-0 text-lime" />
        <span>
          <strong className="font-semibold text-blanc">{t("talent.dashboard.ai.why")}</strong>{" "}
          {t("ai.recoCourses.why")}
        </span>
      </p>
    </section>
  );
}
