import { afterEach, describe, expect, it, vi } from "vitest";
import { asleepRedirects, asleepTarget, isAsleepHref, productScope } from "@/lib/product-scope";

afterEach(() => vi.unstubAllEnvs());

describe("productScope", () => {
  it("vaut full par défaut et pour toute autre valeur", () => {
    vi.stubEnv("PRODUCT_SCOPE", "");
    expect(productScope()).toBe("full");
    vi.stubEnv("PRODUCT_SCOPE", "learn");
    expect(productScope()).toBe("full");
  });
  it("vaut hire seulement avec PRODUCT_SCOPE=hire", () => {
    vi.stubEnv("PRODUCT_SCOPE", "hire");
    expect(productScope()).toBe("hire");
  });
});

describe("pages en veille", () => {
  it("ne change rien en mode full", () => {
    expect(asleepRedirects("full")).toEqual([]);
    expect(asleepTarget("/formations", "full")).toBeNull();
    expect(isAsleepHref("/app/fil", "full")).toBe(false);
  });
  it("renvoie le public vers le site et l'espace vers l'accueil du compte", () => {
    expect(asleepTarget("/formations", "hire")).toBe("/");
    expect(asleepTarget("/formations/excel", "hire")).toBe("/");
    expect(asleepTarget("/portfolio/demo", "hire")).toBe("/");
    expect(asleepTarget("/app/learn/rechercher", "hire")).toBe("/app");
    expect(asleepTarget("/app/fil/publier", "hire")).toBe("/app");
    expect(asleepTarget("/app/jobs", "hire")).toBe("/offres");
  });
  it("garde le recrutement, les pages carrière et ce qui appartient au talent", () => {
    for (const path of [
      "/",
      "/offres",
      "/offres/analyste",
      "/entreprises/baobab",
      "/tarifs",
      "/recruteurs",
      "/app/hire",
      "/app/jobs/candidatures",
      "/app/jobs/analyste",
      "/app/suivi",
      "/app/messages",
      "/app/profil",
      "/formationsx",
    ])
      expect(asleepTarget(path, "hire"), path).toBeNull();
  });
  it("lit un lien avec paramètres ou ancre", () => {
    expect(isAsleepHref("/formations?domaine=data", "hire")).toBe(true);
    expect(isAsleepHref("/talents#faq", "hire")).toBe(true);
    expect(isAsleepHref("/offres?q=data", "hire")).toBe(false);
  });
  it("donne des redirections temporaires (307), jamais permanentes", () => {
    const rules = asleepRedirects("hire");
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.every((rule) => rule.permanent === false)).toBe(true);
    expect(rules).toContainEqual({
      source: "/app/learn/:path*",
      destination: "/app",
      permanent: false,
    });
  });
});
