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
  WAITING_DAYS,
} from "@/server/services/hire-offer-candidates";
import { publicJobUrl } from "@/components/recruiter/offers";
import { hirePermissions } from "@/server/services/hire";
import { OrbiDisc, PhoneIcon } from "../icon";
import { RhCandidateOrder, type RhOrderRow } from "./candidats-ordre";
import { RhOfferActions, type RhOfferActionsData } from "./offre-actions";
import { initialsOf, tintOf } from "./candidatures";
import { RhFiltersSheet } from "./tri-client";
import { RhOfferHead } from "./offres";
import { deskTabHref } from "./desk-tabs";
import { DESK_RUBRIQUES, type DeskCounts, type DeskRubrique } from "@/server/services/hire-desk";
import { atsBoard } from "@/server/services/hire-ats";
import { orbiClasses, type OrbiClass } from "@/server/services/hire-classes";

export type RhOfferTab = "apercu" | DeskRubrique;

type Query = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * The parts of an offer on the phone (Ephraïm, 03/11/2026, « Candidatures recruteur », step 2):
 * Vue · À trier · À compléter · Entretiens · Décision. Each candidate is where the recruiter has
 * something to do with them; « Retenus » is now À compléter and Entretiens.
 */
export async function RhOfferTabs({
  jobId,
  current,
  counts,
}: {
  jobId: string;
  current: RhOfferTab;
  counts: DeskCounts;
}) {
  const t = await getTranslations("phoneRhCandidats");
  const tabs = ["apercu", ...DESK_RUBRIQUES] as const;
  return (
    <nav className="nb-rh-co-onglets nb-rh-co-onglets-defil" aria-label={t("tabs")}>
      {tabs.map((key) => (
        <Link
          key={key}
          href={deskTabHref(jobId, key)}
          aria-current={key === current ? "page" : undefined}
          scroll={false}
          replace
        >
          {t(`tab.${key}`)}
          {key !== "apercu" && counts[key] > 0 ? <small>{counts[key]}</small> : null}
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
  tab: DeskRubrique;
  sortable: boolean;
}) {
  const t = await getTranslations("phoneRhCandidats");
  const to = await getTranslations("phoneRhOffres");
  const format = await getFormatter();
  const now = new Date();
  const search = candidateSearchSchema.parse({
    q: one(query.q),
    skill: one(query.skill),
    dispo: one(query.dispo),
    ville: one(query.ville),
  });
  const [data, atsOpen, org, board] = await Promise.all([
    offerCandidates(db, ctx, jobId, search, { rubrique: tab }),
    can(db, { type: "organization", id: ctx.organizationId }, CV_ANALYSIS_RIGHT),
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { name: true, logo: true, verifiedAt: true },
    }),
    // Orbi's classes sit at the top of « À trier » (Ephraïm, 03/11/2026), from the same analysis
    // as the diagnostic: no class without a reading of the CVs, none when matching is off.
    tab === "trier" ? atsBoard(db, ctx, jobId) : null,
  ]);
  const classOfRow = new Map(
    (board?.rows ?? [])
      .filter((row) => row.orbiClass !== null)
      .map((row) => [row.id, { classe: row.orbiClass as OrbiClass, score: row.score }]),
  );
  const { job, candidates } = data;
  const applied = data.search;
  const filtered = Boolean(applied.q) || searchCount(applied) > 0;
  const here = deskTabHref(jobId, tab);
  const hidden = (keep: Record<string, string | undefined>) =>
    Object.entries(keep).map(([name, value]) =>
      value ? <input key={name} type="hidden" name={name} value={value} /> : null,
    );
  // The « ··· » of the page (Ephraïm, 03/11/2026): modify, pause, postpone, delete, nothing else.
  const actions: RhOfferActionsData = {
    id: job.id,
    title: job.title,
    status: (["published", "pending_review", "draft", "paused", "closed"] as const).includes(
      job.status as "published",
    )
      ? (job.status as RhOfferActionsData["status"])
      : "other",
    url: job.publishedAt ? publicJobUrl(job.slug) : null,
    org: org.name,
    applications: data.total,
    report: null,
    manage: hirePermissions(ctx.role).manage,
    start: null,
    closesAt: job.closesAt ? job.closesAt.toISOString().slice(0, 10) : null,
    minDate: new Date(now.getTime() + 86_400_000).toISOString().slice(0, 10),
    back: deskTabHref(jobId, tab),
  };
  const rows: RhOrderRow[] = candidates.map((person) => {
    const name = person.name ?? t("list.blind", { number: person.number });
    return {
      id: person.id,
      name,
      initials: person.name ? initialsOf(person.name) : "",
      image: person.image,
      tone: Number(tintOf(person.id)),
      headline: person.headline?.trim() || t("list.noHeadline"),
      line:
        tab === "completer" && person.pieces
          ? t("desk.pieces", {
              received: person.pieces.received,
              required: person.pieces.required,
              date: person.pieces.dueAt,
            })
          : tab === "decision"
            ? t(`desk.outcome.${person.status}`)
            : person.orbiSuggests
              ? t("desk.orbiSuggests")
              : [person.city, format.relativeTime(person.createdAt, now)]
                  .filter(Boolean)
                  .join(" · "),
      href: `/app/hire/offres/${jobId}?vue=candidats&de=${tab}&fiche=${person.id}`,
      unseen: person.unseen,
      shortlisted: person.shortlisted,
      badge: person.review
        ? person.review.due
          ? { text: t("desk.review.due"), tone: "due" }
          : { text: t("desk.review.on", { date: person.review.remindAt }), tone: "revoir" }
        : person.placedByYou && tab === "trier"
          ? { text: t("desk.placedByYou"), tone: "vous" }
          : null,
      orbi: (() => {
        const found = classOfRow.get(person.id);
        if (!found) return null;
        const label = to(`classes.${found.classe}`);
        return {
          classe: found.classe,
          text: found.score !== null ? `${found.score} %` : label,
          label:
            found.score !== null
              ? `${label} · ${to("classes.score", { value: found.score })}`
              : label,
          why: `/app/hire/offres/${jobId}?vue=candidats&de=${tab}&fiche=${person.id}&partie=score`,
          whyLabel: t("orbi.why"),
        };
      })(),
    };
  });
  // The classes of « À trier »: the cards set aside to review first (the recruiter put them
  // there), then Fort potentiel, À considérer, Limité, Hors critères, then the ones not read yet.
  // « Votre ordre » (`ordre=vous`) gives back the list as the team placed it, cards that move.
  const counts = orbiClasses.map((key) => ({
    key,
    count: candidates.filter((person) => classOfRow.get(person.id)?.classe === key).length,
  }));
  // Only the cards of « À trier » are counted (the retained ones have left it).
  const classed = tab === "trier" ? counts.reduce((sum, item) => sum + item.count, 0) : 0;
  const chosen = orbiClasses.find((key) => key === one(query.classe));
  const yourOrder = one(query.ordre) === "vous";
  const grouped = classed > 0 && !yourOrder;
  const trier = deskTabHref(jobId, "trier");
  type Group = { key: OrbiClass | "revoir" | "none"; rows: RhOrderRow[] };
  const groups: Group[] = grouped
    ? (
        [
          {
            key: "revoir",
            rows: rows.filter((_, index) => candidates[index]!.review !== null && !chosen),
          },
          ...orbiClasses.map((key) => ({
            key,
            rows: rows.filter(
              (row, index) =>
                (chosen ? key === chosen : candidates[index]!.review === null) &&
                row.orbi?.classe === key,
            ),
          })),
          {
            key: "none",
            rows: chosen
              ? []
              : rows.filter((row, index) => candidates[index]!.review === null && !row.orbi),
          },
        ] satisfies Group[]
      ).filter((group) => group.rows.length > 0)
    : [];

  const texts = {
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
  };

  return (
    <div className="nb-page nb-rh-detail nb-rh-co">
      <header className="nb-rh-barre">
        <Link href="/app/hire/offres" className="nb-rh-retour">
          <PhoneIcon name="retour" size={20} />
          {t("back")}
        </Link>
        <RhOfferActions data={actions} items={["edit", "pause", "postpone", "delete"]} />
      </header>
      <RhOfferHead job={job} organization={org} now={now} />
      <RhOfferTabs jobId={jobId} current={tab} counts={data.counts} />
      {tab === "trier" && data.waiting > 0 ? (
        <p className="nb-rh-co-attente" role="status">
          <i className="nb-rh-pouls" aria-hidden />
          {t("desk.waiting", { count: data.waiting, days: WAITING_DAYS })}
        </p>
      ) : null}

      <div className="nb-rh-co-recherche">
        <form method="get" action={`/app/hire/offres/${jobId}`} role="search">
          {hidden({
            vue: tab,
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
            {hidden({ vue: tab, q: applied.q })}
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

      {classed > 0 ? (
        <section className="nb-rh-classes nb-rh-co-classes" aria-labelledby={`rh-co-cl-${jobId}`}>
          <h2 id={`rh-co-cl-${jobId}`}>
            <Link href={`/app/hire/offres/${jobId}/ats`}>
              <OrbiDisc size={34} />
              <span>
                {t("orbi.title")}
                <small>{t("orbi.line", { count: classed })}</small>
              </span>
              <PhoneIcon name="chevron" size={18} />
            </Link>
          </h2>
          <div className="nb-rh-classes-barre" aria-hidden>
            {counts
              .filter((item) => item.count > 0)
              .map((item) => (
                <i key={item.key} data-classe={item.key} style={{ flexGrow: item.count }} />
              ))}
          </div>
          <ul className="nb-rh-classes-liste">
            {counts.map((item) => (
              <li key={item.key}>
                <Link
                  href={chosen === item.key ? trier : `${trier}&classe=${item.key}`}
                  data-classe={item.key}
                  aria-current={chosen === item.key ? "true" : undefined}
                  aria-disabled={item.count === 0 ? "true" : undefined}
                  scroll={false}
                  replace
                >
                  <b>{item.count}</b>
                  {to(`classes.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
          <details className="nb-rh-co-regle">
            <summary>{t("orbi.how")}</summary>
            <p>{t("orbi.rule")}</p>
          </details>
        </section>
      ) : null}
      {tab === "trier" && classed === 0 ? (
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
        <div className="nb-rh-co-liste-h">
          <h2 id={`rh-co-tous-${tab}`} className="nb-rh-co-h">
            {chosen ? to(`classes.${chosen}`) : t(`desk.title.${tab}`)}
            <small>
              {chosen ? counts.find((item) => item.key === chosen)?.count : candidates.length}
            </small>
          </h2>
          {classed > 0 ? (
            // How the list is laid out (Ephraïm, 03/11/2026): by Orbi's classes, or the team's order.
            <nav className="nb-rh-co-tri" aria-label={t("orbi.order")}>
              <Link href={trier} aria-current={grouped ? "page" : undefined} scroll={false} replace>
                <OrbiDisc size={18} />
                {t("orbi.byOrbi")}
              </Link>
              <Link
                href={`${trier}&ordre=vous`}
                aria-current={grouped ? undefined : "page"}
                scroll={false}
                replace
              >
                {t("orbi.yours")}
              </Link>
            </nav>
          ) : null}
        </div>
        {rows.length === 0 ? (
          <p className="nb-vide">
            {filtered
              ? t("list.emptySearch")
              : data.total === 0 && tab === "trier"
                ? t("list.empty")
                : t(`desk.empty.${tab}`)}
          </p>
        ) : grouped ? (
          groups.map((group) => (
            <div
              key={group.key}
              className="nb-rh-co-groupe"
              data-classe={group.key === "revoir" || group.key === "none" ? undefined : group.key}
              data-groupe={group.key}
            >
              <h3>
                <i aria-hidden />
                {group.key === "revoir"
                  ? t("orbi.group.revoir")
                  : group.key === "none"
                    ? to("classes.none")
                    : to(`classes.${group.key}`)}
                <small>{group.rows.length}</small>
              </h3>
              {group.key === "hors" ? <p className="nb-meta">{to("classes.horsLead")}</p> : null}
              <RhCandidateOrder
                job={jobId}
                // « Classé par vous » speaks of the team's order, shown under « Voir dans votre ordre ».
                rows={group.rows.map((row) =>
                  row.badge?.tone === "vous" ? { ...row, badge: null } : row,
                )}
                sortable={false}
                texts={texts}
              />
            </div>
          ))
        ) : (
          <RhCandidateOrder
            job={jobId}
            rows={rows}
            sortable={sortable && !filtered && tab === "trier" && rows.length > 1}
            texts={texts}
          />
        )}
      </section>
    </div>
  );
}
