/** Public job offers (Jobs), read without an account (docs/specifications.md, partie 07 § 1). */
import { z } from "zod";
import type { ContractType, Prisma, PrismaClient, RemoteMode } from "@/generated/prisma/client";
import { countryCode } from "@/server/matching/geo";

export const JOBS_PER_PAGE = 12;

/** Values of the "Type de contrat" filter (texts `jobs.search.contract.*`) and the contracts they cover. */
export const contractFilters = {
  cdi: ["cdi"],
  cdd: ["cdd"],
  internship: ["stage"],
  mission: ["mission", "freelance"],
  alternance: ["alternance"],
  volunteer: ["volontariat"],
} as const satisfies Record<string, readonly ContractType[]>;

export type ContractFilter = keyof typeof contractFilters;

/** Label key of a contract type: the filter that covers it. */
export function contractFilterOf(contract: ContractType): ContractFilter {
  const entry = Object.entries(contractFilters).find(([, values]) =>
    (values as readonly ContractType[]).includes(contract),
  );
  return (entry?.[0] ?? "mission") as ContractFilter;
}

/** Values of the "Télétravail" filter (texts `jobs.search.remote.*`). */
export const remoteFilters = {
  onsite: "onsite",
  hybrid: "hybrid",
  full: "remote",
} as const satisfies Record<string, RemoteMode>;

export type RemoteFilter = keyof typeof remoteFilters;

export function remoteFilterOf(remote: RemoteMode): RemoteFilter {
  return remote === "remote" ? "full" : remote;
}

export const jobSorts = ["recent", "deadline"] as const;

/** "Expérience" filter (texts `talent.jobs.filter.experience.*`): years the offer asks for. */
export const experienceFilters = {
  none: { lte: 0 },
  junior: { lt: 2 },
  mid: { gte: 2, lte: 5 },
  senior: { gt: 5 },
} as const satisfies Record<string, Prisma.IntFilter>;

export type ExperienceFilter = keyof typeof experienceFilters;

/** "Date de publication" filter (texts `talent.jobs.filter.posted.*`), in hours. */
export const postedFilters = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30 } as const;

export type PostedFilter = keyof typeof postedFilters;

/** "Compatibilité minimale" filter of the signed-in search (scores on 100). */
export const compatibilityFilters = [50, 70, 85] as const;

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).optional().catch(undefined);

const text = z.string().trim().max(100).optional().catch(undefined);

/** Query string of /offres. Invalid values are ignored rather than rejected. */
export const jobFiltersSchema = z.object({
  q: text,
  ville: text,
  pays: text,
  contrat: optionalEnum(Object.keys(contractFilters) as [ContractFilter, ...ContractFilter[]]),
  teletravail: optionalEnum(Object.keys(remoteFilters) as [RemoteFilter, ...RemoteFilter[]]),
  tri: optionalEnum(jobSorts),
  experience: optionalEnum(
    Object.keys(experienceFilters) as [ExperienceFilter, ...ExperienceFilter[]],
  ),
  /** "indique": offers that give a salary. */
  salaire: optionalEnum(["indique"]),
  publie: optionalEnum(Object.keys(postedFilters) as [PostedFilter, ...PostedFilter[]]),
  /** "1": verified companies only. */
  verifiees: optionalEnum(["1"]),
  /** "1": the places the talent chose (screen 82), resolved by the page into `places`. */
  lieux: optionalEnum(["1"]),
  page: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
});

/**
 * Where the talent wants to work, as offers write it: each area is one country (its spellings in
 * `Job.country`) and, if they picked some, its cities; `remote` adds the offers fully remote.
 */
export type JobPlaces = { areas: { countries: string[]; cities: string[] }[]; remote: boolean };

export type JobFilters = z.infer<typeof jobFiltersSchema>;

/** The filters of a search, plus the talent's places when « Mes lieux » is on. */
export type JobQuery = JobFilters & { places?: JobPlaces };

export function parseJobFilters(params: Record<string, string | string[] | undefined>): JobFilters {
  const flat = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
  const parsed = jobFiltersSchema.parse(flat);
  return Object.fromEntries(
    Object.entries(parsed).filter(([, v]) => v !== undefined && v !== ""),
  ) as JobFilters;
}

/** Published and still open at `now`. */
export function openJobWhere(now: Date): Prisma.JobWhereInput {
  return { status: "published", OR: [{ closesAt: null }, { closesAt: { gt: now } }] };
}

export function jobWhere(filters: JobQuery, now: Date): Prisma.JobWhereInput {
  const and: Prisma.JobWhereInput[] = [openJobWhere(now)];
  if (filters.q) {
    and.push({
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { organization: { name: { contains: filters.q, mode: "insensitive" } } },
        { skills: { some: { skill: { name: { contains: filters.q, mode: "insensitive" } } } } },
      ],
    });
  }
  if (filters.ville) and.push({ city: { contains: filters.ville, mode: "insensitive" } });
  if (filters.pays) and.push({ country: filters.pays });
  if (filters.contrat) and.push({ contractType: { in: [...contractFilters[filters.contrat]] } });
  if (filters.teletravail) and.push({ remote: remoteFilters[filters.teletravail] });
  if (filters.experience) and.push({ experienceMin: experienceFilters[filters.experience] });
  if (filters.salaire) and.push({ salaryMin: { not: null } });
  if (filters.publie) {
    const since = new Date(now.getTime() - postedFilters[filters.publie] * 3_600_000);
    and.push({ publishedAt: { gte: since } });
  }
  if (filters.verifiees) and.push({ organization: { verifiedAt: { not: null } } });
  if (filters.places) {
    const { areas, remote } = filters.places;
    and.push({
      OR: [
        ...areas.map((area) => ({
          country: { in: area.countries },
          ...(area.cities.length > 0 && {
            city: { in: area.cities, mode: "insensitive" as const },
          }),
        })),
        ...(remote ? [{ remote: "remote" as const }] : []),
      ],
    });
  }
  return { AND: and };
}

export function jobOrderBy(sort: JobFilters["tri"]): Prisma.JobOrderByWithRelationInput[] {
  return sort === "deadline"
    ? [{ closesAt: { sort: "asc", nulls: "last" } }, { publishedAt: "desc" }]
    : [{ publishedAt: "desc" }, { title: "asc" }];
}

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  contractType: true,
  city: true,
  country: true,
  remote: true,
  publishedAt: true,
  closesAt: true,
  organization: { select: { name: true, verifiedAt: true } },
} satisfies Prisma.JobSelect;

export type JobSummary = Prisma.JobGetPayload<{ select: typeof cardSelect }>;

/** Job card of the public site (home page): adds the salary range when the recruiter gave one. */
const publicCardSelect = {
  ...cardSelect,
  salaryMin: true,
  salaryMax: true,
} satisfies Prisma.JobSelect;

export type PublicJobSummary = Prisma.JobGetPayload<{ select: typeof publicCardSelect }>;

export async function searchJobs(db: PrismaClient, filters: JobQuery, now = new Date()) {
  const where = jobWhere(filters, now);
  const page = filters.page ?? 1;
  const [total, jobs] = await Promise.all([
    db.job.count({ where }),
    db.job.findMany({
      where,
      orderBy: jobOrderBy(filters.tri),
      skip: (page - 1) * JOBS_PER_PAGE,
      take: JOBS_PER_PAGE,
      select: publicCardSelect,
    }),
  ]);
  return { total, page, pageCount: Math.max(1, Math.ceil(total / JOBS_PER_PAGE)), jobs };
}

/**
 * Ids of the offers matching `filters`, most recent first, for a ranking done afterwards (the
 * compatibility of the signed-in search). Capped: the score is computed for each of them.
 */
export async function matchingJobIds(
  db: PrismaClient,
  filters: JobQuery,
  now = new Date(),
  take = 120,
): Promise<string[]> {
  const rows = await db.job.findMany({
    where: jobWhere(filters, now),
    orderBy: jobOrderBy("recent"),
    take,
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

/** Cards of the given offers, in the given order. */
export async function jobCards(db: PrismaClient, ids: string[]) {
  const rows = await db.job.findMany({ where: { id: { in: ids } }, select: publicCardSelect });
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

/** Companies with the most open offers (sidebar « Entreprises qui recrutent »). */
export async function hiringCompanies(db: PrismaClient, take = 3, now = new Date()) {
  const groups = await db.job.groupBy({
    by: ["organizationId"],
    where: openJobWhere(now),
    _count: { _all: true },
    orderBy: { _count: { organizationId: "desc" } },
    take,
  });
  const orgs = await db.organization.findMany({
    where: { id: { in: groups.map((group) => group.organizationId) } },
    select: { id: true, name: true, slug: true, sector: true },
  });
  return groups.flatMap((group) => {
    const org = orgs.find((item) => item.id === group.organizationId);
    return org ? [{ ...org, openJobs: group._count._all }] : [];
  });
}

export async function countOpenJobs(db: PrismaClient, now = new Date()) {
  return db.job.count({ where: openJobWhere(now) });
}

export async function listJobCountries(db: PrismaClient, now = new Date()): Promise<string[]> {
  const rows = await db.job.findMany({
    where: openJobWhere(now),
    distinct: ["country"],
    select: { country: true },
    orderBy: { country: "asc" },
  });
  return rows.map((row) => row.country);
}

/**
 * Turns the places of a profile (ISO codes, place names) into the `places` filter. Offers name
 * their country freely (« RD Congo »): each spelling in use is matched to its code. Offers only
 * give a city, so a country where a province was picked is kept whole.
 */
export async function jobPlacesFor(
  db: PrismaClient,
  profile: {
    desiredCountries: string[];
    desiredLocations: string[];
    remotePreferences: RemoteMode[];
  },
  now = new Date(),
): Promise<JobPlaces | null> {
  if (profile.desiredCountries.length === 0) return null;
  const [spellings, localities] = await Promise.all([
    listJobCountries(db, now),
    db.locality.findMany({
      where: {
        countryCode: { in: profile.desiredCountries },
        name: { in: profile.desiredLocations },
      },
      select: { countryCode: true, name: true, kind: true },
    }),
  ]);
  return {
    areas: profile.desiredCountries.map((code) => {
      const picked = localities.filter((place) => place.countryCode === code);
      const wholeCountry = picked.length === 0 || picked.some((place) => place.kind === "province");
      return {
        countries: spellings.filter((value) => countryCode(value) === code),
        cities: wholeCountry ? [] : picked.map((place) => place.name),
      };
    }),
    remote: profile.remotePreferences.includes("remote"),
  };
}

export async function latestJobs(db: PrismaClient, take = 3, now = new Date()) {
  return db.job.findMany({
    where: openJobWhere(now),
    orderBy: jobOrderBy("recent"),
    take,
    select: publicCardSelect,
  });
}

/** A published or closed job (closed jobs keep their page, with a notice). Drafts and archives are hidden. */
export async function getPublicJob(db: PrismaClient, slug: string) {
  return db.job.findFirst({
    where: { slug, status: { in: ["published", "closed"] } },
    include: {
      organization: {
        select: {
          name: true,
          slug: true,
          description: true,
          verifiedAt: true,
          logo: true,
          sector: true,
          size: true,
        },
      },
      skills: { include: { skill: { select: { name: true } } }, orderBy: { weight: "desc" } },
    },
  });
}

export type PublicJob = NonNullable<Awaited<ReturnType<typeof getPublicJob>>>;

export function isJobOpen(job: { status: string; closesAt: Date | null }, now = new Date()) {
  return job.status === "published" && (job.closesAt === null || job.closesAt > now);
}

export async function similarJobs(
  db: PrismaClient,
  job: { slug: string; contractType: ContractType; country: string },
  take = 3,
  now = new Date(),
) {
  return db.job.findMany({
    where: {
      AND: [
        openJobWhere(now),
        { slug: { not: job.slug } },
        { OR: [{ contractType: job.contractType }, { country: job.country }] },
      ],
    },
    orderBy: jobOrderBy("recent"),
    take,
    select: cardSelect,
  });
}

export async function listJobSlugs(db: PrismaClient, now = new Date()) {
  return db.job.findMany({ where: openJobWhere(now), select: { slug: true, updatedAt: true } });
}

/** Languages required by a job, stored as JSON ([{ code, level }]). */
export function parseLanguages(value: Prisma.JsonValue): { code: string; level: string }[] {
  const schema = z.array(z.object({ code: z.string(), level: z.string() }));
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

/** Knockout criteria, stored as JSON (["Permis B", …]). */
export function parseCriteria(value: Prisma.JsonValue): string[] {
  const parsed = z.array(z.string()).safeParse(value);
  return parsed.success ? parsed.data : [];
}
