import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeaderAction } from "@/components/app/header-action";
import { AppPageHeader } from "@/components/app/page-header";
import { Icon } from "@/components/brand/icon";
import { Pagination, withParams } from "@/components/site/navigation-bits";
import { PublicCourseCard } from "@/components/site/public-cards";
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  ProgressBar,
  SearchField,
  Select,
} from "@/components/ui";
import { durationParts } from "@/lib/format";
import { cx } from "@/lib/cx";
import { RecommendedCourses } from "@/components/matching/recommendations";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getCourseSearch, getPublicPlans } from "@/server/queries/public";
import {
  accessFilters,
  countPublishedCourses,
  courseLevels,
  durationFilters,
  editorialFilters,
  featuredCourses,
  parseCourseFilters,
  type CourseSummary,
} from "@/server/services/courses";
import {
  listCourseLanguages,
  listCourseSkills,
  listDomains,
} from "@/server/services/learn-domains";
import { catalogLevelOf, myEnrollments, opensCourse } from "@/server/services/learn";
import { listPublishedPaths } from "@/server/services/learn-paths";
import { planForCatalogLevel } from "@/server/services/plans";
import { PathCard } from "@/components/learn/path-card";
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

  const [total, freeCount, domains, languages, skills, featured, paths] = await Promise.all([
    countPublishedCourses(db),
    db.course.count({ where: { status: "published", requiredLevel: "free" } }),
    listDomains(db),
    listCourseLanguages(db),
    listCourseSkills(db),
    featuredCourses(db, 8),
    listPublishedPaths(db, filters.domaine),
  ]);
  const inProgress = enrollments.filter((enrollment) => !enrollment.completedAt);
  const domain = domains.find((item) => item.slug === filters.domaine);
  // Filters of the « Filtres » panel (Learn v2, étape 1): the domain and the search have their own.
  const panelKeys = ["niveau", "duree", "langue", "acces", "competence", "ligne"] as const;
  const activeFilters = panelKeys.filter((key) => filters[key]).length;
  const filtered = Boolean(
    filters.q || filters.theme || filters.domaine || activeFilters || search.page > 1,
  );
  const languageLabel = (code: string) =>
    code === "fr" || code === "en" ? t(`learn.catalog.language.${code}`) : code.toUpperCase();
  const accessLabels = {
    free: "free",
    fundamentals: "starter",
    standard: "pro",
    advanced: "premium",
  } as const;
  const durationLabels = { court: "short", moyen: "medium", long: "long" } as const;
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

  const domainChip = (active: boolean) =>
    cx(
      "inline-flex h-11 shrink-0 items-center gap-2 rounded-pill px-4 text-[13px] font-semibold whitespace-nowrap",
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
        {filters.domaine && <input type="hidden" name="domaine" value={filters.domaine} />}
        {panelKeys.map(
          (key) =>
            filters[key] && <input key={key} type="hidden" name={key} value={filters[key]} />,
        )}
        <SearchField
          id="learn-search"
          name="q"
          label={t("learn.catalog.search.label")}
          placeholder={t("learn.catalog.search.placeholder")}
          defaultValue={filters.q}
        />
      </form>

      {domains.length > 0 && (
        <nav aria-label={t("learn.catalog.domains.title")}>
          <TabRail name="learn-domains">
            <ul className="flex w-max gap-2">
              <li>
                <Link
                  href={withParams("/app/learn/explorer", { ...current, domaine: undefined })}
                  aria-current={!filters.domaine ? "true" : undefined}
                  className={domainChip(!filters.domaine)}
                >
                  <Icon name="grid" className="size-4" />
                  {t("learn.catalog.domains.all")}
                </Link>
              </li>
              {domains.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={withParams("/app/learn/explorer", { ...current, domaine: item.slug })}
                    aria-current={filters.domaine === item.slug ? "true" : undefined}
                    className={domainChip(filters.domaine === item.slug)}
                  >
                    <Icon name={item.icon} className="size-4" />
                    <span>{item.name}</span>
                    <span
                      className={cx(
                        "text-[11.5px] font-medium",
                        filters.domaine === item.slug ? "text-blanc/80" : "text-ardoise",
                      )}
                    >
                      {t("learn.catalog.domains.count", { count: item.courseCount })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </TabRail>
        </nav>
      )}

      {domain && (
        <section
          aria-labelledby="learn-domain"
          className="flex items-start gap-4 rounded-[22px] border border-sapin/8 bg-blanc p-4 lg:p-5"
        >
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-lime"
          >
            <Icon name={domain.icon} className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-[11.5px] font-semibold tracking-[0.08em] text-feuille-fonce uppercase">
              {t("learn.catalog.domain.eyebrow")}
            </p>
            <h2 id="learn-domain" className="text-[20px] leading-tight font-bold tracking-tight">
              {domain.name}
            </h2>
            {domain.description && <p className="text-[14px] text-ardoise">{domain.description}</p>}
          </div>
        </section>
      )}

      <details
        className="group/filters rounded-[22px] border border-sapin/8 bg-blanc"
        open={activeFilters > 0}
      >
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-[14px] font-semibold [&::-webkit-details-marker]:hidden">
          <Icon name="filtre" className="size-4" />
          {t("learn.catalog.filters.text")}
          {activeFilters > 0 && (
            <span className="rounded-pill bg-lime px-2 py-0.5 text-[11.5px] text-sapin">
              {t("learn.catalog.filter.active", { count: activeFilters })}
            </span>
          )}
          <Icon
            name="chev-d"
            className="ml-auto size-4 transition-transform group-open/filters:rotate-180"
          />
        </summary>
        <form
          action="/app/learn/explorer"
          method="get"
          className="grid gap-3 border-t border-brume p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filters.q && <input type="hidden" name="q" value={filters.q} />}
          {filters.domaine && <input type="hidden" name="domaine" value={filters.domaine} />}
          <Select
            id="learn-filter-level"
            name="niveau"
            label={t("learn.catalog.filter.level.text")}
            defaultValue={filters.niveau ?? ""}
            placeholder={t("learn.catalog.filter.any")}
            options={courseLevels.map((level) => ({
              value: level,
              label: t(`learn.catalog.filter.level.${level}`),
            }))}
          />
          <Select
            id="learn-filter-duration"
            name="duree"
            label={t("learn.catalog.filter.duration.text")}
            defaultValue={filters.duree ?? ""}
            placeholder={t("learn.catalog.filter.any")}
            options={durationFilters.map((value) => ({
              value,
              label: t(`learn.catalog.filter.duration.${durationLabels[value]}`),
            }))}
          />
          <Select
            id="learn-filter-language"
            name="langue"
            label={t("learn.catalog.filter.language")}
            defaultValue={filters.langue ?? ""}
            placeholder={t("learn.catalog.filter.any")}
            options={languages.map((code) => ({ value: code, label: languageLabel(code) }))}
          />
          <Select
            id="learn-filter-access"
            name="acces"
            label={t("learn.catalog.filter.access.text")}
            defaultValue={filters.acces ?? ""}
            placeholder={t("learn.catalog.filter.any")}
            options={accessFilters.map((level) => ({
              value: level,
              label: t(`trainings.filters.access.${accessLabels[level]}`),
            }))}
          />
          <Select
            id="learn-filter-skill"
            name="competence"
            label={t("learn.catalog.filter.skill")}
            defaultValue={filters.competence ?? ""}
            placeholder={t("learn.catalog.filter.any")}
            options={skills.map((skill) => ({ value: skill.slug, label: skill.name }))}
          />
          <Select
            id="learn-filter-editorial"
            name="ligne"
            label={t("learn.catalog.filter.editorial")}
            defaultValue={filters.ligne ?? ""}
            placeholder={t("learn.catalog.filter.any")}
            options={editorialFilters.map((line) => ({
              value: line,
              label: t(`learn.editorial.${line}`),
            }))}
          />
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
            <Button type="submit">{t("learn.catalog.filter.submit")}</Button>
            {activeFilters > 0 && (
              <ButtonLink
                href={withParams("/app/learn/explorer", { q: filters.q, domaine: filters.domaine })}
                variant="tertiary"
              >
                {t("learn.catalog.filters.reset")}
              </ButtonLink>
            )}
          </div>
        </form>
      </details>

      {saved === "1" && <Alert tone="success" title={t("learn.save.success")} />}
      {saved === "0" && <Alert tone="info" title={t("learn.save.removed")} />}

      {hero && (
        <section
          aria-labelledby="learn-hero"
          className="relative grid gap-3 overflow-hidden rounded-[22px] border border-sapin/8 bg-blanc p-4 text-sapin sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-8"
        >
          <div className="flex min-w-0 flex-col gap-2.5">
            <p className="relative flex flex-wrap gap-2 text-[11px] font-semibold">
              {(hero.domain?.name || hero.category) && (
                <span className="rounded-pill bg-lime px-2.5 py-1 text-sapin">
                  {hero.domain?.name || hero.category}
                </span>
              )}
              {hero.editorialLine !== "originals" && (
                <span className="rounded-pill bg-sapin px-2.5 py-1 text-blanc">
                  {t(`learn.editorial.${hero.editorialLine}`)}
                </span>
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

      {/* Paths (Learn v2, étape 2): on the catalog home and on a domain page, not in a search. */}
      {paths.length > 0 && !filters.q && activeFilters === 0 && search.page === 1 && (
        <section aria-labelledby="learn-paths" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="learn-paths" className={sectionTitle}>
              {t("learn.catalog.paths.title")}
            </h2>
            <p className="text-[14px] text-ardoise">{t("learn.catalog.paths.subtitle")}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paths.slice(0, 6).map((path) => (
              <li key={path.slug} className="min-w-0">
                <PathCard path={path} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {!filtered && <RecommendedCourses userId={user.id} goal={goal ?? undefined} />}

      <section aria-labelledby="learn-list" className="flex flex-col gap-3">
        <h2 id="learn-list" className={sectionTitle}>
          {filtered ? t("learn.catalog.title") : t("learn.catalog.section.popular")}
        </h2>
        {courses.length === 0 ? (
          <EmptyState
            title={
              domain && domain.courseCount === 0
                ? t("learn.catalog.domain.empty")
                : t("learn.catalog.empty.text")
            }
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
