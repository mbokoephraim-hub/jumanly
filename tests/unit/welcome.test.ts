import { describe, expect, it } from "vitest";
import { homeFocus, onboardingGoals } from "@/lib/welcome";

describe("objectif et accueil Pour moi (docs/ux-mobile-talent, prompt 3)", () => {
  it("range les six objectifs du profil dans trois accueils", () => {
    expect(homeFocus("firstJob")).toEqual({ focus: "job", personalised: true });
    expect(homeFocus("newJob")).toEqual({ focus: "job", personalised: true });
    expect(homeFocus("freelance")).toEqual({ focus: "job", personalised: true });
    expect(homeFocus("skills")).toEqual({ focus: "skills", personalised: true });
    expect(homeFocus("reconversion")).toEqual({ focus: "skills", personalised: true });
    expect(homeFocus("promotion")).toEqual({ focus: "career", personalised: true });
  });

  it("sans objectif, montre l'accueil emploi marqué non personnalisé", () => {
    expect(homeFocus(null)).toEqual({ focus: "job", personalised: false });
    expect(homeFocus("inconnu")).toEqual({ focus: "job", personalised: false });
  });

  it("propose aux premiers pas quatre objectifs qui ont chacun leur accueil", () => {
    expect(onboardingGoals.map((goal) => homeFocus(goal).focus)).toEqual([
      "job",
      "job",
      "skills",
      "skills",
    ]);
  });
});
