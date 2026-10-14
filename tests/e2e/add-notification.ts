/**
 * Test helper run with tsx (Playwright cannot load the Prisma client): gives a notification to an
 * account, as if something had just happened. `tsx tests/e2e/add-notification.ts <email> <type> <payload JSON> <href>`
 */
import { createSeedClient } from "../../prisma/seed/client";

const [email, type, payload, href] = process.argv.slice(2);
const db = createSeedClient();

async function main() {
  const user = await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } });
  await db.notification.create({
    data: { userId: user.id, type: type!, payload: JSON.parse(payload ?? "{}"), href },
  });
}

main().finally(() => db.$disconnect());
