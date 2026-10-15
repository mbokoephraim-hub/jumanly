import { describe, expect, it } from "vitest";
import messages from "../../messages/fr.json";
import {
  AUDIT_FAMILIES,
  AUDIT_TARGETS,
  familyOf,
  readAuditFilters,
  reasonOf,
} from "@/server/services/admin-audit";
import { normalizeQuery, searchKindsFor } from "@/server/services/admin-search";

describe("journal d'audit (Admin v2)", () => {
  it("range une action dans sa famille", () => {
    expect(familyOf("user.suspend")).toBe("user");
    expect(familyOf("org.verification.verify")).toBe("org");
    expect(familyOf("match.dispute.corrected")).toBe("match");
    expect(familyOf("inconnu.action")).toBeNull();
  });

  it("retrouve le motif, quel que soit le champ qui l'a gardé", () => {
    expect(reasonOf({ reason: "Fraude" })).toBe("Fraude");
    expect(reasonOf({ note: " Nouveaux poids " })).toBe("Nouveaux poids");
    expect(reasonOf({ resolution: "Score confirmé" })).toBe("Score confirmé");
    expect(reasonOf({ reason: "" })).toBeNull();
    expect(reasonOf(null)).toBeNull();
    expect(reasonOf(["reason"])).toBeNull();
  });

  it("lit les filtres de l'adresse et ignore les valeurs inconnues", () => {
    expect(
      readAuditFilters({
        action: "user",
        cible: "user",
        periode: "7",
        auteur: " esther ",
        id: "u1",
      }),
    ).toEqual({ family: "user", target: "user", period: 7, actor: "esther", targetId: "u1" });
    expect(readAuditFilters({ action: "drop", cible: "table", periode: "3" })).toEqual({
      family: undefined,
      target: undefined,
      period: undefined,
      actor: undefined,
      targetId: undefined,
    });
  });

  it("a un libellé pour chaque famille et chaque cible du filtre", () => {
    const journal = messages.admin.journal as {
      family: Record<string, string>;
      target: Record<string, string>;
    };
    for (const family of AUDIT_FAMILIES) expect(journal.family[family], family).toBeTruthy();
    for (const target of AUDIT_TARGETS) expect(journal.target[target], target).toBeTruthy();
  });
});

describe("recherche globale (Admin v2)", () => {
  it("ne cherche que ce que le rôle peut ouvrir", () => {
    expect(searchKindsFor("platform_admin")).toEqual([
      "users",
      "organizations",
      "jobs",
      "courses",
      "plans",
    ]);
    expect(searchKindsFor("support_agent")).not.toContain("courses");
    expect(searchKindsFor("content_editor")).toEqual(["courses"]);
    expect(searchKindsFor("user")).toEqual([]);
  });

  it("nettoie la saisie", () => {
    expect(normalizeQuery("  Awa   Fictive ")).toBe("Awa Fictive");
    expect(normalizeQuery("x".repeat(300))).toHaveLength(120);
  });
});
