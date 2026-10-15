"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import { dynamic } from "@/i18n/dynamic";
import { ruleDiagnostic } from "@/server/services/diagnostic";
import {
  DIAGNOSTIC_GATE,
  followUpQuestions,
  personalizedDiagnostic,
} from "@/server/services/diagnostic-ai";
import { answersSchema, SKILLS_ASSESSED, type Answers } from "@/server/services/diagnostic-scoring";
import {
  demandedSkills,
  discardDraft,
  saveDiagnostic,
  saveDraft,
  scheduleReminder,
} from "@/server/services/diagnostic-store";

const PATH = "/app/career/diagnostic";

/** The answers of the questionnaire as a form sends them (without JavaScript). */
function answersFromForm(formData: FormData) {
  const entries = Object.fromEntries(
    [...formData.entries()].filter(([key]) => !key.startsWith("$ACTION")),
  );
  const skillChecks = Array.from({ length: SKILLS_ASSESSED }, (_, index) => ({
    skill: formData.get(`skill-${index}`),
    level: formData.get(`skillLevel-${index}`),
    proof: formData.get(`skillProof-${index}`),
  })).filter((item) => item.skill && item.level && item.proof);
  return {
    ...entries,
    values: formData.getAll("values").map(String),
    useProfile: formData.get("useProfile") === "on",
    skillChecks,
  };
}

type Analysis =
  | {
      ok: true;
      id: string;
      score: number;
      stage: string;
      level: "simple" | "personalized";
      error?: string;
    }
  | { ok: false };

/**
 * Fixed rules for everyone; with `career.diagnostic.level` = personalized and the box ticked,
 * Jumanly Intelligence adds its summary (consent and credits checked in src/server/ai). Beyond
 * 25 s, or on any AI error, the rules' result is kept and said so.
 */
async function analyze(userId: string, answers: Answers, wantsAi: boolean): Promise<Analysis> {
  const allowed =
    wantsAi &&
    DIAGNOSTIC_GATE.levels.includes(
      await level(db, { type: "user", id: userId }, DIAGNOSTIC_GATE.key),
    );
  const { offers } = await demandedSkills(db, answers.targetRole);
  const base = ruleDiagnostic(answers, { offers, personalized: allowed });
  const t = dynamic(await getTranslations("career.diagnostic"));
  let outcome: { level: "simple" | "personalized"; result: unknown; error?: string } = {
    level: "simple",
    result: base,
  };
  if (allowed) {
    outcome = await personalizedDiagnostic(db, userId, answers, base, (question, code) =>
      t.has(`q.${question}.${code}`) ? t(`q.${question}.${code}`) : code,
    );
  }
  const diagnostic = await saveDiagnostic(db, {
    userId,
    level: outcome.level,
    answers,
    result: outcome.result,
    stage: t(`stage.${base.stage}`),
  });
  return {
    ok: true,
    id: diagnostic.id,
    score: base.score,
    stage: base.stage,
    level: outcome.level,
    error: outcome.error,
  };
}

/** The form without JavaScript: all the questions on one page, then the result. */
export async function submitDiagnostic(formData: FormData) {
  const parsed = answersSchema.safeParse(answersFromForm(formData));
  const user = await requireUser(PATH);
  if (!parsed.success) redirect(`${PATH}?erreur=1#questions`);
  const analysis = await analyze(user.id, parsed.data, formData.get("personalized") === "1");
  if (!analysis.ok) redirect(`${PATH}?erreur=1#questions`);
  redirect(`${PATH}?bilan=${analysis.id}${analysis.error ? `&ia=${analysis.error}` : ""}`);
}

/** Last step of the scan: the diagnostic is saved, its notification left. */
export async function runDiagnosticAction(input: {
  answers: unknown;
  personalized: boolean;
}): Promise<Analysis> {
  const parsed = answersSchema.safeParse(input.answers);
  const user = await requireUser(PATH);
  if (!parsed.success) return { ok: false };
  return analyze(user.id, parsed.data, input.personalized === true);
}

/** Each answer is saved, so the talent can leave and resume. */
export async function saveDiagnosticDraftAction(answers: unknown, step: number) {
  const user = await requireUser(PATH);
  return saveDraft(db, user.id, answers, Number.isFinite(step) ? step : 0);
}

/**
 * The two follow-up questions of the personalized level (docs/experience-animee § 5.3): written
 * by Jumanly Intelligence from the answers so far, or by the rules when the model is not there.
 * None without the `career.diagnostic.level` entitlement.
 */
export async function diagnosticFollowUpsAction(answers: unknown): Promise<string[]> {
  const user = await requireUser(PATH);
  const parsed = answersSchema.partial().safeParse(answers);
  if (!parsed.success) return [];
  const allowed = DIAGNOSTIC_GATE.levels.includes(
    await level(db, { type: "user", id: user.id }, DIAGNOSTIC_GATE.key),
  );
  if (!allowed) return [];
  const t = dynamic(await getTranslations("career.diagnostic"));
  const { questions } = await followUpQuestions(
    db,
    user.id,
    parsed.data,
    (item) => t(`followUp.rule.${item.code}`, { skill: item.skill ?? "" }),
    (question, code) => (t.has(`q.${question}.${code}`) ? t(`q.${question}.${code}`) : code),
  );
  return questions;
}

/** The skills to assess for a target job, from the real published offers. */
export async function diagnosticSkillsAction(role: string) {
  await requireUser(PATH);
  return demandedSkills(db, typeof role === "string" ? role.slice(0, 120) : "");
}

/** « Lecture de votre profil et de votre CV »: what the scan reads, counted. */
export async function readDiagnosticProfileAction() {
  const user = await requireUser(PATH);
  const profile = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: {
      _count: { select: { skills: true, experiences: true } },
      documents: { where: { kind: "cv" }, select: { id: true }, take: 1 },
    },
  });
  return {
    skills: profile?._count.skills ?? 0,
    experiences: profile?._count.experiences ?? 0,
    cv: (profile?.documents.length ?? 0) > 0,
  };
}

/** « Recommencer à zéro »: the draft is dropped, a new questionnaire starts. */
export async function discardDiagnosticDraftAction(formData: FormData) {
  const user = await requireUser(PATH);
  await discardDraft(db, user.id);
  redirect(`${PATH}?etape=1${formData.get("profil") === "1" ? "&profil=1" : ""}`);
}

/** « Refaire dans 30 jours ». */
export async function remindDiagnosticAction(formData: FormData) {
  const user = await requireUser(PATH);
  const id = String(formData.get("id") ?? "");
  await scheduleReminder(db, user.id, id);
  redirect(`${PATH}?bilan=${encodeURIComponent(id)}&rappel=1`);
}
