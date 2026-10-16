import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { Icon } from "@/components/brand/icon";
import { TabRail } from "@/components/motion/tab-rail";
import {
  Alert,
  ButtonLink,
  EmptyState,
  ProgressBar,
  segmentedItem,
  segmentedList,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { courseSummariesByIds } from "@/server/services/courses";
import { myEnrollments, savedCourseIds } from "@/server/services/learn";
import { nextLessons } from "@/server/services/learn-academy";
import { myPaths } from "@/server/services/learn-paths";
import { PathCard } from "@/components/learn/path-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("learn.paths");
  return { title: t("seo"), robots: { index: false } };
}

const lists = { "": "active", terminees: "completed", enregistrees: "saved" } as const;
type List = keyof typeof lists;

const card =
  "flex flex-col gap-3 rounded-[22px] border border-sapin/8 bg-blanc p-4 sm:flex-row sm:items-center sm:gap-5 lg:p-5";

/**
 * « Mes parcours » of the Learn academy (ux-test, étape 2): the courses a learner follows, finished
 * or saved, each with its next step (the lesson to open, the attestation, or the course page).
 */
export default async function LearnPathsPage({ searchParams }: PageProps<"/app/learn/parcours">) {
  const params = await searchParams;
  const list: List =
    typeof params.liste === "string" && params.liste in lists ? (params.liste as List) : "";
  const user = await requireUser("/app/learn/parcours");
  const t = await getTranslations();
  const format = await getFormatter();
  const [enrollments, active, savedIds, paths] = await Promise.all([
    myEnrollments(db, user.id),
    nextLessons(db, user.id),
    savedCourseIds(db, user.id),
    myPaths(db, user.id),
  ]);
  const completed = enrollments.filter((enrollment) => enrollment.completedAt);
  const saved = list === "enregistrees" ? await courseSummariesByIds(db, savedIds) : [];
  const counts: Record<List, number> = {
    "": active.length,
    terminees: completed.length,
    enregistrees: savedIds.length,
  };
  const href = (key: List) => (key ? `/app/learn/parcours?liste=${key}` : "/app/learn/parcours");

  return (
    <div className="flex flex-col gap-5">
      <AppPageHeader eyebrow={t("learn.paths.eyebrow")} title={t("learn.paths.title")} />
      {params.enregistre === "0" && <Alert tone="info" title={t("learn.save.removed")} />}

      {/* Learn v2, étape 2: the paths the learner follows, above their courses. */}
      {paths.length > 0 && (
        <section aria-labelledby="followed-paths" className="flex flex-col gap-3">
          <h2 id="followed-paths" className="text-[20px] leading-tight font-bold tracking-tight">
            {t("learn.paths.followed.title")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paths.map((path) => (
              <li key={path.slug} className="min-w-0">
                <PathCard
                  path={{
                    slug: path.slug,
                    title: path.title,
                    summary: path.summary,
                    editorialLine: path.editorialLine,
                    domain: path.domain,
                    courseCount: path.total,
                    durationMinutes: path.durationMinutes,
                    courseSlugs: path.courses.map((course) => course.slug),
                  }}
                  progress={{ done: path.done, total: path.total, percent: path.percent }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label={t("learn.paths.tabs")} className="max-w-full min-w-0">
        <TabRail name="learn-parcours" className="bg-transparent! p-0!">
          <ul className={segmentedList}>
            {(Object.keys(lists) as List[]).map((key) => (
              <li key={key}>
                <Link
                  href={href(key)}
                  aria-current={list === key ? "page" : undefined}
                  className={segmentedItem(list === key)}
                >
                  {t(`learn.paths.tab.${lists[key]}`)} · {counts[key]}
                </Link>
              </li>
            ))}
          </ul>
        </TabRail>
      </nav>

      {list === "" &&
        (active.length === 0 ? (
          <EmptyState
            title={t("learn.mine.empty.text")}
            action={
              <ButtonLink href="/app/learn/explorer?acces=free">
                {t("learn.mine.empty.cta")}
              </ButtonLink>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {active.map((course) => (
              <li key={course.enrollmentId} className={card}>
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-lime"
                >
                  <Icon name="learn" className="size-5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Link
                    href={`/app/learn/${course.slug}`}
                    className="text-[16px] leading-snug font-semibold hover:underline"
                  >
                    {course.title}
                  </Link>
                  {course.next && (
                    <p className="text-[13px] text-ardoise">
                      {t("learn.paths.next", { lesson: course.next.title })} ·{" "}
                      {t("learn.paths.remaining", { count: course.remaining })}
                    </p>
                  )}
                  <span className="flex max-w-[420px] items-center gap-2 text-[12px] font-semibold">
                    <ProgressBar
                      value={course.progress}
                      tone="feuille"
                      label={t("learn.card.progress", { percent: course.progress })}
                    />
                    <span className="shrink-0">
                      {t("learn.card.progress", { percent: course.progress })}
                    </span>
                  </span>
                </div>
                <ButtonLink
                  href={
                    course.next
                      ? `/app/learn/${course.slug}?lecon=${course.next.id}`
                      : `/app/learn/${course.slug}`
                  }
                  variant="secondary"
                  icon={<Icon name="play" />}
                  className="self-start sm:self-center"
                >
                  {t("learn.card.resume")}
                </ButtonLink>
              </li>
            ))}
          </ul>
        ))}

      {list === "terminees" &&
        (completed.length === 0 ? (
          <EmptyState title={t("learn.completed.empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {completed.map((enrollment) => (
              <li key={enrollment.id} className={card}>
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-menthe-claire"
                >
                  <Icon name="check" className="size-5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={`/app/learn/${enrollment.course.slug}`}
                    className="text-[16px] leading-snug font-semibold hover:underline"
                  >
                    {enrollment.course.title}
                  </Link>
                  <p className="text-[13px] text-ardoise">
                    {t("learn.paths.completedOn", {
                      date: format.dateTime(enrollment.completedAt!, { dateStyle: "long" }),
                    })}
                  </p>
                </div>
                {enrollment.certificate && !enrollment.certificate.revokedAt && (
                  <ButtonLink
                    href="/app/learn/attestations"
                    variant="tertiary"
                    icon={<Icon name="certificat" />}
                    className="self-start sm:self-center"
                  >
                    {t("learn.paths.certificate")}
                  </ButtonLink>
                )}
              </li>
            ))}
          </ul>
        ))}

      {list === "enregistrees" &&
        (saved.length === 0 ? (
          <EmptyState title={t("learn.saved.empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {saved.map((course) => (
              <li key={course.slug} className={card}>
                <span
                  aria-hidden
                  className={cx(
                    "flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-lime-clair",
                  )}
                >
                  <Icon name="favori" className="size-5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={`/app/learn/${course.slug}`}
                    className="text-[16px] leading-snug font-semibold hover:underline"
                  >
                    {course.title}
                  </Link>
                  <p className="text-[13px] text-ardoise">
                    {course.category} · {t("learn.card.lessons", { count: course.lessonCount })}
                  </p>
                </div>
                <ButtonLink
                  href={`/app/learn/${course.slug}`}
                  variant="tertiary"
                  className="self-start sm:self-center"
                >
                  {t("learn.paths.open")}
                </ButtonLink>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
