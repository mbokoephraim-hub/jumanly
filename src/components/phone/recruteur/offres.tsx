import "server-only";
import Link from "next/link";
import type { ReactNode } from "react";
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
import { OrbiDisc, PhoneIcon } from "../icon";
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

/**
 * The Offres tab of the recruiter's phone (Modèle B recruteur, M4, planches Recruteur-offres and
 * -offres-encours): the line of figures, « Toutes · En cours · Terminées », then one card per offer
 * with its status, its new applications and three real figures. Every offer is the organization's
 * (`jobScope`).
 */
export async function RhOffersList({
  offers,
  filter,
  now,
}: {
  offers: OfferRow[];
  filter: RhOfferFilter;
  now: Date;
}) {
  const t = await getTranslations("phoneRhOffres");
  const format = await getFormatter();
  const shown = offers.filter((offer) => inFilter(offer, filter));
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
        <ul className="nb-rh-cartes">
          {shown.map((offer) => {
            const status = statusKey(offer, now);
            const online = daysSince(offer.publishedAt, now);
            const left = offer.closesAt
              ? Math.ceil((offer.closesAt.getTime() - now.getTime()) / DAY)
              : null;
            return (
              <li key={offer.id}>
                <Link href={`/app/hire/offres/${offer.id}`} className="nb-rh-offre">
                  <span className="nb-rh-offre-h">
                    <span className="nb-rh-statut" data-statut={status}>
                      {t(`status.${status}`)}
                    </span>
                    {offer.figures.unseen > 0 ? (
                      <span className="nb-rh-nouv">
                        {t("list.new", { count: offer.figures.unseen })}
                      </span>
                    ) : null}
                    <PhoneIcon name="chevron" size={16} />
                  </span>
                  <b className="nb-rh-offre-t">{offer.title}</b>
                  <span className="nb-meta">
                    {[offer.city, t(`contract.${offer.contractType}`)].join(" · ")}
                  </span>
                  <span className="nb-rh-chiffres">
                    <span data-ton="vues">
                      <span className="nb-rh-chiffre-h">
                        <i aria-hidden>
                          <PhoneIcon name="oeil" size={16} />
                        </i>
                        <b>{offer.figures.views}</b>
                      </span>
                      {t("tile.views", { count: offer.figures.views })}
                    </span>
                    <span data-ton="jours">
                      <span className="nb-rh-chiffre-h">
                        <i aria-hidden>
                          <PhoneIcon name="horloge" size={16} />
                        </i>
                        <b>{offer.publishedAt ? t("tile.daysValue", { count: online }) : "–"}</b>
                      </span>
                      {t("tile.online")}
                    </span>
                    <span data-ton="cand">
                      <span className="nb-rh-chiffre-h">
                        <i aria-hidden>
                          <PhoneIcon name="candidatures" size={16} />
                        </i>
                        <b>{offer.figures.applications}</b>
                      </span>
                      {t("tile.applications", { count: offer.figures.applications })}
                    </span>
                  </span>
                  {offer.figures.views > 0 ? (
                    <span className="nb-rh-taux">
                      <span>
                        {t("list.rate")}
                        <b>
                          {format.number(
                            Math.min(1, offer.figures.applications / offer.figures.views),
                            { style: "percent", maximumFractionDigits: 1 },
                          )}
                        </b>
                      </span>
                      <span className="nb-rh-taux-barre" aria-hidden>
                        <span
                          style={{
                            width: `${Math.max(3, Math.min(100, (offer.figures.applications / offer.figures.views) * 100))}%`,
                          }}
                        />
                      </span>
                    </span>
                  ) : null}
                  <span className="nb-meta nb-rh-offre-pied">
                    <PhoneIcon name="agenda" size={14} />
                    {offer.publishedAt
                      ? status === "closed" || status === "expired"
                        ? t("list.ended")
                        : left !== null && left >= 0
                          ? t("list.closes", { count: left })
                          : t("list.online", { count: online })
                      : t("list.notPublished")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
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
}: {
  ctx: HireContext;
  job: DetailJob;
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
        <div className="nb-rh-detail-corps">
          <div className="nb-rh-tuiles">
            <p data-ton="vues">
              <i aria-hidden>
                <PhoneIcon name="oeil" size={18} />
              </i>
              <b>{format.number(figures.views)}</b>
              {t("figures.views", { count: figures.views })}
            </p>
            <Tile href={figures.applications > 0 ? pipelineHref : null} ton="cand">
              <i aria-hidden>
                <PhoneIcon name="candidatures" size={18} />
              </i>
              <b>{format.number(figures.applications)}</b>
              {t("figures.applications", { count: figures.applications })}
            </Tile>
            <p data-ton="taux">
              <i aria-hidden>
                <PhoneIcon name="tendance" size={18} />
              </i>
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
              <i aria-hidden>
                <PhoneIcon name="cloche" size={18} />
              </i>
              <b data-lime="">{figures.unseen}</b>
              {t("figures.unseen", { count: figures.unseen })}
            </Tile>
            <p data-ton="jours">
              <i aria-hidden>
                <PhoneIcon name={left !== null && !ended ? "agenda" : "horloge"} size={18} />
              </i>
              <b>{left !== null && !ended ? Math.max(0, left) : online}</b>
              {left !== null && !ended
                ? t("detail.tileLeft", { count: Math.max(0, left) })
                : t("figures.days", { count: online })}
            </p>
            <p data-ton="delai">
              <i aria-hidden>
                <PhoneIcon name="minuteur" size={18} />
              </i>
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
                <PhoneIcon name="candidatures" size={18} />
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
              <PhoneIcon name="entonnoir" size={18} />
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
                <PhoneIcon name="tendance" size={18} />
                {t("detail.chart")}
              </h2>
              <nav className="nb-rh-periode" aria-label={t("detail.period")}>
                {([7, 30] as const).map((days) => (
                  <Link
                    key={days}
                    href={
                      days === 7
                        ? `/app/hire/offres/${job.id}`
                        : `/app/hire/offres/${job.id}?jours=30`
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
              <PhoneIcon name="oeil" size={18} />
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
              <PhoneIcon name="lien" size={18} />
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
 * The pipeline of one offer (Ephraïm, 01/11/2026): every stage in order, with its candidates, so the
 * recruiter sees at once who applied and where each person is. Each card opens the file, with
 * shortcuts to the CV and to the documents sent. Ranked by match with the offer inside a stage,
 * never by name, age or photo; the recruiter decides.
 */
export async function RhOfferCandidates({
  ctx,
  jobId,
  unseen,
}: {
  ctx: HireContext;
  jobId: string;
  unseen: number;
}) {
  const t = await getTranslations("phoneRhOffres");
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
        <p className="nb-meta">{t("pipeline.lead")}</p>
      </section>
      <nav className="nb-rh-pipe-nav" aria-label={t("pipeline.stages")}>
        {columns.map((column) => (
          <a key={column.id} href={`#etape-${column.id}`} data-kind={column.kind}>
            {column.name}
            <b>{column.rows.length}</b>
          </a>
        ))}
      </nav>
      <p className="nb-meta nb-rh-regle">
        {board.withScores ? t("candidates.rule") : t("candidates.ruleNoScore")}
      </p>
      <div className="nb-rh-pipe-etapes">
        {columns.map((column, index) => (
          <section
            key={column.id}
            id={`etape-${column.id}`}
            className="nb-rh-pipe-etape"
            data-kind={column.kind}
            aria-labelledby={`etape-${column.id}-t`}
          >
            <h2 id={`etape-${column.id}-t`}>
              <span className="nb-rh-pipe-num" aria-hidden>
                {column.kind === "withdrawn" ? "–" : index + 1}
              </span>
              {column.name}
              <b>{column.rows.length}</b>
            </h2>
            {column.rows.length === 0 ? (
              <p className="nb-meta nb-rh-pipe-vide">{t("pipeline.empty")}</p>
            ) : (
              <ul>
                {column.rows.map((row) => {
                  const position = followed.findIndex((stage) => stage.id === column.id);
                  return (
                    <li key={row.id} className="nb-rh-pipe-carte">
                      <Link href={`/app/hire/candidats/${row.id}`} className="nb-rh-cand">
                        <span className="nb-rh-mini" aria-hidden>
                          {initials(row.name)}
                        </span>
                        <span className="nb-rh-res-t">
                          <b>{row.name}</b>
                          <span className="nb-meta">
                            {[row.facts[0]?.skill, row.city].filter(Boolean).join(" · ")}
                          </span>
                          <span className="nb-meta">
                            {t("pipeline.applied", {
                              when: format.relativeTime(row.createdAt, now),
                            })}
                          </span>
                        </span>
                        {row.score !== null ? (
                          <span className="nb-rh-score">
                            {format.number(row.score / 100, { style: "percent" })}
                          </span>
                        ) : null}
                      </Link>
                      {position >= 0 ? (
                        <span
                          className="nb-rh-pipe-points"
                          role="img"
                          aria-label={t("pipeline.step", {
                            index: position + 1,
                            total: followed.length,
                          })}
                        >
                          {followed.map((stage, at) => (
                            <i key={stage.id} data-fait={at <= position ? "" : undefined} />
                          ))}
                        </span>
                      ) : null}
                      <span className="nb-rh-pipe-acces">
                        <Link href={`/app/hire/candidats/${row.id}?onglet=cv`}>
                          <PhoneIcon name="cv" size={16} />
                          {t("pipeline.cv")}
                        </Link>
                        <Link href={`/app/hire/candidats/${row.id}?onglet=reponses`}>
                          <PhoneIcon name="document" size={16} />
                          {t("pipeline.documents")}
                        </Link>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
      <div className="nb-bas">
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
