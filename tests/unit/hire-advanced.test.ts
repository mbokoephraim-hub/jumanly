import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";
import { mentionedIds, parseTemplate, SCORECARD_CRITERIA_MAX } from "@/server/services/evaluation";
import { periodRange, reportRank } from "@/server/services/hire-reports";
import { slotToDate, validTimeZone } from "@/server/services/interviews";

describe("grille d'évaluation", () => {
  it("lit un critère par ligne, avec une précision après deux-points", () => {
    expect(parseTemplate("SQL : requêtes et jointures\n\nCommunication")).toEqual([
      { name: "SQL", description: "requêtes et jointures" },
      { name: "Communication", description: "" },
    ]);
  });

  it("refuse une grille vide ou trop longue", () => {
    expect(parseTemplate("  \n ")).toBeNull();
    const many = Array.from({ length: SCORECARD_CRITERIA_MAX + 1 }, (_, i) => `Critère ${i}`);
    expect(parseTemplate(many.join("\n"))).toBeNull();
  });
});

describe("mentions", () => {
  const members = [
    { userId: "a", name: "Grâce Fictive", firstName: "Grâce" },
    { userId: "b", name: "Moïse Fictif", firstName: "Moïse" },
  ];
  it("trouve les collègues mentionnés, jamais l'auteur", () => {
    expect(mentionedIds("Avis de @moïse ? Et @Grâce Fictive", members, "a")).toEqual(["b"]);
    expect(mentionedIds("Pas de mention", members, "a")).toEqual([]);
  });
});

describe("créneaux d'entretien", () => {
  it("lit l'heure saisie dans le fuseau de l'organisateur", () => {
    expect(slotToDate("2026-10-20T09:30", "UTC")?.toISOString()).toBe("2026-10-20T09:30:00.000Z");
    // Kinshasa is UTC+1 all year.
    expect(slotToDate("2026-10-20T09:30", "Africa/Kinshasa")?.toISOString()).toBe(
      "2026-10-20T08:30:00.000Z",
    );
    expect(slotToDate("20/10/2026", "UTC")).toBeNull();
  });

  it("refuse un fuseau inconnu", () => {
    expect(validTimeZone("Africa/Lubumbashi")).toBe(true);
    expect(validTimeZone("Mars/Olympus")).toBe(false);
  });
});

describe("rapports", () => {
  it("ordonne les niveaux", () => {
    expect(reportRank("basic")).toBeLessThan(reportRank("stats"));
    expect(reportRank("consolidated")).toBeLessThan(reportRank("custom"));
    expect(reportRank("inconnu")).toBe(0);
  });

  it("calcule la période, et revient à 30 jours si la période personnalisée est invalide", () => {
    const now = new Date("2026-10-14T12:00:00Z");
    const ninety = periodRange({ periode: "90d" }, now);
    expect(now.getTime() - ninety.from.getTime()).toBe(90 * 86_400_000);
    const custom = periodRange({ periode: "custom", du: "2026-01-01", au: "2026-03-31" }, now);
    expect(custom.from.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    const reversed = periodRange({ periode: "custom", du: "2026-03-31", au: "2026-01-01" }, now);
    expect(reversed.period).toBe("30d");
  });
});

describe("export CSV", () => {
  it("protège les cellules contre les formules et échappe les guillemets", () => {
    expect(
      toCsv(
        ["Nom", "Valeur"],
        [
          ["=SOMME(A1)", 3],
          ['Dit "oui"', -2],
        ],
      ),
    ).toBe('"Nom","Valeur"\r\n"\'=SOMME(A1)","3"\r\n"Dit ""oui""","-2"');
  });
});
