import { describe, expect, it } from "vitest";
import {
  acceptableCorrection,
  acceptableTailor,
  applyCorrections,
  noMissingSkill,
  noNewFigure,
  reorderSkills,
  ruleCorrections,
  tailorTemplate,
} from "@/server/services/career-documents";
import { emptyCv, type CvContent } from "@/server/services/cv";
import {
  acceptableFeedback,
  acceptableQuestions,
  answerSignals,
  pace,
  questionCount,
  rulesFeedback,
  type InterviewFeedback,
} from "@/server/services/interview-sim";
import { newSlug, projectSchema } from "@/server/services/portfolio";

const turn = (answer: string | null, durationSec: number | null = null) => ({
  question: "Parlez-nous d'une réussite.",
  answer,
  durationSec,
});
const good =
  "Lors de mon stage chez un opérateur, j'ai repris le suivi des réclamations. J'ai mis en place un tableau partagé, ce qui a permis de réduire les délais de 5 à 2 jours.";

describe("simulations d'entretien : règles", () => {
  it("le nombre de questions suit la durée", () => {
    expect(questionCount(10)).toBe(4);
    expect(questionCount(20)).toBe(8);
    expect(questionCount(30)).toBe(12);
  });

  it("repère situation, action et résultat", () => {
    const signals = answerSignals(good);
    expect(signals).toMatchObject({ situation: true, action: true, result: true, example: true });
    expect(answerSignals("Je suis motivé.").result).toBe(false);
  });

  it("retour par règles : niveaux par critère, codes par question, jamais de note", () => {
    const feedback = rulesFeedback([turn(good), turn("Je suis motivé."), turn(null)], "text");
    expect(feedback.source).toBe("rules");
    expect(feedback.criteria.map((item) => item.key)).not.toContain("pace");
    expect(feedback.perQuestion.map((item) => item.index)).toEqual([0, 1]);
    expect(feedback.perQuestion[1].comment).toContainEqual({ code: "short" });
    expect(feedback.improvements).toContainEqual({ code: "noAnswer" });
    expect(JSON.stringify(feedback)).not.toMatch(/\d+ ?%|\/ ?\d+/);
  });

  it("le débit n'est évalué qu'à l'oral", () => {
    expect(pace(turn(good, 15))).toBeGreaterThan(100);
    expect(pace(turn(good))).toBeNull();
    const feedback = rulesFeedback([turn(good, 15)], "voice");
    expect(feedback.criteria.map((item) => item.key)).toContain("pace");
    expect(rulesFeedback([turn(null)], "text").summary).toEqual({ code: "noAnswer" });
  });

  it("rejette les questions discriminatoires et les retours qui notent", () => {
    expect(acceptableQuestions(["Quel âge avez-vous ?"], 1)).toBe(false);
    expect(acceptableQuestions(["Avez-vous des enfants ?"], 1)).toBe(false);
    expect(acceptableQuestions(["Présentez votre dernier projet."], 1)).toBe(true);
    expect(acceptableQuestions(["Présentez votre dernier projet."], 2)).toBe(false);
    const feedback: InterviewFeedback = {
      source: "ai",
      summary: { text: "Bonne séance : 15/20." },
      criteria: [],
      strengths: [],
      improvements: [],
      perQuestion: [],
    };
    expect(acceptableFeedback(feedback, [0])).toBe(false);
    expect(
      acceptableFeedback(
        { ...feedback, summary: { text: "Vos chances d'être embauché sont fortes." } },
        [0],
      ),
    ).toBe(false);
    expect(acceptableFeedback({ ...feedback, summary: { text: "Réponses claires." } }, [0])).toBe(
      true,
    );
  });
});

describe("documents : garde-fous contre l'invention", () => {
  it("aucun chiffre nouveau, aucune compétence manquante", () => {
    expect(noNewFigure("Trois ans chez Alpha, 12 clients", ["12 clients suivis"])).toBe(true);
    expect(noNewFigure("40 % de ventes en plus", ["ventes"])).toBe(false);
    expect(noMissingSkill("Je maîtrise Python et Excel.", ["Python"])).toBe(false);
    expect(noMissingSkill("Je maîtrise Excel.", ["Python"])).toBe(true);
  });

  it("corrections par règles, appliquées au choix", () => {
    const text = "bonjour,  je vous écris . merci";
    const corrections = ruleCorrections(text).map((item, index) => ({
      ...item,
      id: String(index),
    }));
    expect(corrections.every((item) => acceptableCorrection(text, item))).toBe(true);
    expect(
      applyCorrections(
        text,
        corrections,
        corrections.map((item) => item.id),
      ),
    ).toBe("Bonjour, je vous écris. Merci");
    expect(applyCorrections(text, corrections, [])).toBe(text);
    expect(acceptableCorrection(text, { before: "absent", after: "x", why: { code: "x" } })).toBe(
      false,
    );
    expect(
      acceptableCorrection(text, { before: "merci", after: "merci 2", why: { code: "x" } }),
    ).toBe(false);
  });

  it("CV adapté : les compétences de l'offre d'abord, rien d'ajouté", () => {
    const cv: CvContent = {
      ...emptyCv,
      info: { ...emptyCv.info, headline: "Assistante" },
      skills: [
        { name: "Excel", level: 2 },
        { name: "Accueil", level: 3 },
      ],
      experiences: [
        {
          title: "Assistante",
          company: "Alpha",
          location: "",
          start: "2024-01",
          end: null,
          bullets: ["Gestion du courrier", "Tableaux Excel pour 12 clients"],
        },
      ],
    };
    const job = {
      id: "j",
      title: "Comptable",
      company: "B",
      description: "",
      skills: ["Excel", "Sage"],
    };
    expect(reorderSkills(cv, job.skills).map((skill) => skill.name)).toEqual(["Excel", "Accueil"]);
    expect(tailorTemplate(cv, job).experiences[0].bullets[0]).toBe(
      "Tableaux Excel pour 12 clients",
    );
    const output = {
      headline: "Assistante comptable",
      summary: "",
      experiences: [{ index: 0, bullets: ["Courrier", "Tableaux Excel pour 12 clients"] }],
    };
    expect(acceptableTailor(cv, output, job)).toBe(true);
    expect(acceptableTailor(cv, { ...output, headline: "Experte Sage" }, job)).toBe(false);
    expect(
      acceptableTailor(
        cv,
        { ...output, experiences: [{ index: 0, bullets: ["Courrier", "Excel pour 30 clients"] }] },
        job,
      ),
    ).toBe(false);
  });
});

describe("portfolio", () => {
  it("un projet : titre requis, douze compétences au plus, fichiers gardés par leur clé", () => {
    expect(projectSchema.safeParse({ title: "" }).success).toBe(false);
    expect(
      projectSchema.safeParse({ title: "P", skills: Array.from({ length: 13 }, (_, i) => `S${i}`) })
        .success,
    ).toBe(false);
    const project = projectSchema.parse({ title: "P", keep: ["projects/u/a"] });
    expect(project).toMatchObject({ visible: false, skills: [], keep: ["projects/u/a"] });
  });

  it("adresse publique non devinable", () => {
    expect(newSlug("Amélie")).toMatch(/^amelie-[0-9a-f]{8}$/);
    expect(newSlug(null)).toMatch(/^[0-9a-f]{8}$/);
  });
});
