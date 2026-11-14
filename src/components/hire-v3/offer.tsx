import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { siteUrl } from "@/lib/seo";
import type { OfferV3Detail } from "@/server/services/hire-v3-offer";
import { avatarColor, initialsOf } from "./avatar";
import { barsWaveSvg, donutSvg, lineChartSvg, ringHtml } from "./charts";
import { clsOf } from "./score-class";
import { HireIcon, type HireIconName } from "./icon";
import { HirePage, HirePageHead } from "./page-head";
import { HireShareButton } from "./share-button";

export const OFFER_DETAIL_TABS = ["apercu", "annonce", "partage"] as const;
export type OfferDetailTab = (typeof OFFER_DETAIL_TABS)[number];

const G = "#3FAE3A";
const FUNNEL_COLOURS = ["#0F3F37", "#1B5040", "#3FAE3A", "#7DD84A", "#B9F17F"];
const FUNNEL_WIDTHS = [100, 72, 48, 30, 18];
const SOURCE_COLOURS = { direct: "#0F3F37", invitation: "#4C8DF6", talent_search: "#A6F26B" };
const EXAMPLE_COLOURS = ["#0F3F37", "#2F6B4A", "#3FAE3A", "#7DD84A", "#B9F17F", "#D7F7B5"];

function Head({
  title,
  icon,
  right,
}: {
  title: string;
  icon?: HireIconName;
  right?: React.ReactNode;
}) {
  return (
    <div className="ch">
      {icon ? (
        <span className="chip-ic">
          <HireIcon name={icon} size="s" />
        </span>
      ) : null}
      <h3>{title}</h3>
      <div className="r">{right}</div>
    </div>
  );
}

/**
 * La fiche d'une offre (`V.offre` of the prototype v3, screen 08): « Aperçu », « Annonce » and
 * « Partage », with the offer's real figures.
 */
export async function HireV3Offer({
  offer,
  tab,
  canManage,
  canRead,
}: {
  offer: OfferV3Detail;
  tab: OfferDetailTab;
  canManage: boolean;
  canRead: boolean;
}) {
  const t = await getTranslations("hireV3Offer");
  const to = await getTranslations("hireV3Offers");
  const format = await getFormatter();
  const base = `/app/hire/offres/${offer.id}`;
  const tabs = OFFER_DETAIL_TABS.map((key) => ({
    label: t(`tabs.${key}`),
    href: key === "apercu" ? base : `${base}?onglet=${key}`,
    active: key === tab,
  }));
  const live = offer.status === "published";
  const state =
    offer.status === "published"
      ? "live"
      : offer.status === "paused"
        ? "paused"
        : offer.status === "pending_review"
          ? "review"
          : offer.status === "closed"
            ? "closed"
            : "draft";
  const crumb = (
    <div className="meta">
      <Link href="/app/hire/offres">{t("crumb")}</Link> / {offer.title}
    </div>
  );
  const day = (date: Date) => format.dateTime(date, { day: "numeric", month: "long" });
  const where = `${offer.city} · ${to(`remote.${offer.remote}`)}`;
  const candidatesHref = `/app/hire/candidats?offre=${offer.id}`;

  if (tab === "annonce")
    return (
      <HirePage view="offre">
        <HirePageHead
          title={t("ad.title")}
          back={{ href: "/app/hire/offres", label: t("crumb") }}
          crumb={crumb}
          tabs={tabs}
          actions={
            <>
              {live ? (
                <Link className="btn ghost" href={`/offres/${offer.slug}`} target="_blank">
                  <HireIcon name="eye" />
                  {t("ad.preview")}
                </Link>
              ) : null}
              {canManage ? (
                <Link className="btn sap" href={`${base}/modifier`}>
                  <HireIcon name="edit" />
                  {t("ad.edit")}
                </Link>
              ) : null}
            </>
          }
        />
        <div className="tsgrid ofg">
          <div className="tsbox ofad">
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              {offer.department ? (
                <span className="tsdom" style={{ "--c": G } as React.CSSProperties}>
                  <i />
                  {offer.department}
                </span>
              ) : null}
              <span className={live ? "tsst live" : "tsst"}>
                <i />
                {to(`status.${state}`)}
              </span>
            </div>
            <h2>{offer.title}</h2>
            <p className="ofp">{offer.description}</p>
            <div className="ofk">
              {(
                [
                  ["offres", t("ad.contract"), to(`contract.${offer.contractType}`)],
                  ["pin", t("ad.place"), where],
                  [
                    "cal",
                    t("ad.closing"),
                    offer.closesAt ? day(offer.closesAt) : t("kpi.noClosingSub"),
                  ],
                  ["users", t("ad.openings"), String(offer.openings)],
                ] as [HireIconName, string, string][]
              ).map(([icon, label, value]) => (
                <div key={label}>
                  <span className="chip-ic">
                    <HireIcon name={icon} size="s" />
                  </span>
                  <span>
                    <em>{label}</em>
                    <b>{value}</b>
                  </span>
                </div>
              ))}
            </div>
            <h3>{t("ad.missions")}</h3>
            <div className="ofm">
              {offer.responsibilities.length === 0 ? (
                <p className="meta">{t("ad.noMissions")}</p>
              ) : null}
              {offer.responsibilities.map((mission, i) => (
                <div key={i}>
                  <b>{i + 1}</b>
                  <span>{mission}</span>
                </div>
              ))}
            </div>
            <h3>{t("ad.skills")}</h3>
            <div className="ofsk">
              {offer.skills.length === 0 ? <p className="meta">{t("ad.noSkills")}</p> : null}
              {offer.skills.some((s) => s.required) ? (
                <span className="ofskl">{t("ad.required")}</span>
              ) : null}
              {offer.skills
                .filter((s) => s.required)
                .map((s) => (
                  <span key={s.name} className="ofs on">
                    <HireIcon name="check" size="s" />
                    {s.name}
                  </span>
                ))}
              {offer.skills.some((s) => !s.required) ? (
                <span className="ofskl">{t("ad.preferred")}</span>
              ) : null}
              {offer.skills
                .filter((s) => !s.required)
                .map((s) => (
                  <span key={s.name} className="ofs">
                    {s.name}
                  </span>
                ))}
            </div>
          </div>
          <div className="tsbox ofcr">
            <div className="tsh">
              <h3>{t("ad.criteria")}</h3>
            </div>
            <div className="meta" style={{ margin: "-4px 0 12px" }}>
              {t("ad.criteriaSub")}
            </div>
            {offer.weights.map((w) => (
              <div key={w.key} className="ofcrr">
                <div className="row" style={{ fontSize: 13 }}>
                  <span>{t(`criterion.${w.key}`)}</span>
                  <b className="num" style={{ marginLeft: "auto" }}>
                    {t("ad.weight", { value: w.share })}
                  </b>
                </div>
                <span className="tsbar">
                  <i style={{ width: `${Math.min(100, w.share * 2.5)}%`, background: G }} />
                </span>
              </div>
            ))}
            {offer.example && canRead ? (
              <div className="ofex">
                <div className="row" style={{ fontSize: 12.5 }}>
                  <span>
                    {t("ad.example")} <b>{offer.example.name}</b>
                  </span>
                  <b className="num" style={{ marginLeft: "auto" }}>
                    {t("ad.exampleScore", { value: offer.example.score })}
                  </b>
                </div>
                <span className="ofexb">
                  {offer.example.points.map((p, i) => (
                    <i
                      key={p.key}
                      style={{
                        width: `${p.points}%`,
                        background: EXAMPLE_COLOURS[i % EXAMPLE_COLOURS.length],
                      }}
                      title={t(`criterion.${p.key}`)}
                    />
                  ))}
                </span>
                <div className="meta" style={{ fontSize: 11.5 }}>
                  {t("ad.exampleLine", {
                    points: offer.example.points.map((p) => p.points).join(" + "),
                  })}
                </div>
              </div>
            ) : null}
            <div className="ofnote">
              <HireIcon name="shield" size="s" />
              <span>{t("ad.note")}</span>
            </div>
          </div>
        </div>
      </HirePage>
    );

  if (tab === "partage") {
    const total = offer.sources.reduce((sum, s) => sum + s.count, 0);
    const max = Math.max(1, ...offer.sources.map((s) => s.count));
    const path = `/offres/${offer.slug}`;
    const message = t("sh.message", { title: offer.title });
    const channels: { key: string; mark: React.ReactNode; colour: string; href: string }[] = [
      {
        key: "linkedin",
        mark: "in",
        colour: "#0A66C2",
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${siteUrl()}${path}`)}`,
      },
      {
        key: "whatsapp",
        mark: "W",
        colour: "#25A244",
        href: `https://wa.me/?text=${encodeURIComponent(`${message} ${siteUrl()}${path}`)}`,
      },
      { key: "page", mark: <HireIcon name="globe" />, colour: "#0F3F37", href: path },
    ];
    return (
      <HirePage view="offre">
        <HirePageHead
          title={t("sh.title")}
          back={{ href: "/app/hire/offres", label: t("crumb") }}
          crumb={crumb}
          tabs={tabs}
        />
        <div className="tsgrid ofg2">
          <div className="tsbox">
            <div className="tsh">
              <h3>{t("sh.where")}</h3>
              <span className="meta">{t("sh.whereSub")}</span>
            </div>
            {channels.map((c) => (
              <div key={c.key} className="ofsh tsrow">
                <span className="ofsi" style={{ background: c.colour }}>
                  {c.mark}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b>{t(`sh.${c.key}` as "sh.page")}</b>
                  <em>{t(`sh.${c.key}Sub` as "sh.pageSub")}</em>
                </span>
                <span className="meta ofsst">{live ? t("sh.live") : t("sh.notLive")}</span>
                {live ? (
                  <a
                    className="btn sm ghost"
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <HireIcon name="share2" size="s" />
                    {t("sh.share")}
                  </a>
                ) : null}
              </div>
            ))}
            <div className="oflink">
              <span className="chip-ic">
                <HireIcon name="link" size="s" />
              </span>
              <span className="tr" style={{ flex: 1 }}>
                {t("sh.url", { path })}
              </span>
              <HireShareButton path={path} label={t("sh.copy")} done={t("sh.copied")} wide />
            </div>
          </div>
          <div className="tsbox">
            <div className="tsh">
              <h3>{t("sh.channels")}</h3>
              <span className="meta">{t("sh.total", { count: total })}</span>
            </div>
            {offer.sources.map((s) => (
              <div key={s.source} className="ofch">
                <span className="row" style={{ gap: 8 }}>
                  <i style={{ background: SOURCE_COLOURS[s.source] }} />
                  {to(`stats.source.${s.source}`)}
                </span>
                <span className="ofchb">
                  <b
                    style={{
                      width: `${(s.count / max) * 100}%`,
                      background: SOURCE_COLOURS[s.source],
                    }}
                  />
                </span>
                <b className="num">{s.count}</b>
                <em>
                  {t("conversion", { value: total ? Math.round((s.count / total) * 100) : 0 })}
                </em>
              </div>
            ))}
            <div className="oftip">
              <HireIcon name="orbi" size="s" />
              <span>
                <b>{t("sh.tip")}</b> {t("sh.tipMore")}
              </span>
            </div>
          </div>
        </div>
      </HirePage>
    );
  }

  const series = offer.views.series;
  const step = 7;
  const labels = series
    .map((d, i) => [i, d.day] as const)
    .filter(([i]) => i % step === 0 || i === series.length - 1)
    .map(
      ([i, date]) =>
        [i, format.dateTime(date, { day: "numeric", month: "short" })] as [number, string],
    );
  const viewsToApps = offer.views.total
    ? Math.round((offer.applications / offer.views.total) * 1000) / 10
    : null;
  const totalSources = offer.sources.reduce((sum, s) => sum + s.count, 0);
  const weekMax = offer.week.reduce(
    (best, d, i, list) => (d.count > list[best]!.count ? i : best),
    0,
  );
  return (
    <HirePage view="offre">
      <HirePageHead
        title={offer.title}
        back={{ href: "/app/hire/offres", label: t("crumb") }}
        crumb={crumb}
        tabs={tabs}
        below={
          <div className="chips" style={{ marginTop: 10 }}>
            <span className={live ? "tsst live" : "tsst"}>
              <i />
              {to(`status.${state}`)}
            </span>
            <span className="tag">{to(`contract.${offer.contractType}`)}</span>
            <span className="tag">{where}</span>
            {offer.closesAt ? (
              <span className="tag">{t("closes", { date: day(offer.closesAt) })}</span>
            ) : null}
          </div>
        }
        actions={
          <>
            <Link className="btn ghost" href={`${base}?onglet=partage`} scroll={false}>
              <HireIcon name="share" />
              {t("share")}
            </Link>
            {canRead ? (
              <Link className="btn pri" href={candidatesHref}>
                <HireIcon name="users" />
                {t("seeCandidates", { count: offer.applications })}
              </Link>
            ) : null}
          </>
        }
      />
      <div className="tsk">
        {(
          [
            [t("kpi.views"), String(offer.views.total), t("kpi.viewsSub")],
            [
              t("kpi.applications"),
              String(offer.applications),
              t("kpi.applicationsSub", { count: offer.openings }),
            ],
            [t("kpi.high"), String(offer.high), t("kpi.highSub")],
            offer.closesAt
              ? [
                  t("kpi.closing"),
                  t("kpi.closingValue", { count: offer.daysLeft ?? 0 }),
                  t("kpi.closingSub", { date: day(offer.closesAt) }),
                ]
              : [t("kpi.closing"), t("kpi.noClosing"), t("kpi.noClosingSub")],
          ] as [string, string, string][]
        ).map(([label, value, sub]) => (
          <div key={label} className="tskt">
            <span>{label}</span>
            <b className="num">{value}</b>
            <em>{sub}</em>
          </div>
        ))}
      </div>
      <div className="tsgrid ofg">
        <div className="tsbox">
          <Head
            title={t("viewsChart")}
            icon="eye"
            right={<span className="meta">{t("hover")}</span>}
          />
          <div
            dangerouslySetInnerHTML={{
              __html: lineChartSvg({
                data: series.map((d) => d.count),
                labels,
                unit: t("unitViews"),
                w: 900,
                h: 300,
              }),
            }}
          />
        </div>
        <div className="tsbox" style={{ display: "flex", flexDirection: "column" }}>
          <Head title={t("funnel")} icon="filter" />
          <div className="offun">
            {offer.funnel.map((step, i) => {
              const next = offer.funnel[i + 1];
              return (
                <div key={step.key} style={{ display: "contents" }}>
                  <div className="offr">
                    <span>{t(`funnelStep.${step.key}` as "funnelStep.views")}</span>
                    <span className="offb">
                      <b style={{ width: `${FUNNEL_WIDTHS[i]}%`, background: FUNNEL_COLOURS[i] }} />
                    </span>
                    <b className="num">{step.count}</b>
                  </div>
                  {next ? (
                    <div className="ofconv">
                      <HireIcon name="down" size="s" />
                      {t("conversion", {
                        value: step.count
                          ? String(Math.round((next.count / step.count) * 1000) / 10).replace(
                              ".",
                              ",",
                            )
                          : 0,
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="oftip" style={{ marginTop: "auto" }}>
            <HireIcon name="orbi" size="s" />
            <span>
              {viewsToApps === null ? (
                t("funnelTipEmpty")
              ) : (
                <>
                  <b>{t("funnelTip", { rate: String(viewsToApps).replace(".", ",") })}</b>{" "}
                  {t("funnelTipMore")}
                </>
              )}
            </span>
          </div>
        </div>
      </div>
      <div className="ofthree">
        <div className="tsbox">
          <Head
            title={t("top")}
            icon="orbi"
            right={
              canRead ? (
                <Link className="round" href={candidatesHref} aria-label={t("topOpen")}>
                  <HireIcon name="right" size="s" />
                </Link>
              ) : null
            }
          />
          <div className="stack" style={{ gap: 8 }}>
            {offer.top.length === 0 ? <p className="meta">{t("topEmpty")}</p> : null}
            {offer.top.map((c, i) => {
              const k = clsOf(c.score);
              return (
                <Link key={c.id} className="oftop" href={`/app/hire/candidats/${c.id}`}>
                  <span className="tsrk tsr1">{i + 1}</span>
                  <span className={`av ${avatarColor(c.name)}`} aria-hidden="true">
                    {initialsOf(c.name)}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b className="tr" style={{ display: "block" }}>
                      {c.name}
                    </b>
                    <span className={`cm ${k}`}>
                      {k === "fort" ? <HireIcon name="spark2" size="s" /> : null}
                      {t(`cls.${k}`)}
                    </span>
                  </span>
                  <span
                    style={{ display: "contents" }}
                    dangerouslySetInnerHTML={{ __html: ringHtml(c.score, 40) }}
                  />
                </Link>
              );
            })}
          </div>
        </div>
        <div className="tsbox">
          <Head title={t("sources")} icon="share" />
          <div className="row" style={{ gap: 16 }}>
            <span
              style={{ display: "contents" }}
              dangerouslySetInnerHTML={{
                __html: donutSvg(
                  offer.sources.map((s) => [
                    s.count || (totalSources ? 0 : 1),
                    SOURCE_COLOURS[s.source],
                  ]),
                  120,
                  String(totalSources),
                  t("sourcesLabel"),
                  14,
                ),
              }}
            />
            <div className="stack" style={{ gap: 10, flex: 1 }}>
              {offer.sources.map((s) => (
                <div key={s.source} className="row" style={{ gap: 8, fontSize: 13 }}>
                  <i
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 3,
                      background: SOURCE_COLOURS[s.source],
                    }}
                  />
                  {to(`stats.source.${s.source}`)}
                  <b className="num" style={{ marginLeft: "auto" }}>
                    {s.count}
                  </b>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card dk tsorbi">
          <Head title={t("perDay")} icon="chart" />
          <div
            dangerouslySetInnerHTML={{
              __html: barsWaveSvg({
                data: offer.week.map((d) => [
                  format.dateTime(d.day, { weekday: "short" }),
                  d.count,
                ]),
                dark: true,
                hi: offer.week[weekMax]!.count > 0 ? weekMax : -1,
                h: 150,
                w: 380,
              }),
            }}
          />
        </div>
      </div>
    </HirePage>
  );
}
