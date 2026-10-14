import { randomUUID } from "node:crypto";
import { createSeedClient } from "../../prisma/seed/client";

export const db = createSeedClient();

/** A throwaway account, removed with everything attached to it by `cleanup`. */
export async function newUser(createdAt = new Date()) {
  return db.user.create({
    data: {
      email: `test-${randomUUID()}@jumanly.test`,
      name: "Test Fictif",
      emailVerified: true,
      createdAt,
    },
  });
}

export async function newOrganization(type: "recruiter" | "company" | "partner") {
  const slug = `test-${randomUUID()}`;
  return db.organization.create({ data: { type, name: "Organisation test", slug } });
}

export async function cleanup(userIds: string[], orgIds: string[] = []) {
  const subjects = [...userIds, ...orgIds];
  await db.invoice.deleteMany({ where: { subjectId: { in: subjects } } });
  await db.billingDetails.deleteMany({ where: { subjectId: { in: subjects } } });
  await db.payment.deleteMany({ where: { subjectId: { in: subjects } } });
  await db.subscription.deleteMany({ where: { subjectId: { in: subjects } } });
  await db.usageCounter.deleteMany({ where: { subjectId: { in: subjects } } });
  await db.entitlementOverride.deleteMany({ where: { subjectId: { in: subjects } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.organization.deleteMany({ where: { id: { in: orgIds } } });
}
