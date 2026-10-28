import { describe, expect, it } from "vitest";
import { countryCode, countryName, flagOf, timeZoneOf } from "@/lib/countries";
import { colorOf, familyShares, PROFILE_COLORS } from "@/lib/profile-colors";
import {
  cleanSocialLinks,
  handleFromName,
  handleInput,
  parseSocialLinks,
  socialLinksInput,
} from "@/lib/social-links";

// docs/profil-personne: colours of the skills, networks, handle and flag.
describe("couleur d'une compétence", () => {
  it("est stable : même compétence, même couleur, quelle que soit l'écriture", () => {
    expect(colorOf("Power BI")).toBe(colorOf("power  bi"));
    expect(colorOf("Négociation")).toBe(colorOf("negociation"));
    expect(PROFILE_COLORS).toContain(colorOf("SQL"));
  });

  it("utilise plusieurs couleurs de la palette", () => {
    const names = ["SQL", "Excel", "Power BI", "Python", "Statistiques", "Négociation", "Anglais"];
    expect(new Set(names.map(colorOf)).size).toBeGreaterThan(2);
  });

  it("répartit les familles en pourcentages qui font 100", () => {
    const shares = familyShares(["data", "data", "data", "finance", "soft", "language", "office"]);
    expect(shares).toHaveLength(3);
    expect(shares[0]?.family).toBe("data");
    expect(shares.reduce((sum, item) => sum + item.share, 0)).toBe(100);
    expect(familyShares([])).toEqual([]);
  });
});

describe("réseaux et alias", () => {
  it("garde les adresses du bon réseau et ajoute https", () => {
    const parsed = socialLinksInput.parse({
      linkedin: "linkedin.com/in/fictif",
      x: "https://twitter.com/fictif",
      website: "",
    });
    expect(cleanSocialLinks(parsed)).toEqual({
      linkedin: "https://linkedin.com/in/fictif",
      x: "https://twitter.com/fictif",
    });
  });

  it("refuse une adresse d'un autre site dans le champ d'un réseau", () => {
    expect(socialLinksInput.safeParse({ linkedin: "https://evil.example/in/x" }).success).toBe(
      false,
    );
    expect(socialLinksInput.safeParse({ facebook: "javascript:alert(1)" }).success).toBe(false);
  });

  it("ne montre jamais une valeur enregistrée inattendue", () => {
    expect(
      parseSocialLinks({
        linkedin: "https://www.linkedin.com/in/a",
        instagram: "https://x.com/a",
        foo: 1,
      }),
    ).toEqual({ linkedin: "https://www.linkedin.com/in/a" });
    expect(parseSocialLinks(null)).toEqual({});
  });

  it("valide l'alias : lettres, chiffres et points, 3 à 30", () => {
    expect(handleInput.parse("@Patrick.Ilunga")).toBe("patrick.ilunga");
    expect(handleInput.safeParse("ab").success).toBe(false);
    expect(handleInput.safeParse(".patrick").success).toBe(false);
    expect(handleInput.safeParse("patrick ilunga").success).toBe(false);
    expect(handleFromName("Grâce Mbuyi (démo)")).toBe("grace.mbuyi");
  });
});

describe("pays", () => {
  it("lit un code ou un nom et dessine le drapeau", () => {
    expect(countryCode("cd")).toBe("CD");
    expect(countryCode("RD Congo")).toBe("CD");
    expect(countryCode("Ghana")).toBe("GH");
    expect(countryCode("Atlantide")).toBeNull();
    expect(flagOf("CD")).toBe("🇨🇩");
    expect(countryName("CD")).toBe("RD Congo");
    expect(timeZoneOf("GH")).toBe("Africa/Accra");
  });
});
