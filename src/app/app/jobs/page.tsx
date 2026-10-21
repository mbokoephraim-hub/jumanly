import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { OfferCard, type OfferMatch } from "@/components/talent/offer-card";
import { OfferFilters, OfferFiltersPanel } from "@/components/talent/offer-filters";
import { SearchBar } from "@/components/talent/header";
import { TalentIcon } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { offerFilterKeys } from "@/lib/offer-filters";
import { requireUser } from "@/server/auth/session";
import { isPhone } from "@/server/view";
import { db } from "@/server/db";
import { matchesForUser } from "@/server/matching/service";
import { listApplications } from "@/server/services/applications";
import {
  JOBS_PER_PAGE,
  countJobs,
  isJobOpen,
  jobCards,
  matchingJobIds,
  offerFilterChoices,
  parseJobFilters,
} from "@/server/services/jobs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("offers");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const tabs = ["pour-vous", "recentes", "enregistrees"] as const;
type Tab = (typeof tabs)[number];
const tabText = { "pour-vous": "forYou", recentes: "recent", enregistrees: "saved" } as const;

/**
 * Offres (planche talent-1 § 2): « Pour vous » ranks every open offer by compatibility, with its
 * « Pourquoi ? », and hides none; « Récentes » keeps the newest first; « Enregistrées » lists the
 * saved ones. The applications are in Suivi. Filters open in a sheet. A low score never hides an
 * offer and never blocks applying, which stays free and unlimited.
 */
export default async function OffersPage({ searchParams }: PageProps<"/app/jobs">) {
  const params = await searchParams;
  const user = await requireUser("/app/jobs");
  // On a phone Explorer is the tab kept mounted by the layout (Modèle B, lot B4): nothing here.
  if (await isPhone()) return null;
  const t = await getTranslations();
  const now = new Date();
  // « tous » and « recommandees » are older addresses of « Pour vous ».
  const tab: Tab = tabs.includes(params.vue as Tab) ? (params.vue as Tab) : "pour-vous";
  const filters = parseJobFilters(params);
  const shown = (filters.page ?? 1) * JOBS_PER_PAGE;

  const [applications, saved, choices] = await Promise.all([
    listApplications(db, user.id),
    db.savedJob.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { job: { select: { id: true, slug: true, status: true, closesAt: true } } },
    }),
    offerFilterChoices(db, now),
  ]);
  const applied = new Set(applications.map((application) => application.job.slug));
  const savedSlugs = new Set(saved.map((row) => row.job.slug));

  // The offers of the tab, in their order, then their scores.
  let order: string[];
  let matches: Map<string, OfferMatch>;
  let ranked = false;
  if (tab === "enregistrees") {
    // Open ones first, in the order they were saved.
    const open = saved.filter((row) => isJobOpen(row.job, now));
    const closed = saved.filter((row) => !isJobOpen(row.job, now));
    order = [...open, ...closed].map((row) => row.job.id);
    matches = await matchesForUser(db, user.id, order.slice(0, shown));
  } else {
    const ids = await matchingJobIds(db, filters, now);
    matches = await matchesForUser(db, user.id, ids);
    if (tab === "pour-vous") {
      const scored = ids.flatMap((id) => {
        const match = matches.get(id);
        return match?.state === "ok" ? [{ id, score: match.explanation.score }] : [];
      });
      ranked = scored.length > 0;
      // « Pour vous » never hides an offer: those without a score follow, newest first.
      const rest = ids.filter((id) => !scored.some((row) => row.id === id));
      order = [...scored.sort((a, b) => b.score - a.score).map((row) => row.id), ...rest];
    } else {
      order = ids;
    }
  }
  const [jobs, total] = await Promise.all([
    jobCards(db, order.slice(0, shown)),
    countJobs(db, filters, now),
  ]);
  const firstState = jobs.map((job) => matches.get(job.id)?.state).find(Boolean);
  const closedIds = new Set(
    saved.filter((row) => !isJobOpen(row.job, now)).map((row) => row.job.id),
  );

  // Links keep the search and the filters, and change one value.
  const current: Record<string, string> = Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) =>
      typeof value === "string" && value !== "" && key !== "page" && key !== "filtres"
        ? [[key, value]]
        : [],
    ),
  );
  const hrefWith = (changes: Record<string, string | undefined>) => {
    const query = new URLSearchParams(
      Object.entries({ ...current, ...changes }).flatMap(([key, value]) =>
        value ? [[key, value]] : [],
      ),
    ).toString();
    return query ? `/app/jobs?${query}` : "/app/jobs";
  };
  const back = hrefWith({ page: filters.page ? String(filters.page) : undefined });
  const active = Object.fromEntries(
    offerFilterKeys.flatMap((key) => (current[key] ? [[key, current[key]]] : [])),
  );
  // The filters search the open offers: « Enregistrées » goes back to « Pour vous ».
  const keep: Record<string, string> = {
    ...(current.q && { q: current.q }),
    ...(tab === "recentes" && { vue: "recentes" }),
  };
  const clearHref = hrefWith(Object.fromEntries(offerFilterKeys.map((key) => [key, undefined])));

  const line =
    filters.q && tab !== "enregistrees"
      ? t("offers.line.search", { count: total, query: filters.q })
      : firstState === "optedOut"
        ? t("offers.line.optedOut")
        : tab === "recentes"
          ? t("offers.line.recent")
          : tab === "pour-vous" && ranked
            ? t("offers.line.forYou")
            : null;
  const show = (count: number) => t("offers.filters.show", { count });
  const filterLabels = {
    title: t("offers.filters.title"),
    close: t("offers.filters.close"),
    domain: t("offers.filters.domain"),
    place: t("offers.filters.place"),
    remote: t("offers.filters.remote"),
    contract: t("offers.filters.contract"),
    experience: t("offers.filters.experience"),
    verified: t("offers.filters.verified"),
    clear: t("offers.filters.clear"),
    show: { zero: show(0), one: show(1), other: show(2).replace("2", "#") },
    contracts: {
      cdi: t("offers.filters.contracts.cdi"),
      cdd: t("offers.filters.contracts.cdd"),
      internship: t("offers.filters.contracts.internship"),
      mission: t("offers.filters.contracts.mission"),
    },
    levels: {
      none: t("offers.filters.levels.none"),
      junior: t("offers.filters.levels.junior"),
      mid: t("offers.filters.levels.mid"),
    },
  };
  // The filters on, as chips that remove them (tablet, planche web talent-1 § 2).
  const chipLabel = (key: string, value: string) =>
    key === "teletravail"
      ? filterLabels.remote
      : key === "verifiees"
        ? filterLabels.verified
        : key === "contrat" && value in filterLabels.contracts
          ? filterLabels.contracts[value as keyof typeof filterLabels.contracts]
          : key === "experience" && value in filterLabels.levels
            ? filterLabels.levels[value as keyof typeof filterLabels.levels]
            : value;
  const chips = Object.entries(active).map(([key, value]) => ({
    key,
    label: chipLabel(key, value),
    href: hrefWith({ [key]: undefined, page: undefined }),
  }));
  const count = tab === "enregistrees" ? saved.length : total;
  const searchParamsText = new URLSearchParams(
    Object.entries(current).filter(([key]) => key !== "page"),
  ).toString();

  return (
    <div className="t-ofw t-large flex flex-col gap-3.5">
      <h1 className="sr-only">{t("offers.title")}</h1>
      <div className="t-ofw-g">
        <aside className="t-ofw-f">
          <OfferFiltersPanel
            key={JSON.stringify(active)}
            initial={active}
            keep={keep}
            choices={choices}
            total={total}
            clearHref={clearHref}
            labels={{
              ...filterLabels,
              panel: t("offers.web.panel"),
              heading: t("offers.web.filters"),
            }}
          />
        </aside>
        <div className="t-ofw-l">
          <div className="t-ofw-rech">
            <SearchBar
              action="/app/jobs"
              filters="/app/jobs"
              pathname="/app/jobs"
              query={filters.q ?? ""}
              params={searchParamsText}
              labels={{
                label: t("talentShell.search.label"),
                placeholder: t("talentShell.search.placeholder"),
                placeholderOffers: t("talentShell.search.placeholderOffers"),
                placeholderLearn: t("talentShell.search.placeholderLearn"),
                filters: t("talentShell.search.filters"),
              }}
            />
          </div>
          <div className="t-ofw-bar">
            <nav aria-label={t("offers.tabs")} className="t-seg">
              {tabs.map((key) => (
                <Link
                  key={key}
                  href={hrefWith({ vue: key === "pour-vous" ? undefined : key, page: undefined })}
                  aria-current={tab === key ? "page" : undefined}
                  className="t-press"
                >
                  {t(`offers.tab.${tabText[key]}`)}
                </Link>
              ))}
            </nav>
            {chips.length > 0 && (
              <ul className="t-puces t-ofw-chips">
                {chips.map((chip) => (
                  <li key={chip.key}>
                    <Link
                      href={chip.href}
                      scroll={false}
                      aria-label={t("offers.web.remove", { label: chip.label })}
                      className="t-puce t-on t-press"
                    >
                      <TalentIcon name="valider" size="xs" />
                      {chip.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="t-ofw-res">
              {line && <p className="t-res-l">{line}</p>}
              {tab === "pour-vous" && !ranked && firstState !== "optedOut" && jobs.length > 0 && (
                <p className="t-res-l">
                  {t("offers.line.general")}{" "}
                  <Link href="/app/profil#competences">{t("offers.line.generalCta")}</Link>
                </p>
              )}
              <b className="t-ofw-n">{t("offers.web.count", { count })}</b>
            </div>
          </div>

          {jobs.length === 0 ? (
            tab === "enregistrees" ? (
              <div className="t-verre t-vide">
                <p>{t("offers.saved.empty")}</p>
                <Link href="/app/jobs" className="t-bt t-sec t-m t-press">
                  {t("offers.saved.cta")}
                </Link>
              </div>
            ) : (
              <div className="t-verre t-vide">
                <b>{t("offers.empty.title")}</b>
                <p>{t("offers.empty.text")}</p>
                {Object.keys(active).length > 0 && (
                  <Link href={clearHref} className="t-bt t-sec t-m t-press">
                    {t("offers.empty.cta")}
                  </Link>
                )}
              </div>
            )
          ) : (
            <ul className="t-ofw-list">
              {jobs.map((job) => (
                <li key={job.id} className={cx(closedIds.has(job.id) && "opacity-70")}>
                  <OfferCard
                    job={job}
                    match={matches.get(job.id)}
                    saved={savedSlugs.has(job.slug)}
                    applied={applied.has(job.slug)}
                    back={back}
                    now={now}
                  />
                </li>
              ))}
            </ul>
          )}
          {order.length > shown && (
            <Link
              href={hrefWith({ page: String((filters.page ?? 1) + 1) })}
              scroll={false}
              className="t-bt t-sec t-m t-press self-center"
            >
              {t("offers.more")}
            </Link>
          )}
          <p className="t-res-l text-center">{t("offers.free")}</p>
        </div>
      </div>

      <OfferFilters
        key={JSON.stringify(active)}
        initial={active}
        keep={keep}
        choices={choices}
        total={total}
        open={params.filtres === "1"}
        labels={filterLabels}
      />
    </div>
  );
}
