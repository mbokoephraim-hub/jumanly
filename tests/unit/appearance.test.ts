import { describe, expect, it } from "vitest";
import { appearanceScript, redrawn } from "@/lib/appearance";

describe("apparence de l'espace talent (brief § 2.10)", () => {
  it("ne passe en sombre que les pages déjà refaites", () => {
    expect(redrawn("/app/orbi")).toBe(true);
    expect(redrawn("/app/orbi/historique")).toBe(true);
    expect(redrawn("/app/orbite")).toBe(false);
    expect(redrawn("/app/jobs")).toBe(false);
  });

  it("pose la classe avant le premier affichage, selon le choix et le téléphone", () => {
    for (const [appearance, phoneDark, path, expected] of [
      ["dark", false, "/app/orbi", true],
      ["light", true, "/app/orbi", false],
      ["auto", true, "/app/orbi", true],
      ["auto", false, "/app/orbi", false],
      ["dark", true, "/app/jobs", false],
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
