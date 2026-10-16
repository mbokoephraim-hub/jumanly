import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeaderAction } from "@/components/app/header-action";
import { AppPageHeader } from "@/components/app/page-header";
import { Icon } from "@/components/brand/icon";
import { Pagination, withParams } from "@/components/site/navigation-bits";
import { PublicCourseCard } from "@/components/site/public-cards";
import { Alert, ButtonLink, EmptyState, ProgressBar, SearchField } from "@/components/ui";
import { durationParts } from "@/lib/format";
import { cx } from "@/lib/cx";
import { RecommendedCourses } from "@/components/matching/recommendations";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getCourseSearch, getPublicPlans } from "@/server/queries/public";
import {
  countPublishedCourses,
  featuredCourses,
  listCourseThemes,
  parseCourseFilters,
  type CourseSummary,
} from "@/server/services/courses";
import { catalogLevelOf, myEnrollments, opensCourse } from "@/server/services/learn";
import { planForCatalogLevel } from "@/server/services/plans";
import { TabRail } from "@/components/motion/tab-rail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("learn");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * « Explorer » of the Learn academy (partie 07 § 3, ux-test étape 2): every published course, with a
 * lock when the plan's `learn.catalog.level` does not open it. The learner's own lists live in
 * « Mes parcours » (/app/learn/parcours).
 */
export default async function LearnExplorePage({ searchParams }: PageProps<"/app/learn/explorer">) {
  const params = await searchParams;
  const user = await requireUser("/app/learn/explorer");
  const t = await getTranslations();
  const filters = parseCourseFilters(params);
  const [plans, planLevel, enrollments] = await Promise.all([
    getPublicPlans(),
    catalogLevelOf(db, user.id),
    myEnrollments(db, user.id),
  ]);
  const enrollmentBySlug = new Map(
    enrollments.map((enrollment) => [enrollment.course.slug, enrollment]),
  );

  const search = await getCourseSearch(filters);
  const courses: CourseSummary[] = search.courses;
  const { page: _page, ...current } = filters;
  void _page;
  const saved = params.enregistre;
  const goal = (
    await db.talentProfile.findUnique({
      where: { userId: user.id },
      select: { desiredJobTitles: true },
    })
  )?.desiredJobTitles[0];

  const [total, freeCount, themes, featured] = await Promise.all([
    countPublishedCourses(db),
    db.course.count({ where: { status: "published", requiredLevel: "free" } }),
    listCourseThemes(db),
    featuredCourses(db, 8),
  ]);
  const inProgress = enrollments.filter((enrollment) => !enrollment.completedAt);
  const filtered = Boolean(
    filters.q || filters.theme || filters.niveau || filters.acces || search.page > 1,
  );
  // A course to discover: never one the learner already follows or finished.
  const hero = filtered ? undefined : featured.find((course) => !enrollmentBySlug.has(course.slug));
  const lockedPlan = (course: CourseSummary) =>
    opensCourse(planLevel, course.requiredLevel)
      ? undefined
      : planForCatalogLevel(plans, course.requiredLevel)?.name;

  const footer = (course: CourseSummary) => {
    const enrollment = enrollmentBySlug.get(course.slug);
    if (enrollment?.completedAt) {
      return (
        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-up-texte">
          <Icon name="check" className="size-3.5" />
          {t("learn.card.completed")}
        </p>
      );
    }
    if (enrollment) {
      return (
        <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
          <ProgressBar
            value={enrollment.progress}
            tone="feuille"
            label={t("learn.card.progress", { percent: enrollment.progress })}
          />
          <span className="shrink-0">
            {t("learn.card.progress", { percent: enrollment.progress })}
          </span>
        </div>
      );
    }
    if (lockedPlan(course)) {
      return (
        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
          <Icon name="play" className="size-3" />
          {t("learn.lock.preview")}
        </p>
      );
    }
    return null;
  };

  const chip = (active: boolean) =>
    cx(
      "inline-flex h-9 shrink-0 items-center rounded-pill px-4 text-[13px] font-semibold whitespace-nowrap",
      active
        ? "bg-sapin text-blanc"
        : "bg-blanc ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40",
    );
  const sectionTitle = "text-[20px] leading-tight font-bold tracking-tight lg:text-[22px]";

  return (
    <div className="flex flex-col gap-5">
      <AppPageHeader
        eyebrow={t("learn.catalog.eyebrow", { count: total, free: freeCount })}
        title={t("learn.catalog.title")}
        actions={
          inProgress[0] ? (
            <HeaderAction
              href={`/app/learn/${inProgress[0].course.slug}`}
              icon="play"
              label={t("learn.catalog.resume", { percent: inProgress[0].progress })}
            />
          ) : null
        }
      />

      <form
        action="/app/learn/explorer"
        method="get"
        role="search"
        className="w-full lg:max-w-[640px]"
      >
        {filters.theme && <input type="hidden" name="theme" value={filters.theme} />}
        <SearchField
          id="learn-search"
          name="q"
          label={t("learn.catalog.search.label")}
          placeholder={t("learn.catalog.search.placeholder")}
          defaultValue={filters.q}
        />
      </form>

      {themes.length > 0 && (
        <nav aria-label={t("learn.catalog.filter.theme")}>
          <TabRail name="learn-themes">
            <ul className="flex w-max gap-2">
              <li>
                <Link
                  href={withParams("/app/learn/explorer", { ...current, theme: undefined })}
                  className={chip(!filters.theme)}
                >
                  {t("learn.catalog.tab.all")}
                </Link>
              </li>
              {themes.filter(Boolean).map((theme) => (
                <li key={theme}>
                  <Link
                    href={withParams("/app/learn/explorer", { ...current, theme })}
                    aria-current={filters.theme === theme ? "true" : undefined}
                    className={chip(filters.theme === theme)}
                  >
                    {theme}
                  </Link>
                </li>
              ))}
            </ul>
          </TabRail>
        </nav>
      )}

      {saved === "1" && <Alert tone="success" title={t("learn.save.success")} />}
      {saved === "0" && <Alert tone="info" title={t("learn.save.removed")} />}

      {hero && (
        <section
          aria-labelledby="learn-hero"
          className="relative grid gap-3 overflow-hidden rounded-[22px] border border-sapin/8 bg-blanc p-4 text-sapin sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-8"
        >
          <div className="flex min-w-0 flex-col gap-2.5">
            <p className="relative flex flex-wrap gap-2 text-[11px] font-semibold">
              {hero.category && (
                <span className="rounded-pill bg-lime px-2.5 py-1 text-sapin">{hero.category}</span>
              )}
              <span className="rounded-pill px-2.5 py-1 text-sapin ring-1 ring-brume ring-inset">
                {lockedPlan(hero)
                  ? t("learn.lock.badge", { plan: lockedPlan(hero) ?? "" })
                  : hero.requiredLevel === "free"
                    ? t("learn.card.badge.free")
                    : t("learn.card.badge.included", {
                        plan: planForCatalogLevel(plans, hero.requiredLevel)?.name ?? "",
                      })}
              </span>
            </p>
            <h2
              id="learn-hero"
              className="relative max-w-[640px] text-[20px] leading-[1.2] font-semibold tracking-tight lg:text-[22px]"
            >
              {hero.title}
            </h2>
            <ul className="relative flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ardoise">
              <li className="flex items-center gap-1.5">
                <Icon name="learn" className="size-4 text-feuille" />
                {t("learn.card.modules", { count: hero.moduleCount })}
              </li>
              <li className="flex items-center gap-1.5">
                <Icon name="horloge" className="size-4 text-feuille" />
                {t(
                  `ui.duration.${durationParts(hero.durationMinutes).key}`,
                  durationParts(hero.durationMinutes).values,
                )}
              </li>
              {hero.certificateEnabled && (
                <li className="flex items-center gap-1.5">
                  <Icon name="certificat" className="size-4 text-feuille" />
                  {t("learn.card.certificate")}
                </li>
              )}
              <li className="flex items-center gap-1.5">
                <Icon name="cours-video" className="size-4 text-feuille" />
                {t("learn.card.lessons", { count: hero.lessonCount })}
              </li>
            </ul>
          </div>
          <Link
            href={`/app/learn/${hero.slug}`}
            className="relative flex h-11 items-center gap-2 self-start rounded-pill bg-lime px-5 text-[15px] font-semibold text-sapin transition-transform hover:-translate-y-0.5 lg:self-center"
          >
            {enrollmentBySlug.has(hero.slug) ? t("learn.card.resume") : t("learn.card.start")}
            <Icon name="chev-r" className="size-4" />
          </Link>
        </section>
      )}

      {!filtered && <RecommendedCourses userId={user.id} goal={goal ?? undefined} />}

      <section aria-labelledby="learn-list" className="flex flex-col gap-3">
        <h2 id="learn-list" className={sectionTitle}>
          {filtered ? t("learn.catalog.title") : t("learn.catalog.section.popular")}
        </h2>
        {courses.length === 0 ? (
          <EmptyState
            title={t("learn.catalog.empty.text")}
            action={
              <ButtonLink href="/app/learn/explorer" variant="secondary">
                {t("learn.catalog.empty.cta")}
              </ButtonLink>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {courses.map((course, index) => (
              <li key={course.slug} className="flex min-w-0 [&>article]:min-w-0 [&>article]:flex-1">
                <PublicCourseCard
                  course={course}
                  plans={plans}
                  index={index}
                  href={`/app/learn/${course.slug}`}
                  locked={lockedPlan(course)}
                  footer={footer(course)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {search.pageCount > 1 && (
        <Pagination
          page={search.page}
          pageCount={search.pageCount}
          path="/app/learn/explorer"
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
