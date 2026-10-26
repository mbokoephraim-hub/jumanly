import { afterAll, describe, expect, it } from "vitest";
import {
  advanceTask,
  assignTask,
  declaredMembers,
  effectiveRights,
  memberCan,
  pendingDeclaredMembers,
  remindTask,
  respondDeclaredMember,
  rolePreset,
  setMemberRight,
  setMemberRole,
  teamScreen,
} from "@/server/services/org-team";
import { respondJoin } from "@/server/services/org-join";
import type { HireContext } from "@/server/services/hire";
import { cleanup, db, newOrganization, newUser } from "./helpers";

// Étape 3 · A2 : Équipe. Tout reste dans l'organisation de l'administrateur ; les droits ne
// dépassent jamais le rôle ni `org.permissions.level` ; une demande acceptée prend une place.

const users: string[] = [];
const orgs: string[] = [];
const DAY = 86_400_000;

afterAll(async () => {
  await db.orgTask.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.orgDeclaredMember.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.orgJoinRequest.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.invitation.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.application.deleteMany({ where: { job: { organizationId: { in: orgs } } } });
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.experience.deleteMany({ where: { profile: { userId: { in: users } } } });
  await db.talentProfile.deleteMany({ where: { userId: { in: users } } });
  await db.membership.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function user() {
  const created = await newUser();
  users.push(created.id);
  return created;
}

/** A company with its owner, on a plan, and a member of each given role. */
async function company(planCode: string, roles: ("recruiter" | "hiring_manager" | "viewer")[]) {
  const owner = await user();
  const org = await newOrganization("company");
  orgs.push(org.id);
  await db.organization.update({
    where: { id: org.id },
    data: { name: `Kivu Data ${org.id.slice(-6)} (fictive)` },
  });
  await db.membership.create({
    data: { userId: owner.id, organizationId: org.id, role: "org_owner" },
  });
  const plan = await db.plan.findUniqueOrThrow({ where: { code: planCode } });
  await db.subscription.create({
    data: {
      subjectType: "organization",
      subjectId: org.id,
      planId: plan.id,
      status: "active",
      source: "self",
      currentPeriodStart: new Date(Date.now() - DAY),
      currentPeriodEnd: new Date(Date.now() + 30 * DAY),
    },
  });
  const members = [];
  for (const role of roles) {
    const member = await user();
    const membership = await db.membership.create({
      data: { userId: member.id, organizationId: org.id, role },
    });
    members.push({ user: member, membership });
  }
  const ctx: HireContext = { userId: owner.id, organizationId: org.id, role: "org_owner" };
  return { owner, org, ctx, members };
}

async function application(organizationId: string) {
  const talent = await user();
  const profile = await db.talentProfile.create({ data: { userId: talent.id } });
  const job = await db.job.create({
    data: {
      organizationId,
      title: "Analyste fictif",
      slug: `test-${organizationId}-${Math.random().toString(36).slice(2)}`,
      description: "Offre fictive.",
      contractType: "cdi",
      remote: "onsite",
      city: "Goma",
      country: "RD Congo",
      status: "published",
    },
  });
  const stage = await db.pipelineStage.create({
    data: { jobId: job.id, name: "Nouvelles", kind: "new", order: 0 },
  });
  return db.application.create({
    data: { jobId: job.id, profileId: profile.id, stageId: stage.id },
  });
}

describe("Équipe de l'entreprise", () => {
  it("garde chaque droit dans la limite du rôle", () => {
    expect(effectiveRights("viewer", null)).toEqual({
      publish: false,
      sort: false,
      interviews: false,
      evaluate: false,
      stats: true,
      page: false,
    });
    // Un interrupteur enregistré ne donne jamais plus que le rôle.
    expect(effectiveRights("hiring_manager", { publish: true, page: true }).publish).toBe(false);
    expect(effectiveRights("recruiter", rolePreset("recruiter")).stats).toBe(false);
    expect(effectiveRights("org_admin", { publish: false }).publish).toBe(true);
  });

  it("n'ajuste les droits par membre qu'avec des permissions avancées", async () => {
    const standard = await company("company", ["recruiter"]);
    const member = standard.members[0]!;
    expect(await setMemberRight(db, standard.ctx, member.membership.id, "stats", false)).toBe(
      "level",
    );

    const advanced = await company("company_plus", ["recruiter", "viewer"]);
    const recruiter = advanced.members[0]!;
    const viewer = advanced.members[1]!;
    expect(await setMemberRight(db, advanced.ctx, recruiter.membership.id, "publish", false)).toBe(
      "ok",
    );
    expect(
      await memberCan(
        db,
        { userId: recruiter.user.id, organizationId: advanced.org.id, role: "recruiter" },
        "publish",
      ),
    ).toBe(false);
    // Un lecteur ne reçoit pas le droit de publier.
    expect(await setMemberRight(db, advanced.ctx, viewer.membership.id, "publish", true)).toBe(
      "role",
    );
    expect(await setMemberRole(db, advanced.ctx, viewer.membership.id, "hiring_manager")).toBe(
      "ok",
    );
    const changed = await db.membership.findUniqueOrThrow({ where: { id: viewer.membership.id } });
    expect(changed.role).toBe("hiring_manager");
    expect(changed.rights).toEqual(rolePreset("hiring_manager"));
  });

  it("refuse tout geste sur un membre d'une autre organisation", async () => {
    const mine = await company("company_plus", ["recruiter"]);
    const other = await company("company_plus", ["recruiter"]);
    const stranger = other.members[0]!;
    await expect(
      setMemberRight(db, mine.ctx, stranger.membership.id, "stats", false),
    ).rejects.toThrow("notFound");
    await expect(setMemberRole(db, mine.ctx, stranger.membership.id, "viewer")).rejects.toThrow(
      "notFound",
    );
    const foreign = await application(other.org.id);
    expect(
      await assignTask(db, mine.ctx, {
        member: mine.members[0]!.user.id,
        kind: "follow",
        application: foreign.id,
        due: new Date(Date.now() + 3 * DAY).toISOString().slice(0, 10),
      }),
    ).toEqual({ ok: false, error: "invalid" });
    // Un recruteur ou un lecteur n'administre pas l'équipe.
    const recruiterCtx: HireContext = {
      userId: mine.members[0]!.user.id,
      organizationId: mine.org.id,
      role: "recruiter",
    };
    await expect(teamScreen(db, recruiterCtx)).rejects.toThrow("forbidden");
    await expect(teamScreen(db, { ...recruiterCtx, role: "viewer" })).rejects.toThrow("forbidden");
  });

  it("suit une tâche de l'attribution à la fin, et prévient chacun", async () => {
    const { ctx, org, members, owner } = await company("company", ["hiring_manager", "viewer"]);
    const manager = members[0]!;
    const app = await application(org.id);
    const due = new Date(Date.now() + 3 * DAY).toISOString().slice(0, 10);
    // Un lecteur ne reçoit pas de tâche.
    expect(
      await assignTask(db, ctx, {
        member: members[1]!.user.id,
        kind: "follow",
        application: app.id,
        due,
      }),
    ).toEqual({ ok: false, error: "invalid" });
    const created = await assignTask(db, ctx, {
      member: manager.user.id,
      kind: "interview",
      application: app.id,
      due,
    });
    expect(created.ok).toBe(true);
    const taskId = created.ok ? created.id : "";
    await remindTask(db, ctx, taskId);
    const managerCtx: HireContext = {
      userId: manager.user.id,
      organizationId: org.id,
      role: "hiring_manager",
    };
    // Seule la personne chargée de la tâche la fait avancer.
    await expect(advanceTask(db, ctx, taskId)).rejects.toThrow("forbidden");
    expect(await advanceTask(db, managerCtx, taskId)).toBe("accepted");
    expect(await advanceTask(db, managerCtx, taskId)).toBe("in_progress");
    expect(await advanceTask(db, managerCtx, taskId)).toBe("done");
    await expect(advanceTask(db, managerCtx, taskId)).rejects.toThrow("invalid");
    const types = await db.notification.findMany({
      where: { userId: { in: [manager.user.id, owner.id] } },
      select: { type: true },
    });
    expect(types.map((item) => item.type).sort()).toEqual(
      ["orgTaskAssigned", "orgTaskDone", "orgTaskReminder"].sort(),
    );
  });

  it("accepte une demande de rattachement seulement s'il reste une place", async () => {
    // Company : 5 places. Propriétaire + 3 membres + 1 invitation = 5, plus de place.
    const { ctx, org } = await company("company", ["recruiter", "hiring_manager", "viewer"]);
    await db.invitation.create({
      data: {
        organizationId: org.id,
        email: `invite-${org.id}@exemple.cd`,
        role: "viewer",
        token: `test-${org.id}`,
        invitedById: ctx.userId,
        expiresAt: new Date(Date.now() + 5 * DAY),
      },
    });
    const asking = await user();
    const request = await db.orgJoinRequest.create({
      data: {
        organizationId: org.id,
        userId: asking.id,
        matchedBy: "domain",
        expiresAt: new Date(Date.now() + 5 * DAY),
      },
    });
    expect(await respondJoin(db, ctx, request.id, { accept: true, role: "recruiter" })).toBe(
      "seats",
    );
    await db.invitation.deleteMany({ where: { organizationId: org.id } });
    expect(await respondJoin(db, ctx, request.id, { accept: true, role: "recruiter" })).toBe(
      "accepted",
    );
    expect(await db.membership.count({ where: { organizationId: org.id, status: "active" } })).toBe(
      5,
    );
  });

  it("confirme ou écarte les personnes qui indiquent travailler dans l'entreprise", async () => {
    const { ctx, org } = await company("company", []);
    const orgRow = await db.organization.findUniqueOrThrow({ where: { id: org.id } });
    const other = await company("company", []);
    const people = [];
    for (const [index, visibility] of (
      ["recruiters", "recruiters", "private"] as const
    ).entries()) {
      const person = await user();
      const profile = await db.talentProfile.create({ data: { userId: person.id, visibility } });
      const experience = await db.experience.create({
        data: {
          profileId: profile.id,
          title: `Poste fictif ${index}`,
          company: orgRow.name.toUpperCase(),
          startDate: new Date(Date.now() - 300 * DAY),
        },
      });
      people.push(experience);
    }
    // Un profil privé n'apparaît pas ; deux personnes attendent une réponse.
    const pending = await pendingDeclaredMembers(db, ctx);
    expect(pending.map((item) => item.experienceId).sort()).toEqual(
      [people[0]!.id, people[1]!.id].sort(),
    );
    await respondDeclaredMember(db, ctx, people[0]!.id, true);
    await respondDeclaredMember(db, ctx, people[1]!.id, false);
    expect(await pendingDeclaredMembers(db, ctx)).toEqual([]);
    const shown = await declaredMembers(db, org.id);
    expect(shown.map((item) => [item.experienceId, item.status])).toEqual([
      [people[0]!.id, "confirmed"],
    ]);
    // Une autre entreprise ne répond pas pour celle-ci.
    await expect(respondDeclaredMember(db, other.ctx, people[0]!.id, false)).rejects.toThrow(
      "notFound",
    );
  });
});
