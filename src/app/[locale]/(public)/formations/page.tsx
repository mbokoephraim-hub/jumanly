import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { Icon } from "@/components/brand/icon";
import { FilterPanel } from "@/components/site/filter-panel";
import { Eyebrow, Glow, IconTile, Pattern, lead, stagger, wrap } from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { Pagination, withParams } from "@/components/site/navigation-bits";
import { PublicCourseCard } from "@/components/site/public-cards";
import { ButtonLink, EmptyState, Skeleton } from "@/components/ui";
import { cx } from "@/lib/cx";
import { pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";
import { getCourseSearch, getPublicPlans } from "@/server/queries/public";
import {
  accessFilters,
  courseLevels,
  courseSorts,
  parseCourseFilters,
} from "@/server/services/courses";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({ params }: PageProps<"/[locale]/formations">): Promise<Metadata> {
  await applySiteLocale(params);
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

const FORM_ID = "trainings-filters";

/** Public catalog (mockup 01-10): search in the hero, filters on the side, course cards, pagination. */
export default async function TrainingsPage({ params, searchParams }: PageProps<"/[locale]/formations">) {
  await applySiteLocale(params);
  const t = await getTranslations("trainings");
  return (
    <>
      <MotionRoot />
      <section
        data-scene
        className="relative overflow-hidden bg-creme pt-10 pb-8 lg:pt-16 lg:pb-11"
      >
        <Glow className="-top-48 -left-40 size-[520px] bg-lime/40" />
        <Glow className="-right-40 -bottom-56 size-[480px] bg-menthe/30" delay={-8} />
        <div className={cx(wrap, "relative flex items-end gap-12")}>
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="jm-rise" style={stagger(0)}>
                <Eyebrow>{t("hero.eyebrow")}</Eyebrow>
              </div>
              <h1
                className="jm-word text-[40px] leading-[44px] font-semibold tracking-[-0.035em] lg:text-[56px] lg:leading-[60px]"
                style={stagger(1)}
              >
                {t("hero.title")}
              </h1>
              <p className={cx(lead, "jm-rise max-w-[760px] text-sapin/85")} style={stagger(2)}>
                {t("hero.text")}
              </p>
            </div>
            <Suspense fallback={<SearchBar />}>
              <HeroSearch searchParams={searchParams} />
            </Suspense>
          </div>
          <div className="jm-breathe -mb-11 hidden shrink-0 lg:mr-[110px] lg:block">
            <Character name="amani" pose="montre" height={300} />
          </div>
        </div>
      </section>
      <section className="bg-creme pt-3 pb-14 lg:pb-24">
        <div className={cx(wrap, "flex flex-col gap-12")}>
          <Suspense fallback={<ResultsSkeleton />}>
            <Results searchParams={searchParams} />
          </Suspense>
          <div
            data-reveal
            className="relative flex flex-col items-start gap-5 overflow-hidden rounded-[28px] bg-sapin px-6 py-7 text-blanc lg:flex-row lg:items-center lg:gap-6 lg:px-8"
          >
            <Pattern name="motif-trajectoires-sombre" size={380} opacity={0.18} />
            <span className="jm-float relative">
              <IconTile icon="learn" size={56} className="bg-lime text-sapin" />
            </span>
            <div className="relative flex flex-1 flex-col gap-1.5">
              <h2 className="text-[22px] leading-7 font-semibold lg:text-xl lg:leading-[26px]">
                {t("banner.title")}
              </h2>
              <p className="text-[14.5px] leading-[22px] text-blanc/75">{t("banner.text")}</p>
            </div>
            <ButtonLink
              href="/tarifs"
              size="lg"
              iconAfter={<Icon name="chev-r" />}
              className="relative w-full lg:w-auto"
            >
              {t("banner.cta")}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

async function HeroSearch({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/formations">["searchParams"];
}) {
  const filters = parseCourseFilters(await searchParams);
  return <SearchBar defaultValue={filters.q} />;
}

/** The pill search of the hero. It owns the form; the side filters join it with `form=`. */
async function SearchBar({ defaultValue }: { defaultValue?: string }) {
  const t = await getTranslations("trainings.search");
  return (
    <form
      id={FORM_ID}
      action="/formations"
      method="get"
      role="search"
      className="jm-rise flex max-w-[760px] flex-col gap-3 rounded-[28px] bg-blanc p-3 shadow-[0_10px_30px_rgba(15,63,55,0.06)] sm:flex-row sm:items-center sm:rounded-pill sm:py-2 sm:pr-2 sm:pl-6"
      style={stagger(3)}
    >
      <label className="flex min-w-0 flex-1 items-center gap-3 px-3 sm:px-0">
        <Icon name="recherche" className="size-5 shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[11.5px] leading-4 text-ardoise">{t("label")}</span>
          <input
            type="search"
            name="q"
            defaultValue={defaultValue}
            placeholder={t("placeholder")}
            className="h-7 w-full bg-transparent text-[15px] text-sapin placeholder:text-ardoise focus:outline-none"
          />
        </span>
      </label>
      <button
        type="submit"
        className="h-12 shrink-0 rounded-pill bg-sapin px-6 text-[15px] font-semibold text-blanc transition-colors hover:bg-feuille-fonce focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapin"
      >
        {t("submit")}
      </button>
    </form>
  );
}

function ResultsSkeleton() {
  return (
    <div className="flex gap-8">
      <Skeleton className="hidden h-[880px] w-[280px] rounded-[28px] lg:block" />
      <div className="grid flex-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-80 rounded-[24px]" />
        ))}
      </div>
    </div>
  );
}

/** One radio of the filter card, drawn as the mockup's disc (filled Sapin with a check). */
function FilterRadio({
  name,
  value,
  checked,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  label: string;
}) {
  return (
    <label className="flex min-h-7 cursor-pointer items-start gap-2.5 text-[13px] leading-5">
      <input
        type="radio"
        form={FORM_ID}
        name={name}
        value={value}
        defaultChecked={checked}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-blanc text-blanc ring-[1.5px] ring-ardoise ring-inset peer-checked:bg-sapin peer-checked:ring-sapin peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sapin"
      >
        <Icon name="check" className="size-3" />
      </span>
      {label}
    </label>
  );
}

async function Results({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/formations">["searchParams"];
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

  const groups = [
    {
      key: "theme",
      label: t("filters.theme.label"),
      all: t("filters.theme.all"),
      value: filters.theme,
      options: result.themes.map((theme) => ({ value: theme, label: theme })),
    },
    {
      key: "niveau",
      label: t("filters.level.label"),
      all: t("filters.level.all"),
      value: filters.niveau,
      options: courseLevels.map((level) => ({ value: level, label: t(`filters.level.${level}`) })),
    },
    {
      key: "acces",
      label: t("filters.access.label"),
      all: t("filters.access.all"),
      value: filters.acces,
      options: accessFilters.map((level) => ({
        value: level,
        label: t(`filters.access.${accessLabels[level]}`),
      })),
    },
  ];
  const sort = filters.tri ?? "recent";

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
      <FilterPanel
        open={hasFilters}
        className="group/filters lg:w-[280px] lg:shrink-0"
        summary={
          <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-pill bg-blanc px-4 text-[13px] font-semibold lg:hidden [&::-webkit-details-marker]:hidden">
            <Icon name="filtre" className="size-4" />
            {t("filters.open")}
          </summary>
        }
      >
        <div className="mt-3 flex flex-col gap-5 rounded-[28px] bg-blanc p-6 lg:mt-0">
          <p className="flex items-center justify-between text-lg font-semibold">
            {t("filters.title")}
            <Icon name="filtre" className="size-5" />
          </p>
          {groups.map((group, index) => (
            <fieldset key={group.key} className="flex flex-col gap-1">
              {index > 0 && <span aria-hidden className="mb-4 block h-px bg-brume" />}
              <legend className="mb-2 text-sm font-semibold">{group.label}</legend>
              <FilterRadio name={group.key} value="" checked={!group.value} label={group.all} />
              {group.options.map((option) => (
                <FilterRadio
                  key={option.value}
                  name={group.key}
                  value={option.value}
                  checked={group.value === option.value}
                  label={option.label}
                />
              ))}
            </fieldset>
          ))}
          {filters.tri && <input type="hidden" form={FORM_ID} name="tri" value={filters.tri} />}
          <div className="flex flex-col gap-3">
            <button
              type="submit"
              form={FORM_ID}
              className="h-11 rounded-pill bg-sapin text-sm font-semibold text-blanc transition-colors hover:bg-feuille-fonce focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapin"
            >
              {t("filters.apply")}
            </button>
            <Link
              href="/formations"
              className="flex h-11 items-center justify-center rounded-pill text-sm font-semibold ring-[1.5px] ring-brume ring-inset hover:bg-creme"
            >
              {t("filters.reset")}
            </Link>
          </div>
        </div>
      </FilterPanel>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        {/* Phones: quick access chips under the « Filtrer » button. */}
        <ul className="-mx-4 -mt-2 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 lg:hidden">
          {[undefined, ...accessFilters].map((level) => {
            const on = filters.acces === level;
            return (
              <li key={level ?? "all"} className="shrink-0">
                <Link
                  href={withParams("/formations", { ...current, acces: level })}
                  aria-current={on ? "true" : undefined}
                  className={cx(
                    "flex h-10 items-center rounded-pill px-4 text-[13px] font-semibold whitespace-nowrap",
                    on ? "bg-sapin text-blanc" : "bg-blanc",
                  )}
                >
                  {level ? t(`filters.access.${accessLabels[level]}`) : t("filters.access.all")}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-semibold" role="status">
            {t("results.count", { count: result.total })}
          </p>
          <details className="group/sort relative">
            <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-pill bg-blanc px-4 text-[13px] [&::-webkit-details-marker]:hidden">
              <span className="text-ardoise">{t("sort.label")}</span>
              <b className="font-semibold">{t(`sort.${sort}`)}</b>
              <Icon
                name="chev-d"
                className="size-4 transition-transform group-open/sort:rotate-180"
              />
            </summary>
            <ul className="absolute right-0 z-20 mt-2 flex w-48 flex-col rounded-[18px] bg-blanc p-2 shadow-[0_20px_40px_rgba(11,26,31,0.14)]">
              {courseSorts.map((option) => (
                <li key={option}>
                  <Link
                    href={withParams("/formations", { ...current, tri: option })}
                    aria-current={option === sort ? "true" : undefined}
                    className={cx(
                      "flex h-10 items-center rounded-[12px] px-3 text-sm hover:bg-creme",
                      option === sort && "font-semibold",
                    )}
                  >
                    {t(`sort.${option}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </div>

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
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.courses.map((course, index) => (
              <li
                key={course.slug}
                data-reveal
                className="flex [&>article]:flex-1"
                style={stagger(index % 3)}
              >
                <PublicCourseCard course={course} plans={plans} index={index} variant="catalog" />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2">
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
        </div>
      </div>
    </div>
  );
}
