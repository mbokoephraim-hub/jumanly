/**
 * E8 demo (local and preview only): a fictional group on Company Premium, with teams, a
 * department, two entities, a hiring manager, two talents visible in the talent pool, a pool and
 * an interview to answer. Everything is obviously fictional (CLAUDE.md § 11).
 */
import type { SeedClient } from "./client";

export const GROUP_SLUG = "demo-groupe-fictif";
const day = 86_400_000;

const stages = [
  { kind: "new", name: "Nouvelles candidatures" },
  { kind: "screening", name: "Présélection" },
  { kind: "interview", name: "Entretien" },
  { kind: "offer", name: "Proposition" },
  { kind: "hired", name: "Recruté" },
  { kind: "rejected", name: "Non retenu" },
] as const;

/** The organization itself, before the accounts that belong to it. */
export async function seedGroupOrganization(db: SeedClient) {
  await db.organization.upsert({
    where: { slug: GROUP_SLUG },
    // Each seed starts the verification over, so that the request can be shown again.
    update: { verificationStatus: "none", verifiedAt: null, verificationReason: null },
    create: {
      type: "company",
      name: "Groupe Démo (groupe fictif)",
      legalName: "Groupe Démo SA (fictif)",
      slug: GROUP_SLUG,
      description:
        "Groupe imaginaire utilisé pour la démonstration de Jumanly (équipes, entités, rapports). Il n'existe pas.",
      country: "RD Congo",
      city: "Kinshasa",
      sector: "Industrie",
      size: "250+",
      category: "company",
    },
  });
}

export async function seedGroup(db: SeedClient) {
  const now = new Date();
  const org = await db.organization.findUniqueOrThrow({ where: { slug: GROUP_SLUG } });
  const user = (email: string) => db.user.findUniqueOrThrow({ where: { email } });
  const [owner, manager, visible, anonymous] = await Promise.all([
    user("groupe@jumanly.test"),
    user("manager@jumanly.test"),
    user("talent.visible@jumanly.test"),
    user("talent.anonyme@jumanly.test"),
  ]);

  // Company Premium for the group (entities, custom reports, deep search).
  const plan = await db.plan.findUniqueOrThrow({ where: { code: "company_premium" } });
  await db.subscription.deleteMany({ where: { subjectType: "organization", subjectId: org.id } });
  await db.subscription.create({
    data: {
      subjectType: "organization",
      subjectId: org.id,
      planId: plan.id,
      status: "active",
      source: "admin",
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 365 * day),
    },
  });

  // Company Premium limits are set by contract: a fictional contract for the demo.
  const contract = {
    "org.seats": "30",
    "jobs.active.max": "100",
    "hire.talent_search.monthly": "2000",
    "hire.contact_requests.monthly": "500",
    "ai.credits.monthly": "2000",
  };
  await db.entitlementOverride.deleteMany({
    where: { subjectType: "organization", subjectId: org.id },
  });
  await db.entitlementOverride.createMany({
    data: Object.entries(contract).map(([key, value]) => ({
      subjectType: "organization" as const,
      subjectId: org.id,
      key,
      value,
      reason: "Démo : contrat fictif",
    })),
  });

  // Structure: two entities, a team and a department.
  await db.job.updateMany({
    where: { organizationId: org.id },
    data: { teamId: null, departmentId: null, entityId: null },
  });
  await db.membership.updateMany({ where: { organizationId: org.id }, data: { teamId: null } });
  await db.team.deleteMany({ where: { organizationId: org.id } });
  await db.orgEntity.deleteMany({ where: { organizationId: org.id, parentId: { not: null } } });
  await db.orgEntity.deleteMany({ where: { organizationId: org.id } });
  const head = await db.orgEntity.create({
    data: { organizationId: org.id, name: "Groupe Démo Kinshasa (fictif)", country: "CD" },
  });
  const branch = await db.orgEntity.create({
    data: {
      organizationId: org.id,
      name: "Filiale Démo Lubumbashi (fictive)",
      country: "CD",
      parentId: head.id,
    },
  });
  const team = await db.team.create({
    data: {
      organizationId: org.id,
      name: "Recrutement technique",
      kind: "team",
      leadId: owner.id,
      entityId: head.id,
    },
  });
  const department = await db.team.create({
    data: { organizationId: org.id, name: "Finance", kind: "department", entityId: branch.id },
  });
  await db.membership.updateMany({
    where: { organizationId: org.id, userId: { in: [owner.id, manager.id] } },
    data: { teamId: team.id },
  });

  // One open job, owned by the group owner, with the hiring manager in its hiring team.
  const jobData = {
    organizationId: org.id,
    title: "Analyste de données (poste fictif)",
    description:
      "Poste imaginaire de démonstration : analyse des ventes et tableaux de bord. Cette offre n'existe pas.",
    responsibilities: ["Préparer les tableaux de bord mensuels", "Fiabiliser les données de vente"],
    requirements: ["Deux ans d'expérience en analyse de données"],
    benefits: ["Avantages fictifs, pour la démonstration"],
    process: ["Étude de la candidature", "Entretien vidéo", "Réponse sous deux semaines"],
    contractType: "cdi" as const,
    city: "Kinshasa",
    country: "RD Congo",
    remote: "hybrid" as const,
    experienceMin: 2,
    languagesRequired: ["fr"],
    status: "published" as const,
    publishedAt: new Date(now.getTime() - 5 * day),
    closesAt: new Date(now.getTime() + 40 * day),
    assignedToId: owner.id,
    teamId: team.id,
    departmentId: department.id,
    entityId: head.id,
    scorecardTemplate: [
      { name: "Analyse de données", description: "Requêtes, nettoyage, indicateurs" },
      { name: "Communication", description: "Expliquer un résultat à un non-spécialiste" },
      { name: "Rigueur", description: "" },
    ],
  };
  const job = await db.job.upsert({
    where: { slug: "demo-groupe-analyste-donnees" },
    update: jobData,
    create: { slug: "demo-groupe-analyste-donnees", ...jobData },
  });
  await db.jobAssignment.deleteMany({ where: { jobId: job.id } });
  await db.jobAssignment.create({ data: { jobId: job.id, userId: manager.id } });
  if ((await db.pipelineStage.count({ where: { jobId: job.id } })) === 0)
    await db.pipelineStage.createMany({
      data: stages.map((stage, order) => ({ jobId: job.id, order, ...stage })),
    });
  const stage = await db.pipelineStage.findFirstOrThrow({
    where: { jobId: job.id, kind: "interview" },
  });

  // Two talents who chose to be found: one by name, one anonymous.
  const skills = await db.skill.findMany({
    where: {
      slug: { in: ["sql", "excel", "analyse-de-donnees", "power-bi", "communication-orale"] },
    },
    select: { id: true },
  });
  const profiles = [
    {
      user: visible,
      visibility: "recruiters" as const,
      headline: "Analyste de données junior (profil fictif)",
      summary: "Profil imaginaire de démonstration : tableaux de bord et analyses de ventes.",
      company: "Entreprise fictive A",
    },
    {
      user: anonymous,
      visibility: "anonymous" as const,
      headline: "Chargée d'études statistiques (profil fictif)",
      summary: "Profil imaginaire de démonstration, visible de façon anonyme.",
      company: "Institut fictif B",
    },
  ];
  for (const item of profiles) {
    const profile = await db.talentProfile.update({
      where: { userId: item.user.id },
      data: {
        headline: item.headline,
        summary: item.summary,
        visibility: item.visibility,
        availability: "open",
        desiredContracts: ["cdi"],
        desiredLocations: ["Kinshasa"],
        languages: [{ code: "fr", level: "native" }],
        completeness: 80,
      },
    });
    await db.profileSkill.deleteMany({ where: { profileId: profile.id } });
    await db.profileSkill.createMany({
      data: skills.map((skill) => ({ profileId: profile.id, skillId: skill.id, level: 3 })),
    });
    await db.experience.deleteMany({ where: { profileId: profile.id } });
    await db.experience.create({
      data: {
        profileId: profile.id,
        title: "Analyste (expérience fictive)",
        company: item.company,
        startDate: new Date(now.getTime() - 3 * 365 * day),
        description: "Expérience imaginaire, pour la démonstration.",
      },
    });
  }
  const visibleProfile = await db.talentProfile.findUniqueOrThrow({
    where: { userId: visible.id },
  });

  // The visible talent applied: an interview waits for their answer in the conversation.
  await db.application.deleteMany({ where: { jobId: job.id } });
  const application = await db.application.create({
    data: { jobId: job.id, profileId: visibleProfile.id, stageId: stage.id, viewedAt: now },
  });
  await db.applicationEvent.create({
    data: { applicationId: application.id, type: "submitted", createdAt: application.createdAt },
  });
  const conversation = await db.conversation.create({
    data: {
      kind: "application",
      applicationId: application.id,
      organizationId: org.id,
      talentUserId: visible.id,
    },
  });
  const tomorrow = new Date(now.getTime() + 2 * day);
  tomorrow.setUTCHours(9, 0, 0, 0);
  const interview = await db.interview.create({
    data: {
      organizationId: org.id,
      applicationId: application.id,
      organizerId: owner.id,
      mode: "video",
      durationMinutes: 45,
      slots: [tomorrow, new Date(tomorrow.getTime() + day)],
      timezone: "Africa/Kinshasa",
      link: "https://visio.example/demo-fictive",
      message: "Bonjour, entretien de démonstration (fictif). Merci de choisir un créneau.",
      participantIds: [manager.id],
    },
  });
  await db.message.create({
    data: {
      conversationId: conversation.id,
      senderId: owner.id,
      kind: "invitation",
      body: interview.message ?? "",
      payload: { interviewId: interview.id },
    },
  });

  // A shared pool with both talents.
  await db.talentPool.deleteMany({ where: { organizationId: org.id } });
  await db.talentPool.create({
    data: {
      organizationId: org.id,
      name: "Analystes data · Kinshasa (démo)",
      visibility: "org",
      ownerId: owner.id,
      entries: {
        create: (
          await db.talentProfile.findMany({
            where: { userId: { in: [visible.id, anonymous.id] } },
            select: { id: true },
          })
        ).map((profile) => ({ profileId: profile.id, addedById: owner.id })),
      },
    },
  });
  console.log("Démo E8 : 1 groupe fictif (Company Premium), équipes, entités, vivier, entretien.");
}
