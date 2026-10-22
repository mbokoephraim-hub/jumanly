/**
 * Suivi, candidature, messages and notifications of the mobile redesign (docs/refonte-mobile/talent-2),
 * for Grâce of the UX scenario (local and preview only, CLAUDE.md § 11). Every company, person and
 * message is fictional. Runs after `seedUxScenario`, once: an application of Grâce to Baobab
 * Fintech with an interview means it already ran.
 */
import { freezeApplicationMatch } from "../../src/server/matching/service";
import { defaultStages } from "../../src/server/services/applications";
import type { Prisma, StageKind } from "../../src/generated/prisma/client";
import type { SeedClient } from "./client";

const day = 86_400_000;
const hour = 3_600_000;
const ago = (days: number) => new Date(Date.now() - days * day);
const TZ = "Africa/Kinshasa";

/** A day from now at a Kinshasa hour (UTC + 1). */
function slot(days: number, kinshasaHour: number, minutes = 0) {
  const date = new Date(Date.now() + days * day);
  date.setUTCHours(kinshasaHour - 1, minutes, 0, 0);
  return date;
}

type Plan = {
  job: string;
  kind: StageKind;
  status?: "active" | "withdrawn" | "rejected";
  sentDaysAgo: number;
  viewedDaysAgo?: number;
  movedDaysAgo?: number;
};

const plans: Plan[] = [
  {
    job: "ux-analyste-donnees-junior-kinshasa",
    kind: "interview",
    sentDaysAgo: 3,
    viewedDaysAgo: 2,
    movedDaysAgo: 1,
  },
  {
    job: "ux-analyste-energie-solaire-kinshasa",
    kind: "screening",
    sentDaysAgo: 5,
    viewedDaysAgo: 4,
    movedDaysAgo: 3,
  },
  { job: "ux-chargee-etudes-marketing-kinshasa", kind: "new", sentDaysAgo: 5, viewedDaysAgo: 0.1 },
  {
    job: "ux-analyste-credit-abidjan",
    kind: "rejected",
    status: "rejected",
    sentDaysAgo: 12,
    viewedDaysAgo: 10,
    movedDaysAgo: 7,
  },
  {
    job: "ux-assistant-logistique-goma",
    kind: "new",
    status: "withdrawn",
    sentDaysAgo: 20,
    viewedDaysAgo: 18,
  },
];

export async function seedSuiviScenario(db: SeedClient) {
  const grace = await db.user.findUnique({
    where: { email: "grace.ux@jumanly.test" },
    select: { id: true, talentProfile: { select: { id: true } } },
  });
  const profileId = grace?.talentProfile?.id;
  if (!grace || !profileId) return;
  const baobab = await db.job.findUnique({
    where: { slug: plans[0]!.job },
    select: { id: true },
  });
  if (!baobab) return;
  const done = await db.interview.count({
    where: { application: { jobId: baobab.id, profileId } },
  });
  if (done > 0) return;

  const certificate = await db.certificate.findFirst({
    where: { enrollment: { userId: grace.id }, revokedAt: null },
    select: { code: true, courseTitle: true, issuedAt: true },
  });
  const ids: Record<string, string> = {};
  for (const plan of plans) {
    const job = await db.job.findUnique({
      where: { slug: plan.job },
      select: { id: true, organizationId: true, stages: true },
    });
    if (!job) continue;
    if (job.stages.length === 0)
      await db.pipelineStage.createMany({
        data: defaultStages.map((stage, order) => ({ jobId: job.id, order, ...stage })),
      });
    const stages = await db.pipelineStage.findMany({ where: { jobId: job.id } });
    const stage = stages.find((item) => item.kind === plan.kind)!;
    const first = stages.find((item) => item.kind === "new")!;
    const events: Prisma.ApplicationEventCreateWithoutApplicationInput[] = [
      { type: "submitted", createdAt: ago(plan.sentDaysAgo) },
    ];
    if (plan.viewedDaysAgo !== undefined)
      events.push({ type: "viewed", createdAt: ago(plan.viewedDaysAgo) });
    if (plan.movedDaysAgo !== undefined)
      events.push({
        type: plan.kind === "rejected" ? "decision" : "stage_changed",
        payload: { from: first.name, to: stage.name, toKind: stage.kind },
        createdAt: ago(plan.movedDaysAgo),
      });
    if (plan.status === "withdrawn") events.push({ type: "withdrawn", createdAt: ago(15) });
    const data = {
      stageId: stage.id,
      status: plan.status ?? ("active" as const),
      createdAt: ago(plan.sentDaysAgo),
      viewedAt: plan.viewedDaysAgo !== undefined ? ago(plan.viewedDaysAgo) : null,
      coverLetter:
        "Madame, Monsieur, votre offre correspond à ce que j'ai appris en formation. Lettre fictive, pour la démonstration.",
      attachments:
        plan.kind === "interview" && certificate
          ? [
              {
                type: "certificate",
                code: certificate.code,
                title: certificate.courseTitle,
                issuedAt: certificate.issuedAt.toISOString(),
              },
            ]
          : [],
    };
    const existing = await db.application.findUnique({
      where: { jobId_profileId: { jobId: job.id, profileId } },
      select: { id: true },
    });
    if (existing) {
      await db.applicationEvent.deleteMany({ where: { applicationId: existing.id } });
      await db.application.update({
        where: { id: existing.id },
        data: { ...data, events: { create: events } },
      });
      ids[plan.job] = existing.id;
    } else {
      const created = await db.application.create({
        data: { jobId: job.id, profileId, ...data, events: { create: events } },
      });
      await freezeApplicationMatch(db, created.id);
      ids[plan.job] = created.id;
    }
  }

  // Baobab Fintech: an invitation with three slots, a message, a document asked for.
  const baobabApplication = ids[plans[0]!.job];
  const recruiter = await db.user.findUnique({
    where: { email: "recruteur6.ux@jumanly.test" },
    select: { id: true },
  });
  const org = await db.organization.findUnique({
    where: { slug: "ux-baobab-fintech-fictive" },
    select: { id: true },
  });
  if (baobabApplication && recruiter && org) {
    const interview = await db.interview.create({
      data: {
        organizationId: org.id,
        applicationId: baobabApplication,
        organizerId: recruiter.id,
        mode: "video",
        durationMinutes: 45,
        slots: [slot(3, 10), slot(3, 14, 30), slot(4, 9)],
        timezone: TZ,
        link: "https://visio.exemple.test/baobab-demo",
        message: "Entretien fictif de démonstration.",
      },
    });
    const conversation = await db.conversation.upsert({
      where: { applicationId: baobabApplication },
      update: {},
      create: {
        kind: "application",
        applicationId: baobabApplication,
        organizationId: org.id,
        talentUserId: grace.id,
      },
    });
    const at = (hours: number) => new Date(Date.now() - hours * hour);
    // Seeded again on each run: only the latest invitation stays in the conversation.
    await db.message.deleteMany({ where: { conversationId: conversation.id } });
    await db.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          senderId: recruiter.id,
          body: "Bonjour Grâce, votre profil nous intéresse. Voici trois créneaux pour un entretien en visio. (message fictif)",
          createdAt: at(3),
        },
        {
          conversationId: conversation.id,
          senderId: recruiter.id,
          kind: "invitation",
          body: "Entretien en visio, 45 min.",
          payload: { interviewId: interview.id },
          createdAt: at(2.9),
        },
        {
          conversationId: conversation.id,
          senderId: recruiter.id,
          kind: "document_request",
          body: "Copie du diplôme",
          payload: { name: "Copie du diplôme", due: new Date(Date.now() + 6 * day).toISOString() },
          createdAt: at(2.8),
        },
      ],
    });
    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: at(2.8) },
    });
  }

  // Mwinda Énergie: a question, read yesterday.
  const mwindaApplication = ids[plans[1]!.job];
  const mwindaRecruiter = await db.user.findUnique({
    where: { email: "recruteur7.ux@jumanly.test" },
    select: { id: true },
  });
  const mwinda = await db.organization.findUnique({
    where: { slug: "ux-mwinda-energie-fictive" },
    select: { id: true },
  });
  if (mwindaApplication && mwindaRecruiter && mwinda) {
    const conversation = await db.conversation.upsert({
      where: { applicationId: mwindaApplication },
      update: {},
      create: {
        kind: "application",
        applicationId: mwindaApplication,
        organizationId: mwinda.id,
        talentUserId: grace.id,
      },
    });
    // Seeded again on each run: the question stays alone.
    await db.message.deleteMany({ where: { conversationId: conversation.id } });
    await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: mwindaRecruiter.id,
        body: "Pouvez-vous envoyer votre attestation de formation ? (message fictif)",
        createdAt: ago(1),
      },
    });
    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: ago(1) },
    });
    await db.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conversation.id, userId: grace.id } },
      update: { lastReadAt: ago(0.5) },
      create: { conversationId: conversation.id, userId: grace.id, lastReadAt: ago(0.5) },
    });
  }

  // Notifications, as the events above would have sent them.
  await db.notification.createMany({
    data: [
      {
        userId: grace.id,
        type: "interviewInvite",
        payload: {
          company: "Baobab Fintech (entreprise fictive)",
          jobTitle: "Analyste de données junior (démo)",
        },
        href: baobabApplication ? `/app/suivi/${baobabApplication}` : "/app/suivi",
        createdAt: new Date(Date.now() - 2.9 * hour),
      },
      {
        userId: grace.id,
        type: "profileViewed",
        payload: {
          company: "Fleuve Banque (entreprise fictive)",
          jobTitle: "Chargée d'études marketing (démo)",
        },
        href: ids[plans[2]!.job] ? `/app/suivi/${ids[plans[2]!.job]}` : "/app/suivi",
        createdAt: new Date(Date.now() - 2.4 * hour),
      },
      {
        userId: grace.id,
        type: "statusChange",
        payload: {
          company: "Mwinda Énergie (entreprise fictive)",
          jobTitle: "Analyste énergie solaire (démo)",
          stage: "Présélection",
        },
        href: mwindaApplication ? `/app/suivi/${mwindaApplication}` : "/app/suivi",
        readAt: ago(2),
        createdAt: ago(3),
      },
      {
        userId: grace.id,
        type: "documentRequest",
        payload: {
          company: "Baobab Fintech (entreprise fictive)",
          documentName: "Copie du diplôme",
        },
        href: baobabApplication ? `/app/suivi/${baobabApplication}#demandes` : "/app/suivi",
        readAt: ago(0.05),
        createdAt: ago(4),
      },
    ],
  });
}
