/**
 * Matching types (partie 08). A normalized profile only holds what the calculation may read:
 * never name, gender, age, photo, nationality, religion, family situation, health or address.
 */
import type { MatchBand } from "@/components/ui/badge";

export const criterionKeys = [
  "skills_required",
  "skills_preferred",
  "experience",
  "education",
  "languages",
  "location",
  "contract",
  "semantic",
] as const;
export type CriterionKey = (typeof criterionKeys)[number];

export type Weights = { version: string; values: Record<CriterionKey, number> };

export const EXCLUDED_ATTRIBUTES = [
  "name",
  "gender",
  "age",
  "photo",
  "nationality",
  "religion",
  "marital_status",
  "health",
  "address",
] as const;

export type NormalizedSkill = {
  skillId: string;
  name: string;
  aliases: string[];
  level: number;
  verified: boolean;
  /** "declared", "course", "certificate:JMN-…" */
  source: string;
};

export type NormalizedProfile = {
  profileId: string;
  skills: NormalizedSkill[];
  experiences: { title: string; description: string; months: number }[];
  /** Highest education level rank (0 none … 5 doctorate), null when nothing is entered. */
  educationRank: number | null;
  /** Skill ids proven by a Jumanly attestation. */
  certifiedSkillIds: string[];
  /** [{ code: "fr", rank: 1..6 }] (CEFR A1 = 1 … C2 = 6). */
  languages: { code: string; rank: number }[];
  city: string | null;
  /** ISO code. */
  country: string | null;
  relocation: boolean;
  desiredContracts: string[];
  availability: "open" | "listening" | "not_looking";
  availableFrom: Date | null;
  embedding: number[] | null;
};

export type NormalizedJob = {
  jobId: string;
  title: string;
  skills: {
    skillId: string;
    name: string;
    aliases: string[];
    importance: "required" | "preferred";
    weight: number;
    minLevel: number;
  }[];
  experienceMin: number;
  educationRank: number | null;
  languages: { code: string; rank: number; label: string }[];
  city: string;
  /** ISO code when it could be recognized, else the name as written. */
  country: string;
  remote: "onsite" | "hybrid" | "remote";
  contractType: string;
  /** Latest start considered compatible (closing date or none). */
  startBy: Date | null;
  knockouts: string[];
  embedding: number[] | null;
};

export type CriterionStatus = "met" | "partial" | "unmet" | "unknown" | "not_applicable";

export type SkillEvidence = {
  skillId: string;
  skill: string;
  required: number;
  talent: number | null;
  verified: boolean;
  source: string;
  coverage: number;
};

export type CriterionTip =
  | { type: "course"; skillId: string }
  | {
      type: "complete_profile";
      section: "skills" | "experiences" | "educations" | "languages" | "preferences" | "identity";
    };

export type CriterionResult = {
  key: CriterionKey;
  weight: number;
  value: number;
  status: CriterionStatus;
  evidence?: SkillEvidence[];
  /** Facts the sentence templates use (years, levels, cities…). */
  facts?: Record<string, string | number | boolean | null>;
  tip?: CriterionTip;
};

export type MissingSkill = {
  skillId: string;
  skill: string;
  importance: "required" | "preferred";
  courses: string[];
};

export type MatchExplanation = {
  score: number;
  band: MatchBand;
  weightsVersion: string;
  computedAt: string;
  criteria: CriterionResult[];
  missingSkills: MissingSkill[];
  /** Knockout criteria are free text: they are shown « to verify », never computed or filtered. */
  knockouts: { label: string; met: null }[];
  notUsed: readonly string[];
};
