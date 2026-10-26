/**
 * Explorer (Modèle B, lot B4, rangées 07 à 10): the offers ranked for the person, the companies
 * that recruit, the people to know, the search across all three, and the pages of a company and
 * of a person. Rules:
 * - the ranking is the deterministic score of part 08; an offer without a score is never hidden;
 * - a person appears only when their profile is visible under their name (`recruiters`), never a
 *   private or anonymous one, and never someone blocked either way;
 * - the details of a person (about, skills, experience, achievements) show only when their
 *   profile is visible or the two are connected; otherwise their name and title only.
 * No connection or follow data is used for matching.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { matchesForUser } from "@/server/matching/service";
import {
  type ExploreFilters,
  NO_FILTERS,
  residenceWhere,
  salaryWhere,
  sectorMatches,
  showsSection,
} from "./explore-filters";
import { openJobWhere } from "./jobs";
import { declaredMembers } from "./org-team";

/** The offers read for the home of Explorer: enough for every chip, ranked afterwards. */
const HOME_OFFERS = 60;
/** Offers published within this many days are « Nouvelles cette semaine ». */
const NEW_DAYS = 7;
const DAY = 86_400_000;

const offerSelect = {
  id: true,
  slug: true,
  title: true,
  domain: true,
  contractType: true,
  remote: true,
  city: true,
  publishedAt: true,
  organization: {
    select: {
      slug: true,
      name: true,
      logo: true,
      banner: true,
      sector: true,
      verifiedAt: true,
    },
  },
} satisfies Prisma.JobSelect;

type OfferRow = Prisma.JobGetPayload<{ select: typeof offerSelect }>;

export type ExploreOffer = OfferRow & {
  /** The person's score for it (0-100), or null when the calculation is off or incomplete. */
  score: number | null;
};

export type ExploreCompany = {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  banner: string | null;
  sector: string | null;
  city: string | null;
  verified: boolean;
  offers: number;
};

export type ExplorePerson = {
  id: string;
  name: string;
  image: string | null;
  title: string | null;
  company: string | null;
  city: string | null;
  /** Why this person is suggested, for the line under their name. */
  reason:
    | { kind: "mutual"; count: number }
    | { kind: "field" }
    | { kind: "city"; city: string }
    | { kind: "joined"; at: Date };
  /** Where we stand: nothing yet, a request I sent, or connected. */
  link: "none" | "sent" | "connected";
};

/** Accepted, pending (sent by me or to me) and blocked links of a person, by other person. */
export async function links(db: PrismaClient, userId: string) {
  const rows = await db.connection.findMany({
    where: {
      status: { in: ["accepted", "pending", "blocked"] },
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true, status: true },
  });
  const map = new Map<string, "connected" | "sent" | "received" | "blocked">();
  for (const row of rows) {
    const other = row.requesterId === userId ? row.addresseeId : row.requesterId;
    map.set(
      other,
      row.status === "accepted"
        ? "connected"
        : row.status === "blocked"
          ? "blocked"
          : row.requesterId === userId
            ? "sent"
            : "received",
    );
  }
  return map;
}

/** Scores of `rows` for the person, then the rows ranked: best first, unscored after, newest first. */
async function ranked(db: PrismaClient, userId: string, rows: OfferRow[], now: Date) {
  const matches = await matchesForUser(
    db,
    userId,
    rows.map((row) => row.id),
    now,
  );
  const offers: ExploreOffer[] = rows.map((row) => {
    const match = matches.get(row.id);
    return { ...row, score: match?.state === "ok" ? Math.round(match.explanation.score) : null };
  });
  return offers.sort(
    (a, b) =>
      (b.score ?? -1) - (a.score ?? -1) ||
      (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
  );
}

/** The most frequent values of a list, most frequent first (ties in alphabetical order). */
function mostFrequent(values: (string | null)[], take: number) {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
    .slice(0, take)
    .map(([value]) => value);
}

/** Companies with at least one open offer, the most offers first; only `sectors` when given. */
export async function hiringCompanies(
  db: PrismaClient,
  now = new Date(),
  take = 20,
  sectors: string[] | null = null,
) {
  const rows = await db.organization.findMany({
    where: {
      suspendedAt: null,
      jobs: { some: openJobWhere(now) },
      ...(sectors ? { sector: { in: sectors } } : {}),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      banner: true,
      sector: true,
      city: true,
      verifiedAt: true,
      hiringNow: true,
      _count: { select: { jobs: { where: openJobWhere(now) } } },
    },
  });
  // « Recrute en ce moment » (étape 3, A3) comes first.
  const hiring = new Set(rows.filter((row) => row.hiringNow).map((row) => row.id));
  return rows
    .map((row): ExploreCompany => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      logo: row.logo,
      banner: row.banner,
      sector: row.sector,
      city: row.city,
      verified: row.verifiedAt !== null,
      offers: row._count.jobs,
    }))
    .sort(
      (a, b) =>
        Number(hiring.has(b.id)) - Number(hiring.has(a.id)) ||
        Number(b.verified) - Number(a.verified) ||
        b.offers - a.offers ||
        a.name.localeCompare(b.name, "fr"),
    )
    .slice(0, take);
}

const personSelect = {
  id: true,
  name: true,
  image: true,
  createdAt: true,
  talentProfile: {
    select: {
      headline: true,
      studyField: true,
      desiredJobTitles: true,
      desiredLocations: true,
      experiences: {
        where: { endDate: null },
        orderBy: { startDate: "desc" },
        take: 1,
        select: { company: true, title: true },
      },
    },
  },
} satisfies Prisma.UserSelect;

type PersonRow = Prisma.UserGetPayload<{ select: typeof personSelect }>;

function titleOf(row: PersonRow) {
  const profile = row.talentProfile;
  return (
    profile?.experiences[0]?.title || profile?.headline || profile?.desiredJobTitles[0] || null
  );
}

/**
 * People to know: profiles visible under their name, never already connected, asked or blocked.
 * Those with connections in common come first, then the same field of study, then the same city,
 * then the newest members.
 */
export async function peopleToKnow(
  db: PrismaClient,
  userId: string,
  take = 10,
  where: Prisma.UserWhereInput = {},
) {
  const [mine, me] = await Promise.all([
    links(db, userId),
    db.talentProfile.findUnique({
      where: { userId },
      select: { studyField: true, desiredLocations: true },
    }),
  ]);
  const rows = await db.user.findMany({
    where: {
      id: { notIn: [userId, ...mine.keys()] },
      talentProfile: { visibility: "recruiters" },
      ...where,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: personSelect,
  });
  const connected = [...mine.entries()]
    .filter(([, kind]) => kind === "connected")
    .map(([id]) => id);
  const theirs = await db.connection.findMany({
    where: {
      status: "accepted",
      OR: [
        { requesterId: { in: connected }, addresseeId: { in: rows.map((row) => row.id) } },
        { addresseeId: { in: connected }, requesterId: { in: rows.map((row) => row.id) } },
      ],
    },
    select: { requesterId: true, addresseeId: true },
  });
  const mutual = new Map<string, number>();
  for (const row of theirs) {
    const other = connected.includes(row.requesterId) ? row.addresseeId : row.requesterId;
    mutual.set(other, (mutual.get(other) ?? 0) + 1);
  }
  const myCity = me?.desiredLocations[0]?.toLowerCase() ?? null;
  const people = rows.map((row): ExplorePerson & { rank: number } => {
    const profile = row.talentProfile;
    const city = profile?.desiredLocations[0] ?? null;
    const common = mutual.get(row.id) ?? 0;
    const reason: ExplorePerson["reason"] =
      common > 0
        ? { kind: "mutual", count: common }
        : me?.studyField && profile?.studyField === me.studyField
          ? { kind: "field" }
          : myCity && city && city.toLowerCase() === myCity
            ? { kind: "city", city }
            : { kind: "joined", at: row.createdAt };
    const rank =
      reason.kind === "mutual"
        ? 3000 + common
        : reason.kind === "field"
          ? 2000
          : reason.kind === "city"
            ? 1000
            : 0;
    return {
      id: row.id,
      name: row.name,
      image: row.image,
      title: titleOf(row),
      company: profile?.experiences[0]?.company ?? null,
      city,
      reason,
      link: "none",
      rank,
    };
  });
  return people
    .sort((a, b) => b.rank - a.rank)
    .slice(0, take)
    .map(({ rank: _rank, ...person }) => person);
}

/**
 * The sectors written on companies that belong to the sectors of the filter (« Banque et
 * microfinance » for « Banque »), or null when no sector is chosen.
 */
async function sectorNames(db: PrismaClient, filters: ExploreFilters) {
  if (filters.sectors.length === 0) return null;
  const rows = await db.organization.findMany({
    where: { sector: { not: null } },
    distinct: ["sector"],
    select: { sector: true },
  });
  return rows
    .map((row) => row.sector)
    .filter((sector): sector is string => sectorMatches(sector, filters.sectors));
}

/** The open offers that meet the filters (contract, salary, sector of the company). */
function offerWhere(
  filters: ExploreFilters,
  sectors: string[] | null,
  now: Date,
): Prisma.JobWhereInput {
  return {
    ...openJobWhere(now),
    organization: { suspendedAt: null, ...(sectors ? { sector: { in: sectors } } : {}) },
    ...(filters.contracts.length > 0 ? { contractType: { in: filters.contracts } } : {}),
    ...(filters.salary ? { AND: [salaryWhere(filters.salary)] } : {}),
  };
}

/**
 * Everything the home of Explorer shows, read at once while the logo plays; with `filters`, only
 * what meets them (docs/fil-menu-publication § 3). The filters never touch an application.
 */
export async function explorerHome(
  db: PrismaClient,
  userId: string,
  now = new Date(),
  filters: ExploreFilters = NO_FILTERS,
) {
  const sectors = await sectorNames(db, filters);
  const rows = await db.job.findMany({
    where: offerWhere(filters, sectors, now),
    orderBy: { publishedAt: "desc" },
    take: HOME_OFFERS,
    select: offerSelect,
  });
  const [offers, companies, people, saved] = await Promise.all([
    ranked(db, userId, rows, now),
    hiringCompanies(db, now, 20, sectors),
    peopleToKnow(db, userId, 10, residenceWhere(filters.residence)),
    db.savedJob.count({ where: { userId, job: openJobWhere(now) } }),
  ]);
  const fresh = offers
    .filter(
      (offer) => offer.publishedAt && now.getTime() - offer.publishedAt.getTime() < NEW_DAYS * DAY,
    )
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
  return {
    offers,
    fresh,
    /** The fields of the offers, most frequent first: the chips of « Offres pour vous ». */
    domains: mostFrequent(
      offers.map((offer) => offer.domain),
      4,
    ),
    companies,
    /** The sectors of the companies that recruit: the chips of « Entreprises qui recrutent ». */
    sectors: mostFrequent(
      companies.map((company) => company.sector),
      4,
    ),
    people,
    saved,
  };
}

/**
 * How many results the filters give, for « Voir N résultats »: the open offers, the companies
 * that recruit and the people to know that meet them, within the scope chosen.
 */
export async function explorerCount(
  db: PrismaClient,
  userId: string,
  filters: ExploreFilters,
  now = new Date(),
) {
  const sectors = await sectorNames(db, filters);
  const [offers, companies, people] = await Promise.all([
    showsSection(filters.scope, "offres")
      ? db.job.count({ where: offerWhere(filters, sectors, now) })
      : 0,
    showsSection(filters.scope, "entreprises")
      ? db.organization.count({
          where: {
            suspendedAt: null,
            jobs: { some: openJobWhere(now) },
            ...(sectors ? { sector: { in: sectors } } : {}),
          },
        })
      : 0,
    showsSection(filters.scope, "personnes")
      ? links(db, userId).then((mine) =>
          db.user.count({
            where: {
              id: { notIn: [userId, ...mine.keys()] },
              talentProfile: { visibility: "recruiters" },
              ...residenceWhere(filters.residence),
            },
          }),
        )
      : 0,
  ]);
  return { offers, companies, people, total: offers + companies + people };
}

export type ExplorerHome = Awaited<ReturnType<typeof explorerHome>>;

/** The saved offers of a person, open ones first, with their score. */
export async function savedOffers(db: PrismaClient, userId: string, now = new Date()) {
  const rows = await db.savedJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { job: { select: { ...offerSelect, status: true, closesAt: true } } },
  });
  const matches = await matchesForUser(
    db,
    userId,
    rows.map((row) => row.job.id),
    now,
  );
  const open = (job: { status: string; closesAt: Date | null }) =>
    job.status === "published" && (job.closesAt === null || job.closesAt > now);
  return rows
    .map(({ job: { status, closesAt, ...job } }) => {
      const match = matches.get(job.id);
      return {
        ...job,
        open: open({ status, closesAt }),
        score: match?.state === "ok" ? Math.round(match.explanation.score) : null,
      };
    })
    .sort((a, b) => Number(b.open) - Number(a.open));
}

export const EXPLORE_SCOPES = ["tout", "offres", "entreprises", "personnes", "villes"] as const;
export type ExploreScope = (typeof EXPLORE_SCOPES)[number];

/**
 * The search of Explorer, from the first letter: offers (by title, company or skill), companies,
 * people (visible ones only) and cities with open offers. `scope` keeps one group.
 */
export async function exploreSearch(
  db: PrismaClient,
  userId: string,
  query: string,
  scope: ExploreScope = "tout",
  now = new Date(),
) {
  const text = query.trim().slice(0, 80);
  const empty = {
    offers: [] as ExploreOffer[],
    companies: [] as ExploreCompany[],
    people: [] as ExplorePerson[],
    cities: [] as { city: string; offers: number }[],
  };
  if (!text) return empty;
  const contains = { contains: text, mode: "insensitive" as const };
  const want = (group: ExploreScope) => scope === "tout" || scope === group;
  const [offerRows, companies, people, cities] = await Promise.all([
    want("offres")
      ? db.job.findMany({
          where: {
            ...openJobWhere(now),
            organization: { suspendedAt: null },
            AND: [
              {
                OR: [
                  { title: contains },
                  { organization: { name: contains } },
                  { skills: { some: { skill: { name: contains } } } },
                ],
              },
            ],
          },
          orderBy: { publishedAt: "desc" },
          take: 30,
          select: offerSelect,
        })
      : Promise.resolve([]),
    want("entreprises")
      ? hiringCompanies(db, now, 200).then((rows) =>
          rows.filter((row) => row.name.toLowerCase().includes(text.toLowerCase())).slice(0, 10),
        )
      : Promise.resolve([]),
    want("personnes") ? searchVisiblePeople(db, userId, text) : Promise.resolve([]),
    want("villes")
      ? db.job.groupBy({
          by: ["city"],
          where: { ...openJobWhere(now), city: contains },
          _count: { _all: true },
          orderBy: { _count: { city: "desc" } },
          take: 6,
        })
      : Promise.resolve([]),
  ]);
  return {
    offers: await ranked(db, userId, offerRows, now),
    companies,
    people,
    cities: cities.map((row) => ({ city: row.city, offers: row._count._all })),
  };
}

/** People visible under their name, by name or title, with where we stand with each. */
async function searchVisiblePeople(db: PrismaClient, userId: string, text: string) {
  const mine = await links(db, userId);
  const blocked = [...mine.entries()].filter(([, kind]) => kind === "blocked").map(([id]) => id);
  const contains = { contains: text, mode: "insensitive" as const };
  const rows = await db.user.findMany({
    where: {
      id: { notIn: [userId, ...blocked] },
      talentProfile: { visibility: "recruiters" },
      OR: [{ name: contains }, { talentProfile: { headline: contains } }],
    },
    orderBy: { name: "asc" },
    take: 10,
    select: personSelect,
  });
  return rows.map((row): ExplorePerson => ({
    id: row.id,
    name: row.name,
    image: row.image,
    title: titleOf(row),
    company: row.talentProfile?.experiences[0]?.company ?? null,
    city: row.talentProfile?.desiredLocations[0] ?? null,
    reason: { kind: "joined", at: row.createdAt },
    link: linkOf(mine.get(row.id)),
  }));
}

function linkOf(
  kind: "connected" | "sent" | "received" | "blocked" | undefined,
): ExplorePerson["link"] {
  return kind === "connected" ? "connected" : kind === "sent" ? "sent" : "none";
}

// ─── The page of a company (rangée 09) ────────────────────────────────────────────────

/** A company as its page shows it: who it is, its numbers, its offers and its members. */
export async function companyPage(
  db: PrismaClient,
  userId: string,
  slug: string,
  now = new Date(),
) {
  const org = await db.organization.findFirst({
    where: { slug, suspendedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      banner: true,
      description: true,
      website: true,
      city: true,
      country: true,
      sector: true,
      size: true,
      verifiedAt: true,
      createdAt: true,
      _count: { select: { feedFollowers: true } },
      memberships: {
        where: { status: "active" },
        orderBy: { createdAt: "asc" },
        select: {
          jobTitle: true,
          role: true,
          user: {
            select: { ...personSelect, talentProfile: { select: { visibility: true } } },
          },
        },
      },
    },
  });
  if (!org) return null;
  const [rows, following, mine, declared] = await Promise.all([
    db.job.findMany({
      where: { ...openJobWhere(now), organizationId: org.id },
      orderBy: { publishedAt: "desc" },
      select: offerSelect,
    }),
    db.feedFollow.findUnique({
      where: { followerId_organizationId: { followerId: userId, organizationId: org.id } },
      select: { id: true },
    }),
    links(db, userId),
    declaredMembers(db, org.id),
  ]);
  const offers = await ranked(db, userId, rows, now);
  // Members: never someone who blocked me or whom I blocked.
  const members = org.memberships
    .filter((member) => member.user.id !== userId && mine.get(member.user.id) !== "blocked")
    .map((member) => ({
      id: member.user.id,
      name: member.user.name,
      image: member.user.image,
      title: member.jobTitle?.trim() || null,
      role: member.role as typeof member.role | null,
      link: linkOf(mine.get(member.user.id)),
      /** Their page opens only when their profile is visible, or for a connection. */
      visible:
        member.user.talentProfile?.visibility === "recruiters" ||
        mine.get(member.user.id) === "connected",
      declared: false,
    }));
  // Then the people who say they work there (étape 3, A6, as on the company's own page): until
  // the company answers, « Indiqué par la personne »; never one it said does not work there.
  for (const person of declared) {
    if (person.userId === userId || mine.get(person.userId) === "blocked") continue;
    members.push({
      id: person.userId,
      name: person.name,
      image: person.image,
      title: person.title,
      role: null,
      link: linkOf(mine.get(person.userId)),
      visible: true,
      declared: person.status !== "confirmed",
    });
  }
  return {
    id: org.id,
    slug: org.slug,
    name: org.name,
    logo: org.logo,
    banner: org.banner,
    description: org.description,
    website: org.website,
    city: org.city,
    country: org.country,
    sector: org.sector,
    size: org.size,
    createdAt: org.createdAt,
    verified: org.verifiedAt !== null,
    followers: org._count.feedFollowers,
    following: Boolean(following),
    offers,
    members,
  };
}

export type CompanyPage = NonNullable<Awaited<ReturnType<typeof companyPage>>>;

/** « Suivre » a company: its posts come into « Abonnements ». Returns the new state. */
export async function toggleFollowCompany(db: PrismaClient, userId: string, slug: string) {
  const org = await db.organization.findFirst({
    where: { slug, suspendedAt: null },
    select: { id: true },
  });
  if (!org) return null;
  const key = { followerId_organizationId: { followerId: userId, organizationId: org.id } };
  const existing = await db.feedFollow.findUnique({ where: key, select: { id: true } });
  if (existing) {
    await db.feedFollow.delete({ where: { id: existing.id } });
    return false;
  }
  await db.feedFollow.create({ data: { followerId: userId, organizationId: org.id } });
  return true;
}
