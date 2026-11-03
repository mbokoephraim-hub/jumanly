import { describe, expect, it } from "vitest";
import { rubriqueOf } from "@/server/services/hire-desk";

const at = new Date("2026-11-03T10:00:00Z");

describe("rubriqueOf", () => {
  it("puts a new application in « À trier »", () => {
    expect(rubriqueOf({ status: "active", shortlistedAt: null, verification: null })).toBe("trier");
  });
  it("puts a retained candidate with a missing piece in « À compléter »", () => {
    const verification = {
      items: [
        { required: true, receivedAt: null },
        { required: true, receivedAt: at },
      ],
    };
    expect(rubriqueOf({ status: "active", shortlistedAt: at, verification })).toBe("completer");
  });
  it("moves the candidate to « Entretiens » once the file is complete", () => {
    const verification = {
      items: [
        { required: true, receivedAt: at },
        { required: false, receivedAt: null },
      ],
    };
    expect(rubriqueOf({ status: "active", shortlistedAt: at, verification })).toBe("entretiens");
    expect(rubriqueOf({ status: "active", shortlistedAt: at, verification: null })).toBe(
      "entretiens",
    );
  });
  it("keeps hired, rejected and withdrawn in « Décision »", () => {
    for (const status of ["hired", "rejected", "withdrawn"] as const)
      expect(rubriqueOf({ status, shortlistedAt: at, verification: null })).toBe("decision");
  });
});
