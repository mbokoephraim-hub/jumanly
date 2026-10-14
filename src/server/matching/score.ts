/**
 * Deterministic compatibility score (partie 08 § 8.3 and § 8.8). Pure functions: the same profile,
 * job and weights always give the same score. The language model never sets the score.
 */
import type { MatchBand } from "@/components/ui/badge";
import { sameCity } from "./geo";
import {
  EXCLUDED_ATTRIBUTES,
  type CriterionKey,
  type CriterionResult,
  type MatchExplanation,
  type NormalizedJob,
  type NormalizedProfile,
  type SkillEvidence,
  type Weights,
} from "./types";

export const DEFAULT_WEIGHTS: Weights = {
  version: "2026-10-v1",
  values: {
    skills_required: 35,
    skills_preferred: 10,
    experience: 15,
    education: 10,
    languages: 10,
    location: 10,
    contract: 5,
    semantic: 5,
  },
};

export function bandFor(score: number): MatchBand {
  if (score >= 85) return "veryHigh";
  if (score >= 70) return "high";
  if (score >= 50) return "partial";
  return "low";
}

const round2 = (value: number) => Math.round(value * 100) / 100;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const fold = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/** Missing information is worth 0.5 and is not a failure (§ 8.3). */
const UNKNOWN = 0.5;

type JobSkill = NormalizedJob["skills"][number];

/** Coverage of one skill required by the job (§ 8.3, « Couverture d'une compétence »). */
export function skillCoverage(profile: NormalizedProfile, jobSkill: JobSkill): SkillEvidence {
  const own = profile.skills.find((skill) => skill.skillId === jobSkill.skillId);
  const base = { skillId: jobSkill.skillId, skill: jobSkill.name, required: jobSkill.minLevel };
  if (own) {
    const coverage =
      own.level >= jobSkill.minLevel
        ? own.verified
          ? 1
          : 0.9
        : (0.9 * own.level) / Math.max(1, jobSkill.minLevel);
    return {
      ...base,
      talent: own.level,
      verified: own.verified,
      source: own.source,
      coverage: round2(coverage),
    };
  }
  const names = new Set([jobSkill.name, ...jobSkill.aliases].map(fold));
  const close = profile.skills.find(
    (skill) => names.has(fold(skill.name)) || skill.aliases.some((alias) => names.has(fold(alias))),
  );
  if (close) {
    return {
      ...base,
      talent: close.level,
      verified: close.verified,
      source: close.source,
      coverage: 0.6,
    };
  }
  return { ...base, talent: null, verified: false, source: "none", coverage: 0 };
}

function skillsCriterion(
  key: "skills_required" | "skills_preferred",
  profile: NormalizedProfile,
  skills: JobSkill[],
  weight: number,
): CriterionResult {
  if (skills.length === 0) return { key, weight, value: 0, status: "not_applicable" };
  if (profile.skills.length === 0) {
    return {
      key,
      weight,
      value: UNKNOWN,
      status: "unknown",
      tip: { type: "complete_profile", section: "skills" },
    };
  }
  const evidence = skills.map((skill) => skillCoverage(profile, skill));
  const totalWeight = skills.reduce((sum, skill) => sum + Math.max(1, skill.weight), 0);
  const value = round2(
    skills.reduce(
      (sum, skill, index) => sum + Math.max(1, skill.weight) * evidence[index]!.coverage,
      0,
    ) / totalWeight,
  );
  const status = evidence.every((item) => item.coverage >= 0.9)
    ? "met"
    : evidence.every((item) => item.coverage === 0)
      ? "unmet"
      : "partial";
  const gap = evidence.find((item) => item.coverage === 0);
  return {
    key,
    weight,
    value,
    status,
    evidence,
    ...(gap ? { tip: { type: "course" as const, skillId: gap.skillId } } : {}),
  };
}

const keywordsOf = (value: string) =>
  fold(value)
    .split(/[^a-z0-9+#]+/)
    .filter((word) => word.length >= 4);

/** An experience counts when its title or description shares a word with the job or its skills. */
export function relevantMonths(profile: NormalizedProfile, job: NormalizedJob) {
  const wanted = new Set([
    ...keywordsOf(job.title),
    ...job.skills.flatMap((skill) => [skill.name, ...skill.aliases].map(fold)),
  ]);
  return profile.experiences
    .filter((experience) => {
      const text = fold(`${experience.title} ${experience.description}`);
      return [...wanted].some((word) => text.includes(word));
    })
    .reduce((sum, experience) => sum + experience.months, 0);
}

function experienceCriterion(
  profile: NormalizedProfile,
  job: NormalizedJob,
  weight: number,
): CriterionResult {
  const key = "experience";
  if (job.experienceMin <= 0) return { key, weight, value: 1, status: "met", facts: { min: 0 } };
  if (profile.experiences.length === 0) {
    return {
      key,
      weight,
      value: UNKNOWN,
      status: "unknown",
      facts: { min: job.experienceMin },
      tip: { type: "complete_profile", section: "experiences" },
    };
  }
  const years = Math.round((relevantMonths(profile, job) / 12) * 10) / 10;
  const value = round2(clamp(years / job.experienceMin));
  return {
    key,
    weight,
    value,
    status: value >= 1 ? "met" : value === 0 ? "unmet" : "partial",
    facts: { years, min: job.experienceMin },
  };
}

function educationCriterion(
  profile: NormalizedProfile,
  job: NormalizedJob,
  weight: number,
): CriterionResult {
  const key = "education";
  if (job.educationRank === null || job.educationRank <= 0) {
    return { key, weight, value: 1, status: "met", facts: { required: null } };
  }
  if (profile.educationRank === null) {
    return {
      key,
      weight,
      value: UNKNOWN,
      status: "unknown",
      facts: { required: job.educationRank },
      tip: { type: "complete_profile", section: "educations" },
    };
  }
  const gap = profile.educationRank - job.educationRank;
  const base = gap >= 0 ? 1 : gap === -1 ? 0.6 : 0.3;
  const certified = job.skills.some((skill) => profile.certifiedSkillIds.includes(skill.skillId));
  const value = round2(clamp(base + (certified ? 0.2 : 0)));
  return {
    key,
    weight,
    value,
    status: value >= 1 ? "met" : "partial",
    facts: { required: job.educationRank, talent: profile.educationRank, certificate: certified },
  };
}

function languagesCriterion(
  profile: NormalizedProfile,
  job: NormalizedJob,
  weight: number,
): CriterionResult {
  const key = "languages";
  if (job.languages.length === 0) return { key, weight, value: 0, status: "not_applicable" };
  if (profile.languages.length === 0) {
    return {
      key,
      weight,
      value: UNKNOWN,
      status: "unknown",
      tip: { type: "complete_profile", section: "languages" },
    };
  }
  const values = job.languages.map((language) => {
    const own = profile.languages.find((item) => item.code === language.code);
    return clamp((own?.rank ?? 0) / Math.max(1, language.rank));
  });
  const value = round2(values.reduce((sum, item) => sum + item, 0) / values.length);
  return {
    key,
    weight,
    value,
    status: value >= 1 ? "met" : value === 0 ? "unmet" : "partial",
    facts: Object.fromEntries(
      job.languages.map((language) => [
        language.code,
        profile.languages.find((item) => item.code === language.code)?.rank ?? 0,
      ]),
    ),
  };
}

function locationCriterion(
  profile: NormalizedProfile,
  job: NormalizedJob,
  weight: number,
): CriterionResult {
  const key = "location";
  const facts = { city: job.city, remote: job.remote };
  if (job.remote === "remote") return { key, weight, value: 1, status: "met", facts };
  if (!profile.city && !profile.country) {
    return {
      key,
      weight,
      value: UNKNOWN,
      status: "unknown",
      facts,
      tip: { type: "complete_profile", section: "identity" },
    };
  }
  const sameCountry = Boolean(profile.country && profile.country === job.country);
  if (sameCity(profile.city, job.city) && (sameCountry || !profile.country)) {
    return { key, weight, value: 1, status: "met", facts };
  }
  if (sameCountry && profile.relocation)
    return { key, weight, value: 0.7, status: "partial", facts };
  return { key, weight, value: 0.3, status: "unmet", facts };
}

/** Job contract types (enum) and the talent's preferences (`talent.profile.preferences.contract`). */
const contractPreference: Record<string, string[]> = {
  cdi: ["cdi"],
  cdd: ["cdd"],
  stage: ["internship"],
  mission: ["cdd", "freelance"],
  freelance: ["freelance"],
  alternance: ["apprenticeship"],
  volontariat: ["volunteer"],
};

const AVAILABILITY_WINDOW_DAYS = 90;

function contractCriterion(
  profile: NormalizedProfile,
  job: NormalizedJob,
  weight: number,
  now: Date,
): CriterionResult {
  const key = "contract";
  if (profile.desiredContracts.length === 0) {
    return {
      key,
      weight,
      value: UNKNOWN,
      status: "unknown",
      tip: { type: "complete_profile", section: "preferences" },
    };
  }
  const wanted = (contractPreference[job.contractType] ?? []).some((value) =>
    profile.desiredContracts.includes(value),
  );
  const limit = job.startBy ?? new Date(now.getTime() + AVAILABILITY_WINDOW_DAYS * 86_400_000);
  const available =
    profile.availability !== "not_looking" &&
    (!profile.availableFrom || profile.availableFrom.getTime() <= limit.getTime());
  const value = (wanted ? 0.5 : 0) + (available ? 0.5 : 0);
  return {
    key,
    weight,
    value,
    status: value === 1 ? "met" : value === 0 ? "unmet" : "partial",
    facts: { contract: wanted, available },
  };
}

export function cosine(a: number[], b: number[]) {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}

function semanticCriterion(
  profile: NormalizedProfile,
  job: NormalizedJob,
  weight: number,
): CriterionResult {
  const key = "semantic";
  // Without embeddings (service not configured, nothing computed yet), the criterion is left out.
  if (!profile.embedding || !job.embedding)
    return { key, weight, value: 0, status: "not_applicable" };
  const similarity = cosine(profile.embedding, job.embedding);
  const value = round2(clamp((similarity - 0.2) / 0.6));
  return {
    key,
    weight,
    value,
    status: value >= 0.8 ? "met" : value === 0 ? "unmet" : "partial",
    facts: { similarity: round2(similarity) },
  };
}

/** score = round(100 × Σ weight × value / Σ weight), on applicable criteria only (§ 8.3). */
export function scoreFromCriteria(
  criteria: Pick<CriterionResult, "weight" | "value" | "status">[],
) {
  const applicable = criteria.filter((item) => item.status !== "not_applicable" && item.weight > 0);
  const total = applicable.reduce((sum, item) => sum + item.weight, 0);
  if (total === 0) return 0;
  return Math.round(
    (100 * applicable.reduce((sum, item) => sum + item.weight * item.value, 0)) / total,
  );
}

export function scoreMatch(
  profile: NormalizedProfile,
  job: NormalizedJob,
  weights: Weights,
  options: { now?: Date; coursesBySkill?: Record<string, string[]> } = {},
): MatchExplanation {
  const now = options.now ?? new Date();
  const w = (key: CriterionKey) => Math.max(0, weights.values[key] ?? 0);
  const required = job.skills.filter((skill) => skill.importance === "required");
  const preferred = job.skills.filter((skill) => skill.importance === "preferred");
  const criteria = [
    skillsCriterion("skills_required", profile, required, w("skills_required")),
    skillsCriterion("skills_preferred", profile, preferred, w("skills_preferred")),
    experienceCriterion(profile, job, w("experience")),
    educationCriterion(profile, job, w("education")),
    languagesCriterion(profile, job, w("languages")),
    locationCriterion(profile, job, w("location")),
    contractCriterion(profile, job, w("contract"), now),
    semanticCriterion(profile, job, w("semantic")),
  ];
  const score = scoreFromCriteria(criteria);
  const missingSkills = job.skills
    .filter((skill) => skillCoverage(profile, skill).coverage === 0)
    .map((skill) => ({
      skillId: skill.skillId,
      skill: skill.name,
      importance: skill.importance,
      courses: options.coursesBySkill?.[skill.skillId] ?? [],
    }));
  return {
    score,
    band: bandFor(score),
    weightsVersion: weights.version,
    computedAt: now.toISOString(),
    criteria,
    missingSkills,
    knockouts: job.knockouts.map((label) => ({ label, met: null })),
    notUsed: EXCLUDED_ATTRIBUTES,
  };
}

/** The profile with one more verified skill: « Votre score passerait à … » after a course. */
export function withSkill(
  profile: NormalizedProfile,
  skill: { skillId: string; name: string; level: number },
): NormalizedProfile {
  return {
    ...profile,
    skills: [
      ...profile.skills.filter((item) => item.skillId !== skill.skillId),
      { ...skill, aliases: [], verified: true, source: "course" },
    ],
    certifiedSkillIds: [...profile.certifiedSkillIds, skill.skillId],
  };
}
