import "server-only";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { dynamic } from "@/i18n/dynamic";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import { phoneHistory, phonePracticeSetup, sessionScore } from "@/server/services/interview-phone";
import { GOOD_SCORE } from "@/server/services/interview-score";
import {
  interviewAccess,
  pace,
  phoneDurations,
  phoneFocuses,
  type FeedbackLine,
  type getInterview,
  type PhoneFocus,
} from "@/server/services/interview-sim";
import type { AnswerView, HistoryRow, Origin, ReportView, RunView, SetupView } from "./types";

type Query = Record<string, string | string[] | undefined>;
type Session = NonNullable<Awaited<ReturnType<typeof getInterview>>>;

const HOME = "/app/career/entretiens";
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value.slice(0, 200) : null;

/** The texts the interview screens need in the browser. */
export async function InterviewTexts({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["phoneInterview", "phone"])}>
      {children}
    </NextIntlClientProvider>
  );
}

/** Where the practice was opened from: an application, Formation, or elsewhere. */
export async function originOf(query: Query): Promise<Origin> {
  const t = await getTranslations("phoneInterview");
  const application = one(query.candidature)?.slice(0, 60) ?? null;
  const formation = query.depuis === "formation";
  const params = new URLSearchParams();
  if (application) params.set("candidature", application);
  if (formation) params.set("depuis", "formation");
  const offer = one(query.offre);
  if (offer) params.set("offre", offer);
  if (application)
    return {
      query: params.toString(),
      backLabel: t("back.candidature"),
      backHref: `/app/suivi/${application}`,
      endLabel: t("report.backTo.candidature"),
    };
  if (formation)
    return {
      query: params.toString(),
      backLabel: t("back.formation"),
      backHref: "/app/learn",
      endLabel: t("report.backTo.formation"),
    };
  return {
    query: params.toString(),
    backLabel: t("back.default"),
    backHref: offer ? `/app/jobs/${offer}` : "/app/career/cv?onglet=candidatures",
    endLabel: null,
  };
}

const withQuery = (path: string, query: string, extra?: string) => {
  const all = [query, extra].filter(Boolean).join("&");
  return all ? `${path}?${all}` : path;
};

/** « 10 h », « 10 h 30 » in the interview's time zone. */
async function hourOf(date: Date, timeZone: string) {
  const t = await getTranslations("phoneCareer.application");
  const parts = new Intl.DateTimeFormat("fr", {
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return t("hour", { h: Number(part("hour")), m: part("minute") });
}

/** The settings (planche Entretien), with what the plan includes and the trial. */
export async function setupView(userId: string, query: Query): Promise<SetupView> {
  const format = await getFormatter();
  const origin = await originOf(query);
  const setup = await phonePracticeSetup(db, userId, {
    applicationId: one(query.candidature)?.slice(0, 60),
    offer: one(query.offre),
  });
  const interview = setup.job?.interview ?? null;
  const when = interview?.startsAt
    ? `${format.dateTime(interview.startsAt, {
        weekday: "long",
        day: "numeric",
        month: "short",
        timeZone: interview.timezone,
      })}, ${await hourOf(interview.startsAt, interview.timezone)}`
    : null;
  const mode = query.mode === "text" || query.mode === "voice" ? query.mode : null;
  // The planche opens on « À l'oral »; Orbi's « Par écrit » opens on the written one.
  const initialMode = mode ?? "voice";
  const focus = phoneFocuses.find((item) => item === query.sujet) ?? "experiences";
  const included = setup.modes[initialMode].included;
  const access = await interviewAccess(db, userId);
  return {
    reserved: access.open
      ? null
      : { applied: access.applied, plan: access.plan, planName: setup.modes.text.plan },
    origin,
    job: setup.job
      ? {
          id: setup.job.id,
          title: setup.job.title,
          initials: setup.job.initials,
          line: when ? `${setup.job.company} · ${when}` : setup.job.company,
        }
      : null,
    company: setup.job?.company ?? null,
    cv: setup.cv,
    jobTitle: setup.jobTitle,
    plan: setup.plan,
    modes: setup.modes,
    initial: {
      mode: initialMode,
      focus,
      minutes: included ? phoneDurations[1] : phoneDurations[0],
      tone: "easy",
    },
  };
}

/** A session being answered (planches Entretien-micro to -ecrit-question). */
export async function runView(session: Session, origin: Origin): Promise<RunView> {
  const t = dynamic(await getTranslations());
  const company = session.jobId
    ? ((
        await db.job.findUnique({
          where: { id: session.jobId },
          select: { organization: { select: { name: true } } },
        })
      )?.organization.name ?? null)
    : null;
  const tip = t.has(`practice.tip.${session.type}`) ? t(`practice.tip.${session.type}`) : "";
  const start = session.turns.findIndex((turn) => turn.answer === null);
  return {
    id: session.id,
    origin,
    mode: session.mode,
    english: session.type === "english",
    minutes: session.durationMinutes,
    questions: session.turns.map((turn) => ({ question: turn.question, hint: turn.hint ?? tip })),
    start: start < 0 ? session.turns.length - 1 : start,
    company,
    settings: withQuery(`${HOME}/nouveau`, origin.query),
  };
}

const lineText = (t: ReturnType<typeof dynamic>, line: FeedbackLine) =>
  "text" in line ? line.text : t(`career.interviews.feedback.rule.${line.code}`);

function focusTitle(t: ReturnType<typeof dynamic>, type: string) {
  return (phoneFocuses as readonly string[]).includes(type)
    ? t(`phoneInterview.focus.${type}.title`)
    : t.has(`career.interviews.setup.type.${type}`)
      ? t(`career.interviews.setup.type.${type}`)
      : type;
}

/** « Votre bilan » (planche Entretien-bilan). */
export async function reportView(
  session: Session,
  origin: Origin,
  fromHistory: boolean,
): Promise<ReportView> {
  const t = dynamic(await getTranslations());
  const format = await getFormatter();
  const score = await sessionScore(db, session);
  const feedback = session.feedbackData;
  const answeredScore = new Map(score?.answers.map((item) => [item.index, item.score]) ?? []);
  // « À travailler avant jeudi »: the next interview of the application, when there is one.
  const application = origin.query.match(/candidature=([^&]+)/)?.[1] ?? null;
  const next = application
    ? await db.interview.findFirst({
        where: {
          applicationId: application,
          status: "confirmed",
          startsAt: { gt: new Date() },
          application: { profile: { userId: session.userId } },
        },
        orderBy: { startsAt: "asc" },
        select: { startsAt: true, timezone: true },
      })
    : null;
  const base = `${HOME}/${session.id}`;
  return {
    id: session.id,
    origin,
    fromHistory,
    overall: score?.overall ?? null,
    summary: t("phoneInterview.report.summary", {
      focus: focusTitle(t, session.type),
      mode: t(`phoneInterview.modeWord.${session.mode}`),
      minutes: session.durationMinutes,
    }),
    criteria: (score?.criteria ?? []).map((item) => ({
      label: t(`phoneInterview.report.criterion.${item.key}`),
      score: item.score,
      reason: t(`phoneInterview.report.reason.${item.reason.code}`, item.reason.values),
    })),
    works: (feedback?.strengths ?? []).slice(0, 2).map((line) => lineText(t, line)),
    toWork: (feedback?.improvements ?? []).slice(0, 2).map((line) => lineText(t, line)),
    toWorkTitle: next?.startsAt
      ? t("phoneInterview.report.toWorkBefore", {
          day: format.dateTime(next.startsAt, { weekday: "long", timeZone: next.timezone }),
        })
      : t("phoneInterview.report.toWork"),
    questions: session.turns.map((turn, index) => ({
      n: index + 1,
      question: turn.question,
      score: answeredScore.get(index) ?? null,
      href: withQuery(base, origin.query, `reponse=${index + 1}`),
    })),
    weak: [...answeredScore.entries()]
      .filter(([, value]) => value < GOOD_SCORE)
      .map(([index]) => index),
    settings: withQuery(`${HOME}/nouveau`, origin.query),
  };
}

/** The detail of an answer (planche Entretien-reponse). */
export async function answerView(
  session: Session,
  index: number,
  origin: Origin,
): Promise<AnswerView> {
  const t = dynamic(await getTranslations());
  const score = await sessionScore(db, session);
  const row = score?.answers.find((item) => item.index === index) ?? null;
  const turn = session.turns[index]!;
  const words = turn.answer?.trim() ? turn.answer.trim().split(/\s+/).length : 0;
  const speed = pace(turn);
  const meta = turn.answer?.trim()
    ? turn.durationSec
      ? [
          t("phoneInterview.answer.duration", {
            minutes: Math.floor(turn.durationSec / 60),
            seconds: turn.durationSec % 60,
          }),
          speed ? t("phoneInterview.answer.pace", { speed }) : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : t("phoneInterview.answer.words", { count: words })
    : null;
  const tip =
    turn.hint ?? (t.has(`practice.tip.${session.type}`) ? t(`practice.tip.${session.type}`) : "");
  const base = `${HOME}/${session.id}`;
  return {
    id: session.id,
    n: index + 1,
    index,
    score: row?.score ?? null,
    question: turn.question,
    saidTitle: t(turn.durationSec ? "phoneInterview.answer.said" : "phoneInterview.answer.wrote"),
    text: turn.answer?.trim() || null,
    meta,
    followUp: turn.followUp
      ? t("phoneInterview.answer.followUp", { question: turn.followUp })
      : null,
    works: (row?.works ?? []).map((code) => t(`phoneInterview.answer.work.${code}`)),
    improve: (row?.improve ?? []).map((code) => t(`phoneInterview.answer.fix.${code}`)),
    tip,
    back: withQuery(base, origin.query),
    next:
      index + 1 < session.turns.length
        ? withQuery(base, origin.query, `reponse=${index + 2}`)
        : null,
  };
}

/** « Mes simulations » (planche Entretien-historique). */
export async function historyRows(userId: string): Promise<HistoryRow[]> {
  const t = dynamic(await getTranslations());
  const format = await getFormatter();
  const now = new Date();
  const sameDay = (date: Date) => date.toDateString() === now.toDateString();
  return (await phoneHistory(db, userId)).map((row) => ({
    href: `${HOME}/${row.id}?depuis=historique`,
    title: t("phoneInterview.list.row", {
      focus: focusTitle(t, row.type),
      mode: t(`phoneInterview.modeWord.${row.mode}`),
    }),
    meta: t("phoneInterview.list.meta", {
      date: sameDay(row.createdAt)
        ? t("phoneInterview.list.today")
        : format.dateTime(row.createdAt, { day: "numeric", month: "short" }),
      minutes: row.durationMinutes,
    }),
    score: row.score,
    ongoing: row.status === "active",
  }));
}

export type { PhoneFocus };
