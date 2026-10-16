import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { ApplicationStats } from "@/components/jobs/application-stats";
import { AppPageHeader } from "@/components/app/page-header";
import { AiBrand, AiPanel, ScoreRing, pillClass } from "@/components/career/kit";
import {
  FilterChipToggle,
  FilterMenu,
  TalentJobCard,
  chip,
  relativeLabel,
  type CardMatch,
} from "@/components/jobs/talent-kit";
import { CloseDetails } from "@/components/jobs/close-details";
import { criterionText } from "@/components/matching/talent-why";
import { TabRail } from "@/components/motion/tab-rail";
import {
  Checkbox,
  CompanyLogo,
  EmptyState,
  Select,
  segmentedItem,
  segmentedList,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { matchesForUser } from "@/server/matching/service";
import { getJobSearch } from "@/server/queries/public";
import { isClosedStatus, listApplications, talentStatus } from "@/server/services/applications";
import {
  JOBS_PER_PAGE,
  compatibilityFilters,
  contractFilters,
  experienceFilters,
  hiringCompanies,
  jobCards,
  jobSorts,
  matchingJobIds,
  parseJobFilters,
  postedFilters,
  remoteFilters,
  type ContractFilter,
  type ExperienceFilter,
  type PostedFilter,
  type PublicJobSummary,
  type RemoteFilter,
} from "@/server/services/jobs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.jobs");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const views = ["tous", "recommandees", "recentes"] as const;
type View = (typeof views)[number];

/** Score from which an offer counts as « recommandée » (band « Compatible » and above). */
const RECOMMENDED_MIN = 70;

/**
 * Jobs (partie 07 § 5, mockup 03-16): the search with what only a signed-in talent has: the
 * compatibility of each offer and its « Pourquoi ? », the offers saved or already applied to, and
 * the follow-up of applications. A low score never hides an offer from « Tous » and never blocks
 * applying, which stays free and unlimited.
 */
export default async function TalentJobsPage({ searchParams }: PageProps<"/app/jobs">) {
  const params = await searchParams;
  const user = await requireUser("/app/jobs");
  const t = await getTranslations();
  const view: View = views.includes(params.vue as View) ? (params.vue as View) : "tous";
  const compat = compatibilityFilters.find((value) => String(value) === params.compat);
  const parsed = parseJobFilters(params);
  const filters = view === "recentes" ? { ...parsed, publie: parsed.publie ?? "7d" } : parsed;
  const page = filters.page ?? 1;

  // Ranking by compatibility (« Recommandées » or a minimum score) scores the matching offers,
  // most recent first; « Tous » and « Récentes » keep the database order and score the page only.
  const ranked = view === "recommandees" || compat !== undefined;
  const search = await getJobSearch(ranked ? { ...filters, page: 1 } : filters);
  let jobs: PublicJobSummary[] = search.jobs;
  let total = search.total;
  let matches = new Map<string, CardMatch>();
  if (ranked) {
    const ids = await matchingJobIds(db, filters, search.now);
    const all = await matchesForUser(db, user.id, ids);
    const min = Math.max(compat ?? 0, view === "recommandees" ? RECOMMENDED_MIN : 0);
    const kept = ids
      .flatMap((id) => {
        const match = all.get(id);
        return match?.state === "ok" && match.explanation.score >= min
          ? [{ id, score: match.explanation.score }]
          : [];
      })
      .sort((a, b) => b.score - a.score);
    total = kept.length;
    const pageIds = kept.slice((page - 1) * JOBS_PER_PAGE, page * JOBS_PER_PAGE).map((k) => k.id);
    jobs = await jobCards(db, pageIds);
    matches = new Map(pageIds.map((id) => [id, all.get(id)]));
  } else {
    matches = await matchesForUser(
      db,
      user.id,
      jobs.map((job) => job.id),
    );
  }
  const pageCount = Math.max(1, Math.ceil(total / JOBS_PER_PAGE));

  const [applications, saved, companies] = await Promise.all([
    listApplications(db, user.id),
    db.savedJob.findMany({
      where: { userId: user.id },
      select: { job: { select: { slug: true } } },
    }),
    hiringCompanies(db, 3, search.now),
  ]);
  const applied = new Set(applications.map((application) => application.job.slug));
  const savedSlugs = new Set(saved.map((item) => item.job.slug));
  const statuses = applications.map((application) => talentStatus(application));

  // Links keep the current search and change one value; the page always goes back to 1.
  const current: Record<string, string> = Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) =>
      typeof value === "string" && value !== "" && key !== "page" ? [[key, value]] : [],
    ),
  );
  const hrefWith = (changes: Record<string, string | undefined>, keepPage = false) => {
    const next = { ...current, ...(keepPage ? { page: String(page) } : {}), ...changes };
    const query = new URLSearchParams(
      Object.entries(next).flatMap(([key, value]) => (value ? [[key, value]] : [])),
    ).toString();
    return query ? `/app/jobs?${query}` : "/app/jobs";
  };
  const back = hrefWith({}, true);
  const resetHref = hrefWith({
    pays: undefined,
    contrat: undefined,
    teletravail: undefined,
    experience: undefined,
    salaire: undefined,
    publie: undefined,
    compat: undefined,
    verifiees: undefined,
  });

  // Active filters, each with its own « × » (mockup: Lime clair chips), then « Réinitialiser ».
  const active: { key: string; label: string }[] = [];
  if (filters.pays) active.push({ key: "pays", label: filters.pays });
  if (filters.contrat)
    active.push({ key: "contrat", label: t(`jobs.search.contract.${filters.contrat}`) });
  if (filters.teletravail)
    active.push({ key: "teletravail", label: t(`jobs.search.remote.${filters.teletravail}`) });
  if (filters.experience)
    active.push({
      key: "experience",
      label: t(`talent.jobs.filter.experience.${filters.experience}`),
    });
  if (filters.salaire)
    active.push({ key: "salaire", label: t("talent.jobs.filter.salary.disclosed") });
  if (parsed.publie)
    active.push({ key: "publie", label: t(`talent.jobs.filter.posted.${parsed.publie}`) });
  if (compat !== undefined)
    active.push({
      key: "compat",
      label: `${t("talent.jobs.filter.compatibility.text")} : ${t("talent.jobs.filter.compatibility.value", { score: compat })}`,
    });
  if (filters.verifiees) active.push({ key: "verifiees", label: t("talent.jobs.filter.verified") });

  const menu = <K extends string>(
    key: string,
    values: readonly K[],
    label: (value: K) => string,
  ) => [
    {
      label: t("talent.jobs.filter.any"),
      href: hrefWith({ [key]: undefined }),
      current: !current[key],
    },
    ...values.map((value) => ({
      label: label(value),
      href: hrefWith({ [key]: value }),
      current: current[key] === value,
    })),
  ];

  // The AI preview shows the best score of the page (mockup: selected card).
  const best = jobs
    .flatMap((job) => {
      const match = matches.get(job.id);
      return match?.state === "ok" ? [{ job, explanation: match.explanation }] : [];
    })
    .sort((a, b) => b.explanation.score - a.explanation.score)[0];
  const firstState = jobs.map((job) => matches.get(job.id)).find(Boolean);

  const sortLabel = t(`jobs.sort.${filters.tri ?? "recent"}`);
  // Admin v4, étape 7: two clearly bounded boxes in one white search bar, the button inside it.
  const field =
    "flex min-w-0 flex-1 cursor-text items-center gap-3 rounded-[16px] bg-creme px-4 py-2.5 text-sapin ring-[1.5px] ring-transparent ring-inset transition-shadow hover:ring-sapin/30 focus-within:bg-blanc focus-within:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus-within:ring-sapin [&_input]:w-full [&_input]:bg-transparent [&_input]:text-[15px] [&_input]:font-semibold [&_input]:outline-none [&_input]:placeholder:font-normal [&_input]:placeholder:text-ardoise";

  return (
    <div className="flex flex-col gap-5">
      <AppPageHeader
        eyebrow={t("talent.jobs.search.eyebrow")}
        title={t("talent.jobs.search.title", { count: total })}
      />

      <form
        action="/app/jobs"
        method="get"
        role="search"
        className="flex flex-col gap-2 rounded-[22px] bg-blanc p-2 shadow-[0_6px_20px_rgb(11_26_31/0.06)] ring-[1.5px] ring-sapin/15 ring-inset lg:flex-row lg:items-stretch"
      >
        {view !== "tous" && <input type="hidden" name="vue" value={view} />}
        {filters.tri && <input type="hidden" name="tri" value={filters.tri} />}
        <div className="flex flex-col gap-2 lg:flex-1 lg:flex-row">
          <div className={field}>
            <Icon name="recherche" className="size-[18px] shrink-0" />
            <label className="flex min-w-0 flex-1 flex-col">
              <span className="text-[11px] leading-[14px] font-semibold text-ardoise">
                {t("talent.jobs.search.keyword.label")}
              </span>
              <input
                id="job-keyword"
                name="q"
                type="search"
                defaultValue={filters.q}
                placeholder={t("talent.jobs.search.keyword.placeholder")}
              />
            </label>
          </div>
          <div className={cx(field, "lg:max-w-[420px]")}>
            <Icon name="localisation" className="size-[18px] shrink-0" />
            <label className="flex min-w-0 flex-1 flex-col">
              <span className="text-[11px] leading-[14px] font-semibold text-ardoise">
                {t("talent.jobs.search.location.label")}
              </span>
              <input
                id="job-city"
                name="ville"
                defaultValue={filters.ville}
                placeholder={t("talent.jobs.search.location.placeholder")}
              />
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-[16px] bg-sapin px-7 text-[15px] font-semibold text-blanc hover:bg-sapin/90 lg:h-auto"
        >
          <Icon name="recherche" className="size-[18px]" />
          {t("talent.jobs.search.submit")}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <nav
            aria-label={t("talent.jobs.search.tabs")}
            className={cx(segmentedList, "overflow-x-auto")}
          >
            {views.map((key) => (
              <Link
                key={key}
                href={hrefWith({ vue: key === "tous" ? undefined : key })}
                aria-current={view === key ? "page" : undefined}
                className={segmentedItem(view === key)}
              >
                {key === "tous"
                  ? t("talent.jobs.search.tab.all", {
                      count: view === "tous" ? total : search.total,
                    })
                  : t(
                      `talent.jobs.search.tab.${key === "recommandees" ? "recommended" : "recent"}`,
                    )}
              </Link>
            ))}
          </nav>
          {!ranked && (
            <details className="relative">
              <summary className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-pill bg-blanc px-4 text-[13px] text-ardoise ring-[1.5px] ring-sapin/20 ring-inset hover:ring-sapin/45 [&::-webkit-details-marker]:hidden">
                <Icon name="sort" className="size-3.5 lg:hidden" />
                <span className="hidden lg:inline">{t("talent.jobs.sort.text")}</span>
                <strong className="font-semibold text-sapin">{sortLabel}</strong>
                <Icon name="chev-d" className="size-3.5" />
              </summary>
              <ul className="absolute top-12 right-0 z-30 flex min-w-48 flex-col gap-0.5 rounded-[18px] bg-blanc p-1.5 text-sm shadow-menu ring-1 ring-sapin/8">
                {jobSorts.map((sort) => (
                  <li key={sort}>
                    <Link
                      href={hrefWith({ tri: sort === "recent" ? undefined : sort })}
                      aria-current={(filters.tri ?? "recent") === sort ? "true" : undefined}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-creme"
                    >
                      {t(`jobs.sort.${sort}`)}
                      {(filters.tri ?? "recent") === sort && (
                        <Icon name="check" className="size-4 text-feuille-fonce" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        <div className="group/filters relative flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <FilterChipToggle
              menu="all"
              active={active.length > 0}
              icon={<Icon name="filtre" className="size-3.5" />}
              label={
                active.length > 0
                  ? t("talent.jobs.filters.count", { count: active.length })
                  : t("talent.jobs.filters.text")
              }
            >
              {/* Every filter in one form: a sheet on a phone, a panel on a computer. */}
              <form
                action="/app/jobs"
                method="get"
                aria-label={t("talent.jobs.filters.text")}
                className={cx(
                  "fixed inset-0 z-50 flex flex-col gap-4 overflow-y-auto bg-creme p-5 lg:absolute lg:inset-auto lg:top-12 lg:left-0 lg:z-30 lg:max-h-none lg:w-[640px] lg:rounded-[24px] lg:bg-blanc lg:shadow-menu lg:ring-1 lg:ring-sapin/8",
                )}
              >
                {filters.q && <input type="hidden" name="q" value={filters.q} />}
                {filters.ville && <input type="hidden" name="ville" value={filters.ville} />}
                {view !== "tous" && <input type="hidden" name="vue" value={view} />}
                {filters.tri && <input type="hidden" name="tri" value={filters.tri} />}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold">{t("talent.jobs.filters.text")}</p>
                  <CloseDetails label={t("talent.jobs.filters.close")}>
                    <Icon name="fermer" className="size-4" />
                  </CloseDetails>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    id="jf-country"
                    name="pays"
                    label={t("talent.jobs.filter.country")}
                    defaultValue={filters.pays ?? ""}
                    options={[
                      { value: "", label: t("jobs.search.country.placeholder") },
                      ...search.countries.map((country) => ({ value: country, label: country })),
                    ]}
                  />
                  <Select
                    id="jf-contract"
                    name="contrat"
                    label={t("talent.jobs.filter.contract")}
                    defaultValue={filters.contrat ?? ""}
                    options={[
                      { value: "", label: t("talent.jobs.filter.any") },
                      ...(Object.keys(contractFilters) as ContractFilter[]).map((key) => ({
                        value: key,
                        label: t(`jobs.search.contract.${key}`),
                      })),
                    ]}
                  />
                  <Select
                    id="jf-remote"
                    name="teletravail"
                    label={t("talent.jobs.filter.remote.text")}
                    defaultValue={filters.teletravail ?? ""}
                    options={[
                      { value: "", label: t("talent.jobs.filter.any") },
                      ...(Object.keys(remoteFilters) as RemoteFilter[]).map((key) => ({
                        value: key,
                        label: t(`jobs.search.remote.${key}`),
                      })),
                    ]}
                  />
                  <Select
                    id="jf-experience"
                    name="experience"
                    label={t("talent.jobs.filter.experience.text")}
                    defaultValue={filters.experience ?? ""}
                    options={[
                      { value: "", label: t("talent.jobs.filter.any") },
                      ...(Object.keys(experienceFilters) as ExperienceFilter[]).map((key) => ({
                        value: key,
                        label: t(`talent.jobs.filter.experience.${key}`),
                      })),
                    ]}
                  />
                  <Select
                    id="jf-posted"
                    name="publie"
                    label={t("talent.jobs.filter.posted.text")}
                    defaultValue={parsed.publie ?? ""}
                    options={[
                      { value: "", label: t("talent.jobs.filter.any") },
                      ...(Object.keys(postedFilters) as PostedFilter[]).map((key) => ({
                        value: key,
                        label: t(`talent.jobs.filter.posted.${key}`),
                      })),
                    ]}
                  />
                  <Select
                    id="jf-compat"
                    name="compat"
                    label={t("talent.jobs.filter.compatibility.text")}
                    defaultValue={compat !== undefined ? String(compat) : ""}
                    options={[
                      { value: "", label: t("talent.jobs.filter.any") },
                      ...compatibilityFilters.map((value) => ({
                        value: String(value),
                        label: t("talent.jobs.filter.compatibility.value", { score: value }),
                      })),
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Checkbox
                    id="jf-salary"
                    name="salaire"
                    value="indique"
                    defaultChecked={Boolean(filters.salaire)}
                    label={t("talent.jobs.filter.salary.disclosed")}
                  />
                  <Checkbox
                    id="jf-verified"
                    name="verifiees"
                    value="1"
                    defaultChecked={Boolean(filters.verifiees)}
                    label={t("talent.jobs.filter.verified")}
                  />
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-3 lg:mt-0">
                  <button
                    type="submit"
                    className="h-12 flex-1 rounded-pill bg-sapin px-6 text-sm font-semibold text-blanc hover:bg-sapin/90 lg:flex-none"
                  >
                    {t("talent.jobs.filters.apply", { count: total })}
                  </button>
                  {active.length > 0 && (
                    <Link
                      href={resetHref}
                      className="text-sm font-semibold text-feuille-fonce underline"
                    >
                      {t("talent.jobs.filters.reset")}
                    </Link>
                  )}
                </div>
              </form>
            </FilterChipToggle>
            <TabRail name="jobs-filters" className="min-w-0 flex-1 bg-transparent! p-0!">
              <div className="flex w-max gap-2">
                <FilterChipToggle
                  menu="contrat"
                  label={t("talent.jobs.filter.contract")}
                  active={Boolean(filters.contrat)}
                />
                <FilterChipToggle
                  menu="teletravail"
                  label={t("talent.jobs.filter.remote.text")}
                  active={Boolean(filters.teletravail)}
                />
                <FilterChipToggle
                  menu="experience"
                  label={t("talent.jobs.filter.experience.text")}
                  active={Boolean(filters.experience)}
                />
                <FilterChipToggle
                  menu="salaire"
                  label={t("talent.jobs.filter.salary.text")}
                  active={Boolean(filters.salaire)}
                />
                <FilterChipToggle
                  menu="publie"
                  label={t("talent.jobs.filter.posted.text")}
                  active={Boolean(parsed.publie)}
                />
                <FilterChipToggle
                  menu="compat"
                  label={t("talent.jobs.filter.compatibility.text")}
                  active={compat !== undefined}
                />
              </div>
            </TabRail>
          </div>
          <FilterMenu
            menu="contrat"
            items={menu("contrat", Object.keys(contractFilters) as ContractFilter[], (value) =>
              t(`jobs.search.contract.${value}`),
            )}
          />
          <FilterMenu
            menu="teletravail"
            items={menu("teletravail", Object.keys(remoteFilters) as RemoteFilter[], (value) =>
              t(`jobs.search.remote.${value}`),
            )}
          />
          <FilterMenu
            menu="experience"
            items={menu(
              "experience",
              Object.keys(experienceFilters) as ExperienceFilter[],
              (value) => t(`talent.jobs.filter.experience.${value}`),
            )}
          />
          <FilterMenu
            menu="salaire"
            items={menu("salaire", ["indique"] as const, () =>
              t("talent.jobs.filter.salary.disclosed"),
            )}
          />
          <FilterMenu
            menu="publie"
            items={menu("publie", Object.keys(postedFilters) as PostedFilter[], (value) =>
              t(`talent.jobs.filter.posted.${value}`),
            )}
          />
          <FilterMenu
            menu="compat"
            items={menu("compat", compatibilityFilters.map(String), (value) =>
              t("talent.jobs.filter.compatibility.value", { score: value }),
            )}
          />

          {active.length > 0 && (
            <ul className="flex flex-wrap items-center gap-2">
              {active.map((item) => (
                <li key={item.key}>
                  <Link
                    href={hrefWith({ [item.key]: undefined })}
                    aria-label={t("talent.jobs.filters.remove", { label: item.label })}
                    className={cx(chip, "bg-lime-clair text-sapin hover:bg-lime")}
                  >
                    {item.label}
                    <Icon name="fermer" className="size-3" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={resetHref}
                  className="ml-1 text-xs font-semibold text-feuille-fonce hover:underline"
                >
                  {t("talent.jobs.filters.reset")}
                </Link>
              </li>
            </ul>
          )}
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-3">
          {firstState?.state === "incomplete" && (
            <p className="rounded-[18px] bg-blanc px-4 py-3 text-sm text-ardoise">
              {t("match.score.unavailable")}
            </p>
          )}
          {firstState?.state === "optedOut" && (
            <p className="rounded-[18px] bg-blanc px-4 py-3 text-sm text-ardoise">
              {t("match.score.optedOut")}
            </p>
          )}
          {jobs.length === 0 ? (
            <EmptyState
              title={t("talent.jobs.search.empty.title")}
              description={t("talent.jobs.search.empty.body")}
              action={
                <Link href={resetHref} className={pillClass("dark", "md")}>
                  {t("talent.jobs.search.empty.cta")}
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {jobs.map((job) => (
                <li key={job.id}>
                  <TalentJobCard
                    job={job}
                    now={search.now}
                    match={matches.get(job.id)}
                    applied={applied.has(job.slug)}
                    saved={savedSlugs.has(job.slug)}
                    back={back}
                    selected={best?.job.id === job.id}
                  />
                </li>
              ))}
            </ul>
          )}
          {(page > 1 || page < pageCount) && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              {page > 1 && (
                <Link
                  href={hrefWith({ page: String(page - 1) })}
                  className={pillClass("outline", "md", "h-12 px-6")}
                >
                  <Icon name="chev-l" className="size-4" />
                  {t("talent.jobs.search.previous")}
                </Link>
              )}
              {page < pageCount && (
                <Link
                  href={hrefWith({ page: String(page + 1) })}
                  className={pillClass("outline", "md", "h-12 w-full px-6 lg:w-auto")}
                >
                  {t("talent.jobs.search.loadMore")}
                  <Icon name="chev-d" className="size-4" />
                </Link>
              )}
            </div>
          )}
          <p className="flex items-center justify-center gap-2 text-xs text-ardoise lg:hidden">
            <Icon name="check" className="size-3.5 text-feuille" />
            {t("talent.jobs.sidebar.free")}
          </p>
        </div>

        <aside className="flex flex-col gap-4">
          {best && (
            <AiPanel labelledBy="jobs-ai-title" className="hidden lg:flex">
              <AiBrand />
              <div className="flex items-center gap-4">
                <ScoreRing
                  value={best.explanation.score}
                  label={t("ui.percent", { value: Math.round(best.explanation.score) })}
                  size={84}
                  dark
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p
                    id="jobs-ai-title"
                    className="text-[11px] font-semibold tracking-[0.09em] text-neon uppercase"
                  >
                    {t("match.score.label")}
                  </p>
                  <p className="text-[15px] font-semibold">
                    {t("match.score.valueWithBand", {
                      score: Math.round(best.explanation.score),
                      band: t(`match.band.${best.explanation.band}.text`),
                    })}
                  </p>
                  <p className="text-xs text-blanc/70">
                    {t("talent.jobs.aiPanel.job", {
                      job: best.job.title,
                      company: best.job.organization.name,
                    })}
                  </p>
                </div>
              </div>
              <ul className="flex flex-col gap-2.5">
                {(["skills_required", "experience", "languages"] as const)
                  .flatMap((key) => best.explanation.criteria.filter((c) => c.key === key))
                  .map((criterion) => {
                    const value = Math.round(criterion.value * 100);
                    return (
                      <li key={criterion.key} className="flex flex-col gap-1.5 text-xs">
                        <span className="flex justify-between gap-2">
                          <span>{t(`match.criterion.${criterionText[criterion.key]}.text`)}</span>
                          <span className="font-semibold">{t("ui.percent", { value })}</span>
                        </span>
                        <span
                          aria-hidden
                          className="h-1.5 overflow-hidden rounded-full bg-blanc/15"
                        >
                          <span
                            className="block h-full rounded-full bg-lime"
                            style={{ width: `${value}%` }}
                          />
                        </span>
                      </li>
                    );
                  })}
              </ul>
              <p className="flex items-center gap-2 text-xs text-blanc/80">
                <Icon name="eye" className="size-4 shrink-0 text-neon" />
                <Link
                  href={`/app/jobs/${best.job.slug}#compatibilite`}
                  className="font-semibold whitespace-nowrap text-neon hover:underline"
                >
                  {t("common.why")}
                </Link>
                {t("talent.jobs.aiPanel.updated", {
                  time: relativeLabel(
                    new Date(best.explanation.computedAt),
                    search.now,
                  ).toLowerCase(),
                })}
              </p>
              <p className="text-xs text-blanc/75">{t("match.score.lowIsNotNo")}</p>
            </AiPanel>
          )}

          <div className="flex flex-col gap-3">
            <ApplicationStats
              headingId="jobs-applications"
              link
              counts={{
                sent: statuses.length,
                viewed: statuses.filter(
                  (status) => status !== "sent" && status !== "withdrawn" && status !== "jobClosed",
                ).length,
                interviews: statuses.filter((status) => status === "interview").length,
                offers: statuses.filter((status) => status === "offer" || status === "hired")
                  .length,
              }}
            />
            {statuses.some((status) => !isClosedStatus(status)) && (
              <Link href="/app/jobs/candidatures" className={pillClass("outline", "sm")}>
                {t("talent.jobs.applications.title")}
              </Link>
            )}
          </div>

          <Link
            href="/app/jobs/enregistrees"
            className="flex items-center justify-between gap-3 rounded-[24px] bg-blanc p-5 text-[15px] font-semibold hover:bg-lime-clair"
          >
            <span className="flex items-center gap-2.5">
              <Icon name="favori" className="size-[18px]" />
              {t("talent.jobs.saved.title")}
            </span>
            <span className="text-ardoise">{savedSlugs.size}</span>
          </Link>

          {companies.length > 0 && (
            <section
              aria-labelledby="jobs-companies"
              className="flex flex-col gap-3 rounded-[24px] bg-blanc p-5"
            >
              <h2 id="jobs-companies" className="text-[15px] font-semibold">
                {t("talent.jobs.sidebar.companies.text")}
              </h2>
              <ul className="flex flex-col gap-3">
                {companies.map((company) => (
                  <li key={company.id}>
                    <Link
                      href={`/entreprises/${company.slug}`}
                      className="flex items-center gap-3 rounded-xl hover:bg-creme"
                    >
                      <CompanyLogo
                        name={company.name}
                        size="sm"
                        className="size-9! rounded-[10px]! text-xs!"
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[13px] font-semibold">{company.name}</span>
                        <span className="text-[11px] text-ardoise">
                          {company.sector
                            ? t("talent.jobs.sidebar.companies.meta", {
                                count: company.openJobs,
                                sector: company.sector,
                              })
                            : t("talent.jobs.sidebar.companies.count", { count: company.openJobs })}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
