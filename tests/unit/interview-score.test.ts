import { describe, expect, it } from "vitest";
import { offerKeywords, scoreSession } from "@/server/services/interview-score";
import type { InterviewTurn } from "@/server/services/interview-sim";

const turn = (answer: string | null, durationSec: number | null = null): InterviewTurn => ({
  question: "Parlez-nous d'une réussite.",
  answer,
  durationSec,
});
const good =
  "Lors de mon stage chez un opérateur, j'ai repris le suivi des réclamations clients. J'ai mis en place un tableau partagé avec l'équipe, ce qui a permis de réduire les délais de 5 à 2 jours.";
const vague = "J'aime travailler en équipe et je suis motivé.";

describe("bilan d'une simulation au téléphone (lot B6)", () => {
  it("sans réponse, pas de note", () => {
    expect(scoreSession([turn(null), turn("  ")], "text")).toBeNull();
  });

  it("note de façon déterministe, sur 100, avec une raison par critère", () => {
    const keywords = offerKeywords({ title: "Chargé de clientèle", skills: ["Réclamations"] });
    const first = scoreSession([turn(good), turn(vague)], "text", keywords)!;
    const second = scoreSession([turn(good), turn(vague)], "text", keywords)!;
    expect(first).toEqual(second);
    expect(first.overall).toBeGreaterThanOrEqual(0);
    expect(first.overall).toBeLessThanOrEqual(100);
    expect(first.criteria.map((item) => item.key)).toEqual([
      "clarity",
      "examples",
      "relevance",
      "length",
    ]);
    expect(first.criteria.find((item) => item.key === "examples")?.reason).toEqual({
      code: "examplesMissing",
      values: { count: 1 },
    });
  });

  it("une réponse chiffrée et située vaut mieux qu'une réponse vague", () => {
    const score = scoreSession([turn(good), turn(vague)], "text")!;
    const [strong, weak] = score.answers;
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.works).toContain("number");
    expect(weak.improve).toContain("number");
  });

  it("à l'oral, l'aisance remplace la longueur", () => {
    const score = scoreSession([turn(good, 25)], "voice")!;
    const keys = score.criteria.map((item) => item.key);
    expect(keys).toContain("ease");
    expect(keys).not.toContain("length");
  });

  it("les questions sans réponse ne comptent pas", () => {
    const score = scoreSession([turn(null), turn(good)], "text")!;
    expect(score.answers.map((item) => item.index)).toEqual([1]);
  });
});
