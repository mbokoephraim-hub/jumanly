"use server";

/**
 * Interview practice on the phone (Modèle B, lot B6). Order of partie 03: validate → session →
 * rights and quota (in the service: the mode's monthly quota or the 5-minute trial) → service.
 * Each action answers `{ ok }` for the screen to move on without leaving the page.
 */
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { reportError } from "@/server/observability";
import {
  answerQuestion,
  answerSchema,
  discardInterview,
  finishInterview,
  getInterview,
  InterviewError,
  phoneDurations,
  phoneFocuses,
  startInterview,
  TRIAL_MINUTES,
  type PhoneFocus,
} from "@/server/services/interview-sim";

type Failure = { ok: false; error: InterviewError["code"] | "network"; resetsAt?: string };

const prepareSchema = z.object({
  mode: z.enum(["text", "voice"]),
  focus: z.enum(phoneFocuses),
  minutes: z.number().refine((value) => (phoneDurations as readonly number[]).includes(value)),
  tone: z.enum(["easy", "hard"]),
  jobTitle: z.string().trim().min(2).max(120),
  jobId: z.string().max(60).optional(),
});

/** The banks of « Entretien complet »: the questions of three focuses, in turn. */
const MIXED: PhoneFocus[] = ["experiences", "technical", "motivation"];

async function bankOf(focus: PhoneFocus, jobTitle: string) {
  const t = await getTranslations("phoneInterview.bank");
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
  const focuses = (focus === "full" ? MIXED : [focus]) as Exclude<PhoneFocus, "full">[];
  const items = numbers.flatMap((number) =>
    focuses.map((name) => ({
      question: t(`${name}.q${number}`, { jobTitle }),
      hint: t(`${name}.h${number}`, { jobTitle }),
    })),
  );
  return { questions: items.map((item) => item.question), hints: items.map((item) => item.hint) };
}

function failure(error: unknown): Failure {
  if (error instanceof InterviewError)
    return { ok: false, error: error.code, resetsAt: error.resetsAt?.toISOString() };
  reportError(error);
  return { ok: false, error: "network" };
}

/** « Préparer la simulation »: Orbi chooses the questions; the screen shows them when ready. */
export async function preparePhoneInterviewAction(
  input: z.input<typeof prepareSchema>,
): Promise<{ ok: true; id: string; questions: string[] } | Failure> {
  const parsed = prepareSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser("/app/career/entretiens/nouveau");
  const { mode, focus, minutes, tone, jobTitle } = parsed.data;
  const job = parsed.data.jobId
    ? await db.job.findFirst({
        where: { id: parsed.data.jobId, status: { in: ["published", "closed"] } },
        select: { id: true },
      })
    : null;
  const experiences = await db.experience.findMany({
    where: { profile: { userId: user.id } },
    orderBy: { startDate: "desc" },
    take: 3,
    select: { title: true, company: true },
  });
  const bank = await bankOf(focus, jobTitle);
  try {
    const session = await startInterview(
      db,
      user.id,
      { mode, type: focus, level: tone, durationMinutes: minutes, jobTitle, jobId: job?.id },
      bank.questions,
      new Date(),
      {
        hints: bank.hints,
        phone: true,
        profile: experiences.map((item) => `${item.title}, ${item.company}`).join(" ; "),
      },
    );
    const turns = (await getInterview(db, user.id, session.id))?.turns ?? [];
    return { ok: true, id: session.id, questions: turns.map((turn) => turn.question) };
  } catch (error) {
    return failure(error);
  }
}

/** « Annuler » or « Modifier les réglages » before any answer: the unit comes back. */
export async function discardPhoneInterviewAction(id: string) {
  const user = await requireUser("/app/career/entretiens/nouveau");
  await discardInterview(db, user.id, String(id).slice(0, 60));
  return { ok: true as const };
}

/** One answer (written, or the text of the spoken one), with the follow-up when Orbi asked one. */
export async function answerPhoneInterviewAction(input: {
  id: string;
  answer: string;
  durationSec?: number;
  followUp?: string;
}): Promise<{ ok: true; done: boolean } | Failure> {
  const id = String(input.id ?? "").slice(0, 60);
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(`/app/career/entretiens/${id}`);
  try {
    const result = await answerQuestion(db, user.id, id, parsed.data);
    return { ok: true, done: result.done };
  } catch (error) {
    return failure(error);
  }
}

/** « Voir le bilan »: the session ends and Orbi writes the feedback on the answers given. */
export async function finishPhoneInterviewAction(id: string): Promise<{ ok: true } | Failure> {
  const user = await requireUser(`/app/career/entretiens/${id}`);
  try {
    await finishInterview(db, user.id, String(id).slice(0, 60));
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/**
 * « Refaire les questions faibles » or « Refaire cette question »: a new 5-minute session with the
 * same questions, which counts like any other session.
 */
export async function retakePhoneInterviewAction(input: {
  id: string;
  indexes: number[];
}): Promise<{ ok: true; id: string } | Failure> {
  const id = String(input.id ?? "").slice(0, 60);
  const user = await requireUser(`/app/career/entretiens/${id}`);
  const session = await getInterview(db, user.id, id);
  if (!session) return { ok: false, error: "notFound" };
  const replay = session.turns
    .filter((_, index) => input.indexes.includes(index))
    .slice(0, 9)
    .map((turn) => ({ question: turn.question, hint: turn.hint ?? null }));
  if (replay.length === 0) return { ok: false, error: "invalid" };
  try {
    const created = await startInterview(
      db,
      user.id,
      {
        mode: session.mode,
        type: session.type as PhoneFocus,
        level: session.level === "hard" ? "hard" : "easy",
        durationMinutes: TRIAL_MINUTES,
        jobTitle: session.jobTitle,
        jobId: session.jobId ?? undefined,
      },
      replay.map((item) => item.question),
      new Date(),
      { replay },
    );
    return { ok: true, id: created.id };
  } catch (error) {
    return failure(error);
  }
}
