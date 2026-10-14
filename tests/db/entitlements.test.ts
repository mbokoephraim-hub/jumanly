import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { entitlementSeeds, planSeeds } from "../../prisma/seed/plans";
import {
  can,
  consume,
  invalidate,
  level,
  limit,
  QuotaExceededError,
  resolvePlan,
  usage,
  type Subject,
} from "@/server/entitlements";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const day = 86_400_000;

afterAll(async () => {
  await cleanup(users, orgs);
  await db.$disconnect();
});
beforeEach(() => invalidate());

async function subscribe(
  subject: Subject,
  planCode: string,
  status: "active" | "sponsored" = "active",
  days = 30,
) {
  const plan = await db.plan.findUniqueOrThrow({ where: { code: planCode } });
  const now = new Date();
  await db.subscription.create({
    data: {
      subjectType: subject.type,
      subjectId: subject.id,
      planId: plan.id,
      status,
      source: status === "sponsored" ? "license" : "self",
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + days * day),
    },
  });
  invalidate(subject);
}

async function subjectFor(family: string): Promise<Subject> {
  if (family === "talent") {
    const user = await newUser();
    users.push(user.id);
    return { type: "user", id: user.id };
  }
  const org = await newOrganization(
    family === "partner" ? "partner" : family === "company" ? "company" : "recruiter",
  );
  orgs.push(org.id);
  return { type: "organization", id: org.id };
}

describe("moteur de droits : chaque forfait applique sa matrice", () => {
  const matrix = entitlementSeeds();
  for (const plan of planSeeds) {
    it(plan.code, async () => {
      const subject = await subjectFor(plan.family);
      if (plan.priceCents !== 0) await subscribe(subject, plan.code);
      const resolved = await resolvePlan(db, subject);
      expect(resolved?.planCode).toBe(plan.code);
      for (const row of matrix.filter((entry) => entry.planCode === plan.code)) {
        expect(resolved?.values[row.key], row.key).toBe(row.value);
        if (row.type === "boolean")
          expect(await can(db, subject, row.key)).toBe(row.value === "true");
        if (row.type === "level") expect(await level(db, subject, row.key)).toBe(row.value);
        if (row.type === "limit" && row.value !== "contract") {
          expect(await limit(db, subject, row.key)).toBe(Number(row.value));
        }
      }
    });
  }
});

describe("moteur de droits : règles", () => {
  it("candidater est toujours permis, même en Free", async () => {
    const talent = await subjectFor("talent");
    expect(await can(db, talent, "jobs.apply")).toBe(true);
    const plans = await db.plan.findMany({
      include: { entitlements: { where: { key: "jobs.apply" } } },
    });
    for (const plan of plans.filter((item) => item.family === "talent")) {
      expect(plan.entitlements[0]?.value, plan.code).toBe("true");
    }
  });

  it("revient au forfait gratuit de la famille sans abonnement", async () => {
    expect((await resolvePlan(db, await subjectFor("talent")))?.planCode).toBe("talent_free");
    expect((await resolvePlan(db, await subjectFor("rh")))?.planCode).toBe("rh_free");
    expect((await resolvePlan(db, await subjectFor("company")))?.planCode).toBe("rh_free");
  });

  it("une clé inconnue est refusée", async () => {
    const talent = await subjectFor("talent");
    expect(await can(db, talent, "inconnu.cle")).toBe(false);
    expect(await limit(db, talent, "inconnu.cle")).toBe(0);
  });

  it("une licence sponsorisée l'emporte sur un forfait payant inférieur, pas sur un supérieur", async () => {
    const lower = await subjectFor("talent");
    await subscribe(lower, "talent_starter");
    await subscribe(lower, "talent_pro", "sponsored");
    expect((await resolvePlan(db, lower))?.status).toBe("sponsored");

    const higher = await subjectFor("talent");
    await subscribe(higher, "talent_premium");
    await subscribe(higher, "talent_pro", "sponsored");
    const plan = await resolvePlan(db, higher);
    expect(plan?.status).toBe("active");
    expect(plan?.planCode).toBe("talent_premium");
  });

  it("un abonnement échu passe en grâce puis revient au gratuit", async () => {
    const talent = await subjectFor("talent");
    const plan = await db.plan.findUniqueOrThrow({ where: { code: "talent_pro" } });
    const now = new Date();
    await db.subscription.create({
      data: {
        subjectType: "user",
        subjectId: talent.id,
        planId: plan.id,
        status: "active",
        currentPeriodStart: new Date(now.getTime() - 31 * day),
        currentPeriodEnd: new Date(now.getTime() - day),
      },
    });
    expect((await resolvePlan(db, talent, now))?.status).toBe("past_due");
    invalidate();
    expect((await resolvePlan(db, talent, new Date(now.getTime() + 3 * day)))?.planCode).toBe(
      "talent_free",
    );
  });

  it("consomme un quota jusqu'à sa limite, puis refuse", async () => {
    const talent = await subjectFor("talent");
    await subscribe(talent, "talent_starter");
    const max = await limit(db, talent, "career.interview.text.monthly");
    expect(max).toBe(3);
    for (let i = 0; i < max; i++) await consume(db, talent, "career.interview.text.monthly");
    expect((await usage(db, talent, "career.interview.text.monthly")).used).toBe(3);
    await expect(consume(db, talent, "career.interview.text.monthly")).rejects.toBeInstanceOf(
      QuotaExceededError,
    );
    expect((await usage(db, talent, "career.interview.text.monthly")).used).toBe(3);
  });

  it("refuse un quota à 0 et ne bloque jamais un quota illimité", async () => {
    const talent = await subjectFor("talent");
    await expect(consume(db, talent, "ai.credits.monthly")).rejects.toBeInstanceOf(
      QuotaExceededError,
    );
    await db.entitlementOverride.create({
      data: {
        subjectType: "user",
        subjectId: talent.id,
        key: "ai.credits.monthly",
        value: "-1",
        reason: "test",
      },
    });
    invalidate(talent);
    for (let i = 0; i < 5; i++) await consume(db, talent, "ai.credits.monthly", 100);
    expect((await usage(db, talent, "ai.credits.monthly")).used).toBe(500);
  });

  it("des consommations simultanées ne dépassent jamais la limite", async () => {
    const talent = await subjectFor("talent");
    await subscribe(talent, "talent_starter");
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => consume(db, talent, "career.interview.text.monthly")),
    );
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(3);
    expect((await usage(db, talent, "career.interview.text.monthly")).used).toBe(3);
  });

  it("une dérogation remplace la valeur du forfait", async () => {
    const talent = await subjectFor("talent");
    expect(await can(db, talent, "career.linkedin")).toBe(false);
    await db.entitlementOverride.create({
      data: {
        subjectType: "user",
        subjectId: talent.id,
        key: "career.linkedin",
        value: "true",
        reason: "test",
      },
    });
    invalidate(talent);
    expect(await can(db, talent, "career.linkedin")).toBe(true);
  });

  it("une modification de forfait en base s'applique après invalidation, sans redémarrage", async () => {
    const talent = await subjectFor("talent");
    await subscribe(talent, "talent_starter");
    const plan = await db.plan.findUniqueOrThrow({ where: { code: "talent_starter" } });
    const key = { planId_key: { planId: plan.id, key: "career.interview.text.monthly" } };
    const before = await db.planEntitlement.findUniqueOrThrow({ where: key });
    try {
      await db.planEntitlement.update({ where: key, data: { value: "7" } });
      invalidate();
      expect(await limit(db, talent, "career.interview.text.monthly")).toBe(7);
    } finally {
      await db.planEntitlement.update({ where: key, data: { value: before.value } });
      invalidate();
    }
  });

  it("les quotas repartent à zéro à chaque période", async () => {
    const created = new Date(Date.now() - 40 * day);
    const user = await newUser(created);
    users.push(user.id);
    const talent: Subject = { type: "user", id: user.id };
    await db.entitlementOverride.create({
      data: {
        subjectType: "user",
        subjectId: talent.id,
        key: "ai.credits.monthly",
        value: "10",
        reason: "test",
      },
    });
    const lastMonth = new Date(Date.now() - 20 * day);
    await consume(db, talent, "ai.credits.monthly", 10, lastMonth);
    invalidate();
    expect((await usage(db, talent, "ai.credits.monthly")).used).toBe(0);
  });
});
