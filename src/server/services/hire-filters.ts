/**
 * Filters of the pipeline (« JUMANLY Hire, logique du recrutement », les filtres de l'ATS): they
 * combine and are saved per offer, for the whole team. A filter hides nobody for good: « Tout
 * afficher » brings everyone back, and the class bar always counts every candidate. Never on a
 * protected datum (golden rule n° 4): no age, gender, photo, origin, nationality or family.
 */
import { z } from "zod";
import type { ConfidenceLevel } from "./hire-scores";

export const filterStates = ["retenus", "attente", "nouveaux"] as const;
export const filterSources = ["direct", "invitation", "talent_search"] as const;
export const filterConfidences = ["medium", "high"] as const;

export const pipelineFiltersSchema = z.object({
  scoreMin: z.number().int().min(0).max(100).optional(),
  skill: z.string().trim().max(60).optional(),
  yearsMin: z.number().int().min(0).max(40).optional(),
  place: z.string().trim().max(60).optional(),
  complete: z.boolean().optional(),
  confidence: z.enum(filterConfidences).optional(),
  source: z.enum(filterSources).optional(),
  state: z.enum(filterStates).optional(),
  /** Applications received in the last N days. */
  days: z.number().int().min(1).max(365).optional(),
});
export type PipelineFilters = z.infer<typeof pipelineFiltersSchema>;

/** The saved filters of an offer; anything unreadable is dropped. */
export function parseFilters(value: unknown): PipelineFilters {
  const parsed = pipelineFiltersSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : {};
}

/**
 * What the plan opens (entitlement `hire.ats.filters`, « Filtres simples » without a plan): the
 * state, the date, the source and complete files; the filters that read Orbi's analysis (score,
 * skill, experience, place, confidence) need the level `all`.
 */
export type FiltersLevel = "simple" | "all";
export const simpleFilterKeys = ["state", "days", "source", "complete"] as const;

export const filtersLevelOf = (value: string | null | undefined): FiltersLevel =>
  value === "all" ? "all" : "simple";

/** The filters the level allows; the others are dropped, never applied in secret. */
export function allowedFilters(filters: PipelineFilters, level: FiltersLevel): PipelineFilters {
  if (level === "all") return filters;
  const kept: PipelineFilters = {};
  for (const key of simpleFilterKeys) {
    if (filters[key] !== undefined) Object.assign(kept, { [key]: filters[key] });
  }
  return kept;
}

export const activeFilters = (filters: PipelineFilters) =>
  Object.values(filters).filter((value) => value !== undefined && value !== "" && value !== false)
    .length;

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const rank: Record<ConfidenceLevel, number> = { low: 0, medium: 1, high: 2 };

type Filterable = {
  score: number | null;
  years: number;
  city: string | null;
  country: string | null;
  matched: string[];
  facts: { skill: string }[];
  documents: { received: number; asked: number };
  confidence: { after: { level: ConfidenceLevel } };
  source: string;
  shortlisted: boolean;
  onHold: boolean;
  createdAt: Date;
};

/** Does one candidate pass every filter? */
export function passes(row: Filterable, filters: PipelineFilters, now = new Date()) {
  if (filters.scoreMin !== undefined && (row.score ?? -1) < filters.scoreMin) return false;
  if (filters.yearsMin !== undefined && row.years < filters.yearsMin) return false;
  if (filters.skill) {
    const wanted = fold(filters.skill);
    const skills = [...row.matched, ...row.facts.map((fact) => fact.skill)].map(fold);
    if (!skills.some((skill) => skill.includes(wanted))) return false;
  }
  if (filters.place) {
    const wanted = fold(filters.place);
    if (![row.city, row.country].some((value) => value && fold(value).includes(wanted)))
      return false;
  }
  if (filters.complete && row.documents.received < row.documents.asked) return false;
  if (filters.confidence && rank[row.confidence.after.level] < rank[filters.confidence])
    return false;
  if (filters.source && row.source !== filters.source) return false;
  if (filters.state === "retenus" && !row.shortlisted) return false;
  if (filters.state === "attente" && !row.onHold) return false;
  if (filters.state === "nouveaux" && (row.shortlisted || row.onHold)) return false;
  if (filters.days && now.getTime() - row.createdAt.getTime() > filters.days * 86_400_000)
    return false;
  return true;
}

/** « Candidat 3 »: the name shown in blind sorting, by the rank in the list. */
export const blindName = (index: number) => index + 1;
