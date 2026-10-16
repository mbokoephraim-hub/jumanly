import { afterAll, describe, expect, it } from "vitest";
import { can, consume, limit, resolvePlan, usage } from "@/server/entitlements";
import {
  createTesterOrganization,
  setTesterPlan,
  TESTER_OVERRIDE_REASON,
  TesterError,
} from "@/server/services/tester";
import { cleanup, db, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { actorId: { in: users } } });
  await db.membership.deleteMany({ where: { userId: { in: users } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function tester() {
  const user = await newUser();
  users.push(user.id);
  return { actor: { ...user, ip: null }, list: user.email };
}

describe("compte passe-partout (TESTER_EMAILS)", () => {
  it("refuse une adresse non listée", async () => {
    const { actor } = await tester();
    await expect(
      setTesterPlan(db, actor, { type: "user", id: actor.id }, "talent_premium", new Date(), ""),
    ).rejects.toBeInstanceOf(TesterError);
    const other = await tester();
    await expect(
      setTesterPlan(
        db,
        actor,
        { type: "user", id: other.actor.id },
        "talent_pro",
        new Date(),
        actor.email,
      ),
    ).rejects.toBeInstanceOf(TesterError);
  });

  it("passe d'un forfait talent à l'autre sans paiement, quotas remis à zéro, journalisé", async () => {
    const { actor, list } = await tester();
    const subject = { type: "user" as const, id: actor.id };
    await setTesterPlan(db, actor, subject, "talent_premium", new Date(), list);
    expect((await resolvePlan(db, subject))?.planCode).toBe("talent_premium");
    expect(await can(db, subject, "career.linkedin")).toBe(true);
    await consume(db, subject, "ai.credits.monthly");
    expect((await usage(db, subject, "ai.credits.monthly")).used).toBe(1);

    await setTesterPlan(db, actor, subject, "talent_starter", new Date(), list);
    expect((await resolvePlan(db, subject))?.planCode).toBe("talent_starter");
    expect((await usage(db, subject, "ai.credits.monthly")).used).toBe(0);

    await setTesterPlan(db, actor, subject, "talent_free", new Date(), list);
    expect((await resolvePlan(db, subject))?.planCode).toBe("talent_free");
    expect(await db.payment.count({ where: { subjectId: actor.id } })).toBe(0);
    const log = await db.auditLog.findMany({
      where: { actorId: actor.id, action: "subscription.tester" },
    });
    expect(log).toHaveLength(3);
  });

  it("crée une organisation de test et lui donne Company Premium utilisable", async () => {
    const { actor, list } = await tester();
    const org = await createTesterOrganization(db, actor, "company", "Organisation de test", list);
    orgs.push(org.id);
    const again = await createTesterOrganization(db, actor, "company", "Autre", list);
    expect(again.id).toBe(org.id);
    const subject = { type: "organization" as const, id: org.id };
    await setTesterPlan(db, actor, subject, "company_premium", new Date(), list);
    expect((await resolvePlan(db, subject))?.planCode).toBe("company_premium");
    expect(await limit(db, subject, "org.seats")).toBeGreaterThan(0);
    await setTesterPlan(db, actor, subject, "rh_pro", new Date(), list);
    expect((await resolvePlan(db, subject))?.planCode).toBe("rh_pro");
    expect(
      await db.entitlementOverride.count({
        where: { subjectId: org.id, reason: TESTER_OVERRIDE_REASON },
      }),
    ).toBe(0);
    // A talent plan does not apply to an organization, nor another person's organization.
    await expect(
      setTesterPlan(db, actor, subject, "talent_pro", new Date(), list),
    ).rejects.toBeInstanceOf(TesterError);
    const other = await tester();
    await expect(
      setTesterPlan(db, other.actor, subject, "rh_pro", new Date(), other.list),
    ).rejects.toBeInstanceOf(TesterError);
  });

  it("crée une institution partenaire de test", async () => {
    const { actor, list } = await tester();
    const org = await createTesterOrganization(db, actor, "partner", "Institution de test", list);
    orgs.push(org.id);
    const membership = await db.membership.findFirst({ where: { userId: actor.id } });
    expect(membership?.role).toBe("partner_manager");
    expect(org.type).toBe("partner");
  });
});
