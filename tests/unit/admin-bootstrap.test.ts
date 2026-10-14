import { describe, expect, it, vi } from "vitest";
import {
  bootstrapAdminEmails,
  bootstrapAdminIfListed,
  shouldBootstrapAdmin,
} from "@/server/services/admin-bootstrap";

const user = { id: "u1", email: "Owner@Example.com", emailVerified: true, platformRole: "user" };

describe("premier administrateur (ADMIN_BOOTSTRAP_EMAIL)", () => {
  it("lit une liste d'adresses séparées par des virgules", () => {
    expect(bootstrapAdminEmails(" owner@example.com , x@y.io,,pas-une-adresse")).toEqual([
      "owner@example.com",
      "x@y.io",
    ]);
    expect(bootstrapAdminEmails(undefined)).toEqual([]);
  });

  it("ne promeut qu'une adresse listée, vérifiée, sans rôle", () => {
    const allowed = ["owner@example.com"];
    expect(shouldBootstrapAdmin(user, allowed)).toBe(true);
    expect(shouldBootstrapAdmin({ ...user, emailVerified: false }, allowed)).toBe(false);
    expect(shouldBootstrapAdmin({ ...user, platformRole: "support_agent" }, allowed)).toBe(false);
    expect(shouldBootstrapAdmin({ ...user, email: "autre@example.com" }, allowed)).toBe(false);
    expect(shouldBootstrapAdmin(user, [])).toBe(false);
  });

  it("donne le rôle et journalise, une seule fois", async () => {
    const db = { user: { update: vi.fn() }, auditLog: { create: vi.fn() } };
    const fake = db as unknown as Parameters<typeof bootstrapAdminIfListed>[0];
    expect(await bootstrapAdminIfListed(fake, user, "owner@example.com")).toBe(true);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { platformRole: "platform_admin" },
    });
    expect(db.auditLog.create).toHaveBeenCalledOnce();
    expect(await bootstrapAdminIfListed(fake, user, "")).toBe(false);
    expect(db.user.update).toHaveBeenCalledOnce();
  });
});
