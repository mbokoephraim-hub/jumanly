/**
 * « Page entreprise » of the recruiter's web app v3 (lot 6, `V.entreprise` of the prototype): what
 * the candidates see of the organization, its real figures, and the people who say they work there.
 * Every read is the member's own organization (golden rule n° 6); nothing is invented (n° 11).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { hirePermissions, type HireContext } from "./hire";
import { openJobWhere } from "./jobs";
import { declaredMembers } from "./org-team";

const DAY = 86_400_000;

export async function companyOverview(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const since = new Date(now.getTime() - 30 * DAY);
  const [org, followers, offers, applications, team, declared, liveCount] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: {
        name: true,
        slug: true,
        logo: true,
        banner: true,
        bannerTheme: true,
        description: true,
        sector: true,
        size: true,
        city: true,
        website: true,
        verifiedAt: true,
      },
    }),
    db.feedFollow.count({ where: { organizationId: ctx.organizationId } }),
    db.job.findMany({
      where: { ...openJobWhere(now), organizationId: ctx.organizationId },
      orderBy: { publishedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        city: true,
        contractType: true,
        remote: true,
        closesAt: true,
        department: { select: { name: true } },
      },
    }),
    db.application.count({
      where: { job: { organizationId: ctx.organizationId }, createdAt: { gte: since } },
    }),
    db.membership.findMany({
      where: { organizationId: ctx.organizationId, status: "active" },
      orderBy: { createdAt: "asc" },
      take: 8,
      select: { id: true, role: true, jobTitle: true, user: { select: { name: true } } },
    }),
    declaredMembers(db, ctx.organizationId),
    db.job.count({ where: { ...openJobWhere(now), organizationId: ctx.organizationId } }),
  ]);
  return {
    org,
    canEdit: hirePermissions(ctx.role).administer,
    followers,
    liveCount,
    applications,
    offers: offers.map((offer) => ({
      ...offer,
      daysLeft: offer.closesAt
        ? Math.max(0, Math.ceil((offer.closesAt.getTime() - now.getTime()) / DAY))
        : null,
    })),
    team: team.map((member) => ({
      id: member.id,
      name: member.user.name,
      title: member.jobTitle?.trim() || null,
      role: member.role,
    })),
    declared: declared.map((person) => ({
      experienceId: person.experienceId,
      name: person.name,
      title: person.title,
      confirmed: person.status === "confirmed",
    })),
  };
}

export type CompanyOverview = Awaited<ReturnType<typeof companyOverview>>;
