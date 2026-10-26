import { describe, expect, it } from "vitest";
import {
  NO_FILTERS,
  activeFilters,
  exploreFiltersSchema,
  residenceMatches,
  salaryMatches,
  sectorMatches,
  sectorsOf,
  showsSection,
} from "@/server/services/explore-filters";

// docs/fil-menu-publication § 3: the filters of Explorer (contract, salary, sector, residence).
describe("Filtres d'Explorer", () => {
  it("n'accepte que les filtres prévus : ni genre, ni âge, ni nationalité", () => {
    const parsed = exploreFiltersSchema.parse({});
    expect(parsed).toEqual(NO_FILTERS);
    expect(Object.keys(parsed).sort()).toEqual(
      ["contracts", "residence", "salary", "scope", "sectors"].sort(),
    );
    // Unknown keys are dropped, never applied.
    const withGender = exploreFiltersSchema.parse({ gender: "f", age: 25, nationality: "CD" });
    expect(withGender).toEqual(NO_FILTERS);
    expect(exploreFiltersSchema.safeParse({ contracts: ["freelance"] }).success).toBe(false);
    expect(exploreFiltersSchema.safeParse({ salary: "1000" }).success).toBe(false);
  });

  it("compte les filtres actifs comme la maquette (portée exclue, « Partout » ne compte pas)", () => {
    expect(activeFilters(NO_FILTERS)).toBe(0);
    expect(
      activeFilters({
        scope: "offres",
        contracts: ["cdi", "stage"],
        salary: "from300",
        sectors: ["banque"],
        residence: "rdc",
      }),
    ).toBe(5);
    expect(activeFilters({ ...NO_FILTERS, residence: "partout" })).toBe(0);
  });

  it("la portée montre les bonnes rubriques", () => {
    expect(showsSection("tout", "personnes")).toBe(true);
    expect(showsSection("offres", "offres")).toBe(true);
    expect(showsSection("offres", "entreprises")).toBe(false);
    expect(showsSection("personnes", "offres")).toBe(false);
  });

  it("salaire mensuel : la fourchette de l'offre croise la tranche choisie", () => {
    const usd = (value: number) => value * 100;
    expect(salaryMatches(usd(250), usd(280), "lt300")).toBe(true);
    expect(salaryMatches(usd(300), usd(500), "lt300")).toBe(false);
    expect(salaryMatches(usd(250), usd(400), "from300")).toBe(true);
    expect(salaryMatches(usd(900), null, "from800")).toBe(true);
    expect(salaryMatches(null, usd(1600), "gt1500")).toBe(true);
    expect(salaryMatches(usd(800), usd(1200), "from300")).toBe(false);
    expect(salaryMatches(usd(1500), usd(2000), "from800")).toBe(false);
    // An offer that does not say its salary never claims a range.
    expect(salaryMatches(null, null, "lt300")).toBe(false);
  });

  it("secteur : le texte libre de l'entreprise rejoint les secteurs du filtre", () => {
    expect(sectorsOf("Banque et microfinance")).toEqual(["banque"]);
    expect(sectorsOf("Énergie")).toEqual(["energie"]);
    expect(sectorsOf("Télécommunications")).toEqual(["telecom"]);
    expect(sectorsOf("Conseil en recrutement")).toEqual(["cabinet", "rh"]);
    expect(sectorsOf("Data et finance")).toEqual(["tech", "banque"]);
    expect(sectorsOf("Santé")).toEqual(["sante"]);
    expect(sectorsOf("Industrie minière")).toEqual(["mines"]);
    expect(sectorsOf(null)).toEqual([]);
    expect(sectorMatches("Transport et logistique", [])).toBe(true);
    expect(sectorMatches("Transport et logistique", ["tech"])).toBe(false);
    expect(sectorMatches("Énergie solaire", ["energie", "mines"])).toBe(true);
  });

  it("résidence : le pays du profil, RDC, autre pays ou partout", () => {
    expect(residenceMatches("CD", "rdc")).toBe(true);
    expect(residenceMatches("RD Congo", "rdc")).toBe(true);
    expect(residenceMatches("République démocratique du Congo", "rdc")).toBe(true);
    expect(residenceMatches("Sénégal", "rdc")).toBe(false);
    expect(residenceMatches("Sénégal", "autre")).toBe(true);
    expect(residenceMatches("CD", "autre")).toBe(false);
    expect(residenceMatches(null, "autre")).toBe(false);
    expect(residenceMatches(null, "partout")).toBe(true);
    expect(residenceMatches(null, null)).toBe(true);
  });
});
