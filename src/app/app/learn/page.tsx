import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CourseListing } from "@/components/site/listings";
import { Pagination } from "@/components/site/navigation-bits";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  ProgressBar,
  SearchField,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getCourseSearch, getPublicPlans } from "@/server/queries/public";
import {
  courseSummariesByIds,
  parseCourseFilters,
  type CourseSummary,
} from "@/server/services/courses";
import {
  catalogLevelOf,
  myEnrollments,
  opensCourse,
  savedCourseIds,
} from "@/server/services/learn";
import { planForCatalogLevel } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("learn");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const lists = {
  toutes: "all",
  mes: "mine",
  enregistrees: "saved",
  terminees: "completed",
} as const;
type List = keyof typeof lists;

/**
 * Learn catalog for a signed-in talent (partie 07 § 3): every published course, with a lock when
 * the plan's `learn.catalog.level` does not open it, and the learner's own lists.
 */
export default async function LearnPage({ searchParams }: PageProps<"/app/learn">) {
  const params = await searchParams;
  const user = await requireUser("/app/learn");
  const t = await getTranslations();
  const list: List =
    typeof params.liste === "string" && params.liste in lists ? (params.liste as List) : "toutes";
  const filters = parseCourseFilters(params);
  const [plans, planLevel, enrollments, savedIds] = await Promise.all([
    getPublicPlans(),
    catalogLevelOf(db, user.id),
    myEnrollments(db, user.id),
    savedCourseIds(db, user.id),
  ]);
  const enrollmentBySlug = new Map(
    enrollments.map((enrollment) => [enrollment.course.slug, enrollment]),
  );

  let courses: CourseSummary[] = [];
  let search: Awaited<ReturnType<typeof getCourseSearch>> | null = null;
  if (list === "toutes") {
    search = await getCourseSearch(filters);
    courses = search.courses;
  } else {
    const ids =
      list === "enregistrees"
        ? savedIds
        : enrollments
            .filter((enrollment) =>
              list === "terminees" ? enrollment.completedAt : !enrollment.completedAt,
            )
            .map((enrollment) => enrollment.courseId);
    courses = await courseSummariesByIds(db, ids);
  }
  const { page: _page, ...current } = filters;
  void _page;
  const saved = params.enregistre;

  const status = (course: CourseSummary) => {
    const enrollment = enrollmentBySlug.get(course.slug);
    if (enrollment?.completedAt) return <Badge tone="success">{t("learn.card.completed")}</Badge>;
    if (enrollment) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <ProgressBar
            value={enrollment.progress}
            label={t("learn.card.progress", { percent: enrollment.progress })}
          />
          <span className="shrink-0">
            {t("learn.card.progress", { percent: enrollment.progress })}
          </span>
        </div>
      );
    }
    if (!opensCourse(planLevel, course.requiredLevel)) {
      const plan = planForCatalogLevel(plans, course.requiredLevel);
      return plan ? (
        <p
          className="text-sm font-semibold text-ardoise"
          aria-label={t("learn.lock.aria", { plan: plan.name })}
        >
          {t("learn.lock.badge", { plan: plan.name })}
        </p>
      ) : null;
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-eyebrow text-ardoise">{t("learn.player.eyebrow")}</p>
          <h1 className="text-h1">{t("learn.catalog.title")}</h1>
        </div>
        <ButtonLink href="/app/learn/attestations" variant="tertiary">
          {t("learn.catalog.certificatesLink")}
        </ButtonLink>
      </header>

      {saved === "1" && <Alert tone="success" title={t("learn.save.success")} />}
      {saved === "0" && <Alert tone="info" title={t("learn.save.removed")} />}

      <nav aria-label={t("learn.catalog.tabs")}>
        <ul className="flex flex-wrap gap-2">
          {(Object.keys(lists) as List[]).map((key) => (
            <li key={key}>
              <Link
                href={key === "toutes" ? "/app/learn" : `/app/learn?liste=${key}`}
                aria-current={list === key ? "page" : undefined}
                className={cx(
                  "inline-flex min-h-11 items-center rounded-pill px-4 font-semibold",
                  list === key ? "bg-sapin text-blanc" : "bg-blanc text-sapin",
                )}
              >
                {t(`learn.catalog.tab.${lists[key]}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {list === "toutes" && (
        <form
          action="/app/learn"
          method="get"
          role="search"
          className="flex flex-col gap-3 rounded-card bg-blanc p-5 md:flex-row"
        >
          <SearchField
            id="learn-search"
            name="q"
            label={t("learn.catalog.search.label")}
            placeholder={t("learn.catalog.search.placeholder")}
            defaultValue={filters.q}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" className="h-12 md:self-end">
            {t("learn.catalog.search.submit")}
          </Button>
        </form>
      )}

      {courses.length === 0 ? (
        list === "toutes" ? (
          <EmptyState
            title={t("learn.catalog.empty.text")}
            action={
              <ButtonLink href="/app/learn" variant="secondary">
                {t("learn.catalog.empty.cta")}
              </ButtonLink>
            }
          />
        ) : list === "mes" ? (
          <EmptyState
            title={t("learn.mine.empty.text")}
            action={
              <ButtonLink href="/app/learn?acces=free">{t("learn.mine.empty.cta")}</ButtonLink>
            }
          />
        ) : (
          <EmptyState
            title={t(list === "enregistrees" ? "learn.saved.empty" : "learn.completed.empty")}
          />
        )
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <li key={course.slug} className="flex [&>article]:flex-1">
              <CourseListing
                course={course}
                plans={plans}
                href={`/app/learn/${course.slug}`}
                status={status(course)}
              />
            </li>
          ))}
        </ul>
      )}

      {search && (
        <Pagination
          page={search.page}
          pageCount={search.pageCount}
          path="/app/learn"
          params={current}
          labels={{
            prev: t("trainings.pagination.prev"),
            next: t("trainings.pagination.next"),
            page: t("trainings.pagination.page", { page: search.page, total: search.pageCount }),
          }}
        />
      )}
    </div>
  );
}
