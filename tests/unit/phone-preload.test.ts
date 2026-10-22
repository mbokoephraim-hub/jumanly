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
    expect(preloadPath("/app/jobs/offre-1?postuler=1", "/app")).toBe(
      "/app/jobs/offre-1?postuler=1",
    );
    expect(preloadPath("/app/messages", "/app")).toBe("/app/messages");
    expect(preloadPath("/app/messages/demandes", "/app")).toBe("/app/messages/demandes");
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
    expect(preloadPath("/app/partenaire", "/app")).toBeNull();
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
