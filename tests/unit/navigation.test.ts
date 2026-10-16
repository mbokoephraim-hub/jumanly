import { describe, expect, it } from "vitest";
import { hidesTalentTabBar, talentNavigation } from "@/config/navigation";

describe("navigation Talent (docs/ux-mobile-talent, prompt 2)", () => {
  it("garde quatre destinations dans la barre du bas, Career en plus sur ordinateur", () => {
    const tabs = talentNavigation.filter((item) => item.pill !== false).map((item) => item.href);
    expect(tabs).toEqual(["/app", "/app/jobs", "/app/learn", "/app/suivi"]);
    expect(talentNavigation.map((item) => item.href)).toContain("/app/career");
  });

  it("masque la barre du bas sur les écrans qui ont leur barre d'action fixe", () => {
    for (const path of [
      "/app/jobs/analyste-de-donnees",
      "/app/learn/excel-analyse",
      "/app/messages/abc",
      "/app/career/cv/abc",
      "/app/espace",
      "/app/bienvenue",
    ])
      expect(hidesTalentTabBar(path), path).toBe(true);
  });

  it("la garde sur les listes et les pages de destination", () => {
    for (const path of [
      "/app",
      "/app/jobs",
      "/app/jobs/candidatures",
      "/app/jobs/enregistrees",
      "/app/learn",
      "/app/learn/explorer",
      "/app/learn/parcours/data",
      "/app/messages",
      "/app/career/cv",
      "/app/career/cv/modeles",
      "/app/suivi",
      "/app/tableau-de-bord",
    ])
      expect(hidesTalentTabBar(path), path).toBe(false);
  });
});
