import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { CourseListing } from "@/components/site/listings";
import { Pagination } from "@/components/site/navigation-bits";
import { Band, PageHero } from "@/components/site/sections";
import { Button, ButtonLink, EmptyState, SearchField, Select, Skeleton } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";
import { getCourseSearch, getPublicPlans } from "@/server/queries/public";
import {
  accessFilters,
  courseLevels,
  courseSorts,
  parseCourseFilters,
} from "@/server/services/courses";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("trainings.seo");
  return pageMetadata({ path: "/formations", title: t("title"), description: t("description") });
}

/** "Accès" filter labels (textes, /formations): each catalog level and the text naming the plan that opens it. */
const accessLabels = {
  free: "free",
  fundamentals: "starter",
  standard: "pro",
  advanced: "premium",
} as const;

export default async function TrainingsPage({ searchParams }: PageProps<"/formations">) {
  const t = await getTranslations("trainings");
  return (
    <>
      <PageHero
        title={t("hero.title")}
        text={t("hero.text")}
        aside={<Character name="fatou" pose="montre" height={260} />}
      />
      <section className="bg-creme">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 page-x pb-16">
          <Suspense fallback={<ResultsSkeleton />}>
            <Results searchParams={searchParams} />
          </Suspense>
          <Band
            title={t("banner.title")}
            text={t("banner.text")}
            action={
              <ButtonLink href="/tarifs" variant="secondary">
                {t("banner.cta")}
              </ButtonLink>
            }
          />
        </div>
      </section>
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((n) => (
        <Skeleton key={n} className="h-72 rounded-card" />
      ))}
    </div>
  );
}

async function Results({
  searchParams,
}: {
  searchParams: PageProps<"/formations">["searchParams"];
}) {
  const t = await getTranslations("trainings");
  const nav = await getTranslations("nav");
  const filters = parseCourseFilters(await searchParams);
  const [result, plans] = await Promise.all([getCourseSearch(filters), getPublicPlans()]);
  const { page: _page, ...current } = filters;
  void _page;
  const hasFilters = Object.keys(current).some((key) => key !== "tri");

  if (result.catalogTotal === 0) {
    return (
      <EmptyState
        title={t("emptyCatalog.title")}
        description={t("emptyCatalog.text")}
        action={<ButtonLink href={signupHref({ profil: "talent" })}>{nav("signup")}</ButtonLink>}
      />
    );
  }

  return (
    <>
      <form
        action="/formations"
        method="get"
        role="search"
        className="flex flex-col gap-4 rounded-card bg-blanc p-5"
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <SearchField
            id="training-search"
            name="q"
            label={t("search.label")}
            placeholder={t("search.placeholder")}
            defaultValue={filters.q}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" className="h-12">
            {t("search.submit")}
          </Button>
        </div>
        <details className="group md:open:block" open={hasFilters}>
          <summary className="cursor-pointer list-none font-semibold md:hidden">
            {t("filters.open")}
          </summary>
          <fieldset className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <legend className="sr-only">{t("filters.title")}</legend>
            <Select
              id="training-theme"
              name="theme"
              label={t("filters.theme.label")}
              defaultValue={filters.theme ?? ""}
              options={[
                { value: "", label: t("filters.theme.all") },
                ...result.themes.map((theme) => ({ value: theme, label: theme })),
              ]}
            />
            <Select
              id="training-level"
              name="niveau"
              label={t("filters.level.label")}
              defaultValue={filters.niveau ?? ""}
              options={[
                { value: "", label: t("filters.level.all") },
                ...courseLevels.map((level) => ({
                  value: level,
                  label: t(`filters.level.${level}`),
                })),
              ]}
            />
            <Select
              id="training-access"
              name="acces"
              label={t("filters.access.label")}
              defaultValue={filters.acces ?? ""}
              options={[
                { value: "", label: t("filters.access.all") },
                ...accessFilters.map((level) => ({
                  value: level,
                  label: t(`filters.access.${accessLabels[level]}`),
                })),
              ]}
            />
            <Select
              id="training-sort"
              name="tri"
              label={t("sort.label")}
              defaultValue={filters.tri ?? "recent"}
              options={courseSorts.map((sort) => ({ value: sort, label: t(`sort.${sort}`) }))}
            />
          </fieldset>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" variant="secondary">
              {t("filters.apply")}
            </Button>
            {hasFilters && (
              <ButtonLink href="/formations" variant="tertiary">
                {t("filters.reset")}
              </ButtonLink>
            )}
          </div>
        </details>
      </form>

      <p className="font-semibold" role="status">
        {t("results.count", { count: result.total })}
      </p>

      {result.courses.length === 0 ? (
        <EmptyState
          title={t("empty.title")}
          description={t("empty.text")}
          action={
            <ButtonLink href="/formations" variant="secondary">
              {t("empty.cta")}
            </ButtonLink>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.courses.map((course) => (
            <li key={course.slug} className="flex [&>article]:flex-1">
              <CourseListing course={course} plans={plans} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        path="/formations"
        params={current}
        labels={{
          prev: t("pagination.prev"),
          next: t("pagination.next"),
          page: t("pagination.page", { page: result.page, total: result.pageCount }),
        }}
      />
    </>
  );
}
