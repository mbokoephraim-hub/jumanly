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
