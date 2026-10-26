/**
 * Étape 3 (espace administrateur d'entreprise, A2): the team of Baobab Fintech (entreprise
 * fictive) seen by its administrator. Two managers with their rights, tasks in every state, an
 * invitation waiting, a join request and two people who say they work there. Local and preview
 * only (CLAUDE.md § 11); everything is rebuilt on each run, so a run of the e2e can be replayed.
 */
import { hashPassword } from "better-auth/crypto";
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
}
