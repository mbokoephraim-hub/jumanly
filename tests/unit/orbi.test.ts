import { describe, expect, it } from "vitest";
import { detectTopic, rulesAnswer, titleOf, type OrbiTexts } from "@/server/services/orbi";

describe("Orbi : sujet d'une question et réponse par règles", () => {
  it("reconnaît le sujet d'une question", () => {
    expect(detectTopic("Mon CV est-il prêt pour l'offre Baobab ?")).toBe("cv");
    expect(detectTopic("Comment me préparer à un entretien ?")).toBe("interview");
    expect(detectTopic("Est-ce que je peux postuler à ce poste ?")).toBe("offer");
    expect(detectTopic("Quel métier choisir pour une reconversion ?")).toBe("path");
    expect(detectTopic("Quelle formation suivre sur Excel ?")).toBe("learn");
    expect(detectTopic("Bonjour")).toBe("other");
  });

  it("mène vers l'outil du sujet, avec un « Pourquoi ? »", () => {
    const texts = Object.fromEntries(
      ["cv", "interview", "offer", "path", "learn", "other", "declined", "whyRules"].map((key) => [
        key,
        `texte ${key}`,
      ]),
    ) as OrbiTexts;
    expect(rulesAnswer("interview", texts)).toEqual({
      answer: ["texte interview"],
      actions: ["interview"],
      why: "texte whyRules",
    });
    expect(rulesAnswer("offer", texts).actions).toEqual(["jobs"]);
  });

  it("titre de l'historique sur une ligne, raccourci", () => {
    expect(titleOf("  Mon CV\n  est-il prêt ? ")).toBe("Mon CV est-il prêt ?");
    const long = titleOf("a".repeat(200));
    expect(long).toHaveLength(80);
    expect(long.endsWith("…")).toBe(true);
  });
});
