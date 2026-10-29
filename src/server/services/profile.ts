/**
 * Talent profile (docs/specifications.md, partie 04 § 4.2; textes, partie 03 `talent.profile.*`):
 * section rules, completeness and the data the CV, the applications and later the matching use.
 */
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { referenceCheckSelect } from "./reference-check";

export const PROFILE_SUMMARY_MAX = 1000;
export const PROFILE_SKILLS_MAX = 40;

export const languageLevels = [
  "native",
  "fluent",
  "professional",
  "intermediate",
  "basic",
] as const;
export const cefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const contractPreferences = [
  "cdi",
  "cdd",
  "internship",
  "freelance",
  "apprenticeship",
  "volunteer",
  "partTime",
] as const;
export const skillLevels = [1, 2, 3, 4] as const;
/** Text keys under `talent.profile.skills.level`. */
export const skillLevelKeys = {
  1: "beginner",
  2: "intermediate",
  3: "advanced",
  4: "expert",
} as const;
export const skillProofs = ["certificate", "experience", "project", "link"] as const;

export type ProfileLanguage = {
  code: string;
  level: (typeof languageLevels)[number];
  cefr?: string;
};

export function parseProfileLanguages(value: Prisma.JsonValue): ProfileLanguage[] {
  const schema = z.array(
    z.object({
      code: z.string(),
      level: z.enum(languageLevels),
      cefr: z.string().optional(),
    }),
  );
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

/** Sections that count towards completeness, with their weight (total 100). */
export const completenessSections = [
  { key: "identity", weight: 15 },
  { key: "summary", weight: 15 },
  { key: "experience", weight: 20 },
  { key: "education", weight: 15 },
  { key: "skills", weight: 20 },
  { key: "languages", weight: 10 },
  { key: "preferences", weight: 5 },
] as const;

export type CompletenessSection = (typeof completenessSections)[number]["key"];

export type ProfileForCompleteness = {
  headline: string | null;
  summary: string | null;
  desiredContracts: string[];
  desiredJobTitles: string[];
  languages: Prisma.JsonValue;
  user: { city: string | null; country: string | null };
  _count: { experiences: number; educations: number; skills: number };
};

/** Which sections are filled. Three skills at least, as the texts ask. */
export function completeness(profile: ProfileForCompleteness): {
  percent: number;
  missing: CompletenessSection[];
} {
  const filled: Record<CompletenessSection, boolean> = {
    identity: Boolean(profile.headline?.trim() && profile.user.city && profile.user.country),
    summary: (profile.summary?.trim().length ?? 0) >= 50,
    experience: profile._count.experiences > 0,
    education: profile._count.educations > 0,
    skills: profile._count.skills >= 3,
    languages: parseProfileLanguages(profile.languages).length > 0,
    preferences: profile.desiredContracts.length > 0 || profile.desiredJobTitles.length > 0,
  };
  let percent = 0;
  const missing: CompletenessSection[] = [];
  for (const section of completenessSections) {
    if (filled[section.key]) percent += section.weight;
    else missing.push(section.key);
  }
  return { percent, missing };
}

const completenessInclude = {
  user: { select: { city: true, country: true } },
  _count: { select: { experiences: true, educations: true, skills: true } },
} satisfies Prisma.TalentProfileInclude;

/** Recomputes and stores the completeness after a change. */
export async function refreshCompleteness(db: PrismaClient, profileId: string) {
  const profile = await db.talentProfile.findUniqueOrThrow({
    where: { id: profileId },
    include: completenessInclude,
  });
  const { percent } = completeness(profile);
  if (percent !== profile.completeness) {
    await db.talentProfile.update({ where: { id: profileId }, data: { completeness: percent } });
  }
  return percent;
}

/** The person's profile, created on first use. */
export async function ensureProfile(db: PrismaClient, userId: string) {
  return db.talentProfile.upsert({ where: { userId }, update: {}, create: { userId } });
}

/** Everything the profile page, the CV and the recruiter view need. */
export async function getFullProfile(db: PrismaClient, userId: string) {
  await ensureProfile(db, userId);
  return db.talentProfile.findUniqueOrThrow({
    where: { userId },
    include: {
      ...completenessInclude,
      user: {
        select: {
          firstName: true,
          lastName: true,
          name: true,
          email: true,
          city: true,
          country: true,
          image: true,
        },
      },
      experiences: {
        orderBy: [{ endDate: { sort: "desc", nulls: "first" } }, { startDate: "desc" }],
        include: { referenceChecks: referenceCheckSelect },
      },
      educations: {
        orderBy: [{ endYear: { sort: "desc", nulls: "first" } }, { startYear: "desc" }],
        include: { referenceChecks: referenceCheckSelect },
      },
      skills: {
        include: { skill: { select: { name: true, slug: true } } },
        orderBy: [{ level: "desc" }],
      },
    },
  });
}

export type FullProfile = Awaited<ReturnType<typeof getFullProfile>>;

// ─── Section forms (validated on the server, partie 03 rule: validate first) ─────────

const line = (max: number) => z.string().trim().max(max);
const requiredLine = (max: number) => z.string().trim().min(1, "required").max(max);
/** `<input type="month">` value: "2024-03". */
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "required");

/** « Modifier le profil » (planche talent-4): title, summary, country and city. */
export const headSchema = z.object({
  headline: line(120),
  summary: line(PROFILE_SUMMARY_MAX),
  country: z.string().trim().length(2, "required"),
  city: requiredLine(120),
});

export const experienceSchema = z
  .object({
    title: requiredLine(120),
    company: requiredLine(120),
    type: z.enum(["job", "internship", "freelance", "volunteer", "entrepreneur"]),
    location: line(120),
    start: month,
    end: z.union([month, z.literal("")]).optional(),
    current: z.literal("on").optional(),
    description: line(3000),
  })
  .superRefine((value, ctx) => {
    if (!value.current && !value.end) {
      ctx.addIssue({ code: "custom", path: ["end"], message: "required" });
    }
    if (!value.current && value.end && value.end < value.start) {
      ctx.addIssue({ code: "custom", path: ["end"], message: "endBeforeStart" });
    }
  });

export function monthToDate(value: string): Date {
  return new Date(`${value}-01T00:00:00Z`);
}

export function dateToMonth(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 7) : "";
}

const year = z.coerce.number().int().min(1950).max(2100);

export const educationSchema = z
  .object({
    degree: requiredLine(160),
    level: z.enum(["none", "secondary", "vocational", "bachelor", "master", "doctorate"]),
    field: line(120),
    school: requiredLine(160),
    startYear: z.union([year, z.literal("")]).optional(),
    endYear: z.union([year, z.literal("")]).optional(),
    inProgress: z.literal("on").optional(),
  })
  .superRefine((value, ctx) => {
    if (
      !value.inProgress &&
      typeof value.startYear === "number" &&
      typeof value.endYear === "number" &&
      value.endYear < value.startYear
    ) {
      ctx.addIssue({ code: "custom", path: ["endYear"], message: "endBeforeStart" });
    }
  });

export const skillSchema = z.object({
  skill: requiredLine(80),
  level: z.coerce.number().int().min(1).max(4),
  proof: z
    .enum(skillProofs)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  proofUrl: z.union([z.url().max(300), z.literal("")]).optional(),
});

export const languageSchema = z.object({
  code: z.string().regex(/^[a-z]{2,3}$/, "required"),
  level: z.enum(languageLevels),
  cefr: z.union([z.enum(cefrLevels), z.literal("")]).optional(),
});

/** « Ce que je cherche » (planche talent-4): what the lists and switches do not carry. */
export const searchSchema = z.object({
  newJob: line(300).default(""),
  newPlace: line(300).default(""),
  available: z.literal("on").optional(),
  salaryMin: z.union([z.coerce.number().int().min(0).max(10_000_000), z.literal("")]).optional(),
});

/** "a, b , c" → ["a", "b", "c"], without duplicates or empty items. */
export function splitList(value: string, max = 10): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ].slice(0, max);
}

/** Finds a skill of the reference list by name, slug or alias (accents and case ignored). */
export async function findSkill(db: PrismaClient, name: string) {
  const wanted = normalize(name);
  const candidates = await db.skill.findMany({
    where: {
      OR: [
        { name: { equals: name.trim(), mode: "insensitive" } },
        { aliases: { has: name.trim() } },
        { name: { contains: name.trim().slice(0, 3), mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, aliases: true },
    take: 200,
  });
  return (
    candidates.find(
      (skill) =>
        normalize(skill.name) === wanted ||
        skill.aliases.some((alias) => normalize(alias) === wanted),
    ) ?? null
  );
}

/** Category of the skills typed by talents when the reference list has none that fits. */
export const CUSTOM_SKILL_CATEGORY = "custom";

/**
 * The skill of the reference list with this name, or a new one typed by the person (category
 * `custom`): reused by the next person who types the same name, kept out of the suggestions.
 */
export async function findOrCreateSkill(db: PrismaClient, raw: string) {
  const name = raw.replace(/\s+/g, " ").trim().slice(0, 80);
  if (name.length < 2) return null;
  const known = await findSkill(db, name);
  if (known) return known;
  const base =
    name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "competence";
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? `perso-${base}` : `perso-${base}-${attempt + 1}`;
    const taken = await db.skill.findUnique({ where: { slug }, select: { id: true } });
    if (taken) continue;
    return db.skill.create({
      data: { name, slug, category: CUSTOM_SKILL_CATEGORY, aliases: [] },
      select: { id: true, name: true, aliases: true },
    });
  }
  return null;
}

export function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}
