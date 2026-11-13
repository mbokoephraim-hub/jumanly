import { getFormatter, getTranslations } from "next-intl/server";
import type { OffersReport } from "@/server/services/hire-v3-offers";
import { donutSvg, funnelSvg, lineChartSvg } from "./charts";
import { HireIcon, type HireIconName } from "./icon";
import { HIRE_SYMBOL } from "./icon-paths";
import { HirePage, HirePageHead } from "./page-head";
import { HirePrintButton } from "./print-button";
import { HireShareButton } from "./share-button";

const SYML = HIRE_SYMBOL.replace('stroke="#fff"', 'stroke="#0F3F37"');
const FUNNEL = ["#4C8DF6", "#8B6CF0", "#F2994A", "#E9B824", "#5DBB2E"];
const SOURCE_COLOURS = { direct: "#A6F26B", invitation: "#4C8DF6", talent_search: "#8B6CF0" };
const ACC: [string][] = [["#DDF6CA"], ["#DCEBFF"], ["#ECE4FF"], ["#FFE7CF"], ["#FFF1B3"]];
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const dc = (n: number) => String(n).replace(".", ",");

function Symbol() {
  return <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: SYML }} />;
}

/** « Rapport des offres » (`V.rapportoffres` of the prototype v3): four A4 pages to save as PDF. */
export async function HireV3OffersReport({
  report,
  orgName,
  author,
}: {
  report: OffersReport;
  orgName: string;
  author: string;
}) {
  const t = await getTranslations("hireV3Report");
  const to = await getTranslations("hireV3Offers");
  const th = await getTranslations("hireV3Home.delta");
  const format = await getFormatter();
  const long = (date: Date) =>
    format.dateTime(date, { day: "numeric", month: "long", year: "numeric" });
  const period = `${format.dateTime(report.start, { day: "numeric", month: "long" })} – ${long(report.end)}`;
  const foot = (n: number) => (
    <div className="rp-f">
      <span>
        <Symbol />
        {t("brand", { org: orgName })}
      </span>
      <span>{t("footer", { period })}</span>
      <span>{t("page", { n })}</span>
    </div>
  );
  const vs = (now: number, before: number) => {
    if (before <= 0) return t("s1.noCompare");
    const change = Math.round(((now - before) / before) * 100);
    const delta =
      change > 0
        ? th("up", { value: change })
        : change < 0
          ? th("down", { value: -change })
          : th("stable");
    return t("s1.vs", { delta });
  };
  const total = report.sources.reduce((sum, s) => sum + s.count, 0);
  const funnel = report.funnel.map((step, i) => ({
    label: t(`s1.step.${step.key}` as "s1.step.received"),
    count: step.count,
    colour: FUNNEL[i]!,
    href: "",
  }));
  const offers = report.offers;
  const sv = offers.reduce((a, o) => a + o.period.views, 0);
  const sc = offers.reduce((a, o) => a + o.period.applications, 0);
  const status = (s: string) =>
    to(`status.${s === "published" ? "live" : s === "paused" ? "paused" : "closed"}`);

  // « À retenir » and the pistes, drawn from the figures of the period.
  const top = [...offers].sort((a, b) => b.period.applications - a.period.applications)[0];
  const mainSource = [...report.sources].sort((a, b) => b.count - a.count)[0];
  const paused = offers.filter((o) => o.status === "paused");
  const high = offers.reduce((a, o) => a + o.period.high, 0);
  const keep: React.ReactNode[] =
    sc === 0
      ? [t("s1.keepEmpty")]
      : [
          top ? t("s1.keepTop", { title: top.title, count: top.period.applications }) : null,
          mainSource && total
            ? t("s1.keepSource", {
                source: to(`stats.source.${mainSource.source}`),
                value: Math.round((mainSource.count / total) * 100),
              })
            : null,
          paused.length ? t("s1.keepPaused", { count: paused.length }) : null,
          t("s1.keepHigh", { count: high }),
        ].filter(Boolean);
  const closing = offers
    .filter((o) => o.status === "published" && o.daysLeft !== null && o.daysLeft <= 14)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))[0];
  const toMeet = [...offers].sort((a, b) => b.highPotential - a.highPotential)[0];
  const pistes: [string, string][] = [
    ...(closing
      ? [
          [
            t("s3.nextClosing", { title: closing.title }),
            t("s3.nextClosingText", {
              count: closing.figures.applications,
              days: closing.daysLeft ?? 0,
            }),
          ] as [string, string],
        ]
      : []),
    ...(paused[0]
      ? [
          [
            t("s3.nextPaused", { title: paused[0].title }),
            t("s3.nextPausedText", { count: paused[0].figures.applications }),
          ] as [string, string],
        ]
      : []),
    ...(toMeet && toMeet.highPotential > 0
      ? [
          [
            t("s3.nextHigh", { title: toMeet.title }),
            t("s3.nextHighText", { count: toMeet.highPotential }),
          ] as [string, string],
        ]
      : []),
  ];
  const apps = report.applications.series;
  const labels = apps
    .map((_, i) => i)
    .filter((i) => i % 5 === 0 || i === apps.length - 1)
    .map((i) => [i, to("stats.dayLabel", { n: apps.length - i })] as [number, string]);

  return (
    <HirePage view="rapportoffres">
      <HirePageHead
        title={t("title")}
        sub={t("sub", { period })}
        back={{ href: "/app/hire/offres?onglet=statistiques", label: t("back") }}
        actions={
          <>
            <HireShareButton
              path="/app/hire/offres/rapport"
              label={t("copy")}
              done={t("copied")}
              wide
              className="btn ghost"
            />
            <HirePrintButton label={t("print")} />
          </>
        }
      />
      <div className="rp-wrap">
        <section className="rp rp-cov">
          <div className="rp-cv-top">
            <span className="rp-logo">
              <Symbol />
              <b>{t("logoName")}</b>
              <i>{t("logoHire")}</i>
            </span>
            <span className="rp-tag">{t("cover.tag")}</span>
          </div>
          <div className="rp-cv-mid">
            <span className="rp-k">{t("cover.kicker")}</span>
            <h2>{t("cover.title")}</h2>
            <p>{period}</p>
            <div className="rp-cv-kp">
              {(
                [
                  [fmt(report.views.total), t("cover.views")],
                  [String(report.applications.total), t("cover.applications")],
                  [t("rate", { value: dc(report.rate.total) }), t("cover.rate")],
                  [
                    report.delay === null ? t("none") : t("days", { count: report.delay }),
                    t("cover.delay"),
                  ],
                ] as [string, string][]
              ).map(([value, label]) => (
                <div key={label}>
                  <b>{value}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rp-cv-bot">
            <div>
              <span>{t("cover.org")}</span>
              <b>{orgName}</b>
            </div>
            <div>
              <span>{t("cover.by")}</span>
              <b>{author}</b>
            </div>
            <div>
              <span>{t("cover.on")}</span>
              <b>{long(new Date())}</b>
            </div>
          </div>
          <svg className="rp-cv-art" viewBox="0 0 400 400" aria-hidden="true">
            <circle cx="300" cy="100" r="150" fill="#A6F26B" opacity=".14" />
            <circle
              cx="300"
              cy="100"
              r="96"
              fill="none"
              stroke="#A6F26B"
              strokeOpacity=".5"
              strokeWidth="2"
              strokeDasharray="4 8"
            />
            <circle cx="300" cy="100" r="22" fill="#A6F26B" />
          </svg>
        </section>

        <section className="rp">
          <div className="rp-h">
            <span className="rp-n">{t("n1")}</span>
            <div>
              <h3>{t("s1.title")}</h3>
              <p>{t("s1.sub")}</p>
            </div>
          </div>
          <div className="rp-kpis">
            {(
              [
                [
                  fmt(report.views.total),
                  t("s1.views"),
                  vs(report.views.total, report.views.before),
                ],
                [
                  String(report.applications.total),
                  t("s1.applications"),
                  vs(report.applications.total, report.applications.before),
                ],
                [
                  t("rate", { value: dc(report.rate.total) }),
                  t("s1.rate"),
                  vs(report.rate.total, report.rate.before),
                ],
                [
                  String(report.interviews.total),
                  t("s1.interviews"),
                  vs(report.interviews.total, report.interviews.before),
                ],
              ] as [string, string, string][]
            ).map(([value, label, line], i) => (
              <div key={label} className={i === 1 ? "hl" : undefined}>
                <span>{label}</span>
                <b>{value}</b>
                <em>{line}</em>
              </div>
            ))}
          </div>
          <h4 className="rp-s">{t("s1.funnel")}</h4>
          <div className="fn" style={{ "--n": funnel.length } as React.CSSProperties}>
            <div className="fn-h">
              {funnel.map((stage) => (
                <span key={stage.label} className="fn-s">
                  <span className="fn-l">
                    <i style={{ background: stage.colour }} />
                    {stage.label}
                  </span>
                  <b className="num">{stage.count}</b>
                </span>
              ))}
            </div>
            <div className="fn-b">
              <div
                style={{ display: "contents" }}
                dangerouslySetInnerHTML={{ __html: funnelSvg(funnel) }}
              />
              {funnel.slice(1).map((stage, i) => (
                <span
                  key={stage.label}
                  className="fn-c"
                  style={{ left: `${((i + 1) / funnel.length) * 100}%` }}
                >
                  {t("rate", {
                    value: funnel[i]!.count
                      ? Math.round((stage.count / funnel[i]!.count) * 100)
                      : 0,
                  })}
                </span>
              ))}
            </div>
          </div>
          <h4 className="rp-s">{t("s1.perDay")}</h4>
          <div
            className="rp-lc"
            dangerouslySetInnerHTML={{
              __html: lineChartSvg({
                data: apps,
                data2: report.applications.previous,
                labels,
                h: 190,
                w: 680,
                unit: t("s1.unit"),
              }),
            }}
          />
          <div className="rp-lgd">
            <span>
              <i style={{ background: "#0E1B17" }} />
              {t("s1.thisPeriod")}
            </span>
            <span>
              <i style={{ background: "#0F3F37", opacity: 0.5 }} />
              {t("s1.previous")}
            </span>
          </div>
          <div className="rp-2">
            <div>
              <h4 className="rp-s">{t("s1.sources")}</h4>
              <div className="row" style={{ gap: 14 }}>
                <span
                  style={{ display: "contents" }}
                  dangerouslySetInnerHTML={{
                    __html: donutSvg(
                      report.sources.map((s) => [
                        s.count || (total ? 0 : 1),
                        SOURCE_COLOURS[s.source],
                      ]),
                      120,
                      String(total),
                      t("s1.sourcesUnit"),
                    ),
                  }}
                />
                <div className="stack" style={{ gap: 6, flex: 1 }}>
                  {report.sources.map((s) => (
                    <div key={s.source} className="row rp-li">
                      <i style={{ background: SOURCE_COLOURS[s.source] }} />
                      {to(`stats.source.${s.source}`)}
                      <b>{s.count}</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h4 className="rp-s">{t("s1.keep")}</h4>
              <ul className="rp-ul">
                {keep.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
          {foot(2)}
        </section>

        <section className="rp">
          <div className="rp-h">
            <span className="rp-n">{t("n2")}</span>
            <div>
              <h3>{t("s2.title")}</h3>
              <p>{t("s2.sub")}</p>
            </div>
          </div>
          {offers.length === 0 ? <p className="meta">{t("s2.empty")}</p> : null}
          <div className="rp-offs">
            {offers.slice(0, 4).map((o, i) => {
              const { fresh, screening, interview } = o.split;
              return (
                <div
                  key={o.id}
                  className="rp-o"
                  style={{ "--bg": ACC[i % ACC.length]![0] } as React.CSSProperties}
                >
                  <div className="rp-o-h">
                    <div>
                      <span className="rp-dep">{o.department ?? to("noDepartment")}</span>
                      <b>{o.title}</b>
                      <span className="meta">
                        {o.city} · {to(`contract.${o.contractType}`)}
                      </span>
                    </div>
                    <span className={`rp-st ${o.status === "published" ? "live" : "pause"}`}>
                      {status(o.status)}
                    </span>
                  </div>
                  <div className="rp-o-g">
                    <div>
                      <span>{t("s2.views")}</span>
                      <b>{fmt(o.period.views)}</b>
                    </div>
                    <div>
                      <span>{t("s2.applications")}</span>
                      <b>{o.period.applications}</b>
                    </div>
                    <div>
                      <span>{t("s2.openings")}</span>
                      <b>{o.openings}</b>
                    </div>
                    <div>
                      <span>{t("s2.high")}</span>
                      <b>{o.period.high}</b>
                    </div>
                  </div>
                  <div className="rp-bar">
                    <i style={{ flex: Math.max(fresh, 0.0001) }} />
                    <i style={{ flex: Math.max(screening, 0.0001) }} />
                    <i style={{ flex: Math.max(interview, 0.0001) }} />
                  </div>
                  <div className="rp-lg">
                    <span>{t("s2.fresh", { count: fresh })}</span>
                    <span>{t("s2.screening", { count: screening })}</span>
                    <span>{t("s2.interview", { count: interview })}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <table className="rp-t">
            <thead>
              <tr>
                <th>{t("s2.col.offer")}</th>
                <th>{t("s2.col.views")}</th>
                <th>{t("s2.col.applications")}</th>
                <th>{t("s2.col.rate")}</th>
                <th>{t("s2.col.delay")}</th>
                <th>{t("s2.col.status")}</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => (
                <tr key={o.id}>
                  <td>{o.title}</td>
                  <td>{fmt(o.period.views)}</td>
                  <td>{o.period.applications}</td>
                  <td>{t("rate", { value: dc(o.period.rate) })}</td>
                  <td>{o.delay === null ? t("none") : t("days", { count: o.delay })}</td>
                  <td>{status(o.status)}</td>
                </tr>
              ))}
              <tr className="tt">
                <td>{t("s2.total")}</td>
                <td>{fmt(sv)}</td>
                <td>{sc}</td>
                <td>{t("rate", { value: dc(sv ? Math.round((sc / sv) * 1000) / 10 : 0) })}</td>
                <td>{report.delay === null ? t("none") : t("days", { count: report.delay })}</td>
                <td />
              </tr>
            </tbody>
          </table>
          <h4 className="rp-s">{t("s2.bySource")}</h4>
          <div className="stack" style={{ gap: 10 }}>
            {offers.map((o) => (
              <div key={o.id} className="rp-sb">
                <span className="tr">{o.title}</span>
                <span className="rp-sbb">
                  {o.sources.map((x) => (
                    <i
                      key={x.source}
                      style={{ flex: x.count, background: SOURCE_COLOURS[x.source] }}
                      title={to(`stats.source.${x.source}`)}
                    />
                  ))}
                </span>
                <b>{o.period.applications}</b>
              </div>
            ))}
          </div>
          <div className="rp-lgd" style={{ marginTop: 0 }}>
            {report.sources.map((x) => (
              <span key={x.source}>
                <i style={{ background: SOURCE_COLOURS[x.source] }} />
                {to(`stats.source.${x.source}`)}
              </span>
            ))}
          </div>
          {foot(3)}
        </section>

        <section className="rp">
          <div className="rp-h">
            <span className="rp-n">{t("n3")}</span>
            <div>
              <h3>{t("s3.title")}</h3>
              <p>{t("s3.sub")}</p>
            </div>
          </div>
          <div className="rp-3">
            {(
              [
                ["shield", "c1"],
                ["eye", "c2"],
                ["users", "c3"],
                ["file", "c4"],
              ] as [HireIconName, string][]
            ).map(([icon, key]) => (
              <div key={key} className="rp-c">
                <span className="chip-ic">
                  <HireIcon name={icon} size="s" />
                </span>
                <b>{t(`s3.${key}` as "s3.c1")}</b>
                <p>{t(`s3.${key}Text` as "s3.c1Text")}</p>
              </div>
            ))}
          </div>
          <h4 className="rp-s">{t("s3.defs")}</h4>
          <dl className="rp-dl">
            {(["d1", "d2", "d3"] as const).map((key) => (
              <div key={key} style={{ display: "contents" }}>
                <dt>{t(`s3.${key}`)}</dt>
                <dd>{t(`s3.${key}Text`)}</dd>
              </div>
            ))}
          </dl>
          <h4 className="rp-s">{t("s3.next")}</h4>
          <div className="rp-next">
            {pistes.length === 0 ? (
              <div>
                <span className="rp-nn">{1}</span>
                <div>
                  <b>{t("s3.nextEmpty")}</b>
                </div>
              </div>
            ) : null}
            {pistes.map(([title, text], i) => (
              <div key={title}>
                <span className="rp-nn">{i + 1}</span>
                <div>
                  <b>{title}</b>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="meta" style={{ fontSize: 10.5, margin: 0 }}>
            {t("s3.nextNote")}
          </p>
          <div className="rp-ct">
            {t("s3.contact")} <b>{t("email")}</b>
          </div>
          {foot(4)}
        </section>
      </div>
    </HirePage>
  );
}
