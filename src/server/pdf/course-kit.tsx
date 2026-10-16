/**
 * The PDFs of a course (Admin v3, étape 6) on one template in the colors of the site: a deep
 * gradient band with the Jumanly mark on the first page, a thin gradient strip on the next ones,
 * and a footer with jumanly.io and the contact e-mails (never a phone number). Every text arrives
 * translated through `t`.
 */
import {
  Circle,
  Defs,
  Document,
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
import type { ReactNode } from "react";
import type {
  ProgrammeData,
  QuizKeyData,
  ReportData,
  SupportData,
} from "@/server/services/course-pdf";

/** A translator of the `learn.pdf.doc` texts. */
export type PdfT = (key: string, values?: Record<string, string | number | Date>) => string;

const color = {
  sapin: "#0F3F37",
  profond: "#14745F",
  menthe: "#1FA98A",
  lime: "#A6F26B",
  limeClair: "#EEF9D9",
  creme: "#F2EDE5",
  ardoise: "#5B6B68",
  brume: "#DCE5E1",
  blanc: "#FFFFFF",
  feuille: "#3DA14F",
};

/** The band of the first page: fixed height, so the gradient fills it exactly. */
const HERO_HEIGHT = 180;

const s = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 64,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: color.sapin,
    backgroundColor: color.blanc,
  },
  strip: { position: "absolute", top: 0, left: 0, right: 0, height: 6 },
  hero: {
    marginTop: -44,
    marginHorizontal: -44,
    paddingHorizontal: 44,
    paddingTop: 30,
    height: HERO_HEIGHT,
    marginBottom: 22,
    position: "relative",
  },
  heroBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 15, color: color.blanc, marginLeft: 7 },
  eyebrow: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: color.lime,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    lineHeight: 1.2,
    color: color.blanc,
    marginTop: 6,
  },
  subtitle: { fontSize: 10.5, color: "#D8ECE5", marginTop: 6, maxWidth: 440 },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 13, marginTop: 16, marginBottom: 6 },
  h3: { fontFamily: "Helvetica-Bold", fontSize: 11, marginTop: 10, marginBottom: 3 },
  label: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: color.ardoise,
  },
  muted: { color: color.ardoise },
  paragraph: { marginBottom: 5, lineHeight: 1.45 },
  facts: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
  fact: {
    width: "25%",
    paddingRight: 8,
    marginBottom: 8,
  },
  factValue: { fontFamily: "Helvetica-Bold", fontSize: 10.5, marginTop: 2 },
  bullet: { flexDirection: "row", marginBottom: 3 },
  dot: { width: 10, color: color.feuille, fontFamily: "Helvetica-Bold" },
  card: {
    borderWidth: 1,
    borderColor: color.brume,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  moduleHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: color.creme,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: color.brume,
  },
  rowName: { maxWidth: "75%" },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
  chip: {
    backgroundColor: color.limeClair,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 7,
    marginRight: 5,
    marginBottom: 5,
    fontSize: 9,
  },
  option: { flexDirection: "row", marginBottom: 2, paddingLeft: 4 },
  optionMark: { width: 14, fontFamily: "Helvetica-Bold" },
  right: { fontFamily: "Helvetica-Bold", color: color.feuille },
  note: {
    backgroundColor: color.creme,
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    fontSize: 9,
    lineHeight: 1.4,
  },
  footerLine: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 44,
    height: 1,
    backgroundColor: color.brume,
  },
  footer: { position: "absolute", left: 44, bottom: 28, fontSize: 8, color: color.ardoise },
  pageNumber: {
    position: "absolute",
    left: 291,
    width: 260,
    bottom: 28,
    fontSize: 8,
    color: color.ardoise,
    textAlign: "right",
  },
});

/** The Jumanly pictogram: the white « j » with its lime dot. */
function Mark({ size = 22 }: { size?: number }) {
  return (
    <Svg width={(size * 58) / 78} height={size} viewBox="23.5 19.5 58 78">
      <Path
        d="M70 55 V70 A19 19 0 0 1 33.15 76.50"
        fill="none"
        stroke={color.blanc}
        strokeWidth={17}
        strokeLinecap="round"
      />
      <Circle cx={70} cy={31} r={11.5} fill={color.lime} />
    </Svg>
  );
}

function Gradient({ id, width, height }: { id: string; width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
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

/** A4 page width in points; the band spans it. */
const A4_WIDTH = 595.28;

/** One course PDF: hero band, content, footer with the page number. */
export function CourseKitDocument({
  t,
  brand,
  eyebrow,
  title,
  subtitle,
  generatedAt,
  children,
}: {
  t: PdfT;
  brand: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  generatedAt: Date;
  children: ReactNode;
}) {
  return (
    <Document title={`${eyebrow} · ${title}`} author={brand} creator={brand} producer={brand}>
      <Page size="A4" style={s.page}>
        <View style={s.strip} fixed>
          <Gradient id="strip" width={A4_WIDTH} height={6} />
        </View>
        <View style={s.hero}>
          <View style={s.heroBg}>
            <Gradient id="hero" width={A4_WIDTH} height={HERO_HEIGHT} />
          </View>
          <View style={s.brandRow}>
            <Mark />
            <Text style={s.brand}>{brand.toLowerCase()}</Text>
          </View>
          <Text style={s.eyebrow}>{eyebrow}</Text>
          <Text style={[s.title, { maxLines: 2, textOverflow: "ellipsis" }]}>{title}</Text>
          {subtitle ? (
            <Text style={[s.subtitle, { maxLines: 3, textOverflow: "ellipsis" }]}>{subtitle}</Text>
          ) : null}
        </View>
        {/* No line height on the page: react-pdf drops a `render` text that inherits one. */}
        {children}
        {/* Separate fixed texts: react-pdf drops a fixed View holding a `render` text. */}
        <View style={s.footerLine} fixed />
        <Text style={s.footer} fixed>
          {t("footer")}
        </Text>
        <Text
          style={s.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) =>
            `${t("generated", { date: generatedAt })} · ${t("page", { page: pageNumber, total: totalPages })}`
          }
        />
      </Page>
    </Document>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={index} style={s.bullet} wrap={false}>
          <Text style={s.dot}>•</Text>
          <Text style={{ flex: 1 }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.fact}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.factValue}>{value}</Text>
    </View>
  );
}

const duration = (t: PdfT, minutes: number) =>
  minutes >= 60
    ? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${String(minutes % 60).padStart(2, "0")}` : ""}`
    : t("minutes", { minutes });

const moduleMinutes = (module: { lessons: { minutes: number }[] }) =>
  module.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);

// ─── Programme ─────────────────────────────────────────────────────────────────

export function ProgrammeBody({ t, data, url }: { t: PdfT; data: ProgrammeData; url: string }) {
  return (
    <View>
      <View style={s.facts}>
        <Fact label={t("program.level")} value={t(`level.${data.level}`)} />
        <Fact label={t("program.duration")} value={duration(t, data.durationMinutes)} />
        <Fact
          label={t("program.lessons")}
          value={t("program.lessonsValue", { modules: data.modules.length, lessons: data.lessons })}
        />
        <Fact
          label={t("program.certificate")}
          value={t(data.certificate ? "program.certificateYes" : "program.certificateNo")}
        />
      </View>
      <Text style={s.h2}>{t("program.audience")}</Text>
      <Text style={s.paragraph}>{data.audience}</Text>
      <Text style={s.h2}>{t("program.prerequisites")}</Text>
      <Text style={s.paragraph}>{data.prerequisites || t("program.prerequisitesNone")}</Text>
      {data.objectives.length > 0 && (
        <>
          <Text style={s.h2}>{t("program.objectives")}</Text>
          <Bullets items={data.objectives} />
        </>
      )}
      <Text style={s.h2}>{t("program.program")}</Text>
      {data.modules.map((module, index) => (
        <View key={index} wrap={false}>
          <View style={s.moduleHead}>
            <Text>{t("module", { number: index + 1, title: module.title })}</Text>
            <Text>{moduleMinutes(module) > 0 ? duration(t, moduleMinutes(module)) : ""}</Text>
          </View>
          {module.lessons.map((lesson, key) => (
            <View key={key} style={s.row}>
              <Text style={s.rowName}>{lesson.title}</Text>
              <Text style={s.muted}>
                {t(`kind.${lesson.kind}`)}
                {lesson.minutes > 0 ? ` · ${t("minutes", { minutes: lesson.minutes })}` : ""}
              </Text>
            </View>
          ))}
        </View>
      ))}
      {data.skills.length > 0 && (
        <View wrap={false}>
          <Text style={s.h2}>{t("program.skills")}</Text>
          <View style={s.chips}>
            {data.skills.map((skill) => (
              <Text key={skill} style={s.chip}>
                {skill}
              </Text>
            ))}
          </View>
        </View>
      )}
      <Text style={[s.muted, { marginTop: 14 }]}>{t("program.url", { url })}</Text>
    </View>
  );
}

// ─── Support ───────────────────────────────────────────────────────────────────

export function SupportBody({
  t,
  data,
  documents,
}: {
  t: PdfT;
  data: SupportData;
  documents: string[];
}) {
  return (
    <View>
      <Text style={[s.muted, s.paragraph]}>{t("support.intro")}</Text>
      {data.modules.map((module, index) => (
        <View key={index} break={index > 0}>
          <View style={s.moduleHead}>
            <Text>{t("module", { number: index + 1, title: module.title })}</Text>
          </View>
          {module.lessons.map((lesson, key) => (
            <View key={key}>
              <Text style={s.h3} minPresenceAhead={40}>
                {lesson.title}
              </Text>
              <Text style={[s.label, { marginBottom: 4 }]}>
                {t(`kind.${lesson.kind}`)}
                {lesson.minutes > 0 ? ` · ${t("minutes", { minutes: lesson.minutes })}` : ""}
              </Text>
              {lesson.paragraphs.map((paragraph, line) => (
                <Text key={line} style={s.paragraph}>
                  {paragraph}
                </Text>
              ))}
              {lesson.transcript ? (
                <View style={s.note}>
                  <Text style={[s.label, { marginBottom: 3 }]}>{t("support.transcript")}</Text>
                  <Text>{lesson.transcript}</Text>
                </View>
              ) : null}
              {lesson.questions > 0 ? (
                <Text style={s.muted}>{t("support.quiz", { count: lesson.questions })}</Text>
              ) : null}
              {lesson.paragraphs.length === 0 && !lesson.transcript && lesson.questions === 0 ? (
                <Text style={s.muted}>{t("support.online")}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ))}
      {documents.length > 0 && (
        <View wrap={false}>
          <Text style={s.h2}>{t("support.documents")}</Text>
          <Bullets items={documents} />
          <Text style={s.muted}>{t("support.documentsHint")}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Quiz and answer key ───────────────────────────────────────────────────────

export function QuizKeyBody({ t, data }: { t: PdfT; data: QuizKeyData }) {
  if (data.quizzes.length === 0) return <Text style={s.muted}>{t("quiz.none")}</Text>;
  return (
    <View>
      {data.quizzes.map((quiz, index) => (
        <View key={index} break={index > 0}>
          <Text style={s.h2}>{t("quiz.title", { lesson: quiz.lesson })}</Text>
          <Text style={[s.muted, { marginBottom: 8 }]}>
            {t("quiz.rules", {
              score: quiz.passingScore,
              attempts: quiz.maxAttempts > 0 ? quiz.maxAttempts : t("quiz.unlimited"),
            })}
          </Text>
          {quiz.questions.length === 0 && <Text style={s.muted}>{t("quiz.empty")}</Text>}
          {quiz.questions.map((question, number) => (
            <View key={number} style={s.card} wrap={false}>
              <Text style={s.label}>
                {t("quiz.question", { number: number + 1 })} · {t(`quiz.type.${question.type}`)}
              </Text>
              <Text style={[s.h3, { marginTop: 3 }]}>{question.prompt}</Text>
              {question.options.map((option, key) => (
                <View key={key} style={s.option}>
                  <Text style={[s.optionMark, option.right ? s.right : s.muted]}>
                    {option.right ? "•" : "–"}
                  </Text>
                  <Text style={[{ flex: 1 }, option.right ? s.right : {}]}>
                    {option.text}
                    {option.right ? ` (${t("quiz.right")})` : ""}
                  </Text>
                </View>
              ))}
              {question.accepted.length > 0 && (
                <Text style={s.right}>
                  {t("quiz.accepted", { answers: question.accepted.join(" ; ") })}
                </Text>
              )}
              {question.explanation ? (
                <Text style={s.note}>{t("quiz.explanation", { text: question.explanation })}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── Report ────────────────────────────────────────────────────────────────────

function Line({ name, value }: { name: string; value: string | number }) {
  return (
    <View style={s.row}>
      <Text style={s.rowName}>{name}</Text>
      <Text style={{ fontFamily: "Helvetica-Bold" }}>{String(value)}</Text>
    </View>
  );
}

export function ReportBody({ t, data }: { t: PdfT; data: ReportData }) {
  return (
    <View>
      <Text style={[s.muted, s.paragraph]}>{t("report.privacy")}</Text>
      <View style={s.facts}>
        <Fact label={t("report.enrolled")} value={String(data.enrolled)} />
        <Fact label={t("report.completed")} value={String(data.completed)} />
        <Fact label={t("report.inProgress")} value={String(data.inProgress)} />
        <Fact
          label={t("report.completionRate")}
          value={t("report.percent", { value: data.completionRate })}
        />
      </View>
      <View wrap={false}>
        <Text style={s.h2}>{t("report.stops")}</Text>
        <Line name={t("report.notStarted")} value={data.notStarted} />
        {data.stops.map((stop, index) => (
          <Line
            key={index}
            name={t("module", { number: index + 1, title: stop.title })}
            value={stop.count}
          />
        ))}
      </View>
      <View wrap={false}>
        <Text style={s.h2}>{t("report.quizzes")}</Text>
        {data.quizzes.length === 0 && <Text style={s.muted}>{t("report.none")}</Text>}
        {data.quizzes.map((quiz, index) => (
          <View key={index} style={s.row}>
            <Text style={s.rowName}>{quiz.lesson}</Text>
            <Text style={s.muted}>
              {quiz.attempts
                ? t("report.quizLine", {
                    average: quiz.average,
                    attempts: quiz.attempts,
                    passRate: quiz.passRate,
                  })
                : t("report.quizNone")}
            </Text>
          </View>
        ))}
      </View>
      <View wrap={false}>
        <Text style={s.h2}>{t("report.certificates")}</Text>
        <Line name={t("report.issued")} value={data.issued} />
        <Line name={t("report.revoked")} value={data.revoked} />
      </View>
    </View>
  );
}

export function renderCourseKit(document: ReactNode) {
  return renderToBuffer(document as Parameters<typeof renderToBuffer>[0]);
}
