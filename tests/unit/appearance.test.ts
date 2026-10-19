import { describe, expect, it } from "vitest";
import { appearanceScript, redrawn } from "@/lib/appearance";

describe("apparence de l'espace talent (brief § 2.10)", () => {
  it("ne passe en sombre que les pages déjà refaites", () => {
    expect(redrawn("/app/orbi")).toBe(true);
    expect(redrawn("/app/orbi/historique")).toBe(true);
    expect(redrawn("/app/orbite")).toBe(false);
    expect(redrawn("/app/jobs")).toBe(true);
    expect(redrawn("/app")).toBe(true);
    expect(redrawn("/app/jobs/analyste-fictif")).toBe(true);
    expect(redrawn("/app/jobs/candidatures")).toBe(false);
    expect(redrawn("/app/jobs/candidatures/abc")).toBe(false);
    expect(redrawn("/app/learn")).toBe(true);
    expect(redrawn("/app/learn/excel/lecon-1")).toBe(true);
    expect(redrawn("/app/abonnement")).toBe(false);
    // Lot 4.
    expect(redrawn("/app/jobs/analyste-fictif/postuler")).toBe(true);
    expect(redrawn("/app/suivi")).toBe(true);
    expect(redrawn("/app/suivi/abc")).toBe(true);
    expect(redrawn("/app/messages/abc")).toBe(true);
    expect(redrawn("/app/notifications")).toBe(true);
    expect(redrawn("/app/career/entretiens/nouveau")).toBe(true);
    // Lot 6b.
    expect(redrawn("/app/career/entretiens")).toBe(true);
    expect(redrawn("/app/career/entretiens/abc")).toBe(true);
    expect(redrawn("/app/career/diagnostic")).toBe(true);
    expect(redrawn("/app/career/plan")).toBe(true);
    expect(redrawn("/app/profil/point")).toBe(true);
    expect(redrawn("/app/profil")).toBe(true);
    expect(redrawn("/app/compte")).toBe(true);
    // Lot 6c.
    expect(redrawn("/app/career/cv")).toBe(true);
    expect(redrawn("/app/career/cv/modeles")).toBe(true);
    expect(redrawn("/app/career/cv/abc")).toBe(true);
    expect(redrawn("/app/career/linkedin")).toBe(true);
    expect(redrawn("/app/career/documents/abc")).toBe(true);
    expect(redrawn("/app/profil/import")).toBe(true);
    expect(redrawn("/app/career")).toBe(false);
  });

  it("pose la classe avant le premier affichage, selon le choix et le téléphone", () => {
    for (const [appearance, phoneDark, path, expected] of [
      ["dark", false, "/app/orbi", true],
      ["light", true, "/app/orbi", false],
      ["auto", true, "/app/orbi", true],
      ["auto", false, "/app/orbi", false],
      ["dark", true, "/app/jobs", true],
      ["dark", true, "/app/jobs/analyste-fictif", true],
      ["dark", true, "/app/jobs/candidatures", false],
      ["dark", true, "/app/abonnement", false],
      ["dark", true, "/app/career/cv", true],
      ["dark", true, "/app/profil/import", true],
    ] as const) {
      const classes = new Set<string>();
      const run = new Function("location", "window", "document", appearanceScript(appearance));
      run(
        { pathname: path },
        { matchMedia: () => ({ matches: phoneDark }) },
        {
          documentElement: {
            classList: {
              toggle: (name: string, on: boolean) =>
                on ? classes.add(name) : classes.delete(name),
            },
          },
        },
      );
      expect(classes.has("sombre"), `${appearance} ${phoneDark} ${path}`).toBe(expected);
    }
  });
});
