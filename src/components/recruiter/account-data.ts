import { AI_CREDITS_KEY } from "@/server/ai";
import { db } from "@/server/db";
import { resolvePlan, usage } from "@/server/entitlements";
import { hirePermissions, type HireContext } from "@/server/services/hire";
import { seatUsage } from "@/server/services/organization";
import { listPools } from "@/server/services/talent-search";

const DAY = 86_400_000;

/**
 * What the recruiter's account shows (Compte RH and the menu of the avatar on a computer, planche
 * web recruteur-3 § 3): the job title, the organization's verification, the seats, the pools, the
 * plan, the Orbi credits and the applications of the last 30 days. Everything is read through the
 * active organization (golden rule n° 6); the pools only for the roles that read applications.
 */
export async function recruiterAccountSummary(ctx: HireContext, now = new Date()) {
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const permissions = hirePermissions(ctx.role);
  const [membership, organization, seats, pools, plan, credits, recent] = await Promise.all([
    db.membership.findUnique({
      where: { userId_organizationId: { userId: ctx.userId, organizationId: ctx.organizationId } },
      select: { jobTitle: true },
    }),
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { verificationStatus: true, verifiedAt: true },
    }),
    seatUsage(db, ctx.organizationId),
    permissions.readApplications ? listPools(db, ctx) : Promise.resolve([]),
    resolvePlan(db, subject),
    usage(db, subject, AI_CREDITS_KEY),
    db.application.count({
      where: {
        job: { organizationId: ctx.organizationId },
        createdAt: { gte: new Date(now.getTime() - 30 * DAY) },
      },
    }),
  ]);
  const verification: "verified" | "pending" | "toVerify" = organization.verifiedAt
    ? "verified"
    : organization.verificationStatus === "pending"
      ? "pending"
      : "toVerify";
  return {
    jobTitle: membership?.jobTitle?.trim() || null,
    verification,
    seats,
    pools: pools.length,
    talents: pools.reduce((sum, pool) => sum + pool._count.entries, 0),
    readsPools: permissions.readApplications,
    planName: plan?.planName ?? "",
    creditsLeft: credits.limit < 0 ? null : Math.max(0, credits.limit - credits.used),
    recentApplications: recent,
  };
}

export type RecruiterAccountSummary = Awaited<ReturnType<typeof recruiterAccountSummary>>;
