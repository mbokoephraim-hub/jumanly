/**
 * Test helper run with tsx (Playwright cannot load the Prisma client): prints the id of the latest
 * application of a talent to an offer of the recruiter's organizations, to open its file directly.
 * `tsx tests/e2e/application-of.ts <recruiter e-mail> <talent e-mail>`.
 */
import { createSeedClient } from "../../prisma/seed/client";

const [recruiter, talent] = process.argv.slice(2);
const db = createSeedClient();

async function main() {
  if (!recruiter || !talent) throw new Error("e-mails manquants");
  const owner = await db.user.findUniqueOrThrow({ where: { email: recruiter.toLowerCase() } });
  const memberships = await db.membership.findMany({ where: { userId: owner.id } });
  const person = await db.user.findUniqueOrThrow({ where: { email: talent.toLowerCase() } });
  const application = await db.application.findFirstOrThrow({
    where: {
      profile: { userId: person.id },
      job: { organizationId: { in: memberships.map((membership) => membership.organizationId) } },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  process.stdout.write(application.id);
}

main().finally(() => db.$disconnect());
