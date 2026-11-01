import { describe, expect, it } from "vitest";
import {
  activeFilters,
  allowedFilters,
  filtersLevelOf,
  parseFilters,
  passes,
} from "@/server/services/hire-filters";
import { verificationLevelOf } from "@/server/services/hire-verification";

const row = {
  score: 72,
  years: 3,
  city: "Kinshasa",
  country: "CD",
  matched: ["Power BI", "SQL"],
  facts: [{ skill: "Excel" }],
  documents: { received: 2, asked: 3 },
  confidence: { after: { level: "medium" as const } },
  source: "direct",
  shortlisted: false,
  onHold: false,
  createdAt: new Date("2026-10-30T00:00:00Z"),
};
const now = new Date("2026-11-01T00:00:00Z");

describe("filtres du pipeline", () => {
  it("combine les filtres", () => {
    expect(passes(row, { scoreMin: 70, skill: "power", place: "kin" }, now)).toBe(true);
    expect(passes(row, { scoreMin: 75 }, now)).toBe(false);
    expect(passes(row, { complete: true }, now)).toBe(false);
    expect(passes(row, { confidence: "high" }, now)).toBe(false);
    expect(passes(row, { state: "nouveaux", days: 7 }, now)).toBe(true);
    expect(passes(row, { days: 1 }, now)).toBe(false);
  });

  it("ignore ce qui est illisible", () => {
    expect(parseFilters({ scoreMin: "x" })).toEqual({});
    expect(activeFilters({ skill: "SQL", complete: false })).toBe(1);
  });
});

describe("droits des filtres et de la vérification", () => {
  it("garde seulement les filtres simples sans formule", () => {
    const filters = { scoreMin: 70, skill: "SQL", state: "retenus" as const, days: 7 };
    expect(allowedFilters(filters, "simple")).toEqual({ state: "retenus", days: 7 });
    expect(allowedFilters(filters, "all")).toEqual(filters);
    expect(filtersLevelOf("all")).toBe("all");
    expect(filtersLevelOf(undefined)).toBe("simple");
  });

  it("lit le niveau de vérification, fermé par défaut", () => {
    expect(verificationLevelOf("custom")).toBe("custom");
    expect(verificationLevelOf("standard")).toBe("standard");
    expect(verificationLevelOf("none")).toBe("none");
    expect(verificationLevelOf(undefined)).toBe("none");
  });
});
