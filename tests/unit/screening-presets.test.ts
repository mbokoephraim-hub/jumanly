import { describe, expect, it } from "vitest";
import {
  composeScreeningAnswer,
  screeningPresetOf,
  splitScreeningAnswer,
} from "@/server/services/screening";

const q = (text: string) => ({ text, kind: "text" as const });

describe("réponses toutes prêtes (Postuler, 31/10/2026)", () => {
  it("reconnaît les questions habituelles", () => {
    expect(screeningPresetOf(q("Avez-vous déjà occupé un poste semblable ?"))).toBe("experience");
    expect(screeningPresetOf(q("Quand pouvez-vous commencer ?"))).toBe("start");
    expect(screeningPresetOf(q("Êtes-vous à Kinshasa ou prêt·e à y venir ?"))).toBe("place");
    expect(screeningPresetOf(q("Êtes-vous prêt·e à venir sur le lieu du poste ?"))).toBe("place");
    expect(screeningPresetOf(q("Quel salaire attendez-vous ?"))).toBe("salary");
    expect(screeningPresetOf(q("Parlez-nous de votre projet préféré."))).toBeNull();
    expect(screeningPresetOf({ text: "Quand pouvez-vous commencer ?", kind: "yesno" })).toBeNull();
  });
  it("compose et relit une réponse avec précision", () => {
    const saved = composeScreeningAnswer("Oui, déjà", " Ministère ");
    expect(saved).toBe("Oui, déjà · Ministère");
    expect(splitScreeningAnswer(saved, ["Oui, déjà", "Non, pas encore"])).toEqual({
      option: "Oui, déjà",
      detail: "Ministère",
    });
    expect(splitScreeningAnswer("Texte libre", ["Oui, déjà"]).option).toBeNull();
  });
});
