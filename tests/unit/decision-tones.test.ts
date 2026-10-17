import { describe, expect, it } from "vitest";
import type { MatchExplanation, SkillEvidence } from "@/server/matching/types";
import {
  highlightSegments,
  nextTone,
  strongestSkill,
  tidyText,
} from "@/server/services/message-templates";

const evidence = (skill: string, rest: Partial<SkillEvidence> = {}): SkillEvidence => ({
  skillId: skill,
  skill,
  required: 3,
  talent: 3,
  verified: false,
  source: "profile",
  coverage: 1,
  ...rest,
});

const explanation = (items: SkillEvidence[]) =>
  ({
    score: 80,
    band: "strong",
    weightsVersion: "test",
    computedAt: "2026-10-17T00:00:00.000Z",
    criteria: [{ key: "skills", weight: 40, value: 0.8, status: "met", evidence: items }],
    missingSkills: [],
    knockouts: [],
    notUsed: [],
  }) as unknown as MatchExplanation;

describe("modèles de refus et d'acceptation (prompt 5 bis, écrans 55 et 80)", () => {
  it("prend le point fort parmi les compétences entièrement couvertes, vérifiées d'abord", () => {
    expect(
      strongestSkill(
        explanation([
          evidence("Excel", { coverage: 0.6 }),
          evidence("SQL", { required: 4, talent: 4 }),
          evidence("Power BI", { verified: true }),
        ]),
      ),
    ).toBe("Power BI");
    expect(strongestSkill(explanation([evidence("Excel"), evidence("SQL", { required: 4 })]))).toBe(
      "SQL",
    );
  });

  it("n'invente pas de point fort sans compétence couverte ni explication", () => {
    expect(strongestSkill(explanation([evidence("Excel", { coverage: 0.5 })]))).toBeNull();
    expect(strongestSkill(explanation([evidence("Excel", { talent: null })]))).toBeNull();
    expect(strongestSkill(null)).toBeNull();
  });

  it("surligne les champs remplis seuls, les plus longs d'abord", () => {
    expect(
      highlightSegments("Bonjour Grâce, le poste Analyste SQL chez Baobab. SQL !", [
        "Grâce",
        "Analyste SQL",
        "SQL",
        null,
        "",
      ]),
    ).toEqual([
      { text: "Bonjour ", filled: false },
      { text: "Grâce", filled: true },
      { text: ", le poste ", filled: false },
      { text: "Analyste SQL", filled: true },
      { text: " chez Baobab. ", filled: false },
      { text: "SQL", filled: true },
      { text: " !", filled: false },
    ]);
    expect(highlightSegments("Texte (libre) [a]", ["(libre)"])[1]).toEqual({
      text: "(libre)",
      filled: true,
    });
  });

  it("propose le ton suivant et nettoie une phrase vide", () => {
    expect(nextTone("organisation")).toBe("chaleureux");
    expect(nextTone("chaleureux")).toBe("court");
    expect(nextTone("court")).toBe("formel");
    expect(nextTone("formel")).toBe("chaleureux");
    expect(tidyText("Bonjour Awa,\n\nRetenue.  \n\n \n\n\nBienvenue !")).toBe(
      "Bonjour Awa,\n\nRetenue.\n\nBienvenue !",
    );
  });
});
