import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { pauseJobAction, resumeJobAction } from "@/server/actions/hire-offers";
import type { OfferStats, OfferV3, StatPeriod } from "@/server/services/hire-v3-offers";
import { donutSvg, lineChartSvg, sparkSvg } from "./charts";
import { HireIcon, type HireIconName } from "./icon";
import { HirePage, HirePageHead } from "./page-head";
import { HireShareButton } from "./share-button";

export const OFFER_TABS = ["toutes", "en-ligne", "pause", "brouillons", "statistiques"] as const;
export type OfferTabV3 = (typeof OFFER_TABS)[number];

/** The card colours of the prototype (`ACC`): background, ink and the gradient, in turn. */
const ACC: [string, string][] = [
  ["#DDF6CA", "#2B6E1B"],
  ["#DCEBFF", "#1F5FBF"],
  ["#ECE4FF", "#5B3FC4"],
  ["#FFE7CF", "#A4520B"],
  ["#FFF1B3", "#7A5F00"],
];
const ACC_VAR = ["var(--s5)", "var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)"];
const SOURCE_COLOURS = { direct: "#A6F26B", invitation: "#4C8DF6", talent_search: "#8B6CF0" };

const tabKey = (tab: OfferTabV3) => (tab === "en-ligne" ? "enLigne" : tab);

function stateOf(offer: OfferV3): "live" | "paused" | "draft" | "review" | "closed" {
  if (offer.status === "published") return "live";
  if (offer.status === "paused") return "paused";
  if (offer.status === "pending_review") return "review";
  if (offer.status === "closed") return "closed";
  return "draft";
}

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const dc = (n: number) => String(n).replace(".", ",");

/**
 * Offres of the recruiter's web app v3 (`V.offres` of docs/mvp-web-recruteur/prototype-v3, screens
 * 05-09): the cards three by line with the card « Nouvelle offre », or the statistics.
 */
export async function HireV3Offers({
  offers,
  tab,
  stats,
  canManage,
}: {
  offers: OfferV3[];
  tab: OfferTabV3;
  stats: OfferStats | null;
  canManage: boolean;
}) {
  const t = await getTranslations("hireV3Offers");
  const live = offers.filter((o) => o.status === "published").length;
  const received = offers.reduce((sum, o) => sum + o.figures.applications, 0);
  const tabs = OFFER_TABS.map((key) => ({
    label: t(`tabs.${tabKey(key)}`),
    href: key === "toutes" ? "/app/hire/offres" : `/app/hire/offres?onglet=${key}`,
    active: key === tab,
  }));
  const list = offers.filter((offer) => {
    const state = stateOf(offer);
    if (tab === "en-ligne") return state === "live";
    if (tab === "pause") return state === "paused";
    if (tab === "brouillons") return state === "draft" || state === "review";
    return state !== "closed" || tab === "toutes";
  });
  return (
    <HirePage view="offres">
      <HirePageHead
        title={t("title")}
        sub={t("sub", { live, count: received })}
        tabs={tabs}
        actions={
          <>
            <Link className="btn ghost" href="/app/hire/offres?onglet=toutes" scroll={false}>
              <HireIcon name="filter" />
              {t("filter")}
            </Link>
            {canManage ? (
              <Link className="btn pri" href="/app/hire/offres/nouvelle">
                <HireIcon name="plus" />
                {t("publish")}
              </Link>
            ) : null}
          </>
        }
      />
      {tab === "statistiques" && stats ? (
        <HireOfferStats stats={stats} />
      ) : (
        <div className="ogrid o3g">
          {list.map((offer, k) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              index={offers.indexOf(offer)}
              k={k}
              canManage={canManage}
            />
          ))}
          {canManage ? (
            <Link className="oc2 onew" href="/app/hire/offres/nouvelle">
              <span className="onew-ic">
                <HireIcon name="plus" size="l" />
              </span>
              <b>{t("new.title")}</b>
              <span className="meta">{t("new.sub")}</span>
            </Link>
          ) : list.length === 0 ? (
            <p className="meta">{t("empty")}</p>
          ) : null}
        </div>
      )}
    </HirePage>
  );
}

async function OfferCard({
  offer,
  index,
  k,
  canManage,
}: {
  offer: OfferV3;
  index: number;
  k: number;
  canManage: boolean;
}) {
  const t = await getTranslations("hireV3Offers");
  const [bg, fg] = ACC[index % ACC.length]!;
  const state = stateOf(offer);
  const style = { "--bg": bg, "--fg": fg, animationDelay: `${k * 60}ms` } as React.CSSProperties;
  const location = [offer.city, t(`remote.${offer.remote}`)].filter(Boolean).join(" · ");
  const top = (
    <>
      <div className="o3-top">
        <span className="o3dep">{offer.department ?? t("noDepartment")}</span>
        <span
          className={state === "live" ? "o3st live" : state === "paused" ? "o3st pa" : "o3st dr"}
        >
          {t(`status.${state}`)}
        </span>
      </div>
      <h4>{offer.title}</h4>
      <div className="o3loc">
        {location} · {t(`contract.${offer.contractType}`)}
      </div>
    </>
  );
  if (state === "draft" || state === "review")
    return (
      <div className="oc3 draft" style={style}>
        {top}
        <div className="o3k">
          <div>
            <span>{t("draft.steps")}</span>
            <b>{t("draft.stepsValue", { done: offer.steps })}</b>
          </div>
          <div>
            <span>{t("draft.description")}</span>
            <b>{offer.describedEnough ? t("draft.ready") : t("draft.toFinish")}</b>
          </div>
          <div>
            <span>{t("card.openings")}</span>
            <b>{offer.openings}</b>
          </div>
          <div>
            <span>{t("draft.orbi")}</span>
            <b>{t("draft.orbiReady")}</b>
          </div>
        </div>
        <div className="o3bar">
          <i style={{ flex: offer.steps, background: "#6F877E" }} />
          <i style={{ flex: 4 - offer.steps }} className="b0" />
        </div>
        <div className="o3lg">
          <span>{t("draft.orbiLine")}</span>
        </div>
        <div className="o3f">
          <Link className="btn sm ghost" href={`/app/hire/offres/${offer.id}/modifier`}>
            <HireIcon name="edit" size="s" />
            {t("draft.finish")}
          </Link>
        </div>
      </div>
    );
  const { fresh, screening, interview } = offer.split;
  return (
    <div className="oc3" style={style}>
      {top}
      <div className="o3k">
        <div>
          <span>{t("card.views")}</span>
          <b className="num">{fmt(offer.figures.views)}</b>
        </div>
        <div>
          <span>{t("card.applications")}</span>
          <b className="num">{offer.figures.applications}</b>
        </div>
        <div>
          <span>{t("card.openings")}</span>
          <b className="num">{offer.openings}</b>
        </div>
        <div>
          <span>{t("card.high")}</span>
          <b className="num">{offer.highPotential}</b>
        </div>
      </div>
      <div className="o3bar" title={t("card.split")}>
        <i style={{ flex: Math.max(fresh, 0.0001) }} className="b1" />
        <i style={{ flex: Math.max(screening, 0.0001) }} className="b2" />
        <i style={{ flex: Math.max(interview, 0.0001) }} className="b3" />
      </div>
      <div className="o3lg">
        <span>{t("card.fresh", { count: fresh })}</span>
        <span>{t("card.screening", { count: screening })}</span>
        <span>{t("card.interview", { count: interview })}</span>
      </div>
      <div className="o3f">
        <Link className="btn sm dark o3go" href={`/app/hire/offres/${offer.id}`}>
          {t("card.open")} <HireIcon name="right" size="s" />
        </Link>
        <span className="o3d">
          {state === "live"
            ? offer.daysLeft === null
              ? t("card.noEnd")
              : t("card.daysLeft", { count: offer.daysLeft })
            : state === "paused"
              ? t("card.pausedLine")
              : t(`status.${state}`)}
        </span>
        {state === "live" || state === "paused" ? (
          <HireShareButton
            path={`/offres/${offer.slug}`}
            label={t("card.share")}
            done={t("card.copied")}
          />
        ) : null}
        {canManage && (state === "live" || state === "paused") ? (
          <form action={state === "live" ? pauseJobAction : resumeJobAction}>
            <input type="hidden" name="id" value={offer.id} />
            <input type="hidden" name="back" value="/app/hire/offres" />
            <button
              type="submit"
              className="round"
              aria-label={state === "live" ? t("card.pause") : t("card.resume")}
            >
              <HireIcon name={state === "live" ? "pause2" : "play"} size="s" />
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function chartLabels(
  days: StatPeriod,
  length: number,
  t: (key: string, values: Record<string, number>) => string,
) {
  const step = Math.max(1, Math.round(length / 6));
  return [...Array(length).keys()]
    .filter((i) => i % step === 0 || i === length - 1)
    .map(
      (i) =>
        [i, days === 90 ? t("weekLabel", { n: i + 1 }) : t("dayLabel", { n: length - i })] as [
          number,
          string,
        ],
    );
}

/** Weeks for 90 days (13 points), days otherwise (`agg` of the prototype). */
function aggregate(series: number[], days: StatPeriod) {
  if (days !== 90) return series;
  const out: number[] = [];
  for (let i = 0; i < series.length; i += 7)
    out.push(series.slice(i, i + 7).reduce((a, b) => a + b, 0));
  return out;
}

async function HireOfferStats({ stats }: { stats: OfferStats }) {
  const t = await getTranslations("hireV3Offers.stats");
  const tChange = await getTranslations("hireV3Home.delta");
  const delta = (now: number, before: number) => {
    if (before <= 0) return null;
    const change = Math.round(((now - before) / before) * 100);
    if (change > 0) return <span className="delta up">{tChange("up", { value: change })}</span>;
    if (change < 0)
      return <span className="delta down">{tChange("down", { value: -change })}</span>;
    return <span className="delta flat">{tChange("stable")}</span>;
  };
  const apps = aggregate(stats.applications.series, stats.days);
  const previous = aggregate(stats.applications.previous, stats.days);
  const viewsSeries = aggregate(stats.views.series, stats.days);
  const rateSeries = viewsSeries.map((v, i) =>
    v ? Math.round(((apps[i] ?? 0) / v) * 1000) / 10 : 0,
  );
  const tiles: {
    key: string;
    label: string;
    icon: HireIconName;
    value: string;
    delta: React.ReactNode;
    spark: number[];
  }[] = [
    {
      key: "views",
      label: t("views"),
      icon: "eye",
      value: fmt(stats.views.total),
      delta: delta(stats.views.total, stats.views.before),
      spark: viewsSeries,
    },
    {
      key: "applications",
      label: t("applications"),
      icon: "mail",
      value: String(stats.applications.total),
      delta: delta(stats.applications.total, stats.applications.before),
      spark: apps,
    },
    {
      key: "rate",
      label: t("rate"),
      icon: "trend",
      value: t("rateValue", { value: dc(stats.rate.total) }),
      delta: delta(stats.rate.total, stats.rate.before),
      spark: rateSeries,
    },
    {
      key: "interviews",
      label: t("interviews"),
      icon: "video",
      value: String(stats.interviews.total),
      delta: delta(stats.interviews.total, stats.interviews.before),
      spark: apps,
    },
  ];
  const total = stats.sources.reduce((sum, s) => sum + s.count, 0);
  const viewsMax = Math.max(1, ...stats.offers.map((o) => o.views));
  const appsMax = Math.max(1, ...stats.offers.map((o) => o.applications));
  return (
    <>
      <div className="stbar">
        <div className="tabs sm">
          {([7, 30, 90] as const).map((days) => (
            <Link
              key={days}
              className={days === stats.days ? "on" : undefined}
              href={`/app/hire/offres?onglet=statistiques&periode=${days}`}
              scroll={false}
            >
              {t("days", { count: days })}
            </Link>
          ))}
        </div>
        <span className="meta">{t("range", { count: stats.days })}</span>
        <Link
          className="btn ghost sm"
          style={{ marginLeft: "auto" }}
          href="/app/hire/offres/rapport"
        >
          <HireIcon name="dl" size="s" />
          {t("report")}
        </Link>
      </div>
      <div className="stk">
        {tiles.map((tile, i) => (
          <div key={tile.key} className={i === 3 ? "stile lm" : "stile"}>
            <span className="row">
              <span className="t">{tile.label}</span>
              <span className="chip-ic" style={{ marginLeft: "auto" }}>
                <HireIcon name={tile.icon} size="s" />
              </span>
            </span>
            <b className="num">{tile.value}</b>
            <span className="row" style={{ gap: 8 }}>
              {tile.delta}
              <span className="stm">
                {t("detail")} <HireIcon name="right" size="s" />
              </span>
            </span>
            <span
              className="stsp"
              dangerouslySetInnerHTML={{
                __html: sparkSvg(tile.spark.slice(-8), 110, 30, i === 3 ? "#0F3F37" : undefined),
              }}
            />
          </div>
        ))}
      </div>
      <div className="stgrid">
        <div className="card">
          <div className="ch">
            <span className="chip-ic">
              <HireIcon name="chart" size="s" />
            </span>
            <h3>{t("overTime")}</h3>
            <div className="r">
              <span className="legend">
                <span>
                  <i style={{ background: "#0E1B17" }} />
                  {t("thisPeriod")}
                </span>
                <span>
                  <i style={{ background: "#0F3F37", opacity: 0.5 }} />
                  {t("previous")}
                </span>
              </span>
            </div>
          </div>
          <div
            dangerouslySetInnerHTML={{
              __html: lineChartSvg({
                data: apps,
                data2: previous,
                labels: chartLabels(stats.days, apps.length, (key, values) =>
                  t(key as "dayLabel", values),
                ),
                h: 230,
                w: 720,
                unit: t("unit"),
              }),
            }}
          />
        </div>
        <div className="card">
          <div className="ch">
            <span className="chip-ic">
              <HireIcon name="globe" size="s" />
            </span>
            <h3>{t("sources")}</h3>
          </div>
          <div className="row" style={{ gap: 16, alignItems: "center" }}>
            <span
              style={{ display: "contents" }}
              dangerouslySetInnerHTML={{
                __html: donutSvg(
                  stats.sources.map((s) => [s.count || (total ? 0 : 1), SOURCE_COLOURS[s.source]]),
                  140,
                  String(total),
                  t("sourcesLabel"),
                ),
              }}
            />
            <div className="stack" style={{ gap: 4, flex: 1, minWidth: 0 }}>
              {stats.sources.map((s) => (
                <div key={s.source} className="srow">
                  <i style={{ background: SOURCE_COLOURS[s.source] }} />
                  <span>{t(`source.${s.source}`)}</span>
                  <b>{s.count}</b>
                  <span className="meta">
                    {t("share", { value: total ? Math.round((s.count / total) * 100) : 0 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="ch">
          <span className="chip-ic">
            <HireIcon name="offres" size="s" />
          </span>
          <h3>{t("byOffer")}</h3>
          <div className="r">
            <span className="meta">{t("byOfferHint")}</span>
          </div>
        </div>
        <div className="otab">
          <div className="oth">
            <span>{t("col.offer")}</span>
            <span>{t("col.views")}</span>
            <span>{t("col.applications")}</span>
            <span>{t("col.rate")}</span>
            <span>{t("col.high")}</span>
            <span />
          </div>
          {stats.offers.length === 0 ? <p className="meta">{t("noOffer")}</p> : null}
          {stats.offers.map((o, i) => (
            <Link key={o.id} className="otr" href={`/app/hire/offres/${o.id}`}>
              <span className="row" style={{ gap: 10, minWidth: 0 }}>
                <span className="ot" style={{ background: ACC_VAR[i % 5] }}>
                  <HireIcon name="briefcase" size="s" />
                </span>
                <b className="tr">{o.title}</b>
              </span>
              <span>
                <b className="num">{fmt(o.views)}</b>
                <span className="mbar">
                  <i style={{ width: `${(o.views / viewsMax) * 100}%` }} />
                </span>
              </span>
              <span>
                <b className="num">{o.applications}</b>
                <span className="mbar">
                  <i
                    style={{ width: `${(o.applications / appsMax) * 100}%`, background: "#86DA4C" }}
                  />
                </span>
              </span>
              <span>
                <b className="num">{t("rateValue", { value: dc(o.rate) })}</b>
              </span>
              <span>
                <span className="ochip lime">
                  <HireIcon name="spark2" size="s" />
                  {o.high}
                </span>
              </span>
              <span style={{ textAlign: "right" }}>
                <HireIcon name="chev" size="s" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
