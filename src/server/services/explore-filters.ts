/**
 * The filters of Explorer (docs/fil-menu-publication § 3): where to look, the contract and the
 * monthly salary of the offers, the sector of the companies, where the people live. Rules:
 * - no filter by gender, age or nationality (règle d'or 4, décision d'Ephraïm du 26/10/2026);
 *   the residence is the country the person entered on their profile, never their nationality;
 * - the filters choose what Explorer shows and never block an application (règle d'or 1);
 * - an offer without a salary never matches a salary range (it does not say it is in it).
 */
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

export const FILTER_SCOPES = ["tout", "offres", "entreprises", "personnes"] as const;
export const FILTER_CONTRACTS = ["cdi", "cdd", "stage"] as const;
export const FILTER_SALARIES = ["lt300", "from300", "from800", "gt1500"] as const;
export const FILTER_SECTORS = [
  "tech",
  "telecom",
  "banque",
  "energie",
  "mines",
  "sante",
  "cabinet",
  "rh",
] as const;
export const FILTER_RESIDENCES = ["rdc", "autre", "partout"] as const;

export type FilterScope = (typeof FILTER_SCOPES)[number];
export type FilterContract = (typeof FILTER_CONTRACTS)[number];
export type FilterSalary = (typeof FILTER_SALARIES)[number];
export type FilterSector = (typeof FILTER_SECTORS)[number];
export type FilterResidence = (typeof FILTER_RESIDENCES)[number];

export const exploreFiltersSchema = z.object({
  scope: z.enum(FILTER_SCOPES).default("tout"),
  contracts: z.array(z.enum(FILTER_CONTRACTS)).max(FILTER_CONTRACTS.length).default([]),
  salary: z.enum(FILTER_SALARIES).nullable().default(null),
  sectors: z.array(z.enum(FILTER_SECTORS)).max(FILTER_SECTORS.length).default([]),
  residence: z.enum(FILTER_RESIDENCES).nullable().default(null),
});

export type ExploreFilters = z.infer<typeof exploreFiltersSchema>;

export const NO_FILTERS: ExploreFilters = {
  scope: "tout",
  contracts: [],
  salary: null,
  sectors: [],
  residence: null,
};

/** The number on the « Filtres » button: each contract and sector, the salary, the residence. */
export function activeFilters(filters: ExploreFilters) {
  return (
    filters.contracts.length +
    (filters.salary ? 1 : 0) +
    filters.sectors.length +
    (filters.residence && filters.residence !== "partout" ? 1 : 0)
  );
}

/** Which sections of Explorer the scope shows. */
export function showsSection(scope: FilterScope, section: "offres" | "entreprises" | "personnes") {
  return scope === "tout" || scope === section;
}

const DOLLAR = 100;

/** A range of monthly salary, in USD cents: from `min` (included) to `max` (excluded, or none). */
export function salaryRange(key: FilterSalary): { min: number; max: number | null } {
  switch (key) {
    case "lt300":
      return { min: 0, max: 300 * DOLLAR };
    case "from300":
      return { min: 300 * DOLLAR, max: 800 * DOLLAR };
    case "from800":
      return { min: 800 * DOLLAR, max: 1500 * DOLLAR };
    case "gt1500":
      return { min: 1500 * DOLLAR, max: null };
  }
}

/**
 * Whether an offer paying from `salaryMin` to `salaryMax` (USD cents a month, either may be
 * missing) meets a range: the two overlap. Without any salary, never.
 */
export function salaryMatches(
  salaryMin: number | null,
  salaryMax: number | null,
  key: FilterSalary,
) {
  const low = salaryMin ?? salaryMax;
  const high = salaryMax ?? salaryMin;
  if (low === null || high === null) return false;
  const range = salaryRange(key);
  return high >= range.min && (range.max === null || low < range.max);
}

/** The same rule for the database. */
export function salaryWhere(key: FilterSalary): Prisma.JobWhereInput {
  const range = salaryRange(key);
  const reachesMin: Prisma.JobWhereInput = {
    OR: [{ salaryMax: { gte: range.min } }, { salaryMax: null, salaryMin: { gte: range.min } }],
  };
  if (range.max === null) return reachesMin;
  const belowMax: Prisma.JobWhereInput = {
    OR: [{ salaryMin: { lt: range.max } }, { salaryMin: null, salaryMax: { lt: range.max } }],
  };
  return { AND: [reachesMin, belowMax] };
}

/** Lower case, without accents: « Énergie » and « energie » are the same word. */
export function plain(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * The words that put a company in a sector. The sector of a company is free text (« Banque et
 * microfinance », « Data et finance »): it belongs to every sector one of whose words it holds.
 */
const SECTOR_WORDS: Record<FilterSector, string[]> = {
  tech: ["tech", "numerique", "informatique", "logiciel", "data", "digital"],
  telecom: ["telecom"],
  banque: ["banque", "bancaire", "finance", "microfinance", "assurance"],
  energie: ["energie", "electricite", "petrole", "solaire"],
  mines: ["mine", "minier", "miniere"],
  sante: ["sante", "medical", "pharma", "hopital", "clinique"],
  cabinet: ["cabinet", "conseil", "audit", "consulting"],
  rh: ["rh", "ressources humaines", "recrutement", "interim"],
};

/** The sectors of the filter a company's sector belongs to. */
export function sectorsOf(sector: string | null) {
  if (!sector) return [];
  const words = plain(sector)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const text = words.join(" ");
  return FILTER_SECTORS.filter((key) =>
    SECTOR_WORDS[key].some((word) =>
      word.includes(" ") ? text.includes(word) : words.some((part) => part.startsWith(word)),
    ),
  );
}

/** Whether a company's sector is one of those chosen (none chosen: every company). */
export function sectorMatches(sector: string | null, chosen: FilterSector[]) {
  if (chosen.length === 0) return true;
  return sectorsOf(sector).some((key) => chosen.includes(key));
}

/** How the RD Congo is written in `User.country` (the code, or its name on older profiles). */
const RDC_NAMES = ["cd", "rdc", "rd congo", "republique democratique du congo", "congo-kinshasa"];

/**
 * Whether a person who lives in `country` meets the residence chosen: « RDC », « Autre pays »
 * (a country is given and it is not the RD Congo) or « Partout ».
 */
export function residenceMatches(country: string | null, residence: FilterResidence | null) {
  if (!residence || residence === "partout") return true;
  const value = country ? plain(country).trim() : "";
  const inRdc = RDC_NAMES.includes(value);
  return residence === "rdc" ? inRdc : value !== "" && !inRdc;
}

/** The same rule for the database. */
export function residenceWhere(residence: FilterResidence | null): Prisma.UserWhereInput {
  if (!residence || residence === "partout") return {};
  const names = RDC_NAMES.map((name) => ({
    country: { equals: name, mode: "insensitive" as const },
  }));
  // « République démocratique du Congo » with its accents, as typed on older profiles.
  names.push({ country: { equals: "République démocratique du Congo", mode: "insensitive" } });
  return residence === "rdc"
    ? { OR: names }
    : { AND: [{ country: { not: null } }, { NOT: [{ country: "" }, ...names] }] };
}
