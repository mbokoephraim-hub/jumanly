import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import { siteJsonLd } from "@/lib/seo";
import { buildLlmsTxt } from "@/server/services/llms";

afterEach(() => vi.unstubAllEnvs());

describe("robots.txt", () => {
  it("ferme tout le site hors production", () => {
    vi.stubEnv("APP_ENV", "preview");
    expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
  });

  it("ouvre les pages publiques aux moteurs et aux assistants IA, jamais l'espace connecté", () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://jumanly.io");
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const agents = rules.flatMap((rule) => [rule.userAgent].flat());
    for (const bot of ["*", "Googlebot", "Bingbot", "GPTBot", "ClaudeBot", "PerplexityBot"]) {
      expect(agents).toContain(bot);
    }
    for (const rule of rules) {
      expect(rule.allow).toBe("/");
      expect(rule.disallow).toEqual(expect.arrayContaining(["/app", "/admin", "/api"]));
    }
    expect(result.sitemap).toBe("https://jumanly.io/sitemap.xml");
  });
});

describe("llms.txt", () => {
  it("produit un Markdown propre, sans liens cassés par les titres", () => {
    const text = buildLlmsTxt({
      title: "Jumanly",
      summary: "Résumé\nsur deux lignes",
      facts: ["Candidater est gratuit."],
      sections: [
        {
          heading: "Pages",
          links: [{ title: "Titre [piège]", url: "https://jumanly.io/faq", description: "FAQ" }],
        },
        { heading: "Vide", links: [] },
      ],
    });
    expect(text).toBe(
      [
        "# Jumanly",
        "",
        "> Résumé sur deux lignes",
        "",
        "- Candidater est gratuit.",
        "",
        "## Pages",
        "",
        "- [Titre piège](https://jumanly.io/faq): FAQ",
        "",
      ].join("\n"),
    );
  });
});

describe("données structurées du site", () => {
  it("décrit l'organisation avec un contact par e-mail uniquement", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://jumanly.io");
    const data = siteJsonLd({
      name: "Jumanly",
      description: "Description",
      slogan: "Learn. Grow. Connect.",
      publisher: "The Growth Lab",
      emails: ["assistant@jumanly.io", "infojumanly@gmail.com"],
    });
    const [organization, website] = data["@graph"];
    expect(organization["@type"]).toBe("Organization");
    expect(organization.url).toBe("https://jumanly.io");
    expect(JSON.stringify(organization)).not.toMatch(/telephone/i);
    expect(website["@type"]).toBe("WebSite");
  });
});
