import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { JobListing } from "@/components/site/listings";
import { Pagination } from "@/components/site/navigation-bits";
import { Band, PageHero } from "@/components/site/sections";
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  SearchField,
  Select,
  Skeleton,
  TextField,
} from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { loginHref, signupHref } from "@/lib/signup";
import { getJobSearch } from "@/server/queries/public";
import {
  contractFilters,
  jobSorts,
  parseJobFilters,
  remoteFilters,
  type ContractFilter,
  type RemoteFilter,
} from "@/server/services/jobs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jobs.seo");
  return pageMetadata({ path: "/offres", title: t("title"), description: t("description") });
}

export default async function JobsPage({ searchParams }: PageProps<"/offres">) {
  const t = await getTranslations("jobs");
  return (
    <>
      <PageHero
        title={t("hero.title")}
        text={t("hero.text")}
        aside={<Character name="kofi" pose="telephone" height={260} />}
      />
      <section className="bg-creme">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 page-x pb-16">
          <Suspense fallback={<ResultsSkeleton />}>
            <Results searchParams={searchParams} />
          </Suspense>
          <Band
            title={t("recruiterBanner.title")}
            text={t("recruiterBanner.text")}
            action={
              <ButtonLink href={signupHref({ profil: "rh" })} variant="secondary">
                {t("recruiterBanner.cta")}
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
        <Skeleton key={n} className="h-56 rounded-card" />
      ))}
    </div>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/offres">["searchParams"] }) {
  const t = await getTranslations("jobs");
  const filters = parseJobFilters(await searchParams);
  const result = await getJobSearch(filters);
  const { page: _page, ...current } = filters;
  void _page;
  const hasFilters = Object.keys(current).some((key) => key !== "tri");

  if (result.openTotal === 0) {
    return (
      <EmptyState
        title={t("emptyAll.title")}
        description={t("emptyAll.text")}
        action={
          <ButtonLink href={signupHref({ profil: "talent" })}>{t("emptyAll.cta")}</ButtonLink>
        }
      />
    );
  }

  return (
    <>
      <form
        action="/offres"
        method="get"
        role="search"
        className="flex flex-col gap-4 rounded-card bg-blanc p-5"
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <SearchField
            id="job-keyword"
            name="q"
            label={t("search.keyword.label")}
            placeholder={t("search.keyword.placeholder")}
            defaultValue={filters.q}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" className="h-12">
            {t("search.submit")}
          </Button>
        </div>
        <details className="group" open={hasFilters}>
          <summary className="cursor-pointer list-none font-semibold">
            {t("search.openFilters")}
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <TextField
              id="job-city"
              name="ville"
              label={t("search.city.label")}
              placeholder={t("search.city.placeholder")}
              defaultValue={filters.ville}
            />
            <Select
              id="job-country"
              name="pays"
              label={t("search.country.label")}
              defaultValue={filters.pays ?? ""}
              options={[
                { value: "", label: t("search.country.placeholder") },
                ...result.countries.map((country) => ({ value: country, label: country })),
              ]}
            />
            <Select
              id="job-contract"
              name="contrat"
              label={t("search.contract.label")}
              defaultValue={filters.contrat ?? ""}
              options={[
                { value: "", label: t("search.contract.all") },
                ...(Object.keys(contractFilters) as ContractFilter[]).map((key) => ({
                  value: key,
                  label: t(`search.contract.${key}`),
                })),
              ]}
            />
            <Select
              id="job-remote"
              name="teletravail"
              label={t("search.remote.label")}
              defaultValue={filters.teletravail ?? ""}
              options={[
                { value: "", label: t("search.remote.all") },
                ...(Object.keys(remoteFilters) as RemoteFilter[]).map((key) => ({
                  value: key,
                  label: t(`search.remote.${key}`),
                })),
              ]}
            />
            <Select
              id="job-sort"
              name="tri"
              label={t("sort.label")}
              defaultValue={filters.tri ?? "recent"}
              options={jobSorts.map((sort) => ({ value: sort, label: t(`sort.${sort}`) }))}
            />
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" variant="secondary">
              {t("search.submit")}
            </Button>
            {hasFilters && (
              <ButtonLink href="/offres" variant="tertiary">
                {t("search.reset")}
              </ButtonLink>
            )}
          </div>
        </details>
      </form>

      <Alert
        title={t("matchHint.text")}
        action={
          <ButtonLink href={loginHref("/app/jobs")} variant="tertiary" size="sm">
            {t("matchHint.cta")}
          </ButtonLink>
        }
      />

      <p className="font-semibold" role="status">
        {t("results.count", { count: result.total })}
      </p>

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
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.jobs.map((job) => (
            <li key={job.slug} className="flex [&>article]:flex-1">
              <JobListing job={job} now={result.now} />
            </li>
          ))}
        </ul>
      )}

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
    </>
  );
}
