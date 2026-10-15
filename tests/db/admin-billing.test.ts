import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { resolvePlan } from "@/server/entitlements";
import {
  AdminBillingError,
  cancelSubscription,
  changeSubscriptionPlan,
  createPlan,
  deletePlan,
  duplicatePlan,
  extendSubscription,
  planUsage,
  planVersions,
  recordManualPayment,
  subscriptionTimeline,
  withdrawPlan,
} from "@/server/services/admin-billing";
import { cleanup, db, newUser } from "./helpers";

const users: string[] = [];
const planCodes: string[] = [];
const DAY = 86_400_000;
const reason = "Test Admin v2 (fictif)";

afterAll(async () => {
  const plans = await db.plan.findMany({ where: { code: { in: planCodes } } });
  await db.auditLog.deleteMany({
    where: {
      OR: [{ targetId: { in: plans.map((plan) => plan.id) } }, { actorId: { in: users } }],
    },
  });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await cleanup(users);
  await db.planEntitlement.deleteMany({ where: { plan: { code: { in: planCodes } } } });
  await db.plan.deleteMany({ where: { code: { in: planCodes } } });
  await db.$disconnect();
});

async function admin() {
  const user = await newUser();
  users.push(user.id);
  return { actorId: user.id };
}

function code(prefix: string) {
  const value = `${prefix}_${randomUUID().slice(0, 8)}`;
  planCodes.push(value);
  return value;
}

async function subscribed(planCode: string, status: "active" | "past_due" = "active", days = 20) {
  const user = await newUser();
  users.push(user.id);
  const plan = await db.plan.findUniqueOrThrow({ where: { code: planCode } });
  const now = Date.now();
  const subscription = await db.subscription.create({
    data: {
      subjectType: "user",
      subjectId: user.id,
      planId: plan.id,
      status,
      currentPeriodStart: new Date(now - 10 * DAY),
      currentPeriodEnd: new Date(now + days * DAY),
    },
  });
  return { user, subscription, plan };
}

describe("forfaits (Admin v2, étape 5)", () => {
  it("crée et duplique un forfait masqué et non vendu, avec ses droits", async () => {
    const context = await admin();
    const created = await createPlan(db, context, {
      family: "talent",
      code: code("test_nouveau"),
      name: "Nouveau test",
      reason,
    });
    expect(created).toMatchObject({ isPublic: false, isPurchasable: false, priceCents: null });
    const base = await db.plan.findFirstOrThrow({
      where: { family: "talent" },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { entitlements: true } } },
    });
    expect(await db.planEntitlement.count({ where: { planId: created.id } })).toBe(
      base._count.entitlements,
    );

    const copy = await duplicatePlan(db, context, {
      source: "talent_pro",
      code: code("test_copie"),
      name: "Pro (copie test)",
      reason,
    });
    const pro = await db.plan.findUniqueOrThrow({ where: { code: "talent_pro" } });
    expect(copy).toMatchObject({
      isPublic: false,
      isPurchasable: false,
      priceCents: pro.priceCents,
    });
    // A copy never becomes the family's free plan.
    expect((await planUsage(db, copy.id))?.isFree).toBe(false);
    await expect(
      duplicatePlan(db, context, { source: "talent_pro", code: copy.code, name: "x", reason }),
    ).rejects.toThrow(AdminBillingError);

    const versions = await planVersions(db, copy.id);
    expect(versions[0]).toMatchObject({ action: "plan.duplicate", reason });
  });

  it("supprime un forfait jamais utilisé, et seulement celui-là", async () => {
    const context = await admin();
    const draft = await createPlan(db, context, {
      family: "talent",
      code: code("test_brouillon"),
      name: "Brouillon",
      reason,
    });
    const { subscription } = await subscribed(draft.code);
    await expect(deletePlan(db, context, { code: draft.code, reason })).rejects.toThrow(
      AdminBillingError,
    );
    // Withdrawn instead: hidden, not sold, the subscriber keeps it.
    await withdrawPlan(db, context, { code: draft.code, reason });
    expect(await db.subscription.findUnique({ where: { id: subscription.id } })).not.toBeNull();

    const unused = await createPlan(db, context, {
      family: "talent",
      code: code("test_inutile"),
      name: "Inutile",
      reason,
    });
    await deletePlan(db, context, { code: unused.code, reason });
    expect(await db.plan.findUnique({ where: { code: unused.code } })).toBeNull();
    // The family's free plan is never withdrawn nor deleted.
    await expect(withdrawPlan(db, context, { code: "talent_free", reason })).rejects.toThrow(
      AdminBillingError,
    );
  });
});

describe("abonnements (Admin v2, étape 5)", () => {
  it("prolonge un abonnement en délai de grâce : il redevient actif", async () => {
    const context = await admin();
    const { subscription } = await subscribed("talent_starter", "past_due", -2);
    const until = new Date(Date.now() + 40 * DAY).toISOString().slice(0, 10);
    const updated = await extendSubscription(db, context, {
      subscription: subscription.id,
      until,
      reason,
    });
    expect(updated.status).toBe("active");
    expect(updated.currentPeriodEnd.toISOString().slice(0, 10)).toBe(until);
    await expect(
      extendSubscription(db, context, {
        subscription: subscription.id,
        until: new Date(Date.now() + 900 * DAY).toISOString().slice(0, 10),
        reason,
      }),
    ).rejects.toThrow(AdminBillingError);
  });

  it("change le forfait tout de suite ou à l'échéance", async () => {
    const context = await admin();
    const { user, subscription } = await subscribed("talent_starter");
    await changeSubscriptionPlan(db, context, {
      subscription: subscription.id,
      plan: "talent_pro",
      when: "term",
      reason,
    });
    const scheduled = await db.subscription.findUniqueOrThrow({
      where: { id: subscription.id },
      include: { plan: true, pendingPlan: true },
    });
    expect(scheduled.plan.code).toBe("talent_starter");
    expect(scheduled.pendingPlan?.code).toBe("talent_pro");

    await changeSubscriptionPlan(db, context, {
      subscription: subscription.id,
      plan: "talent_pro",
      when: "now",
      reason,
    });
    expect((await resolvePlan(db, { type: "user", id: user.id }))?.planCode).toBe("talent_pro");
    // An organization plan does not fit a talent.
    await expect(
      changeSubscriptionPlan(db, context, {
        subscription: subscription.id,
        plan: "company_plus",
        when: "now",
        reason,
      }),
    ).rejects.toThrow(AdminBillingError);
  });

  it("résilie à l'échéance puis tout de suite : retour au gratuit", async () => {
    const context = await admin();
    const { user, subscription } = await subscribed("talent_pro");
    await cancelSubscription(db, context, { subscription: subscription.id, when: "term", reason });
    const atTerm = await db.subscription.findUniqueOrThrow({ where: { id: subscription.id } });
    expect(atTerm).toMatchObject({ status: "canceled", cancelAtPeriodEnd: true });
    // Already cancelled at its term: only « now » remains.
    await expect(
      cancelSubscription(db, context, { subscription: subscription.id, when: "term", reason }),
    ).rejects.toThrow(AdminBillingError);
    await cancelSubscription(db, context, { subscription: subscription.id, when: "now", reason });
    expect((await resolvePlan(db, { type: "user", id: user.id }))?.planCode).toBe("talent_free");
    const timeline = await subscriptionTimeline(db, subscription.id);
    expect(timeline?.events.map((event) => event.kind)).toEqual(
      expect.arrayContaining(["created", "admin", "ended"]),
    );
  });

  it("un paiement manuel suit la période payée, avec facture, et refuse une référence en double", async () => {
    const context = await admin();
    const { user, subscription } = await subscribed("talent_starter");
    const reference = `VIR-${randomUUID().slice(0, 8)}`;
    const payment = await recordManualPayment(db, context, {
      subscription: subscription.id,
      plan: "talent_starter",
      method: "bank_transfer",
      amount: "4,99",
      months: 2,
      reference,
      reason,
    });
    expect(payment).toMatchObject({
      status: "succeeded",
      provider: "manual",
      method: "bank_transfer",
      amountCents: 499,
      kind: "renewal",
    });
    expect(payment.invoice?.number).toMatch(/^JMN-/);
    expect(payment.periodStart.getTime()).toBe(subscription.currentPeriodEnd.getTime());
    const after = await db.subscription.findUniqueOrThrow({ where: { id: subscription.id } });
    expect(after.currentPeriodEnd.getTime()).toBe(payment.periodEnd.getTime());
    expect(await db.notification.count({ where: { userId: user.id, type: "renewed" } })).toBe(1);

    await expect(
      recordManualPayment(db, context, {
        subscription: subscription.id,
        plan: "talent_starter",
        method: "cash",
        amount: "4.99",
        months: 1,
        reference,
        reason,
      }),
    ).rejects.toThrow(AdminBillingError);
  });
});
