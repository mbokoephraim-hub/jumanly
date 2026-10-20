/**
 * The recruiting report as an A4 PDF in Jumanly's colours (brief recruteur § 2.15, modèle
 * docs/refonte-mobile/modeles-recruteur/rapport-recrutement.html): page 1 « L'essentiel », the
 * funnel, the weeks and the offers; page 2 the sources, the answer delays, the interviews and
 * decisions, Orbi's period and a neutral reading of the figures; then the detail of the plan's
 * indicators. Aggregates only: no person is named (golden rule n° 5).
 */
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReportRow } from "@/server/hire-report-export";
import type { HireReport } from "@/server/services/hire-reports";
import type { ReportPdfData } from "@/server/services/hire-report-pdf";

const c = {
  sapin: "#0F3F37",
  lime: "#A6F26B",
  menthe: "#2FD3A6",
  ambre: "#F5B83D",
  ciel: "#9DB8E8",
  encre: "#1A2724",
  gris: "#5D6B66",
  pale: "#8A948F",
  ligne: "#E5E0D7",
  piste: "#EFEBE4",
  brume: "#CFE9DF",
};
const tiles = ["#EEF8E4", "#E3F7F0", "#FEF4DE", "#EEF3FB"];
const dots = [c.lime, c.menthe, c.ambre, c.ciel];

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: c.encre, paddingBottom: 60 },
  head: { backgroundColor: c.sapin, color: "#FFFFFF", paddingHorizontal: 36, paddingVertical: 28 },
  logo: { flexDirection: "row", alignItems: "center" },
  logoJ: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: c.lime,
    color: c.sapin,
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    textAlign: "center",
    paddingTop: 4,
  },
  logoT: { fontFamily: "Helvetica-Bold", fontSize: 16, color: "#FFFFFF", marginLeft: 6 },
  kicker: {
    alignSelf: "flex-start",
    marginTop: 22,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: c.sapin,
    backgroundColor: c.lime,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
  },
  h1: { fontFamily: "Helvetica-Bold", fontSize: 26, marginTop: 10, color: "#FFFFFF" },
  lead: { fontSize: 10, color: c.brume, marginTop: 4 },
  mini: {
    backgroundColor: c.sapin,
    paddingHorizontal: 36,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  miniT: { fontSize: 9, color: c.brume },
  body: { paddingHorizontal: 36, paddingTop: 22 },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: c.gris,
    marginBottom: 9,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: c.ligne,
  },
  kpis: { flexDirection: "row", marginBottom: 20 },
  kpi: { flex: 1, borderRadius: 12, padding: 12, marginRight: 8, color: c.gris, fontSize: 9 },
  kpiB: { fontFamily: "Helvetica-Bold", fontSize: 22, color: c.sapin, marginBottom: 3 },
  grid: { flexDirection: "row", marginBottom: 20 },
  card: { flex: 1, borderWidth: 1, borderColor: c.ligne, borderRadius: 12, padding: 13 },
  cardGap: { marginRight: 14 },
  h3: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: c.sapin, marginBottom: 9 },
  bar: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  barL: { width: 80, fontSize: 9 },
  track: { flex: 1, height: 9, borderRadius: 5, backgroundColor: c.piste },
  fill: { height: 9, borderRadius: 5, backgroundColor: c.menthe },
  barV: { width: 34, textAlign: "right", fontFamily: "Helvetica-Bold" },
  weeks: { flexDirection: "row", alignItems: "flex-end", height: 100 },
  week: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
    marginHorizontal: 5,
  },
  weekBar: {
    width: "100%",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: c.menthe,
  },
  weekL: { fontSize: 8, color: c.gris, marginTop: 4 },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: c.piste,
    paddingVertical: 7,
  },
  th: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: c.lime,
    paddingVertical: 5,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: c.gris,
  },
  cJob: { flex: 3, flexDirection: "row", alignItems: "center", paddingRight: 6 },
  cSt: { flex: 1.4 },
  cN: { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold" },
  cNh: { flex: 1, textAlign: "right" },
  dot: { width: 7, height: 7, borderRadius: 2, marginRight: 6 },
  split: { flexDirection: "row", height: 12, borderRadius: 6, overflow: "hidden", marginBottom: 9 },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 3 },
  stat: { flex: 1, borderRadius: 12, padding: 11, marginRight: 8, backgroundColor: "#F7F5F1" },
  statB: { fontFamily: "Helvetica-Bold", fontSize: 18, color: c.sapin, marginBottom: 2 },
  muted: { color: c.gris, fontSize: 8.5 },
  note: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 13,
    backgroundColor: "#EAF8EC",
    marginBottom: 18,
  },
  orbi: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: c.sapin,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  orbiIn: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#FFFFFF" },
  noteT: { flex: 1, fontSize: 9.5, lineHeight: 1.5 },
  detail: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: c.piste,
  },
  foot: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: c.pale,
    borderTopWidth: 1,
    borderTopColor: c.ligne,
    paddingTop: 7,
  },
  footB: { fontFamily: "Helvetica-Bold", color: c.sapin },
});

type Props = {
  org: string;
  range: { from: Date; to: Date };
  report: HireReport;
  extra: ReportPdfData;
  rows: ReportRow[];
  now: Date;
};

const pct = (value: number, max: number) =>
  `${max > 0 && value > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0}%`;

export async function renderRecruitingReport(props: Props) {
  const t = await getTranslations("hireReportPdf");
  const f = await getFormatter();
  const { report, extra, range } = props;
  const basic = report.basic;
  const stats = report.stats;
  const n = (value: number) => f.number(value);
  const days = (value: number | null) =>
    value === null ? t("none") : t("days", { days: f.number(value, { maximumFractionDigits: 1 }) });
  const sourceTotal = stats ? stats.sources.reduce((sum, row) => sum + row.count, 0) : 0;
  const weekMax = Math.max(...basic.weekly, 0);
  const busiest = basic.weekly.indexOf(weekMax);
  const topSource = stats?.sources.reduce((a, b) => (b.count > a.count ? b : a));
  const scorecards = report.advanced?.scorecards ?? null;
  const reading =
    basic.applications === 0
      ? [t("reading.empty")]
      : [
          weekMax > 0 ? t("reading.week", { n: busiest + 1, count: weekMax }) : null,
          topSource && topSource.count > 0
            ? t("reading.source", { source: t(`source.${topSource.source}`) })
            : null,
          extra.delays.slow !== null && extra.delays.slow >= 20
            ? t("reading.slow", { value: extra.delays.slow })
            : null,
        ].filter((line): line is string => line !== null);
  const footer = (
    <View style={s.foot} fixed>
      <View style={{ flexDirection: "row" }}>
        <Text style={[s.footB, { marginRight: 4 }]}>{t("footerBrand")}</Text>
        <Text>{t("footer", { date: props.now })}</Text>
      </View>
      <Text
        render={({ pageNumber, totalPages }) => t("page", { page: pageNumber, total: totalPages })}
      />
    </View>
  );
  const logo = (
    <View style={s.logo}>
      <Text style={s.logoJ}>{t("logo.mark")}</Text>
      <Text style={s.logoT}>{t("logo.name")}</Text>
    </View>
  );
  const kpis = [
    { value: n(basic.applications), label: t("kpi.applications", { count: basic.applications }) },
    { value: days(stats?.responseTime ?? null), label: t("kpi.delay") },
    { value: n(basic.interviews), label: t("kpi.interviews", { count: basic.interviews }) },
    { value: n(basic.hires), label: t("kpi.hires", { count: basic.hires }) },
  ];
  const funnelMax = stats?.funnel[0]?.count ?? 0;
  const modes = extra.interviewModes
    .map((row) => t(`mode.${row.mode as "video" | "onsite" | "audio"}`, { count: row.count }))
    .join(", ");
  const interviewTotal = extra.interviewModes.reduce((sum, row) => sum + row.count, 0);

  const doc = (
    <Document
      title={t("kicker")}
      author="Jumanly"
      creator="Jumanly"
      producer="Jumanly"
      language="fr"
    >
      <Page size="A4" style={s.page}>
        <View style={s.head}>
          {logo}
          <Text style={s.kicker}>{t("kicker")}</Text>
          <Text style={s.h1}>{props.org}</Text>
          <Text style={s.lead}>
            {t("lead", { from: range.from, to: range.to, count: basic.activeJobs })}
          </Text>
        </View>
        <View style={s.body}>
          <Text style={s.title}>{t("essential")}</Text>
          <View style={s.kpis}>
            {kpis.map((kpi, index) => (
              <View
                key={index}
                style={[
                  s.kpi,
                  { backgroundColor: tiles[index] },
                  index === 3 ? { marginRight: 0 } : {},
                ]}
              >
                <Text style={s.kpiB}>{kpi.value}</Text>
                <Text>{kpi.label}</Text>
              </View>
            ))}
          </View>
          <View style={s.grid}>
            {stats && (
              <View style={[s.card, s.cardGap]}>
                <Text style={s.h3}>{t("funnel")}</Text>
                {stats.funnel.map((step) => (
                  <View key={step.kind} style={s.bar}>
                    <Text style={s.barL}>{t(`stage.${step.kind}`)}</Text>
                    <View style={s.track}>
                      <View style={[s.fill, { width: pct(step.count, funnelMax) }]} />
                    </View>
                    <Text style={s.barV}>{n(step.count)}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={s.card}>
              <Text style={s.h3}>{t("weekly")}</Text>
              <View style={s.weeks}>
                {basic.weekly.map((count, index) => (
                  <View key={index} style={s.week}>
                    <Text style={s.muted}>{n(count)}</Text>
                    <View
                      style={[
                        s.weekBar,
                        { height: pct(count, weekMax) },
                        index === basic.weekly.length - 1 ? { backgroundColor: c.sapin } : {},
                      ]}
                    />
                    <Text style={s.weekL}>{t("week", { n: index + 1 })}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <Text style={s.title}>{t("byJob")}</Text>
          <View style={s.th}>
            <Text style={s.cJob}>{t("col.job")}</Text>
            <Text style={s.cSt}>{t("col.status")}</Text>
            <Text style={s.cNh}>{t("col.views")}</Text>
            <Text style={s.cNh}>{t("col.applications")}</Text>
            <Text style={s.cNh}>{t("col.interviews")}</Text>
            <Text style={s.cNh}>{t("col.delay")}</Text>
          </View>
          {extra.offers.length === 0 && (
            <View style={s.tr}>
              <Text style={s.muted}>{t("noJobs")}</Text>
            </View>
          )}
          {extra.offers.map((offer, index) => {
            const live = offer.status !== "pending_review" && offer.status !== "draft";
            return (
              <View key={index} style={s.tr} wrap={false}>
                <View style={s.cJob}>
                  <View style={[s.dot, { backgroundColor: dots[index % dots.length] }]} />
                  <Text>{offer.title}</Text>
                </View>
                <Text style={s.cSt}>{t(`status.${offer.status}`)}</Text>
                <Text style={s.cN}>{live ? n(offer.views) : t("none")}</Text>
                <Text style={s.cN}>{live ? n(offer.applications) : t("none")}</Text>
                <Text style={s.cN}>{live ? n(offer.interviews) : t("none")}</Text>
                <Text style={s.cN}>{live ? days(offer.delay) : t("none")}</Text>
              </View>
            );
          })}
        </View>
        {footer}
      </Page>
      <Page size="A4" style={s.page}>
        <View style={s.mini} fixed>
          {logo}
          <Text style={s.miniT}>
            {t("mini", { org: props.org, from: range.from, to: range.to })}
          </Text>
        </View>
        <View style={s.body}>
          <Text style={s.title}>{t("origin")}</Text>
          <View style={s.grid}>
            {stats && (
              <View style={[s.card, s.cardGap]}>
                <Text style={s.h3}>{t("sources")}</Text>
                <View style={[s.split, { backgroundColor: c.piste }]}>
                  {stats.sources
                    .filter((row) => row.count > 0)
                    .map((row, index) => (
                      <View
                        key={row.source}
                        style={{
                          width: pct(row.count, sourceTotal),
                          backgroundColor: [c.menthe, c.lime, c.ambre][index % 3],
                        }}
                      />
                    ))}
                </View>
                {stats.sources.map((row) => (
                  <View key={row.source} style={s.row}>
                    <Text>{t(`source.${row.source}`)}</Text>
                    <Text style={s.footB}>{n(row.count)}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={s.card}>
              <Text style={s.h3}>{t("delays")}</Text>
              {(["fast", "week", "slow"] as const).map((band) => (
                <View key={band} style={s.bar}>
                  <Text style={s.barL}>{t(`delay.${band}`)}</Text>
                  <View style={s.track}>
                    <View
                      style={[
                        s.fill,
                        { width: `${extra.delays[band] ?? 0}%` },
                        band === "slow" ? { backgroundColor: c.ambre } : {},
                      ]}
                    />
                  </View>
                  <Text style={s.barV}>
                    {extra.delays[band] === null
                      ? t("none")
                      : t("percent", { value: extra.delays[band] })}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={s.title}>{t("decisions")}</Text>
          <View style={s.kpis}>
            <View style={s.stat}>
              <Text style={s.statB}>{n(interviewTotal)}</Text>
              <Text>{t("interviews", { count: interviewTotal })}</Text>
              {modes !== "" && <Text style={s.muted}>{modes}</Text>}
            </View>
            {scorecards && scorecards.average !== null && (
              <View style={s.stat}>
                <Text style={s.statB}>
                  {f.number(scorecards.average, { maximumFractionDigits: 1 })}
                </Text>
                <Text>{t("rating")}</Text>
              </View>
            )}
            <View style={s.stat}>
              <Text style={s.statB}>{n(basic.hires)}</Text>
              <Text>{t("hired", { count: basic.hires })}</Text>
            </View>
            <View style={[s.stat, { marginRight: 0 }]}>
              <Text style={s.statB}>{n(extra.rejectionReplies)}</Text>
              <Text>{t("rejections", { count: extra.rejectionReplies })}</Text>
            </View>
          </View>
          <Text style={s.title}>{t("orbi.title")}</Text>
          <View style={s.kpis}>
            <View style={[s.stat, { backgroundColor: tiles[0] }]}>
              <Text style={s.statB}>{n(extra.orbi.analysed)}</Text>
              <Text>{t("orbi.analysed", { count: extra.orbi.analysed })}</Text>
            </View>
            <View style={[s.stat, { backgroundColor: tiles[1] }]}>
              <Text style={s.statB}>{n(extra.orbi.drafts)}</Text>
              <Text>{t("orbi.drafts", { count: extra.orbi.drafts })}</Text>
            </View>
            <View style={[s.stat, { backgroundColor: tiles[2], marginRight: 0 }]}>
              <Text style={s.statB}>{n(extra.orbi.credits?.used ?? 0)}</Text>
              <Text>
                {extra.orbi.credits
                  ? t("orbi.credits", { limit: n(extra.orbi.credits.limit) })
                  : t("orbi.creditsUnlimited")}
              </Text>
            </View>
          </View>
          <Text style={s.title}>{t("reading.title")}</Text>
          <View style={s.note} wrap={false}>
            <View style={s.orbi}>
              <View style={s.orbiIn} />
            </View>
            <Text style={s.noteT}>{[...reading, t("reading.note")].join(" ")}</Text>
          </View>
          {props.rows.length > 0 && (
            <>
              <Text style={s.title} break={false}>
                {t("details")}
              </Text>
              {props.rows.map((row, index) => (
                <View key={index} style={s.detail} wrap={false}>
                  <Text style={{ maxWidth: "70%" }}>
                    {t("detailRow", { section: row.section, name: row.name })}
                  </Text>
                  <Text style={s.footB}>{row.value}</Text>
                </View>
              ))}
            </>
          )}
        </View>
        {footer}
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
