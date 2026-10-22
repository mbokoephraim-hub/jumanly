import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { preloadAllowed, preloadPath } from "@/lib/phone-preload";

/** Every route handler of the signed-in space, as an address (`[id]` → `x1`). */
function routeHandlers(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return routeHandlers(path);
    if (name !== "route.ts") return [];
    const route = relative(join("src", "app"), dir)
      .split("/")
      .filter((part) => !part.startsWith("("))
      .map((part) => (part.startsWith("[") ? "x1" : part))
      .join("/");
    return [`/${route}`];
  });
}

describe("préchargement au téléphone", () => {
  it("charge les pages de l'espace connecté, avec leurs paramètres", () => {
    expect(preloadPath("/app/career/cv", "/app")).toBe("/app/career/cv");
    expect(preloadPath("/app/jobs/offre-1?source=fil", "/app")).toBe(
      "/app/jobs/offre-1?source=fil",
    );
    expect(preloadPath("/app/learn/cours-1/lecon-1", "/app")).toBe("/app/learn/cours-1/lecon-1");
    expect(preloadPath("/app/learn/attestations/a1", "/app")).toBe("/app/learn/attestations/a1");
  });

  it("ne charge ni la page affichée, ni une adresse hors de l'espace connecté", () => {
    expect(preloadPath("/app/fil", "/app/fil")).toBeNull();
    expect(preloadPath("/tarifs", "/app")).toBeNull();
    expect(preloadPath("https://exemple.org/app/fil", "/app")).toBeNull();
    expect(preloadPath("/api/photo/abc", "/app")).toBeNull();
    expect(preloadPath("#haut", "/app")).toBeNull();
  });

  it("n'ouvre jamais une conversation ni un espace d'équipe (leur ouverture laisse une trace)", () => {
    expect(preloadPath("/app/messages/c1", "/app")).toBeNull();
    expect(preloadPath("/app/hire/candidats/a1", "/app")).toBeNull();
    expect(preloadPath("/app/hire/talents/p1", "/app/hire/talents")).toBeNull();
    expect(preloadPath("/app/hire/offres/j1/ats/a1", "/app/hire/offres")).toBeNull();
    expect(preloadPath("/app/partenaire", "/app")).toBeNull();
  });

  it("charge à l'avance les listes du recruteur, jamais un dossier (Modèle B recruteur)", () => {
    expect(preloadPath("/app/hire/offres", "/app/hire")).toBe("/app/hire/offres");
    expect(preloadPath("/app/hire/offres/j1", "/app/hire/offres")).toBe("/app/hire/offres/j1");
    expect(preloadPath("/app/hire/candidats", "/app/hire")).toBe("/app/hire/candidats");
  });

  it("redemande toujours les pages qui changent pendant qu'on les regarde", () => {
    expect(preloadPath("/app/notifications", "/app")).toBeNull();
    expect(preloadPath("/app/messages", "/app")).toBeNull();
    expect(preloadPath("/app/messages/demandes", "/app")).toBeNull();
    expect(preloadPath("/app/suivi", "/app")).toBeNull();
    expect(preloadPath("/app/jobs/offre-1?postuler=1", "/app")).toBeNull();
    expect(preloadPath("/app/jobs/offre-1/postuler", "/app")).toBeNull();
  });

  it("ne télécharge aucun fichier de l'espace connecté", () => {
    const files = routeHandlers(join("src", "app", "app"));
    expect(files.length).toBeGreaterThan(5);
    for (const file of files) expect(preloadPath(file, "/app"), file).toBeNull();
  });

  it("ne charge rien avec l'économiseur de données ou en 2G", () => {
    expect(preloadAllowed(undefined)).toBe(true);
    expect(preloadAllowed({ effectiveType: "4g" })).toBe(true);
    expect(preloadAllowed({ saveData: true, effectiveType: "4g" })).toBe(false);
    expect(preloadAllowed({ effectiveType: "2g" })).toBe(false);
  });
});
