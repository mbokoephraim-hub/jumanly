/**
 * Interview simulations (E10, partie 08 § 8.9 `interview`, `/app/career/entretiens`). A session
 * uses one unit of `career.interview.text.monthly` or `career.interview.voice.monthly`; its model
 * calls cost no AI credit. The feedback names strengths and points to work on, by criterion and
 * by question. Never a hireability score, never a prediction (« ne prédit pas le résultat »).
 * Without a usable model output, questions come from the bank and the feedback from rules.
 */
import { z } from "zod";
import type { InterviewSimMode, Prisma, PrismaClient } from "@/generated/prisma/client";
import { AiError, aiReadiness, runAi } from "@/server/ai";
import { consume, QuotaExceededError, release, usage, type Subject } from "@/server/entitlements";
import {
  isAdvancedFocus,
  phoneDurations,
  phoneFocuses,
  phoneQuestionCount,
  TRIAL_MINUTES,
} from "@/lib/interview-options";

export {
  advancedFocuses,
  isAdvancedFocus,
  phoneDurations,
  phoneFocuses,
  TRIAL_MINUTES,
  type PhoneFocus,
} from "@/lib/interview-options";

export const interviewModes = ["text", "voice"] as const satisfies readonly InterviewSimMode[];
export const interviewTypes = ["hr", "technical", "motivation", "behavioral"] as const;
export const interviewLevels = ["easy", "standard", "hard"] as const;
export const interviewDurations = [10, 20, 30] as const;
export const ANSWER_MAX = 4000;

export type InterviewType = (typeof interviewTypes)[number];

export const quotaKey = (mode: InterviewSimMode) => `career.interview.${mode}.monthly`;
/**
 * The trial session (brief Modèle B § 5, not confirmed by the owner, set in the admin): a 5-minute
 * session, written or spoken, for whoever's plan does not include the mode.
 */
export const TRIAL_KEY = "career.interview.trial.monthly";

/** Questions in a session: 3, 6 or 9 for 5, 10 or 15 minutes; then one every 2.5 minutes. */
export const questionCount = (minutes: number) => Math.max(3, Math.round(minutes / 2.5));

export class InterviewError extends Error {
  constructor(
    readonly code: "entitlement" | "quota" | "consent" | "invalid" | "notFound",
    readonly resetsAt?: Date,
  ) {
    super(`Interview ${code}`);
  }
}

export const setupSchema = z.object({
  mode: z.enum(interviewModes),
  type: z.enum([...interviewTypes, ...phoneFocuses]),
  level: z.enum(interviewLevels),
  durationMinutes: z.coerce
    .number()
    .refine((value) => ([...interviewDurations, ...phoneDurations] as number[]).includes(value)),
  jobTitle: z.string().trim().min(2).max(120),
  jobId: z
    .string()
    .max(60)
    .optional()
    .transform((value) => value || undefined),
});
export type InterviewSetup = z.infer<typeof setupSchema>;

// ─── Stored shapes ───────────────────────────────────────────────────────────

const turnSchema = z.object({
  question: z.string(),
  answer: z.string().nullable(),
  durationSec: z.number().int().nullable(),
  /** « Un indice » of the phone (lot B6): what to say, in a sentence. */
  hint: z.string().nullable().optional(),
  /** « Orbi relance » (lot B6): the follow-up question asked after the answer. */
  followUp: z.string().nullable().optional(),
});
export type InterviewTurn = z.infer<typeof turnSchema>;

export const criterionKeys = ["structure", "relevance", "examples", "clarity", "pace"] as const;
export const feedbackLevels = ["solid", "developing", "toWork"] as const;
type FeedbackLevel = (typeof feedbackLevels)[number];

/** Rule codes, rendered with `career.interviews.feedback.rule.<code>`. */
export const ruleCodes = [
  "answered",
  "examples",
  "structure",
  "concise",
  "pace",
  "short",
  "long",
  "noExample",
  "noResult",
  "noAnswer",
  "slow",
  "fast",
] as const;
type RuleCode = (typeof ruleCodes)[number];

/** A line of feedback: written by the model (`text`) or by the rules (`code`). */
const lineSchema = z.union([z.object({ text: z.string() }), z.object({ code: z.enum(ruleCodes) })]);
export type FeedbackLine = z.infer<typeof lineSchema>;

const feedbackSchema = z.object({
  source: z.enum(["ai", "rules"]),
  summary: lineSchema.nullable(),
  criteria: z.array(
    z.object({
      key: z.enum(criterionKeys),
      level: z.enum(feedbackLevels),
      comment: lineSchema.nullable(),
    }),
  ),
  strengths: z.array(lineSchema),
  improvements: z.array(lineSchema),
  perQuestion: z.array(
    z.object({
      index: z.number().int(),
      comment: z.array(lineSchema),
      tip: z.string().nullable(),
    }),
  ),
});
export type InterviewFeedback = z.infer<typeof feedbackSchema>;

export function parseTurns(value: Prisma.JsonValue): InterviewTurn[] {
  const parsed = z.array(turnSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function parseFeedback(value: Prisma.JsonValue | null): InterviewFeedback | null {
  const parsed = feedbackSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

const json = (value: unknown) => value as Prisma.InputJsonValue;

// ─── Guards ──────────────────────────────────────────────────────────────────

/**
 * Questions a recruiter must not ask (CLAUDE.md § 4): age, family, health, origin, religion…
 * A model question touching them is rejected and the bank is used instead.
 */
const forbidden =
  /(?<!\p{L})(âge|age|enfants?|mari[ée]e?s?|enceinte|grossesse|religion|religieu\p{L}*|nationalit\p{L}*|origine|ethni\p{L}*|santé|maladie|handicap\p{L}*|célibataire|famille|politique)(?!\p{L})/iu;

/** No score, no percentage, no « chances » of being hired in a feedback written by the model. */
const scoring = /(\d+\s*(%|\/\s*\d+|sur\s+\d+|points?))|embauchab|chances?\s+d['e]|probabilit/i;

export function acceptableQuestions(questions: string[], count: number) {
  return (
    questions.length === count &&
    questions.every(
      (question) =>
        question.trim().length >= 10 && question.length <= 400 && !forbidden.test(question),
    )
  );
}

export function acceptableFeedback(feedback: InterviewFeedback, answered: number[]) {
  const texts = [
    feedback.summary,
    ...feedback.criteria.map((item) => item.comment),
    ...feedback.strengths,
    ...feedback.improvements,
    ...feedback.perQuestion.flatMap((item) => item.comment),
  ]
    .filter((line): line is { text: string } => Boolean(line && "text" in line))
    .map((line) => line.text)
    .concat(feedback.perQuestion.map((item) => item.tip ?? ""));
  return (
    texts.every((text) => text.length <= 1200 && !scoring.test(text)) &&
    feedback.perQuestion.every((item) => answered.includes(item.index))
  );
}

// ─── Rules ───────────────────────────────────────────────────────────────────

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Signs of a structured answer: situation, action, result (the STAR method of the hint). */
export function answerSignals(answer: string) {
  const text = fold(answer);
  const count = words(answer);
  const situation = /\b(lors|quand|lorsque|dans mon|chez|pendant|au sein|en tant que)\b/.test(text);
  const action = /\b(j'ai|j ai|nous avons|je me suis|j'ai mis|je suis)\b/.test(text);
  const result =
    /\b(resultat|ce qui a|permis|augment|reduit|ameliore|obtenu|gagne|reussi)/.test(text) ||
    /\d/.test(text);
  const example = /\d/.test(text) || /\b(par exemple|exemple|notamment|j'ai)\b/.test(text);
  const sentences = answer.split(/[.!?]+/).filter((part) => part.trim().length > 0);
  const longestSentence = Math.max(0, ...sentences.map(words));
  return { count, situation, action, result, example, longestSentence };
}

/** Words per minute of an oral answer, when its duration is known. */
export function pace(turn: InterviewTurn) {
  if (!turn.answer || !turn.durationSec || turn.durationSec < 5) return null;
  return Math.round((words(turn.answer) * 60) / turn.durationSec);
}

const levelOf = (ratio: number): FeedbackLevel =>
  ratio >= 0.7 ? "solid" : ratio >= 0.4 ? "developing" : "toWork";

/** The feedback by rules: levels per criterion and codes, from the answers alone. */
export function rulesFeedback(turns: InterviewTurn[], mode: InterviewSimMode): InterviewFeedback {
  const answered = turns
    .map((turn, index) => ({ turn, index, signals: answerSignals(turn.answer ?? "") }))
    .filter((item) => item.turn.answer?.trim());
  const code = (value: RuleCode) => ({ code: value });
  if (answered.length === 0) {
    return {
      source: "rules",
      summary: code("noAnswer"),
      criteria: [],
      strengths: [],
      improvements: [code("noAnswer")],
      perQuestion: [],
    };
  }
  const share = (test: (item: (typeof answered)[number]) => boolean) =>
    answered.filter(test).length / answered.length;
  const structure = share(
    ({ signals }) =>
      [signals.situation, signals.action, signals.result].filter(Boolean).length >= 2,
  );
  const relevance = share(({ signals }) => signals.count >= 25 && signals.count <= 350);
  const examples = share(({ signals }) => signals.example);
  const clarity = share(({ signals }) => signals.longestSentence <= 35);
  const paces = answered.map(({ turn }) => pace(turn)).filter((value) => value !== null);
  const goodPace = paces.length
    ? paces.filter((value) => value >= 100 && value <= 170).length / paces.length
    : null;

  const criteria: InterviewFeedback["criteria"] = [
    { key: "structure", level: levelOf(structure), comment: null },
    { key: "relevance", level: levelOf(relevance), comment: null },
    { key: "examples", level: levelOf(examples), comment: null },
    { key: "clarity", level: levelOf(clarity), comment: null },
  ];
  if (mode === "voice" && goodPace !== null)
    criteria.push({ key: "pace", level: levelOf(goodPace), comment: null });

  const strengths: FeedbackLine[] = [code("answered")];
  const improvements: FeedbackLine[] = [];
  if (examples >= 0.7) strengths.push(code("examples"));
  else improvements.push(code("noExample"));
  if (structure >= 0.7) strengths.push(code("structure"));
  else improvements.push(code("noResult"));
  if (clarity >= 0.7 && relevance >= 0.7) strengths.push(code("concise"));
  if (goodPace !== null && goodPace >= 0.7) strengths.push(code("pace"));
  if (answered.length < turns.length) improvements.push(code("noAnswer"));

  const perQuestion = answered.map(({ turn, index, signals }) => {
    const comment: FeedbackLine[] = [];
    if (signals.count < 25) comment.push(code("short"));
    if (signals.count > 350) comment.push(code("long"));
    if (!signals.example) comment.push(code("noExample"));
    if (!signals.result) comment.push(code("noResult"));
    const speed = pace(turn);
    if (speed !== null && speed < 100) comment.push(code("slow"));
    if (speed !== null && speed > 170) comment.push(code("fast"));
    if (comment.length === 0) comment.push(code("structure"));
    return { index, comment, tip: null };
  });

  return {
    source: "rules",
    summary: null,
    criteria,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    perQuestion,
  };
}

// ─── Model ───────────────────────────────────────────────────────────────────

const questionsOutput = z.object({ questions: z.array(z.string()) });

const feedbackOutput = z.object({
  summary: z.string(),
  criteria: z.array(
    z.object({
      key: z.enum(criterionKeys),
      level: z.enum(feedbackLevels),
      comment: z.string(),
    }),
  ),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  perQuestion: z.array(z.object({ index: z.number().int(), comment: z.string(), tip: z.string() })),
});
type FeedbackOutput = z.infer<typeof feedbackOutput>;

const QUESTIONS_SYSTEM = [
  "Tu es un recruteur bienveillant qui fait passer un entretien d'entraînement, en français.",
  "Règles :",
  "- Pose des questions réalistes pour le poste et le type d'entretien demandés.",
  "- Jamais de question sur l'âge, la famille, la santé, le handicap, l'origine, la nationalité, la religion ou les opinions.",
  "- Une question par élément, sans numérotation ni commentaire.",
  "- Exigence « easy » : bienveillant ; « standard » : classique ; « hard » : relances précises.",
].join("\n");

const FEEDBACK_SYSTEM = [
  "Tu aides une personne à progresser après un entretien d'entraînement, en français, en la vouvoyant.",
  "Règles :",
  "- Aucune note, aucun pourcentage, aucune prédiction sur ses chances d'être recrutée.",
  "- Appuie-toi uniquement sur ses réponses ; n'invente aucune expérience.",
  "- criteria : structure, relevance, examples, clarity (et pace seulement si des durées orales sont fournies), chacun avec un niveau solid, developing ou toWork et un commentaire court.",
  "- strengths et improvements : 2 à 4 phrases courtes chacune.",
  "- perQuestion : une entrée par question répondue (son index), avec un commentaire et une piste de réponse (tip) qui reste générale.",
].join("\n");

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function interviewQuota(db: PrismaClient, userId: string, mode: InterviewSimMode) {
  return usage(db, { type: "user", id: userId }, quotaKey(mode));
}

/** Which allowance a session uses: its mode's monthly quota, or the trial (lot B6). */
export async function interviewAllowance(
  db: PrismaClient,
  userId: string,
  mode: InterviewSimMode,
  now = new Date(),
) {
  const subject: Subject = { type: "user", id: userId };
  const [own, trial] = await Promise.all([
    usage(db, subject, quotaKey(mode), now),
    usage(db, subject, TRIAL_KEY, now),
  ]);
  return {
    /** The plan includes the mode (its quota is above zero). */
    included: own.limit !== 0,
    own,
    trial,
    trialLeft: own.limit === 0 && (trial.limit < 0 || trial.used < trial.limit),
  };
}

/** Options of a session started on the phone (lot B6). */
export type StartOptions = {
  /** One hint per question of the bank, same order. */
  hints?: string[];
  /** A short summary of the profile for the model (titles and places only). */
  profile?: string;
  /** Questions to ask again as they are (« Refaire les questions faibles »). */
  replay?: { question: string; hint: string | null }[];
  /** A session of the phone: three questions every 5 minutes. */
  phone?: boolean;
};

/**
 * Starts a session: consent, then the monthly quota of the mode (one unit) or, when the plan does
 * not include the mode, the trial (5 minutes, not an advanced focus), then the questions.
 * `bank` is the question bank of the type, already in French (from the texts).
 */
export async function startInterview(
  db: PrismaClient,
  userId: string,
  input: InterviewSetup,
  bank: string[],
  now = new Date(),
  options: StartOptions = {},
) {
  const subject: Subject = { type: "user", id: userId };
  const readiness = await aiReadiness(db, userId, "interview_questions");
  if (readiness === "consent") throw new InterviewError("consent");
  const allowance = await interviewAllowance(db, userId, input.mode, now);
  let key = quotaKey(input.mode);
  if (!allowance.included) {
    const trialFits = input.durationMinutes === TRIAL_MINUTES && !isAdvancedFocus(input.type);
    if (!trialFits || allowance.trial.limit === 0) throw new InterviewError("entitlement");
    key = TRIAL_KEY;
  }
  try {
    await consume(db, subject, key, 1, now);
  } catch (error) {
    if (error instanceof QuotaExceededError) throw new InterviewError("quota", error.resetsAt);
    throw error;
  }

  try {
    const count =
      options.replay?.length ||
      (options.phone ? phoneQuestionCount : questionCount)(input.durationMinutes);
    const job = input.jobId
      ? await db.job.findFirst({
          where: { id: input.jobId, status: { in: ["published", "closed"] } },
          select: {
            title: true,
            description: true,
            skills: { select: { skill: { select: { name: true } } } },
          },
        })
      : null;
    const fromBank = () => ({
      questions: Array.from({ length: count }, (_, index) => bank[index % bank.length]),
    });
    let questions = fromBank().questions;
    let hints: (string | null)[] = questions.map(
      (_, index) => options.hints?.[index % (options.hints?.length || 1)] ?? null,
    );
    if (options.replay) {
      questions = options.replay.map((item) => item.question);
      hints = options.replay.map((item) => item.hint);
    } else {
      try {
        const run = await runAi(db, {
          userId,
          feature: "interview_questions",
          system: QUESTIONS_SYSTEM,
          prompt: [
            `Poste : ${input.jobTitle}`,
            `Type d'entretien : ${input.type}`,
            `Exigence : ${input.level}`,
            `Nombre de questions : ${count}`,
            job
              ? `Offre : ${job.title}. Compétences : ${job.skills.map((item) => item.skill.name).join(", ")}. ${job.description.slice(0, 1500)}`
              : "",
            options.profile ? `Parcours de la personne : ${options.profile.slice(0, 800)}` : "",
            "Questions de référence (exemples) :",
            JSON.stringify(bank.slice(0, 6)),
          ].join("\n"),
          schema: questionsOutput,
          template: fromBank,
          maxTokens: 2000,
        });
        if (acceptableQuestions(run.output.questions, count)) {
          // The bank's hints belong to the bank's questions: a model question gets none of them.
          if (run.output.questions.some((question, index) => question !== questions[index]))
            hints = hints.map(() => null);
          questions = run.output.questions;
        }
      } catch (error) {
        if (!(error instanceof AiError)) throw error;
      }
    }
    const turns: InterviewTurn[] = questions.map((question, index) => ({
      question,
      answer: null,
      durationSec: null,
      hint: hints[index] ?? null,
    }));
    return await db.interviewSession.create({
      data: {
        userId,
        mode: input.mode,
        type: input.type,
        level: input.level,
        jobTitle: input.jobTitle,
        jobId: job ? input.jobId : null,
        durationMinutes: input.durationMinutes,
        questions: json(turns),
        createdAt: now,
      },
    });
  } catch (error) {
    await release(db, subject, key, 1, now);
    throw error;
  }
}

/**
 * « Annuler » or « Modifier les réglages » before the first answer (lot B6): the session is
 * removed and its unit given back. A session with an answer stays (never delete what was said).
 */
export async function discardInterview(
  db: PrismaClient,
  userId: string,
  id: string,
  now = new Date(),
) {
  const session = await getInterview(db, userId, id);
  if (!session || session.status !== "active") return false;
  if (session.turns.some((turn) => turn.answer !== null)) return false;
  const allowance = await interviewAllowance(db, userId, session.mode, now);
  await db.interviewSession.delete({ where: { id } });
  await release(
    db,
    { type: "user", id: userId },
    allowance.included ? quotaKey(session.mode) : TRIAL_KEY,
    1,
    now,
  );
  return true;
}

export async function getInterview(db: PrismaClient, userId: string, id: string) {
  const session = await db.interviewSession.findFirst({ where: { id, userId } });
  if (!session) return null;
  return {
    ...session,
    turns: parseTurns(session.questions),
    feedbackData: parseFeedback(session.feedback),
  };
}

export async function listInterviews(db: PrismaClient, userId: string, take = 20) {
  const sessions = await db.interviewSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      mode: true,
      type: true,
      jobTitle: true,
      status: true,
      createdAt: true,
      questions: true,
    },
  });
  return sessions.map(({ questions, ...session }) => ({
    ...session,
    questionCount: parseTurns(questions).length,
  }));
}

export const answerSchema = z.object({
  answer: z.string().trim().min(1).max(ANSWER_MAX),
  durationSec: z.coerce.number().int().min(0).max(3600).optional().catch(undefined),
  /** The follow-up question Orbi asked, its answer being part of `answer` (lot B6). */
  followUp: z.string().trim().max(300).optional(),
});

/** Records the answer to the current question (the first one without an answer). */
export async function answerQuestion(
  db: PrismaClient,
  userId: string,
  id: string,
  input: z.infer<typeof answerSchema>,
) {
  const session = await getInterview(db, userId, id);
  if (!session || session.status !== "active") throw new InterviewError("notFound");
  const index = session.turns.findIndex((turn) => turn.answer === null);
  if (index < 0) return { done: true };
  const turns = session.turns.map((turn, position) =>
    position === index
      ? {
          ...turn,
          answer: input.answer,
          durationSec: session.mode === "voice" ? (input.durationSec ?? null) : null,
          followUp: input.followUp || turn.followUp || null,
        }
      : turn,
  );
  await db.interviewSession.update({ where: { id }, data: { questions: json(turns) } });
  return { done: index === turns.length - 1 };
}

function fromModel(output: FeedbackOutput): InterviewFeedback {
  const text = (value: string) => ({ text: value });
  return {
    source: "ai",
    summary: text(output.summary),
    criteria: output.criteria.map((item) => ({ ...item, comment: text(item.comment) })),
    strengths: output.strengths.slice(0, 4).map(text),
    improvements: output.improvements.slice(0, 4).map(text),
    perQuestion: output.perQuestion.map((item) => ({
      index: item.index,
      comment: [text(item.comment)],
      tip: item.tip || null,
    })),
  };
}

/** Ends the session and writes the feedback on the questions answered so far. */
export async function finishInterview(
  db: PrismaClient,
  userId: string,
  id: string,
  now = new Date(),
) {
  const session = await getInterview(db, userId, id);
  if (!session) throw new InterviewError("notFound");
  if (session.status === "completed") return session;
  const rules = rulesFeedback(session.turns, session.mode);
  const answered = session.turns.flatMap((turn, index) => (turn.answer ? [index] : []));
  let feedback = rules;
  if (answered.length > 0) {
    try {
      const run = await runAi(db, {
        userId,
        feature: "interview_feedback",
        system: FEEDBACK_SYSTEM,
        prompt: [
          `Poste : ${session.jobTitle} · type : ${session.type} · exigence : ${session.level} · mode : ${session.mode}`,
          "Questions et réponses (JSON) :",
          JSON.stringify(
            session.turns.flatMap((turn, index) =>
              turn.answer
                ? [
                    {
                      index,
                      question: turn.question,
                      answer: turn.answer,
                      wordsPerMinute: pace(turn),
                    },
                  ]
                : [],
            ),
          ),
        ].join("\n"),
        schema: feedbackOutput,
        // Empty: the rules feedback is kept (fake provider, or a rejected output).
        template: () => ({
          summary: "",
          criteria: [],
          strengths: [],
          improvements: [],
          perQuestion: [],
        }),
        maxTokens: 4000,
      });
      if (run.source === "ai" && run.output.criteria.length > 0) {
        const candidate = fromModel(run.output);
        if (acceptableFeedback(candidate, answered)) feedback = candidate;
      }
    } catch (error) {
      if (!(error instanceof AiError)) throw error;
    }
  }
  await db.interviewSession.update({
    where: { id },
    data: { status: "completed", completedAt: now, feedback: json(feedback) },
  });
  return getInterview(db, userId, id);
}

/** Saved jobs and applications the talent can start a session from. */
export async function interviewJobs(db: PrismaClient, userId: string) {
  const [saved, applied] = await Promise.all([
    db.savedJob.findMany({
      where: { userId, job: { status: "published" } },
      select: { job: { select: { id: true, title: true } } },
      take: 20,
    }),
    db.application.findMany({
      where: { profile: { userId } },
      select: { job: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const jobs = new Map<string, string>();
  for (const { job } of [...applied, ...saved]) jobs.set(job.id, job.title);
  return [...jobs.entries()].map(([id, title]) => ({ id, title }));
}
