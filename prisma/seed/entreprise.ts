/**
 * Étape 3 (espace administrateur d'entreprise, A2): the team of Baobab Fintech (entreprise
 * fictive) seen by its administrator. Two managers with their rights, tasks in every state, an
 * invitation waiting, a join request and two people who say they work there. Local and preview
 * only (CLAUDE.md § 11); everything is rebuilt on each run, so a run of the e2e can be replayed.
 */
import { hashPassword } from "better-auth/crypto";
import { Prisma } from "../../src/generated/prisma/client";
import { addMonths, periodAround } from "../../src/server/entitlements/periods";
import { rolePreset } from "../../src/server/services/org-team";
import type { SeedClient } from "./client";
import { DEMO_PASSWORD } from "./accounts";

const day = 86_400_000;
const at = (days: number) => new Date(Date.now() + days * day);
const ORG = "ux-baobab-fintech-fictive";
const ORG_NAME = "Baobab Fintech (entreprise fictive)";

const members = [
  { email: "aline.equipe@jumanly.test", firstName: "Aline", jobTitle: "data" },
  { email: "patrice.equipe@jumanly.test", firstName: "Patrice", jobTitle: "service client" },
] as const;
const joiner = { email: "merveille.equipe@jumanly.test", firstName: "Merveille" };
const declared = [
  { email: "fabrice.equipe@jumanly.test", firstName: "Fabrice", title: "Analyste risque" },
  { email: "sandra.equipe@jumanly.test", firstName: "Sandra", title: "Développeuse" },
] as const;
const invited = "david.equipe@jumanly.test";

async function person(db: SeedClient, password: string, email: string, firstName: string) {
  const now = new Date();
  const data = {
    name: `${firstName} Démo`,
    firstName,
    lastName: "Démo",
    emailVerified: true,
    country: "CD",
    city: "Kinshasa",
    termsAcceptedAt: now,
  };
  const user = await db.user.upsert({ where: { email }, update: data, create: { email, ...data } });
  await db.account.deleteMany({ where: { userId: user.id, providerId: "credential" } });
  await db.account.create({
    data: { userId: user.id, accountId: user.id, providerId: "credential", password },
  });
  return user;
}

export async function seedEntrepriseTeam(db: SeedClient) {
  const org = await db.organization.findUnique({ where: { slug: ORG }, select: { id: true } });
  const owner = await db.user.findUnique({
    where: { email: "recruteur6.ux@jumanly.test" },
    select: { id: true },
  });
  if (!org || !owner) return;
  const password = await hashPassword(DEMO_PASSWORD);

  // The team: the owner (Clarisse) and two managers with the rights of their role.
  const team = [];
  for (const member of members) {
    const user = await person(db, password, member.email, member.firstName);
    await db.membership.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
      update: {
        role: "hiring_manager",
        status: "active",
        jobTitle: member.jobTitle,
        rights: rolePreset("hiring_manager"),
      },
      create: {
        userId: user.id,
        organizationId: org.id,
        role: "hiring_manager",
        jobTitle: member.jobTitle,
        rights: rolePreset("hiring_manager"),
        invitedBy: owner.id,
      },
    });
    team.push(user);
  }

  // Tasks in each state, on the organization's applications.
  await db.orgTask.deleteMany({ where: { organizationId: org.id } });
  const applications = await db.application.findMany({
    where: { job: { organizationId: org.id }, status: "active" },
    orderBy: { createdAt: "asc" },
    take: 4,
    select: { id: true },
  });
  const plan = [
    { member: 0, kind: "interview", status: "accepted", due: 1 },
    { member: 0, kind: "diagnostic", status: "done", due: -2 },
    { member: 1, kind: "follow", status: "accepted", due: -1 },
    { member: 1, kind: "diagnostic", status: "assigned", due: 4 },
  ] as const;
  for (const [index, task] of plan.entries()) {
    const application = applications[index % Math.max(1, applications.length)];
    const assignee = team[task.member];
    if (!application || !assignee) continue;
    await db.orgTask.create({
      data: {
        organizationId: org.id,
        assigneeId: assignee.id,
        assignedById: owner.id,
        kind: task.kind,
        status: task.status,
        applicationId: application.id,
        dueAt: at(task.due),
        doneAt: task.status === "done" ? at(-3) : null,
      },
    });
  }

  // An invitation waiting (one seat), and a join request.
  await db.invitation.deleteMany({ where: { organizationId: org.id, acceptedAt: null } });
  await db.invitation.create({
    data: {
      organizationId: org.id,
      email: invited,
      role: "viewer",
      token: `demo-equipe-${org.id}`,
      invitedById: owner.id,
      expiresAt: at(5),
      createdAt: at(-2),
    },
  });
  // Requests left by other runs of the e2e are cancelled; the UX scenario keeps Josué's.
  await db.orgJoinRequest.updateMany({
    where: {
      organizationId: org.id,
      status: "pending",
      user: { email: { not: "rejoindre.ux@jumanly.test" } },
    },
    data: { status: "cancelled" },
  });
  const asking = await person(db, password, joiner.email, joiner.firstName);
  await db.membership.deleteMany({ where: { userId: asking.id, organizationId: org.id } });
  await db.orgJoinRequest.deleteMany({ where: { userId: asking.id } });
  await db.orgJoinRequest.create({
    data: {
      organizationId: org.id,
      userId: asking.id,
      matchedBy: "domain",
      message: "Chargée RH (fictive), je rejoins l'équipe de recrutement.",
      expiresAt: at(6),
    },
  });

  // Two people whose current experience names the company, without an answer yet.
  for (const item of declared) {
    const user = await person(db, password, item.email, item.firstName);
    const profile = await db.talentProfile.upsert({
      where: { userId: user.id },
      update: { visibility: "recruiters" },
      create: { userId: user.id, visibility: "recruiters" },
    });
    await db.experience.deleteMany({ where: { profileId: profile.id } });
    await db.experience.create({
      data: {
        profileId: profile.id,
        title: item.title,
        company: ORG_NAME,
        startDate: at(-400),
        description: "Expérience fictive, pour la démonstration.",
      },
    });
  }

  // Page entreprise (A3): what the page shows, all fictional; the e2e changes it, the seed puts it back.
  await db.organization.update({
    where: { id: org.id },
    data: {
      name: ORG_NAME,
      sector: "Data et finance",
      city: "Kinshasa",
      size: "51-200",
      website: "https://baobab-fintech.example",
      description:
        "Entreprise fictive de démonstration : paiement mobile simple pour les commerçants et les familles, de Kinshasa à Lubumbashi.",
      hiringNow: true,
    },
  });
}

/**
 * Formule et facturation (A4): Baobab Fintech prepays Company, three months already paid (twice
 * by M-Pesa, once by card) with their invoices, and the month's usage of the capture. Fictional
 * numbers, local and preview only; rebuilt on each run.
 */
export async function seedEntrepriseBilling(db: SeedClient) {
  const [org, owner, plan] = await Promise.all([
    db.organization.findUnique({ where: { slug: ORG }, select: { id: true } }),
    db.user.findUnique({
      where: { email: "recruteur6.ux@jumanly.test" },
      select: { id: true, email: true },
    }),
    db.plan.findUnique({ where: { code: "company" } }),
  ]);
  if (!org || !owner || !plan?.priceCents) return;
  const subject = { subjectType: "organization" as const, subjectId: org.id };
  await db.invoice.deleteMany({ where: subject });
  await db.payment.deleteMany({ where: subject });
  await db.subscription.deleteMany({ where: subject });
  await db.usageCounter.deleteMany({ where: subject });

  const end = at(19);
  const start = addMonths(end, -1);
  const subscription = await db.subscription.create({
    data: {
      ...subject,
      planId: plan.id,
      status: "active",
      source: "self",
      currentPeriodStart: start,
      currentPeriodEnd: end,
    },
  });
  const paid = [
    { months: -2, method: "card" as const, operator: null },
    { months: -1, method: "mobile_money" as const, operator: "mpesa" },
    { months: 0, method: "mobile_money" as const, operator: "mpesa" },
  ];
  for (const item of paid) {
    const periodStart = addMonths(start, item.months);
    const periodEnd = addMonths(periodStart, 1);
    const payment = await db.payment.create({
      data: {
        ...subject,
        subscriptionId: subscription.id,
        planId: plan.id,
        provider: "fake",
        method: item.method,
        operator: item.operator,
        msisdnMasked: item.operator ? "+243 81 ••• 42" : null,
        amountCents: plan.priceCents,
        status: "succeeded",
        providerRef: `seed-baobab-${item.months}`,
        idempotencyKey: `seed-baobab-${item.months}`,
        kind: item.months === -2 ? "new" : "renewal",
        payerId: owner.id,
        periodStart,
        periodEnd,
        paidAt: periodStart,
        createdAt: periodStart,
      },
    });
    const last = await db.invoice.aggregate({ _max: { sequence: true } });
    const sequence = (last._max.sequence ?? 0) + 1;
    await db.invoice.create({
      data: {
        number: `JMN-${periodStart.getUTCFullYear()}-${String(sequence).padStart(6, "0")}`,
        sequence,
        paymentId: payment.id,
        ...subject,
        billedName: ORG_NAME,
        billedEmail: owner.email,
        planName: plan.name,
        amountCents: plan.priceCents,
        periodStart,
        periodEnd,
        issuedAt: periodStart,
      },
    });
  }

  // The month's usage of the capture: talent searches, contact requests, Orbi credits.
  const period = periodAround(start, new Date());
  for (const [key, used] of [
    ["hire.talent_search.monthly", 112],
    ["hire.contact_requests.monthly", 23],
    ["ai.credits.monthly", 190],
  ] as const) {
    await db.usageCounter.create({
      data: { ...subject, key, periodStart: period.start, periodEnd: period.end, used },
    });
  }
}

/**
 * Journal des consultations and Réglages du recrutement (A5): what the team of Baobab Fintech
 * opened these last days, and the company's interview grid. Fictional; the journal lines of the
 * organization are rebuilt on each run, so the capture stays the same.
 */
export async function seedEntrepriseJournal(db: SeedClient) {
  const org = await db.organization.findUnique({ where: { slug: ORG }, select: { id: true } });
  if (!org) return;
  const people = await db.user.findMany({
    where: {
      email: {
        in: [
          "recruteur6.ux@jumanly.test",
          "aline.equipe@jumanly.test",
          "patrice.equipe@jumanly.test",
        ],
      },
    },
    select: { id: true, email: true },
  });
  const id = (email: string) => people.find((item) => item.email === email)?.id ?? null;
  const [clarisse, aline, patrice] = [
    id("recruteur6.ux@jumanly.test"),
    id("aline.equipe@jumanly.test"),
    id("patrice.equipe@jumanly.test"),
  ];
  const applications = await db.application.findMany({
    where: { job: { organizationId: org.id } },
    orderBy: { createdAt: "asc" },
    take: 4,
    select: { id: true, profileId: true },
  });
  const visible = await db.talentProfile.findFirst({
    where: { user: { email: "talent.visible@jumanly.test" } },
    select: { id: true },
  });
  await db.auditLog.deleteMany({
    where: {
      organizationId: org.id,
      action: {
        in: [
          "profile.view",
          "cv.download",
          "candidate.pdf",
          "talent.pdf",
          "history.export",
          "scorecard.save",
          "report.export",
        ],
      },
    },
  });
  const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000);
  const lines: {
    actorId: string | null;
    action: string;
    hours: number;
    application?: number;
    profile?: string;
    report?: boolean;
  }[] = [
    { actorId: aline, action: "profile.view", hours: 1, application: 0 },
    { actorId: aline, action: "cv.download", hours: 2, application: 1 },
    { actorId: patrice, action: "profile.view", hours: 20, application: 2 },
    { actorId: aline, action: "profile.view", hours: 26, profile: visible?.id },
    { actorId: clarisse, action: "report.export", hours: 28, report: true },
    { actorId: patrice, action: "scorecard.save", hours: 70, application: 2 },
    { actorId: aline, action: "profile.view", hours: 75, application: 3 },
    { actorId: clarisse, action: "profile.view", hours: 100, application: 0 },
  ];
  for (const line of lines) {
    const application = line.application === undefined ? null : applications[line.application];
    if (line.application !== undefined && !application) continue;
    if (!line.report && !application && !line.profile) continue;
    await db.auditLog.create({
      data: {
        actorId: line.actorId,
        action: line.action,
        targetType: line.report ? "organization" : "talentProfile",
        targetId: line.report ? org.id : (application?.profileId ?? line.profile!),
        organizationId: org.id,
        metadata: line.report
          ? { format: "pdf", period: "month" }
          : application
            ? { applicationId: application.id }
            : { source: "talent_search" },
        createdAt: hoursAgo(line.hours),
      },
    });
  }

  // The interview grid of the capture; the stages stay those of every new company.
  await db.organization.update({
    where: { id: org.id },
    data: {
      pipelineTemplate: Prisma.DbNull,
      scorecardCriteria: [
        "Compétences techniques",
        "Résolution de problèmes",
        "Communication",
        "Motivation pour le poste",
        "Travail en équipe",
      ].map((name) => ({ name, description: "" })),
    },
  });
}
