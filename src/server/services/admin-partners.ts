/**
 * Admin side of Jumanly Partners (Admin v2, étape 8): change a partner, change or extend a licence
 * batch, and the sheet of one batch (codes used, left and expired, then the aggregated impact).
 *
 * Every change carries a reason, kept in the audit log. The sheet follows the privacy rule of the
 * partner space: figures about people are hidden below the batch threshold (10 at least).
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { invalidate } from "@/server/entitlements";
import {
  batchStatus,
  impactReport,
  licenseEnd,
  PartnerError,
  partnerKinds,
} from "@/server/services/partners";

const reasonField = z.string().trim().min(3).max(500);

/** « 1 250,50 » or « 1250.5 » → cents; empty → no amount. */
const amountField = z
  .string()
  .trim()
  .default("")
  .transform((value) =>
    value ? Math.round(Number(value.replace(/\s/g, "").replace(",", ".")) * 100) : null,
  )
  .refine((value) => value === null || (Number.isFinite(value) && value >= 0));

/** The reason of a sensitive change: at least 3 characters (the action asks again when missing). */
export function readReason(value: unknown) {
  const parsed = reasonField.safeParse(typeof value === "string" ? value : "");
  return parsed.success ? parsed.data : null;
}

const partnerUpdateSchema = z.object({
  partnerId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  kind: z.enum(partnerKinds),
  reason: reasonField,
});

/** Name and kind of a partner organization. */
export async function updatePartner(
  db: PrismaClient,
  actorId: string,
  raw: Record<string, unknown>,
) {
  const input = partnerUpdateSchema.safeParse(raw);
  if (!input.success) throw new PartnerError("invalid");
  const partner = await db.organization.findFirst({
    where: { id: input.data.partnerId, type: "partner" },
    select: { id: true, name: true, partnerKind: true },
  });
  if (!partner) throw new PartnerError("notFound");
  await db.organization.update({
    where: { id: partner.id },
    data: { name: input.data.name, partnerKind: input.data.kind },
  });
  await db.auditLog.create({
    data: {
      actorId,
      action: "partner.update",
      targetType: "organization",
      targetId: partner.id,
      organizationId: partner.id,
      metadata: {
        before: { name: partner.name, kind: partner.partnerKind },
        after: { name: input.data.name, kind: input.data.kind },
        reason: input.data.reason,
      },
    },
  });
  return partner;
}

const batchUpdateSchema = z.object({
  batchId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  contractRef: z.string().trim().max(80).default(""),
  amount: amountField,
  /** Only while the batch has not started. */
  startsAt: z.union([z.literal(""), z.coerce.date()]).default(""),
  reason: reasonField,
});

/**
 * Name and contract of a batch (reference, amount). Its start moves only while it has not started
 * and no licence is active; its end only moves later, through `extendBatch`.
 */
export async function updateBatch(
  db: PrismaClient,
  actorId: string,
  raw: Record<string, unknown>,
  now = new Date(),
) {
  const input = batchUpdateSchema.safeParse(raw);
  if (!input.success) throw new PartnerError("invalid");
  const batch = await db.licenseBatch.findUnique({ where: { id: input.data.batchId } });
  if (!batch) throw new PartnerError("notFound");
  const { startsAt } = input.data;
  let start = batch.startsAt;
  if (startsAt instanceof Date && startsAt.getTime() !== batch.startsAt.getTime()) {
    const activated = await db.license.count({
      where: { batchId: batch.id, activatedAt: { not: null } },
    });
    if (batch.startsAt <= now || activated > 0 || startsAt >= batch.endsAt)
      throw new PartnerError("batchClosed");
    start = startsAt;
  }
  const data = {
    name: input.data.name,
    contractRef: input.data.contractRef || null,
    priceCents: input.data.amount,
    startsAt: start,
  };
  await db.licenseBatch.update({ where: { id: batch.id }, data });
  await db.auditLog.create({
    data: {
      actorId,
      action: "partner.batch.update",
      targetType: "licenseBatch",
      targetId: batch.id,
      organizationId: batch.partnerOrgId,
      metadata: {
        before: {
          name: batch.name,
          contractRef: batch.contractRef,
          priceCents: batch.priceCents,
          startsAt: batch.startsAt.toISOString(),
        },
        after: { ...data, startsAt: start.toISOString() },
        reason: input.data.reason,
      },
    },
  });
  return batch;
}

const extendSchema = z.object({
  batchId: z.string().min(1),
  endsAt: z.coerce.date(),
  reason: reasonField,
});

/**
 * Extends a batch: a later end of contract. The running licences that stopped at the old end now
 * run to their full length, within the new end; unused codes that expired with the contract can
 * be used again. Licences already over are not reopened.
 */
export async function extendBatch(
  db: PrismaClient,
  actorId: string,
  raw: Record<string, unknown>,
  now = new Date(),
) {
  const input = extendSchema.safeParse(raw);
  if (!input.success) throw new PartnerError("invalid");
  const batch = await db.licenseBatch.findUnique({ where: { id: input.data.batchId } });
  if (!batch) throw new PartnerError("notFound");
  const newEnd = input.data.endsAt;
  if (newEnd <= batch.endsAt || newEnd <= now) throw new PartnerError("invalid");

  const licences = await db.license.findMany({
    where: { batchId: batch.id, status: "active", subscriptionId: { not: null } },
    select: { subscriptionId: true },
  });
  const capped = await db.subscription.findMany({
    where: {
      id: { in: licences.flatMap((row) => (row.subscriptionId ? [row.subscriptionId] : [])) },
      status: "sponsored",
      currentPeriodEnd: batch.endsAt,
    },
    select: { id: true, subjectId: true, currentPeriodStart: true },
  });
  const reopened = await db.$transaction(async (tx) => {
    await tx.licenseBatch.update({ where: { id: batch.id }, data: { endsAt: newEnd } });
    for (const subscription of capped) {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          currentPeriodEnd: licenseEnd(subscription.currentPeriodStart, batch.months, newEnd),
        },
      });
    }
    const codes = await tx.license.updateMany({
      where: { batchId: batch.id, status: "expired", activatedAt: null, userId: null },
      data: { status: "available" },
    });
    return codes.count;
  });
  for (const subscription of capped) invalidate({ type: "user", id: subscription.subjectId });
  await db.auditLog.create({
    data: {
      actorId,
      action: "partner.batch.extend",
      targetType: "licenseBatch",
      targetId: batch.id,
      organizationId: batch.partnerOrgId,
      metadata: {
        from: batch.endsAt.toISOString(),
        to: newEnd.toISOString(),
        licences: capped.length,
        codes: reopened,
        reason: input.data.reason,
      },
    },
  });
  return { extended: capped.length, codes: reopened };
}

/**
 * Sheet of one batch: its contract, the codes (used, unused, revoked, expired), the seats left,
 * then the aggregated impact of its beneficiaries since the start, hidden below the threshold.
 */
export async function batchDetail(
  db: PrismaClient,
  actorId: string,
  batchId: string,
  now = new Date(),
) {
  const batch = await db.licenseBatch.findUnique({
    where: { id: batchId },
    include: { plan: { select: { name: true } }, partnerOrg: { select: { id: true, name: true } } },
  });
  if (!batch) return null;
  const [byStatus, activated] = await Promise.all([
    db.license.groupBy({ by: ["status"], where: { batchId }, _count: { _all: true } }),
    db.license.count({ where: { batchId, activatedAt: { not: null } } }),
  ]);
  const count = (status: string) => byStatus.find((row) => row.status === status)?._count._all ?? 0;
  const codes = {
    active: count("active"),
    unused: count("available"),
    revoked: count("revoked"),
    expired: count("expired"),
  };
  const distributed = codes.active + codes.unused + codes.expired;
  const available = Math.max(0, batch.seats - distributed);
  const impact = await impactReport(
    db,
    { userId: actorId, organizationId: batch.partnerOrgId },
    { batchId, from: new Date(0), to: now },
  );
  return {
    batch,
    status: batchStatus(batch, available, now),
    codes: { ...codes, activated, distributed, available },
    usedPercent: batch.seats ? Math.round((100 * activated) / batch.seats) : 0,
    impact,
  };
}
