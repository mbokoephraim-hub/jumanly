/**
 * `/admin/abonnements` and the revenue indicators of `/admin` (partie 07, partie 09): who pays
 * what, the payments, manual refunds, and the figures the beta needs (partie 12, après E7).
 */
import { z } from "zod";
import type { PrismaClient, SubscriptionStatus } from "@/generated/prisma/client";
import { effectiveStatus } from "@/server/entitlements/periods";

const DAY_MS = 86_400_000;

export const subscriptionFilters = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "expired",
  "sponsored",
] as const;

/** The latest subscriptions with their holder's name, filtered by their status as of now. */
export async function listSubscriptions(
  db: PrismaClient,
  status: SubscriptionStatus | null,
  now = new Date(),
) {
  const rows = await db.subscription.findMany({
    include: {
      plan: { select: { name: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  const withStatus = rows.map((row) => ({ ...row, status: effectiveStatus(row, now) }));
  const filtered = status ? withStatus.filter((row) => row.status === status) : withStatus;
  return withHolders(db, filtered.slice(0, 100));
}

export async function recentPayments(db: PrismaClient) {
  const rows = await db.payment.findMany({
    include: { plan: { select: { name: true } }, invoice: { select: { id: true, number: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return withHolders(db, rows);
}

async function withHolders<T extends { subjectType: "user" | "organization"; subjectId: string }>(
  db: PrismaClient,
  rows: T[],
) {
  const userIds = rows.filter((row) => row.subjectType === "user").map((row) => row.subjectId);
  const orgIds = rows
    .filter((row) => row.subjectType === "organization")
    .map((row) => row.subjectId);
  const [users, orgs] = await Promise.all([
    db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    }),
    db.organization.findMany({ where: { id: { in: orgIds } }, select: { id: true, name: true } }),
  ]);
  return rows.map((row) => {
    const user = users.find((item) => item.id === row.subjectId);
    const org = orgs.find((item) => item.id === row.subjectId);
    return { ...row, holder: user ? [user.name, user.email].join(" · ") : (org?.name ?? "") };
  });
}

export const refundSchema = z.object({
  payment: z.string().min(1),
  reference: z.string().trim().min(1).max(120),
});

/**
 * A refund made with the provider, then recorded here (partie 09 § 9.2: manual at step E7).
 * The plan stays as it is: what follows a refund belongs to the terms of sale.
 */
export async function recordRefund(
  db: PrismaClient,
  actorId: string,
  input: z.infer<typeof refundSchema>,
  now = new Date(),
) {
  const moved = await db.payment.updateMany({
    where: { id: input.payment, status: "succeeded" },
    data: {
      status: "refunded",
      refundedAt: now,
      refundReference: input.reference,
      refundedById: actorId,
    },
  });
  if (moved.count === 0) return false;
  await db.auditLog.create({
    data: {
      actorId,
      action: "payment.refund",
      targetType: "payment",
      targetId: input.payment,
      metadata: { reference: input.reference },
    },
  });
  return true;
}

/**
 * Revenue figures over the last 30 days: cash received (refunds deducted), Free → paid
 * conversion of the accounts created in the period, renewal rate of the paid periods that ended
 * in it, and the AI spend.
 */
export async function revenueIndicators(db: PrismaClient, now = new Date()) {
  const since = new Date(now.getTime() - 30 * DAY_MS);
  const [received, refunded, newUsers, ended, ai] = await Promise.all([
    db.payment.aggregate({
      where: { status: { in: ["succeeded", "refunded"] }, paidAt: { gte: since } },
      _sum: { amountCents: true },
    }),
    db.payment.aggregate({
      where: { status: "refunded", refundedAt: { gte: since } },
      _sum: { amountCents: true },
    }),
    db.user.findMany({ where: { createdAt: { gte: since } }, select: { id: true } }),
    db.payment.findMany({
      where: { status: { in: ["succeeded", "refunded"] }, periodEnd: { gte: since, lte: now } },
      select: { subjectType: true, subjectId: true, periodEnd: true },
    }),
    db.aiUsage.aggregate({ where: { createdAt: { gte: since } }, _sum: { costMicroUsd: true } }),
  ]);
  const converted = newUsers.length
    ? await db.payment.groupBy({
        by: ["subjectId"],
        where: {
          subjectType: "user",
          subjectId: { in: newUsers.map((user) => user.id) },
          status: "succeeded",
        },
      })
    : [];
  let renewed = 0;
  for (const period of ended) {
    const next = await db.payment.findFirst({
      where: {
        subjectType: period.subjectType,
        subjectId: period.subjectId,
        status: "succeeded",
        periodStart: { gte: new Date(period.periodEnd.getTime() - DAY_MS) },
      },
      select: { id: true },
    });
    if (next) renewed++;
  }
  return {
    revenueCents: (received._sum.amountCents ?? 0) - (refunded._sum.amountCents ?? 0),
    conversion: newUsers.length ? Math.round((100 * converted.length) / newUsers.length) : null,
    renewal: ended.length ? Math.round((100 * renewed) / ended.length) : null,
    aiCostMicroUsd: ai._sum.costMicroUsd ?? 0,
  };
}
