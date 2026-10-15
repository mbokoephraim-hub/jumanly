import { describe, expect, it } from "vitest";
import { pickEntryRole, splitHook } from "@/lib/auth-entry";

describe("profil de l'écran d'entrée", () => {
  it("prend d'abord ?profil=", () => {
    expect(pickEntryRole("rh", "company")).toBe("rh");
    expect(pickEntryRole("company", null)).toBe("company");
  });

  it("sinon le dernier choix de l'appareil", () => {
    expect(pickEntryRole(undefined, "company")).toBe("company");
    expect(pickEntryRole("inconnu", "rh")).toBe("rh");
  });

  it("sinon Talent ; le profil partenaire n'est pas proposé ici", () => {
    expect(pickEntryRole(null, null)).toBe("talent");
    expect(pickEntryRole("partner", "partner")).toBe("talent");
    expect(pickEntryRole(undefined, "entreprise")).toBe("talent");
  });
});

describe("accroche découpée en mots", () => {
  it("marque les mots en dégradé et garde le point d'interrogation avec le mot d'avant", () => {
    expect(splitHook("Prêt à <hl>booster votre employabilité</hl> ?")).toEqual([
      { text: "Prêt", hl: false },
      { text: "à", hl: false },
      { text: "booster", hl: true },
      { text: "votre", hl: true },
      { text: "employabilité ?", hl: true },
    ]);
  });

  it("colle la virgule au mot précédent", () => {
    const words = splitHook("Prêt à recruter les <hl>bons profils</hl>, plus vite ?");
    expect(words.map((word) => word.text)).toEqual([
      "Prêt",
      "à",
      "recruter",
      "les",
      "bons",
      "profils,",
      "plus",
      "vite ?",
    ]);
    expect(words.filter((word) => word.hl).map((word) => word.text)).toEqual(["bons", "profils,"]);
  });
});
