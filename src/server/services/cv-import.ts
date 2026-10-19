/**
 * CV import (partie 08 § 8.9 `cv_parse`, textes « Analyse de CV à l'import »). The talent pastes
 * the text of their CV; the model (or, without consent or credits, a free extraction by rules)
 * proposes items, and nothing enters the profile before the talent validates each one.
 */
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { aiReadiness, runAi, AiError } from "@/server/ai";
import { monthToDate, normalize, refreshCompleteness, ensureProfile } from "./profile";

export const CV_TEXT_MAX = 15_000;

const monthOrNull = z.string().nullable();

export const extractionSchema = z.object({
  experiences: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      /** "2024-03" or null when not found. */
      start: monthOrNull,
      end: monthOrNull,
      description: z.string(),
    }),
  ),
  educations: z.array(
    z.object({
      degree: z.string(),
      school: z.string(),
      level: z.enum(["none", "secondary", "vocational", "bachelor", "master", "doctorate"]),
      endYear: z.number().int().nullable(),
    }),
  ),
  skills: z.array(z.string()),
});
export type Extraction = z.infer<typeof extractionSchema>;

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Free extraction: the skills of the reference list whose name or alias appears in the text. */
export async function extractByRules(db: PrismaClient, text: string): Promise<Extraction> {
  // A dot ending a sentence (« Excel. ») is not part of the word; « node.js » or « .net » keep theirs.
  const folded = ` ${normalize(text)
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\.+(?= |$)/g, " ")} `;
  const skills = await db.skill.findMany({ select: { name: true, aliases: true } });
  const found = skills
    .filter((skill) =>
      [skill.name, ...skill.aliases].some((name) => {
        const word = normalize(name)
          .replace(/[^a-z0-9+#.]+/g, " ")
          .trim();
        return word.length >= 2 && folded.includes(` ${word} `);
      }),
    )
    .map((skill) => skill.name);
  return { experiences: [], educations: [], skills: found.slice(0, 40) };
}

const SYSTEM = [
  "Tu extrais les informations d'un CV en JSON, pour Jumanly. Tu recopies ce qui est écrit, sans rien inventer ni reformuler.",
  "Dates au format AAAA-MM (null si absente). Une ligne par réalisation dans « description ».",
  "Ignore et ne recopie jamais : photo, âge, date de naissance, genre, nationalité, origine, religion, situation familiale, santé, adresse.",
].join("\n");

/** Keeps only what can enter a profile: required fields present, dates well formed. */
function clean(extraction: Extraction): Extraction {
  return {
    experiences: extraction.experiences
      .filter((item) => item.title.trim() && item.company.trim())
      .map((item) => ({
        ...item,
        start: item.start && MONTH.test(item.start) ? item.start : null,
        end: item.end && MONTH.test(item.end) ? item.end : null,
        description: item.description.slice(0, 3000),
      }))
      .slice(0, 15),
    educations: extraction.educations
      .filter((item) => item.degree.trim() && item.school.trim())
      .map((item) => ({
        ...item,
        endYear: item.endYear && item.endYear >= 1950 && item.endYear <= 2100 ? item.endYear : null,
      }))
      .slice(0, 10),
    skills: [...new Set(extraction.skills.map((skill) => skill.trim()).filter(Boolean))].slice(
      0,
      40,
    ),
  };
}

/** The file the text was read from (« Importer un CV »), shown while the talent checks the items. */
export const importFileSchema = z.object({
  name: z.string().max(200),
  kind: z.enum(["pdf", "docx"]),
  pages: z.number().int().nullable(),
  size: z.number().int(),
});
export type ImportFile = z.infer<typeof importFileSchema>;

export type ImportPayload = Extraction & { source: "ai" | "rules"; file?: ImportFile };

/**
 * Reads a pasted CV. With AI consent and credits, the fast model extracts experiences, studies
 * and skills; otherwise the rules find the skills (« sans crédit IA »). The result waits for the
 * talent's validation as a pending AiSuggestion.
 */
export async function importCvText(
  db: PrismaClient,
  userId: string,
  text: string,
  file?: ImportFile,
) {
  const trimmed = text.trim().slice(0, CV_TEXT_MAX);
  const rules = () => extractByRules(db, trimmed);
  let payload: ImportPayload;
  if ((await aiReadiness(db, userId, "cv_parse")) === "ready") {
    const fallback = await rules();
    try {
      const run = await runAi(db, {
        userId,
        feature: "cv_parse",
        system: SYSTEM,
        prompt: `CV :\n${trimmed}`,
        schema: extractionSchema,
        template: () => fallback,
      });
      payload = { ...clean(run.output), source: run.source === "ai" ? "ai" : "rules" };
    } catch (error) {
      if (!(error instanceof AiError)) throw error;
      payload = { ...fallback, source: "rules" };
    }
  } else {
    payload = { ...(await rules()), source: "rules" };
  }
  if (file) payload.file = { ...file, name: file.name.slice(0, 200) };
  await db.aiSuggestion.deleteMany({ where: { userId, feature: "cv_parse", status: "pending" } });
  return db.aiSuggestion.create({
    data: { userId, feature: "cv_parse", payload: payload as unknown as Prisma.InputJsonValue },
  });
}

export function parseImport(value: Prisma.JsonValue): ImportPayload | null {
  const parsed = extractionSchema
    .extend({ source: z.enum(["ai", "rules"]), file: importFileSchema.optional() })
    .safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * The talent's validation: only the items ticked enter the profile. Skills must exist in the
 * reference list; an experience without a start date is skipped (the talent adds it by hand).
 */
export async function applyImport(
  db: PrismaClient,
  userId: string,
  suggestionId: string,
  chosen: { experiences: number[]; educations: number[]; skills: number[] },
) {
  const suggestion = await db.aiSuggestion.findFirst({
    where: { id: suggestionId, userId, feature: "cv_parse", status: "pending" },
  });
  const payload = suggestion ? parseImport(suggestion.payload) : null;
  if (!suggestion || !payload) return null;
  const profile = await ensureProfile(db, userId);
  let added = 0;

  for (const index of chosen.experiences) {
    const item = payload.experiences[index];
    if (!item?.start) continue;
    await db.experience.create({
      data: {
        profileId: profile.id,
        title: item.title.slice(0, 120),
        company: item.company.slice(0, 120),
        startDate: monthToDate(item.start),
        endDate: item.end ? monthToDate(item.end) : null,
        description: item.description,
      },
    });
    added++;
  }
  for (const index of chosen.educations) {
    const item = payload.educations[index];
    if (!item) continue;
    await db.education.create({
      data: {
        profileId: profile.id,
        degree: item.degree.slice(0, 160),
        school: item.school.slice(0, 160),
        level: item.level,
        endYear: item.endYear,
      },
    });
    added++;
  }
  const names = chosen.skills.flatMap((index) => payload.skills[index] ?? []);
  if (names.length > 0) {
    const reference = await db.skill.findMany({ select: { id: true, name: true, aliases: true } });
    const existing = new Set(
      (await db.profileSkill.findMany({ where: { profileId: profile.id } })).map(
        (row) => row.skillId,
      ),
    );
    for (const name of names) {
      const skill = reference.find(
        (row) =>
          normalize(row.name) === normalize(name) ||
          row.aliases.some((alias) => normalize(alias) === normalize(name)),
      );
      if (!skill || existing.has(skill.id)) continue;
      existing.add(skill.id);
      await db.profileSkill.create({
        data: { profileId: profile.id, skillId: skill.id, source: "declared" },
      });
      added++;
    }
  }
  await db.aiSuggestion.update({ where: { id: suggestion.id }, data: { status: "applied" } });
  await refreshCompleteness(db, profile.id);
  return added;
}
