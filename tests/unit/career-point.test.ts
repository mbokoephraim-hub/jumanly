import { describe, expect, it } from "vitest";
import { hasResult, pointLines, type PointFacts } from "@/server/services/career-point";

const base: PointFacts = {
  certificates: [],
  experiences: 0,
  experiencesWithResult: 0,
  provenSkills: 0,
  ownedSkills: [],
  dimensions: null,
  demand: { counts: [], offers: 0 },
};

describe("Faire le point (planche talent-4 § 5)", () => {
  it("donne les mêmes conseils pour les mêmes informations", () => {
    const facts: PointFacts = {
      ...base,
      certificates: ["Power BI"],
      experiences: 2,
      experiencesWithResult: 1,
      provenSkills: 3,
      ownedSkills: ["Power BI", "excel"],
      dimensions: [
        { key: "skills", score: 74 },
        { key: "search", score: 40 },
        { key: "tools", score: 80 },
      ],
      demand: {
        counts: [
          ["Excel", 9],
          ["SQL", 7],
          ["Python", 5],
          ["Tableau", 1],
        ],
        offers: 10,
      },
    };
    const lines = pointLines(facts);
    expect(lines).toEqual(pointLines(facts));
    expect(lines.strengths).toEqual([
      { code: "certificate", name: "Power BI" },
      { code: "result" },
      { code: "proven", count: 3 },
    ]);
    // Excel is owned (case and accents ignored); Tableau is asked for by 1 offer in 10 only.
    expect(lines.weaknesses).toEqual([
      { code: "skill", skill: "SQL", count: 7, total: 10 },
      { code: "skill", skill: "Python", count: 5, total: 10 },
      { code: "dimension", key: "search", score: 40 },
    ]);
  });

  it("signale l'absence d'expérience ou de résultat, et garde trois lignes au plus", () => {
    expect(pointLines(base)).toEqual({ strengths: [], weaknesses: [{ code: "noExperience" }] });
    expect(pointLines({ ...base, experiences: 1 }).weaknesses).toEqual([{ code: "noResult" }]);
  });

  it("reconnaît un résultat chiffré", () => {
    expect(hasResult("Tableau de bord pour 12 agences")).toBe(true);
    expect(hasResult("Tableau de bord pour les agences")).toBe(false);
  });
});
