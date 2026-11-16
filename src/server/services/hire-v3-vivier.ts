/**
 * Vivier of the recruiter's web app v3 (docs/mvp-web-recruteur/prototype-v3, `V.vivier`): every
 * talent kept in the organization's pools, once each, with the pool it sits in, its skills, its
 * availability and how close it is to the newest published offer (share of the offer's required
 * skills it holds: deterministic, never the name, age, gender or photo). Only the entries the
 * pools already show (talents still visible, or who applied or accepted a contact) are listed.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { HireError, hirePermissions, type HireContext } from "./hire";
import { entryVisible, poolsEnabled, poolsWhere } from "./talent-search";

export const VIVIER_TABS = ["tous", "favoris", "relances"] as const;
export type VivierTab = (typeof VIVIER_TABS)[number];

const DAY = 86_400_000;
/** Brief MVP M8: a talent stays 24 months, then is asked to renew the consent. */
export const CONSENT_MONTHS = 24;
/** « À renouveler »: the consent ends within three months (`acc:soon` of the prototype). */
const RENEW_DAYS = 90;

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
};

export async function vivierV3(db: PrismaClient, ctx: HireContext, now = new Date()) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  if (!(await poolsEnabled(db, ctx.organizationId))) return null;
  const [pools, offer] = await Promise.all([
    db.talentPool.findMany({
      where: await poolsWhere(db, ctx),
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        entries: {
          where: entryVisible(ctx.organizationId),
          orderBy: { createdAt: "desc" },
          select: {
            createdAt: true,
            favoriteAt: true,
            profileId: true,
            profile: {
              select: {
                headline: true,
                visibility: true,
                availability: true,
                user: { select: { name: true, city: true } },
                skills: { select: { skillId: true, skill: { select: { name: true } } }, take: 8 },
                applications: {
                  where: { job: { organizationId: ctx.organizationId } },
                  orderBy: { createdAt: "desc" },
                  select: { id: true, conversation: { select: { id: true } } },
                  take: 1,
                },
                contactRequests: {
                  where: {
                    organizationId: ctx.organizationId,
                    status: { in: ["accepted", "pending"] },
                  },
                  orderBy: { createdAt: "desc" },
                  select: {
                    status: true,
                    createdAt: true,
                    respondedAt: true,
                    remindedAt: true,
                    conversationId: true,
                  },
                  take: 5,
                },
              },
            },
          },
        },
      },
    }),
    db.job.findFirst({
      where: { organizationId: ctx.organizationId, status: "published" },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        skills: { where: { importance: "required" }, select: { skillId: true } },
      },
    }),
  ]);
  const wanted = new Set(offer?.skills.map((item) => item.skillId) ?? []);
  const seen = new Map<string, number>();
  const talents: {
    profileId: string;
    name: string | null;
    headline: string | null;
    available: boolean;
    skills: { name: string; wanted: boolean }[];
    score: number | null;
    poolId: string;
    pool: string;
    poolIndex: number;
    applicationId: string | null;
    conversationId: string | null;
    city: string | null;
    favorite: boolean;
    /** Days since the last invitation still waiting for an answer, or null. */
    relanceDays: number | null;
    consentUntil: Date;
    renewSoon: boolean;
    addedAt: Date;
  }[] = [];
  pools.forEach((pool, poolIndex) => {
    for (const entry of pool.entries) {
      const already = seen.get(entry.profileId);
      if (already !== undefined) {
        if (entry.favoriteAt) talents[already]!.favorite = true;
        continue;
      }
      seen.set(entry.profileId, talents.length);
      const p = entry.profile;
      const accepted = p.contactRequests.find((request) => request.status === "accepted");
      const pending = p.contactRequests.find((request) => request.status === "pending");
      const known = p.applications.length > 0 || Boolean(accepted);
      // The consent runs from the latest of: the entry, the accepted proposal.
      const consentFrom =
        accepted?.respondedAt && accepted.respondedAt > entry.createdAt
          ? accepted.respondedAt
          : entry.createdAt;
      const consentUntil = addMonths(consentFrom, CONSENT_MONTHS);
      const lastAsk = pending ? (pending.remindedAt ?? pending.createdAt) : null;
      const held = p.skills.filter((s) => wanted.has(s.skillId)).length;
      talents.push({
        profileId: entry.profileId,
        name: p.visibility === "anonymous" && !known ? null : p.user.name,
        headline: p.headline,
        available: p.availability === "open",
        skills: p.skills
          .slice(0, 4)
          .map((s) => ({ name: s.skill.name, wanted: wanted.has(s.skillId) })),
        score: wanted.size > 0 ? Math.round((held / wanted.size) * 100) : null,
        poolId: pool.id,
        pool: pool.name,
        poolIndex,
        applicationId: p.applications[0]?.id ?? null,
        conversationId: accepted?.conversationId ?? p.applications[0]?.conversation?.id ?? null,
        city: known || p.visibility !== "anonymous" ? p.user.city?.trim() || null : null,
        favorite: Boolean(entry.favoriteAt),
        relanceDays: lastAsk
          ? Math.max(0, Math.floor((now.getTime() - lastAsk.getTime()) / DAY))
          : null,
        consentUntil,
        renewSoon: consentUntil.getTime() - now.getTime() <= RENEW_DAYS * DAY,
        addedAt: entry.createdAt,
      });
    }
  });
  talents.sort(
    (a, b) => (b.score ?? -1) - (a.score ?? -1) || b.addedAt.getTime() - a.addedAt.getTime(),
  );
  const close = talents.filter((t) => (t.score ?? 0) >= 50);
  return {
    offer: offer ? { id: offer.id, title: offer.title } : null,
    pools: pools.map((pool, index) => ({
      id: pool.id,
      name: pool.name,
      index,
      count: talents.filter((t) => t.poolId === pool.id).length,
    })),
    talents,
    close,
    available: talents.filter((t) => t.available).length,
    favorites: talents.filter((t) => t.favorite).length,
    relances: talents.filter((t) => t.relanceDays !== null).length,
    renew: talents.filter((t) => t.renewSoon).length,
    cities: [...new Set(talents.map((t) => t.city).filter((c): c is string => Boolean(c)))].sort(),
    skills: topSkills(talents.flatMap((t) => t.skills.map((s) => s.name))),
    top: close.slice(0, 3),
    bestPoolId: close[0]?.poolId ?? null,
  };
}

/** The skills most held in the vivier, for the « Compétences » criterion (at most 10). */
function topSkills(names: string[]) {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
    .slice(0, 10)
    .map(([name]) => name);
}

/**
 * « Favoris » (heart of a card): the talent is marked on every entry it has in the pools the
 * member sees, or unmarked. Only talents already in the vivier can be marked.
 */
export async function toggleVivierFavorite(
  db: PrismaClient,
  ctx: HireContext,
  profileId: string,
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const where = { profileId, pool: await poolsWhere(db, ctx) };
  const entries = await db.talentPoolEntry.findMany({ where, select: { favoriteAt: true } });
  if (!entries.length) throw new HireError("notFound");
  const favorite = !entries.some((entry) => entry.favoriteAt);
  await db.talentPoolEntry.updateMany({ where, data: { favoriteAt: favorite ? now : null } });
  return favorite;
}

export type VivierV3 = NonNullable<Awaited<ReturnType<typeof vivierV3>>>;
