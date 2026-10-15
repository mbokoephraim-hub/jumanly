/**
 * Admin side of the editable contents (`/admin/contenus`): when each text was changed, and the
 * history of the changes from the audit log.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { LOCALE } from "./contents";

/** When each replaced text was last changed (column « Modifié » of /admin/contenus). */
export async function overrideDates(db: PrismaClient, locale = LOCALE) {
  const rows = await db.contentBlock.findMany({
    where: { locale },
    select: { key: true, updatedAt: true },
  });
  return Object.fromEntries(rows.map((row) => [row.key, row.updatedAt])) as Record<string, Date>;
}

/**
 * Changes of the contents from the audit log, newest first: those of one item (`targetId`, such as
 * `faq.partners.q3` or a banner id) or of every content.
 */
export async function contentHistory(db: PrismaClient, targetId?: string, take = 5) {
  const rows = await db.auditLog.findMany({
    where: { targetType: "content", ...(targetId ? { targetId } : {}) },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, action: true, targetId: true, createdAt: true, actorId: true },
  });
  const ids = [...new Set(rows.flatMap((row) => (row.actorId ? [row.actorId] : [])))];
  const users = await db.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const names = new Map(users.map((user) => [user.id, user.name]));
  const total = targetId
    ? await db.auditLog.count({ where: { targetType: "content", targetId } })
    : rows.length;
  return {
    total,
    entries: rows.map((row) => ({
      ...row,
      actorName: (row.actorId && names.get(row.actorId)) || null,
    })),
  };
}
