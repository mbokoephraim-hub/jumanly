/**
 * Modèle B recruteur, lot M6 (mobile/captures section 06): the tab Talents of the recruiter's
 * phone. « Découvrir » suggests visible talents for the organization's offers, ranked by the
 * fixed score of part 08 (never by who they are); « Vivier », « Propositions » and « Réseau »
 * read the existing pools, contact requests and connections. Every query of the organization's
 * data is filtered by `organizationId` (golden rule 6); a talent's own colleagues never see them
 * suggested (discreet profile).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { level } from "@/server/entitlements";
import { matchesForUser } from "@/server/matching/service";
import type { MatchExplanation } from "@/server/matching/types";
import { hirePermissions, HireError, type HireContext } from "./hire";
import { listConnections } from "./connections";
import { peopleToKnow } from "./explore";
import { rhAssignees } from "./hire-phone-candidatures";
import { notify } from "./notifications";
import { orgProposals, visibleWhere, yearsOf } from "./talent-search";

/** How many talents « Découvrir » shows, and how many it scores to choose them. */
export const DISCOVER_SHOWN = 20;
const DISCOVER_SCORED = 60;
/** « Toutes mes offres » compares each talent with the newest offers only. */
const DISCOVER_OFFERS = 5;

export type DiscoverCard = {
  profileId: string;
  anonymous: boolean;
  name: string | null;
  headline: string;
  years: number;
  city: string | null;
  score: number | null;
  jobTitle: string | null;
  inPool: boolean;
  proposal: "pending" | "seen" | "accepted" | null;
};

export type Discover =
  | { status: "locked" }
  | {
      status: "ok";
      offers: { id: string; title: string }[];
      job: string | null;
      cards: DiscoverCard[];
      total: number;
    };

const orgSubject = (ctx: HireContext) => ({
  type: "organization" as const,
  id: ctx.organizationId,
});

/** Members of the organization: never suggested to their own company. */
async function colleagues(db: PrismaClient, organizationId: string) {
  const rows = await db.membership.findMany({
    where: { organizationId },
    select: { userId: true },
  });
  return rows.map((row) => row.userId);
}

/**
 * « Découvrir » (planche 101): visible talents who have a skill of the offer chosen (or of the
 * newest offers), best score first. A suggestion uses no search of the monthly quota; a talent the
 * member hid stays out of it but can still be found by search.
 */
export async function rhDiscover(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string | null,
  now = new Date(),
): Promise<Discover> {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  if ((await level(db, orgSubject(ctx), "hire.talent_search")) === "none")
    return { status: "locked" };
  const offers = await db.job.findMany({
    where: { organizationId: ctx.organizationId, status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 30,
    select: { id: true, title: true, skills: { select: { skill: { select: { name: true } } } } },
  });
  const chosen = jobId ? offers.find((offer) => offer.id === jobId) : null;
  if (jobId && !chosen) throw new HireError("notFound");
  const compared = chosen ? [chosen] : offers.slice(0, DISCOVER_OFFERS);
  const skills = [
    ...new Set(compared.flatMap((offer) => offer.skills.map((item) => item.skill.name))),
  ];
  const [hidden, members] = await Promise.all([
    db.hiddenTalentSuggestion.findMany({
      where: { userId: ctx.userId, organizationId: ctx.organizationId },
      select: { profileId: true },
    }),
    colleagues(db, ctx.organizationId),
  ]);
  const where = {
    AND: [
      visibleWhere,
      { id: { notIn: hidden.map((item) => item.profileId) } },
      { userId: { notIn: members } },
      ...(skills.length > 0 ? [{ skills: { some: { skill: { name: { in: skills } } } } }] : []),
    ],
  };
  const [total, rows, matching] = await Promise.all([
    db.talentProfile.count({ where }),
    db.talentProfile.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: DISCOVER_SCORED,
      select: {
        id: true,
        userId: true,
        headline: true,
        visibility: true,
        matchingEnabled: true,
        user: { select: { name: true, city: true } },
        experiences: { select: { startDate: true, endDate: true } },
      },
    }),
    level(db, orgSubject(ctx), "hire.matching.level"),
  ]);
  const ids = rows.map((row) => row.id);
  const [pools, requests, applications] = await Promise.all([
    db.talentPoolEntry.findMany({
      where: {
        profileId: { in: ids },
        pool: {
          organizationId: ctx.organizationId,
          OR: [{ ownerId: ctx.userId }, { visibility: { not: "private" } }],
        },
      },
      select: { profileId: true },
    }),
    db.contactRequest.findMany({
      where: { organizationId: ctx.organizationId, profileId: { in: ids } },
      orderBy: { createdAt: "desc" },
      select: { profileId: true, status: true, seenAt: true, expiresAt: true },
    }),
    db.application.findMany({
      where: { profileId: { in: ids }, job: { organizationId: ctx.organizationId } },
      select: { profileId: true },
    }),
  ]);
  const cards: DiscoverCard[] = [];
  for (const row of rows) {
    let best: { score: number; job: string } | null = null;
    if (matching !== "none" && row.matchingEnabled && compared.length > 0) {
      const states = await matchesForUser(
        db,
        row.userId,
        compared.map((offer) => offer.id),
        now,
      );
      for (const offer of compared) {
        const state = states.get(offer.id);
        if (state?.state === "ok" && (!best || state.explanation.score > best.score))
          best = { score: state.explanation.score, job: offer.title };
      }
    }
    const request = requests.find((item) => item.profileId === row.id);
    const known =
      applications.some((item) => item.profileId === row.id) || request?.status === "accepted";
    const anonymous = row.visibility === "anonymous" && !known;
    cards.push({
      profileId: row.id,
      anonymous,
      name: anonymous ? null : row.user.name,
      headline: row.headline ?? "",
      years: yearsOf(row.experiences, now),
      city: row.user.city,
      score: best?.score ?? null,
      jobTitle: best?.job ?? null,
      inPool: pools.some((item) => item.profileId === row.id),
      proposal:
        request?.status === "accepted"
          ? "accepted"
          : request?.status === "pending" && request.expiresAt > now
            ? request.seenAt
              ? "seen"
              : "pending"
            : null,
    });
  }
  cards.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  return {
    status: "ok",
    offers: offers.map((offer) => ({ id: offer.id, title: offer.title })),
    job: chosen?.id ?? null,
    cards: cards.slice(0, DISCOVER_SHOWN),
    total,
  };
}

/** « Masquer ce profil de mes suggestions »: for this member only; search still finds them. */
export async function hideSuggestion(db: PrismaClient, ctx: HireContext, profileId: string) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const profile = await db.talentProfile.findFirst({
    where: { id: profileId, ...visibleWhere },
    select: { id: true },
  });
  if (!profile) throw new HireError("notFound");
  await db.hiddenTalentSuggestion.upsert({
    where: {
      userId_organizationId_profileId: {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        profileId,
      },
    },
    update: {},
    create: { userId: ctx.userId, organizationId: ctx.organizationId, profileId },
  });
}

export type RhProposal = Awaited<ReturnType<typeof orgProposals>>[number] & {
  state: "seen" | "waiting" | "accepted" | "declined" | "expired";
};

/** « Propositions » (planche 107): the organization's proposals with « Vue, sans réponse ». */
export async function rhProposals(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const rows = await orgProposals(db, ctx, now);
  return rows.map((row): RhProposal => ({
    ...row,
    state:
      row.status === "accepted"
        ? "accepted"
        : row.status === "pending"
          ? row.seenAt
            ? "seen"
            : "waiting"
          : row.status === "declined"
            ? "declined"
            : "expired",
  }));
}

/**
 * « Partager le profil à un collègue » (planche 114): a member of the same organization is told,
 * with the link to the profile. The talent is not told; the colleague's opening is logged as any.
 */
export async function shareTalent(
  db: PrismaClient,
  ctx: HireContext,
  profileId: string,
  colleagueId: string,
) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const members = await rhAssignees(db, ctx);
  if (colleagueId === ctx.userId || !members.some((member) => member.id === colleagueId))
    throw new HireError("forbidden");
  const profile = await db.talentProfile.findFirst({
    where: {
      id: profileId,
      OR: [
        visibleWhere,
        { applications: { some: { job: { organizationId: ctx.organizationId } } } },
      ],
    },
    select: { id: true, headline: true },
  });
  if (!profile) throw new HireError("notFound");
  const sharer = await db.user.findUniqueOrThrow({
    where: { id: ctx.userId },
    select: { name: true },
  });
  await notify(db, {
    userIds: [colleagueId],
    type: "talentShared",
    payload: { colleague: sharer.name },
    href: `/app/hire/talents/${profile.id}`,
  });
}

/**
 * Last activity shown on a profile (« actif hier »), only when the talent shows their presence
 * (Paramètres › « Montrer quand je suis en ligne ») and the viewer does too.
 */
export async function lastActive(db: PrismaClient, viewerId: string, userId: string) {
  const [viewer, talent] = await Promise.all([
    db.user.findUnique({ where: { id: viewerId }, select: { showPresence: true } }),
    db.user.findUnique({ where: { id: userId }, select: { showPresence: true, lastSeenAt: true } }),
  ]);
  if (!viewer?.showPresence || !talent?.showPresence) return null;
  return talent.lastSeenAt;
}

export type { MatchExplanation };

export const RH_TALENT_SEARCH = ["tout", "competence", "metier", "ville"] as const;
export type RhTalentSearch = (typeof RH_TALENT_SEARCH)[number];
const SEARCH_SHOWN = 12;

/**
 * The search in two steps of the tab Talents (planches 102 and 103): visible talents by skill, job
 * or city, as Jumanly's people search shows them to anyone (no score, at most twelve). The search
 * with filters and scores of the computer keeps its monthly quota.
 */
export async function rhSearchTalents(
  db: PrismaClient,
  ctx: HireContext,
  q: string,
  by: RhTalentSearch,
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const text = q.trim().slice(0, 100);
  if (!text) return [];
  if ((await level(db, orgSubject(ctx), "hire.talent_search")) === "none") return [];
  const contains = { contains: text, mode: "insensitive" as const };
  const skill = { skills: { some: { skill: { name: contains } } } };
  const job = {
    OR: [
      { headline: contains },
      { targetJob: contains },
      { desiredJobTitles: { has: text } },
      { experiences: { some: { title: contains } } },
    ],
  };
  const city = { OR: [{ user: { city: contains } }, { desiredLocations: { has: text } }] };
  const members = await colleagues(db, ctx.organizationId);
  const rows = await db.talentProfile.findMany({
    where: {
      AND: [
        visibleWhere,
        { visibility: "recruiters" },
        { userId: { notIn: members } },
        by === "competence"
          ? skill
          : by === "metier"
            ? job
            : by === "ville"
              ? city
              : {
                  OR: [skill, job, city],
                },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: SEARCH_SHOWN,
    select: {
      id: true,
      headline: true,
      user: { select: { name: true, city: true } },
      experiences: { select: { startDate: true, endDate: true } },
    },
  });
  return rows.map((row) => ({
    profileId: row.id,
    name: row.user.name,
    headline: row.headline ?? "",
    city: row.user.city,
    years: yearsOf(row.experiences, now),
  }));
}

/**
 * « Réseau » (planche 106): the invitations the member received, people to know, and their
 * relations, each marked « Talent » or « RH » (a member of a recruiting organization). The network
 * belongs to the person, never to the organization; nothing of it feeds the matching.
 */
export async function rhNetwork(db: PrismaClient, userId: string) {
  const [mine, know] = await Promise.all([
    listConnections(db, userId),
    peopleToKnow(db, userId, 10),
  ]);
  const ids = [
    ...mine.received.map((item) => item.person!.userId),
    ...mine.connections.map((item) => item.person!.userId),
    ...know.map((person) => person.id),
  ];
  const recruiters = new Set(
    (
      await db.membership.findMany({
        where: { userId: { in: ids } },
        select: { userId: true },
      })
    ).map((row) => row.userId),
  );
  const kind = (id: string) => (recruiters.has(id) ? ("rh" as const) : ("talent" as const));
  return {
    received: mine.received.map((item) => ({
      id: item.id,
      ...item.person!,
      kind: kind(item.person!.userId),
    })),
    know: know.map((person) => ({ ...person, kind: kind(person.id) })),
    relations: mine.connections.map((item) => ({
      id: item.id,
      conversationId: item.conversationId,
      ...item.person!,
      kind: kind(item.person!.userId),
    })),
  };
}
