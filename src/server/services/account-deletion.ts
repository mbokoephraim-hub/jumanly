/**
 * « Supprimer mon compte » (Ephraïm, 22/10/2026): no grace period, nothing kept. The account row is
 * deleted, and with it (database cascades) the profile, CVs, documents, applications, posts,
 * connections, notifications and history. What the cascades do not reach (rows keyed by a subject,
 * the messages sent, the conversations held with recruiters) is deleted first. The e-mail address is then free: signing up again with it
 * starts from zero, as a new person.
 *
 * Kept, without any link to a person: payments and invoices (accounting obligations, partie 09)
 * and the journal entry saying an account was deleted.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { invalidate } from "@/server/entitlements";

export class AccountDeletionError extends Error {
  constructor(public readonly code: "owner" | "notFound") {
    super(code);
  }
}

type Tx = Prisma.TransactionClient;

/** Rows keyed by a subject (no foreign key): plans, counters, overrides, billing details. */
async function eraseSubject(tx: Tx, subjectType: "user" | "organization", subjectId: string) {
  const subscriptions = await tx.subscription.findMany({
    where: { subjectType, subjectId },
    select: { id: true },
  });
  const ids = subscriptions.map((row) => row.id);
  if (ids.length > 0) {
    await tx.payment.updateMany({
      where: { subscriptionId: { in: ids } },
      data: { subscriptionId: null },
    });
    await tx.subscription.deleteMany({ where: { id: { in: ids } } });
  }
  await tx.usageCounter.deleteMany({ where: { subjectType, subjectId } });
  await tx.entitlementOverride.deleteMany({ where: { subjectType, subjectId } });
  await tx.billingDetails.deleteMany({ where: { subjectType, subjectId } });
}

/**
 * The organizations the person owns and that go with the account: those where nobody else works
 * and that never published an offer (a recruiter space opened from a talent account and left
 * empty). Any other organization must be handed over first (`owner`).
 */
export async function ownedOrganizations(db: PrismaClient | Tx, userId: string) {
  const owned = await db.membership.findMany({
    where: { userId, role: "org_owner", status: "active" },
    select: {
      organization: {
        select: {
          id: true,
          name: true,
          _count: { select: { jobs: true, entities: true } },
          memberships: {
            where: { status: "active", userId: { not: userId } },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });
  const erasable: string[] = [];
  let blocking: { id: string; name: string } | null = null;
  for (const { organization } of owned) {
    const empty =
      organization.memberships.length === 0 &&
      organization._count.jobs === 0 &&
      organization._count.entities === 0;
    if (empty) erasable.push(organization.id);
    else blocking ??= { id: organization.id, name: organization.name };
  }
  return { erasable, blocking };
}

export async function eraseAccount(db: PrismaClient, userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) throw new AccountDeletionError("notFound");
  const { erasable, blocking } = await ownedOrganizations(db, userId);
  if (blocking) throw new AccountDeletionError("owner");
  const profile = await db.talentProfile.findUnique({ where: { userId }, select: { id: true } });

  await db.$transaction(async (tx) => {
    for (const orgId of erasable) {
      await eraseSubject(tx, "organization", orgId);
      await tx.organization.delete({ where: { id: orgId } });
    }
    await eraseSubject(tx, "user", userId);
    if (profile) {
      await tx.embedding.deleteMany({ where: { subjectType: "profile", subjectId: profile.id } });
    }
    await tx.message.deleteMany({ where: { senderId: userId } });
    // The conversations held as the talent (with recruiters): nobody is left to answer.
    await tx.conversation.deleteMany({ where: { talentUserId: userId } });
    await tx.verification.deleteMany({ where: { identifier: { contains: user.email } } });
    await tx.user.delete({ where: { id: userId } });
    await tx.auditLog.create({
      data: { actorId: null, action: "user.erase", targetType: "user", targetId: userId },
    });
  });
  invalidate({ type: "user", id: userId });
  for (const id of erasable) invalidate({ type: "organization", id });
}
