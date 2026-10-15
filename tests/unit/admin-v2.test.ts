import { describe, expect, it } from "vitest";
import messages from "../../messages/fr.json";
import {
  deletionBlock,
  parseUntil,
  readUserFilters,
  userState,
} from "@/server/services/admin-users";
import {
  AUDIT_FAMILIES,
  AUDIT_TARGETS,
  familyOf,
  readAuditFilters,
  reasonOf,
} from "@/server/services/admin-audit";
import {
  aiSpike,
  attentionScore,
  monthKey,
  parseMonth,
  parseUsd,
  prorateCosts,
} from "@/server/services/admin-insights";
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

describe("indicateurs intelligents (Admin v2, étape 2)", () => {
  it("classe d'abord l'argent et les personnes, puis l'ancienneté", () => {
    expect(attentionScore("payments", 0, false)).toBeGreaterThan(attentionScore("jobs", 0, false));
    expect(attentionScore("jobs", 10, false)).toBeGreaterThan(attentionScore("reports", 0, false));
    // The age counts for 30 days at most; a dispute past its deadline jumps ahead.
    expect(attentionScore("jobs", 90, false)).toBe(attentionScore("jobs", 30, false));
    expect(attentionScore("disputes", 7, true)).toBeGreaterThan(
      attentionScore("payments", 7, false),
    );
  });

  it("ne signale une dépense d'IA que si elle est nettement inhabituelle", () => {
    // 2 USD today against 0,50 USD a day: alert.
    expect(aiSpike(2_000_000, 15_000_000)).toEqual({
      lastDayCents: 200,
      averageCents: 50,
      factor: 3,
    });
    // Three times the average is not reached.
    expect(aiSpike(2_000_000, 30_000_000)).toBeNull();
    // A few cents are never news.
    expect(aiSpike(500_000, 0)).toBeNull();
    // First spending ever, above 1 USD.
    expect(aiSpike(1_500_000, 0)).not.toBeNull();
  });

  it("lit les montants et les mois saisis", () => {
    expect(parseUsd("120,50")).toBe(12050);
    expect(parseUsd(" 1 200.5 ")).toBe(120050);
    expect(parseUsd("")).toBe(0);
    expect(parseUsd("-3")).toBeNull();
    expect(parseUsd("12,345")).toBeNull();
    expect(parseMonth("2026-10")?.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(parseMonth("2026-13")).toBeNull();
    expect(monthKey(new Date("2026-02-01T00:00:00Z"))).toBe("2026-02");
  });

  it("compte chaque mois au prorata de sa part dans la période", () => {
    const rows = [
      { month: new Date("2026-09-01T00:00:00Z"), category: "hosting" as const, amountCents: 3000 },
      { month: new Date("2026-10-01T00:00:00Z"), category: "hosting" as const, amountCents: 3100 },
      { month: new Date("2026-08-01T00:00:00Z"), category: "other" as const, amountCents: 999 },
    ];
    // 16 September → 16 October: half of September, 15 days of October.
    const totals = prorateCosts(
      rows,
      new Date("2026-09-16T00:00:00Z"),
      new Date("2026-10-16T00:00:00Z"),
    );
    expect(totals.hosting).toBe(1500 + 1500);
    expect(totals.other).toBe(0);
  });
});

describe("utilisateurs (Admin v2, étape 3)", () => {
  const base = {
    actorId: "admin",
    targetId: "cible",
    targetRole: "user",
    otherAdmins: 1,
    ownsOrganization: false,
    status: "active",
  };

  it("bloque la suppression de soi, du dernier administrateur et d'un propriétaire", () => {
    expect(deletionBlock(base)).toBeNull();
    expect(deletionBlock({ ...base, targetId: "admin" })).toBe("self");
    expect(deletionBlock({ ...base, targetRole: "platform_admin", otherAdmins: 0 })).toBe(
      "lastAdmin",
    );
    expect(deletionBlock({ ...base, targetRole: "platform_admin", otherAdmins: 2 })).toBeNull();
    expect(deletionBlock({ ...base, ownsOrganization: true })).toBe("owner");
    expect(deletionBlock({ ...base, status: "deleted" })).toBe("deleted");
    // The job deleting accounts on schedule has no author.
    expect(deletionBlock({ ...base, actorId: null })).toBeNull();
  });

  it("accepte une date de fin entre demain et deux ans", () => {
    const now = new Date("2026-10-15T12:00:00Z");
    expect(parseUntil("2026-10-15", now)).toBeNull();
    expect(parseUntil("2026-10-16", now)?.toISOString()).toBe("2026-10-16T23:59:59.999Z");
    expect(parseUntil("2028-10-15", now)).toBeNull();
    expect(parseUntil("16/10/2026", now)).toBeNull();
  });

  it("donne l'état d'un compte et lit les filtres de la liste", () => {
    const user = { status: "active", deletionScheduledAt: null, emailVerified: true };
    expect(userState(user)).toBe("active");
    expect(userState({ ...user, emailVerified: false })).toBe("unverified");
    expect(userState({ ...user, deletionScheduledAt: new Date() })).toBe("deletionScheduled");
    expect(userState({ ...user, status: "suspended" })).toBe("suspended");
    expect(userState({ ...user, status: "deleted" })).toBe("deleted");
    expect(readUserFilters({ statut: "deleted", pays: "cd", role: "intrus" })).toMatchObject({
      state: "deleted",
      country: "CD",
      role: undefined,
    });
  });
});
