import { describe, expect, it } from "vitest";
import {
  checkFromForm,
  checkToForm,
  lessonCheck,
  publicCheck,
} from "@/server/services/learn-phone";

describe("question rapide d'une leçon (Modèle B, lot B7)", () => {
  const form = [
    "Quelles lignes garde INNER JOIN ?",
    "* Celles présentes des deux côtés",
    "Toutes les lignes de gauche",
    "Aucune",
    "> Seulement ce qui existe des deux côtés.",
  ].join("\n");

  it("lit le champ de l'admin : question, réponses, bonne réponse, explication", () => {
    expect(checkFromForm(form)).toEqual({
      question: "Quelles lignes garde INNER JOIN ?",
      options: ["Celles présentes des deux côtés", "Toutes les lignes de gauche", "Aucune"],
      answer: 0,
      explanation: "Seulement ce qui existe des deux côtés.",
    });
  });

  it("refuse un champ sans bonne réponse ou avec une seule réponse", () => {
    expect(checkFromForm("Question ?\nA\nB")).toBeNull();
    expect(checkFromForm("Question ?\n* A")).toBeNull();
    expect(checkFromForm("")).toBeNull();
  });

  it("réécrit le champ à l'identique pour l'admin", () => {
    expect(checkToForm(checkFromForm(form))).toBe(form);
    expect(checkToForm(null)).toBe("");
  });

  it("lit la question du contenu de la leçon et ne montre jamais la réponse", () => {
    const content = { paragraphs: [], check: checkFromForm(form) };
    const check = lessonCheck(content);
    expect(check?.answer).toBe(0);
    expect(publicCheck(check)).toEqual({
      question: "Quelles lignes garde INNER JOIN ?",
      options: ["Celles présentes des deux côtés", "Toutes les lignes de gauche", "Aucune"],
    });
    expect(lessonCheck({ check: { question: "Q", options: ["A", "B"], answer: 3 } })).toBeNull();
    expect(lessonCheck(null)).toBeNull();
  });
});
