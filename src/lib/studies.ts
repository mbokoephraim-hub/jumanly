/**
 * Studies asked at the first connection (planche talent-4 § 1, step 2 of 4): the level, then the
 * field. Stored as keys in `TalentProfile.studyLevel` and `studyField`; their texts are
 * `access.onboarding.studies.level.*` and `access.onboarding.studies.field.*`.
 */
export const studyLevels = ["secondary", "bac2", "licence", "master", "other"] as const;
export type StudyLevel = (typeof studyLevels)[number];

/** The six fields shown first (planche), then the others, found by the search. */
export const featuredStudyFields = [
  "data",
  "finance",
  "marketing",
  "it",
  "energy",
  "health",
] as const;

export const studyFields = [
  ...featuredStudyFields,
  "agriculture",
  "architecture",
  "arts",
  "commerce",
  "communication",
  "law",
  "economics",
  "education",
  "engineering",
  "environment",
  "hospitality",
  "hr",
  "languages",
  "logistics",
  "management",
  "mining",
  "sciences",
  "socialSciences",
  "telecoms",
  "transport",
] as const;
export type StudyField = (typeof studyFields)[number];
