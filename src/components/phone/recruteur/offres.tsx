import "server-only";
import { isHireScope } from "@/lib/product-scope";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import { pickMessages } from "@/i18n/client-messages";
import { CopyRow } from "@/components/recruiter/copy-row";
import { publicJobUrl } from "@/components/recruiter/offers";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import type { HireContext } from "@/server/services/hire";
import { getOrgJob, hirePermissions, isOrgVerified } from "@/server/services/hire";
import { cefrLevels, educationLevels, offerLanguages } from "@/server/services/job-wizard";
import { parseLanguages } from "@/server/services/jobs";
import { atsBoard } from "@/server/services/hire-ats";
import { requestedDocumentKinds, type OfferRow } from "@/server/services/hire-offers";
import { screeningQuestionsOf } from "@/server/services/screening";
import { MenuArt } from "@/components/site/menu-art";
import { saveFiltersAction, sortGestureAction } from "@/server/actions/hire-tri";
import { RhFiltersSheet, SwipeCard } from "./tri-client";
import { RhUndoGesture } from "./tri";
import { countryCode, countryName, flagOf } from "@/lib/countries";
import { formatUsd } from "@/lib/money";
import {
  classCounts,
  orbiClasses,
  rankByClass,
  type OrbiClass,
} from "@/server/services/hire-classes";
import {
  activeFilters,
  allowedFilters,
  blindName,
  filterAvailabilities,
  filterConfidences,
  filterContracts,
  filterEducations,
  filterSources,
  filterStates,
  parseFilters,
  passes,
} from "@/server/services/hire-filters";
import { OrbiDisc, PhoneIcon } from "../icon";
import {
  offerPoints,
  type OfferFigures,
  type OfferPoint,
} from "@/server/services/hire-offer-review";
import { familyShares, PROFILE_PALETTE } from "@/lib/profile-colors";
import { FilAvatar } from "../fil/avatar";
import { Verified } from "../explorer/cards";
import { tintOf } from "./candidatures";
import { RhOfferActions, type RhOfferActionsData } from "./offre-actions";
import type { RhOfferDraft, RhPublishData } from "./publier";

const DAY = 86_400_000;
/** Signed-in views needed before « Qui regarde l'offre » shows families (no one singled out). */
const VIEWERS_MIN = 5;

/** The texts the Offres screens need in the browser (sheets of « ··· », the four steps). */
export async function RhOffresTexts({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      messages={pickMessages(messages, ["phoneRhOffres", "phone", "phoneFil"])}
    >
      {children}
    </NextIntlClientProvider>
  );
}

/** « Toutes · En cours · Terminées » (planche Recruteur-offres). */
export const RH_OFFER_FILTERS = ["toutes", "encours", "terminees"] as const;
export type RhOfferFilter = (typeof RH_OFFER_FILTERS)[number];

const inFilter = (offer: OfferRow, filter: RhOfferFilter) =>
  filter === "toutes" ||
  (filter === "encours"
    ? offer.tab === "actives"
    : offer.tab === "cloturees" || offer.tab === "expirees");

type StatusKey =
  | "published"
  | "pending_review"
  | "draft"
  | "rejected"
  | "changes_requested"
  | "paused"
  | "closed"
  | "archived"
  | "expired"
  | "scheduled";

const statusKey = (
  job: { status: OfferRow["status"]; closesAt: Date | null; opensAt?: Date | null },
  now: Date,
) =>
  (job.status === "published" && job.closesAt && job.closesAt <= now
    ? "expired"
    : // « Programmer la campagne » (05/11/2026): a draft that opens by itself.
      job.opensAt && (job.status === "draft" || job.status === "changes_requested")
      ? "scheduled"
      : job.status) as StatusKey;

const daysSince = (date: Date | null, now: Date) =>
  date ? Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY)) : 0;

/** « 4 offres en cours · 99 candidatures · 17 nouvelles », under the title of the tab. */
export async function rhOffersLine(offers: OfferRow[]) {
  const t = await getTranslations("phoneRhOffres");
  return t("list.line", {
    live: offers.filter((offer) => offer.tab === "actives").length,
    applications: offers.reduce((sum, offer) => sum + offer.figures.applications, 0),
    unseen: offers.reduce((sum, offer) => sum + offer.figures.unseen, 0),
  });
}

/** The company shown on each card: its logo (or initials), its name, its check when verified. */
export type RhOffersOrg = { name: string; logo: string | null; verified: boolean };

/** What each card adds to the list: a short description and the first faces of its candidates. */
export type RhOfferExtra = {
  summary: string;
  /** The last three people who applied; no photo nor initials when the offer is sorted blind. */
  faces: { id: string; name: string | null; image: string | null }[];
};

/**
 * The description and the last three applicants of each offer, for the cards of the Offres tab.
 * Only the organization's offers (`organizationId`, on top of the ids already scoped by
 * `listOffers`), and only people who applied (règle d'or 5).
 */
export async function rhOfferExtras(
  ctx: HireContext,
  offers: OfferRow[],
): Promise<Map<string, RhOfferExtra>> {
  if (offers.length === 0) return new Map();
  const jobs = await db.job.findMany({
    where: { id: { in: offers.map((offer) => offer.id) }, organizationId: ctx.organizationId },
    select: {
      id: true,
      description: true,
      blindSort: true,
      applications: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          profile: { select: { user: { select: { name: true, image: true } } } },
        },
      },
    },
  });
  return new Map(
    jobs.map((job) => [
      job.id,
      {
        summary: shortText(job.description, 200),
        faces: job.applications.map((application) => ({
          id: application.id,
          name: job.blindSort ? null : application.profile.user.name,
          image: job.blindSort ? null : application.profile.user.image,
        })),
      },
    ]),
  );
}

/** The first words of a description, on one line, cut at a word. */
function shortText(text: string, max: number) {
  const flat = text
    .replace(/[#*_>`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).trimEnd()}…`;
}

const initialsOfName = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** The section of the list an offer falls in: live, ended, or still a draft or paused. */
const sectionOf = (offer: OfferRow) =>
  offer.tab === "actives"
    ? "encours"
    : offer.tab === "cloturees" || offer.tab === "expirees"
      ? "terminees"
      : "autres";

/**
 * The Offres tab of the recruiter's phone (Ephraïm, 03/11/2026): « Toutes · En cours · Terminées »,
 * then the offers grouped « En cours », « Terminées » (and the drafts and pauses), one card each
 * with its state in the notch, the company, the title, views · applications · days left, a short
 * description, the faces of the last candidates and « Voir plus ». Every offer is the
 * organization's (`jobScope`).
 */
export async function RhOffersList({
  offers,
  extras,
  org,
  filter,
  now,
}: {
  offers: OfferRow[];
  extras: Map<string, RhOfferExtra>;
  org: RhOffersOrg;
  filter: RhOfferFilter;
  now: Date;
}) {
  const t = await getTranslations("phoneRhOffres");
  const format = await getFormatter();
  const shown = offers.filter((offer) => inFilter(offer, filter));
  const sections = (["encours", "terminees", "autres"] as const)
    .map((key) => ({ key, items: shown.filter((offer) => sectionOf(offer) === key) }))
    .filter((section) => section.items.length > 0);
  const titled = filter === "toutes" && sections.length > 1;

  const card = (offer: OfferRow) => {
    const status = statusKey(offer, now);
    const ended = status === "closed" || status === "expired";
    const extra = extras.get(offer.id);
    const total = offer.figures.applications;
    const faces = extra?.faces ?? [];
    const more = Math.max(0, total - faces.length);
    const left =
      offer.closesAt && !ended
        ? Math.max(0, Math.ceil((offer.closesAt.getTime() - now.getTime()) / DAY))
        : null;
    const endedOn = ended ? (offer.closesAt ?? offer.updatedAt) : null;
    const href = `/app/hire/offres/${offer.id}`;
    return (
      <li key={offer.id}>
        <article className="nb-rh-oc" data-fin={ended ? "" : undefined}>
          <div className="nb-rh-oc-corps">
            <span className="nb-rh-oc-org">
              <FilAvatar
                initials={initialsOfName(org.name)}
                image={org.logo}
                tone={0}
                org
                square
                size={44}
              />
              <span>{org.name}</span>
              {org.verified ? <Verified label={t("list.card.verified")} size={16} /> : null}
            </span>
            <h3 className="nb-rh-oc-t">
              <Link href={href}>{offer.title}</Link>
            </h3>
            <dl className="nb-rh-oc-stats">
              <div>
                <dt>{t("list.card.views")}</dt>
                <dd>{format.number(offer.figures.views)}</dd>
              </div>
              <div>
                <dt>{t("list.card.applications")}</dt>
                <dd>{format.number(total)}</dd>
              </div>
              <div>
                {endedOn ? (
                  <>
                    <dt>{t("list.card.endedOn")}</dt>
                    <dd>{format.dateTime(endedOn, { day: "numeric", month: "short" })}</dd>
                  </>
                ) : left !== null ? (
                  <>
                    <dt>{t("list.card.left")}</dt>
                    <dd>{t("list.card.leftValue", { count: left })}</dd>
                  </>
                ) : (
                  <>
                    <dt>{t("list.card.deadline")}</dt>
                    <dd>{t("list.card.noDeadline")}</dd>
                  </>
                )}
              </div>
            </dl>
            {extra?.summary ? <p className="nb-rh-oc-desc">{extra.summary}</p> : null}
          </div>
          <div className="nb-rh-oc-pied">
            {total > 0 ? (
              <Link
                href={`${href}?vue=trier`}
                className="nb-rh-oc-faces"
                aria-label={t("list.card.faces", { count: total })}
              >
                {faces.map((face, index) => (
                  <span key={face.id} className="nb-rh-oc-face" style={{ zIndex: 4 - index }}>
                    <FilAvatar
                      initials={face.name ? initialsOfName(face.name) : ""}
                      image={face.image}
                      tone={Number(tintOf(face.id))}
                      org={false}
                      size={36}
                    />
                  </span>
                ))}
                {more > 0 ? (
                  <span className="nb-rh-oc-plus">{t("list.card.moreFaces", { count: more })}</span>
                ) : null}
              </Link>
            ) : (
              <span className="nb-rh-oc-aucune">{t("list.card.noFaces")}</span>
            )}
            <Link href={href} className="nb-rh-oc-plusbt">
              <span aria-hidden>{t("list.card.more")}</span>
              <span className="sr-only">{t("list.card.moreLabel", { title: offer.title })}</span>
            </Link>
          </div>
          <span className="nb-rh-oc-encoche">
            <i className="nb-rh-oc-k1" aria-hidden />
            <i className="nb-rh-oc-k2" aria-hidden />
            <span className="nb-rh-statut nb-rh-oc-etat" data-statut={status}>
              {status === "published" ? <i className="nb-rh-pouls" aria-hidden /> : null}
              {t(`status.${status}`)}
            </span>
          </span>
        </article>
      </li>
    );
  };

  return (
    <div className="nb-rh-offres">
      <nav className="nb-rh-filtres" aria-label={t("list.filters")}>
        {RH_OFFER_FILTERS.map((key) => (
          <Link
            key={key}
            href={key === "toutes" ? "/app/hire/offres" : `/app/hire/offres?vue=${key}`}
            className="nb-chip"
            aria-current={key === filter ? "page" : undefined}
          >
            {t(`list.filter.${key}`)}
          </Link>
        ))}
      </nav>
      {shown.length === 0 ? (
        <p className="nb-vide">{t(`list.empty.${filter}`)}</p>
      ) : (
        sections.map((section) => (
          <section key={section.key} aria-label={t(`list.section.${section.key}`)}>
            {titled ? (
              <h2 className="nb-rh-oc-section">
                {t(`list.section.${section.key}`)}
                <small>{section.items.length}</small>
              </h2>
            ) : null}
            <ul className="nb-rh-cartes">{section.items.map(card)}</ul>
          </section>
        ))
      )}
    </div>
  );
}

/** Bars per day (7 or 30 days): applications or views of the offer. */
function Bars({
  bars,
  top,
  period,
  label,
  tone,
  added,
  weekday,
}: {
  bars: { start: Date; count: number }[];
  top: number;
  period: 7 | 30;
  label: string;
  tone?: string;
  added: (count: number) => string;
  weekday: (date: Date) => string;
}) {
  return (
    <ol
      className="nb-rh-barres"
      data-long={period === 30 ? "" : undefined}
      data-ton={tone}
      aria-label={label}
    >
      {bars.map((bar, index) => (
        <li key={bar.start.toISOString()} data-today={index === bars.length - 1 ? "" : undefined}>
          {period === 7 ? <small>{added(bar.count)}</small> : null}
          <span style={{ height: `${Math.max(6, (bar.count / top) * 100)}%` }} />
          {period === 7 ? <small>{weekday(bar.start)}</small> : null}
        </li>
      ))}
    </ol>
  );
}

type DetailJob = {
  id: string;
  slug: string;
  title: string;
  city: string;
  contractType: string;
  remote: string;
  status: OfferRow["status"];
  publishedAt: Date | null;
  closesAt: Date | null;
  updatedAt: Date;
  openings: number;
};

/**
 * One offer on the recruiter's phone (Modèle B recruteur, M4, planche Recruteur-offre-detail): its
 * status and dates, four real figures, Orbi's line with « Pourquoi ? », applications per day over 7
 * or 30 days, where the candidates come from, then « Voir les N candidats ».
 */
/**
 * The head of an offer, the same on « Vue », « Candidatures » and « Retenus » (Ephraïm,
 * 03/11/2026): the company with its logo, the title, the state with the place, and the dates on
 * one single line.
 */
export async function RhOfferHead({
  job,
  organization,
  now,
  notice,
}: {
  job: {
    title: string;
    status: OfferRow["status"];
    city: string;
    contractType: string;
    remote: string;
    publishedAt: Date | null;
    closesAt: Date | null;
    updatedAt: Date;
    country?: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
  };
  organization: { name: string; logo: string | null; verifiedAt: Date | null };
  now: Date;
  notice?: string;
}) {
  const t = await getTranslations("phoneRhOffres");
  const format = await getFormatter();
  const status = statusKey(job, now);
  const day = (date: Date) => format.dateTime(date, { day: "numeric", month: "short" });
  const online = daysSince(job.publishedAt, now);
  const left = job.closesAt ? Math.ceil((job.closesAt.getTime() - now.getTime()) / DAY) : null;
  const ended = status === "closed" || status === "expired";
  const dates = [
    job.publishedAt ? t("detail.published", { date: day(job.publishedAt) }) : t("detail.draft"),
    ended
      ? t("detail.ended", { date: day(job.status === "closed" ? job.updatedAt : job.closesAt!) })
      : job.publishedAt
        ? t("detail.onlineShort", { count: online })
        : null,
    !ended && left !== null && left > 0 ? t("detail.leftShort", { count: left }) : null,
  ].filter(Boolean);
  // The ribbon of the offer's life: from its publication to its end, the part already lived filled.
  const total =
    job.publishedAt && job.closesAt ? job.closesAt.getTime() - job.publishedAt.getTime() : 0;
  const lived = ended
    ? 1
    : total > 0
      ? Math.min(1, Math.max(0.04, (now.getTime() - job.publishedAt!.getTime()) / total))
      : null;
  // The place as a round flag (the city is read aloud), then the contract and the salary; the
  // remote mode takes the salary's place when no salary is given (Ephraïm, 04/11/2026).
  const code = countryCode(job.country ?? null);
  const low = job.salaryMin ?? null;
  const high = job.salaryMax ?? null;
  const salary =
    low !== null && high !== null && high !== low
      ? t("detail.salaryRange", { min: formatUsd(low), max: formatUsd(high) })
      : (low ?? high) !== null
        ? t("detail.salarySingle", { amount: formatUsd((low ?? high)!) })
        : null;
  return (
    <section className="nb-rh-co-tete nb-rh-of-tete" data-v2="">
      <div className="nb-rh-of-haut">
        <span className="nb-rh-of-logo">
          <FilAvatar
            initials={initialsOfName(organization.name)}
            image={organization.logo}
            tone={0}
            org
            square
            size={64}
          />
        </span>
        <div className="nb-rh-of-noms">
          <span className="nb-rh-of-org">
            <span>{organization.name}</span>
            {organization.verifiedAt ? <Verified label={t("vue.verified")} size={13} /> : null}
          </span>
          <h1>{job.title}</h1>
        </div>
      </div>
      <ul className="nb-rh-of-puces">
        <li className="nb-rh-of-etat" data-statut={status}>
          <span>{t(`status.${status}`)}</span>
        </li>
        <li data-sorte="lieu" title={job.city}>
          {code ? (
            // eslint-disable-next-line @next/next/no-img-element -- tiny static SVG flag.
            <img src={`/drapeaux/${code.toLowerCase()}.svg`} alt="" width={20} height={20} />
          ) : null}
          <span className={code ? "sr-only" : undefined}>{job.city}</span>
        </li>
        <li>{t(`contract.${job.contractType}` as "contract.cdi")}</li>
        <li data-sorte="salaire">{salary ?? t(`remote.${job.remote}` as "remote.onsite")}</li>
      </ul>
      <div className="nb-rh-of-vie" data-fin={ended ? "" : undefined}>
        <span className="nb-rh-of-piste" aria-hidden>
          <i
            style={{ width: lived === null ? "100%" : `${Math.round(lived * 100)}%` }}
            data-libre={lived === null ? "" : undefined}
          />
        </span>
        <p className="nb-meta">
          <span>{dates[0]}</span>
          <span>{dates.slice(1).join(" · ")}</span>
        </p>
      </div>
      {notice ? (
        <p className="nb-erreur" role="alert">
          {notice}
        </p>
      ) : null}
    </section>
  );
}

export async function RhOfferDetail({
  ctx,
  job,
  figures,
  org,
  manage,
  period,
  openReport,
  notice,
  now,
  tabs,
  shortlisted = 0,
}: {
  ctx: HireContext;
  job: DetailJob;
  /** Retained candidates of the offer (« Retenus »). */
  shortlisted?: number;
  /** « Vue · Candidatures · Retenus » (03/11/2026), under the title. */
  tabs?: ReactNode;
  /** « Remettre en ligne » refused by the limit of the plan. */
  notice?: string;
  figures: OfferRow["figures"];
  org: string;
  manage: boolean;
  period: 7 | 30;
  openReport: boolean;
  now: Date;
}) {
  const t = await getTranslations("phoneRhOffres");
  const tc = await getTranslations("forMe.category");
  const format = await getFormatter();
  const since = new Date(now.getTime() - (period - 1) * DAY);
  since.setUTCHours(0, 0, 0, 0);
  const [applications, canExport, viewDays, organization, viewFamilies] = await Promise.all([
    db.application.findMany({
      where: { jobId: job.id },
      select: {
        createdAt: true,
        source: true,
        status: true,
        profile: { select: { skills: { select: { skill: { select: { category: true } } } } } },
        events: {
          where: { type: { in: ["stage_changed", "decision"] } },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
    can(db, { type: "organization", id: ctx.organizationId }, "reports.export"),
    db.jobViewDay.findMany({ where: { jobId: job.id, day: { gte: since } } }),
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { name: true, logo: true, verifiedAt: true },
    }),
    db.jobViewFamily.findMany({ where: { jobId: job.id }, orderBy: { count: "desc" } }),
  ]);

  // ─── Les chiffres ──────────────────────────────────────────────────────────────────
  const rate = figures.views > 0 ? figures.applications / figures.views : null;
  const perApplication =
    figures.applications > 0 && figures.views >= figures.applications
      ? Math.round(figures.views / figures.applications)
      : null;
  const viewBars = Array.from({ length: period }, (_, index) => {
    const start = new Date(since.getTime() + index * DAY);
    return {
      start,
      count: viewDays
        .filter(
          (row) =>
            row.day.getTime() >= start.getTime() && row.day.getTime() < start.getTime() + DAY,
        )
        .reduce((sum, row) => sum + row.count, 0),
    };
  });
  const viewTop = Math.max(1, ...viewBars.map((bar) => bar.count));
  const periodViews = viewBars.reduce((sum, bar) => sum + bar.count, 0);

  // ─── Diagnostic: who looks, who applies, from where ─────────────────────────────────
  const familyName = (category: string) => {
    try {
      return tc(category as "data");
    } catch {
      return category;
    }
  };
  const colors = Object.values(PROFILE_PALETTE);
  const sharesOf = (rows: { family: string; count: number }[]) => {
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    const top = rows.slice(0, 3);
    const rest = rows.slice(3).reduce((sum, row) => sum + row.count, 0);
    const kept = rest > 0 ? [...top, { family: "", count: rest }] : top;
    return {
      total,
      rows: kept.map((row, index) => ({
        key: row.family || "autres",
        label: row.family ? familyName(row.family) : t("vue.others"),
        share: total > 0 ? Math.round((row.count * 100) / total) : 0,
        color: row.family ? colors[index % colors.length]! : "rgba(255,255,255,.25)",
      })),
    };
  };
  const viewers = sharesOf(viewFamilies.map((row) => ({ family: row.family, count: row.count })));
  const applicantCounts = new Map<string, number>();
  for (const row of applications) {
    const family = familyShares(row.profile.skills.map((item) => item.skill.category))[0]?.family;
    if (family) applicantCounts.set(family, (applicantCounts.get(family) ?? 0) + 1);
  }
  const applicants = sharesOf(
    [...applicantCounts.entries()]
      .map(([family, count]) => ({ family, count }))
      .sort((x, y) => y.count - x.count),
  );
  // Below this many signed-in views, the families say nothing yet (and point at no one).
  const enough = viewers.total >= VIEWERS_MIN;
  const named = (rows: { label: string; key: string }[]) => {
    const [first, second] = rows.filter((row) => row.key !== "autres").map((row) => row.label);
    return second ? t("vue.two", { first: first!, second }) : (first ?? "");
  };
  const sources = (["direct", "invitation", "talent_search"] as const).map((source) => ({
    source,
    count: applications.filter((row) => row.source === source).length,
  }));
  const delays = applications
    .filter((row) => row.events[0])
    .map((row) => (row.events[0]!.createdAt.getTime() - row.createdAt.getTime()) / DAY);
  const responseDays = delays.length
    ? Math.round((delays.reduce((sum, value) => sum + value, 0) / delays.length) * 10) / 10
    : null;
  const hired = applications.filter((row) => row.status === "hired").length;

  // ─── Ce qui marche · À améliorer · À faire ─────────────────────────────────────────
  const status = statusKey(job, now);
  const online = daysSince(job.publishedAt, now);
  const left = job.closesAt ? Math.ceil((job.closesAt.getTime() - now.getTime()) / DAY) : null;
  const ended = status === "closed" || status === "expired";
  const review: OfferFigures = {
    views: figures.views,
    applications: figures.applications,
    unseen: figures.unseen,
    shortlisted,
    hired,
    openings: Math.max(1, job.openings),
    online,
    left: ended ? null : left,
    responseDays,
    invited: sources.find((row) => row.source === "invitation")?.count ?? 0,
  };
  const points = offerPoints(review);
  const percent = (value: number) =>
    format.number(value, { style: "percent", maximumFractionDigits: 1 });
  const pointText = (point: OfferPoint) => {
    switch (point.key) {
      case "rate":
      case "lowRate":
        return t(`vue.point.${point.key}`, { share: percent(point.share) });
      case "seen":
      case "fewViews":
        return t(`vue.point.${point.key}`, { count: point.views });
      case "fastAnswer":
      case "slowAnswer":
        return t(`vue.point.${point.key}`, { days: format.number(point.days) });
      case "shortlist":
      case "open":
        return t(`vue.point.${point.key}`, { count: point.count });
      case "retain":
        return t("vue.point.retain", { count: point.wanted });
      case "closing":
        return t("vue.point.closing", { count: point.days });
      default:
        return t(`vue.point.${point.key}`);
    }
  };

  const pipelineHref = `/app/hire/offres/${job.id}?vue=candidatures`;
  const from = job.publishedAt ?? job.updatedAt;
  const to = job.status === "closed" ? job.updatedAt : now;
  const report =
    job.status === "closed"
      ? {
          views: figures.views,
          applications: figures.applications,
          hired,
          href: canExport
            ? `/app/hire/rapports/export?periode=custom&du=${from.toISOString().slice(0, 10)}&au=${to.toISOString().slice(0, 10)}`
            : null,
        }
      : null;
  const actions: RhOfferActionsData = {
    noFil: isHireScope(),
    id: job.id,
    title: job.title,
    status: (["published", "pending_review", "draft", "paused", "closed"] as const).includes(
      job.status as "published",
    )
      ? (job.status as RhOfferActionsData["status"])
      : "other",
    url: job.publishedAt ? publicJobUrl(job.slug) : null,
    org,
    applications: figures.applications,
    report,
    manage,
    start: openReport && report ? "report" : null,
    closesAt: job.closesAt ? job.closesAt.toISOString().slice(0, 10) : null,
    minDate: new Date(now.getTime() + DAY).toISOString().slice(0, 10),
    back: `/app/hire/offres/${job.id}?vue=apercu`,
  };
  const bar = (rows: { key: string; share: number; color: string }[], label: string) => (
    <span className="nb-rh-vu-barre" role="img" aria-label={label}>
      {rows.map((row) => (
        <span key={row.key} style={{ flexGrow: Math.max(1, row.share), background: row.color }} />
      ))}
    </span>
  );
  const legend = (rows: { key: string; label: string; share: number; color: string }[]) => (
    <ul className="nb-rh-vu-legende">
      {rows.map((row) => (
        <li key={row.key}>
          <i style={{ background: row.color }} aria-hidden />
          <span>{row.label}</span>
          <b>{t("vue.share", { share: row.share })}</b>
        </li>
      ))}
    </ul>
  );

  return (
    <RhOffresTexts>
      <div className="nb-page nb-rh-detail nb-rh-co nb-rh-vue">
        <header className="nb-rh-barre">
          <Link href="/app/hire/offres" className="nb-rh-retour">
            <PhoneIcon name="retour" size={20} />
            {t("detail.back")}
          </Link>
          <RhOfferActions data={actions} items={["edit", "pause", "postpone", "delete"]} />
        </header>
        <RhOfferHead job={job} organization={organization} now={now} notice={notice} />
        {tabs}

        <section className="nb-rh-vu-chiffres" aria-labelledby="rh-vu-chiffres">
          <h2 id="rh-vu-chiffres" className="nb-rh-vu-sur">
            {t("vue.figuresTitle")}
          </h2>
          <dl className="nb-rh-vu-trois">
            <div>
              <dt>{t("vue.views")}</dt>
              <dd>{format.number(figures.views)}</dd>
            </div>
            <div>
              <dt>{t("vue.applications")}</dt>
              <dd>{format.number(figures.applications)}</dd>
            </div>
            <div>
              <dt>{t("vue.rate")}</dt>
              <dd>
                {rate === null
                  ? "–"
                  : format.number(rate, {
                      style: "percent",
                      maximumFractionDigits: 1,
                    })}
              </dd>
            </div>
          </dl>
          <p className="nb-rh-vu-ratio">
            {perApplication !== null
              ? t("vue.ratio", { count: perApplication })
              : figures.applications > 0
                ? t("vue.ratioUncounted")
                : figures.views > 0
                  ? t("vue.ratioNone", { count: figures.views })
                  : t("vue.ratioNoView")}
          </p>
          <div className="nb-rh-vu-courbe">
            <div className="nb-rh-courbe-h">
              <span>{t("vue.viewsChart", { count: periodViews, days: period })}</span>
              <nav className="nb-rh-periode" aria-label={t("detail.period")}>
                {([7, 30] as const).map((days) => (
                  <Link
                    key={days}
                    href={
                      days === 7
                        ? `/app/hire/offres/${job.id}?vue=apercu`
                        : `/app/hire/offres/${job.id}?vue=apercu&jours=30`
                    }
                    aria-current={period === days ? "page" : undefined}
                    replace
                    scroll={false}
                  >
                    {t("detail.days", { count: days })}
                  </Link>
                ))}
              </nav>
            </div>
            <Bars
              bars={viewBars}
              top={viewTop}
              period={period}
              tone="vues"
              label={t("detail.viewsLabel", { count: periodViews, days: period })}
              added={(count) => String(count)}
              weekday={(date) => format.dateTime(date, { weekday: "short" }).replace(".", "")}
            />
          </div>
        </section>

        <section className="nb-rh-vu-diag" aria-labelledby="rh-vu-diag">
          <h2 id="rh-vu-diag" className="nb-rh-vu-sur">
            <OrbiDisc size={24} />
            {t("vue.diagTitle")}
          </h2>
          <p className="nb-rh-vu-phrase">
            {enough
              ? t("vue.diagViewers", { families: named(viewers.rows) })
              : applicants.total > 0
                ? t("vue.diagApplicants", { families: named(applicants.rows) })
                : t("vue.diagNone")}
          </p>
          <div className="nb-rh-vu-bloc">
            <p>{t("vue.whoViews")}</p>
            {enough ? (
              <>
                {bar(viewers.rows, t("vue.whoViews"))}
                {legend(viewers.rows)}
              </>
            ) : (
              <small className="nb-meta">{t("vue.whoViewsFew", { count: VIEWERS_MIN })}</small>
            )}
          </div>
          <div className="nb-rh-vu-bloc">
            <p>{t("vue.whoApplies")}</p>
            {applicants.total > 0 ? (
              <>
                {bar(applicants.rows, t("vue.whoApplies"))}
                {legend(applicants.rows)}
              </>
            ) : (
              <small className="nb-meta">{t("vue.whoAppliesNone")}</small>
            )}
          </div>
          <div className="nb-rh-vu-bloc">
            <p>{t("detail.sources")}</p>
            <ul className="nb-rh-vu-sources">
              {sources.map((row) => (
                <li key={row.source} data-vide={row.count === 0 ? "" : undefined}>
                  <b>{row.count}</b>
                  <span>{t(`source.${row.source}`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="nb-meta">{t("vue.rule")}</p>
        </section>

        <section className="nb-rh-vu-actions" aria-labelledby="rh-vu-actions">
          <h2 id="rh-vu-actions" className="nb-rh-vu-sur">
            {t("vue.whyTitle")}
          </h2>
          <ul className="nb-rh-vu-defile" tabIndex={0} aria-label={t("vue.whyTitle")}>
            {(
              [
                ["marche", "works", "certificate", points.works],
                ["ameliorer", "improve", "career", points.improve],
                ["faire", "todo", "calendar", points.todo],
              ] as const
            ).map(([tone, key, art, list]) => (
              <li key={key} className="nb-rh-vu-carte" data-ton={tone}>
                <span className="nb-rh-vu-carte-h">
                  <MenuArt name={art} size="xs" />
                  <b>{t(`vue.${key}.title`)}</b>
                  <small>{list.length}</small>
                </span>
                {list.length > 0 ? (
                  <ul>
                    {list.map((point) => (
                      <li key={point.key}>{pointText(point)}</li>
                    ))}
                  </ul>
                ) : (
                  <small className="nb-meta">{t(`vue.${key}.none`)}</small>
                )}
                {key === "todo" && figures.applications > 0 ? (
                  <Link href={pipelineHref} className="nb-rh-ev-lien">
                    {t("vue.todo.go")}
                    <PhoneIcon name="chevron" size={14} />
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {figures.applications > 0 ? (
          <div className="nb-bas">
            <Link href={pipelineHref} className="nb-bp">
              {t("detail.see", { count: figures.applications })}
            </Link>
          </div>
        ) : null}
      </div>
    </RhOffresTexts>
  );
}

/**
 * The pipeline of one offer (« JUMANLY Hire, logique du recrutement », Ephraïm 01/11/2026): the
 * stages as scrolling tabs with their counts, then the segmented bar of Orbi's classes (touch a
 * segment to filter), then one continuous list grouped by class: « Fort potentiel » first and
 * open, « Limité » folded, « Hors critères » at the bottom, never hidden, with the missing
 * criterion. Ranked by the deterministic match inside a class, never by name, age or photo; the
 * recruiter decides.
 */
export async function RhOfferCandidates({
  ctx,
  jobId,
  unseen,
  stageId,
  orbiClass,
  query,
  sortable,
}: {
  ctx: HireContext;
  jobId: string;
  unseen: number;
  /** The member may sort (manage + the « Trier » right). */
  sortable: boolean;
  stageId?: string;
  orbiClass?: string;
  query: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations("phoneRhOffres");
  const tt = await getTranslations("phoneRhTri");
  const tc = await getTranslations("talent.profile.preferences");
  const tf = await getTranslations("phoneExplorer.filters");

  const format = await getFormatter();
  const board = await atsBoard(db, ctx, jobId);
  const stages = await db.pipelineStage.findMany({
    where: { jobId: board.job.id },
    orderBy: { order: "asc" },
    select: { id: true, name: true, kind: true },
  });
  const now = new Date();
  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  const followed = stages.filter((stage) => stage.kind !== "rejected");
  const stageOf = (row: (typeof board.rows)[number]) => {
    if (row.status === "withdrawn") return "withdrawn";
    const byKind =
      row.status === "hired"
        ? stages.find((stage) => stage.kind === "hired")
        : row.status === "rejected"
          ? stages.find((stage) => stage.kind === "rejected")
          : undefined;
    return (byKind ?? stages.find((stage) => stage.name === row.stage.name) ?? stages[0])?.id;
  };
  const columns = [
    ...stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      kind: stage.kind as string,
      rows: board.rows.filter((row) => stageOf(row) === stage.id),
    })),
    {
      id: "withdrawn",
      name: t("pipeline.withdrawn"),
      kind: "withdrawn",
      rows: board.rows.filter((row) => stageOf(row) === "withdrawn"),
    },
  ].filter((column) => column.kind !== "withdrawn" || column.rows.length > 0);
  const current =
    columns.find((column) => column.id === stageId) ??
    columns.find((column) => column.rows.length > 0) ??
    columns[0]!;
  const base = `/app/hire/offres/${jobId}?vue=candidats&etape=${current.id}`;
  const chosen = orbiClasses.find((key) => key === orbiClass) ?? null;
  const counts = classCounts(current.rows);
  const classed = counts.reduce((sum, item) => sum + item.count, 0);
  const position = followed.findIndex((stage) => stage.id === current.id);
  // Saved filters of the offer: the list narrows, the class bar keeps counting everyone.
  const allFilters = board.filtersLevel === "all";
  const filters = allowedFilters(parseFilters(board.job.pipelineFilters), board.filtersLevel);
  const filtered = current.rows.filter((row) => passes(row, filters, now));
  const hiddenByFilters = current.rows.length - filtered.length;
  const blind = board.job.blindSort;
  const ranked = rankByClass(current.rows);
  const nameOf = (row: (typeof current.rows)[number]) =>
    blind && !row.shortlisted
      ? tt("blind.name", { index: blindName(ranked.indexOf(row)) })
      : row.name;
  const compareForm = `rh-comparer-${jobId}`;
  const here0 = `${base}${chosen ? `&classe=${chosen}` : ""}`;
  const groups: { key: OrbiClass | "none"; rows: typeof current.rows }[] = board.withScores
    ? [
        ...orbiClasses.map((key) => ({
          key,
          rows: filtered.filter((row) => row.orbiClass === key),
        })),
        { key: "none" as const, rows: filtered.filter((row) => row.orbiClass === null) },
      ].filter((group) => (chosen ? group.key === chosen : true) && group.rows.length > 0)
    : [{ key: "none" as const, rows: filtered }];
  const card = (row: (typeof current.rows)[number]) => {
    const code = countryCode(row.country);
    const canSort = sortable && row.status === "active";
    const fiche = `${base}${chosen ? `&classe=${chosen}` : ""}&fiche=${row.id}`;
    const here = `${base}${chosen ? `&classe=${chosen}` : ""}`;
    const gesture = (gesture: "retenir" | "attente") => (
      <form id={`rh-tri-${gesture}-${row.id}`} action={sortGestureAction} hidden>
        <input type="hidden" name="application" value={row.id} />
        <input type="hidden" name="job" value={jobId} />
        <input type="hidden" name="gesture" value={gesture} />
        <input type="hidden" name="back" value={here} />
      </form>
    );
    return (
      <li key={row.id}>
        {canSort && !row.shortlisted ? gesture("retenir") : null}
        {canSort && !row.onHold ? gesture("attente") : null}
        <SwipeCard
          right={canSort && !row.shortlisted ? `rh-tri-retenir-${row.id}` : null}
          left={canSort && !row.onHold ? `rh-tri-attente-${row.id}` : null}
          rightLabel={tt("swipe.retain")}
          leftLabel={tt("swipe.hold")}
        >
          <div className="nb-rh-pipe-carte" data-classe={row.orbiClass ?? undefined}>
            <Link href={fiche} className="nb-rh-cand">
              <span className="nb-rh-mini" aria-hidden>
                {blind && !row.shortlisted ? null : initials(row.name)}
              </span>
              <span className="nb-rh-res-t">
                <b>{nameOf(row)}</b>
                {row.headline ? <span className="nb-meta nb-rh-coupe">{row.headline}</span> : null}
                <span className="nb-meta">
                  {[row.city, code ? `${flagOf(code)}` : null].filter(Boolean).join(" ")}
                  {code ? <span className="sr-only">{countryName(code)}</span> : null}
                </span>
              </span>
              {row.score !== null ? (
                <span
                  className="nb-rh-anneau"
                  style={{ "--p": row.score } as CSSProperties}
                  role="img"
                  aria-label={t("classes.score", { value: row.score })}
                >
                  <b aria-hidden>{row.score}</b>
                </span>
              ) : null}
            </Link>
            {row.matched.length > 0 || row.documents.asked > 0 ? (
              <span className="nb-rh-pipe-faits">
                {row.matched.map((skill) => (
                  <span key={skill} className="nb-rh-pipe-comp">
                    {skill}
                  </span>
                ))}
                {row.documents.asked > 0 ? (
                  <span
                    className="nb-rh-pipe-docs"
                    data-complet={row.documents.received >= row.documents.asked ? "" : undefined}
                  >
                    {t("classes.documents", {
                      received: row.documents.received,
                      asked: row.documents.asked,
                    })}
                  </span>
                ) : null}
              </span>
            ) : null}
            {row.star ? <span className="nb-rh-pipe-etoile">{tt("notes.star")}</span> : null}
            {row.shortlisted || row.onHold ? (
              <span className="nb-rh-pipe-etat" data-etat={row.shortlisted ? "retenu" : "attente"}>
                {row.shortlisted ? tt("state.retained") : tt("state.hold")}
              </span>
            ) : null}
            {row.missedCriteria.length > 0 ? (
              <p className="nb-rh-pipe-manque">
                {t("classes.missing", { label: row.missedCriteria.join(", ") })}
              </p>
            ) : null}
            {position >= 0 ? (
              <span
                className="nb-rh-pipe-points"
                role="img"
                aria-label={t("pipeline.step", { index: position + 1, total: followed.length })}
              >
                {followed.map((stage, at) => (
                  <i
                    key={stage.id}
                    data-fait={at <= position ? "" : undefined}
                    data-actuel={at === position && current.kind !== "hired" ? "" : undefined}
                  />
                ))}
              </span>
            ) : null}
            <span className="nb-meta">
              {t("pipeline.applied", { when: format.relativeTime(row.createdAt, now) })}
            </span>
            <span className="nb-rh-pipe-acces">
              <Link href={`/app/hire/candidats/${row.id}?onglet=cv`}>{t("pipeline.cv")}</Link>
              <Link href={`/app/hire/candidats/${row.id}?onglet=reponses`}>
                {t("pipeline.documents")}
              </Link>
              <label className="nb-rh-pipe-comparer">
                <input type="checkbox" name="ids" value={row.id} form={compareForm} />
                {tt("compare.pick")}
              </label>
            </span>
          </div>
        </SwipeCard>
      </li>
    );
  };
  return (
    <div className="nb-page nb-rh-detail nb-rh-pipe">
      <header className="nb-rh-barre">
        <Link href={`/app/hire/offres/${jobId}`} className="nb-rh-retour">
          <PhoneIcon name="retour" size={20} />
          {t("candidates.back")}
        </Link>
      </header>
      <section className="nb-rh-detail-h">
        <h1>{board.job.title}</h1>
        <p className="nb-meta">{t("candidates.line", { count: board.rows.length, unseen })}</p>
      </section>
      <RhUndoGesture
        query={query}
        jobId={jobId}
        back={`${base}${chosen ? `&classe=${chosen}` : ""}`}
      />
      <nav className="nb-rh-pipe-nav" aria-label={t("pipeline.stages")}>
        {columns.map((column) => (
          <Link
            key={column.id}
            href={`/app/hire/offres/${jobId}?vue=candidats&etape=${column.id}`}
            data-kind={column.kind}
            aria-current={column.id === current.id ? "page" : undefined}
            scroll={false}
          >
            {column.name}
            <b>{column.rows.length}</b>
          </Link>
        ))}
      </nav>
      {board.withScores && classed > 0 ? (
        <section className="nb-rh-classes" aria-labelledby="rh-classes-t">
          <h2 id="rh-classes-t">
            <Link href={`/app/hire/offres/${jobId}/resultats`}>
              <OrbiDisc size={30} />
              <span>{t("classes.title")}</span>
              <PhoneIcon name="chevron" size={18} />
            </Link>
          </h2>
          <div className="nb-rh-classes-barre" aria-hidden>
            {counts
              .filter((item) => item.count > 0)
              .map((item) => (
                <i
                  key={item.key}
                  data-classe={item.key}
                  style={{ flexGrow: item.count } as CSSProperties}
                />
              ))}
          </div>
          <ul className="nb-rh-classes-liste">
            {counts.map((item) => (
              <li key={item.key}>
                <Link
                  href={chosen === item.key ? base : `${base}&classe=${item.key}`}
                  data-classe={item.key}
                  aria-current={chosen === item.key ? "true" : undefined}
                  aria-disabled={item.count === 0 ? "true" : undefined}
                  scroll={false}
                >
                  <b>{item.count}</b>
                  {t(`classes.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
          {chosen ? (
            <Link href={base} className="nb-rh-classes-tous" scroll={false}>
              {t("classes.all")}
            </Link>
          ) : null}
        </section>
      ) : null}
      {board.withScores && classed > 0 ? null : (
        <Link href={`/app/hire/offres/${jobId}/resultats`} className="nb-rh-pieces-lien">
          <OrbiDisc size={36} />
          <span>
            <b>{tt("results.title")}</b>
            <span className="nb-meta">{tt("results.line")}</span>
          </span>
        </Link>
      )}
      {board.shortlisted.length > 0 ? (
        <Link href={`/app/hire/offres/${jobId}/verification`} className="nb-rh-pieces-lien">
          <MenuArt name="privacy" size="xs" />
          <span>
            <b>{tt("pieces.title")}</b>
            <span className="nb-meta">
              {tt("pieces.line", { count: board.shortlisted.length })}
            </span>
          </span>
        </Link>
      ) : null}
      <div className="nb-rh-pf-rangee">
        <RhFiltersSheet
          label={tt("filters.title")}
          countLabel={tf("buttonCount", { count: activeFilters(filters) })}
          count={activeFilters(filters)}
          closeLabel={tf("close")}
          version={`${JSON.stringify(filters)}-${blind}`}
        >
          {sortable ? (
            <form action={saveFiltersAction} className="nb-rh-pf-f" id={`rh-filtres-${jobId}`}>
              <input type="hidden" name="job" value={jobId} />
              <input type="hidden" name="back" value={here0} />
              <div className="nb-ex-f-tete">
                <h2>{tt("filters.title")}</h2>
                <button type="submit" name="reset" value="1">
                  {tt("filters.reset")}
                </button>
              </div>
              <div className="nb-ex-f-corps">
                {allFilters ? (
                  <>
                    <label className="nb-rh-pf-champ">
                      <span className="nb-ex-f-gl">{tt("filters.scoreMin")}</span>
                      <input
                        type="number"
                        name="scoreMin"
                        min={0}
                        max={100}
                        inputMode="numeric"
                        defaultValue={filters.scoreMin ?? ""}
                      />
                    </label>
                    <label className="nb-rh-pf-champ">
                      <span className="nb-ex-f-gl">{tt("filters.skill")}</span>
                      <input name="skill" maxLength={60} defaultValue={filters.skill ?? ""} />
                    </label>
                    <label className="nb-rh-pf-champ">
                      <span className="nb-ex-f-gl">{tt("filters.yearsMin")}</span>
                      <input
                        type="number"
                        name="yearsMin"
                        min={0}
                        max={40}
                        inputMode="numeric"
                        defaultValue={filters.yearsMin ?? ""}
                      />
                    </label>
                    <label className="nb-rh-pf-champ">
                      <span className="nb-ex-f-gl">{tt("filters.place")}</span>
                      <input name="place" maxLength={60} defaultValue={filters.place ?? ""} />
                    </label>
                    <PfChoices
                      name="confidence"
                      legend={tt("filters.confidence")}
                      any={tt("filters.any")}
                      value={filters.confidence ?? ""}
                      options={filterConfidences.map((value) => ({
                        value,
                        label: tt(`filters.confidenceValue.${value}`),
                      }))}
                    />
                  </>
                ) : (
                  <p className="nb-meta nb-rh-filtres-lock">
                    <span>{tt("filters.simpleOnly")}</span>
                    <Link href="/app/abonnement/formules">{tt("filters.simpleOnlyLink")}</Link>
                  </p>
                )}
                <PfChoices
                  name="state"
                  legend={tt("filters.state")}
                  any={tt("filters.any")}
                  value={filters.state ?? ""}
                  options={filterStates.map((value) => ({
                    value,
                    label: tt(`filters.stateValue.${value}`),
                  }))}
                />
                <PfChoices
                  name="source"
                  legend={tt("filters.source")}
                  any={tt("filters.any")}
                  value={filters.source ?? ""}
                  options={filterSources.map((value) => ({
                    value,
                    label: t(`source.${value}`),
                  }))}
                />
                <label className="nb-rh-pf-champ">
                  <span className="nb-ex-f-gl">{tt("filters.days")}</span>
                  <input
                    type="number"
                    name="days"
                    min={1}
                    max={365}
                    inputMode="numeric"
                    defaultValue={filters.days ?? ""}
                  />
                </label>
                <label className="nb-rh-pf-champ">
                  <span className="nb-ex-f-gl">{tt("filters.language")}</span>
                  <input
                    name="language"
                    maxLength={40}
                    placeholder={tt("filters.languageHint")}
                    defaultValue={filters.language ?? ""}
                  />
                </label>
                <PfChoices
                  name="education"
                  legend={tt("filters.education")}
                  any={tt("filters.any")}
                  value={filters.education ?? ""}
                  options={filterEducations.map((value) => ({
                    value,
                    label: tt(`filters.educationValue.${value}`),
                  }))}
                />
                <PfChoices
                  name="availability"
                  legend={tt("filters.availability")}
                  any={tt("filters.any")}
                  value={filters.availability ?? ""}
                  options={filterAvailabilities.map((value) => ({
                    value,
                    label: tt(`filters.availabilityValue.${value}`),
                  }))}
                />
                <PfChoices
                  name="contract"
                  legend={tt("filters.contract")}
                  any={tt("filters.any")}
                  value={filters.contract ?? ""}
                  options={filterContracts.map((value) => ({
                    value,
                    label: tc(`contract.${value}`),
                  }))}
                />
                <p className="nb-meta">{tt("filters.contractNote")}</p>
                <div className="nb-ex-f-opts nb-rh-pf-cases">
                  <label className="nb-ex-f-opt nb-rh-pf-opt">
                    <input
                      type="checkbox"
                      name="complete"
                      defaultChecked={filters.complete ?? false}
                    />
                    {tt("filters.complete")}
                  </label>
                  <label className="nb-ex-f-opt nb-rh-pf-opt">
                    <input type="checkbox" name="blind" defaultChecked={blind} />
                    {tt("blind.toggle")}
                  </label>
                </div>
                <p className="nb-meta nb-rh-pf-regle">{tt("filters.rule")}</p>
              </div>
              <div className="nb-ex-f-bas">
                <button type="submit" className="nb-ex-f-voir">
                  {tt("filters.save")}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="nb-ex-f-tete">
                <h2>{tt("filters.title")}</h2>
              </div>
              <div className="nb-ex-f-corps">
                <p className="nb-meta nb-rh-pf-regle">{tt("filters.readOnly")}</p>
              </div>
            </>
          )}
        </RhFiltersSheet>
        {blind ? <span className="nb-rh-pf-etat">{tt("blind.on")}</span> : null}
      </div>
      {hiddenByFilters > 0 ? (
        <p className="nb-meta nb-rh-regle">{tt("filters.hidden", { count: hiddenByFilters })}</p>
      ) : null}
      <form id={compareForm} action={`/app/hire/offres/${jobId}/comparer`} method="get" hidden />
      <p className="nb-meta nb-rh-regle">
        {board.withScores ? t("classes.rule") : t("candidates.ruleNoScore")}
        {sortable ? ` ${tt("swipe.hint")}` : null}
      </p>
      <div className="nb-rh-pipe-etapes">
        {current.rows.length === 0 ? (
          <p className="nb-meta nb-rh-pipe-vide">{t("pipeline.empty")}</p>
        ) : (
          groups.map((group) => {
            const list = <ul>{group.rows.map(card)}</ul>;
            const title =
              group.key === "none" ? (board.withScores ? t("classes.none") : current.name) : null;
            if (group.key === "limite" && !chosen)
              return (
                <details key={group.key} className="nb-rh-pipe-groupe" data-classe={group.key}>
                  <summary>
                    <span>{t("classes.limite")}</span>
                    <b>{t("classes.open", { count: group.rows.length })}</b>
                  </summary>
                  {list}
                </details>
              );
            return (
              <section
                key={group.key}
                className="nb-rh-pipe-groupe"
                data-classe={group.key === "none" ? undefined : group.key}
                aria-label={title ?? t(`classes.${group.key as OrbiClass}`)}
              >
                <h2>
                  <span>{title ?? t(`classes.${group.key as OrbiClass}`)}</span>
                  <b>{group.rows.length}</b>
                </h2>
                {group.key === "hors" ? <p className="nb-meta">{t("classes.horsLead")}</p> : null}
                {list}
              </section>
            );
          })
        )}
      </div>
      <div className="nb-bas nb-rh-pipe-bas">
        <button type="submit" form={compareForm} className="nb-bs">
          {tt("compare.pick")}
        </button>
        <Link href={`/app/hire/candidats?offre=${jobId}`} className="nb-bp">
          {t("candidates.sort")}
        </Link>
      </div>
    </div>
  );
}

/** « Votre offre est en ligne » (planche Recruteur-publier-5), or sent to review. */
export async function RhOfferPublished({
  job,
  review,
}: {
  job: { id: string; slug: string; title: string };
  review: boolean;
}) {
  const t = await getTranslations("phoneRhOffres.published");
  const url = publicJobUrl(job.slug);
  return (
    <div className="nb-page nb-rh-publiee">
      <span className="nb-rh-ok" aria-hidden>
        <PhoneIcon name={review ? "horloge" : "coche"} size={34} stroke={2.4} />
      </span>
      <h1>{review ? t("reviewTitle") : t("title")}</h1>
      <p>{review ? t("reviewText", { title: job.title }) : t("text", { title: job.title })}</p>
      {review ? null : (
        <CopyRow value={url} copied={t("copied")} label={t("copy")} className="nb-rh-lien">
          <PhoneIcon name="lien" size={18} />
          {url.replace(/^https?:\/\//, "")}
        </CopyRow>
      )}
      <Link href="/app/hire/offres" className="nb-bp">
        {t("offers")}
      </Link>
      {review ? (
        <Link href={`/app/hire/offres/${job.id}`} className="nb-bs">
          {t("see")}
        </Link>
      ) : (
        <Link href="/app/fil/publier?nom=entreprise" className="nb-bs">
          {t("toFil")}
        </Link>
      )}
    </div>
  );
}

const PHONE_CONTRACTS = [
  "cdi",
  "cdd",
  "stage",
  "mission",
  "freelance",
  "alternance",
  "volontariat",
];

/**
 * What « Nouvelle offre » and « Modifier l'offre » need on the phone: the offer of the organization
 * (or an empty draft), the recruiter's cities then the company's, the questions proposed at step 3
 * and the company as talents will see it.
 */
export async function rhPublishData(
  ctx: HireContext,
  userId: string,
  jobId: string | null,
  step: number,
): Promise<RhPublishData> {
  const t = await getTranslations("phoneRhOffres.publish");
  const [job, org, profile, user, verified] = await Promise.all([
    jobId ? getOrgJob(db, ctx, jobId) : null,
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: {
        name: true,
        logo: true,
        city: true,
        country: true,
        sector: true,
        description: true,
      },
    }),
    db.recruiterProfile.findUnique({ where: { userId }, select: { otherCities: true } }),
    db.user.findUnique({ where: { id: userId }, select: { city: true, country: true } }),
    isOrgVerified(db, ctx.organizationId),
  ]);
  const cities = [
    ...new Set(
      [user?.city, ...(profile?.otherCities ?? []), org.city]
        .map((city) => city?.trim())
        .filter((city): city is string => Boolean(city)),
    ),
  ].slice(0, 6);
  const dollars = (cents: number | null | undefined) =>
    cents === null || cents === undefined ? "" : String(Math.round(cents / 100));
  const skills = job?.skills ?? [];
  const levels = new Set<string>(cefrLevels);
  const draft: RhOfferDraft = {
    id: job?.id ?? null,
    slug: job?.slug ?? null,
    title: job?.title ?? "",
    description: job?.description ?? "",
    hardSkills: skills.filter((item) => item.kind !== "soft").map((item) => item.skill.name),
    softSkills: skills.filter((item) => item.kind === "soft").map((item) => item.skill.name),
    languages: parseLanguages(job?.languagesRequired ?? [])
      .filter((item) => levels.has(item.level))
      .map((item) => ({
        code: item.code,
        level: item.level as RhOfferDraft["languages"][0]["level"],
      })),
    educations: educationLevels.filter((level) =>
      (job?.educationLevels.length
        ? job.educationLevels
        : job?.educationLevelMin
          ? [job.educationLevelMin]
          : []
      ).includes(level),
    ),
    closesAt: job?.closesAt ? job.closesAt.toISOString().slice(0, 10) : "",
    city: job?.city ?? "",
    country: job?.country || org.country || user?.country || "",
    remote: (job?.remote as RhOfferDraft["remote"]) ?? "onsite",
    contract: PHONE_CONTRACTS.includes(job?.contractType ?? "")
      ? (job!.contractType as RhOfferDraft["contract"])
      : "cdi",
    openings: job?.openings ?? 1,
    responsibilities: job?.responsibilities ?? [],
    experience: job?.experienceMin ?? 0,
    requirements: job?.requirements ?? [],
    salaryMin: dollars(job?.salaryMin),
    salaryMax: dollars(job?.salaryMax),
    companyAbout: job?.companyAbout ?? "",
    feedTitle: job?.feedTitle ?? "",
    feedText: job?.feedText ?? "",
    questions: screeningQuestionsOf(job?.screeningQuestions).map((question) => question.text),
    documents: (job?.requestedDocuments ?? ["cv"]).filter(
      (kind): kind is RhOfferDraft["documents"][number] =>
        (requestedDocumentKinds as readonly string[]).includes(kind),
    ),
    sheetName: job?.jobSheetName ?? null,
  };
  const place = draft.city || cities[0] || "";
  const languageNames = new Intl.DisplayNames(["fr"], { type: "language" });
  return {
    draft,
    cities,
    suggestions: [
      t("suggestions.skills"),
      t("suggestions.start"),
      place ? t("suggestions.city", { city: place }) : t("suggestions.move"),
      t("suggestions.salary"),
    ],
    languages: offerLanguages.map((code) => {
      const name = languageNames.of(code) ?? code;
      return { code, name: name.charAt(0).toLocaleUpperCase("fr") + name.slice(1) };
    }),
    org: {
      name: org.name,
      initials: org.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join(""),
      logo: org.logo,
      line: [org.city, org.sector].filter(Boolean).join(" · "),
      about: org.description ?? "",
      canEditLogo: hirePermissions(ctx.role).administer,
    },
    verified,
    editing: Boolean(job),
    step: Math.min(10, Math.max(1, Math.trunc(step) || 1)),
  };
}

/** A group of choices of the filters sheet, as Explorer's chips (one radio per chip). */
function PfChoices({
  name,
  legend,
  any,
  value,
  options,
}: {
  name: string;
  legend: string;
  any: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <fieldset className="nb-rh-pf-grp">
      <legend className="nb-ex-f-gl">{legend}</legend>
      <div className="nb-ex-f-opts">
        {[{ value: "", label: any }, ...options].map((option) => (
          <label key={option.value || "any"} className="nb-ex-f-opt nb-rh-pf-opt">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={value === option.value}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
