/**
 * E9 · Jumanly Partners: batches and distribution, activation rules (partie 05 § 6), isolation
 * between partners, the anonymity threshold, and the guarantee that nothing that reaches the
 * partner space names a beneficiary (partie 10 § 10.2).
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { invalidate, resolvePlan } from "@/server/entitlements";
import { runBillingJobs } from "@/server/services/billing-jobs";
import {
  activateLicense,
  createBatch,
  createLink,
  createPartner,
  generateCodes,
  impactReport,
  invitationCounts,
  inviteByEmail,
  listBatches,
  listCodes,
  listLinks,
  partnerDashboard,
  PartnerError,
  revokeCode,
  type PartnerContext,
} from "@/server/services/partners";
import {
  batchDetail,
  extendBatch,
  updateBatch,
  updatePartner,
} from "@/server/services/admin-partners";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const day = 86_400_000;

afterAll(async () => {
  await db.license.deleteMany({ where: { userId: { in: users } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});
beforeEach(() => invalidate());

async function person() {
  const user = await newUser();
  users.push(user.id);
  return user;
}

/** A partner organization with its manager and one batch of Pro licences. */
async function partner(
  batch: Partial<{ seats: number; startsAt: Date; endsAt: Date; months: number }> = {},
) {
  const org = await newOrganization("partner");
  orgs.push(org.id);
  const manager = await person();
  await db.membership.create({
    data: { userId: manager.id, organizationId: org.id, role: "partner_manager" },
  });
  const admin = await person();
  const plan = await db.plan.findUniqueOrThrow({ where: { code: "talent_pro" } });
  const created = await createBatch(db, admin.id, {
    partnerId: org.id,
    name: "Lot test fictif",
    planId: plan.id,
    seats: String(batch.seats ?? 20),
    months: String(batch.months ?? 6),
    startsAt: (batch.startsAt ?? new Date(Date.now() - day)).toISOString(),
    endsAt: (batch.endsAt ?? new Date(Date.now() + 365 * day)).toISOString(),
    minGroup: "10",
  });
  const ctx: PartnerContext = { userId: manager.id, organizationId: org.id };
  return { ctx, batch: created, org };
}

async function codes(ctx: PartnerContext, batchId: string, quantity: number) {
  await generateCodes(db, ctx, { batchId, quantity: String(quantity) });
  return db.license.findMany({
    where: { batchId, status: "available" },
    orderBy: { createdAt: "asc" },
  });
}

async function subscribe(userId: string, code: string) {
  const plan = await db.plan.findUniqueOrThrow({ where: { code } });
  await db.subscription.create({
    data: {
      subjectType: "user",
      subjectId: userId,
      planId: plan.id,
      status: "active",
      source: "self",
      currentPeriodStart: new Date(Date.now() - day),
      currentPeriodEnd: new Date(Date.now() + 20 * day),
    },
  });
}

describe("Lots et distribution", () => {
  it("l'administrateur crée un partenaire et son responsable est invité", async () => {
    const admin = await person();
    const { org, invitation } = await createPartner(db, admin.id, {
      name: "Fondation test fictive",
      kind: "foundation",
      managerEmail: "responsable-test@jumanly.test",
    });
    orgs.push(org.id);
    expect(org.type).toBe("partner");
    expect(invitation.role).toBe("partner_manager");
  });

  it("un lot refuse un seuil d'anonymat inférieur à 10 et un forfait non talent", async () => {
    const { org } = await partner();
    const admin = await person();
    const plan = await db.plan.findUniqueOrThrow({ where: { code: "talent_pro" } });
    const base = {
      partnerId: org.id,
      name: "Lot",
      planId: plan.id,
      seats: "5",
      months: "3",
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 90 * day).toISOString(),
    };
    await expect(createBatch(db, admin.id, { ...base, minGroup: "5" })).rejects.toThrow(
      PartnerError,
    );
    const company = await db.plan.findUniqueOrThrow({ where: { code: "company_plus" } });
    await expect(createBatch(db, admin.id, { ...base, planId: company.id })).rejects.toThrow(
      PartnerError,
    );
  });

  it("on ne distribue pas plus de licences que le lot n'en contient ; une révocation libère la licence", async () => {
    const { ctx, batch } = await partner({ seats: 3 });
    const list = await codes(ctx, batch.id, 3);
    await expect(generateCodes(db, ctx, { batchId: batch.id, quantity: "1" })).rejects.toThrow(
      PartnerError,
    );
    await expect(
      inviteByEmail(db, ctx, { batchId: batch.id, text: "a@jumanly.test", consent: true }),
    ).rejects.toMatchObject({ code: "noneAvailable" });
    await revokeCode(db, ctx, list[0]!.id);
    expect((await listBatches(db, ctx))[0]?.available).toBe(1);
  });

  it("import d'e-mails : invalides, doublons et personnes déjà invitées sont écartés", async () => {
    const { ctx, batch } = await partner();
    await expect(
      inviteByEmail(db, ctx, { batchId: batch.id, text: "a@jumanly.test", consent: false }),
    ).rejects.toMatchObject({ code: "consent" });
    const first = await inviteByEmail(db, ctx, {
      batchId: batch.id,
      text: "email;prenom\nun@jumanly.test;Un\npas-une-adresse;X\nUN@jumanly.test;Un\ndeux@jumanly.test;",
      consent: true,
    });
    expect(first).toMatchObject({ valid: 2, invalid: 1, duplicates: 1, alreadyInvited: 0 });
    expect(first.invitations).toHaveLength(2);
    const second = await inviteByEmail(db, ctx, {
      batchId: batch.id,
      text: "un@jumanly.test, trois@jumanly.test",
      consent: true,
    });
    expect(second.alreadyInvited).toBe(1);
    expect(second.invitations.map((item) => item.email)).toEqual(["trois@jumanly.test"]);
    expect(await invitationCounts(db, ctx, batch.id)).toEqual({
      sent: 3,
      activated: 0,
      expired: 0,
    });
  });

  it("un partenaire ne voit ni ne modifie le lot d'un autre", async () => {
    const a = await partner();
    const b = await partner();
    await expect(listCodes(db, a.ctx, b.batch.id)).rejects.toMatchObject({ code: "notFound" });
    await expect(
      generateCodes(db, a.ctx, { batchId: b.batch.id, quantity: "1" }),
    ).rejects.toMatchObject({ code: "notFound" });
    const [code] = await codes(b.ctx, b.batch.id, 1);
    await expect(revokeCode(db, a.ctx, code!.id)).rejects.toMatchObject({ code: "notFound" });
    expect((await listBatches(db, a.ctx)).map((batch) => batch.id)).toEqual([a.batch.id]);
  });
});

describe("Activation", () => {
  it("un code active un abonnement sponsorisé, une seule fois", async () => {
    const { ctx, batch } = await partner();
    const [code] = await codes(ctx, batch.id, 1);
    const talent = await person();
    const typed = `${code!.code.slice(4, 8).toLowerCase()} ${code!.code.slice(8)}`;
    const result = await activateLicense(db, talent, { code: typed });
    expect(result).toMatchObject({ ok: true, status: "active", planName: "Pro" });
    const plan = await resolvePlan(db, { type: "user", id: talent.id });
    expect(plan?.status).toBe("sponsored");
    expect(plan?.planCode).toBe("talent_pro");
    const other = await person();
    expect(await activateLicense(db, other, { code: code!.code })).toEqual({
      ok: false,
      error: "used",
    });
    const [second] = await codes(ctx, batch.id, 1);
    expect(await activateLicense(db, talent, { code: second!.code })).toEqual({
      ok: false,
      error: "alreadyActive",
    });
  });

  it("codes inconnus, révoqués, programme pas commencé ou terminé", async () => {
    const talent = await person();
    expect(await activateLicense(db, talent, { code: "JMLY-ZZZZ-ZZZZ" })).toEqual({
      ok: false,
      error: "invalid",
    });
    const upcoming = await partner({ startsAt: new Date(Date.now() + 10 * day) });
    const [early] = await codes(upcoming.ctx, upcoming.batch.id, 1);
    expect(await activateLicense(db, talent, { code: early!.code })).toMatchObject({
      ok: false,
      error: "notYet",
    });
    const { ctx, batch } = await partner();
    const [revoked] = await codes(ctx, batch.id, 1);
    await revokeCode(db, ctx, revoked!.id);
    expect(await activateLicense(db, talent, { code: revoked!.code })).toMatchObject({
      error: "invalid",
    });
    await db.licenseBatch.update({
      where: { id: batch.id },
      data: { endsAt: new Date(Date.now() - 1000) },
    });
    const [late] = await db.license.findMany({ where: { batchId: batch.id, status: "available" } });
    if (late) {
      expect(await activateLicense(db, talent, { code: late.code })).toMatchObject({
        error: "expired",
      });
    }
  });

  it("une invitation par e-mail ne s'active qu'avec la bonne adresse", async () => {
    const { ctx, batch } = await partner();
    const invited = await person();
    const { invitations } = await inviteByEmail(db, ctx, {
      batchId: batch.id,
      text: invited.email,
      consent: true,
    });
    const intruder = await person();
    const refused = await activateLicense(db, intruder, { code: invitations[0]!.code });
    expect(refused).toMatchObject({ ok: false, error: "emailMismatch" });
    expect(refused.ok ? "" : refused.maskedEmail).toMatch(/^t\*\*\*@jumanly\.test$/);
    expect(await activateLicense(db, invited, { code: invitations[0]!.code })).toMatchObject({
      ok: true,
    });
  });

  it("un lien d'invitation s'arrête à son nombre maximal d'activations", async () => {
    const { ctx, batch } = await partner();
    const link = await createLink(db, ctx, { batchId: batch.id, maxUses: "2" });
    for (let i = 0; i < 2; i++) {
      expect(await activateLicense(db, await person(), { token: link.token })).toMatchObject({
        ok: true,
      });
    }
    expect(await activateLicense(db, await person(), { token: link.token })).toEqual({
      ok: false,
      error: "exhausted",
    });
    expect((await listLinks(db, ctx, batch.id))[0]?.uses).toBe(2);
    // Activations through a link never appear in the partner's code list.
    expect(await listCodes(db, ctx, batch.id)).toEqual([]);
  });

  it("licence supérieure à un forfait payé : elle s'applique tout de suite", async () => {
    const { ctx, batch } = await partner();
    const [code] = await codes(ctx, batch.id, 1);
    const talent = await person();
    await subscribe(talent.id, "talent_starter");
    expect(await activateLicense(db, talent, { code: code!.code })).toMatchObject({
      status: "active",
    });
    expect((await resolvePlan(db, { type: "user", id: talent.id }))?.planCode).toBe("talent_pro");
  });

  it("forfait payé supérieur : la licence est mise en attente jusqu'à la fin de la période", async () => {
    const { ctx, batch } = await partner();
    const [code] = await codes(ctx, batch.id, 1);
    const talent = await person();
    await subscribe(talent.id, "talent_premium");
    const result = await activateLicense(db, talent, { code: code!.code });
    expect(result).toMatchObject({ ok: true, status: "pending", currentPlan: "Premium" });
    expect((await resolvePlan(db, { type: "user", id: talent.id }))?.planCode).toBe(
      "talent_premium",
    );
    const later = new Date(Date.now() + 21 * day);
    invalidate();
    expect((await resolvePlan(db, { type: "user", id: talent.id }, later))?.planCode).toBe(
      "talent_pro",
    );
  });

  it("la licence se termine au plus tard à la fin du contrat, puis retour au gratuit", async () => {
    const { ctx, batch } = await partner({ months: 6, endsAt: new Date(Date.now() + 30 * day) });
    const [code] = await codes(ctx, batch.id, 1);
    const talent = await person();
    const result = await activateLicense(db, talent, { code: code!.code });
    expect(result.ok && result.endDate.getTime()).toBe(batch.endsAt.getTime());
    const after = new Date(batch.endsAt.getTime() + day);
    const report = await runBillingJobs(db, null, after, [talent.id]);
    expect(report.licensesExpired).toBe(1);
    invalidate();
    expect((await resolvePlan(db, { type: "user", id: talent.id }, after))?.status).toBe("free");
    const license = await db.license.findUniqueOrThrow({ where: { id: code!.id } });
    expect(license.status).toBe("expired");
  });
});

describe("Rapports agrégés", () => {
  async function partnerWithBeneficiaries(count: number) {
    const setup = await partner({ seats: 30 });
    const list = await codes(setup.ctx, setup.batch.id, count);
    const course = await db.course.findFirstOrThrow({ where: { status: "published" } });
    const people = [];
    for (const code of list) {
      const talent = await person();
      await db.user.update({
        where: { id: talent.id },
        data: { name: `Nom Secret ${talent.id}`, firstName: "Prénom", lastName: "Secret" },
      });
      await activateLicense(db, talent, { code: code.code });
      await db.enrollment.create({
        data: {
          userId: talent.id,
          courseId: course.id,
          progress: 100,
          completedAt: new Date(),
        },
      });
      people.push(talent);
    }
    return { ...setup, people };
  }

  it("en dessous de 10 bénéficiaires, aucun indicateur n'est affiché", async () => {
    const { ctx } = await partnerWithBeneficiaries(4);
    const report = await impactReport(db, ctx, {
      from: new Date(0),
      to: new Date(Date.now() + day),
    });
    expect(report.enough).toBe(false);
    expect(report.population).toBeNull();
    expect(report.learning.coursesCompleted).toEqual({ value: null, hidden: true });
    const dashboard = await partnerDashboard(db, ctx);
    expect(dashboard.active30.hidden).toBe(true);
    expect(dashboard.totals.activated).toBe(4);
  });

  it("à partir de 10, les cellules apparaissent ; celles sous le seuil restent masquées", async () => {
    const { ctx } = await partnerWithBeneficiaries(10);
    const report = await impactReport(db, ctx, {
      from: new Date(0),
      to: new Date(Date.now() + day),
    });
    expect(report.enough).toBe(true);
    expect(report.learning.coursesCompleted).toEqual({ value: 10, hidden: false });
    expect(report.reach.activated.value).toBe(10);
    // Nobody applied: the cell concerns 0 people, so it stays hidden.
    expect(report.employment.applications.hidden).toBe(true);
  });

  it("aucune donnée nominative n'atteint l'espace partenaire", async () => {
    const { ctx, batch, people } = await partnerWithBeneficiaries(11);
    await inviteByEmail(db, ctx, {
      batchId: batch.id,
      text: "invitee-fictive@jumanly.test",
      consent: true,
    });
    const range = { from: new Date(0), to: new Date(Date.now() + day) };
    const everything = JSON.stringify([
      await partnerDashboard(db, ctx),
      await impactReport(db, ctx, range),
      await impactReport(db, ctx, { ...range, batchId: batch.id }),
      await listBatches(db, ctx),
      await listCodes(db, ctx, batch.id),
      await listLinks(db, ctx, batch.id),
      await invitationCounts(db, ctx, batch.id),
    ]);
    const profiles = await db.talentProfile.findMany({
      where: { userId: { in: people.map((item) => item.id) } },
      select: { id: true },
    });
    for (const talent of people) {
      expect(everything).not.toContain(talent.id);
      expect(everything).not.toContain(talent.email);
      expect(everything).not.toContain(`Nom Secret ${talent.id}`);
    }
    for (const profile of profiles) expect(everything).not.toContain(profile.id);
    expect(everything).not.toContain("Secret");
    expect(everything).not.toContain("invitee-fictive");
    expect(everything).not.toMatch(
      /"(userId|email|invitedEmail|firstName|lastName|profileId|subscriptionId)"/,
    );
  });
});

describe("Admin v2 · étape 8 : partenaires", () => {
  it("modifie un partenaire avec un motif, gardé dans le journal", async () => {
    const { org } = await partner();
    const admin = await person();
    await expect(
      updatePartner(db, admin.id, { partnerId: org.id, name: "Nom", kind: "bank", reason: "" }),
    ).rejects.toBeInstanceOf(PartnerError);
    await updatePartner(db, admin.id, {
      partnerId: org.id,
      name: "Banque test fictive",
      kind: "bank",
      reason: "Nom officiel du contrat",
    });
    const updated = await db.organization.findUniqueOrThrow({ where: { id: org.id } });
    expect(updated).toMatchObject({ name: "Banque test fictive", partnerKind: "bank" });
    const log = await db.auditLog.findFirstOrThrow({
      where: { action: "partner.update", targetId: org.id },
    });
    expect(log.metadata).toMatchObject({ reason: "Nom officiel du contrat" });
  });

  it("le début d'un lot ne change plus une fois commencé", async () => {
    const { batch } = await partner();
    const admin = await person();
    await expect(
      updateBatch(db, admin.id, {
        batchId: batch.id,
        name: "Lot renommé",
        startsAt: new Date(Date.now() + 5 * day).toISOString().slice(0, 10),
        reason: "Erreur de saisie",
      }),
    ).rejects.toMatchObject({ code: "batchClosed" });
    await updateBatch(db, admin.id, {
      batchId: batch.id,
      name: "Lot renommé",
      contractRef: "CT-TEST",
      amount: "1 250,50",
      reason: "Référence du contrat signé",
    });
    expect(await db.licenseBatch.findUniqueOrThrow({ where: { id: batch.id } })).toMatchObject({
      name: "Lot renommé",
      contractRef: "CT-TEST",
      priceCents: 125050,
    });
  });

  it("prolonge un lot : les licences arrêtées à l'ancienne fin vont plus loin", async () => {
    const end = new Date(Date.now() + 30 * day);
    const { ctx, batch } = await partner({ months: 12, endsAt: end });
    const [first] = await codes(ctx, batch.id, 3);
    const beneficiary = await person();
    const activation = await activateLicense(db, beneficiary, { code: first!.code });
    expect(activation.ok).toBe(true);
    const admin = await person();
    await expect(
      extendBatch(db, admin.id, {
        batchId: batch.id,
        endsAt: new Date(Date.now() + 10 * day).toISOString(),
        reason: "Avenant",
      }),
    ).rejects.toBeInstanceOf(PartnerError);
    const newEnd = new Date(Date.now() + 200 * day);
    const result = await extendBatch(db, admin.id, {
      batchId: batch.id,
      endsAt: newEnd.toISOString(),
      reason: "Avenant signé",
    });
    expect(result.extended).toBe(1);
    const subscription = await db.subscription.findFirstOrThrow({
      where: { subjectId: beneficiary.id, source: "license" },
    });
    expect(subscription.currentPeriodEnd.getTime()).toBe(newEnd.getTime());

    const detail = await batchDetail(db, admin.id, batch.id);
    expect(detail?.codes).toMatchObject({ activated: 1, active: 1, unused: 2, available: 17 });
    // One beneficiary: below the threshold, the impact is hidden.
    expect(detail?.impact.reach.active.hidden).toBe(true);
  });
});
