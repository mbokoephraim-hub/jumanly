/**
 * Screening questions of an offer and the answers of talents (brief recruteur § 2.6): yes / no or
 * a free answer, shown to the talent, never a condition to apply (golden rule n° 1). Kept apart
 * from the rest of Hire so that applying needs nothing more.
 */
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

export const screeningQuestionSchema = z.object({
  id: z.string().trim().min(1).max(40),
  text: z.string().trim().min(5).max(200),
  kind: z.enum(["yesno", "text"]),
});
export type ScreeningQuestion = z.infer<typeof screeningQuestionSchema>;

/** The questions saved on a job, read safely (an old or odd value gives no question). */
export function screeningQuestionsOf(value: Prisma.JsonValue | null | undefined) {
  const parsed = z.array(screeningQuestionSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

/** A talent's answer to a screening question, kept with the question as it was asked. */
export type ScreeningAnswer = {
  id: string;
  question: string;
  kind: "yesno" | "text";
  answer: string;
};

/**
 * The answers a talent gave, kept only for the job's own questions; a missing or odd answer is
 * simply left out. Answering is never a condition to apply (golden rule n° 1).
 */
export function screeningAnswersFor(
  questions: ScreeningQuestion[],
  answers: Record<string, string>,
): ScreeningAnswer[] {
  return questions.flatMap((question) => {
    const raw = String(answers[question.id] ?? "").trim();
    const answer =
      question.kind === "yesno" ? (raw === "yes" || raw === "no" ? raw : "") : raw.slice(0, 1000);
    return answer
      ? [{ id: question.id, question: question.text, kind: question.kind, answer }]
      : [];
  });
}

const screeningAnswerSchema = z.object({
  id: z.string(),
  question: z.string(),
  kind: z.enum(["yesno", "text"]),
  answer: z.string(),
});

/** The answers saved on an application or a draft, read safely. */
export function screeningAnswersOf(value: Prisma.JsonValue | null | undefined): ScreeningAnswer[] {
  const parsed = z.array(screeningAnswerSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

/**
 * Ready answers for the usual questions (Ephraïm, 31/10/2026): the talent taps an answer instead
 * of typing it. The kind of question is read from its wording, so the suggestions of the offer
 * wizard and the recruiter's own wording both work; any other question stays a free answer.
 */
export type ScreeningPreset = "experience" | "start" | "place" | "salary";

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export function screeningPresetOf(question: Pick<ScreeningQuestion, "text" | "kind">) {
  if (question.kind !== "text") return null;
  const text = fold(question.text);
  if (/salaire|remuneration|pretention|combien.*(gagner|payer)/.test(text)) return "salary";
  if (/poste (semblable|similaire|equivalent)|deja (occupe|travaille|exerce)|experience/.test(text))
    return "experience";
  if (/commencer|debuter|disponib|prendre (le|votre) poste/.test(text)) return "start";
  if (/venir|demenager|vous (trouvez|etes) a |habitez|residez|lieu du poste|deplacer/.test(text))
    return "place";
  return null satisfies ScreeningPreset | null;
}

/** The answer sent: the option tapped, then what the talent added (« Oui, déjà · Ministère »). */
export const ANSWER_SEPARATOR = " · ";

export function composeScreeningAnswer(answer: string, detail: string) {
  const main = answer.trim();
  const more = detail.trim().slice(0, 300);
  return main && more ? `${main}${ANSWER_SEPARATOR}${more}` : main;
}

/** Splits a saved answer back into the option among `options` and the added detail. */
export function splitScreeningAnswer(saved: string, options: string[]) {
  const option = options.find(
    (item) => saved === item || saved.startsWith(`${item}${ANSWER_SEPARATOR}`),
  );
  if (!option) return { option: null, detail: saved };
  return { option, detail: saved.slice(option.length + ANSWER_SEPARATOR.length) };
}
