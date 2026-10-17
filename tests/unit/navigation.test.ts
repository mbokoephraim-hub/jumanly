import { describe, expect, it } from "vitest";
import {
  hidesTalentTabBar,
  talentMenu,
  talentNavigation,
  talentTabPaths,
} from "@/config/navigation";

describe("navigation Talent (docs/ux-mobile-talent, prompts 2 et 2 bis)", () => {
  it("garde cinq destinations dans la barre du bas, Pour moi au milieu, Career en plus sur ordinateur", () => {
    const tabs = talentNavigation.filter((item) => item.pill !== false).map((item) => item.href);
    expect(tabs).toEqual(["/app/jobs", "/app/learn", "/app", "/app/suivi", "/app/compte"]);
    expect(tabs[2]).toBe("/app");
    expect([...talentTabPaths].sort()).toEqual([...tabs].sort());
    expect(talentNavigation.map((item) => item.href)).toContain("/app/career");
  });

  it("met Mes CV, le tableau de bord et les acquis dans le menu du haut", () => {
    const links = talentMenu.map((item) => item.href);
    expect(links).toContain("/app/career/cv");
    expect(links).toContain("/app/tableau-de-bord");
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
      "/app/compte",
      "/app/tableau-de-bord",
    ])
      expect(hidesTalentTabBar(path), path).toBe(false);
  });
});
