import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";
import LearnCertificateEmail from "../../emails/learn-attestation";
import { parseResourceLines, publishProblems, questionData } from "@/server/services/course-admin";
import { certificateCode, opensCourse, scoreQuiz } from "@/server/services/learn";

describe("Accès aux formations", () => {
  it("le niveau du forfait ouvre les formations de niveau inférieur ou égal", () => {
    expect(opensCourse("free", "free")).toBe(true);
    expect(opensCourse("free", "fundamentals")).toBe(false);
    expect(opensCourse("fundamentals", "fundamentals")).toBe(true);
    expect(opensCourse("standard", "fundamentals")).toBe(true);
    expect(opensCourse("standard", "advanced")).toBe(false);
    expect(opensCourse("advanced", "advanced")).toBe(true);
  });
});

describe("Correction des quiz", () => {
  const questions = [
    { id: "a", type: "single" as const, options: ["x", "y"], answer: ["1"] },
    { id: "b", type: "multiple" as const, options: ["x", "y", "z"], answer: ["0", "2"] },
    { id: "c", type: "text" as const, options: [], answer: ["Kinshasa"] },
  ];

  it("compte les bonnes réponses et le pourcentage", () => {
    expect(scoreQuiz(questions, { a: ["1"], b: ["2", "0"], c: ["  kinshasa "] })).toMatchObject({
      correct: 3,
      total: 3,
      percent: 100,
    });
  });

  it("un choix multiple exige exactement les bonnes options", () => {
    expect(scoreQuiz(questions, { b: ["0"] }).results[1]!.correct).toBe(false);
    expect(scoreQuiz(questions, { b: ["0", "1", "2"] }).results[1]!.correct).toBe(false);
  });

  it("une réponse libre ignore les accents et la casse, une absence de réponse est fausse", () => {
    const accents = [{ id: "d", type: "text" as const, options: [], answer: ["Équipe"] }];
    expect(scoreQuiz(accents, { d: ["equipe"] }).correct).toBe(1);
    expect(scoreQuiz(questions, {})).toMatchObject({ correct: 0, percent: 0 });
  });
});

describe("Attestations", () => {
  it("un numéro a la forme JMN-XXXX-XXXX, sans caractères ambigus", () => {
    for (let i = 0; i < 50; i++)
      expect(certificateCode()).toMatch(/^JMN-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });

  it("l'e-mail d'attestation se rend avec le lien de vérification et sans téléphone", async () => {
    const html = await render(<LearnCertificateEmail />);
    expect(html).toContain("/attestations/");
    expect(html).not.toMatch(/tel:/);
  });
});

describe("Éditeur de formations", () => {
  it("convertit les numéros de bonnes réponses en indices", () => {
    const base = { prompt: "Question ?", options: "A\nB\nC", explanation: "" };
    expect(questionData({ ...base, type: "single", answer: "2" })?.answer).toEqual(["1"]);
    expect(questionData({ ...base, type: "multiple", answer: "3, 1" })?.answer).toEqual(["0", "2"]);
    expect(questionData({ ...base, type: "single", answer: "1, 2" })).toBeNull();
    expect(questionData({ ...base, type: "single", answer: "4" })).toBeNull();
    expect(questionData({ ...base, type: "text", answer: "Oui\nYes" })?.answer).toEqual([
      "Oui",
      "Yes",
    ]);
  });

  it("ne garde que les ressources valides", () => {
    const { resources, invalid } = parseResourceLines(
      "Modèle | https://exemple.test/cv.pdf | PDF\nSans adresse\nScript | javascript:alert(1)",
    );
    expect(resources).toEqual([
      { title: "Modèle", url: "https://exemple.test/cv.pdf", type: "PDF" },
    ]);
    expect(invalid).toBe(2);
  });

  it("refuse la publication d'une formation incomplète", () => {
    expect(
      publishProblems({ modules: [], instructor: null, summary: "", description: "" }),
    ).toEqual(["lessons", "instructor", "summary"]);
  });
});
