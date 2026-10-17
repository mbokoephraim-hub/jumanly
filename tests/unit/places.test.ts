import { describe, expect, it } from "vitest";
import { foldPlace, orderCountries, type CountryOption } from "@/lib/places";
import { jobWhere } from "@/server/services/jobs";
import { centralAfrica, isoCountries, localities, westAfrica } from "../../prisma/seed/places-data";

describe("pays et lieux (V8 § B1, écrans 81 et 82)", () => {
  it("met RD Congo en tête, puis les régions dans l'ordre, de A à Z", () => {
    const countries: CountryOption[] = [
      { code: "FR", name: "France", region: "world" },
      { code: "BJ", name: "Bénin", region: "west_africa" },
      { code: "AO", name: "Angola", region: "central_africa" },
      { code: "MA", name: "Maroc", region: "other_africa" },
      { code: "CD", name: "RD Congo", region: "central_africa" },
      { code: "BE", name: "Belgique", region: "world" },
      { code: "CI", name: "Côte d'Ivoire", region: "west_africa" },
    ];
    expect(orderCountries(countries).map((country) => country.code)).toEqual([
      "CD",
      "AO",
      "BJ",
      "CI",
      "MA",
      "BE",
      "FR",
    ]);
  });

  it("cherche sans accent ni majuscule", () => {
    expect(foldPlace("Côte d'Ivoire")).toContain(foldPlace("COTE"));
  });

  it("couvre tous les pays ISO et des villes pour chaque pays d'Afrique", () => {
    expect(new Set(isoCountries).size).toBe(isoCountries.length);
    expect(isoCountries).toContain("CD");
    for (const code of [...centralAfrica, ...westAfrica]) {
      expect(isoCountries).toContain(code);
      expect(localities[code]?.cities.length ?? 0).toBeGreaterThan(0);
    }
    // 26 provinces, Kinshasa (ville-province) being listed with the cities.
    expect(localities.CD?.provinces?.length).toBe(25);
    expect(localities.CD?.cities).toContain("Kinshasa");
  });

  it("filtre les offres par pays, villes et télétravail", () => {
    const where = jobWhere(
      {
        places: {
          areas: [
            { countries: ["RD Congo"], cities: ["Kinshasa"] },
            { countries: ["Congo"], cities: [] },
          ],
          remote: true,
        },
      },
      new Date("2026-10-17T00:00:00Z"),
    );
    expect(where.AND).toContainEqual({
      OR: [
        { country: { in: ["RD Congo"] }, city: { in: ["Kinshasa"], mode: "insensitive" } },
        { country: { in: ["Congo"] } },
        { remote: "remote" },
      ],
    });
  });
});
