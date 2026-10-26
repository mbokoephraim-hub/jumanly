/**
 * Modèle B recruteur, M8: Compte of the phone. Every figure is read in the active organization
 * only (golden rule 6): statistics, team, consultation log; a request (colleague, plan) reaches
 * the administrators of this organization only and changes nothing by itself; leaving the
 * company deletes nothing; the recruiter's switches mute their notifications without touching
 * the talent's.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { invalidate } from "@/server/entitlements";
import { applyToJob } from "@/server/services/applications";
import { HireError, type HireContext } from "@/server/services/hire";
import {
  leaveOrganization,
  proposeColleague,
  RH_REQUESTS_PER_DAY,
  requestPlan,
  rhCompanyMode,
  rhPlan,
  rhPrivacy,
  rhStats,
  rhTeam,
} from "@/server/services/hire-phone-account";
import { mutedAfter, notify, RECRUITER_SWITCHES } from "@/server/services/notifications";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const day = 86_400_000;

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});
beforeEach(() => invalidate());

async function member(organizationId: string, role: MembershipRole): Promise<HireContext> {
  const user = await newUser();
  users.push(user.id);
  await db.membership.create({ data: { userId: user.id, organizationId, role } });
  return { userId: user.id, organizationId, role };
}

async function company() {
  const organization = await newOrganization("company");
  orgs.push(organization.id);
  return member(organization.id, "org_owner");
}

async function application(ctx: HireContext) {
  const job = await db.job.create({
    data: {
      organizationId: ctx.organizationId,
      createdById: ctx.userId,
      slug: `test-${randomUUID()}`,
      title: "Analyste fictif",
      description: "Poste fictif pour les tests.",
      contractType: "cdi",
      city: "Kinshasa",
      country: "RD Congo",
      remote: "onsite",
      status: "published",
      publishedAt: new Date(),
      closesAt: new Date(Date.now() + 30 * day),
    },
  });
  const talent = await newUser();
  users.push(talent.id);
  const applied = await applyToJob(db, { userId: talent.id, jobSlug: job.slug });
  if (applied.status !== "applied") throw new Error(applied.status);
  return { applicationId: applied.applicationId, jobId: job.id };
}

describe("Compte du recruteur au téléphone (M8)", () => {
  it("lit les statistiques et l'équipe dans la seule organisation active", async () => {
    const owner = await company();
    const other = await company();
    await application(owner);
    await application(other);
    await application(other);
    const colleague = await member(owner.organizationId, "recruiter");

    const stats = await rhStats(db, owner);
    expect(stats.received).toBe(1);
    expect(stats.funnel[0]).toEqual({ phase: "recue", count: 1 });
    expect(stats.answeredPercent).toBe(0);
    expect(stats.waitingPercent).toBe(100);
    expect((await rhStats(db, other)).received).toBe(2);

    const team = await rhTeam(db, colleague);
    expect(team.rows.map((row) => row.userId).sort()).toEqual(
      [owner.userId, colleague.userId].sort(),
    );
    expect(team.rows[0]!.userId).toBe(owner.userId);
    expect(team.rows.find((row) => row.me)?.userId).toBe(colleague.userId);
    expect(team.isAdmin).toBe(false);
    expect(team.rows.find((row) => row.userId === owner.userId)?.files).toBe(1);
  });

  it("compte les consultations du membre dans cette organisation et ce mois seulement", async () => {
    const owner = await company();
    const other = await company();
    const now = new Date();
    const log = (organizationId: string, createdAt: Date, actorId = owner.userId) =>
      db.auditLog.create({
        data: {
          actorId,
          action: "profile.view",
          targetType: "talentProfile",
          targetId: randomUUID(),
          organizationId,
          createdAt,
        },
      });
    await log(owner.organizationId, now);
    await log(owner.organizationId, now);
    await log(other.organizationId, now, owner.userId);
    await log(
      owner.organizationId,
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - day),
    );
    const privacy = await rhPrivacy(db, owner, now);
    expect(privacy.views).toBe(2);
    expect(privacy.owner).toBe(true);
  });

  it("propose un collègue aux seuls administrateurs de l'organisation, avec une limite", async () => {
    const owner = await company();
    const otherOwner = await company();
    const recruiter = await member(owner.organizationId, "recruiter");
    const admin = await db.user.findUniqueOrThrow({ where: { id: owner.userId } });

    expect(await proposeColleague(db, recruiter, { email: "pas-un-email" })).toEqual({
      ok: false,
      error: "email",
    });
    expect(await proposeColleague(db, recruiter, { email: admin.email })).toEqual({
      ok: false,
      error: "member",
    });
    const email = `collegue-${randomUUID()}@fictif.test`;
    expect(await proposeColleague(db, recruiter, { email })).toEqual({ ok: true });
    const sent = await db.notification.findMany({
      where: { type: "colleagueProposed", payload: { path: ["fromId"], equals: recruiter.userId } },
    });
    expect(sent.map((item) => item.userId)).toEqual([owner.userId]);
    expect(
      await db.notification.count({
        where: { userId: otherOwner.userId, type: "colleagueProposed" },
      }),
    ).toBe(0);
    // Nobody is invited without the administrator.
    expect(
      await db.invitation.count({ where: { organizationId: owner.organizationId, email } }),
    ).toBe(0);

    for (let index = 1; index < RH_REQUESTS_PER_DAY; index++)
      await proposeColleague(db, recruiter, { email: `c${index}-${randomUUID()}@fictif.test` });
    expect(
      await proposeColleague(db, recruiter, { email: `trop-${randomUUID()}@fictif.test` }),
    ).toEqual({ ok: false, error: "trop" });
  });

  it("montre la formule en lecture et transmet une demande sans rien changer", async () => {
    const owner = await company();
    const recruiter = await member(owner.organizationId, "recruiter");
    const plan = await rhPlan(db, recruiter);
    expect(plan.isAdmin).toBe(false);
    expect(plan.usage.map((item) => item.key)).toEqual(["seats", "offers", "searches", "credits"]);
    expect(plan.usage[0]!.used).toBe(2);
    expect(await requestPlan(db, recruiter, "forfait-inexistant")).toEqual({
      ok: false,
      error: "plan",
    });
    const talentPlan = await db.plan.findFirstOrThrow({ where: { family: "talent" } });
    expect(await requestPlan(db, recruiter, talentPlan.code)).toEqual({ ok: false, error: "plan" });
    if (plan.next) {
      expect(await requestPlan(db, recruiter, plan.next.code)).toEqual({ ok: true });
      expect(
        await db.notification.count({ where: { userId: owner.userId, type: "planRequested" } }),
      ).toBe(1);
    }
    expect(
      await db.subscription.count({
        where: { subjectType: "organization", subjectId: owner.organizationId },
      }),
    ).toBe(0);
  });

  it("quitter l'entreprise met fin au rattachement sans rien effacer ; le propriétaire ne peut pas", async () => {
    const owner = await company();
    const recruiter = await member(owner.organizationId, "recruiter");
    const { applicationId } = await application(recruiter);
    await expect(leaveOrganization(db, owner)).rejects.toBeInstanceOf(HireError);
    await leaveOrganization(db, recruiter);
    const membership = await db.membership.findUniqueOrThrow({
      where: {
        userId_organizationId: { userId: recruiter.userId, organizationId: owner.organizationId },
      },
    });
    expect(membership.status).toBe("removed");
    expect(await db.application.count({ where: { id: applicationId } })).toBe(1);
    expect(await db.user.count({ where: { id: recruiter.userId } })).toBe(1);
    expect(
      await db.auditLog.count({
        where: { actorId: recruiter.userId, action: "org.member.leave" },
      }),
    ).toBe(1);
  });

  it("le mode entreprise est réservé aux administrateurs", async () => {
    const owner = await company();
    const recruiter = await member(owner.organizationId, "recruiter");
    await expect(rhCompanyMode(db, recruiter)).rejects.toBeInstanceOf(HireError);
    const mode = await rhCompanyMode(db, owner);
    expect(mode.members).toBe(2);
  });

  it("les interrupteurs du recruteur coupent ses notifications sans toucher ceux du talent", async () => {
    const owner = await company();
    await db.user.update({
      where: { id: owner.userId },
      data: { notificationsMuted: ["learning"] },
    });
    const muted = mutedAfter(["learning"], RECRUITER_SWITCHES, new Set(["messages", "rh.team"]));
    expect(muted.sort()).toEqual(["learning", "rh.applications", "rh.interviews"]);
    await db.user.update({ where: { id: owner.userId }, data: { notificationsMuted: muted } });
    await notify(db, {
      userIds: [owner.userId],
      type: "newApplication",
      payload: {},
      href: "/app/hire",
    });
    await notify(db, {
      userIds: [owner.userId],
      type: "candidateAssigned",
      payload: {},
      href: "/app/hire",
    });
    const types = (
      await db.notification.findMany({ where: { userId: owner.userId }, select: { type: true } })
    ).map((item) => item.type);
    expect(types).not.toContain("newApplication");
    expect(types).toContain("candidateAssigned");
    // The talent's screen saves its own categories and keeps the recruiter's.
    expect(
      mutedAfter(muted, ["applications", "messages", "learning", "billing"], new Set()),
    ).toEqual(expect.arrayContaining(["rh.applications", "rh.interviews", "learning", "billing"]));
  });
});
