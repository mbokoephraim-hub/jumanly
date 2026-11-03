import "server-only";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import type { HireContext } from "@/server/services/hire";
import { CV_ANALYSIS_RIGHT } from "@/server/services/cv-analysis";
import {
  candidateAvailabilities,
  candidateSearchSchema,
  offerCandidates,
  searchCount,
} from "@/server/services/hire-offer-candidates";
import { OrbiDisc, PhoneIcon } from "../icon";
import { RhCandidateOrder, type RhOrderRow } from "./candidats-ordre";
import { initialsOf, tintOf } from "./candidatures";
import { RhFiltersSheet } from "./tri-client";

export type RhOfferTab = "apercu" | "candidats" | "retenus";

type Query = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * The three parts of an offer on the phone (Ephraïm, 03/11/2026): « Vue d'ensemble » on the left,
 * « Candidats » in the middle (where « Voir plus » of the offer lands) and « Retenus ».
 */
export async function RhOfferTabs({
  jobId,
  current,
  applications,
  shortlisted,
}: {
  jobId: string;
  current: RhOfferTab;
  applications: number;
  shortlisted: number;
}) {
  const t = await getTranslations("phoneRhCandidats");
  const tabs = [
    { key: "apercu", href: `/app/hire/offres/${jobId}?vue=apercu`, count: null },
    { key: "candidats", href: `/app/hire/offres/${jobId}`, count: applications },
    { key: "retenus", href: `/app/hire/offres/${jobId}?vue=retenus`, count: shortlisted },
  ] as const;
  return (
    <nav className="nb-rh-co-onglets" aria-label={t("tabs")}>
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === current ? "page" : undefined}
          scroll={false}
        >
          {t(`tab.${tab.key}`)}
          {tab.count ? <b>{tab.count}</b> : null}
        </Link>
      ))}
    </nav>
  );
}

/**
 * « Candidats » (and « Retenus ») of an offer on the recruiter's phone (Ephraïm, 03/11/2026): the
 * search and its filters, the ATS diagnosis with Orbi (closed without a plan that opens
 * `hire.cv_analysis`), then every person who applied, in the order they applied or the order the
 * team chose by moving the cards. Orbi's analysis never reorders this list.
 */
export async function RhOfferCandidatesList({
  ctx,
  jobId,
  query,
  tab,
  sortable,
}: {
  ctx: HireContext;
  jobId: string;
  query: Query;
  tab: "candidats" | "retenus";
  sortable: boolean;
}) {
  const t = await getTranslations("phoneRhCandidats");
  const format = await getFormatter();
  const now = new Date();
  const search = candidateSearchSchema.parse({
    q: one(query.q),
    skill: one(query.skill),
    dispo: one(query.dispo),
    ville: one(query.ville),
  });
  const [data, atsOpen] = await Promise.all([
    offerCandidates(db, ctx, jobId, search, { shortlistedOnly: tab === "retenus" }),
    can(db, { type: "organization", id: ctx.organizationId }, CV_ANALYSIS_RIGHT),
  ]);
  const { job, candidates } = data;
  const applied = data.search;
  const filtered = Boolean(applied.q) || searchCount(applied) > 0;
  const here =
    tab === "retenus" ? `/app/hire/offres/${jobId}?vue=retenus` : `/app/hire/offres/${jobId}`;
  const hidden = (keep: Record<string, string | undefined>) =>
    Object.entries(keep).map(([name, value]) =>
      value ? <input key={name} type="hidden" name={name} value={value} /> : null,
    );
  const rows: RhOrderRow[] = candidates.map((person) => {
    const name = person.name ?? t("list.blind", { number: person.number });
    return {
      id: person.id,
      name,
      initials: person.name ? initialsOf(person.name) : "",
      image: person.image,
      tone: Number(tintOf(person.id)),
      headline: person.headline?.trim() || t("list.noHeadline"),
      line: [person.city, format.relativeTime(person.createdAt, now)]
        .filter(Boolean)
        .join(" · "),
      href: `/app/hire/offres/${jobId}?vue=candidats&fiche=${person.id}`,
      unseen: person.unseen,
      shortlisted: person.shortlisted,
    };
  });

  return (
    <div className="nb-page nb-rh-detail nb-rh-co">
      <header className="nb-rh-barre">
        <Link href="/app/hire/offres" className="nb-rh-retour">
          <PhoneIcon name="retour" size={20} />
          {t("back")}
        </Link>
      </header>
      <section className="nb-rh-detail-h">
        <h1>{job.title}</h1>
        <p className="nb-meta">{t("line", { count: data.total, shortlisted: data.shortlisted })}</p>
      </section>
      <RhOfferTabs
        jobId={jobId}
        current={tab}
        applications={data.total}
        shortlisted={data.shortlisted}
      />

      <div className="nb-rh-co-recherche">
        <form method="get" action={`/app/hire/offres/${jobId}`} role="search">
          {hidden({
            vue: tab === "retenus" ? "retenus" : undefined,
            skill: applied.skill,
            dispo: applied.dispo,
            ville: applied.ville,
          })}
          <PhoneIcon name="recherche" size={18} />
          <input
            id={`rh-co-q-${tab}`}
            name="q"
            type="search"
            defaultValue={applied.q}
            aria-label={t("search")}
            placeholder={t("search")}
            enterKeyHint="search"
          />
        </form>
        <RhFiltersSheet
          label={t("filters.title")}
          countLabel={t("filters.count", { count: searchCount(applied) })}
          count={searchCount(applied)}
          closeLabel={t("filters.close")}
          version={JSON.stringify(applied)}
        >
          <form method="get" action={`/app/hire/offres/${jobId}`} className="nb-rh-pf-f">
            {hidden({ vue: tab === "retenus" ? "retenus" : undefined, q: applied.q })}
            <div className="nb-ex-f-tete">
              <h2>{t("filters.title")}</h2>
              <Link
                href={
                  applied.q
                    ? `${here}${here.includes("?") ? "&" : "?"}q=${encodeURIComponent(applied.q)}`
                    : here
                }
              >
                {t("filters.reset")}
              </Link>
            </div>
            <div className="nb-ex-f-corps">
              {data.filtersLevel === "all" ? (
                <>
                  <label className="nb-rh-pf-champ">
                    <span className="nb-ex-f-gl">{t("filters.skill")}</span>
                    <input
                      name="skill"
                      maxLength={60}
                      defaultValue={applied.skill}
                      placeholder={t("filters.skillPlaceholder")}
                    />
                  </label>
                  <fieldset className="nb-rh-pf-grp">
                    <legend className="nb-ex-f-gl">{t("filters.dispo")}</legend>
                    <div className="nb-ex-f-opts">
                      {[
                        { value: "", label: t("filters.any") },
                        ...candidateAvailabilities.map((value) => ({
                          value,
                          label: t(`filters.dispoValue.${value}`),
                        })),
                      ].map((option) => (
                        <label key={option.value || "any"} className="nb-ex-f-opt nb-rh-pf-opt">
                          <input
                            type="radio"
                            name="dispo"
                            value={option.value}
                            defaultChecked={(applied.dispo ?? "") === option.value}
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className="nb-rh-pf-champ">
                    <span className="nb-ex-f-gl">{t("filters.city")}</span>
                    <input name="ville" maxLength={60} defaultValue={applied.ville} />
                  </label>
                </>
              ) : (
                <p className="nb-meta nb-rh-filtres-lock">
                  <span>{t("filters.locked")}</span>
                  <Link href="/app/hire/abonnement">{t("filters.lockedLink")}</Link>
                </p>
              )}
            </div>
            <div className="nb-ex-f-bas">
              <button type="submit" className="nb-ex-f-voir">
                {t("filters.apply")}
              </button>
            </div>
          </form>
        </RhFiltersSheet>
      </div>

      {tab === "candidats" ? (
        <section className="nb-rh-co-ats" aria-labelledby={`rh-co-ats-${jobId}`}>
          <div className="nb-rh-co-affiche" aria-hidden>
            <span className="nb-rh-co-affiche-i">
              <PhoneIcon name="cv" size={22} strong />
            </span>
            <OrbiDisc size={64} />
            <span className="nb-rh-co-affiche-i">
              <PhoneIcon name="entonnoir" size={22} strong />
            </span>
          </div>
          <div className="nb-rh-co-ats-corps">
            <span className="nb-rh-co-ats-i" data-ouvert={atsOpen ? "" : undefined} aria-hidden>
              <PhoneIcon name={atsOpen ? "coche" : "cadenas"} size={22} strong />
            </span>
            <div>
              <h2 id={`rh-co-ats-${jobId}`}>{t("ats.title")}</h2>
              <p>{atsOpen ? (data.total > 0 ? t("ats.text") : t("ats.none")) : t("ats.locked")}</p>
            </div>
          </div>
          {atsOpen ? (
            data.total > 0 ? (
              <Link href={`/app/hire/offres/${jobId}/ats`} className="nb-rh-co-ats-go">
                {t("ats.start")}
              </Link>
            ) : null
          ) : (
            <Link href="/app/hire/abonnement" className="nb-rh-co-ats-go" data-verrou="">
              {t("ats.upgrade")}
            </Link>
          )}
        </section>
      ) : null}

      <section className="nb-rh-co-tous" aria-labelledby={`rh-co-tous-${tab}`}>
        <h2 id={`rh-co-tous-${tab}`} className="nb-rh-co-h">
          {tab === "retenus" ? t("list.titleRetenus") : t("list.title")}
          <small>{candidates.length}</small>
        </h2>
        {rows.length === 0 ? (
          <p className="nb-vide">
            {filtered
              ? t("list.emptySearch")
              : tab === "retenus"
                ? t("list.emptyRetenus")
                : t("list.empty")}
          </p>
        ) : (
          <RhCandidateOrder
            job={jobId}
            rows={rows}
            sortable={sortable && !filtered && tab === "candidats" && rows.length > 1}
            texts={{
              more: t("list.more"),
              moreLabel: t("list.moreLabel"),
              move: t("list.move"),
              moveDone: t("list.moveDone"),
              up: t("list.up"),
              down: t("list.down"),
              hint: t("list.hint"),
              failed: t("list.failed"),
              unseen: t("list.unseen"),
              shortlisted: t("list.shortlisted"),
            }}
          />
        )}
      </section>
    </div>
  );
}
