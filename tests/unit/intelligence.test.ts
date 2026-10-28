// @vitest-environment node
import { describe, expect, it } from "vitest";
import { costMicroUsd, hasPrice } from "@/server/ai/prices";
import { emptyCv, type CvContent } from "@/server/services/cv";
import { acceptable, cvChecks, cvScore, templateSuggestions } from "@/server/services/cv-coach";
import { stepState, type PlanStep } from "@/server/services/progress-plan";

const cv: CvContent = {
  ...emptyCv,
  info: { ...emptyCv.info, name: "Talent Fictif", headline: "Analyste de données" },
  summary: "Analyste.",
  experiences: [
    {
      title: "Analyste",
      company: "Entreprise fictive",
      location: "",
      start: "2022-01",
      end: null,
      bullets: ["Suivi de 12 tableaux de bord", "Préparation des rapports"],
    },
  ],
  skills: [
    { name: "SQL", level: 3 },
    { name: "Excel", level: 4 },
  ],
};

const bullet = { section: "bullet" as const, experience: 0, bullet: 0 };

describe("CV score (rules)", () => {
  it("stays between 0 and 100 on each axis", () => {
    for (const content of [emptyCv, cv]) {
      const score = cvScore(content, ["SQL", "Power BI"]);
      for (const value of [score.total, score.ats, score.impact, score.keywords]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it("counts the target skills present in the CV", () => {
    expect(cvScore(cv, ["SQL"]).keywords).toBe(100);
    expect(cvScore(cv, ["Power BI"]).keywords).toBe(0);
  });
});

describe("CV checks of the preview (fixed rules)", () => {
  const checks = (content: CvContent, targets: string[], ats: "excellent" | "good" = "excellent") =>
    Object.fromEntries(cvChecks(content, targets, { ats }).map((check) => [check.key, check]));

  it("says what is there and what is missing, without guessing", () => {
    const result = checks(cv, ["SQL", "Excel", "Power BI"]);
    expect(result.headline!.ok).toBe(true);
    expect(result.summary!.ok).toBe(false);
    expect(result.figure!.ok).toBe(true);
    expect(result.dates!.ok).toBe(true);
    expect(result.skills!.ok).toBe(false);
    expect(result.languages!.ok).toBe(false);
    expect(result.readable!.ok).toBe(true);
    // Two of three target skills on the CV: enough, and the missing one is named.
    expect(result.keywords).toEqual({ key: "keywords", ok: true, missing: ["Power BI"] });
  });

  it("flags a template harder to read for recruiting software, and too few keywords", () => {
    const result = checks(cv, ["Python", "Power BI", "SQL"], "good");
    expect(result.readable!.ok).toBe(false);
    expect(result.keywords!.ok).toBe(false);
    expect(result.keywords!.missing).toEqual(["Python", "Power BI"]);
  });
});

describe("Coach suggestions: nothing invented", () => {
  const base = { kind: "quantify" as const, target: bullet, skill: null };

  it("accepts a rewording of the current text that keeps its figures", () => {
    expect(
      acceptable(cv, {
        ...base,
        before: "Suivi de 12 tableaux de bord",
        after: "Pilotage de 12 tableaux de bord",
      }),
    ).toBe(true);
  });

  it("refuses a new figure", () => {
    expect(
      acceptable(cv, {
        ...base,
        before: "Suivi de 12 tableaux de bord",
        after: "Suivi de 12 tableaux de bord pour 300 utilisateurs",
      }),
    ).toBe(false);
  });

  it("refuses a suggestion on a text that changed since", () => {
    expect(acceptable(cv, { ...base, before: "Autre texte", after: "Texte" })).toBe(false);
  });

  it("refuses a skill that is not in the CV", () => {
    expect(
      acceptable(cv, {
        kind: "headlineSkill",
        target: { section: "headline", experience: null, bullet: null },
        before: "Analyste de données",
        after: "Analyste de données · Power BI",
        skill: "Power BI",
      }),
    ).toBe(false);
  });

  it("template suggestions pass the same guard", () => {
    const suggestions = templateSuggestions(cv, ["SQL", "Power BI"]);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.find((item) => item.kind === "headlineSkill")?.skill).toBe("SQL");
    for (const suggestion of suggestions) expect(acceptable(cv, suggestion)).toBe(true);
  });
});

describe("AI cost estimate", () => {
  it("is zero for an unknown model, which the admin flags", () => {
    expect(costMicroUsd("unknown-model", 1000, 1000)).toBe(0);
    expect(hasPrice("unknown-model")).toBe(false);
    expect(hasPrice("fake")).toBe(true);
  });
});

describe("Progress plan", () => {
  const step: PlanStep = {
    id: "1",
    kind: "custom",
    code: null,
    title: "Étape",
    href: null,
    due: "2026-01-31",
    done: false,
  };
  it("marks a past due date as late, unless done", () => {
    const now = new Date("2026-02-01T10:00:00Z");
    expect(stepState(step, now)).toBe("late");
    expect(stepState({ ...step, done: true }, now)).toBe("done");
    expect(stepState({ ...step, due: null }, now)).toBe("todo");
  });
});
