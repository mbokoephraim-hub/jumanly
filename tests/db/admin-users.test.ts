import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { limit, resolvePlan } from "@/server/entitlements";
import { userOverview } from "@/server/services/admin-user-overview";
import { applyToJob } from "@/server/services/applications";
import {
  addCredits,
  AdminUserError,
  deleteUser,
  deletionCheck,
  grantPlan,
  markEmailVerified,
  purgeScheduledDeletions,
  readUserFilters,
  removeOverride,
  resetTwoFactor,
  revokePlan,
  userListWhere,
  userRights,
} from "@/server/services/admin-users";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const jobs: string[] = [];
const DAY = 86_400_000;
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { targetId: { in: users } } });
  await db.application.deleteMany({ where: { jobId: { in: jobs } } });
  await db.pipelineStage.deleteMany({ where: { jobId: { in: jobs } } });
  await db.job.deleteMany({ where: { id: { in: jobs } } });
  await db.membership.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function person() {
  const user = await newUser();
  users.push(user.id);
  return user;
}

describe("vérifier un utilisateur (Admin v2, étape 3)", () => {
  it("marque l'e-mail comme vérifié avec un motif journalisé", async () => {
    const admin = await person();
    const user = await person();
    await db.user.update({ where: { id: user.id }, data: { emailVerified: false } });
    await markEmailVerified(db, { actorId: admin.id }, user.id, "Confirmé par e-mail fictif");
    expect((await db.user.findUnique({ where: { id: user.id } }))?.emailVerified).toBe(true);
    const log = await db.auditLog.findFirst({
      where: { targetId: user.id, action: "user.email.verify" },
    });
    expect(log?.metadata).toMatchObject({ reason: "Confirmé par e-mail fictif" });
  });
});

describe("fiche utilisateur (29/10/2026)", () => {
  it("montre l'abonnement, les paiements, les plaintes et les alertes", async () => {
    const user = await person();
    const plan = await db.plan.findFirstOrThrow({
      where: { family: "talent", active: true, priceCents: { gt: 0 } },
    });
    const now = new Date();
    const subscription = await db.subscription.create({
      data: {
        subjectType: "user",
        subjectId: user.id,
        planId: plan.id,
        status: "active",
        currentPeriodStart: new Date(now.getTime() - 25 * DAY),
        currentPeriodEnd: new Date(now.getTime() + 5 * DAY),
      },
    });
    await db.payment.create({
      data: {
        subscriptionId: subscription.id,
        subjectType: "user",
        subjectId: user.id,
        planId: plan.id,
        provider: "fake",
        method: "mobile_money",
        amountCents: plan.priceCents ?? 0,
        status: "succeeded",
        providerRef: `test-${randomUUID()}`,
        idempotencyKey: `test-${randomUUID()}`,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        paidAt: subscription.currentPeriodStart,
      },
    });
    await db.report.create({
      data: { reporterId: user.id, targetType: "job", targetId: "job-fictif", reason: "scam" },
    });
    const overview = await userOverview(db, user.id, now);
    expect(overview?.subscription?.daysLeft).toBe(5);
    expect(overview?.payments).toHaveLength(1);
    expect(overview?.paidTotalCents).toBe(plan.priceCents);
    expect(overview?.complaints.reports).toHaveLength(1);
    expect(overview?.alerts.map((alert) => alert.kind)).toContain("endingSoon");

    await db.report.deleteMany({ where: { reporterId: user.id } });
    await db.payment.deleteMany({ where: { subjectId: user.id } });
    await db.subscription.deleteMany({ where: { subjectId: user.id } });
  });

  it("désactive la double authentification d'un compte qui a perdu son téléphone", async () => {
    const admin = await person();
    const user = await person();
    await expect(
      resetTwoFactor(db, { actorId: admin.id }, user.id, "Téléphone perdu (fictif)"),
    ).rejects.toThrow(AdminUserError);
    await db.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
    await db.twoFactor.create({ data: { userId: user.id, secret: "x", backupCodes: "x" } });
    await resetTwoFactor(db, { actorId: admin.id }, user.id, "Téléphone perdu (fictif)");
    expect((await db.user.findUnique({ where: { id: user.id } }))?.twoFactorEnabled).toBe(false);
    expect(await db.twoFactor.count({ where: { userId: user.id } })).toBe(0);
    expect(
      await db.auditLog.count({ where: { targetId: user.id, action: "user.2fa.reset" } }),
    ).toBe(1);
    await expect(resetTwoFactor(db, { actorId: admin.id }, admin.id, "Soi-même")).rejects.toThrow(
      AdminUserError,
    );
  });
});

describe("forfait offert et crédits", () => {
  it("offre un forfait jusqu'à une date, puis le retire", async () => {
    const admin = await person();
    const user = await person();
    const now = new Date();
    const pro = await db.plan.findUniqueOrThrow({ where: { code: "talent_pro" } });
    const before = await resolvePlan(db, { type: "user", id: user.id }, now);
    expect(before?.status).toBe("free");

    await expect(
      grantPlan(
        db,
        { actorId: admin.id },
        {
          userId: user.id,
          planCode: "talent_free",
          until: isoDay(new Date(now.getTime() + 30 * DAY)),
          reason: "Geste",
        },
        now,
      ),
    ).rejects.toThrow(AdminUserError);
    await expect(
      grantPlan(
        db,
        { actorId: admin.id },
        { userId: user.id, planCode: pro.code, until: isoDay(now), reason: "Geste" },
        now,
      ),
    ).rejects.toThrow(AdminUserError);

    const subscription = await grantPlan(
      db,
      { actorId: admin.id },
      {
        userId: user.id,
        planCode: pro.code,
        until: isoDay(new Date(now.getTime() + 30 * DAY)),
        reason: "Partenariat fictif",
      },
      now,
    );
    const rights = await userRights(db, user.id, now);
    expect(rights?.plan.planCode).toBe("talent_pro");
    expect(rights?.source).toBe("gift");
    expect(rights?.rows.find((row) => row.key === "career.linkedin")?.value).toBe("true");

    await revokePlan(
      db,
      { actorId: admin.id },
      { userId: user.id, subscriptionId: subscription.id, reason: "Fin du geste" },
    );
    expect((await userRights(db, user.id))?.source).toBe("free");
    expect(
      await db.auditLog.count({
        where: { targetId: user.id, action: { in: ["user.plan.grant", "user.plan.revoke"] } },
      }),
    ).toBe(2);
  });

  it("ajoute des crédits au quota de la période, puis retire l'ajout", async () => {
    const admin = await person();
    const user = await person();
    const now = new Date();
    const pro = await db.plan.findUniqueOrThrow({ where: { code: "talent_starter" } });
    await db.subscription.create({
      data: {
        subjectType: "user",
        subjectId: user.id,
        planId: pro.id,
        status: "active",
        source: "self",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * DAY),
      },
    });
    const subject = { type: "user" as const, id: user.id };
    const base = await limit(db, subject, "ai.credits.monthly");
    const until = isoDay(new Date(now.getTime() + 10 * DAY));
    await addCredits(
      db,
      { actorId: admin.id },
      { userId: user.id, key: "ai.credits.monthly", amount: 20, until, reason: "Geste" },
      now,
    );
    expect(await limit(db, subject, "ai.credits.monthly")).toBe(base + 20);
    // A second gift adds to the first and replaces it.
    await addCredits(
      db,
      { actorId: admin.id },
      { userId: user.id, key: "ai.credits.monthly", amount: 5, until, reason: "Encore" },
      now,
    );
    expect(await limit(db, subject, "ai.credits.monthly")).toBe(base + 25);
    expect(
      await db.entitlementOverride.count({
        where: { subjectId: user.id, key: "ai.credits.monthly" },
      }),
    ).toBe(1);
    const row = (await userRights(db, user.id))?.rows.find(
      (entry) => entry.key === "ai.credits.monthly",
    );
    expect(row?.source).toBe("override");
    expect(row?.used).toBe(0);

    await expect(
      addCredits(
        db,
        { actorId: admin.id },
        { userId: user.id, key: "inconnu.monthly", amount: 5, until, reason: "Geste" },
        now,
      ),
    ).rejects.toThrow(AdminUserError);

    await removeOverride(
      db,
      { actorId: admin.id },
      { userId: user.id, overrideId: row!.override!.id, reason: "Erreur de saisie" },
    );
    expect(await limit(db, subject, "ai.credits.monthly")).toBe(base);
  });
});

describe("suppression du compte (partie 10)", () => {
  it("refuse son propre compte, le dernier administrateur et un propriétaire d'organisation", async () => {
    const admin = await person();
    expect(await deletionCheck(db, admin.id, admin.id)).toBe("self");

    const owner = await person();
    const org = await newOrganization("company");
    orgs.push(org.id);
    await db.membership.create({
      data: { userId: owner.id, organizationId: org.id, role: "org_owner" },
    });
    expect(await deletionCheck(db, admin.id, owner.id)).toBe("owner");

    // Platform administrators: the seed has at least one, so a test admin is never the last one.
    const otherAdmin = await person();
    await db.user.update({
      where: { id: otherAdmin.id },
      data: { platformRole: "platform_admin" },
    });
    expect(await deletionCheck(db, admin.id, otherAdmin.id)).toBeNull();
  });

  it("anonymise le compte et garde ses candidatures sans données personnelles", async () => {
    const admin = await person();
    const user = await person();
    await db.user.update({
      where: { id: user.id },
      data: { firstName: "Prénom", lastName: "Fictif", city: "Goma", country: "CD" },
    });
    const profile = await db.talentProfile.create({
      data: { userId: user.id, headline: "Comptable fictif", summary: "Résumé fictif" },
    });
    const cv = await db.document.create({
      data: { profileId: profile.id, kind: "cv", title: "CV test", content: { summary: "x" } },
    });
    const org = await newOrganization("company");
    orgs.push(org.id);
    const job = await db.job.create({
      data: {
        organizationId: org.id,
        title: "Poste fictif",
        slug: `test-${randomUUID()}`,
        description: "Offre de test.",
        contractType: "cdi",
        city: "Kinshasa",
        country: "Congo-Kinshasa",
        remote: "onsite",
        status: "published",
        publishedAt: new Date(),
      },
    });
    jobs.push(job.id);
    await applyToJob(db, { userId: user.id, jobSlug: job.slug, cvDocumentId: cv.id });

    await expect(
      deleteUser(
        db,
        { actorId: admin.id },
        { userId: user.id, reason: "Demande écrite", confirmEmail: "autre@jumanly.test" },
      ),
    ).rejects.toThrow(AdminUserError);
    await deleteUser(
      db,
      { actorId: admin.id },
      { userId: user.id, reason: "Demande écrite", confirmEmail: user.email.toUpperCase() },
    );

    const after = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(after.status).toBe("deleted");
    expect(after.email).not.toBe(user.email);
    expect([after.firstName, after.lastName, after.city, after.country]).toEqual([
      null,
      null,
      null,
      null,
    ]);
    const application = await db.application.findFirstOrThrow({ where: { jobId: job.id } });
    expect(application.cvSnapshot).toBeNull();
    expect(application.coverLetter).toBeNull();
    expect(await db.document.count({ where: { profileId: profile.id } })).toBe(0);
    const kept = await db.talentProfile.findUniqueOrThrow({ where: { id: profile.id } });
    expect(kept.headline).toBeNull();
    expect(await deletionCheck(db, admin.id, user.id)).toBe("deleted");

    // Deleted accounts only show under their own status.
    const where = await userListWhere(db, readUserFilters({ q: user.id }));
    expect(await db.user.count({ where })).toBe(0);
    const deleted = await userListWhere(db, readUserFilters({ q: user.id, statut: "deleted" }));
    expect(await db.user.count({ where: deleted })).toBe(1);
  });

  it("exécute les suppressions demandées dont le délai est écoulé", async () => {
    const due = await person();
    const later = await person();
    const now = new Date();
    await db.user.update({
      where: { id: due.id },
      data: { deletionScheduledAt: new Date(now.getTime() - DAY) },
    });
    await db.user.update({
      where: { id: later.id },
      data: { deletionScheduledAt: new Date(now.getTime() + DAY) },
    });
    expect(await purgeScheduledDeletions(db, now, [due.id, later.id])).toBe(1);
    expect((await db.user.findUniqueOrThrow({ where: { id: due.id } })).status).toBe("deleted");
    expect((await db.user.findUniqueOrThrow({ where: { id: later.id } })).status).toBe("active");
    const log = await db.auditLog.findFirst({ where: { targetId: due.id, action: "user.delete" } });
    expect(log?.actorId).toBeNull();
  });
});
