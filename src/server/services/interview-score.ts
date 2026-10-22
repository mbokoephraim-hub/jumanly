/**
 * « Votre bilan » of an interview practice on the phone (Modèle B, lot B6): a mark out of 100 per
 * answer and per criterion, computed by rules from the answers alone, the same answers always
 * giving the same marks. It measures the answers (clarity, examples, link with the offer, ease or
 * length), never the person's chances: no prediction, nothing shown to a recruiter. Each mark
 * comes with its reason (a code and its numbers, worded by the texts).
 */
import type { InterviewSimMode } from "@/generated/prisma/client";
import { answerSignals, pace, type InterviewTurn } from "./interview-sim";

export const scoreCriteria = ["clarity", "examples", "relevance", "ease", "length"] as const;
export type ScoreCriterion = (typeof scoreCriteria)[number];

/** The reason under a criterion, worded by `phoneInterview.report.why.<code>`. */
export type ScoreReason = { code: string; values?: Record<string, string | number> };

export type AnswerScore = {
  index: number;
  score: number;
  /** « Ce qui marche » and « À améliorer » of the answer, worded by `phoneInterview.answer.*`. */
  works: string[];
  improve: string[];
};

export type SessionScore = {
  overall: number;
  criteria: { key: ScoreCriterion; score: number; reason: ScoreReason }[];
  answers: AnswerScore[];
};

/** A mark of 70 and more shows in Lime, below in amber (planche Entretien-bilan). */
export const GOOD_SCORE = 70;

const FILLERS = /(?<!\p{L})(euh+|heu+|hum+|bah|ben)(?!\p{L})/giu;
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Words of the offer worth citing: the job title's long words, the skills, the company. */
export function offerKeywords(input: {
  title?: string | null;
  skills?: string[];
  company?: string | null;
}) {
  const words = new Set<string>();
  for (const word of (input.title ?? "").split(/[\s,/()-]+/)) if (word.length > 3) words.add(word);
  for (const skill of input.skills ?? []) if (skill.trim()) words.add(skill.trim());
  if (input.company?.trim()) words.add(input.company.trim().split(/\s+/)[0]!);
  return [...words];
}

function sentenceWords(answer: string) {
  const sentences = answer.split(/[.!?…]+/).filter((part) => part.trim().length > 0);
  return sentences.map((part) => part.split(/\s+/).filter(Boolean).length);
}

function clarityOf(answer: string) {
  const lengths = sentenceWords(answer);
  const mean = average(lengths);
  const longest = Math.max(0, ...lengths);
  const base = mean <= 18 ? 100 : mean >= 40 ? 40 : 100 - ((mean - 18) * 60) / 22;
  return clamp(base - (longest > 45 ? 10 : 0));
}

function examplesOf(answer: string) {
  const signals = answerSignals(answer);
  return clamp(
    (/\d/.test(answer) ? 50 : 0) + (signals.example ? 25 : 0) + (signals.result ? 25 : 0),
  );
}

function cited(answer: string, keywords: string[]) {
  const text = fold(answer);
  return keywords.filter((word) => text.includes(fold(word)));
}

function relevanceOf(answer: string, keywords: string[]) {
  const count = answerSignals(answer).count;
  const lengthPart = count < 25 ? 40 : count > 350 ? 70 : 100;
  if (keywords.length === 0) return clamp(lengthPart * 0.8);
  const matched = cited(answer, keywords).length;
  return clamp(lengthPart * 0.5 + Math.min(50, 20 + matched * 15) - (matched === 0 ? 20 : 0));
}

function lengthOf(answer: string) {
  const count = answerSignals(answer).count;
  if (count >= 60 && count <= 120) return 100;
  if (count < 60) return clamp(40 + count);
  return clamp(Math.max(50, 100 - (count - 120) / 2));
}

function easeOf(turn: InterviewTurn) {
  const speed = pace(turn);
  if (speed === null) return null;
  const fillers = (turn.answer ?? "").match(FILLERS)?.length ?? 0;
  const off = speed < 110 ? 110 - speed : speed > 160 ? speed - 160 : 0;
  return { score: clamp(Math.max(30, 100 - off * 1.5 - fillers * 5)), speed, fillers };
}

/** The marks of a session: only the questions answered count. */
export function scoreSession(
  turns: InterviewTurn[],
  mode: InterviewSimMode,
  keywords: string[] = [],
): SessionScore | null {
  const answered = turns
    .map((turn, index) => ({ turn, index, answer: turn.answer?.trim() ?? "" }))
    .filter((item) => item.answer.length > 0);
  if (answered.length === 0) return null;

  const rows = answered.map(({ turn, index, answer }) => {
    const ease = mode === "voice" ? easeOf(turn) : null;
    const marks: Partial<Record<ScoreCriterion, number>> = {
      clarity: clarityOf(answer),
      examples: examplesOf(answer),
      relevance: relevanceOf(answer, keywords),
    };
    if (ease) marks.ease = ease.score;
    else marks.length = lengthOf(answer);
    const signals = answerSignals(answer);
    const works: string[] = [];
    const improve: string[] = [];
    if (/\d/.test(answer)) works.push("number");
    if (signals.situation) works.push("situation");
    if (cited(answer, keywords).length > 0) works.push("offer");
    if ((marks.clarity ?? 0) >= GOOD_SCORE) works.push("clear");
    if (!/\d/.test(answer)) improve.push("number");
    if (!signals.result) improve.push("result");
    if ((marks.clarity ?? 100) < GOOD_SCORE) improve.push("long");
    if (signals.count < 25) improve.push("short");
    if (ease && ease.speed > 160) improve.push("fast");
    if (ease && ease.speed < 110) improve.push("slow");
    if (works.length === 0) works.push("answered");
    if (improve.length === 0) improve.push("company");
    return {
      index,
      marks,
      ease,
      score: clamp(average(Object.values(marks))),
      works: works.slice(0, 2),
      improve: improve.slice(0, 2),
      answer,
    };
  });

  const criterion = (key: ScoreCriterion) => {
    const values = rows.flatMap((row) => (row.marks[key] === undefined ? [] : [row.marks[key]!]));
    return values.length ? clamp(average(values)) : null;
  };
  const withoutNumber = rows.filter((row) => !/\d/.test(row.answer)).length;
  const citedWords = [...new Set(rows.flatMap((row) => cited(row.answer, keywords)))];
  const eases = rows.flatMap((row) => (row.ease ? [row.ease] : []));
  const reasons: Record<ScoreCriterion, ScoreReason> = {
    clarity: { code: (criterion("clarity") ?? 0) >= GOOD_SCORE ? "clarityGood" : "clarityLong" },
    examples:
      withoutNumber === 0
        ? { code: "examplesGood" }
        : { code: "examplesMissing", values: { count: withoutNumber } },
    relevance:
      keywords.length === 0
        ? { code: "relevanceNoOffer" }
        : citedWords.length > 0
          ? { code: "relevanceCited", values: { words: citedWords.slice(0, 2).join(", ") } }
          : { code: "relevanceMissing", values: { words: keywords.slice(0, 2).join(", ") } },
    ease: {
      code: "ease",
      values: {
        speed: Math.round(average(eases.map((item) => item.speed))),
        fillers: eases.reduce((sum, item) => sum + item.fillers, 0),
      },
    },
    length: {
      code: (criterion("length") ?? 0) >= GOOD_SCORE ? "lengthGood" : "lengthOff",
    },
  };
  const criteria = scoreCriteria.flatMap((key) => {
    const score = criterion(key);
    return score === null ? [] : [{ key, score, reason: reasons[key] }];
  });

  return {
    overall: clamp(average(rows.map((row) => row.score))),
    criteria,
    answers: rows.map(({ index, score, works, improve }) => ({ index, score, works, improve })),
  };
}
