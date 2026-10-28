import type { PrismaClient } from "@/generated/prisma/client";
import { hirePermissions, HireError, type HireContext } from "./hire";

/**
 * Journal des consultations (étape 3, A5, capture 084): every profile opened, CV downloaded,
 * evaluation saved or export made in the organization (golden rule n° 5), read from the audit log
 * of that organization only (golden rule n° 6). The owner and the administrators see the whole
 * team; nobody else reads this page.
 */

const DAYS = 90;
const LIMIT = 100;

/** The audit actions the journal shows, and the line each one reads as. */
export const JOURNAL_ACTIONS = {
  "profile.view": "profile",
  "cv.download": "cv",
  "candidate.pdf": "dossier",
  "talent.pdf": "talentPdf",
  "history.export": "history",
  "scorecard.save": "scorecard",
  "report.export": "report",
} as const;

export type JournalKind = (typeof JOURNAL_ACTIONS)[keyof typeof JOURNAL_ACTIONS] | "profileVisible";

export type JournalRow = {
  id: string;
  at: Date;
  actorId: string | null;
  actorName: string;
  kind: JournalKind;
  /** The person concerned; null when there is none (a report) or the profile stays anonymous. */
  person: string | null;
  anonymous: boolean;
  /** The job, or what else was opened. */
  object: { kind: "job"; title: string } | { kind: "search" } | { kind: "report" } | null;
  href: string | null;
};

function administer(ctx: HireContext) {
  if (!hirePermissions(ctx.role).administer) throw new HireError("forbidden");
}

const meta = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const text = (value: unknown) => (typeof value === "string" ? value : null);

export async function consultationJournal(
  db: PrismaClient,
  ctx: HireContext,
  memberId: string | null,
  now = new Date(),
) {
  administer(ctx);
  const members = await db.membership.findMany({
    where: { organizationId: ctx.organizationId, status: "active" },
    orderBy: { createdAt: "asc" },
    select: { userId: true, user: { select: { name: true } } },
  });
  // A member of another organization is never a filter: the whole team instead.
  const member = members.some((item) => item.userId === memberId) ? memberId : null;
  const logs = await db.auditLog.findMany({
    where: {
      organizationId: ctx.organizationId,
      action: { in: Object.keys(JOURNAL_ACTIONS) },
      createdAt: { gte: new Date(now.getTime() - DAYS * 86_400_000) },
      ...(member ? { actorId: member } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: LIMIT,
    select: {
      id: true,
      actorId: true,
      action: true,
      targetType: true,
      targetId: true,
      metadata: true,
      createdAt: true,
    },
  });

  const applicationIds = new Set<string>();
  const profileIds = new Set<string>();
  const actorIds = new Set<string>();
  for (const log of logs) {
    const applicationId = text(meta(log.metadata).applicationId);
    if (applicationId) applicationIds.add(applicationId);
    if (log.targetType === "application") applicationIds.add(log.targetId);
    if (log.targetType === "talentProfile") profileIds.add(log.targetId);
    if (log.actorId) actorIds.add(log.actorId);
  }
  const [applications, profiles, actors, applied] = await Promise.all([
    db.application.findMany({
      where: { id: { in: [...applicationIds] }, job: { organizationId: ctx.organizationId } },
      select: {
        id: true,
        profileId: true,
        job: { select: { title: true } },
        profile: { select: { user: { select: { name: true } } } },
      },
    }),
    db.talentProfile.findMany({
      where: { id: { in: [...profileIds] } },
      select: { id: true, visibility: true, user: { select: { name: true } } },
    }),
    db.user.findMany({ where: { id: { in: [...actorIds] } }, select: { id: true, name: true } }),
    // A talent who applied to the organization is known by name; otherwise an anonymous profile
    // stays anonymous here too.
    db.application.findMany({
      where: { profileId: { in: [...profileIds] }, job: { organizationId: ctx.organizationId } },
      select: { profileId: true },
      distinct: ["profileId"],
    }),
  ]);
  const applicationOf = new Map(applications.map((item) => [item.id, item]));
  const profileOf = new Map(profiles.map((item) => [item.id, item]));
  const actorOf = new Map(actors.map((item) => [item.id, item.name]));
  const known = new Set(applied.map((item) => item.profileId));

  const rows: JournalRow[] = logs.map((log) => {
    const data = meta(log.metadata);
    const application = applicationOf.get(
      text(data.applicationId) ?? (log.targetType === "application" ? log.targetId : ""),
    );
    const profile = log.targetType === "talentProfile" ? profileOf.get(log.targetId) : undefined;
    const search = data.source === "talent_search";
    let kind: JournalKind = JOURNAL_ACTIONS[log.action as keyof typeof JOURNAL_ACTIONS];
    if (kind === "profile" && search) kind = "profileVisible";
    const anonymous =
      !application && !!profile && profile.visibility === "anonymous" && !known.has(profile.id);
    const person =
      log.action === "report.export" || anonymous
        ? null
        : (application?.profile.user.name ?? profile?.user.name ?? null);
    let object: JournalRow["object"] = null;
    let href: string | null = null;
    if (application) {
      object = { kind: "job", title: application.job.title };
      href = `/app/hire/candidats/${application.id}`;
    } else if (log.action === "report.export") {
      object = { kind: "report" };
      href = "/app/hire/rapports";
    } else if (profile) {
      object = { kind: "search" };
      href = `/app/hire/talents/${profile.id}`;
    }
    return {
      id: log.id,
      at: log.createdAt,
      actorId: log.actorId,
      actorName: (log.actorId && actorOf.get(log.actorId)) || "",
      kind,
      person,
      anonymous,
      object,
      href,
    };
  });

  return {
    member,
    members: members.map((item) => ({ userId: item.userId, name: item.user.name })),
    rows,
  };
}
