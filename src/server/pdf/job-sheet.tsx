/**
 * The job sheet in PDF (« Fiche de poste », publication d'offre étape par étape, 29/10/2026):
 * the company's logo in a rounded square with its name on the left, the Jumanly logo on the
 * right, in Sora. The post and its key facts sit in a band, then two columns: the text (company,
 * post, responsibilities, profile) and a side panel (skills, languages, how to apply with a QR
 * code). A security background (guilloche lines and a micro-text line) that a photocopy does not
 * keep, the seal « Document original » and the authentication number, checked on
 * jumanly.io/verifier/fiche. Drawn by react-pdf: no browser is needed, so the download works on
 * every server. Every text arrives translated in `labels`; the content is the recruiter's.
 */
import path from "node:path";
import {
  Circle,
  Defs,
  Document,
  Font,
  G,
  Image,
  LinearGradient,
  Page,
  Path,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ComponentProps } from "react";

const FONTS = path.join(process.cwd(), "public", "fonts", "cv");
Font.register({
  family: "Sora",
  fonts: [
    { src: path.join(FONTS, "Sora-300.ttf"), fontWeight: 300 },
    { src: path.join(FONTS, "Sora-400.ttf"), fontWeight: 400 },
    { src: path.join(FONTS, "Sora-500.ttf"), fontWeight: 500 },
    { src: path.join(FONTS, "Sora-600.ttf"), fontWeight: 600 },
    { src: path.join(FONTS, "Sora-700.ttf"), fontWeight: 700 },
  ],
});
// Words are never cut with a hyphen.
Font.registerHyphenationCallback((word) => [word]);

/** The Jumanly logo drawn in the sheet (rasterized from this file by the caller). */
export const JOB_SHEET_BRAND_LOGO = path.join(
  process.cwd(),
  "public",
  "marque",
  "jumanly-logo-principal.svg",
);
/** Width / height of that logo. */
const BRAND_RATIO = 578.3 / 120;

const color = {
  sapin: "#0F3F37",
  profond: "#14745F",
  menthe: "#1FA98A",
  lime: "#A6F26B",
  limeClair: "#EEF9D9",
  creme: "#F7F4EE",
  ardoise: "#5B6B68",
  brume: "#DCE5E1",
  blanc: "#FFFFFF",
  feuille: "#3DA14F",
  texte: "#23413B",
};

export type JobSheetLabels = {
  kind: string;
  facts: {
    contract: string;
    place: string;
    remote: string;
    openings: string;
    experience: string;
    education: string;
    closesAt: string;
  };
  company: string;
  post: string;
  responsibilities: string;
  hardSkills: string;
  softSkills: string;
  profile: string;
  languages: string;
  salary: string;
  salaryPeriod: string;
  applyTitle: string;
  applyText: string;
  applyFree: string;
  /** At the top of the seal: « ORIGINAL ». */
  seal: string;
  /** At its bottom: « JUMANLY ». */
  sealCenter: string;
  /** « N° d'authentification ». */
  codeLabel: string;
  /** « Vérifiez l'authenticité de cette fiche sur ». */
  verify: string;
  /** « Fiche émise par Jumanly le … pour … ». */
  issued: string;
  /** Repeated in the micro-text line. */
  microtext: string;
  footer: string;
  /** « Page 1 sur 2 ». */
  page: (page: number, total: number) => string;
};

export type JobSheetData = {
  org: {
    name: string;
    /** Logo in PNG or JPEG (react-pdf reads no WebP), or the initials in the square. */
    logo: Buffer | null;
    initials: string;
    /** « Banque · Kinshasa ». */
    line: string;
  };
  /** The Jumanly logo in PNG. */
  brandLogo: Buffer;
  title: string;
  /** « Kinshasa, RD Congo ». */
  place: string;
  contract: string;
  remote: string;
  openings: string;
  experience: string;
  education: string | null;
  closesAt: string | null;
  about: string;
  description: string;
  responsibilities: string[];
  hardSkills: string[];
  softSkills: string[];
  requirements: string[];
  languages: { name: string; level: string }[];
  /** « 600 à 900 USD », or null when the recruiter hides it. */
  salary: string | null;
  applyUrl: string;
  /** The QR code of `applyUrl`, a PNG data URL. */
  qr: string;
  /** « JMLY-7K3Q-9XA2 ». */
  code: string;
  /** « jumanly.io/verifier/JMLY-7K3Q-9XA2 ». */
  verifyUrl: string;
};

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 30;
const CONTENT_WIDTH = A4.width - 2 * MARGIN;

const s = StyleSheet.create({
  page: {
    paddingTop: 26,
    paddingBottom: 58,
    paddingHorizontal: MARGIN,
    fontFamily: "Sora",
    fontSize: 8.6,
    color: color.texte,
    backgroundColor: color.blanc,
  },
  background: { position: "absolute", top: 0, left: 0 },
  strip: { position: "absolute", top: 0, left: 0 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  org: { flexDirection: "row", alignItems: "center", maxWidth: 360 },
  logoBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.brume,
    backgroundColor: color.blanc,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 10,
  },
  logo: { width: 40, height: 40, objectFit: "contain" },
  initialsBox: { backgroundColor: color.sapin, borderColor: color.sapin },
  initials: { color: color.lime, fontWeight: 700, fontSize: 15 },
  orgName: { fontWeight: 700, fontSize: 12, color: color.sapin },
  orgLine: { color: color.ardoise, fontSize: 7.8, marginTop: 2 },
  brandLogo: { width: 26 * BRAND_RATIO, height: 26 },
  hero: {
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroBg: { position: "absolute", top: 0, left: 0 },
  heroMain: { flex: 1, paddingRight: 12 },
  kind: {
    alignSelf: "flex-start",
    backgroundColor: color.lime,
    color: color.sapin,
    borderRadius: 20,
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    fontSize: 6.8,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: { color: color.blanc, fontSize: 20, fontWeight: 700, marginTop: 7 },
  heroLine: { color: "#D8ECE5", fontSize: 8.8, marginTop: 4 },
  heroSalary: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 11,
    alignItems: "flex-end",
  },
  heroSalaryLabel: { color: color.lime, fontSize: 6.8, fontWeight: 600, letterSpacing: 0.9 },
  heroSalaryValue: { color: color.blanc, fontSize: 13, fontWeight: 700, marginTop: 2 },
  heroSalaryPeriod: { color: "#D8ECE5", fontSize: 7.2, marginTop: 1 },
  facts: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: color.brume,
    borderRadius: 12,
    backgroundColor: color.blanc,
    paddingVertical: 4,
  },
  fact: { width: "25%", paddingVertical: 5, paddingHorizontal: 10 },
  factLabel: {
    fontSize: 6.3,
    fontWeight: 600,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: color.ardoise,
  },
  factValue: { fontWeight: 600, fontSize: 8.8, marginTop: 2, color: color.sapin },
  body: { flexDirection: "row", marginTop: 8 },
  main: { flex: 1, paddingRight: 14 },
  side: {
    width: 190,
    backgroundColor: color.creme,
    borderRadius: 12,
    padding: 11,
  },
  section: { marginBottom: 9 },
  h2Row: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  h2Bar: { width: 3.5, height: 11, borderRadius: 2, backgroundColor: color.lime, marginRight: 6 },
  h2: { fontWeight: 700, fontSize: 10.5, color: color.sapin },
  paragraph: { color: color.texte },
  numbered: { flexDirection: "row", marginBottom: 4, alignItems: "flex-start" },
  number: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: color.sapin,
    color: color.lime,
    fontWeight: 700,
    fontSize: 7.2,
    textAlign: "center",
    paddingTop: 3,
    marginRight: 7,
  },
  itemText: { flex: 1, paddingTop: 1.5 },
  check: { flexDirection: "row", marginBottom: 4, alignItems: "flex-start" },
  checkDot: { width: 11, height: 11, marginRight: 6, marginTop: 1 },
  sideTitle: {
    fontWeight: 700,
    fontSize: 7.2,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: color.sapin,
    marginBottom: 5,
  },
  sideBlock: { marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  chipHard: {
    backgroundColor: color.lime,
    color: color.sapin,
    borderRadius: 20,
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    marginRight: 4,
    marginBottom: 4,
    fontSize: 7.6,
    fontWeight: 600,
  },
  chipSoft: {
    backgroundColor: color.blanc,
    borderWidth: 1,
    borderColor: "#CFE7B5",
    color: color.sapin,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 7,
    marginRight: 4,
    marginBottom: 4,
    fontSize: 7.6,
    fontWeight: 600,
  },
  language: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: color.brume,
    paddingVertical: 3,
  },
  languageLevel: { fontWeight: 700, color: color.feuille },
  apply: { backgroundColor: color.sapin, borderRadius: 11, padding: 10, alignItems: "center" },
  applyTitle: { color: color.blanc, fontWeight: 700, fontSize: 9.5, textAlign: "center" },
  applyText: { color: "#D8ECE5", marginTop: 3, fontSize: 7.4, textAlign: "center" },
  qrBox: { backgroundColor: color.blanc, borderRadius: 8, padding: 5, marginTop: 7 },
  qr: { width: 74, height: 74 },
  applyLink: {
    color: color.lime,
    fontWeight: 600,
    marginTop: 6,
    fontSize: 5.8,
    textAlign: "center",
  },
  applyFree: {
    marginTop: 6,
    backgroundColor: color.lime,
    color: color.sapin,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 9,
    fontWeight: 700,
    fontSize: 7.4,
  },
  auth: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: color.brume,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: color.blanc,
  },
  authBody: { flex: 1, paddingLeft: 12 },
  codeLabel: {
    fontSize: 6.3,
    fontWeight: 600,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: color.ardoise,
  },
  code: { fontWeight: 700, fontSize: 12, letterSpacing: 1.4, color: color.sapin, marginTop: 1 },
  authLine: { fontSize: 7.2, color: color.ardoise, marginTop: 3 },
  authLink: { fontWeight: 600, color: color.profond },
  microtext: {
    position: "absolute",
    left: MARGIN,
    right: MARGIN,
    bottom: 44,
    fontSize: 3.2,
    letterSpacing: 0.4,
    color: color.menthe,
    maxLines: 1,
  },
  footer: { position: "absolute", left: MARGIN, bottom: 26, fontSize: 7, color: color.ardoise },
  pageNumber: {
    position: "absolute",
    right: MARGIN,
    width: 220,
    bottom: 26,
    fontSize: 7,
    color: color.ardoise,
    textAlign: "right",
  },
  sealTop: {
    position: "absolute",
    top: 6,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 4.6,
    fontWeight: 700,
    letterSpacing: 0.8,
    color: color.profond,
  },
  sealBottom: {
    position: "absolute",
    bottom: 6,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 4.4,
    fontWeight: 700,
    letterSpacing: 0.6,
    color: color.profond,
  },
});

function Gradient({
  id,
  width,
  height,
  style,
}: {
  id: string;
  width: number;
  height: number;
  style?: ComponentProps<typeof Svg>["style"];
}) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={color.sapin} />
          <Stop offset="0.62" stopColor={color.profond} />
          <Stop offset="1" stopColor={color.menthe} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
}

/** A wave of the guilloche: a sine line across the page. */
function wave(y: number, amplitude: number, period: number, phase: number, width: number) {
  const points: string[] = [];
  for (let x = 0; x <= width + 6; x += 6) {
    const value = y + amplitude * Math.sin((x / period) * 2 * Math.PI + phase);
    points.push(`${x === 0 ? "M" : "L"}${x.toFixed(1)} ${value.toFixed(2)}`);
  }
  return points.join(" ");
}

/** The centers of a rosette: circles turned around one point. */
function rosette(cx: number, cy: number, radius: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * 2 * Math.PI;
    return { cx: cx + (radius / 2) * Math.cos(angle), cy: cy + (radius / 2) * Math.sin(angle) };
  });
}

const WAVES = Array.from({ length: 34 }, (_, index) => index);

/**
 * The security background of every page: thin crossing waves in two greens, too fine to survive a
 * photocopy, and a faint rosette in the lower corner.
 */
function SecurityBackground() {
  return (
    <Svg
      width={A4.width}
      height={A4.height}
      viewBox={`0 0 ${A4.width} ${A4.height}`}
      style={s.background}
      fixed
    >
      <G opacity={0.12}>
        {WAVES.map((index) => (
          <Path
            key={`a${index}`}
            d={wave(40 + index * 24, 9, 160, index * 0.42, A4.width)}
            stroke={color.menthe}
            strokeWidth={0.35}
            fill="none"
          />
        ))}
        {WAVES.map((index) => (
          <Path
            key={`b${index}`}
            d={wave(52 + index * 24, 7, 110, -index * 0.55 + 1.3, A4.width)}
            stroke={color.feuille}
            strokeWidth={0.3}
            fill="none"
          />
        ))}
      </G>
      <G opacity={0.08}>
        {rosette(A4.width - 80, A4.height - 150, 90, 18).map((circle, index) => (
          <Circle
            key={index}
            cx={circle.cx}
            cy={circle.cy}
            r={45}
            stroke={color.profond}
            strokeWidth={0.4}
            fill="none"
          />
        ))}
      </G>
    </Svg>
  );
}

/** The seal « Original · Jumanly »: rings, a rosette and the Jumanly pictogram. */
function Seal({ labels }: { labels: JobSheetLabels }) {
  const size = 68;
  const c = size / 2;
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={c} cy={c} r={32.5} stroke={color.profond} strokeWidth={1.4} fill="none" />
        <Circle
          cx={c}
          cy={c}
          r={29.5}
          stroke={color.menthe}
          strokeWidth={0.5}
          strokeDasharray="1.2 1.2"
          fill="none"
        />
        {rosette(c, c, 20, 14).map((circle, index) => (
          <Circle
            key={index}
            cx={circle.cx}
            cy={circle.cy}
            r={10}
            stroke={color.feuille}
            strokeWidth={0.3}
            fill="none"
            opacity={0.6}
          />
        ))}
        <Circle cx={c} cy={c} r={12} fill={color.sapin} />
        {/* The pictogram (viewBox 23.5 19.5 58 78), 15 points high in the middle. */}
        <G transform={`translate(${c - 5.6} ${c - 7.5}) scale(0.1923) translate(-23.5 -19.5)`}>
          <Path
            d="M70 55 V70 A19 19 0 0 1 33.15 76.50"
            fill="none"
            stroke={color.blanc}
            strokeWidth={17}
            strokeLinecap="round"
          />
          <Circle cx={70} cy={31} r={11.5} fill={color.lime} />
        </G>
      </Svg>
      <Text style={s.sealTop}>{labels.seal}</Text>
      <Text style={s.sealBottom}>{labels.sealCenter}</Text>
    </View>
  );
}

function CheckDot() {
  return (
    <Svg style={s.checkDot} viewBox="0 0 12 12">
      <Circle cx={6} cy={6} r={6} fill={color.limeClair} />
      <Path
        d="M3.4 6.2 L5.2 8 L8.7 4.3"
        fill="none"
        stroke={color.feuille}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function Heading({ children }: { children: string }) {
  return (
    <View style={s.h2Row} minPresenceAhead={30}>
      <View style={s.h2Bar} />
      <Text style={s.h2}>{children}</Text>
    </View>
  );
}

export function JobSheetDocument({
  labels,
  data,
  brand = "Jumanly",
}: {
  labels: JobSheetLabels;
  data: JobSheetData;
  brand?: string;
}) {
  const facts = [
    { label: labels.facts.contract, value: data.contract },
    { label: labels.facts.place, value: data.place },
    { label: labels.facts.remote, value: data.remote },
    { label: labels.facts.openings, value: data.openings },
    { label: labels.facts.experience, value: data.experience },
    ...(data.education ? [{ label: labels.facts.education, value: data.education }] : []),
    ...(data.closesAt ? [{ label: labels.facts.closesAt, value: data.closesAt }] : []),
  ];
  const microtext = Array.from({ length: 12 }, () => `${labels.microtext} ${data.code}`).join(
    "  ·  ",
  );
  return (
    <Document
      title={`${labels.kind} · ${data.title} · ${data.org.name}`}
      author={data.org.name}
      subject={`${labels.codeLabel} ${data.code}`}
      creator={brand}
      producer={brand}
    >
      <Page size="A4" style={s.page}>
        <SecurityBackground />
        <Gradient id="strip" width={A4.width} height={5} style={s.strip} />

        <View style={s.head}>
          <View style={s.org}>
            <View style={data.org.logo ? s.logoBox : [s.logoBox, s.initialsBox]}>
              {data.org.logo ? (
                // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf image, no alt
                <Image style={s.logo} src={data.org.logo} />
              ) : (
                <Text style={s.initials}>{data.org.initials}</Text>
              )}
            </View>
            <View>
              <Text style={s.orgName}>{data.org.name}</Text>
              {data.org.line ? <Text style={s.orgLine}>{data.org.line}</Text> : null}
            </View>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf image, no alt */}
          <Image style={s.brandLogo} src={data.brandLogo} />
        </View>

        <View style={s.hero}>
          <Gradient id="hero" width={CONTENT_WIDTH} height={200} style={s.heroBg} />
          <View style={s.heroMain}>
            <Text style={s.kind}>{labels.kind}</Text>
            <Text style={s.title}>{data.title}</Text>
            <Text style={s.heroLine}>
              {[data.place, data.contract, data.remote].filter(Boolean).join("  ·  ")}
            </Text>
          </View>
          {data.salary ? (
            <View style={s.heroSalary}>
              <Text style={s.heroSalaryLabel}>{labels.salary.toUpperCase()}</Text>
              <Text style={s.heroSalaryValue}>{data.salary}</Text>
              <Text style={s.heroSalaryPeriod}>{labels.salaryPeriod}</Text>
            </View>
          ) : null}
        </View>

        <View style={s.facts}>
          {facts.map((fact) => (
            <View key={fact.label} style={s.fact}>
              <Text style={s.factLabel}>{fact.label}</Text>
              <Text style={s.factValue}>{fact.value}</Text>
            </View>
          ))}
        </View>

        <View style={s.body}>
          <View style={s.main}>
            {data.about ? (
              <View style={s.section}>
                <Heading>{labels.company}</Heading>
                <Text style={s.paragraph}>{data.about}</Text>
              </View>
            ) : null}
            {data.description ? (
              <View style={s.section}>
                <Heading>{labels.post}</Heading>
                <Text style={s.paragraph}>{data.description}</Text>
              </View>
            ) : null}
            {data.responsibilities.length > 0 ? (
              <View style={s.section}>
                <Heading>{labels.responsibilities}</Heading>
                {data.responsibilities.map((item, index) => (
                  <View key={index} style={s.numbered} wrap={false}>
                    <Text style={s.number}>{index + 1}</Text>
                    <Text style={s.itemText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {data.requirements.length > 0 ? (
              <View style={s.section}>
                <Heading>{labels.profile}</Heading>
                {data.requirements.map((item, index) => (
                  <View key={index} style={s.check} wrap={false}>
                    <CheckDot />
                    <Text style={s.itemText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={s.auth} wrap={false}>
              <Seal labels={labels} />
              <View style={s.authBody}>
                <Text style={s.codeLabel}>{labels.codeLabel}</Text>
                <Text style={s.code}>{data.code}</Text>
                <Text style={s.authLine}>
                  {labels.verify} <Text style={s.authLink}>{data.verifyUrl}</Text>
                </Text>
                <Text style={s.authLine}>{labels.issued}</Text>
              </View>
            </View>
          </View>

          <View style={s.side}>
            {data.hardSkills.length > 0 ? (
              <View style={s.sideBlock}>
                <Text style={s.sideTitle}>{labels.hardSkills}</Text>
                <View style={s.chips}>
                  {data.hardSkills.map((name) => (
                    <Text key={name} style={s.chipHard}>
                      {name}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}
            {data.softSkills.length > 0 ? (
              <View style={s.sideBlock}>
                <Text style={s.sideTitle}>{labels.softSkills}</Text>
                <View style={s.chips}>
                  {data.softSkills.map((name) => (
                    <Text key={name} style={s.chipSoft}>
                      {name}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}
            {data.languages.length > 0 ? (
              <View style={s.sideBlock}>
                <Text style={s.sideTitle}>{labels.languages}</Text>
                {data.languages.map((language) => (
                  <View key={language.name} style={s.language}>
                    <Text>{language.name}</Text>
                    <Text style={s.languageLevel}>{language.level}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={s.apply} wrap={false}>
              <Text style={s.applyTitle}>{labels.applyTitle}</Text>
              <Text style={s.applyText}>{labels.applyText}</Text>
              <View style={s.qrBox}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf image, no alt */}
                <Image style={s.qr} src={data.qr} />
              </View>
              <Text style={s.applyLink}>{data.applyUrl.replace(/^https?:\/\//, "")}</Text>
              <Text style={s.applyFree}>{labels.applyFree}</Text>
            </View>
          </View>
        </View>

        <Text style={s.microtext} fixed>
          {microtext}
        </Text>
        <Text style={s.footer} fixed>
          {labels.footer}
        </Text>
        <Text
          style={s.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) => labels.page(pageNumber, totalPages)}
        />
      </Page>
    </Document>
  );
}

export function renderJobSheet(props: Parameters<typeof JobSheetDocument>[0]) {
  return renderToBuffer(<JobSheetDocument {...props} />);
}
