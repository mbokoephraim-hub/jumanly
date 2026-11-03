import { describe, expect, it } from "vitest";
import { offerPoints, offerVerdict, type OfferFigures } from "@/server/services/hire-offer-review";

const base: OfferFigures = {
  views: 33,
  applications: 2,
  unseen: 0,
  shortlisted: 0,
  hired: 0,
  openings: 1,
  online: 4,
  left: 20,
  responseDays: null,
  invited: 0,
};

describe("offerVerdict (Vue d'une offre, 03/11/2026)", () => {
  it("puts the most urgent first", () => {
    expect(offerVerdict({ ...base, hired: 1 }).verdict).toBe("filled");
    expect(offerVerdict({ ...base, left: 3 }).verdict).toBe("late");
    expect(offerVerdict({ ...base, views: 8 }).verdict).toBe("unseen");
    expect(offerVerdict({ ...base, views: 100, applications: 2 }).verdict).toBe("unconvincing");
    expect(offerVerdict({ ...base, unseen: 1 }).verdict).toBe("toSort");
    expect(offerVerdict(base)).toEqual({ verdict: "onTrack", tone: "good" });
  });
});

describe("offerPoints", () => {
  it("sorts what works, what to improve and what to do", () => {
    const points = offerPoints({ ...base, unseen: 1 });
    expect(points.works.map((item) => item.key)).toEqual(["rate", "seen"]);
    expect(points.improve.map((item) => item.key)).toEqual(["noInvite"]);
    expect(points.todo).toEqual([
      { key: "open", count: 1 },
      { key: "retain", wanted: 2 },
    ]);
  });
});
