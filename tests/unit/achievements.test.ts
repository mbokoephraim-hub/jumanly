import { describe, expect, it } from "vitest";
import { achievementsOf, achievementsText } from "@/lib/achievements";
import { isOwnExperienceLogo } from "@/server/services/experience-company";

describe("réalisations clés", () => {
  it("lit une réalisation par ligne, sans puce ni ligne vide", () => {
    expect(
      achievementsOf("• Conçu le programme\n\n- Coordonné les formations\r\n  Mesuré"),
    ).toEqual(["Conçu le programme", "Coordonné les formations", "Mesuré"]);
  });

  it("enregistre les champs remplis dans l'ordre choisi", () => {
    expect(achievementsText(["  Piloté  le   suivi ", "", "Développé les outils"])).toBe(
      "Piloté le suivi\nDéveloppé les outils",
    );
    expect(achievementsOf(achievementsText(["B", "A"]))).toEqual(["B", "A"]);
  });
});

describe("logo d'une expérience", () => {
  it("n'accepte que les logos envoyés par la personne", () => {
    expect(isOwnExperienceLogo("p1", "/medias/experiences/p1/logo-abc123.webp")).toBe(true);
    expect(isOwnExperienceLogo("p1", "/medias/experiences/p2/logo-abc123.webp")).toBe(false);
    expect(isOwnExperienceLogo("p1", "/medias/orgs/o1/logo-abc-256.webp")).toBe(false);
    expect(isOwnExperienceLogo("p1", "/medias/experiences/p1/../p2/logo.webp")).toBe(false);
    expect(isOwnExperienceLogo("p1", "https://exemple.com/logo.webp")).toBe(false);
  });
});
