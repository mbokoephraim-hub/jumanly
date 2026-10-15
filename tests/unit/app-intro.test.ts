import { describe, expect, it } from "vitest";
import { introProfile, introVersion, withArrival, wordSize } from "@/lib/app-intro";

describe("introVersion", () => {
  const seen = new Date("2026-10-01T10:00:00Z");

  it("never plays without the arrival marker", () => {
    expect(introVersion({ arrival: false, seenAt: null, reduced: false })).toBeNull();
    expect(introVersion({ arrival: false, replay: true, seenAt: null, reduced: false })).toBeNull();
  });

  it("plays the full version once per account, then the short one", () => {
    expect(introVersion({ arrival: true, seenAt: null, reduced: false })).toBe("full");
    expect(introVersion({ arrival: true, seenAt: seen, reduced: false })).toBe("short");
  });

  it("replays the full version when asked from the settings", () => {
    expect(introVersion({ arrival: true, replay: true, seenAt: seen, reduced: false })).toBe(
      "full",
    );
  });

  it("shows the welcome toast instead in reduced motion", () => {
    expect(introVersion({ arrival: true, seenAt: null, reduced: true })).toBe("toast");
    expect(introVersion({ arrival: true, replay: true, seenAt: seen, reduced: true })).toBe(
      "toast",
    );
  });
});

describe("withArrival", () => {
  it("marks destinations in the signed-in space", () => {
    expect(withArrival("/app")).toBe("/app?arrivee=1");
    expect(withArrival("/app/bienvenue")).toBe("/app/bienvenue?arrivee=1");
    expect(withArrival("/app/jobs?offre=abc")).toBe("/app/jobs?offre=abc&arrivee=1");
    expect(withArrival("/app/parametres#securite")).toBe("/app/parametres?arrivee=1#securite");
  });

  it("leaves other destinations alone", () => {
    expect(withArrival("/admin")).toBe("/admin");
    expect(withArrival("/offres/abc")).toBe("/offres/abc");
    expect(withArrival("/application")).toBe("/application");
  });
});

describe("introProfile", () => {
  it("follows the active space", () => {
    expect(introProfile(null)).toBe("talent");
    expect(introProfile({ type: "recruiter" })).toBe("rh");
    expect(introProfile({ type: "company" })).toBe("company");
    expect(introProfile({ partner: true })).toBe("company");
  });
});

describe("wordSize", () => {
  it("keeps long words inside the band", () => {
    expect(wordSize("CV")).toBe(5.6);
    expect(wordSize("recrutements")).toBeCloseTo(40 / 12);
  });
});
