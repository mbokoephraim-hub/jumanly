import { afterAll, describe, expect, it } from "vitest";
import { auditHistory, listAudit } from "@/server/services/admin-audit";
import {
  attentionItems,
  costIndicators,
  monthOf,
  planUsage,
  saveMonthlyCosts,
} from "@/server/services/admin-insights";
import { adminSearch } from "@/server/services/admin-search";
import { cleanup, db, newUser } from "./helpers";

const users: string[] = [];

const FAR_MONTH = new Date(Date.UTC(2031, 4, 1));

afterAll(async () => {
  await db.platformCost.deleteMany({ where: { month: FAR_MONTH } });
  await db.auditLog.deleteMany({ where: { actorId: { in: users } } });
  await cleanup(users);
  await db.$disconnect();
});

describe("journal d'audit (Admin v2)", () => {
  it("filtre par auteur, famille et cible, et décrit la cible", async () => {
    const actor = await newUser();
    const target = await newUser();
    users.push(actor.id, target.id);
    await db.auditLog.createMany({
      data: [
        {
          actorId: actor.id,
          action: "user.suspend",
          targetType: "user",
          targetId: target.id,
          metadata: { reason: "Test fictif" },
        },
        {
          actorId: actor.id,
          action: "user.unsuspend",
          targetType: "user",
          targetId: target.id,
          metadata: { reason: "" },
        },
        {
          actorId: actor.id,
          action: "plan.update",
          targetType: "plan",
          targetId: "plan-inconnu",
          metadata: {},
        },
      ],
    });

    const byActor = await listAudit(db, { actor: actor.email });
    expect(byActor.total).toBe(3);
    const onTarget = await listAudit(db, { family: "user", target: "user", targetId: target.id });
    expect(onTarget.total).toBe(2);
    const suspension = onTarget.entries.find((entry) => entry.action === "user.suspend")!;
    expect(suspension.reason).toBe("Test fictif");
    expect(suspension.targetLabel).toBe("Test Fictif");
    expect(suspension.href).toBe(`/admin/utilisateurs?fiche=${target.id}`);
    expect(suspension.actor?.id).toBe(actor.id);

    const history = await auditHistory(db, "user", target.id);
    expect(history.map((entry) => entry.action).sort()).toEqual(["user.suspend", "user.unsuspend"]);
    expect((await listAudit(db, { actor: "personne-inexistante-xyz" })).total).toBe(0);
  });
});

describe("recherche globale (Admin v2)", () => {
  it("trouve un compte par e-mail et respecte le rôle", async () => {
    const person = await newUser();
    users.push(person.id);
    const asAdmin = await adminSearch(db, person.email, "platform_admin");
    expect(asAdmin.users.map((hit) => hit.id)).toContain(person.id);
    const asEditor = await adminSearch(db, person.email, "content_editor");
    expect(asEditor.users).toEqual([]);
    expect((await adminSearch(db, "a", "platform_admin")).users).toEqual([]);
  });
});

describe("indicateurs intelligents (Admin v2, étape 2)", () => {
  it("compte les comptes sans abonnement sur le forfait gratuit de leur famille", async () => {
    const now = new Date();
    const freeCode = (
      await db.plan.findFirstOrThrow({
        where: { family: "talent", priceCents: 0, active: true },
        orderBy: { sortOrder: "asc" },
      })
    ).code;
    const count = async () =>
      (await planUsage(db, new Date(), 30))
        .find((group) => group.family === "talent")!
        .plans.find((plan) => plan.code === freeCode)!.count;
    const before = await count();
    const person = await newUser(now);
    users.push(person.id);
    expect(await count()).toBe(before + 1);
    const usage = await planUsage(db, new Date(), 30);
    expect(usage.map((group) => group.family)).toEqual(["talent", "rh", "company", "partner"]);
  });

  it("classe ce qui demande l'attention du plus urgent au moins urgent", async () => {
    const items = await attentionItems(db);
    for (let index = 1; index < items.length; index++) {
      expect(items[index - 1]!.score).toBeGreaterThanOrEqual(items[index]!.score);
    }
    for (const item of items) expect(item.count).toBeGreaterThan(0);
  });

  it("calcule les indicateurs de coûts à partir des saisies", async () => {
    const actor = await newUser();
    users.push(actor.id);
    // A month far ahead, with no other data: only the costs entered here count.
    const now = new Date(Date.UTC(2031, 4, 31));
    expect((await costIndicators(db, now, 30, 0, 0)).entered).toBe(false);
    await saveMonthlyCosts(
      db,
      actor.id,
      monthOf(now),
      { acquisition: 31_000, hosting: 6_200, ai_external: 0, other: 0 },
      "Saisie de test",
    );
    const costs = await costIndicators(db, now, 30, 10_000, 0);
    expect(costs.entered).toBe(true);
    // 30 of the 31 days of May: hosting 6 000, acquisition 30 000.
    expect(costs.totalCents).toBe(36_000);
    // Running costs 6 000 on 10 000 of revenue: 40 % margin.
    expect(costs.grossMargin).toBe(40);
    // No new paying account nor active user in 2031.
    expect(costs.cacCents).toBeNull();
    const audit = await db.auditLog.findFirst({
      where: { actorId: actor.id, action: "cost.save" },
    });
    expect(audit?.targetId).toBe("2031-05");
  });
});
