import { describe, expect, it } from "vitest";
import { countryCode } from "@/server/matching/geo";
import { languageRank } from "@/server/matching/normalize";
import {
  bandFor,
  DEFAULT_WEIGHTS,
  scoreFromCriteria,
  scoreMatch,
  skillCoverage,
  withSkill,
} from "@/server/matching/score";
import type { NormalizedJob, NormalizedProfile } from "@/server/matching/types";

const now = new Date("2026-10-14T10:00:00Z");

function profile(overrides: Partial<NormalizedProfile> = {}): NormalizedProfile {
  return {
    profileId: "p1",
    skills: [
      { skillId: "sql", name: "SQL", aliases: [], level: 3, verified: true, source: "course" },
      {
        skillId: "excel",
        name: "Excel",
        aliases: [],
        level: 2,
        verified: false,
        source: "declared",
      },
    ],
    experiences: [
      { title: "Analyste de données", description: "Tableaux de bord SQL", months: 30 },
    ],
    educationRank: 3,
    certifiedSkillIds: ["sql"],
    languages: [{ code: "fr", rank: 6 }],
    city: "Abidjan",
    country: "CI",
    relocation: false,
    desiredContracts: ["cdi"],
    availability: "open",
    availableFrom: null,
    embedding: null,
    ...overrides,
  };
}

function job(overrides: Partial<NormalizedJob> = {}): NormalizedJob {
  return {
    jobId: "j1",
    title: "Analyste de données junior",
    skills: [
      { skillId: "sql", name: "SQL", aliases: [], importance: "required", weight: 3, minLevel: 3 },
      {
        skillId: "powerbi",
        name: "Power BI",
        aliases: ["PowerBI"],
        importance: "required",
        weight: 3,
        minLevel: 2,
      },
      {
        skillId: "python",
        name: "Python",
        aliases: [],
        importance: "preferred",
        weight: 3,
        minLevel: 2,
      },
    ],
    experienceMin: 2,
    educationRank: 3,
    languages: [{ code: "fr", rank: 5, label: "C1" }],
    city: "Abidjan",
    country: "CI",
    remote: "onsite",
    contractType: "cdi",
    startBy: null,
    knockouts: [],
    embedding: null,
    ...overrides,
  };
}

const score = (p = profile(), j = job()) => scoreMatch(p, j, DEFAULT_WEIGHTS, { now });

describe("Couverture d'une compétence (§ 8.3)", () => {
  const sql = job().skills[0]!;
  it("vérifiée 1, déclarée 0,9, niveau inférieur au prorata, proche 0,6, absente 0", () => {
    expect(skillCoverage(profile(), sql).coverage).toBe(1);
    const declared = profile({ skills: [{ ...profile().skills[0]!, verified: false }] });
    expect(skillCoverage(declared, sql).coverage).toBe(0.9);
    const lower = profile({ skills: [{ ...profile().skills[0]!, level: 2 }] });
    expect(skillCoverage(lower, sql).coverage).toBe(0.6);
    const close = profile({
      skills: [
        {
          skillId: "x",
          name: "PowerBI",
          aliases: [],
          level: 2,
          verified: false,
          source: "declared",
        },
      ],
    });
    expect(skillCoverage(close, job().skills[1]!).coverage).toBe(0.6);
    expect(skillCoverage(profile({ skills: [] }), sql).coverage).toBe(0);
  });
});

describe("Score de compatibilité", () => {
  it("est borné entre 0 et 100, avec la bonne bande", () => {
    const result = score();
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.band).toBe(bandFor(result.score));
    const perfect = score(
      profile({
        skills: ["sql", "powerbi", "python"].map((id) => ({
          skillId: id,
          name: id,
          aliases: [],
          level: 4,
          verified: true,
          source: "course",
        })),
      }),
    );
    expect(perfect.score).toBe(100);
    expect(perfect.band).toBe("veryHigh");
  });

  it("le score affiché est identique au score recalculé depuis l'explication", () => {
    for (const result of [
      score(),
      score(profile({ languages: [] })),
      score(profile(), job({ remote: "remote" })),
    ]) {
      expect(scoreFromCriteria(result.criteria)).toBe(result.score);
    }
  });

  it("monotonie : ajouter une compétence requise ne fait jamais baisser le score", () => {
    const before = score().score;
    const after = score(
      withSkill(profile(), { skillId: "powerbi", name: "Power BI", level: 3 }),
    ).score;
    expect(after).toBeGreaterThanOrEqual(before);
    expect(after).toBeGreaterThan(before);
  });

  it("un critère non applicable est retiré du numérateur et du dénominateur", () => {
    const result = score(profile(), job({ languages: [] }));
    const languages = result.criteria.find((item) => item.key === "languages")!;
    expect(languages.status).toBe("not_applicable");
    const applicable = result.criteria.filter((item) => item.status !== "not_applicable");
    const expected = Math.round(
      (100 * applicable.reduce((sum, item) => sum + item.weight * item.value, 0)) /
        applicable.reduce((sum, item) => sum + item.weight, 0),
    );
    expect(result.score).toBe(expected);
  });

  it("une information absente vaut 0,5 et n'est pas un échec", () => {
    const result = score(profile({ languages: [] }));
    expect(result.criteria.find((item) => item.key === "languages")).toMatchObject({
      value: 0.5,
      status: "unknown",
      tip: { type: "complete_profile", section: "languages" },
    });
  });

  it("lieu : télétravail 1, même ville 1, même pays et mobile 0,7, sinon 0,3", () => {
    const location = (p: NormalizedProfile, j: NormalizedJob) =>
      score(p, j).criteria.find((item) => item.key === "location")!.value;
    expect(location(profile({ city: "Dakar", country: "SN" }), job({ remote: "remote" }))).toBe(1);
    expect(location(profile(), job())).toBe(1);
    expect(location(profile({ city: "Bouaké", relocation: true }), job())).toBe(0.7);
    expect(location(profile({ city: "Dakar", country: "SN" }), job())).toBe(0.3);
  });

  it("formation : un niveau en dessous 0,6, plus 0,2 pour une attestation liée", () => {
    const education = (p: NormalizedProfile) =>
      score(p).criteria.find((item) => item.key === "education")!.value;
    expect(education(profile({ educationRank: 2, certifiedSkillIds: [] }))).toBe(0.6);
    expect(education(profile({ educationRank: 2 }))).toBe(0.8);
    expect(education(profile({ educationRank: 0, certifiedSkillIds: [] }))).toBe(0.3);
  });

  it("liste les compétences manquantes avec les formations qui les comblent", () => {
    const result = scoreMatch(profile(), job(), DEFAULT_WEIGHTS, {
      now,
      coursesBySkill: { powerbi: ["power-bi"] },
    });
    expect(result.missingSkills).toEqual([
      { skillId: "powerbi", skill: "Power BI", importance: "required", courses: ["power-bi"] },
      { skillId: "python", skill: "Python", importance: "preferred", courses: [] },
    ]);
    expect(result.notUsed).toContain("gender");
  });

  it("les critères éliminatoires sont signalés « à vérifier », jamais calculés", () => {
    expect(score(profile(), job({ knockouts: ["Permis B"] })).knockouts).toEqual([
      { label: "Permis B", met: null },
    ]);
  });

  it("la proximité sémantique compte quand les deux vecteurs existent", () => {
    const result = score(profile({ embedding: [1, 0] }), job({ embedding: [1, 0] }));
    expect(result.criteria.find((item) => item.key === "semantic")).toMatchObject({
      value: 1,
      status: "met",
    });
  });
});

describe("Normalisation", () => {
  it("reconnaît les pays écrits en toutes lettres et les niveaux de langue", () => {
    expect(countryCode("RD Congo")).toBe("CD");
    expect(countryCode("Côte d'Ivoire")).toBe("CI");
    expect(countryCode("Sénégal")).toBe("SN");
    expect(countryCode("ci")).toBe("CI");
    expect(languageRank({ level: "native" })).toBe(6);
    expect(languageRank({ level: "basic", cefr: "B2" })).toBe(4);
  });
});
