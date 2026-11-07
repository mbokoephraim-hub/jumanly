/**
 * Demo talents worth showing (évaluation talent, Ephraïm 07/11/2026), local and preview only:
 * - every demo CV left empty is filled from its profile (Grâce's « Mon CV (fictif) » scored 7 %);
 * - talent.pro gets a CV, an application and a message from the recruiter;
 * - Jean-Pierre's application gets a message from the recruiter (« Écrire à … » on its page).
 * Every person, company and word here is fictional (CLAUDE.md § 11). Runs after the UX scenario.
 */
import { freezeApplicationMatch } from "../../src/server/matching/service";
import { defaultStages } from "../../src/server/services/applications";
import { cvFromProfile, isEmptyCv, parseCv } from "../../src/server/services/cv";
import { getFullProfile } from "../../src/server/services/profile";
import type { PrismaClient } from "../../src/generated/prisma/client";
import type { SeedClient } from "./client";

const HOUR = 3_600_000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR);

/** Kivu Logistique (fictive) and its recruiter, used by no other demo journey. */
const JOB = "ux-assistant-logistique-goma";
const RECRUITER = "recruteur3.ux@jumanly.test";

async function fillEmptyCvs(db: SeedClient) {
  const cvs = await db.document.findMany({
    where: {
      kind: "cv",
      fileKey: null,
      // The demo accounts of the seed only, never the accounts the e2e tests create.
      profile: {
        user: {
          OR: [
            { email: { endsWith: ".ux@jumanly.test" } },
            { email: { in: ["talent.pro@jumanly.test", "talent.starter@jumanly.test"] } },
          ],
        },
      },
    },
    select: { id: true, content: true, profile: { select: { userId: true } } },
  });
  let filled = 0;
  for (const cv of cvs) {
    if (!isEmptyCv(parseCv(cv.content))) continue;
    const profile = await getFullProfile(db as unknown as PrismaClient, cv.profile.userId);
    await db.document.update({ where: { id: cv.id }, data: { content: cvFromProfile(profile) } });
    filled += 1;
  }
  return filled;
}

/** The application of `email` to the Goma offer, created once, with a message from the recruiter. */
async function applicationWithMessage(db: SeedClient, email: string, body: string) {
  const [talent, recruiter, job] = await Promise.all([
    db.user.findUnique({ where: { email }, select: { id: true } }),
    db.user.findUnique({ where: { email: RECRUITER }, select: { id: true } }),
    db.job.findUnique({ where: { slug: JOB }, select: { id: true, organizationId: true } }),
  ]);
  if (!talent || !recruiter || !job) return;
  const profile = await db.talentProfile.findUnique({
    where: { userId: talent.id },
    select: { id: true },
  });
  if (!profile) return;
  if ((await db.pipelineStage.count({ where: { jobId: job.id } })) === 0)
    await db.pipelineStage.createMany({
      data: defaultStages.map((stage, order) => ({ jobId: job.id, order, ...stage })),
    });
  let application = await db.application.findUnique({
    where: { jobId_profileId: { jobId: job.id, profileId: profile.id } },
    select: { id: true },
  });
  if (!application) {
    const stage = await db.pipelineStage.findFirstOrThrow({
      where: { jobId: job.id, kind: "screening" },
    });
    application = await db.application.create({
      data: {
        jobId: job.id,
        profileId: profile.id,
        stageId: stage.id,
        createdAt: ago(30),
        viewedAt: ago(20),
        events: { create: { type: "submitted", createdAt: ago(30) } },
      },
      select: { id: true },
    });
    await freezeApplicationMatch(db as unknown as PrismaClient, application.id);
  }
  const conversation = await db.conversation.upsert({
    where: { applicationId: application.id },
    update: {},
    create: {
      kind: "application",
      applicationId: application.id,
      organizationId: job.organizationId,
      talentUserId: talent.id,
    },
  });
  // Seeded again on each run: one message from the recruiter, unread.
  await db.message.deleteMany({ where: { conversationId: conversation.id } });
  await db.message.create({
    data: { conversationId: conversation.id, senderId: recruiter.id, body, createdAt: ago(5) },
  });
  await db.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: ago(5) },
  });
}

export async function seedDemoTalents(db: SeedClient) {
  // talent.pro had no CV at all: a primary one, filled from the profile just below.
  const pro = await db.talentProfile.findFirst({
    where: { user: { email: "talent.pro@jumanly.test" } },
    select: { id: true },
  });
  if (pro && (await db.document.count({ where: { profileId: pro.id, kind: "cv" } })) === 0)
    await db.document.create({
      data: { profileId: pro.id, kind: "cv", title: "Mon CV (fictif)", isPrimary: true },
    });
  const filled = await fillEmptyCvs(db);

  await applicationWithMessage(
    db,
    "talent.pro@jumanly.test",
    "Bonjour, merci pour votre candidature. Êtes-vous disponible pour un court appel cette semaine ? (message fictif)",
  );
  await applicationWithMessage(
    db,
    "jeanpierre.ux@jumanly.test",
    "Bonjour Jean-Pierre, votre parcours dans le commerce nous intéresse. Pouvez-vous nous dire quand vous seriez disponible ? (message fictif)",
  );
  console.log(
    `Démo talents : ${filled} CV remplis depuis le profil, talent.pro et Jean-Pierre avec un message.`,
  );
}
