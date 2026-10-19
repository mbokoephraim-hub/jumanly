import { describe, expect, it } from "vitest";
import { hidesTalentTabBar, talentTabOf, talentTabs } from "@/config/navigation";

describe("navigation Talent (docs/refonte-mobile, brief § 2.1)", () => {
  it("garde cinq destinations dans la barre du bas, Orbi au milieu", () => {
    expect(talentTabs.map((tab) => tab.href)).toEqual([
      "/app",
      "/app/jobs",
      "/app/orbi",
      "/app/learn",
      "/app/suivi",
    ]);
    expect(talentTabs[2].key).toBe("orbi");
  });

  it("rattache chaque page à son onglet", () => {
    expect(talentTabOf("/app")?.key).toBe("forMe");
    expect(talentTabOf("/app/jobs/analyste")?.key).toBe("offers");
    expect(talentTabOf("/app/learn/excel")?.key).toBe("learn");
    expect(talentTabOf("/app/orbi")?.key).toBe("orbi");
    expect(talentTabOf("/app/compte")).toBeNull();
    expect(talentTabOf("/app/jobsx")).toBeNull();
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
      "/app/orbi",
      "/app/career/cv",
      "/app/career/cv/modeles",
      "/app/suivi",
      "/app/compte",
      "/app/tableau-de-bord",
    ])
      expect(hidesTalentTabBar(path), path).toBe(false);
  });
});
