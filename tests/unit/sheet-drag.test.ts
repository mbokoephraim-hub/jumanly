import { describe, expect, it } from "vitest";
import { settleHeight, sheetStops } from "@/lib/sheet-drag";

describe("feuilles du bas glissables", () => {
  it("une feuille courte garde sa hauteur, une longue s'ouvre à mi-hauteur", () => {
    expect(sheetStops(300, 800)).toEqual([300]);
    expect(sheetStops(700, 800)).toEqual([416, 700]);
  });

  it("se pose sur l'état le plus proche quand le doigt part lentement", () => {
    const stops = [416, 700];
    expect(settleHeight(650, 0, stops)).toBe(700);
    expect(settleHeight(450, 0, stops)).toBe(416);
  });

  it("un geste rapide passe à l'état suivant dans sa direction", () => {
    const stops = [416, 700];
    expect(settleHeight(690, 1, stops)).toBe(416);
    expect(settleHeight(416, 1, stops)).toBe(0);
    expect(settleHeight(430, -1, stops)).toBe(700);
  });

  it("se ferme seulement si elle est assez descendue", () => {
    expect(settleHeight(380, 0, [416])).toBe(416);
    expect(settleHeight(250, 0, [416])).toBe(0);
  });
});
