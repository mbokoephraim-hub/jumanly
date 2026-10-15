import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { Icon } from "@/components/brand/icon";
import { Pattern } from "@/components/site/marketing";
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
  courseSummariesByIds,
  featuredCourses,
  listCourseThemes,
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
import { TabRail } from "@/components/motion/tab-rail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("learn");
  return { title: t("seo"), robots: { index: false } };
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
    featuredCourses(db, 1),
  ]);
  const inProgress = enrollments.filter((enrollment) => !enrollment.completedAt);
  const filtered = Boolean(
    filters.q ||
    filters.theme ||
    filters.niveau ||
    filters.acces ||
    (search?.page && search.page > 1),
  );
  const hero = list === "toutes" && !filtered ? featured[0] : undefined;
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

  const tabHref = (key: List) => (key === "toutes" ? "/app/learn" : `/app/learn?liste=${key}`);
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
      />

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <nav aria-label={t("learn.catalog.tabs")} className="max-w-full min-w-0">
          <TabRail name="learn-listes">
            <ul className="flex w-max gap-5 px-3">
              {(Object.keys(lists) as List[]).map((key) => (
                <li key={key}>
                  <Link
                    href={tabHref(key)}
                    aria-current={list === key ? "page" : undefined}
                    className={cx(
                      "-mb-px inline-flex h-11 items-center border-b-2 text-[15px] whitespace-nowrap",
                      list === key
                        ? "border-sapin font-semibold"
                        : "border-transparent text-sapin hover:border-brume",
                    )}
                  >
                    {t(`learn.catalog.tab.${lists[key]}`)}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/app/learn/attestations"
                  className="-mb-px inline-flex h-11 items-center gap-1.5 border-b-2 border-transparent text-[15px] whitespace-nowrap text-sapin hover:border-brume"
                >
                  <Icon name="certificat" className="size-4" />
                  {t("learn.catalog.certificatesLink")}
                </Link>
              </li>
            </ul>
          </TabRail>
        </nav>
        {list === "toutes" && (
          <form action="/app/learn" method="get" role="search" className="w-full lg:w-[440px]">
            {filters.theme && <input type="hidden" name="theme" value={filters.theme} />}
            <SearchField
              id="learn-search"
              name="q"
              label={t("learn.catalog.search.label")}
              placeholder={t("learn.catalog.search.placeholder")}
              defaultValue={filters.q}
            />
          </form>
        )}
      </div>

      {list === "toutes" && themes.length > 0 && (
        <nav aria-label={t("learn.catalog.filter.theme")}>
          <TabRail name="learn-themes">
            <ul className="flex w-max gap-2">
              <li>
                <Link
                  href={withParams("/app/learn", { ...current, theme: undefined })}
                  className={chip(!filters.theme)}
                >
                  {t("learn.catalog.tab.all")}
                </Link>
              </li>
              {themes.filter(Boolean).map((theme) => (
                <li key={theme}>
                  <Link
                    href={withParams("/app/learn", { ...current, theme })}
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
          className="relative flex flex-col gap-5 overflow-hidden rounded-[28px] bg-sapin p-6 text-blanc lg:p-9"
        >
          <Pattern
            name="motif-trajectoires-sombre"
            size={300}
            opacity={0.5}
            className="[mask-image:linear-gradient(90deg,transparent_30%,#000)]"
          />
          <p className="relative flex flex-wrap gap-2 text-[11px] font-semibold">
            {hero.category && (
              <span className="rounded-pill bg-lime px-2.5 py-1 text-sapin">{hero.category}</span>
            )}
            <span className="rounded-pill px-2.5 py-1 text-lime ring-1 ring-lime ring-inset">
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
            className="relative max-w-[640px] text-[26px] leading-[1.15] font-bold tracking-tight lg:text-[36px]"
          >
            {hero.title}
          </h2>
          <ul className="relative flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-blanc/85">
            <li className="flex items-center gap-1.5">
              <Icon name="learn" className="size-4 text-lime" />
              {t("learn.card.modules", { count: hero.moduleCount })}
            </li>
            <li className="flex items-center gap-1.5">
              <Icon name="horloge" className="size-4 text-lime" />
              {t(
                `ui.duration.${durationParts(hero.durationMinutes).key}`,
                durationParts(hero.durationMinutes).values,
              )}
            </li>
            {hero.certificateEnabled && (
              <li className="flex items-center gap-1.5">
                <Icon name="certificat" className="size-4 text-lime" />
                {t("learn.card.certificate")}
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <Icon name="cours-video" className="size-4 text-lime" />
              {t("learn.card.lessons", { count: hero.lessonCount })}
            </li>
          </ul>
          <Link
            href={`/app/learn/${hero.slug}`}
            className="relative flex h-12 items-center gap-2 self-start rounded-pill bg-lime px-6 text-[15px] font-semibold text-sapin transition-transform hover:-translate-y-0.5"
          >
            {enrollmentBySlug.has(hero.slug) ? t("learn.card.resume") : t("learn.card.start")}
            <Icon name="chev-r" className="size-4" />
          </Link>
        </section>
      )}

      {list === "toutes" && !filtered && inProgress.length > 0 && (
        <section aria-labelledby="learn-continue" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="learn-continue" className={sectionTitle}>
              {t("learn.catalog.section.continue")}
            </h2>
            <Link
              href="/app/learn?liste=mes"
              className="flex items-center gap-1 text-[13px] font-semibold text-feuille-fonce"
            >
              {t("learn.catalog.tab.mine")}
              <Icon name="chev-r" className="size-3.5" />
            </Link>
          </div>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {inProgress.slice(0, 3).map((enrollment, index) => (
              <li
                key={enrollment.id}
                className="flex items-center gap-3 rounded-[20px] bg-blanc p-3"
              >
                <span
                  aria-hidden
                  className={cx(
                    "flex size-14 shrink-0 items-center justify-center rounded-[14px]",
                    ["bg-lime", "bg-neon", "bg-menthe-claire"][index % 3],
                  )}
                >
                  <Icon name="learn" className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Link
                    href={`/app/learn/${enrollment.course.slug}`}
                    className="line-clamp-2 text-sm leading-[18px] font-semibold hover:underline"
                  >
                    {enrollment.course.title}
                  </Link>
                  <span className="flex items-center gap-2 text-[11px] font-semibold">
                    <ProgressBar
                      value={enrollment.progress}
                      tone="feuille"
                      label={t("learn.card.progress", { percent: enrollment.progress })}
                    />
                    <span className="shrink-0">
                      {t("learn.card.progress", { percent: enrollment.progress })}
                    </span>
                  </span>
                </span>
                <Link
                  href={`/app/learn/${enrollment.course.slug}`}
                  aria-hidden
                  tabIndex={-1}
                  className="flex h-9 shrink-0 items-center rounded-pill bg-sapin px-4 text-[13px] font-semibold text-blanc max-sm:hidden"
                >
                  {t("learn.card.resume")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {list === "toutes" && !filtered && (
        <RecommendedCourses userId={user.id} goal={goal ?? undefined} />
      )}

      <section aria-labelledby="learn-list" className="flex flex-col gap-3">
        {list === "toutes" && (
          <h2 id="learn-list" className={sectionTitle}>
            {filtered ? t("learn.catalog.title") : t("learn.catalog.section.popular")}
          </h2>
        )}
        {list !== "toutes" && (
          <h2 id="learn-list" className="sr-only">
            {t(`learn.catalog.tab.${lists[list]}`)}
          </h2>
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
