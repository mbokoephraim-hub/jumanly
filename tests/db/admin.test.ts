import { afterAll, describe, expect, it } from "vitest";
import { auditHistory, listAudit } from "@/server/services/admin-audit";
import { adminSearch } from "@/server/services/admin-search";
import { cleanup, db, newUser } from "./helpers";

const users: string[] = [];

afterAll(async () => {
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
