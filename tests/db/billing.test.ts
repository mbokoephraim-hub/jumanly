import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { invalidate, resolvePlan, type Subject } from "@/server/entitlements";
import { GRACE_DAYS } from "@/server/entitlements/periods";
import {
  FAKE_SIGNATURE_HEADER,
  FakePaymentProvider,
  signFakeWebhook,
} from "@/server/payments/fake";
import { runBillingJobs } from "@/server/services/billing-jobs";
import { handlePaymentWebhook } from "@/server/services/payment-webhooks";
import {
  liveSubscription,
  quoteCheckout,
  refreshPayment,
  scheduleDowngrade,
  startCheckout,
} from "@/server/services/subscriptions";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const DAY = 86_400_000;
const users: string[] = [];
const orgs: string[] = [];
const provider = new FakePaymentProvider();

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.membership.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});
beforeEach(() => invalidate());

async function talent(): Promise<Subject> {
  const user = await newUser();
  users.push(user.id);
  return { type: "user", id: user.id };
}

async function pay(subject: Subject, planCode: string, msisdn = "0990001234", now = new Date()) {
  const result = await startCheckout(
    db,
    provider,
    {
      subject,
      planCode,
      method: "mobile_money",
      payerId: subject.type === "user" ? subject.id : undefined,
      email: "test@jumanly.test",
      country: "CD",
      msisdn,
      operator: "mpesa",
      returnUrl: "http://localhost/",
    },
    now,
  );
  if (result.status !== "started") throw new Error(result.status);
  return result.paymentId;
}

function webhook(body: object, signature?: string) {
  const raw = JSON.stringify(body);
  const headers = new Headers({ [FAKE_SIGNATURE_HEADER]: signature ?? signFakeWebhook(raw) });
  return handlePaymentWebhook(db, provider, headers, raw);
}

describe("webhooks signés et idempotents (partie 09 § 9.4)", () => {
  it("un webhook signé active le forfait ; rejoué, il ne fait rien", async () => {
    const subject = await talent();
    const paymentId = await pay(subject, "talent_pro", "0990002222");
    const payment = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const event = {
      id: `evt_${randomUUID()}`,
      providerRef: payment.providerRef,
      status: "succeeded",
    };

    expect(await webhook(event)).toBe("processed");
    expect(await webhook(event)).toBe("duplicate");
    expect(await webhook({ ...event, id: `evt_${randomUUID()}` })).toBe("processed");

    expect(await db.subscription.count({ where: { subjectId: subject.id } })).toBe(1);
    expect(await db.invoice.count({ where: { paymentId } })).toBe(1);
    expect(
      await db.notification.count({ where: { userId: subject.id, type: "paymentSucceeded" } }),
    ).toBe(1);
    expect((await resolvePlan(db, subject))?.planCode).toBe("talent_pro");
  });

  it("refuse une signature fausse et un montant différent", async () => {
    const subject = await talent();
    const paymentId = await pay(subject, "talent_pro", "0990002222");
    const payment = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const event = {
      id: `evt_${randomUUID()}`,
      providerRef: payment.providerRef,
      status: "succeeded",
    };
    expect(await webhook(event, "00".repeat(32))).toBe("invalidSignature");
    expect(await webhook({ ...event, amountCents: payment.amountCents - 1 })).toBe(
      "amountMismatch",
    );
    expect((await db.payment.findUniqueOrThrow({ where: { id: paymentId } })).status).toBe(
      "pending",
    );
  });

  it("un échec par webhook prévient le talent, sans activer", async () => {
    const subject = await talent();
    const paymentId = await pay(subject, "talent_pro", "0990002222");
    const payment = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    await webhook({
      id: `evt_${randomUUID()}`,
      providerRef: payment.providerRef,
      status: "failed",
    });
    expect((await db.payment.findUniqueOrThrow({ where: { id: paymentId } })).status).toBe(
      "failed",
    );
    expect(
      await db.notification.count({ where: { userId: subject.id, type: "paymentFailed" } }),
    ).toBe(1);
    expect((await resolvePlan(db, subject))?.planCode).toBe("talent_free");
  });
});

describe("factures, montée et réduction de gamme", () => {
  it("numérotation séquentielle, une facture par paiement", async () => {
    const subject = await talent();
    const first = await pay(subject, "talent_starter");
    await refreshPayment(db, provider, first);
    const second = await pay(subject, "talent_starter");
    await refreshPayment(db, provider, second);
    const [a, b] = await Promise.all([
      db.invoice.findUniqueOrThrow({ where: { paymentId: first } }),
      db.invoice.findUniqueOrThrow({ where: { paymentId: second } }),
    ]);
    expect(b.sequence).toBeGreaterThan(a.sequence);
    expect(a.number).toMatch(/^JMN-\d{4}-\d{6}$/);
  });

  it("monter en gamme déduit le temps non utilisé de l'ancien forfait", async () => {
    const subject = await talent();
    const start = new Date();
    await refreshPayment(db, provider, await pay(subject, "talent_starter", undefined, start));
    const halfway = new Date(start.getTime() + 15 * DAY);
    const quote = await quoteCheckout(db, subject, "talent_premium", halfway);
    expect(quote?.kind).toBe("upgrade");
    expect(quote!.creditCents).toBeGreaterThan(0);
    expect(quote!.totalCents).toBe(quote!.priceCents - quote!.creditCents);
    const paymentId = await pay(subject, "talent_premium", undefined, halfway);
    await refreshPayment(db, provider, paymentId, halfway);
    const invoice = await db.invoice.findUniqueOrThrow({ where: { paymentId } });
    expect(invoice.creditCents).toBe(quote!.creditCents);
    expect((await resolvePlan(db, subject, halfway))?.planCode).toBe("talent_premium");
  });

  it("un forfait moins cher n'est pas vendu en cours de période : il est programmé", async () => {
    const subject = await talent();
    await refreshPayment(db, provider, await pay(subject, "talent_premium"));
    expect((await quoteCheckout(db, subject, "talent_starter"))?.kind).toBe("downgrade");
    await scheduleDowngrade(db, subject, "talent_starter");
    const current = await liveSubscription(db, subject);
    // Renewing into the scheduled plan starts at the end of the paid period.
    const quote = await quoteCheckout(db, subject, "talent_starter");
    expect(quote?.kind).toBe("renewal");
    expect(quote!.periodStart.getTime()).toBe(current!.currentPeriodEnd.getTime());
    await refreshPayment(db, provider, await pay(subject, "talent_starter"));
    expect((await resolvePlan(db, subject))?.planCode).toBe("talent_premium");
    invalidate();
    const after = new Date(current!.currentPeriodEnd.getTime() + 3_600_000);
    expect((await resolvePlan(db, subject, after))?.planCode).toBe("talent_starter");
  });
});

describe("rappels, délai de grâce et retour au gratuit (partie 09 § 9.2)", () => {
  it("rappel J-7 envoyé une seule fois, même si la tâche tourne deux fois", async () => {
    const subject = await talent();
    await refreshPayment(db, provider, await pay(subject, "talent_pro"));
    const current = await liveSubscription(db, subject);
    const sevenDaysBefore = new Date(current!.currentPeriodEnd.getTime() - 6.5 * DAY);
    await runBillingJobs(db, provider, sevenDaysBefore);
    await runBillingJobs(db, provider, sevenDaysBefore);
    expect(await db.notification.count({ where: { userId: subject.id, type: "renewalDue" } })).toBe(
      1,
    );
  });

  it("fin de délai de grâce : retour au gratuit, offres en trop en pause, rien de supprimé", async () => {
    const owner = await newUser();
    users.push(owner.id);
    const org = await newOrganization("recruiter");
    orgs.push(org.id);
    await db.membership.create({
      data: { organizationId: org.id, userId: owner.id, role: "org_owner", status: "active" },
    });
    const recruiter = await newUser();
    users.push(recruiter.id);
    await db.membership.create({
      data: { organizationId: org.id, userId: recruiter.id, role: "recruiter", status: "active" },
    });
    const subject: Subject = { type: "organization", id: org.id };
    await refreshPayment(db, provider, await pay(subject, "rh_pro"));
    const jobs = await Promise.all(
      [1, 2, 3].map((n) =>
        db.job.create({
          data: {
            organizationId: org.id,
            title: `Offre fictive ${n}`,
            slug: `test-${randomUUID()}`,
            description: "Offre de test.",
            contractType: "cdi",
            city: "Kinshasa",
            country: "Congo-Kinshasa",
            remote: "onsite",
            status: "published",
            publishedAt: new Date(Date.now() - n * DAY),
          },
        }),
      ),
    );
    const current = await liveSubscription(db, subject);
    const end = current!.currentPeriodEnd.getTime();

    // Grace: access kept, status past_due.
    const inGrace = new Date(end + DAY);
    await runBillingJobs(db, provider, inGrace);
    invalidate();
    expect((await resolvePlan(db, subject, inGrace))?.planCode).toBe("rh_pro");
    expect((await db.subscription.findUniqueOrThrow({ where: { id: current!.id } })).status).toBe(
      "past_due",
    );
    expect(await db.notification.count({ where: { userId: owner.id, type: "grace" } })).toBe(1);

    // Grace over: free plan, one offer kept, the others back to draft, one seat.
    const after = new Date(end + (GRACE_DAYS + 1) * DAY);
    await runBillingJobs(db, provider, after);
    await runBillingJobs(db, provider, after);
    invalidate();
    expect((await resolvePlan(db, subject, after))?.planCode).toBe("rh_free");
    const rows = await db.job.findMany({ where: { organizationId: org.id } });
    expect(rows).toHaveLength(3);
    expect(rows.filter((job) => job.status === "published").map((job) => job.id)).toEqual([
      jobs[0]!.id,
    ]);
    expect(rows.filter((job) => job.pausedByBillingAt)).toHaveLength(2);
    expect((await db.membership.findFirstOrThrow({ where: { userId: recruiter.id } })).status).toBe(
      "suspended",
    );
    expect(await db.notification.count({ where: { userId: owner.id, type: "downgraded" } })).toBe(
      1,
    );

    // Paying again brings back the offers and the member, within the new limits.
    invalidate();
    await refreshPayment(db, provider, await pay(subject, "rh_pro"));
    const restored = await db.job.findMany({ where: { organizationId: org.id } });
    expect(restored.every((job) => job.status === "published")).toBe(true);
    expect((await db.membership.findFirstOrThrow({ where: { userId: recruiter.id } })).status).toBe(
      "active",
    );
  });
});
