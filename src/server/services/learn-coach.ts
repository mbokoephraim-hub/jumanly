/**
 * AI Learning Coach (ux-test, étape 2, /mnt/project-files/ux-test/PROMPT.md § 6).
 *
 * A pedagogical assistant that works from the content of ONE course the learner follows:
 * it explains, rephrases, gives an example, answers a question about the course, proposes an
 * extra exercise, helps understand a mistake and recommends what to review.
 *
 * Guardrails:
 * - Grounded: the model only receives the lessons of the course, and is told to say so when the
 *   course does not cover the question. Without a model (no credits, no consent, outage) the answer
 *   is built from the lesson passages themselves: nothing is invented.
 * - No answers to assessments: quiz answer keys and explanations are never sent to the model nor
 *   shown; a request for the answers of an evaluation is declined, with a way to learn instead.
 * - Every model call goes through `runAi` (consent → rights → `ai.credits.monthly` → AiUsage).
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { aiReadiness, AiError, runAi } from "@/server/ai";
import { getLearnerCourse, lessonParagraphs, lessonsOf } from "./learn";

export const coachIntents = [
  "explain",
  "rephrase",
  "example",
  "question",
  "exercise",
  "mistake",
  "revision",
] as const;
export type CoachIntent = (typeof coachIntents)[number];

export const coachInput = z.object({
  slug: z.string().trim().min(1).max(200),
  lessonId: z.string().trim().max(60).optional(),
  intent: z.enum(coachIntents),
  question: z.string().trim().max(600).default(""),
});
export type CoachInput = z.input<typeof coachInput>;

export type CoachAnswer = {
  /** Paragraphs of the answer. */
  answer: string[];
  /** Titles of the lessons the answer comes from (the « Pourquoi ? »). */
  sources: string[];
  /** "ai": written by the model from the lessons; "course": the lesson passages themselves. */
  source: "ai" | "course";
  /** Why the model was not used, when it was not. */
  limit?: "consent" | "entitlement" | "quota" | "unavailable";
  /** The request asked for the answers of an evaluation, and was declined. */
  declined?: boolean;
};

export type CoachResult =
  | { ok: true; answer: CoachAnswer }
  | { ok: false; error: "notFound" | "notEnrolled" | "locked" | "invalid" };

// ─── Deterministic part (no model) ──────────────────────────────────────────────

const STOPWORDS = new Set(
  "le la les un une des de du d l et ou en au aux a à est sont pour par sur dans avec que qui quoi ce cet cette ces se sa son ses mon ma mes ne pas plus moins je tu il elle on nous vous ils elles me te y comment pourquoi quand quel quelle quels quelles est-ce faire fait peut veut dire".split(
    " ",
  ),
);

/** Lowercase words without accents, short and common words removed. */
export function keywords(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

export type Passage = { lesson: string; text: string };

/** The passages of the course that share the most words with the question, best first. */
export function relevantPassages(passages: Passage[], question: string, take = 3) {
  const wanted = new Set(keywords(question));
  if (wanted.size === 0) return [];
  return passages
    .map((passage, index) => {
      const words = keywords(`${passage.lesson} ${passage.text}`);
      const score = words.filter((word) => wanted.has(word)).length;
      return { passage, score, index };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, take)
    .map((row) => row.passage);
}

/** « donne-moi les réponses du quiz », « quelle est la bonne réponse »… */
export function asksForAnswers(question: string) {
  const text = question.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return (
    /\b(reponses?|corrige|correction|solutions?)\b.*\b(quiz|evaluation|test|examen|question)/.test(
      text,
    ) ||
    /\b(bonne|vraie|juste)s? reponses?\b/.test(text) ||
    /\b(quiz|evaluation|test|examen)\b.*\b(reponses?|corrige|solutions?)\b/.test(text)
  );
}

const firstSentence = (text: string) => text.split(/(?<=[.!?])\s/)[0] ?? text;

/**
 * The answer built from the course alone, for every intent: always true to the course, used when
 * the model is not available and as the model's fallback.
 */
export function courseAnswer(input: {
  intent: CoachIntent;
  question: string;
  lesson?: { title: string; passages: Passage[] };
  course: Passage[];
  missed?: { prompt: string; lesson?: string }[];
  review?: string[];
  texts: CoachTexts;
}): Omit<CoachAnswer, "source" | "limit"> {
  const { texts } = input;
  const lessonPassages = input.lesson?.passages ?? [];
  const found = input.question ? relevantPassages(input.course, input.question) : [];
  const base = found.length > 0 ? found : lessonPassages;
  const sources = [...new Set(base.map((passage) => passage.lesson))];
  switch (input.intent) {
    case "rephrase":
      return base.length
        ? {
            answer: [texts.rephrase, ...base.map((passage) => firstSentence(passage.text))],
            sources,
          }
        : { answer: [texts.notCovered], sources: [] };
    case "example": {
      const examples = [...base, ...input.course].filter((passage) =>
        /exemple|par exemple|ex\.\s/i.test(passage.text),
      );
      return examples.length
        ? {
            answer: [texts.example, ...[...new Set(examples.map((p) => p.text))].slice(0, 2)],
            sources: [...new Set(examples.map((passage) => passage.lesson))].slice(0, 2),
          }
        : { answer: [texts.noExample], sources };
    }
    case "exercise": {
      const topic = input.lesson?.title ?? base[0]?.lesson;
      return topic
        ? {
            answer: [
              texts.exercise.replace("{lesson}", topic),
              ...base.slice(0, 2).map((passage) => `• ${firstSentence(passage.text)}`),
            ],
            sources: [topic],
          }
        : { answer: [texts.notCovered], sources: [] };
    }
    case "mistake": {
      if (!input.missed?.length) return { answer: [texts.noMistake], sources: [] };
      const answer = [texts.mistake];
      const used: string[] = [];
      for (const miss of input.missed.slice(0, 3)) {
        const passage = relevantPassages(input.course, miss.prompt, 1)[0];
        answer.push(`« ${miss.prompt} »`);
        if (passage) {
          answer.push(texts.mistakeHint.replace("{lesson}", passage.lesson) + ` ${passage.text}`);
          used.push(passage.lesson);
        }
      }
      return { answer, sources: [...new Set(used)] };
    }
    case "revision":
      return input.review?.length
        ? {
            answer: [texts.revision, ...input.review.map((title) => `• ${title}`)],
            sources: input.review,
          }
        : { answer: [texts.noRevision], sources: [] };
    case "explain":
    case "question":
    default:
      return base.length
        ? { answer: [texts.explain, ...base.map((passage) => passage.text)], sources }
        : { answer: [texts.notCovered], sources: [] };
  }
}

/** Sentences of the deterministic answers (from `learn.coach.answer.*`). */
export type CoachTexts = {
  explain: string;
  rephrase: string;
  example: string;
  noExample: string;
  exercise: string;
  mistake: string;
  mistakeHint: string;
  noMistake: string;
  revision: string;
  noRevision: string;
  notCovered: string;
  declined: string;
};

// ─── With the model ───────────────────────────────────────────────────────────────

const SYSTEM = `Tu es le Coach IA de Jumanly, un assistant pédagogique bienveillant pour des apprenants africains francophones de 20 à 60 ans.
Règles absolues :
- Tu t'appuies UNIQUEMENT sur le contenu du cours fourni entre <cours> et </cours>. Si la réponse n'y est pas, tu le dis simplement et tu proposes de relire la leçon la plus proche ; tu n'inventes jamais d'information sur le cours.
- Tu ne donnes JAMAIS les réponses d'une évaluation ou d'un quiz, ni la bonne option d'une question. Tu aides à comprendre la notion pour que l'apprenant trouve seul.
- Tu écris en français clair, avec des phrases courtes, en vouvoyant. Pas de jargon inutile.
- Tu ne parles ni du nom, de l'âge, du genre, de l'origine ou de la santé de l'apprenant.
- 2 à 5 paragraphes courts au maximum. Les exemples sont concrets et tirés de la vie professionnelle en Afrique francophone, présentés comme des exemples.
Le champ « sources » liste les titres exacts des leçons utilisées.`;

const intentAsk: Record<CoachIntent, string> = {
  explain: "Explique simplement la notion demandée, pas à pas.",
  rephrase: "Reformule le contenu de la leçon avec d'autres mots, plus simples.",
  example: "Donne un exemple supplémentaire, concret, qui illustre la notion de la leçon.",
  question: "Réponds à la question de l'apprenant à partir du cours.",
  exercise:
    "Propose un court exercice d'entraînement (sans le corriger) sur la leçon, avec une consigne claire.",
  mistake:
    "L'apprenant s'est trompé aux questions ci-dessous. Aide-le à comprendre la notion en jeu, sans jamais donner la bonne réponse ni éliminer d'option.",
  revision: "Recommande quoi réviser, dans quel ordre, et pourquoi, à partir des leçons listées.",
};

const modelSchema = z.object({
  answer: z.array(z.string().trim().min(1).max(900)).min(1).max(6),
  sources: z.array(z.string().trim().max(200)).max(6),
});

const MAX_COURSE_CHARS = 12_000;

/**
 * The coach for one learner and one course: checks the enrollment and the plan, gathers the
 * lessons (never the answer keys), then answers with the model when it can, from the course
 * otherwise.
 */
export async function askCoach(
  db: PrismaClient,
  userId: string,
  raw: CoachInput,
  texts: CoachTexts,
): Promise<CoachResult> {
  const parsed = coachInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const input = parsed.data;
  const found = await getLearnerCourse(db, userId, input.slug);
  if (!found) return { ok: false, error: "notFound" };
  if (!found.enrollment) return { ok: false, error: "notEnrolled" };
  if (!found.open) return { ok: false, error: "locked" };
  const { course } = found;
  if (input.intent === "question" && input.question.length < 3)
    return { ok: false, error: "invalid" };

  const lessons = lessonsOf(course);
  const passages: Passage[] = lessons.flatMap((lesson) =>
    lessonParagraphs(lesson.content).map((text) => ({ lesson: lesson.title, text })),
  );
  const lesson = lessons.find((item) => item.id === input.lessonId);
  const lessonPassages = lesson ? passages.filter((p) => p.lesson === lesson.title) : undefined;

  if (asksForAnswers(input.question))
    return {
      ok: true,
      answer: { answer: [texts.declined], sources: [], source: "course", declined: true },
    };

  // Questions missed at the learner's last attempt of each quiz (prompts only, never the key).
  const quizIds = lessons.flatMap((item) => (item.quiz ? [item.quiz.id] : []));
  const lastAttempts =
    input.intent === "mistake" || input.intent === "revision"
      ? await db.quizAttempt.findMany({
          where: { userId, quizId: { in: quizIds } },
          orderBy: { createdAt: "desc" },
          include: {
            quiz: {
              select: {
                lesson: { select: { title: true, moduleId: true } },
                questions: { select: { id: true, prompt: true, answer: true } },
              },
            },
          },
        })
      : [];
  const latestByQuiz = new Map<string, (typeof lastAttempts)[number]>();
  for (const attempt of lastAttempts)
    if (!latestByQuiz.has(attempt.quizId)) latestByQuiz.set(attempt.quizId, attempt);
  const missed: { prompt: string; lesson?: string }[] = [];
  const reviewModules = new Set<string>();
  for (const attempt of latestByQuiz.values()) {
    if (attempt.passed) continue;
    reviewModules.add(attempt.quiz.lesson.moduleId);
    const given = z.record(z.string(), z.array(z.string())).safeParse(attempt.answers);
    for (const question of attempt.quiz.questions) {
      const mine = given.success ? (given.data[question.id] ?? []) : [];
      const right =
        mine.length === question.answer.length &&
        question.answer.every((value) => mine.includes(value));
      if (!right) missed.push({ prompt: question.prompt, lesson: attempt.quiz.lesson.title });
    }
  }
  const done = new Set(found.enrollment.completedLessons);
  const review = lessons
    .filter(
      (item) =>
        item.kind !== "quiz" &&
        (reviewModules.has(item.module.id) || (!done.has(item.id) && !item.jobSpecific)),
    )
    .map((item) => item.title)
    .slice(0, 5);

  const fallback = courseAnswer({
    intent: input.intent,
    question: input.question,
    lesson:
      lesson && lessonPassages ? { title: lesson.title, passages: lessonPassages } : undefined,
    course: passages,
    missed,
    review,
    texts,
  });

  const ready = await aiReadiness(db, userId, "learn_coach");
  if (ready !== "ready")
    return { ok: true, answer: { ...fallback, source: "course", limit: ready } };

  let courseText = "";
  for (const item of lessons) {
    const paragraphs = lessonParagraphs(item.content);
    if (paragraphs.length === 0) continue;
    const block = `## Module ${item.module.order} · ${item.title}\n${paragraphs.join("\n")}\n`;
    if (courseText.length + block.length > MAX_COURSE_CHARS) break;
    courseText += block;
  }
  const details = [
    `Formation : ${course.title}`,
    lesson ? `Leçon ouverte : ${lesson.title}` : "",
    input.question ? `Demande de l'apprenant : ${input.question}` : "",
    input.intent === "mistake" && missed.length
      ? `Questions manquées :\n${missed
          .slice(0, 5)
          .map((miss) => `- ${miss.prompt}`)
          .join("\n")}`
      : "",
    input.intent === "revision" && review.length ? `Leçons à revoir : ${review.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const run = await runAi(db, {
      userId,
      feature: "learn_coach",
      system: SYSTEM,
      prompt: `<cours>\n${courseText}</cours>\n\n${details}\n\n${intentAsk[input.intent]}`,
      schema: modelSchema,
      template: () => ({ answer: fallback.answer, sources: fallback.sources }),
      maxTokens: 900,
      timeoutMs: 25_000,
    });
    const titles = new Set(lessons.map((item) => item.title));
    return {
      ok: true,
      answer: {
        answer: run.output.answer,
        // Only real lesson titles are shown as sources.
        sources: run.output.sources.filter((title) => titles.has(title)),
        source: run.source === "ai" ? "ai" : "course",
      },
    };
  } catch (error) {
    if (error instanceof AiError)
      return { ok: true, answer: { ...fallback, source: "course", limit: error.code } };
    throw error;
  }
}
