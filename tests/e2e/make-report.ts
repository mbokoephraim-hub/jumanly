/**
 * Test helper run with tsx (Playwright cannot load the Prisma client): a fictional message from
 * a recruiter in a demo conversation, reported by the talent. Prints the message text.
 * `tsx tests/e2e/make-report.ts <talent email>`
 */
import { randomUUID } from "node:crypto";
import { createSeedClient } from "../../prisma/seed/client";

const [email] = process.argv.slice(2);
const db = createSeedClient();

async function main() {
  const talent = await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } });
  const conversation = await db.conversation.findFirstOrThrow({
    where: { talentUserId: talent.id, organizationId: { not: null } },
    select: { id: true, organizationId: true },
  });
  const sender = await db.membership.findFirst({
    where: { organizationId: conversation.organizationId! },
    select: { userId: true },
  });
  const body = `Message fictif à modérer ${randomUUID().slice(0, 6)}`;
  const message = await db.message.create({
    data: { conversationId: conversation.id, senderId: sender?.userId ?? null, body },
  });
  await db.report.create({
    data: {
      reporterId: talent.id,
      targetType: "message",
      targetId: message.id,
      reason: "harassment",
      details: "Signalement fictif de test.",
    },
  });
  process.stdout.write(body);
}

main().finally(() => db.$disconnect());
