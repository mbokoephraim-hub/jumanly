import { loose } from "@/lib/loose-t";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReportsV3 } from "@/server/services/hire-v3-reports";
import { avatarColor, initialsOf } from "./avatar";
import { donutSvg, lineChartSvg, sparkFillSvg } from "./charts";
import { HireIcon, type HireIconName } from "./icon";
import { HirePage } from "./page-head";
import { HireTabs } from "./tabs";

const FUNNEL_COLOURS: Record<string, string> = {
  received: "#4C8DF6",
  screening: "#8B6CF0",
  test: "#D9A514",
  interview: "#F2994A",
  offer: "#2FA25A",
};
const SOURCE_COLOURS = {
  direct: "#0F3F37",
  invitation: "#A6F26B",
  talent_search: "#3DA14F",
} as const;
const STATUS_COLOURS: Record<string, string> = {
  published: "#3FAE3A",
  paused: "#D9A514",
  closed: "#8C9AB8",
};

/**
 * « Rapports » (`V.rapports` of the prototype v3): Orbi's summary, four tiles with their trend,
 * applications and screenings in time, where the candidates come from, the funnel, the delay,
 * the team's activity and the offers. « Rapport complet en PDF » opens the offers report.
 */
export async function HireV3Reports({ data, canExport }: { data: ReportsV3; canExport: boolean }) {
  const t = await getTranslations("hireV3Reports");
  const tk = loose(t);
  const format = await getFormatter();
  const period = t(`period.${data.days}`);
  const tabs = ([7, 30, 90] as const).map((d) => ({
    label: t(`period.${d}`),
    href: d === 30 ? "/app/hire/rapports" : `/app/hire/rapports?periode=${d}`,
    active: data.days === d,
  }));
  const delta = (now: number | null, before: number | null, unit: "pct" | "n" | "d" | "pts") => {
    if (now === null || before === null) return t("delta.none");
    if (unit === "pct")
      return before
        ? t("delta.pct", { value: Math.round(((now - before) / before) * 100) })
        : t("delta.none");
    return t(`delta.${unit}`, { value: now - before });
  };
  const series = data.buckets.map((b) => b.applications);
  const tiles: {
    key: string;
    icon: HireIconName;
    value: string;
    delta: string;
    foot: string;
    spark: number[];
  }[] = [
    {
      key: "cand",
      icon: "mail",
      value: String(data.applications.total),
      delta: delta(data.applications.total, data.applications.before, "pct"),
      foot: t("tiles.cand.foot"),
      spark: series,
    },
    {
      key: "emb",
      icon: "check",
      value: String(data.hires.total),
      delta: delta(data.hires.total, data.hires.before, "n"),
      foot: t("tiles.emb.foot", { count: data.hires.total }),
      spark: [data.hires.before, data.hires.total],
    },
    {
      key: "del",
      icon: "hourglass",
      value: data.delay.total === null ? t("none") : t("days", { value: data.delay.total }),
      delta: delta(data.delay.total, data.delay.before, "d"),
      foot: t("tiles.del.foot"),
      spark: [data.delay.before ?? 0, data.delay.total ?? 0],
    },
    {
      key: "ent",
      icon: "users",
      value: data.pass.total === null ? t("none") : t("percent", { value: data.pass.total }),
      delta: delta(data.pass.total, data.pass.before, "pts"),
      foot: t("tiles.ent.foot"),
      spark: data.buckets.map((b) => b.screened),
    },
  ];
  const totalSources = data.sources.reduce((s, x) => s + x.count, 0);
  const maxSource = Math.max(1, ...data.sources.map((s) => s.count));
  const first = data.funnel[0]!.count || 1;
  const maxTeam = Math.max(1, ...data.team.map((m) => m.actions));
  const maxOffer = Math.max(1, ...data.offers.map((o) => o.applications));
  const label = (d: Date) =>
    data.days === 7
      ? format.dateTime(d, { weekday: "short" })
      : format.dateTime(d, { day: "numeric", month: "short" });
  return (
    <HirePage view="rapports">
      <div className="ph rhero">
        <div className="rh-t">
          <span className="vh-k">
            <HireIcon name="orbi" size="s" />
            {t("hero.kicker", { period })}
          </span>
          <h1>
            {t.rich("hero.title", {
              count: data.hires.total,
              em: (chunks) => <em>{chunks}</em>,
              delay: data.delay.total === null ? t("none") : t("days", { value: data.delay.total }),
            })}
          </h1>
          <p>
            {data.applications.total
              ? t("hero.text", { count: data.applications.total, screened: data.screened })
              : t("hero.empty")}
          </p>
        </div>
        <div className="act">
          <HireTabs tabs={tabs} />
        </div>
        <div className="row" style={{ gap: 8 }}>
          {canExport ? (
            <Link className="btn ghost" href="/app/hire/rapports/modeles">
              <HireIcon name="file" size="s" />
              {t("models")}
            </Link>
          ) : null}
          <Link className="btn pri" href="/app/hire/offres/rapport">
            <HireIcon name="dl" size="s" />
            {t("pdf")}
          </Link>
        </div>
      </div>
      <div className="rkg">
        {tiles.map((tile, i) => (
          <div key={tile.key} className={i === 1 ? "rpk acc" : "rpk"}>
            <span className="rpk-h">
              <span className="rpk-i">
                <HireIcon name={tile.icon} size="s" />
              </span>
              {tk(`tiles.${tile.key}.label`)}
            </span>
            <b>{tile.value}</b>
            <span className="rpk-f">
              <span className="rpk-d">{tile.delta}</span>
              {tile.foot}
            </span>
            <span
              className="rpk-sp"
              dangerouslySetInnerHTML={{ __html: sparkFillSvg(tile.spark) }}
            />
          </div>
        ))}
      </div>
      <div className="rgrid">
        <div className="rcard r-ch">
          <div className="rc-h">
            <h3>{t("chart.title")}</h3>
            <div className="legend">
              <span>
                <i style={{ background: "#0F3F37" }} />
                {t("chart.applications")}
              </span>
              <span>
                <i style={{ background: "#A6F26B" }} />
                {t("chart.screened")}
              </span>
            </div>
          </div>
          <div
            dangerouslySetInnerHTML={{
              __html: lineChartSvg({
                data: series,
                data2: data.buckets.map((b) => b.screened),
                labels: data.buckets.map((b, i) => [i, label(b.from)] as [number, string]),
                h: 230,
                w: 640,
              }),
            }}
          />
          <div className="rc-f">
            <span>
              <b>{data.applications.total}</b> {t("chart.applicationsFoot")}
            </span>
            <span>
              <b>{data.screened}</b> {t("chart.screenedFoot")}
            </span>
            <span>
              <b>
                {t("percent", {
                  value: data.applications.total
                    ? Math.round((data.screened / data.applications.total) * 100)
                    : 0,
                })}
              </b>{" "}
              {t("chart.kept")}
            </span>
          </div>
        </div>
        <div className="rcard">
          <div className="rc-h">
            <h3>{t("sources.title")}</h3>
          </div>
          <div style={{ display: "grid", placeItems: "center" }}>
            <span
              dangerouslySetInnerHTML={{
                __html: donutSvg(
                  data.sources.map((s) => [s.count, SOURCE_COLOURS[s.source]] as [number, string]),
                  150,
                  String(totalSources),
                  t("sources.unit"),
                  16,
                ),
              }}
            />
          </div>
          <div className="rsrc">
            {data.sources.map((s) => {
              const pct = totalSources ? Math.round((s.count / totalSources) * 100) : 0;
              return (
                <div className="rsr" key={s.source}>
                  <i style={{ background: SOURCE_COLOURS[s.source] }} />
                  <span>{t(`sources.${s.source}`)}</span>
                  <b>{t("percent", { value: pct })}</b>
                  <span className="rsr-b">
                    <b
                      style={{
                        width: `${(s.count / maxSource) * 100}%`,
                        background: SOURCE_COLOURS[s.source],
                      }}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rcard r-fun">
          <div className="rc-h">
            <h3>{t("funnel.title")}</h3>
            <span className="meta">{t("funnel.sub")}</span>
          </div>
          <div className="rfx">
            {data.funnel.map((f, i) => (
              <div
                className="rfc"
                key={f.key}
                style={{ "--c": FUNNEL_COLOURS[f.key] } as React.CSSProperties}
              >
                <span className="rfc-h">
                  <i />
                  {tk(`funnel.${f.key}`)}
                </span>
                <b className="num">{f.count}</b>
                <span className="rfc-bar">
                  <i
                    style={{
                      height: `${Math.max(8, Math.round(Math.sqrt(f.count / first) * 100))}%`,
                    }}
                  />
                </span>
                <em>
                  {i
                    ? t("funnel.ofTotal", { value: Math.round((f.count / first) * 1000) / 10 })
                    : t("funnel.all")}
                </em>
                {i ? (
                  <span className="rfc-cv">
                    <HireIcon name="right" size="s" />
                    {t("percent", {
                      value: data.funnel[i - 1]!.count
                        ? Math.round((f.count / data.funnel[i - 1]!.count) * 100)
                        : 0,
                    })}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="rcard">
          <div className="rc-h">
            <h3>{t("delay.title")}</h3>
          </div>
          <div className="robj">
            <div className="row" style={{ fontSize: 12.5 }}>
              <span>{t("delay.label")}</span>
              <b style={{ marginLeft: "auto" }}>
                {data.delay.total === null ? t("none") : t("days", { value: data.delay.total })}
              </b>
            </div>
            <div className="robar">
              <b style={{ width: `${Math.min(100, ((data.delay.total ?? 0) / 21) * 100)}%` }} />
            </div>
            <span className="meta" style={{ fontSize: 11.5 }}>
              {data.delay.before === null
                ? t("delay.noBefore")
                : t("delay.before", { value: data.delay.before })}
            </span>
          </div>
          <div className="rnote">
            <HireIcon name="clock" size="s" />
            {t("delay.note")}
          </div>
        </div>
        <div className="rcard">
          <div className="rc-h">
            <h3>{t("team.title")}</h3>
            <span className="meta">{t("team.sub")}</span>
          </div>
          <div className="rteam">
            {data.team.map((m, i) => (
              <div className="rtm" key={m.id}>
                <span className="rtr">{i + 1}</span>
                <span className={`av xs ${avatarColor(m.name)}`} aria-hidden="true">
                  {initialsOf(m.name)}
                </span>
                <span className="tr" style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13 }}>{m.name.split(" ")[0]}</b>
                  <span className="meta" style={{ display: "block", fontSize: 11 }}>
                    {t(`role.${m.role}`)}
                  </span>
                </span>
                <span className="rtb">
                  <b style={{ width: `${(m.actions / maxTeam) * 100}%` }} />
                </span>
                <b className="num">{m.actions}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="rcard">
          <div className="rc-h">
            <h3>{t("offers.title")}</h3>
            <Link className="lnk" href="/app/hire/offres">
              {t("offers.all")}
            </Link>
          </div>
          <div className="rteam">
            {data.offers.length === 0 ? <span className="meta">{t("offers.empty")}</span> : null}
            {data.offers.map((o) => (
              <Link className="rpo" key={o.id} href={`/app/hire/offres/${o.id}`}>
                <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <b className="tr" style={{ display: "block", fontSize: 13 }}>
                    {o.title}
                  </b>
                  <span className="meta" style={{ fontSize: 11 }}>
                    <i
                      style={{
                        display: "inline-block",
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: STATUS_COLOURS[o.status] ?? "#8C9AB8",
                        marginRight: 5,
                      }}
                    />
                    {t("offers.line", { status: o.status, high: o.high })}
                  </span>
                </span>
                <span className="rtb">
                  <b style={{ width: `${(o.applications / maxOffer) * 100}%` }} />
                </span>
                <b className="num" style={{ width: 26, textAlign: "right" }}>
                  {o.applications}
                </b>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </HirePage>
  );
}
