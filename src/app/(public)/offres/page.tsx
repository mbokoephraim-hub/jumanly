import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AiOrb, Character } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import { FilterPanel } from "@/components/site/filter-panel";
import {
  Eyebrow,
  Glow,
  IconTile,
  Pattern,
  iaFlow,
  lead,
  stagger,
  wrap,
} from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { Pagination, withParams } from "@/components/site/navigation-bits";
import { CatalogJobCard } from "@/components/site/public-cards";
import { ButtonLink, EmptyState, Skeleton } from "@/components/ui";
import { cx } from "@/lib/cx";
import { pageMetadata } from "@/lib/seo";
import { loginHref, signupHref } from "@/lib/signup";
import { getJobSearch } from "@/server/queries/public";
import {
  contractFilters,
  jobSorts,
  parseJobFilters,
  remoteFilters,
  type ContractFilter,
  type JobFilters,
  type RemoteFilter,
} from "@/server/services/jobs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jobs.seo");
  return pageMetadata({ path: "/offres", title: t("title"), description: t("description") });
}

const contracts = Object.keys(contractFilters) as ContractFilter[];
const remotes = Object.keys(remoteFilters) as RemoteFilter[];

/** Public job search (mockup 01-12): search card, results list, recruiter card and filters. */
export default async function JobsPage({ searchParams }: PageProps<"/offres">) {
  const t = await getTranslations("jobs");
  return (
    <>
      <MotionRoot />
      <section data-scene className="relative overflow-hidden bg-creme pt-10 lg:pt-14">
        <Glow className="-top-48 -left-40 size-[520px] bg-lime/40" />
        <Glow className="top-10 -right-40 size-[460px] bg-menthe/30" delay={-8} />
        <div className={cx(wrap, "relative flex items-end gap-12")}>
          <div className="flex min-w-0 flex-1 flex-col gap-4 pb-6 lg:pb-8">
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
          <div className="jm-breathe hidden shrink-0 lg:mr-6 lg:block">
            <Character name="diallo" pose="telephone" height={220} />
          </div>
        </div>
      </section>
      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function ResultsSkeleton() {
  return (
    <section className="bg-creme pb-16">
      <div className={cx(wrap, "flex flex-col gap-6")}>
        <Skeleton className="h-[94px] rounded-[28px]" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-44 rounded-[24px]" />
          ))}
        </div>
      </div>
    </section>
  );
}

const fieldClass =
  "h-[46px] w-full rounded-[14px] bg-blanc text-sm text-sapin ring-[1.5px] ring-brume ring-inset placeholder:text-ardoise focus:ring-2 focus:ring-sapin focus:outline-none";

function Field({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-2", className)}>
      <label htmlFor={id} className="text-[13px] leading-[18px] font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectField({
  id,
  name,
  defaultValue,
  options,
}: {
  id: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <span className="relative block">
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className={cx(fieldClass, "appearance-none pr-10 pl-3.5")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon
        name="chev-d"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2"
      />
    </span>
  );
}

function IconInput({
  icon,
  ...props
}: { icon: IconName } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className="relative block">
      <Icon
        name={icon}
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
      />
      <input {...props} className={cx(fieldClass, "pr-3.5 pl-10")} />
    </span>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/offres">["searchParams"] }) {
  const t = await getTranslations("jobs");
  const job = await getTranslations("job");
  const filters = parseJobFilters(await searchParams);
  const result = await getJobSearch(filters);
  const { page: _page, ...current } = filters;
  void _page;
  const hasFilters = Object.keys(current).some((key) => key !== "tri");
  const sideCount = (filters.contrat ? 1 : 0) + (filters.teletravail ? 1 : 0);
  const sort = filters.tri ?? "recent";

  if (result.openTotal === 0) {
    return (
      <section className="bg-creme pb-16">
        <div className={wrap}>
          <EmptyState
            title={t("emptyAll.title")}
            description={t("emptyAll.text")}
            action={
              <ButtonLink href={signupHref({ profil: "talent" })}>{t("emptyAll.cta")}</ButtonLink>
            }
          />
        </div>
      </section>
    );
  }

  const filtersCard = <SideFilters filters={current} />;

  return (
    <section className="relative bg-creme pb-14 lg:pb-24">
      <div className={cx(wrap, "flex flex-col gap-8 lg:gap-10")}>
        <form
          action="/offres"
          method="get"
          role="search"
          className="jm-rise relative z-1 flex flex-col gap-4 rounded-[28px] bg-blanc p-5 shadow-[0_20px_50px_rgba(15,63,55,0.08)] lg:flex-row lg:items-end lg:gap-3 lg:px-6 lg:py-[22px]"
          style={stagger(3)}
        >
          <Field id="job-keyword" label={t("search.keyword.label")} className="lg:flex-[1.6]">
            <IconInput
              id="job-keyword"
              icon="recherche"
              type="search"
              name="q"
              defaultValue={filters.q}
              placeholder={t("search.keyword.placeholder")}
            />
          </Field>
          <Field id="job-city" label={t("search.city.label")} className="lg:flex-1">
            <IconInput
              id="job-city"
              icon="localisation"
              name="ville"
              defaultValue={filters.ville}
              placeholder={t("search.city.placeholder")}
            />
          </Field>
          {/* Hidden on phones but still sent, so a search keeps the chosen filters. */}
          <Field
            id="job-country"
            label={t("search.country.label")}
            className="max-lg:hidden lg:flex-1"
          >
            <SelectField
              id="job-country"
              name="pays"
              defaultValue={filters.pays ?? ""}
              options={[
                { value: "", label: t("search.country.placeholder") },
                ...result.countries.map((country) => ({ value: country, label: country })),
              ]}
            />
          </Field>
          <Field
            id="job-contract"
            label={t("search.contract.label")}
            className="max-lg:hidden lg:flex-1"
          >
            <SelectField
              id="job-contract"
              name="contrat"
              defaultValue={filters.contrat ?? ""}
              options={[
                { value: "", label: t("search.contract.all") },
                ...contracts.map((key) => ({ value: key, label: t(`search.contract.${key}`) })),
              ]}
            />
          </Field>
          <Field
            id="job-remote"
            label={t("search.remote.label")}
            className="max-lg:hidden lg:w-[150px]"
          >
            <SelectField
              id="job-remote"
              name="teletravail"
              defaultValue={filters.teletravail ?? ""}
              options={[
                { value: "", label: t("search.remote.all") },
                ...remotes.map((key) => ({ value: key, label: t(`search.remote.${key}`) })),
              ]}
            />
          </Field>
          {filters.tri && <input type="hidden" name="tri" value={filters.tri} />}
          <button
            type="submit"
            className="h-12 shrink-0 rounded-pill bg-sapin px-6 text-[15px] font-semibold text-blanc transition-colors hover:bg-feuille-fonce focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapin lg:h-[46px]"
          >
            {t("search.submit")}
          </button>
        </form>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-7">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-3">
                <span className="text-lg font-semibold" role="status">
                  {t("results.count", { count: result.total })}
                </span>
                {hasFilters && (
                  <Link
                    href="/offres"
                    className="text-[13px] font-semibold text-feuille-fonce hover:underline"
                  >
                    {t("search.reset")}
                  </Link>
                )}
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
                <ul className="absolute right-0 z-20 mt-2 flex w-52 flex-col rounded-[18px] bg-blanc p-2 shadow-[0_20px_40px_rgba(11,26,31,0.14)]">
                  {jobSorts.map((option) => (
                    <li key={option}>
                      <Link
                        href={withParams("/offres", { ...current, tri: option })}
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

            {/* Phones: the side filters fold behind one button */}
            <FilterPanel
              className="lg:hidden"
              summary={
                <summary className="inline-flex h-11 cursor-pointer list-none items-center gap-2 rounded-pill bg-blanc px-5 text-sm font-semibold ring-[1.5px] ring-brume ring-inset [&::-webkit-details-marker]:hidden">
                  <Icon name="filtre" className="size-4" />
                  {t("search.filtersCount", { count: sideCount })}
                </summary>
              }
            >
              <div className="mt-3">{filtersCard}</div>
            </FilterPanel>

            <div
              className="jm-flow relative flex flex-col items-start gap-4 overflow-hidden rounded-[24px] bg-gradient-ai px-5 py-5 text-blanc sm:flex-row sm:items-center lg:px-6"
              style={{ backgroundImage: iaFlow }}
            >
              <AiOrb size={36} className="jm-pulse shrink-0 max-sm:hidden" />
              <p className="flex flex-1 items-start gap-3 text-[15px] leading-[22px]">
                <AiOrb size={32} className="jm-pulse shrink-0 sm:hidden" />
                {t("matchHint.text")}
              </p>
              <ButtonLink href={loginHref("/app/jobs")} size="sm" className="h-10 px-4">
                {t("matchHint.cta")}
              </ButtonLink>
            </div>

            {result.jobs.length === 0 ? (
              <EmptyState
                title={t("empty.title")}
                description={t("empty.text")}
                action={
                  <ButtonLink href="/offres" variant="secondary">
                    {t("empty.cta")}
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="flex flex-col gap-4">
                {result.jobs.map((job, index) => (
                  <li key={job.slug} data-reveal style={stagger(index % 3)}>
                    <CatalogJobCard job={job} now={result.now} />
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-2">
              <Pagination
                page={result.page}
                pageCount={result.pageCount}
                path="/offres"
                params={current}
                labels={{
                  prev: t("pagination.prev"),
                  next: t("pagination.next"),
                  page: t("pagination.page", { page: result.page, total: result.pageCount }),
                }}
              />
            </div>
          </div>

          <aside className="flex flex-col gap-5 lg:w-[340px] lg:shrink-0">
            <div
              data-reveal
              className="jm-flow relative flex min-h-[280px] flex-col items-start gap-3 overflow-hidden rounded-[28px] bg-lime p-6 text-sapin lg:min-h-[410px]"
              style={{
                backgroundImage:
                  "linear-gradient(120deg, #D9FA72 0%, #A6F26B 35%, #7DE36B 60%, #E3F67C 100%)",
              }}
            >
              <Pattern name="motif-points-lime" size={260} opacity={0.6} />
              <IconTile icon="hire" size={46} className="relative bg-sapin text-lime" />
              <h2 className="relative text-[22px] leading-7 font-semibold tracking-[-0.015em]">
                {t("recruiterBanner.title")}
              </h2>
              <p className="relative max-w-[260px] text-[15px] leading-[22px]">
                {t("recruiterBanner.text")}
              </p>
              <ButtonLink
                href={signupHref({ profil: "rh" })}
                variant="secondary"
                iconAfter={<Icon name="chev-r" />}
                className="relative"
              >
                {t("recruiterBanner.cta")}
              </ButtonLink>
              <div className="jm-breathe absolute right-5 -bottom-1 hidden lg:block">
                <Character name="nadia" pose="montre" height={180} />
              </div>
            </div>
            <div className="hidden lg:block">{filtersCard}</div>
            <p
              data-reveal
              className="flex items-start gap-3 rounded-[20px] bg-blanc px-5 py-4 text-[13px] leading-5 max-lg:hidden"
            >
              <Icon name="securite" className="mt-0.5 size-5 shrink-0 text-feuille-fonce" />
              {job("safety.text")}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

/**
 * Side filters (contract, remote) as links: each one applies at once and keeps the other
 * criteria, without JavaScript and without a second form.
 */
async function SideFilters({ filters }: { filters: Omit<JobFilters, "page"> }) {
  const t = await getTranslations("jobs");
  const row =
    "flex min-h-[30px] items-center gap-2.5 rounded-[10px] text-[13px] hover:text-feuille-fonce";
  return (
    <div className="flex flex-col gap-5 rounded-[28px] bg-blanc p-6">
      <p className="flex items-center justify-between text-lg font-semibold">
        {t("search.openFilters")}
        <Icon name="filtre" className="size-5" />
      </p>
      <nav aria-label={t("search.contract.label")} className="flex flex-col gap-1">
        <p className="mb-2 text-sm font-semibold">{t("search.contract.label")}</p>
        {contracts.map((key) => {
          const on = filters.contrat === key;
          return (
            <Link
              key={key}
              href={withParams("/offres", { ...filters, contrat: on ? undefined : key })}
              aria-current={on ? "true" : undefined}
              className={row}
            >
              <span
                aria-hidden
                className={cx(
                  "flex size-[18px] shrink-0 items-center justify-center rounded-[5px] text-blanc",
                  on ? "bg-sapin" : "bg-blanc ring-[1.5px] ring-ardoise ring-inset",
                )}
              >
                {on && <Icon name="check" className="size-3" />}
              </span>
              {t(`search.contract.${key}`)}
            </Link>
          );
        })}
      </nav>
      <span aria-hidden className="h-px bg-brume" />
      <nav aria-label={t("search.remote.label")} className="flex flex-col gap-1">
        <p className="mb-2 text-sm font-semibold">{t("search.remote.label")}</p>
        {[undefined, ...remotes].map((key) => {
          const on = filters.teletravail === key;
          return (
            <Link
              key={key ?? "all"}
              href={withParams("/offres", { ...filters, teletravail: key })}
              aria-current={on ? "true" : undefined}
              className={row}
            >
              <span
                aria-hidden
                className={cx(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-blanc",
                  on ? "bg-sapin" : "bg-blanc ring-[1.5px] ring-ardoise ring-inset",
                )}
              >
                {on && <Icon name="check" className="size-3" />}
              </span>
              {key ? t(`search.remote.${key}`) : t("search.remote.all")}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/offres"
        className="flex h-11 items-center justify-center rounded-pill text-sm font-semibold ring-[1.5px] ring-brume ring-inset hover:bg-creme"
      >
        {t("search.reset")}
      </Link>
    </div>
  );
}
