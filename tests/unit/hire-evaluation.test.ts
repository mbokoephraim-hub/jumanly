import { describe, expect, it } from "vitest";
import { suggestionOf } from "@/server/services/hire-evaluation";

describe("suggestionOf (Évaluation, 03/11/2026)", () => {
  it("suggests, from the class and what is left to verify", () => {
    expect(suggestionOf({ orbiClass: "hors", toVerify: 0 })).toEqual({
      suggestion: "reject",
      why: "knockout",
    });
    expect(suggestionOf({ orbiClass: "fort", toVerify: 0 })?.suggestion).toBe("retain");
    expect(suggestionOf({ orbiClass: "fort", toVerify: 2 })).toEqual({
      suggestion: "hold",
      why: "verify",
    });
    expect(suggestionOf({ orbiClass: "considerer", toVerify: 0 })?.suggestion).toBe("hold");
    expect(suggestionOf({ orbiClass: "limite", toVerify: 0 })?.suggestion).toBe("reject");
  });
  it("says nothing without a score", () => {
    expect(suggestionOf({ orbiClass: null, toVerify: 1 })).toBeNull();
  });
});
