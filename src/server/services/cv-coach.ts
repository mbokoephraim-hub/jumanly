/**
 * CV coach (partie 08 § 8.9 `cv_coach`, textes « Coach CV »). The CV score is computed by fixed
 * rules (no model, no credit). The model only proposes rewordings of what is already written:
 * each one is checked against the current CV, never adds a figure or a skill, and is applied
 * only when the talent clicks « Appliquer ».
 */
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { AiError, runAi } from "@/server/ai";
import { parseCv, type CvContent } from "./cv";

// ─── Score (rules) ───────────────────────────────────────────────────────────

export type CvScore = {
  total: number;
  ats: number;
  impact: number;
  keywords: number;
  level: "excellent" | "veryGood" | "good" | "toImprove";
};

const hasDigit = (text: string) => /\d/.test(text);
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function cvText(content: CvContent) {
  return fold(
    [
      content.info.headline,
      content.summary,
      ...content.experiences.flatMap((item) => [item.title, ...item.bullets]),
      ...content.skills.map((skill) => skill.name),
    ].join(" "),
  );
}

/**
 * ATS readability (sections a software expects), impact (achievements with a figure) and
 * keywords (skills of the target jobs present in the CV), each from 0 to 100.
 */
export function cvScore(content: CvContent, targetSkills: string[]): CvScore {
  const checks = [
    content.info.headline.trim().length > 0,
    content.summary.trim().length >= 80,
    content.experiences.length > 0 || content.education.length > 0,
    content.experiences.every((item) => /^\d{4}-\d{2}$/.test(item.start)),
    content.skills.length >= 3,
    content.languages.length > 0,
  ];
  const ats = Math.round((100 * checks.filter(Boolean).length) / checks.length);
  const bullets = content.experiences
    .flatMap((item) => item.bullets)
    .filter((bullet) => bullet.trim());
  const impact =
    bullets.length === 0 ? 0 : Math.round((100 * bullets.filter(hasDigit).length) / bullets.length);
  const text = cvText(content);
  const targets = [...new Set(targetSkills.map(fold))];
  const keywords =
    targets.length === 0
      ? Math.min(100, content.skills.length * 15)
      : Math.round((100 * targets.filter((skill) => text.includes(skill)).length) / targets.length);
  const total = Math.round(0.4 * ats + 0.3 * impact + 0.3 * keywords);
  const level =
    total >= 85 ? "excellent" : total >= 70 ? "veryGood" : total >= 50 ? "good" : "toImprove";
  return { total, ats, impact, keywords, level };
}

export const cvCheckKeys = [
  "headline",
  "summary",
  "figure",
  "dates",
  "skills",
  "keywords",
  "languages",
  "readable",
] as const;
export type CvCheckKey = (typeof cvCheckKeys)[number];
export type CvCheck = { key: CvCheckKey; ok: boolean; missing?: string[] };

/**
 * « Ce qu’Orbi a vérifié » (docs/carriere-v3, Aperçu): the rules behind the score, one line
 * each, in the order a recruiter reads. Fixed rules, no model; `missing` names the skills of
 * the target jobs absent from the CV.
 */
export function cvChecks(
  content: CvContent,
  targetSkills: string[],
  template: { ats: "excellent" | "veryGood" | "good" },
): CvCheck[] {
  const text = cvText(content);
  const targets = [...new Map(targetSkills.map((skill) => [fold(skill), skill])).entries()];
  const missing = targets.filter(([folded]) => !text.includes(folded)).map(([, skill]) => skill);
  return [
    { key: "headline", ok: content.info.headline.trim().length > 0 },
    { key: "summary", ok: content.summary.trim().length >= 80 },
    {
      key: "figure",
      ok:
        hasDigit(content.summary) ||
        content.experiences.some((item) => item.bullets.some(hasDigit)),
    },
    { key: "dates", ok: content.experiences.every((item) => /^\d{4}-\d{2}$/.test(item.start)) },
    { key: "skills", ok: content.skills.length >= 3 },
    {
      key: "keywords",
      // Most of the skills the target jobs ask for: 60 % or more of them on the CV.
      ok: missing.length <= targets.length * 0.4,
      missing: missing.slice(0, 5),
    },
    { key: "languages", ok: content.languages.length > 0 },
    { key: "readable", ok: template.ats !== "good" },
  ];
}

/** Skills most asked for in published jobs close to the talent's target (top 10). */
export async function targetSkillsFor(db: PrismaClient, userId: string) {
  const profile = await db.talentProfile.findUnique({
    where: { userId },
    select: { targetJob: true, desiredJobTitles: true, headline: true },
  });
  const titles = [profile?.targetJob, ...(profile?.desiredJobTitles ?? []), profile?.headline]
    .filter((value): value is string => Boolean(value?.trim()))
    .flatMap((value) => value.split(/[\s,/·-]+/).filter((word) => word.length >= 4));
  if (titles.length === 0)
    return { skills: [] as string[], percents: {} as Record<string, number>, jobs: 0, title: null };
  const jobs = await db.job.findMany({
    where: {
      status: "published",
      OR: titles.map((word) => ({ title: { contains: word, mode: "insensitive" as const } })),
    },
    select: { skills: { select: { skill: { select: { name: true } } } } },
    take: 50,
  });
  const counts = new Map<string, number>();
  for (const job of jobs)
    for (const { skill } of job.skills) counts.set(skill.name, (counts.get(skill.name) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  return {
    skills: top.map(([name]) => name),
    percents: Object.fromEntries(
      top.map(([name, count]) => [name, Math.round((100 * count) / Math.max(1, jobs.length))]),
    ),
    jobs: jobs.length,
    title: profile?.targetJob || profile?.desiredJobTitles[0] || profile?.headline || null,
  };
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

export const suggestionKinds = [
  "quantify",
  "actionVerb",
  "headlineSkill",
  "summary",
  "dates",
  // A rewording of the CV adapted to an offer or a pasted text (planche talent-4 § 6).
  "tailor",
] as const;

const targetSchema = z.object({
  section: z.enum(["headline", "summary", "bullet"]),
  experience: z.number().int().nullable(),
  bullet: z.number().int().nullable(),
});

const suggestionSchema = z.object({
  kind: z.enum(suggestionKinds),
  target: targetSchema,
  before: z.string(),
  /** The proposed text, or null for an advice the talent writes themself. */
  after: z.string().nullable(),
  skill: z.string().nullable(),
});
/**
 * What is stored: the model's suggestion, and the words it puts forward (the skills an offer asks
 * for, shown under « Pourquoi ces changements ? »).
 */
const storedSuggestionSchema = suggestionSchema.extend({ focus: z.array(z.string()).optional() });
export type CoachSuggestion = z.infer<typeof storedSuggestionSchema>;

const coachOutput = z.object({ suggestions: z.array(suggestionSchema) });

function textAt(content: CvContent, target: CoachSuggestion["target"]): string | null {
  if (target.section === "headline") return content.info.headline;
  if (target.section === "summary") return content.summary;
  const experience = content.experiences[target.experience ?? -1];
  return experience?.bullets[target.bullet ?? -1] ?? null;
}

function withText(content: CvContent, target: CoachSuggestion["target"], text: string): CvContent {
  if (target.section === "headline")
    return { ...content, info: { ...content.info, headline: text } };
  if (target.section === "summary") return { ...content, summary: text };
  return {
    ...content,
    experiences: content.experiences.map((experience, index) =>
      index !== target.experience
        ? experience
        : {
            ...experience,
            bullets: experience.bullets.map((bullet, position) =>
              position === target.bullet ? text : bullet,
            ),
          },
    ),
  };
}

const digits = (text: string) => new Set(text.match(/\d+/g) ?? []);
const maxLength = (suggestion: CoachSuggestion) =>
  suggestion.target.section === "summary" ? 1000 : 600;

/**
 * Guard against invention (« aucune invention d'expérience ») : the text replaced must be the
 * current one, no figure may appear that the CV does not already hold, and a skill named must
 * already be in the CV.
 */
export function acceptable(content: CvContent, suggestion: CoachSuggestion) {
  const current = textAt(content, suggestion.target);
  if (current === null || current.trim() !== suggestion.before.trim()) return false;
  if (suggestion.after !== null) {
    if (!suggestion.after.trim() || suggestion.after.length > maxLength(suggestion)) return false;
    const known = digits(`${suggestion.before} ${JSON.stringify(content)}`);
    if ([...digits(suggestion.after)].some((value) => !known.has(value))) return false;
  }
  if (
    suggestion.skill &&
    !content.skills.some((skill) => fold(skill.name) === fold(suggestion.skill!))
  )
    return false;
  return true;
}

/** Suggestions by rules: advice only, except adding a skill already listed to the headline. */
export function templateSuggestions(content: CvContent, targetSkills: string[]): CoachSuggestion[] {
  const result: CoachSuggestion[] = [];
  const none = { experience: null, bullet: null };
  const headline = content.info.headline;
  const listed = content.skills.map((skill) => skill.name);
  const skill = targetSkills.find(
    (name) =>
      listed.some((own) => fold(own) === fold(name)) && !fold(headline).includes(fold(name)),
  );
  if (headline.trim() && skill) {
    result.push({
      kind: "headlineSkill",
      target: { section: "headline", ...none },
      before: headline,
      after: `${headline.trim()} · ${listed.find((own) => fold(own) === fold(skill))}`,
      skill: listed.find((own) => fold(own) === fold(skill)) ?? skill,
    });
  }
  if (content.summary.trim().length < 80) {
    result.push({
      kind: "summary",
      target: { section: "summary", ...none },
      before: content.summary,
      after: null,
      skill: null,
    });
  }
  content.experiences.forEach((experience, index) => {
    const position = experience.bullets.findIndex((bullet) => !hasDigit(bullet));
    if (position >= 0 && result.filter((item) => item.kind === "quantify").length < 3) {
      result.push({
        kind: "quantify",
        target: { section: "bullet", experience: index, bullet: position },
        before: experience.bullets[position]!,
        after: null,
        skill: null,
      });
    }
  });
  return result;
}

const SYSTEM = [
  "Tu es le coach CV de Jumanly, une plateforme d'emploi africaine. Tu écris en français simple.",
  "Tu proposes au plus 6 reformulations précises de textes déjà présents dans le CV fourni.",
  "Règles strictes :",
  "- « before » recopie exactement le texte actuel visé (titre, résumé ou une ligne d'expérience).",
  "- N'invente jamais d'expérience, de diplôme, de compétence, d'entreprise ni de chiffre. Si un résultat chiffré manque, écris « [chiffre] » à la place du nombre.",
  "- « skill » ne cite qu'une compétence déjà listée dans le CV, sinon null.",
  "- N'utilise et ne mentionne jamais : âge, genre, photo, origine, religion, situation familiale, santé.",
  "- kind : quantify (chiffrer un résultat), actionVerb (commencer par un verbe d'action), headlineSkill (ajouter une compétence listée au titre), summary (résumé plus clair), dates.",
].join("\n");

export type CoachResult = "done" | AiError["code"] | "empty";

/**
 * Runs the coach on a CV: replaces the pending suggestions of this CV with new ones. Without
 * consent, plan or credits, nothing is called and the reason is returned.
 */
export async function runCvCoach(
  db: PrismaClient,
  userId: string,
  documentId: string,
): Promise<CoachResult> {
  const document = await db.document.findFirst({
    where: { id: documentId, kind: "cv", profile: { userId } },
  });
  if (!document) return "empty";
  const content = parseCv(document.content);
  if (!content.summary && content.experiences.length === 0 && !content.info.headline)
    return "empty";
  const { skills } = await targetSkillsFor(db, userId);
  const cv = {
    headline: content.info.headline,
    summary: content.summary,
    experiences: content.experiences.map((item, index) => ({
      index,
      title: item.title,
      bullets: item.bullets.map((text, bullet) => ({ bullet, text })),
    })),
    skills: content.skills.map((skill) => skill.name),
  };
  try {
    const run = await runAi(db, {
      userId,
      feature: "cv_coach",
      system: SYSTEM,
      prompt: [
        "CV (JSON) :",
        JSON.stringify(cv),
        "Compétences les plus demandées pour le métier visé :",
        JSON.stringify(skills),
      ].join("\n"),
      schema: coachOutput,
      template: () => ({ suggestions: templateSuggestions(content, skills) }),
    });
    let suggestions = run.output.suggestions
      .filter((item) => acceptable(content, item))
      .slice(0, 8);
    if (suggestions.length === 0 && run.source === "ai")
      suggestions = templateSuggestions(content, skills);
    await db.$transaction([
      db.aiSuggestion.deleteMany({
        where: { userId, feature: "cv_coach", documentId, status: "pending" },
      }),
      db.aiSuggestion.createMany({
        data: suggestions.map((payload) => ({
          userId,
          feature: "cv_coach",
          documentId,
          payload: payload as unknown as Prisma.InputJsonValue,
        })),
      }),
    ]);
    return "done";
  } catch (error) {
    if (error instanceof AiError) return error.code;
    throw error;
  }
}

export function parseSuggestion(value: Prisma.JsonValue): CoachSuggestion | null {
  const parsed = storedSuggestionSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * « Accepter » (only when the text proposed is still about the current text), « Refuser », or
 * « Modifier »: the talent's own wording (`edited`) replaces the proposal.
 */
export async function decideSuggestion(
  db: PrismaClient,
  userId: string,
  suggestionId: string,
  decision: "applied" | "ignored",
  edited?: string,
) {
  const suggestion = await db.aiSuggestion.findFirst({
    where: { id: suggestionId, userId, feature: "cv_coach", status: "pending" },
  });
  if (!suggestion) return null;
  if (decision === "applied") {
    const payload = parseSuggestion(suggestion.payload);
    const document = suggestion.documentId
      ? await db.document.findFirst({
          where: { id: suggestion.documentId, kind: "cv", profile: { userId } },
        })
      : null;
    if (!payload || !document) return null;
    const content = parseCv(document.content);
    const own = edited?.trim() ?? "";
    // The talent's own words are theirs: only the place and the length are checked.
    const check = own ? { ...payload, after: null } : payload;
    const after = own || payload.after;
    if (after === null || after.length > maxLength(payload) || !acceptable(content, check))
      return null;
    await db.document.update({
      where: { id: document.id },
      data: {
        content: withText(content, payload.target, after) as unknown as Prisma.InputJsonValue,
      },
    });
  }
  return db.aiSuggestion.update({ where: { id: suggestion.id }, data: { status: decision } });
}

// ─── « Améliorer le résumé » and the changes to review (planche talent-4 § 6) ─────────────

const summaryOutput = z.object({ summary: z.string() });

const SUMMARY_SYSTEM = [
  "Tu es Orbi, l'assistant de Jumanly. Tu réécris le résumé d'un CV en français simple, en 2 ou 3 phrases, à la première personne.",
  "Règles strictes :",
  "- Utilise uniquement les faits du CV fourni : titre, expériences, compétences.",
  "- N'invente jamais d'expérience, de diplôme, de compétence, d'entreprise ni de chiffre.",
  "- N'utilise et ne mentionne jamais : âge, genre, photo, origine, religion, situation familiale, santé.",
].join("\n");

/** The summary by rules: the title and the first skills of the CV, then what was written. */
export function summaryTemplate(content: CvContent) {
  const skills = content.skills.slice(0, 2).map((skill) => skill.name);
  const lead = [content.info.headline.trim(), skills.join(", ")].filter(Boolean).join(", ");
  const last = content.experiences[0];
  const rest =
    content.summary.trim() || (last ? [last.title, last.company].filter(Boolean).join(", ") : "");
  const parts = [lead, rest].map((part) => part.trim().replace(/[.\s]+$/, "")).filter(Boolean);
  return parts.length > 0 ? `${parts.join(". ")}.` : "";
}

export type ImproveResult = "done" | "same" | "empty" | AiError["code"];

/**
 * « Améliorer » on the summary: Orbi proposes one rewording, checked like every suggestion, kept
 * pending until the talent accepts, changes or refuses it. Credits are checked by `runAi`.
 */
export async function improveCvSummary(
  db: PrismaClient,
  userId: string,
  documentId: string,
): Promise<ImproveResult> {
  const document = await db.document.findFirst({
    where: { id: documentId, kind: "cv", profile: { userId } },
  });
  if (!document) return "empty";
  const content = parseCv(document.content);
  if (!content.summary.trim() && !content.info.headline.trim() && content.experiences.length === 0)
    return "empty";
  let proposed: string;
  try {
    const run = await runAi(db, {
      userId,
      feature: "cv_coach",
      system: SUMMARY_SYSTEM,
      prompt: [
        "CV (JSON) :",
        JSON.stringify({
          headline: content.info.headline,
          summary: content.summary,
          experiences: content.experiences.map((item) => ({
            title: item.title,
            company: item.company,
            bullets: item.bullets,
          })),
          skills: content.skills.map((skill) => skill.name),
        }),
      ].join("\n"),
      schema: summaryOutput,
      template: () => ({ summary: summaryTemplate(content) }),
    });
    proposed = run.output.summary.trim();
  } catch (error) {
    if (error instanceof AiError) return error.code;
    throw error;
  }
  const proposal = (after: string): CoachSuggestion => ({
    kind: "summary",
    target: { section: "summary", experience: null, bullet: null },
    before: content.summary,
    after,
    skill: null,
  });
  const candidates = [proposed, summaryTemplate(content)].filter(
    (text) => text && text !== content.summary.trim(),
  );
  const suggestion = candidates.map(proposal).find((item) => acceptable(content, item));
  if (!suggestion) return "same";
  await db.$transaction([
    db.aiSuggestion.deleteMany({
      where: { userId, feature: "cv_coach", documentId, status: "pending" },
    }),
    db.aiSuggestion.create({
      data: {
        userId,
        feature: "cv_coach",
        documentId,
        payload: suggestion as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);
  return "done";
}

/** The changes Orbi proposed on a CV and not yet decided, in the order they were made. */
export async function pendingSuggestions(db: PrismaClient, userId: string, documentId: string) {
  const rows = await db.aiSuggestion.findMany({
    where: { userId, feature: "cv_coach", documentId, status: "pending" },
    orderBy: { createdAt: "asc" },
  });
  return rows.flatMap((row) => {
    const payload = parseSuggestion(row.payload);
    // Advice without a proposed text (former coach): nothing to accept here.
    return payload && payload.after !== null ? [{ id: row.id, payload }] : [];
  });
}

// ─── Orbi on each box of « Mes informations » (Ephraïm, 31/10/2026) ─────────────────────────

/** The boxes Orbi can rewrite: the title, the bio, the points of one experience, the achievements. */
export const cvTextKinds = ["headline", "summary", "bullets", "achievements"] as const;
export type CvTextKind = (typeof cvTextKinds)[number];

/** Orbi rewrites the CV for Pro and above (`career.cv.tailor`, the CV rewriting right). */
export const CV_TEXT_GATE = { key: "career.cv.tailor" };

const textsOutput = z.object({ texts: z.array(z.string()) });

const TEXTS_SYSTEM = [
  "Tu es Orbi, l'assistant de Jumanly, une plateforme d'emploi africaine. Tu améliores un texte d'un CV, en français simple et professionnel.",
  "Tu reçois une liste « texts » : tu renvoies exactement le même nombre de textes, dans le même ordre, chacun amélioré.",
  "Règles strictes :",
  "- Garde le sens. Corrige l'orthographe, rends le texte clair, concret, et commence les points par un verbe d'action.",
  "- N'invente jamais d'expérience, de diplôme, de compétence, d'entreprise ni de chiffre. Si un résultat chiffré manque, écris « [chiffre] ».",
  "- Un titre reste court (moins de 12 mots). Un résumé reste à la première personne, sans limite imposée, idéalement 6 à 8 lignes.",
  "- N'utilise et ne mentionne jamais : âge, genre, photo, origine, religion, situation familiale, santé.",
].join("\n");

/** Tidy by rules when the model is not used: spaces, a capital, a full stop on long lines. */
export function tidyCvText(text: string, kind: CvTextKind) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return clean;
  const capital = clean.charAt(0).toLocaleUpperCase("fr") + clean.slice(1);
  if (kind === "headline") return capital.replace(/[.\s]+$/, "");
  return /[.!?…»)]$/.test(capital) ? capital : `${capital}.`;
}

export type CvTextsResult =
  { ok: true; texts: string[] } | { ok: false; error: "empty" | "same" | AiError["code"] };

/**
 * « Améliorer avec Orbi » on one box: the texts proposed come back to the form, where they are
 * shown highlighted with « Annuler » and « Rétablir »; nothing is saved by this call. Each text
 * is checked like every suggestion: no figure the CV does not already hold.
 */
export async function rewriteCvTexts(
  db: PrismaClient,
  userId: string,
  documentId: string,
  input: { kind: CvTextKind; texts: string[]; context: CvContent },
): Promise<CvTextsResult> {
  const document = await db.document.findFirst({
    where: { id: documentId, kind: "cv", profile: { userId } },
    select: { id: true },
  });
  const texts = input.texts.map((text) => text.trim());
  if (!document || !texts.some(Boolean)) return { ok: false, error: "empty" };
  const content = input.context;
  const max = input.kind === "summary" ? 6000 : input.kind === "headline" ? 160 : 400;
  const template = () => ({ texts: texts.map((text) => tidyCvText(text, input.kind)) });
  let proposed: string[];
  try {
    const run = await runAi(db, {
      userId,
      feature: "cv_coach",
      gate: CV_TEXT_GATE,
      system: TEXTS_SYSTEM,
      prompt: [
        `Case du CV : ${input.kind}`,
        "Contexte du CV (JSON, pour comprendre, ne pas recopier) :",
        JSON.stringify({
          headline: content.info.headline,
          experiences: content.experiences.map((item) => item.title),
          skills: content.skills.map((skill) => skill.name),
        }),
        "Textes à améliorer (JSON) :",
        JSON.stringify({ texts }),
      ].join("\n"),
      schema: textsOutput,
      template,
    });
    proposed = run.output.texts;
  } catch (error) {
    if (error instanceof AiError) return { ok: false, error: error.code };
    throw error;
  }
  const known = digits(`${texts.join(" ")} ${JSON.stringify(content)}`);
  const safe =
    proposed.length === texts.length &&
    proposed.every(
      (text, index) =>
        // An empty line stays empty; a filled one gets a text without new figures.
        (texts[index] === "" ? text.trim() === "" : text.trim() !== "") &&
        text.length <= max &&
        [...digits(text)].every((value) => known.has(value)),
    );
  const result = (safe ? proposed : template().texts).map((text, index) =>
    texts[index] === "" ? "" : text.trim(),
  );
  if (result.every((text, index) => text === texts[index])) return { ok: false, error: "same" };
  return { ok: true, texts: result };
}
