/**
 * Jumanly Admin v2 · journal d'audit (docs/admin-v2/PLAN-ADMIN.md, étape 1): reading `AuditLog`
 * with filters, the history of one target, and the link from an entry to its admin page.
 * Writing stays where each action happens.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

export const AUDIT_PAGE_SIZE = 50;
export const AUDIT_PERIODS = [1, 7, 30, 90] as const;
export type AuditPeriod = (typeof AUDIT_PERIODS)[number];

/** Families of actions shown in the filter, by the first segment of the action code. */
export const AUDIT_FAMILIES = [
  "user",
  "org",
  "plan",
  "payment",
  "subscription",
  "course",
  "certificate",
  "job",
  "report",
  "partner",
  "license",
  "matching",
  "match",
  "content",
  "profile",
  "talent",
  "security",
  "cost",
  "admin",
] as const;
export type AuditFamily = (typeof AUDIT_FAMILIES)[number];

/** Target types an entry can point to, in the filter. */
export const AUDIT_TARGETS = [
  "user",
  "organization",
  "plan",
  "subscription",
  "payment",
  "course",
  "certificate",
  "job",
  "report",
  "license",
  "matchDispute",
  "content",
  "message",
] as const;
export type AuditTarget = (typeof AUDIT_TARGETS)[number];

export type AuditFilters = {
  /** Name or e-mail of the person who acted. */
  actor?: string;
  family?: AuditFamily;
  target?: AuditTarget;
  /** One precise target (« Voir dans le journal » from a card). */
  targetId?: string;
  period?: AuditPeriod;
  page?: number;
};

export function familyOf(action: string): AuditFamily | null {
  const head = action.split(".")[0] as AuditFamily;
  return (AUDIT_FAMILIES as readonly string[]).includes(head) ? head : null;
}

async function whereOf(
  db: PrismaClient,
  filters: AuditFilters,
  now: Date,
): Promise<Prisma.AuditLogWhereInput> {
  const and: Prisma.AuditLogWhereInput[] = [];
  if (filters.family) and.push({ action: { startsWith: `${filters.family}.` } });
  if (filters.target) and.push({ targetType: filters.target });
  if (filters.targetId) and.push({ targetId: filters.targetId });
  if (filters.period)
    and.push({ createdAt: { gte: new Date(now.getTime() - filters.period * 86_400_000) } });
  if (filters.actor) {
    const actors = await db.user.findMany({
      where: {
        OR: [
          { email: { contains: filters.actor, mode: "insensitive" } },
          { name: { contains: filters.actor, mode: "insensitive" } },
          { id: filters.actor },
        ],
      },
      select: { id: true },
      take: 50,
    });
    and.push({ actorId: { in: actors.map((actor) => actor.id) } });
  }
  return and.length ? { AND: and } : {};
}

export type AuditEntry = {
  id: string;
  action: string;
  family: AuditFamily | null;
  targetType: string;
  targetId: string;
  targetLabel: string | null;
  href: string | null;
  reason: string | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  /** Set when someone acted; `actor` is null when that account no longer exists. */
  actorId: string | null;
  actor: { id: string; name: string; email: string } | null;
};

/** The reason given for an action, whatever the field it was stored under. */
export function reasonOf(metadata: Prisma.JsonValue): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  for (const key of ["reason", "motif", "resolution", "note", "comment"]) {
    const value = (metadata as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** Names of the targets of a page of entries, and the admin page each one opens. */
async function describeTargets(db: PrismaClient, rows: { targetType: string; targetId: string }[]) {
  const ids = (type: string) => [
    ...new Set(rows.filter((row) => row.targetType === type).map((row) => row.targetId)),
  ];
  const [users, orgs, plans, courses, jobs] = await Promise.all([
    db.user.findMany({
      where: { id: { in: ids("user") } },
      select: { id: true, name: true, status: true },
    }),
    db.organization.findMany({
      where: { id: { in: ids("organization") } },
      select: { id: true, name: true },
    }),
    db.plan.findMany({
      where: { id: { in: ids("plan") } },
      select: { id: true, name: true, code: true },
    }),
    db.course.findMany({
      where: { id: { in: ids("course") } },
      select: { id: true, title: true },
    }),
    db.job.findMany({ where: { id: { in: ids("job") } }, select: { id: true, title: true } }),
  ]);
  const map = new Map<string, { label: string | null; href: string }>();
  for (const user of users)
    map.set(`user:${user.id}`, {
      // An anonymized account has no name left: the journal says « Compte ».
      label: user.status === "deleted" ? null : user.name,
      href: `/admin/utilisateurs?fiche=${user.id}`,
    });
  for (const org of orgs)
    map.set(`organization:${org.id}`, {
      label: org.name,
      href: `/admin/organisations?fiche=${org.id}`,
    });
  for (const plan of plans)
    map.set(`plan:${plan.id}`, { label: plan.name, href: `/admin/forfaits/${plan.code}` });
  for (const course of courses)
    map.set(`course:${course.id}`, { label: course.title, href: `/admin/formations/${course.id}` });
  for (const job of jobs)
    map.set(`job:${job.id}`, {
      label: job.title,
      href: `/admin/offres?onglet=toutes&id=${job.id}`,
    });
  return map;
}

function fallbackHref(targetType: string, targetId: string) {
  if (targetType === "payment") return `/admin/abonnements?paiement=${targetId}`;
  if (targetType === "subscription") return `/admin/abonnements?abonnement=${targetId}`;
  if (targetType === "matchDispute") return "/admin/ia?onglet=revisions";
  if (targetType === "content") return "/admin/contenus";
  if (targetType === "license") return "/admin/partenaires";
  if (targetType === "matchingWeights") return "/admin/ia?onglet=poids";
  return null;
}

async function toEntries(
  db: PrismaClient,
  rows: Awaited<ReturnType<PrismaClient["auditLog"]["findMany"]>>,
): Promise<AuditEntry[]> {
  const actorIds = [...new Set(rows.map((row) => row.actorId).filter(Boolean))] as string[];
  const [actors, targets] = await Promise.all([
    db.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, name: true, email: true },
    }),
    describeTargets(db, rows),
  ]);
  const byId = new Map(actors.map((actor) => [actor.id, actor]));
  return rows.map((row) => {
    const target = targets.get(`${row.targetType}:${row.targetId}`);
    return {
      id: row.id,
      action: row.action,
      family: familyOf(row.action),
      targetType: row.targetType,
      targetId: row.targetId,
      targetLabel: target?.label ?? null,
      href: target?.href ?? fallbackHref(row.targetType, row.targetId),
      reason: reasonOf(row.metadata),
      metadata: row.metadata,
      createdAt: row.createdAt,
      actorId: row.actorId,
      actor: row.actorId ? (byId.get(row.actorId) ?? null) : null,
    };
  });
}

/** One page of the journal, the newest first, with the total for the pager. */
export async function listAudit(db: PrismaClient, filters: AuditFilters, now = new Date()) {
  const where = await whereOf(db, filters, now);
  const page = Math.max(1, filters.page ?? 1);
  const [total, rows] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
    }),
  ]);
  return { total, page, pageSize: AUDIT_PAGE_SIZE, entries: await toEntries(db, rows) };
}

/** Every entry matching the filters (export), capped to keep the file reasonable. */
export async function exportAudit(db: PrismaClient, filters: AuditFilters, now = new Date()) {
  const where = await whereOf(db, filters, now);
  const rows = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10_000,
  });
  return toEntries(db, rows);
}

/** The last actions on one target (« Historique » of a card). */
export async function auditHistory(
  db: PrismaClient,
  targetType: string,
  targetId: string,
  limit = 10,
) {
  const rows = await db.auditLog.findMany({
    where: { targetType, targetId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return toEntries(db, rows);
}

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

/** The filters of the journal from the address (page and CSV export share them). */
export function readAuditFilters(
  params: Record<string, string | string[] | undefined>,
): AuditFilters {
  const family = AUDIT_FAMILIES.find((value) => value === params.action);
  const target = AUDIT_TARGETS.find((value) => value === params.cible);
  const period = AUDIT_PERIODS.find((value) => String(value) === params.periode);
  const actor = one(params.auteur).trim().slice(0, 120);
  const targetId = one(params.id).trim().slice(0, 80);
  return {
    family,
    target,
    period,
    actor: actor || undefined,
    targetId: targetId || undefined,
  };
}
