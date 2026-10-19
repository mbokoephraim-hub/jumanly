import { describe, expect, it } from "vitest";
import { appearanceScript } from "@/lib/appearance";

describe("apparence de l'espace talent", () => {
  it("pose la classe avant le premier affichage, selon le choix et le téléphone, sur toutes les pages", () => {
    for (const [appearance, phoneDark, path, expected] of [
      ["dark", false, "/app/orbi", true],
      ["light", true, "/app/orbi", false],
      ["auto", true, "/app/orbi", true],
      ["auto", false, "/app/orbi", false],
      ["dark", true, "/app/jobs", true],
      ["dark", true, "/app/abonnement", true],
      ["dark", true, "/app/parametres/securite", true],
      ["auto", true, "/app/recherche", true],
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
      expect(classes.has("t-ancien")).toBe(false);
    }
  });
});
