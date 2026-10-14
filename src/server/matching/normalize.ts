/**
 * From the database to the matching inputs (partie 08 § 8.8). The profile is read with a closed
 * list of fields: the name, photo, birth date, nationality or precise address are never selected,
 * so they cannot reach the calculation (counterfactual test in tests/db/matching.test.ts).
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { parseCriteria, parseLanguages } from "@/server/services/jobs";
import { countryCode } from "./geo";
import type { NormalizedJob, NormalizedProfile } from "./types";

export const educationRanks: Record<string, number> = {
  none: 0,
  secondary: 1,
  vocational: 2,
  bachelor: 3,
  master: 4,
  doctorate: 5,
};

const cefrRank: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
/** Self-assessed levels of the profile, when no CEFR level is given. */
const levelRank: Record<string, number> = {
  native: 6,
  fluent: 5,
  professional: 4,
  intermediate: 3,
  basic: 2,
};

export function languageRank(value: { level?: string; cefr?: string }) {
  return (
    cefrRank[value.cefr ?? ""] ?? levelRank[value.level ?? ""] ?? cefrRank[value.level ?? ""] ?? 0
  );
}

/** The only profile fields the calculation may read. */
export const profileSelect = {
  id: true,
  headline: true,
  summary: true,
  targetJob: true,
  desiredJobTitles: true,
  desiredContracts: true,
  relocation: true,
  availability: true,
  availableFrom: true,
  languages: true,
  matchingEnabled: true,
  user: { select: { city: true, country: true } },
  skills: {
    select: {
      skillId: true,
      level: true,
      verified: true,
      source: true,
      proof: true,
      proofUrl: true,
      skill: { select: { name: true, aliases: true } },
    },
  },
  experiences: { select: { title: true, description: true, startDate: true, endDate: true } },
  educations: { select: { level: true } },
} satisfies Prisma.TalentProfileSelect;

export type ProfileRow = Prisma.TalentProfileGetPayload<{ select: typeof profileSelect }>;

const months = (start: Date, end: Date) =>
  Math.max(
    0,
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth(),
  );

export function normalizeProfile(
  row: ProfileRow,
  now = new Date(),
  embedding: number[] | null = null,
): NormalizedProfile {
  const languages = Array.isArray(row.languages)
    ? (row.languages as { code?: string; level?: string; cefr?: string }[])
    : [];
  const certificateOf = (proofUrl: string | null) =>
    proofUrl?.match(/\/attestations\/(JMN-[A-Z0-9-]+)/)?.[1];
  return {
    profileId: row.id,
    skills: row.skills.map((item) => ({
      skillId: item.skillId,
      name: item.skill.name,
      aliases: item.skill.aliases,
      level: item.level,
      verified: item.verified,
      source: certificateOf(item.proofUrl)
        ? `certificate:${certificateOf(item.proofUrl)}`
        : item.source,
    })),
    experiences: row.experiences.map((experience) => ({
      title: experience.title,
      description: experience.description,
      months: months(experience.startDate, experience.endDate ?? now),
    })),
    educationRank:
      row.educations.length === 0
        ? null
        : Math.max(...row.educations.map((item) => educationRanks[item.level] ?? 0)),
    certifiedSkillIds: row.skills
      .filter((item) => item.verified && (item.proof === "certificate" || item.source === "course"))
      .map((item) => item.skillId),
    languages: languages
      .filter((item) => typeof item.code === "string")
      .map((item) => ({ code: item.code!, rank: languageRank(item) })),
    city: row.user.city?.trim() || null,
    country: countryCode(row.user.country),
    relocation: row.relocation,
    desiredContracts: row.desiredContracts,
    availability: row.availability,
    availableFrom: row.availableFrom,
    embedding,
  };
}

/** Text of the profile for the semantic criterion: professional content only. */
export function profileText(row: ProfileRow) {
  return [
    row.headline,
    row.targetJob,
    row.desiredJobTitles.join(", "),
    row.summary,
    row.skills.map((item) => item.skill.name).join(", "),
    row.experiences
      .map((experience) => `${experience.title}. ${experience.description}`)
      .join("\n"),
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 8000);
}

export const jobSelect = {
  id: true,
  title: true,
  description: true,
  requirements: true,
  responsibilities: true,
  experienceMin: true,
  educationLevelMin: true,
  languagesRequired: true,
  knockoutCriteria: true,
  city: true,
  country: true,
  remote: true,
  contractType: true,
  closesAt: true,
  updatedAt: true,
  skills: {
    select: {
      skillId: true,
      importance: true,
      weight: true,
      minLevel: true,
      skill: { select: { name: true, aliases: true } },
    },
  },
} satisfies Prisma.JobSelect;

export type JobRow = Prisma.JobGetPayload<{ select: typeof jobSelect }>;

export function normalizeJob(row: JobRow, embedding: number[] | null = null): NormalizedJob {
  return {
    jobId: row.id,
    title: row.title,
    skills: row.skills.map((item) => ({
      skillId: item.skillId,
      name: item.skill.name,
      aliases: item.skill.aliases,
      importance: item.importance,
      weight: item.weight,
      minLevel: item.minLevel,
    })),
    experienceMin: row.experienceMin,
    educationRank: row.educationLevelMin ? (educationRanks[row.educationLevelMin] ?? null) : null,
    languages: parseLanguages(row.languagesRequired).map((item) => ({
      code: item.code,
      rank: languageRank({ cefr: item.level }),
      label: item.level,
    })),
    city: row.city,
    country: countryCode(row.country) ?? row.country,
    remote: row.remote,
    contractType: row.contractType,
    startBy: row.closesAt,
    knockouts: parseCriteria(row.knockoutCriteria),
    embedding,
  };
}

export function jobText(row: JobRow) {
  return [
    row.title,
    row.description,
    row.responsibilities.join("\n"),
    row.requirements.join("\n"),
    row.skills.map((item) => item.skill.name).join(", "),
  ]
    .join("\n")
    .slice(0, 8000);
}

export type { PrismaClient };
