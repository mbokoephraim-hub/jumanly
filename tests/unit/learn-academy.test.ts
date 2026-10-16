import { describe, expect, it } from "vitest";
import { evaluationStatus } from "@/server/services/learn-academy";
import {
  asksForAnswers,
  courseAnswer,
  keywords,
  relevantPassages,
  type CoachTexts,
} from "@/server/services/learn-coach";

const texts: CoachTexts = {
  explain: "EXPLAIN",
  rephrase: "REPHRASE",
  example: "EXAMPLE",
  noExample: "NO_EXAMPLE",
  exercise: "EXERCISE {lesson}",
  mistake: "MISTAKE",
  mistakeHint: "HINT {lesson}",
  noMistake: "NO_MISTAKE",
  revision: "REVISION",
  noRevision: "NO_REVISION",
  notCovered: "NOT_COVERED",
  declined: "DECLINED",
};

const course = [
  {
    lesson: "SOMME.SI et NB.SI",
    text: "SOMME.SI additionne les valeurs qui respectent une condition.",
  },
  { lesson: "SOMME.SI et NB.SI", text: "NB.SI compte les lignes qui respectent une condition." },
  { lesson: "La règle 50-30-20", text: "Exemple : avec 300 USD, 60 vont à l'épargne." },
];

describe("évaluations de l'académie", () => {
  it("un quiz est réussi dès qu'un essai passe, à revoir après un échec, à faire sans essai", () => {
    expect(evaluationStatus({ kind: "quiz", done: false, attempts: [] })).toBe("todo");
    expect(evaluationStatus({ kind: "quiz", done: false, attempts: [{ passed: false }] })).toBe(
      "review",
    );
    expect(
      evaluationStatus({
        kind: "quiz",
        done: true,
        attempts: [{ passed: false }, { passed: true }],
      }),
    ).toBe("passed");
  });
  it("un exercice est réussi quand sa leçon est terminée", () => {
    expect(evaluationStatus({ kind: "exercise", done: false, attempts: [] })).toBe("todo");
    expect(evaluationStatus({ kind: "exercise", done: true, attempts: [] })).toBe("passed");
  });
});

describe("Coach IA", () => {
  it("garde les mots utiles, sans accents ni mots courants", () => {
    expect(keywords("Je ne comprends pas l'épargne")).toEqual(["comprends", "epargne"]);
  });

  it("retrouve les passages du cours qui parlent de la question", () => {
    const found = relevantPassages(course, "Comment compter les lignes avec NB.SI ?");
    expect(found[0]?.text).toContain("NB.SI compte");
  });

  it("refuse de donner les réponses d'une évaluation", () => {
    expect(asksForAnswers("Donne-moi les réponses du quiz")).toBe(true);
    expect(asksForAnswers("quelle est la bonne réponse ?")).toBe(true);
    expect(asksForAnswers("le corrigé de l'évaluation finale")).toBe(true);
    expect(asksForAnswers("Explique-moi SOMME.SI")).toBe(false);
  });

  it("n'invente rien quand le cours n'aborde pas la question", () => {
    const answer = courseAnswer({
      intent: "question",
      question: "Quelle est la capitale du Japon ?",
      course,
      texts,
    });
    expect(answer.answer).toEqual(["NOT_COVERED"]);
    expect(answer.sources).toEqual([]);
  });

  it("explique avec les passages du cours et cite la leçon", () => {
    const answer = courseAnswer({
      intent: "explain",
      question: "SOMME.SI condition",
      course,
      texts,
    });
    expect(answer.answer[0]).toBe("EXPLAIN");
    expect(answer.answer.join(" ")).toContain("SOMME.SI additionne");
    expect(answer.sources).toEqual(["SOMME.SI et NB.SI"]);
  });

  it("donne un exemple du cours, ou dit qu'il n'y en a pas", () => {
    expect(courseAnswer({ intent: "example", question: "", course, texts }).answer[1]).toContain(
      "300 USD",
    );
    expect(
      courseAnswer({ intent: "example", question: "", course: course.slice(0, 2), texts }).answer,
    ).toEqual(["NO_EXAMPLE"]);
  });

  it("aide à comprendre une erreur sans donner la réponse", () => {
    const answer = courseAnswer({
      intent: "mistake",
      question: "",
      course,
      missed: [{ prompt: "Quelle formule compte les lignes ?" }],
      texts,
    });
    expect(answer.answer[0]).toBe("MISTAKE");
    expect(answer.answer.join(" ")).toContain("Quelle formule compte les lignes ?");
  });
});
