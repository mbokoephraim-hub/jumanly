import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { invalidate, resolvePlan, type Subject } from "@/server/entitlements";
import { FakePaymentProvider } from "@/server/payments/fake";
import {
  liveSubscription,
  refreshPayment,
  scheduleDowngrade,
  setCancelAtPeriodEnd,
  startCheckout,
  startTrial,
  TRIAL_DAYS,
} from "@/server/services/subscriptions";
import { cleanup, db, newUser } from "./helpers";

const users: string[] = [];
const provider = new FakePaymentProvider();

afterAll(async () => {
  await cleanup(users);
  await db.$disconnect();
});
beforeEach(() => invalidate());

async function talent(): Promise<Subject> {
  const user = await newUser();
  users.push(user.id);
  return { type: "user", id: user.id };
}

async function pay(subject: Subject, planCode: string, msisdn = "0990001234") {
  const result = await startCheckout(db, provider, {
    subject,
    planCode,
    method: "mobile_money",
    email: "test@jumanly.test",
    country: "CD",
    msisdn,
    operator: "mpesa",
    returnUrl: "http://localhost/",
  });
  if (result.status !== "started") throw new Error(result.status);
  return result.paymentId;
}

describe("abonnements prépayés", () => {
  it("un paiement réussi active le forfait, une seule fois", async () => {
    const subject = await talent();
    const paymentId = await pay(subject, "talent_pro");
    await Promise.all([
      refreshPayment(db, provider, paymentId),
      refreshPayment(db, provider, paymentId),
    ]);
    await refreshPayment(db, provider, paymentId);
    const subscriptions = await db.subscription.findMany({ where: { subjectId: subject.id } });
    expect(subscriptions).toHaveLength(1);
    expect((await resolvePlan(db, subject))?.planCode).toBe("talent_pro");
    const payment = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    expect(payment.status).toBe("succeeded");
    expect(payment.msisdnMasked).toBe("••••••1234");
  });

  it("un paiement échoué laisse le compte en gratuit", async () => {
    const subject = await talent();
    const paymentId = await pay(subject, "talent_pro", "0990000000");
    expect((await refreshPayment(db, provider, paymentId))?.status).toBe("failed");
    expect((await resolvePlan(db, subject))?.planCode).toBe("talent_free");
  });

  it("refuse un second paiement tant qu'un autre est en attente", async () => {
    const subject = await talent();
    await pay(subject, "talent_pro", "0990002222");
    const second = await startCheckout(db, provider, {
      subject,
      planCode: "talent_pro",
      method: "card",
      email: "test@jumanly.test",
      country: "CD",
      returnUrl: "http://localhost/",
    });
    expect(second.status).toBe("duplicate");
  });

  it("renouveler prolonge la période ; monter en gamme remplace le forfait", async () => {
    const subject = await talent();
    await refreshPayment(db, provider, await pay(subject, "talent_starter"));
    const first = await liveSubscription(db, subject);
    await refreshPayment(db, provider, await pay(subject, "talent_starter"));
    const renewed = await liveSubscription(db, subject);
    expect(renewed?.id).toBe(first?.id);
    expect(renewed!.currentPeriodEnd.getTime()).toBeGreaterThan(first!.currentPeriodEnd.getTime());

    await refreshPayment(db, provider, await pay(subject, "talent_premium"));
    expect((await resolvePlan(db, subject))?.planCode).toBe("talent_premium");
    const live = await db.subscription.findMany({
      where: { subjectId: subject.id, status: "active" },
    });
    expect(live).toHaveLength(1);
  });

  it("un forfait d'une autre famille ne peut pas être acheté", async () => {
    const subject = await talent();
    const result = await startCheckout(db, provider, {
      subject,
      planCode: "rh_pro",
      method: "card",
      email: "test@jumanly.test",
      country: "CD",
      returnUrl: "http://localhost/",
    });
    expect(result.status).toBe("unavailable");
  });

  it("l'essai dure 14 jours et ne se cumule pas", async () => {
    const subject = await talent();
    const trial = await startTrial(db, subject, "talent_pro");
    expect(trial?.status).toBe("trialing");
    const days =
      (trial!.currentPeriodEnd.getTime() - trial!.currentPeriodStart.getTime()) / 86_400_000;
    expect(days).toBe(TRIAL_DAYS);
    expect(await startTrial(db, subject, "talent_premium")).toBeNull();
    expect((await resolvePlan(db, subject))?.status).toBe("trialing");
  });

  it("la résiliation garde le forfait jusqu'à la fin de la période", async () => {
    const subject = await talent();
    await refreshPayment(db, provider, await pay(subject, "talent_pro"));
    const canceled = await setCancelAtPeriodEnd(db, subject, true);
    expect(canceled?.status).toBe("canceled");
    expect((await resolvePlan(db, subject))?.planCode).toBe("talent_pro");
    const resumed = await setCancelAtPeriodEnd(db, subject, false);
    expect(resumed?.status).toBe("active");
  });

  it("la descente de gamme est programmée, jamais vers un forfait plus cher", async () => {
    const subject = await talent();
    await refreshPayment(db, provider, await pay(subject, "talent_pro"));
    expect(await scheduleDowngrade(db, subject, "talent_premium")).toBeNull();
    const scheduled = await scheduleDowngrade(db, subject, "talent_starter");
    expect(scheduled?.pendingPlan?.code).toBe("talent_starter");
    expect((await resolvePlan(db, subject))?.planCode).toBe("talent_pro");
  });
});
