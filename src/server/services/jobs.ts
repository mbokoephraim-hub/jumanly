/** Public job offers (Jobs), read without an account (docs/specifications.md, partie 07 § 1). */
import { z } from "zod";
import type { ContractType, Prisma, PrismaClient, RemoteMode } from "@/generated/prisma/client";

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
  page: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
});

export type JobFilters = z.infer<typeof jobFiltersSchema>;

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

export function jobWhere(filters: JobFilters, now: Date): Prisma.JobWhereInput {
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

export async function searchJobs(db: PrismaClient, filters: JobFilters, now = new Date()) {
  const where = jobWhere(filters, now);
  const page = filters.page ?? 1;
  const [total, jobs] = await Promise.all([
    db.job.count({ where }),
    db.job.findMany({
      where,
      orderBy: jobOrderBy(filters.tri),
      skip: (page - 1) * JOBS_PER_PAGE,
      take: JOBS_PER_PAGE,
      select: cardSelect,
    }),
  ]);
  return { total, page, pageCount: Math.max(1, Math.ceil(total / JOBS_PER_PAGE)), jobs };
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

export async function latestJobs(db: PrismaClient, take = 3, now = new Date()) {
  return db.job.findMany({
    where: openJobWhere(now),
    orderBy: jobOrderBy("recent"),
    take,
    select: cardSelect,
  });
}

/** A published or closed job (closed jobs keep their page, with a notice). Drafts and archives are hidden. */
export async function getPublicJob(db: PrismaClient, slug: string) {
  return db.job.findFirst({
    where: { slug, status: { in: ["published", "closed"] } },
    include: {
      organization: {
        select: { name: true, slug: true, description: true, verifiedAt: true, logo: true },
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
