/**
 * Test helper run with tsx (Playwright cannot load the Prisma client): copies the person's first
 * CV until they have `MAX_CVS` CVs. `tsx tests/e2e/fill-cvs.ts <email>`
 */
import { createSeedClient } from "../../prisma/seed/client";

/** `MAX_CVS` in src/server/services/cv.ts (not imported: it pulls in the app aliases). */
const MAX_CVS = 10;
const [email] = process.argv.slice(2);
const db = createSeedClient();

async function main() {
  const user = await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } });
  const cvs = await db.document.findMany({
    where: { kind: "cv", profile: { userId: user.id } },
    orderBy: { createdAt: "asc" },
  });
  const first = cvs[0]!;
  for (let index = cvs.length; index < MAX_CVS; index++) {
    await db.document.create({
      data: {
        profileId: first.profileId,
        kind: "cv",
        title: `${first.title} ${index + 1}`,
        templateId: first.templateId,
        content: first.content ?? {},
      },
    });
  }
}

void main().finally(() => db.$disconnect());
