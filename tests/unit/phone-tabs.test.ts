import { describe, expect, it } from "vitest";
import { keepsBar, rootOf, rootTab, tabOf, tabsOf } from "@/lib/phone-tabs";

describe("onglets du téléphone", () => {
  it("garde les cinq onglets du talent", () => {
    expect(tabsOf()).toEqual(["fil", "explorer", "carriere", "formation", "messages"]);
    expect(rootTab("/app")).toBe("fil");
    expect(tabOf("/app/jobs/offre-1")).toBe("explorer");
  });

  it("donne au recruteur Fil · Offres · Candidatures · Talents · Messages (Modèle B recruteur)", () => {
    expect(tabsOf("recruteur")).toEqual(["fil", "offres", "candidatures", "talents", "messages"]);
    expect(rootOf("fil", "recruteur")).toBe("/app/hire");
    expect(rootTab("/app/hire", "recruteur")).toBe("fil");
    expect(rootTab("/app/hire/offres/", "recruteur")).toBe("offres");
    expect(rootTab("/app/hire/offres/j1", "recruteur")).toBeNull();
    expect(tabOf("/app/hire/offres/j1", "recruteur")).toBe("offres");
    expect(tabOf("/app/hire/candidats/a1", "recruteur")).toBe("candidatures");
    expect(tabOf("/app/hire/entretiens", "recruteur")).toBe("candidatures");
    expect(tabOf("/app/hire/viviers/v1", "recruteur")).toBe("talents");
    expect(tabOf("/app/messages/c1", "recruteur")).toBe("messages");
    expect(tabOf("/app/hire/compte", "recruteur")).toBe("fil");
    expect(keepsBar("/app/entreprises/baobab", "recruteur")).toBe(true);
  });
});
