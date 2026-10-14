import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { JobListing } from "@/components/site/listings";
import { Pagination } from "@/components/site/navigation-bits";
import { Badge, Button, ButtonLink, EmptyState, SearchField, Select } from "@/components/ui";
import { toggleSaveAction } from "@/server/actions/jobs";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { matchesForUser } from "@/server/matching/service";
import { getJobSearch } from "@/server/queries/public";
import { isClosedStatus, listApplications, talentStatus } from "@/server/services/applications";
import {
  contractFilters,
  jobSorts,
  parseJobFilters,
  remoteFilters,
  type ContractFilter,
  type RemoteFilter,
} from "@/server/services/jobs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.jobs");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/**
 * Jobs (partie 07 § 5): the public search, with what only a signed-in talent has: offers saved,
 * offers already applied to, the compatibility score of each offer (its « Pourquoi ? » is on the
 * job page) and the follow-up of applications. Applying is free and never limited.
 */
export default async function TalentJobsPage({ searchParams }: PageProps<"/app/jobs">) {
  const params = await searchParams;
  const user = await requireUser("/app/jobs");
  const t = await getTranslations();
  const filters = parseJobFilters(params);
  const result = await getJobSearch(filters);
  const { page: _page, ...current } = filters;
  void _page;
  const hasFilters = Object.keys(current).some((key) => key !== "tri");
  const [applications, saved, matches] = await Promise.all([
    listApplications(db, user.id),
    db.savedJob.findMany({
      where: { userId: user.id },
      select: { job: { select: { slug: true } } },
    }),
    matchesForUser(
      db,
      user.id,
      result.jobs.map((job) => job.id),
    ),
  ]);
  const applied = new Set(applications.map((application) => application.job.slug));
  const savedSlugs = new Set(saved.map((item) => item.job.slug));
  const statuses = applications.map((application) => talentStatus(application));
  const back = `/app/jobs?${new URLSearchParams(Object.entries(params).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : [])))}`;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-eyebrow text-ardoise">{t("talent.jobs.search.eyebrow")}</p>
        <h1 className="text-h1">{t("talent.jobs.search.title", { count: result.total })}</h1>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-5">
          <form
            action="/app/jobs"
            method="get"
            role="search"
            className="flex flex-col gap-4 rounded-card bg-blanc p-5"
          >
            <div className="flex flex-col gap-3 md:flex-row">
              <SearchField
                id="job-keyword"
                name="q"
                label={t("talent.jobs.search.keyword.label")}
                placeholder={t("talent.jobs.search.keyword.placeholder")}
                defaultValue={filters.q}
                className="flex-1"
              />
              <Button type="submit" variant="secondary" className="h-12">
                {t("talent.jobs.search.submit")}
              </Button>
            </div>
            <details open={hasFilters}>
              <summary className="cursor-pointer font-semibold">
                {t("talent.jobs.filters.text")}
              </summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Select
                  id="job-country"
                  name="pays"
                  label={t("talent.jobs.filter.country")}
                  defaultValue={filters.pays ?? ""}
                  options={[
                    { value: "", label: t("jobs.search.country.placeholder") },
                    ...result.countries.map((country) => ({ value: country, label: country })),
                  ]}
                />
                <Select
                  id="job-contract"
                  name="contrat"
                  label={t("talent.jobs.filter.contract")}
                  defaultValue={filters.contrat ?? ""}
                  options={[
                    { value: "", label: t("jobs.search.contract.all") },
                    ...(Object.keys(contractFilters) as ContractFilter[]).map((key) => ({
                      value: key,
                      label: t(`jobs.search.contract.${key}`),
                    })),
                  ]}
                />
                <Select
                  id="job-remote"
                  name="teletravail"
                  label={t("talent.jobs.filter.remote.text")}
                  defaultValue={filters.teletravail ?? ""}
                  options={[
                    { value: "", label: t("jobs.search.remote.all") },
                    ...(Object.keys(remoteFilters) as RemoteFilter[]).map((key) => ({
                      value: key,
                      label: t(`jobs.search.remote.${key}`),
                    })),
                  ]}
                />
                <Select
                  id="job-sort"
                  name="tri"
                  label={t("jobs.sort.label")}
                  defaultValue={filters.tri ?? "recent"}
                  options={jobSorts.map((sort) => ({ value: sort, label: t(`jobs.sort.${sort}`) }))}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="submit" variant="secondary">
                  {t("talent.jobs.search.submit")}
                </Button>
                {hasFilters && (
                  <ButtonLink href="/app/jobs" variant="tertiary">
                    {t("talent.jobs.filters.reset")}
                  </ButtonLink>
                )}
              </div>
            </details>
          </form>

          {result.jobs.length === 0 ? (
            <EmptyState
              title={t("talent.jobs.search.empty.title")}
              description={t("talent.jobs.search.empty.body")}
              action={
                <ButtonLink href="/app/jobs" variant="secondary">
                  {t("talent.jobs.search.empty.cta")}
                </ButtonLink>
              }
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {result.jobs.map((job) => {
                const isSaved = savedSlugs.has(job.slug);
                const match = matches.get(job.id);
                return (
                  <li key={job.slug} className="flex flex-col gap-2 [&>article]:flex-1">
                    <JobListing
                      job={job}
                      now={result.now}
                      href={`/app/jobs/${job.slug}`}
                      match={match?.state === "ok" ? match.explanation : undefined}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                      {applied.has(job.slug) ? (
                        <Badge tone="success">{t("talent.jobs.card.applied")}</Badge>
                      ) : (
                        <span />
                      )}
                      <form action={toggleSaveAction}>
                        <input type="hidden" name="job" value={job.slug} />
                        <input type="hidden" name="back" value={back} />
                        <Button
                          type="submit"
                          variant="tertiary"
                          size="sm"
                          aria-pressed={isSaved}
                          aria-label={`${isSaved ? t("talent.jobs.card.unsave") : t("talent.jobs.card.save")} · ${job.title}`}
                          icon={<Icon name="favori" className="size-4" />}
                        >
                          {isSaved ? t("talent.jobs.card.unsave") : t("talent.jobs.card.save")}
                        </Button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            path="/app/jobs"
            params={current}
            labels={{
              prev: t("talent.jobs.search.previous"),
              next: t("talent.jobs.search.next"),
              page: t("jobs.pagination.page", { page: result.page, total: result.pageCount }),
            }}
          />
        </div>

        <aside className="flex flex-col gap-4 self-start">
          <div className="flex flex-col gap-3 rounded-card bg-blanc p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-h3">
                {t("talent.jobs.sidebar.applications.text")}
              </h2>
              <Link href="/app/jobs/candidatures" className="text-sm underline">
                {t("talent.jobs.sidebar.applications.link")}
              </Link>
            </div>
            <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 text-[15px]">
              {(
                [
                  ["sent", statuses.length],
                  [
                    "viewed",
                    statuses.filter(
                      (status) =>
                        status !== "sent" && status !== "withdrawn" && status !== "jobClosed",
                    ).length,
                  ],
                  ["interviews", statuses.filter((status) => status === "interview").length],
                  [
                    "offers",
                    statuses.filter((status) => status === "offer" || status === "hired").length,
                  ],
                ] as const
              ).map(([key, value]) => (
                <div key={key} className="contents">
                  <dt>{t(`talent.jobs.sidebar.${key}`)}</dt>
                  <dd className="text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-feuille-fonce">{t("talent.jobs.sidebar.free")}</p>
            {statuses.some((status) => !isClosedStatus(status)) && (
              <ButtonLink href="/app/jobs/candidatures" variant="secondary" size="sm">
                {t("talent.jobs.applications.title")}
              </ButtonLink>
            )}
          </div>
          <Link
            href="/app/jobs/enregistrees"
            className="rounded-card bg-blanc p-5 font-semibold underline"
          >
            {t("talent.jobs.saved.title")}
            {" · "}
            {savedSlugs.size}
          </Link>
        </aside>
      </div>
    </div>
  );
}
