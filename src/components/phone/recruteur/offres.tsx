import "server-only";
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
import { ensureStages } from "@/server/services/applications";
import { requestedDocumentKinds, type OfferRow } from "@/server/services/hire-offers";
import { screeningQuestionsOf } from "@/server/services/screening";
import { MenuArt } from "@/components/site/menu-art";
import { saveFiltersAction, sortGestureAction } from "@/server/actions/hire-tri";
import { RhFiltersSheet, SwipeCard } from "./tri-client";
import { RhUndoGesture } from "./tri";
import { countryCode, countryName, flagOf } from "@/lib/countries";
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
  filterConfidences,
  filterSources,
  filterStates,
  parseFilters,
  passes,
} from "@/server/services/hire-filters";
import { OrbiDisc, PhoneIcon } from "../icon";
import { FilAvatar } from "../fil/avatar";
import { Verified } from "../explorer/cards";
import { tintOf } from "./candidatures";
import { RhOfferActions, RhWhy, type RhOfferActionsData } from "./offre-actions";
import type { RhOfferDraft, RhPublishData } from "./publier";

const DAY = 86_400_000;

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
  | "expired";

const statusKey = (job: { status: OfferRow["status"]; closesAt: Date | null }, now: Date) =>
  (job.status === "published" && job.closesAt && job.closesAt <= now
    ? "expired"
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
                href={`${href}?vue=candidats`}
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

/** A tile of the offer page: a link to the pipeline when there is someone to see. */
function Tile({ href, ton, children }: { href: string | null; ton: string; children: ReactNode }) {
  return href ? (
    <Link href={href} data-ton={ton} data-lien="">
      {children}
    </Link>
  ) : (
    <p data-ton={ton}>{children}</p>
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
};

/**
 * One offer on the recruiter's phone (Modèle B recruteur, M4, planche Recruteur-offre-detail): its
 * status and dates, four real figures, Orbi's line with « Pourquoi ? », applications per day over 7
 * or 30 days, where the candidates come from, then « Voir les N candidats ».
 */
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
}: {
  ctx: HireContext;
  job: DetailJob;
  /** « Vue d'ensemble · Candidats · Retenus » (03/11/2026), under the title. */
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
  const format = await getFormatter();
  const since = new Date(now.getTime() - (period - 1) * DAY);
  since.setUTCHours(0, 0, 0, 0);
  const [applications, canExport, stages, viewDays] = await Promise.all([
    db.application.findMany({
      where: { jobId: job.id },
      select: {
        createdAt: true,
        source: true,
        status: true,
        stageId: true,
        _count: { select: { interviews: true } },
        events: {
          where: { type: { in: ["stage_changed", "decision"] } },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
    can(db, { type: "organization", id: ctx.organizationId }, "reports.export"),
    ensureStages(db, job.id),
    db.jobViewDay.findMany({ where: { jobId: job.id, day: { gte: since } } }),
  ]);
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
        ? t("detail.online", { count: online })
        : null,
    !ended && left !== null && left > 0 ? t("detail.left", { count: left }) : null,
  ].filter(Boolean);
  const rate = figures.views > 0 ? (figures.applications / figures.views) * 100 : null;
  const bars = Array.from({ length: period }, (_, index) => {
    const start = new Date(since.getTime() + index * DAY);
    const count = applications.filter(
      (row) => row.createdAt >= start && row.createdAt.getTime() < start.getTime() + DAY,
    ).length;
    return { start, count };
  });
  const top = Math.max(1, ...bars.map((bar) => bar.count));
  const viewBars = bars.map((bar) => ({
    start: bar.start,
    count: viewDays
      .filter(
        (row) =>
          row.day.getTime() >= bar.start.getTime() && row.day.getTime() < bar.start.getTime() + DAY,
      )
      .reduce((sum, row) => sum + row.count, 0),
  }));
  const viewTop = Math.max(1, ...viewBars.map((bar) => bar.count));
  const delays = applications
    .filter((row) => row.events[0])
    .map((row) => (row.events[0]!.createdAt.getTime() - row.createdAt.getTime()) / DAY);
  const responseDays = delays.length
    ? Math.round((delays.reduce((sum, value) => sum + value, 0) / delays.length) * 10) / 10
    : null;
  const pipelineHref = `/app/hire/offres/${job.id}?vue=candidats`;
  const live = applications.filter((row) => row.status !== "withdrawn");
  const stageRows = stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    kind: stage.kind,
    count: live.filter((row) => row.stageId === stage.id).length,
  }));
  const stageTop = Math.max(1, ...stageRows.map((row) => row.count));
  const sources = (["direct", "invitation", "talent_search"] as const).map((source) => ({
    source,
    count: applications.filter((row) => row.source === source).length,
  }));
  const hired = applications.filter((row) => row.status === "hired").length;
  // People met at least once (not the number of meetings).
  const interviewed = applications.filter((row) => row._count.interviews > 0).length;
  const share = (part: number, whole: number) =>
    whole > 0
      ? format.number(Math.min(1, part / whole), { style: "percent", maximumFractionDigits: 1 })
      : "–";
  const funnel = [
    { key: "views", count: figures.views, share: null },
    {
      key: "applications",
      count: figures.applications,
      share: share(figures.applications, figures.views),
    },
    {
      key: "opened",
      count: Math.max(0, figures.applications - figures.unseen),
      share: share(figures.applications - figures.unseen, figures.applications),
    },
    {
      key: "interviews",
      count: interviewed,
      share: share(interviewed, figures.applications),
    },
    { key: "hired", count: hired, share: share(hired, figures.applications) },
  ] as const;
  const funnelTop = Math.max(1, ...funnel.map((row) => row.count));
  const sourceTop = Math.max(1, ...sources.map((row) => row.count));
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
  };
  const orbi =
    figures.unseen > 0
      ? t("detail.orbiWaiting", { count: figures.unseen })
      : figures.applications === 0 && job.publishedAt
        ? t("detail.orbiNone")
        : t("detail.orbiDone");
  return (
    <RhOffresTexts>
      <div className="nb-page nb-rh-detail">
        <header className="nb-rh-barre">
          <Link href="/app/hire/offres" className="nb-rh-retour">
            <PhoneIcon name="retour" size={20} />
            {t("detail.back")}
          </Link>
          <RhOfferActions data={actions} />
        </header>
        <section className="nb-rh-detail-h">
          <span className="nb-rh-statut" data-statut={status}>
            {status === "published" ? <i className="nb-rh-pouls" aria-hidden /> : null}
            {t(`status.${status}`)}
          </span>
          <h1>{job.title}</h1>
          <p className="nb-meta">
            {[
              job.city,
              t(`contract.${job.contractType}` as "contract.cdi"),
              t(`remote.${job.remote}` as "remote.onsite"),
            ].join(" · ")}
          </p>
          <p className="nb-meta">{dates.join(" · ")}</p>
          {notice ? (
            <p className="nb-erreur" role="alert">
              {notice}
            </p>
          ) : null}
        </section>
        {tabs}
        <div className="nb-rh-detail-corps">
          <div className="nb-rh-tuiles">
            <p data-ton="vues">
              <MenuArt name="why" size="sm" />
              <b>{format.number(figures.views)}</b>
              {t("figures.views", { count: figures.views })}
            </p>
            <Tile href={figures.applications > 0 ? pipelineHref : null} ton="cand">
              <MenuArt name="people" size="sm" />
              <b>{format.number(figures.applications)}</b>
              {t("figures.applications", { count: figures.applications })}
            </Tile>
            <p data-ton="taux">
              <MenuArt name="career" size="sm" />
              <b>
                {rate === null
                  ? "–"
                  : format.number(rate / 100, {
                      style: "percent",
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
              </b>
              {t("figures.rate")}
            </p>
            <Tile href={figures.unseen > 0 ? pipelineHref : null} ton="nouv">
              <MenuArt name="bell" size="sm" />
              <b data-lime="">{figures.unseen}</b>
              {t("figures.unseen", { count: figures.unseen })}
            </Tile>
            <p data-ton="jours">
              <MenuArt name={left !== null && !ended ? "calendar" : "clock"} size="sm" />
              <b>{left !== null && !ended ? Math.max(0, left) : online}</b>
              {left !== null && !ended
                ? t("detail.tileLeft", { count: Math.max(0, left) })
                : t("figures.days", { count: online })}
            </p>
            <p data-ton="delai">
              <MenuArt name="hourglass" size="sm" />
              <b>{responseDays === null ? "–" : format.number(responseDays)}</b>
              {responseDays === null ? t("detail.tileNoResponse") : t("detail.tileResponse")}
            </p>
          </div>
          <div className="nb-rh-orbi-ligne nb-rh-orbi-offre">
            <OrbiDisc size={40} />
            <span>{orbi}</span>
            <RhWhy label={t("detail.why")} text={t("detail.whyText")} />
          </div>
          <section className="nb-rh-carte-stat" aria-labelledby="rh-pipe-t">
            <div className="nb-rh-courbe-h">
              <h2 id="rh-pipe-t">
                <MenuArt name="pipeline" size="xs" />
                {t("detail.pipeline")}
              </h2>
              {figures.applications > 0 ? (
                <Link href={pipelineHref} className="nb-rh-lien-stat">
                  {t("detail.pipelineSee")}
                  <PhoneIcon name="chevron" size={14} />
                </Link>
              ) : null}
            </div>
            <ol className="nb-rh-etapes-stat">
              {stageRows.map((row) => (
                <li key={row.id} data-kind={row.kind}>
                  <Link href={`${pipelineHref}#etape-${row.id}`}>
                    <span>{row.name}</span>
                    <span className="nb-rh-jauge" aria-hidden>
                      <span
                        style={{
                          width: `${row.count ? Math.max(4, (row.count / stageTop) * 100) : 0}%`,
                        }}
                      />
                    </span>
                    <b>{row.count}</b>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
          <section className="nb-rh-carte-stat" aria-labelledby="rh-funnel-t">
            <h2 id="rh-funnel-t">
              <MenuArt name="funnel" size="xs" />
              {t("detail.funnel")}
            </h2>
            <ol className="nb-rh-entonnoir">
              {funnel.map((row) => (
                <li key={row.key} data-step={row.key}>
                  <span className="nb-rh-entonnoir-t">
                    <span>{t(`detail.funnelStep.${row.key}`)}</span>
                    <b>{format.number(row.count)}</b>
                    {row.share ? (
                      <small>{t("detail.funnelShare", { share: row.share })}</small>
                    ) : null}
                  </span>
                  <span className="nb-rh-jauge" aria-hidden>
                    <span
                      style={{
                        width: `${row.count ? Math.max(3, (row.count / funnelTop) * 100) : 0}%`,
                      }}
                    />
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <section className="nb-rh-courbe nb-rh-carte-stat" aria-labelledby="rh-courbe-t">
            <div className="nb-rh-courbe-h">
              <h2 id="rh-courbe-t">
                <MenuArt name="career" size="xs" />
                {t("detail.chart")}
              </h2>
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
              bars={bars}
              top={top}
              period={period}
              label={t("detail.chartLabel", {
                count: bars.reduce((sum, bar) => sum + bar.count, 0),
                days: period,
              })}
              added={(count) => t("detail.added", { count })}
              weekday={(date) => format.dateTime(date, { weekday: "short" }).replace(".", "")}
            />
          </section>
          <section className="nb-rh-courbe nb-rh-carte-stat" aria-labelledby="rh-vues-t">
            <h2 id="rh-vues-t">
              <MenuArt name="why" size="xs" />
              {t("detail.views")}
            </h2>
            <Bars
              bars={viewBars}
              top={viewTop}
              period={period}
              tone="vues"
              label={t("detail.viewsLabel", {
                count: viewBars.reduce((sum, bar) => sum + bar.count, 0),
                days: period,
              })}
              added={(count) => String(count)}
              weekday={(date) => format.dateTime(date, { weekday: "short" }).replace(".", "")}
            />
          </section>
          <section className="nb-rh-sources nb-rh-carte-stat" aria-labelledby="rh-sources-t">
            <h2 id="rh-sources-t">
              <MenuArt name="partners" size="xs" />
              {t("detail.sources")}
            </h2>
            {sources.map((row) => (
              <div key={row.source} className="nb-rh-source">
                <p>
                  <span>{t(`source.${row.source}`)}</span>
                  <b>{row.count}</b>
                </p>
                <span className="nb-rh-jauge" aria-hidden>
                  <span
                    style={{
                      width: `${row.count ? Math.max(4, (row.count / sourceTop) * 100) : 0}%`,
                    }}
                  />
                </span>
              </div>
            ))}
          </section>
        </div>
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
