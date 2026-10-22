import { describe, expect, it } from "vitest";
import { talentTabOf, talentTabs } from "@/config/navigation";

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
});
