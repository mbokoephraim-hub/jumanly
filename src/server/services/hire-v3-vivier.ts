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

export const VIVIER_TABS = ["tous", "disponibles", "proches"] as const;
export type VivierTab = (typeof VIVIER_TABS)[number];

export async function vivierV3(db: PrismaClient, ctx: HireContext) {
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
            profileId: true,
            profile: {
              select: {
                headline: true,
                visibility: true,
                availability: true,
                user: { select: { name: true } },
                skills: { select: { skillId: true, skill: { select: { name: true } } }, take: 8 },
                applications: {
                  where: { job: { organizationId: ctx.organizationId } },
                  select: { id: true },
                  take: 1,
                },
                contactRequests: {
                  where: { organizationId: ctx.organizationId, status: "accepted" },
                  select: { id: true },
                  take: 1,
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
    addedAt: Date;
  }[] = [];
  pools.forEach((pool, poolIndex) => {
    for (const entry of pool.entries) {
      if (seen.has(entry.profileId)) continue;
      seen.set(entry.profileId, talents.length);
      const p = entry.profile;
      const known = p.applications.length > 0 || p.contactRequests.length > 0;
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
    top: close.slice(0, 3),
    bestPoolId: close[0]?.poolId ?? null,
  };
}

export type VivierV3 = NonNullable<Awaited<ReturnType<typeof vivierV3>>>;
