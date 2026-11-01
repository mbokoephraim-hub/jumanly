import { describe, expect, it } from "vitest";
import messages from "../../messages/fr.json";
import { entitlementSeeds, planSeeds } from "../../prisma/seed/plans";
import { compareRows } from "@/config/pricing-compare";
import { parseConsent, readConsentCookie, serializeConsent } from "@/lib/consent";
import { durationParts } from "@/lib/format";
import { hasPlaceholder, withoutPlaceholders } from "@/lib/placeholders";
import { isSafeInternalPath, joinHref, loginHref, signupHref } from "@/lib/signup";
import {
  contactSchema,
  partnerContactSchema,
  quoteSchema,
  routeContact,
} from "@/server/services/contact";
import { contractFilterOf, jobWhere, parseJobFilters } from "@/server/services/jobs";
import { courseWhere, parseCourseFilters } from "@/server/services/courses";
import {
  planCtaHref,
  planForCatalogLevel,
  plansOf,
  type PublicPlan,
} from "@/server/services/plans";

/** Plans as the public pages read them, built from the seed (no database needed). */
const plans: PublicPlan[] = planSeeds.map((plan) => ({
  code: plan.code,
  family: plan.family,
  name: plan.name,
  tagline: plan.tagline,
  contentKey: plan.contentKey,
  priceCents: plan.priceCents,
  isPurchasable: plan.isPurchasable,
  recommended: plan.recommended,
  entitlements: Object.fromEntries(
    entitlementSeeds()
      .filter((row) => row.planCode === plan.code)
      .map((row) => [row.key, row.value]),
  ),
}));

function hasMessage(key: string): boolean {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null || !(part in node)) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string";
}

describe("textes à compléter", () => {
  it("masque les parties entre crochets et les blocs vides", () => {
    expect(hasPlaceholder("Siège : [adresse]")).toBe(true);
    expect(withoutPlaceholders("Siège : [adresse] à confirmer")).toBe("Siège : à confirmer");
    expect(withoutPlaceholders("[à rédiger]")).toBeNull();
    expect(withoutPlaceholders("Texte complet")).toBe("Texte complet");
  });
});

describe("liens d'inscription", () => {
  it("transmet le profil, le forfait et la suite", () => {
    expect(signupHref()).toBe("/inscription");
    expect(signupHref({ profil: "talent", forfait: "talent_pro", suite: "/offres/x" })).toBe(
      "/inscription?profil=talent&forfait=talent_pro&suite=%2Foffres%2Fx",
    );
    expect(loginHref("/offres/x")).toBe("/connexion?suite=%2Foffres%2Fx");
  });

  it("refuse les redirections vers un autre site", () => {
    expect(isSafeInternalPath("//exemple.com")).toBe(false);
    expect(isSafeInternalPath("/\\exemple.com")).toBe(false);
    expect(isSafeInternalPath("https://exemple.com")).toBe(false);
    expect(signupHref({ suite: "//exemple.com" })).toBe("/inscription");
    expect(loginHref("https://exemple.com")).toBe("/connexion");
  });

  it("chaque formule mène à l'inscription (ou à la liste d'attente), au devis ou au formulaire partenaires", () => {
    for (const plan of plans) {
      const href = planCtaHref(plan);
      if (plan.family === "partner") expect(href).toBe("/partenaires#contact");
      else if (!plan.isPurchasable && plan.priceCents === null)
        expect(href).toBe("/contact?sujet=devis");
      else {
        // Inscriptions fermées : la liste d'attente (src/lib/signup.ts) ; ouvertes : l'inscription.
        expect(href).toBe(joinHref({ profil: plan.family, forfait: plan.code }));
        expect(href).toMatch(/^\/(inscription|liste-attente)\?/);
        expect(href).toContain(`profil=`);
      }
    }
  });
});

describe("forfaits affichés", () => {
  it("chaque formule a ses textes (nom de contenu en base, jamais dans le code)", () => {
    for (const plan of plans) {
      if (plan.family === "partner") continue;
      expect(hasMessage(`${plan.contentKey}.ideal`), plan.contentKey).toBe(true);
      expect(hasMessage(`${plan.contentKey}.cta`), plan.contentKey).toBe(true);
    }
  });

  it("chaque case des comparatifs a un texte", () => {
    const prefixes = {
      talent: "pricing.talent.compare",
      rh: "pricing.rh.compare",
      company: "pricing.company.compare",
    } as const;
    for (const [family, prefix] of Object.entries(prefixes)) {
      const rows = compareRows[family as keyof typeof prefixes] ?? [];
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(hasMessage(`${prefix}.${row.label}`), `${prefix}.${row.label}`).toBe(true);
        for (const plan of plansOf(plans, family as keyof typeof prefixes)) {
          const cell = row.cell(plan);
          if (cell.kind !== "text") continue;
          const key = cell.key.startsWith("ui.") ? cell.key : `${prefix}.${cell.key}`;
          expect(hasMessage(key), `${plan.code} → ${key}`).toBe(true);
        }
      }
    }
  });

  it("indique la formule la moins chère qui ouvre une formation", () => {
    expect(planForCatalogLevel(plans, "free")).toBeNull();
    const plan = planForCatalogLevel(plans, "fundamentals");
    expect(plan?.family).toBe("talent");
    expect(plan?.priceCents).toBeGreaterThan(0);
  });
});

describe("formulaire de contact", () => {
  const valid = {
    subject: "account",
    name: "Awa",
    email: "awa@exemple.org",
    message: "Bonjour, je voudrais en savoir plus sur Jumanly.",
    consent: "on",
  };

  it("accepte un message complet", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("refuse un message trop court, un e-mail invalide ou sans consentement", () => {
    expect(contactSchema.safeParse({ ...valid, message: "Court" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, email: "awa" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, consent: undefined }).success).toBe(false);
  });

  it("exige l'organisation pour une demande de devis", () => {
    expect(contactSchema.safeParse({ ...valid, subject: "quote" }).success).toBe(false);
    expect(
      contactSchema.safeParse({ ...valid, subject: "quote", organization: "Démo SA" }).success,
    ).toBe(true);
  });

  it("demande de devis Company Premium : champs obligatoires et nombres validés", () => {
    const quote = {
      organization: "Groupe Démo",
      name: "Awa Fictive",
      role: "DRH",
      email: "awa@exemple.org",
      country: "Côte d'Ivoire",
      users: "40",
      consent: "on",
    };
    const ok = quoteSchema.safeParse({ ...quote, needs: ["workflows", "inconnu"] });
    expect(ok.success).toBe(true);
    expect(ok.data?.users).toBe(40);
    expect(ok.data?.needs).toEqual(["workflows"]);
    expect(quoteSchema.safeParse(quote).data?.needs).toEqual([]);
    expect(quoteSchema.safeParse({ ...quote, role: "" }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...quote, country: "" }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...quote, users: "quarante" }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...quote, entities: "4,5" }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...quote, consent: undefined }).success).toBe(false);
  });

  it("envoie les demandes professionnelles à la boîte pro", () => {
    const boxes = { pro: "pro@x", general: "general@x" };
    expect(routeContact("quote", boxes)).toBe("pro@x");
    expect(routeContact("partners", boxes)).toBe("pro@x");
    expect(routeContact("account", boxes)).toBe("general@x");
  });

  it("accepte une demande partenaire avec un long message", () => {
    const result = partnerContactSchema.safeParse({
      organization: "Fondation Démo",
      type: "foundation",
      name: "Awa",
      email: "awa@exemple.org",
      message: "x".repeat(800),
      consent: "on",
    });
    expect(result.success).toBe(true);
  });
});

describe("filtres publics", () => {
  it("ignore les valeurs inconnues au lieu d'échouer", () => {
    const filters = parseJobFilters({ contrat: "inconnu", page: "-3", q: "  vente " });
    expect(filters.contrat).toBeUndefined();
    expect(filters.page).toBeUndefined();
    expect(filters.q).toBe("vente");
    expect(parseCourseFilters({ niveau: "expert" }).niveau).toBeUndefined();
  });

  it("regroupe mission et freelance, et ne montre que les offres ouvertes", () => {
    expect(contractFilterOf("freelance")).toBe("mission");
    const where = JSON.stringify(jobWhere(parseJobFilters({ contrat: "mission" }), new Date(0)));
    expect(where).toContain("freelance");
    expect(where).toContain("published");
  });

  it("ne montre que les formations publiées", () => {
    expect(JSON.stringify(courseWhere(parseCourseFilters({})))).toContain("published");
  });
});

describe("durées et consentement", () => {
  it("formate les durées", () => {
    expect(durationParts(45).key).toBe("minutes");
    expect(durationParts(120)).toEqual({ key: "hours", values: { hours: 2, minutes: 0 } });
    expect(durationParts(90)).toEqual({ key: "hoursMinutes", values: { hours: 1, minutes: 30 } });
  });

  it("lit et écrit le choix cookies", () => {
    const value = serializeConsent({ analytics: true, preferences: false });
    expect(value).toBe("v1.a1.p0");
    expect(parseConsent(value)).toEqual({ analytics: true, preferences: false });
    expect(parseConsent("n'importe quoi")).toBeNull();
    expect(readConsentCookie(`autre=1; jm_consent=${value}`)).toEqual({
      analytics: true,
      preferences: false,
    });
  });
});
