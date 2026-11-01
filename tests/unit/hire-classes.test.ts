import { describe, expect, it } from "vitest";
import {
  CRITERION_MET_EVENT,
  CRITERION_UNMET_EVENT,
  classCounts,
  classOf,
  documentsOf,
  HOLD_EVENT,
  HOLD_LIFTED_EVENT,
  isOnHold,
  missedCriteriaOf,
  rankByClass,
} from "@/server/services/hire-classes";

describe("classes Orbi du pipeline", () => {
  it("range selon les seuils 75 % et 50 %", () => {
    expect(classOf({ score: 86 })).toBe("fort");
    expect(classOf({ score: 75 })).toBe("fort");
    expect(classOf({ score: 74 })).toBe("considerer");
    expect(classOf({ score: 50 })).toBe("considerer");
    expect(classOf({ score: 49 })).toBe("limite");
  });

  it("l'étoile Potentiel suffit pour Fort potentiel", () => {
    expect(classOf({ score: 40, strongPotential: true })).toBe("fort");
  });

  it("un critère éliminatoire manquant l'emporte, sans cacher personne", () => {
    expect(classOf({ score: 95, missedCriteria: ["Permis B"] })).toBe("hors");
    const rows = [{ orbiClass: "hors" as const }, { orbiClass: "fort" as const }];
    expect(classCounts(rows).map((item) => item.count)).toEqual([1, 0, 0, 1]);
  });

  it("la dernière marque d'un critère gagne", () => {
    const events = [
      { type: CRITERION_UNMET_EVENT, payload: { label: "Permis B" } },
      { type: CRITERION_UNMET_EVENT, payload: { label: "Anglais" } },
      { type: CRITERION_MET_EVENT, payload: { label: "Permis B" } },
      { type: CRITERION_UNMET_EVENT, payload: { label: "Inconnu" } },
    ];
    expect(missedCriteriaOf(events, ["Permis B", "Anglais"])).toEqual(["Anglais"]);
  });

  it("compte les documents demandés reçus", () => {
    expect(
      documentsOf({
        asked: ["cv", "letter", "diploma"],
        hasCv: true,
        hasLetter: false,
        attachments: [{ type: "certificate" }],
      }),
    ).toEqual({ received: 2, asked: 3 });
    expect(documentsOf({ asked: [], hasCv: true, hasLetter: true, attachments: [] })).toEqual({
      received: 2,
      asked: 2,
    });
  });
});

describe("tri du pipeline", () => {
  it("la dernière mise en attente gagne", () => {
    expect(isOnHold([{ type: HOLD_EVENT }])).toBe(true);
    expect(isOnHold([{ type: HOLD_EVENT }, { type: HOLD_LIFTED_EVENT }])).toBe(false);
    expect(isOnHold([{ type: "viewed" }])).toBe(false);
  });

  it("ordonne par classe en gardant l'ordre du score", () => {
    const rows = [
      { id: "a", orbiClass: "limite" as const },
      { id: "b", orbiClass: null },
      { id: "c", orbiClass: "fort" as const },
      { id: "d", orbiClass: "hors" as const },
      { id: "e", orbiClass: "fort" as const },
    ];
    expect(rankByClass(rows).map((row) => row.id)).toEqual(["c", "e", "a", "d", "b"]);
  });
});
