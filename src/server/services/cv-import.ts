/**
 * CV import (partie 08 § 8.9 `cv_parse`, textes « Analyse de CV à l'import »). The talent pastes
 * the text of their CV; the model (or, without consent or credits, a free extraction by rules)
 * proposes items, and nothing enters the profile before the talent validates each one.
 */
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { aiReadiness, runAi, AiError } from "@/server/ai";
import type { AiImage } from "@/server/ai/provider";
import { languageName } from "@/lib/dates";
import {
  monthToDate,
  normalize,
  parseProfileLanguages,
  refreshCompleteness,
  ensureProfile,
} from "./profile";

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
  /** ISO 639-1 codes of the languages written on the CV (« fr », « ln »). */
  languages: z.array(z.string()),
  /** What the CV says of the person (« Coordonnées »); only the city may fill an empty profile. */
  contact: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    city: z.string().nullable(),
  }),
});
export type Extraction = z.infer<typeof extractionSchema>;

const noContact: Extraction["contact"] = { name: null, email: null, city: null };

/** Languages found by name in a CV, without the model: the common ones of the region and beyond. */
const KNOWN_LANGUAGES = [
  "fr",
  "en",
  "ln",
  "sw",
  "kg",
  "lu",
  "pt",
  "es",
  "ar",
  "de",
  "it",
  "zh",
  "wo",
  "yo",
  "ha",
  "am",
  "rw",
  "rn",
  "mg",
  "ff",
  "ig",
  "zu",
  "nl",
  "ru",
];
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

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
  const languages = KNOWN_LANGUAGES.filter((code) =>
    folded.includes(` ${normalize(languageName(code))} `),
  );
  const email = text.match(EMAIL)?.[0] ?? null;
  return {
    experiences: [],
    educations: [],
    skills: found.slice(0, 40),
    languages,
    contact: { ...noContact, email },
  };
}

const SYSTEM = [
  "Tu extrais les informations d'un CV en JSON, pour Jumanly. Tu recopies ce qui est écrit, sans rien inventer ni reformuler.",
  "Dates au format AAAA-MM (null si absente). Une ligne par réalisation dans « description ».",
  "Langues : codes ISO 639-1 (fr, en, ln, sw…). Coordonnées : nom, e-mail et ville seulement (null si absents).",
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
    languages: [...new Set(extraction.languages.map((code) => code.trim().toLowerCase()))]
      .filter((code) => /^[a-z]{2,3}$/.test(code))
      .slice(0, 12),
    contact: {
      name: extraction.contact.name?.trim().slice(0, 120) || null,
      email: extraction.contact.email?.match(EMAIL)?.[0] ?? null,
      city: extraction.contact.city?.trim().slice(0, 80) || null,
    },
  };
}

/** The file the text was read from (« Importer un CV »), shown while the talent checks the items. */
export const importFileSchema = z.object({
  name: z.string().max(200),
  kind: z.enum(["pdf", "docx", "image"]),
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
  return keep(db, userId, payload);
}

async function keep(db: PrismaClient, userId: string, payload: ImportPayload) {
  await db.aiSuggestion.deleteMany({ where: { userId, feature: "cv_parse", status: "pending" } });
  return db.aiSuggestion.create({
    data: { userId, feature: "cv_parse", payload: payload as unknown as Prisma.InputJsonValue },
  });
}

export type PhotoImportResult =
  { ok: true; id: string } | { ok: false; error: "ai" | AiError["code"] };

/**
 * « Photographier un CV papier »: only the model can read a picture, so Orbi must be ready
 * (consent, right, credits: checked by `runAi`, logged in AiUsage). The picture is never kept.
 */
export async function importCvPhoto(
  db: PrismaClient,
  userId: string,
  image: AiImage,
  file: ImportFile,
): Promise<PhotoImportResult> {
  if ((await aiReadiness(db, userId, "cv_parse")) !== "ready") return { ok: false, error: "ai" };
  const empty: Extraction = {
    experiences: [],
    educations: [],
    skills: [],
    languages: [],
    contact: noContact,
  };
  try {
    const run = await runAi(db, {
      userId,
      feature: "cv_parse",
      system: SYSTEM,
      prompt: "Voici la photo d'un CV papier. Recopie ce qu'il contient.",
      schema: extractionSchema,
      template: () => empty,
      image,
    });
    const kept = await keep(db, userId, {
      ...clean(run.output),
      source: "ai",
      file: { ...file, name: file.name.slice(0, 200) },
    });
    return { ok: true, id: kept.id };
  } catch (error) {
    if (error instanceof AiError) return { ok: false, error: error.code };
    throw error;
  }
}

/** Imports kept before languages and contact were read have neither: both start empty. */
const storedImportSchema = extractionSchema.extend({
  languages: z.array(z.string()).default([]),
  contact: extractionSchema.shape.contact.default(noContact),
  source: z.enum(["ai", "rules"]),
  file: importFileSchema.optional(),
});

export function parseImport(value: Prisma.JsonValue): ImportPayload | null {
  const parsed = storedImportSchema.safeParse(value);
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
  chosen: {
    experiences: number[];
    educations: number[];
    skills: number[];
    /** « Langues »: the languages not yet in the profile are added. */
    languages?: boolean;
    /** « Coordonnées »: the city fills the profile only when it has none. */
    contact?: boolean;
  },
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
  if (chosen.languages && payload.languages.length > 0) {
    const before = parseProfileLanguages(profile.languages);
    const known = new Set(before.map((item) => item.code));
    const fresh = payload.languages
      .filter((code) => !known.has(code))
      .map((code) => ({ code, level: "professional" as const }));
    if (fresh.length > 0) {
      await db.talentProfile.update({
        where: { id: profile.id },
        data: { languages: [...before, ...fresh].slice(0, 12) },
      });
      added += fresh.length;
    }
  }
  if (chosen.contact && payload.contact.city) {
    const updated = await db.user.updateMany({
      where: { id: userId, OR: [{ city: null }, { city: "" }] },
      data: { city: payload.contact.city },
    });
    added += updated.count;
  }
  await db.aiSuggestion.update({ where: { id: suggestion.id }, data: { status: "applied" } });
  await refreshCompleteness(db, profile.id);
  return added;
}
