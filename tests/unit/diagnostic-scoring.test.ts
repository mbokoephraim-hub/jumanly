// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  mergePersonalized,
  miniPlanLinks,
  parseDiagnosticResult,
  parseDiagnosticV2,
  ruleDiagnostic,
  stepLinks,
} from "@/server/services/diagnostic";
import {
  answersSchema,
  dimensions,
  globalScore,
  prioritiesFor,
  ruleFollowUps,
  scoreDimensions,
  screensFor,
  SKILL_PICKS,
  skillPickOf,
  stageFor,
  type Answers,
} from "@/server/services/diagnostic-scoring";

/** A talent at the very start: no target job, no experience, nothing ready yet. */
const beginner: Answers = answersSchema.parse({
  targetRole: "",
  experience: "a1",
  ready: [],
  confidence: "1",
  interviews: "a1",
  applications: "a1",
  contacts: "a1",
  obstacle: "a1",
});

/** Everything at its best. */
const expert: Answers = answersSchema.parse({
  ...beginner,
  targetRole: "Comptable",
  familiarity: "a1",
  skillChecks: [
    { skill: "Excel", ...SKILL_PICKS[3] },
    { skill: "Fiscalité", level: "4", proof: "a1" },
  ],
  experience: "a4",
  education: "master",
  ready: ["cv", "letter", "profile", "portfolio"],
  confidence: 5,
  interviews: "a3",
  applications: "a3",
  contacts: "a3",
  obstacle: "a2",
});

const score = (answers: Partial<Answers>, key: (typeof dimensions)[number]) =>
  scoreDimensions(answers).find((item) => item.key === key)!.score;

describe("diagnostic_scoring_v3 · six dimensions", () => {
  it("note chaque dimension sur 100, de 0 au départ à 100 au mieux", () => {
    const low = scoreDimensions(beginner);
    const high = scoreDimensions(expert);
    expect(low.map((item) => item.key)).toEqual([...dimensions]);
    for (const item of high) expect(item.score).toBe(100);
    for (const item of low) expect(item.score).toBe(0);
    for (const item of high)
      expect(item.reasons.reduce((sum, reason) => sum + reason.max, 0)).toBe(100);
  });

  it("clarté du projet : métier visé, connaissance du métier, frein nommé", () => {
    expect(score({ ...beginner, targetRole: "Comptable" }, "clarity")).toBe(40);
    expect(score({ ...beginner, targetRole: "Comptable", familiarity: "a2" }, "clarity")).toBe(65);
    // Sans métier visé, la familiarité ne compte pas (question non posée).
    expect(score({ ...beginner, familiarity: "a1" }, "clarity")).toBe(0);
    expect(score({ ...beginner, obstacle: "a2" }, "clarity")).toBe(25);
  });

  it("compétences : une réponse donne le niveau et la preuve", () => {
    const checks = [
      { skill: "Excel", ...SKILL_PICKS[1] },
      { skill: "Power BI", ...SKILL_PICKS[2] },
    ];
    // niveaux (1/3 + 2/3) / 2 × 55 = 28 ; preuves (0 + 0.8) / 2 × 45 = 18
    expect(score({ ...beginner, skillChecks: checks }, "skills")).toBe(46);
    expect(SKILL_PICKS.map((pick) => skillPickOf(pick))).toEqual([0, 1, 2, 3]);
    // Un brouillon d'avant le 31/10/2026 retrouve sa réponse.
    expect(skillPickOf({ level: 2, proof: "a2" })).toBe(3);
    expect(skillPickOf({ level: 1, proof: "a3" })).toBe(1);
  });

  it("expérience : années et réalisations, les études seulement si le profil les donne", () => {
    expect(score({ ...beginner, experience: "a3", ready: ["portfolio"] }, "experience")).toBe(75);
    expect(
      score(
        { ...beginner, experience: "a3", ready: ["portfolio"], education: "bachelor" },
        "experience",
      ),
    ).toBe(76);
  });

  it("outils, entretiens et recherche suivent leur barème", () => {
    expect(score({ ...beginner, ready: ["cv", "letter"] }, "tools")).toBe(75);
    expect(score({ ...beginner, confidence: 3, interviews: "a2" }, "interviews")).toBe(55);
    expect(score({ ...beginner, applications: "a2", contacts: "a3" }, "search")).toBe(80);
  });

  it("une question pas encore répondue compte 0", () => {
    const partial = scoreDimensions({ targetRole: "" });
    for (const item of partial) expect(item.score).toBe(0);
  });

  it("un diagnostic d'avant le 31/10/2026 se relit encore", () => {
    const old = answersSchema.safeParse({
      ...beginner,
      situation: "a2",
      goal: "a1",
      cvStatus: "a2",
      pitch: "a2",
      time: "a3",
      experience: "a5",
      interviews: "a4",
    });
    expect(old.success).toBe(true);
  });
});

describe("diagnostic_scoring_v3 · quatre stades", () => {
  it("Découverte 0–39, Construction 40–59, Prêt 60–79, Compétitif 80–100", () => {
    expect([0, 39, 40, 59, 60, 79, 80, 100].map(stageFor)).toEqual([
      "discovery",
      "discovery",
      "building",
      "building",
      "ready",
      "ready",
      "competitive",
      "competitive",
    ]);
  });

  it("la note globale est la moyenne arrondie des six dimensions", () => {
    expect(globalScore([10, 20, 30, 40, 50, 61].map((value) => ({ score: value })))).toBe(35);
    expect(ruleDiagnostic(expert).score).toBe(100);
    expect(ruleDiagnostic(expert).stage).toBe("competitive");
    expect(ruleDiagnostic(beginner).stage).toBe("discovery");
  });
});

describe("diagnostic_scoring_v3 · une dizaine de questions", () => {
  const ids = (answers: Partial<Answers>, skills: string[] = [], personalized = false) =>
    screensFor(answers, skills, personalized).map((screen) => screen.id);

  it("dix questions au plus, neuf sans métier visé", () => {
    expect(ids({ targetRole: "Comptable" }, ["A", "B"])).toEqual([
      "targetRole",
      "familiarity",
      "skills",
      "experience",
      "ready",
      "confidence",
      "interviews",
      "applications",
      "contacts",
      "obstacle",
    ]);
    expect(ids({}, ["A"])).toHaveLength(9);
    expect(ids({}, ["A"])).not.toContain("familiarity");
  });

  it("les compétences évaluées sur un seul écran, trois au plus, toujours posé", () => {
    const screen = screensFor({}, ["A", "B", "C", "D"], false).find((item) => item.id === "skills");
    expect(screen && "skills" in screen ? screen.skills : []).toEqual(["A", "B", "C"]);
    // Métier inconnu : l'écran reste, la personne cite ses compétences.
    expect(ids({}, [])).toContain("skills");
  });

  it("le diagnostic personnalisé n'ajoute que les questions de relance", () => {
    expect(ids({}, [], true)).toEqual(ids({}));
  });

  it("les six dimensions sont toutes parcourues, dans l'ordre", () => {
    const order = screensFor({ targetRole: "x", experience: "a2" }, ["A"], false).map(
      (screen) => screen.dimension,
    );
    expect(order.filter((value, index) => order.indexOf(value) === index)).toEqual([...dimensions]);
  });
});

describe("diagnostic · résultat", () => {
  it("mêmes réponses, même résultat (règles fixes)", () => {
    expect(ruleDiagnostic(beginner, { offers: 4 })).toEqual(
      ruleDiagnostic(beginner, { offers: 4 }),
    );
  });

  it("trois priorités : les dimensions les plus faibles, et des étapes avec un lien", () => {
    const result = ruleDiagnostic(beginner);
    expect(result.priorities).toEqual(["role", "skills", "experience"]);
    expect(result.steps).toEqual(["profile", "role", "skills"]);
    for (const step of result.steps) expect(stepLinks[step]).toMatch(/^\//);
    expect(prioritiesFor(scoreDimensions(expert), expert)).toHaveLength(3);
  });

  it("peu de contacts : la priorité de recherche devient le réseau", () => {
    const weakSearch = { ...expert, applications: "a1", contacts: "a2" } as Answers;
    expect(ruleDiagnostic(weakSearch).priorities[0]).toBe("network");
  });

  it("garde les champs lus par le plan de progression et la page Career", () => {
    const stored = JSON.parse(JSON.stringify(ruleDiagnostic(expert, { offers: 12 })));
    expect(parseDiagnosticResult(stored)?.readiness).toBe("high");
    const v2 = parseDiagnosticV2(stored);
    expect(v2?.offers).toBe(12);
    expect(v2?.dimensions).toHaveLength(6);
    expect(parseDiagnosticV2({ ...stored, version: undefined })).toBeNull();
  });

  it("l'IA explique et propose, mais ne change ni les notes ni le stade", () => {
    const base = ruleDiagnostic(beginner);
    const merged = mergePersonalized(base, {
      summary: " Synthèse. ",
      strengths: ["Curiosité"],
      priorities: ["interview", "interview"],
      roles: ["Assistant comptable"],
      steps: [],
    });
    expect(merged.score).toBe(base.score);
    expect(merged.stage).toBe(base.stage);
    expect(merged.dimensions).toEqual(base.dimensions);
    expect(merged.priorities).toEqual(["interview"]);
    expect(merged.steps).toEqual(base.steps);
    expect(merged.summary).toBe("Synthèse.");
  });
});

describe("diagnostic personnalisé · questions de relance et mini plan", () => {
  it("les questions de relance s'ajoutent à la fin, seulement au niveau personnalisé", () => {
    const followUps = [
      { question: "Quel a été le résultat concret ?", answer: "" },
      { question: "Qu'avez-vous déjà essayé ?", answer: "" },
    ];
    const asked = screensFor({ targetRole: "Comptable", followUps }, [], true);
    expect(asked.slice(-2).map((screen) => screen.id)).toEqual(["followUp0", "followUp1"]);
    expect(screensFor({ targetRole: "Comptable", followUps }, [], false).at(-1)?.id).toBe(
      "obstacle",
    );
  });

  it("sans IA, les règles choisissent deux questions à partir des réponses", () => {
    expect(
      ruleFollowUps({ achievement: "J'ai aidé mon équipe.", targetRole: "", obstacle: "a3" }),
    ).toEqual([{ code: "achievementResult" }, { code: "energy" }]);
    expect(
      ruleFollowUps({
        targetRole: "Comptable",
        obstacle: "a1",
        skillChecks: [{ skill: "Excel", level: 2, proof: "a4" }],
        pitch: "a3",
      }),
    ).toEqual([{ code: "skillProof", skill: "Excel" }, { code: "pitch" }]);
    expect(ruleFollowUps({ targetRole: "Comptable" })).toHaveLength(2);
  });

  it("les relances ne changent pas les notes", () => {
    const withFollowUps = {
      ...expert,
      followUps: [{ question: "Quel résultat ?", answer: "Trente pour cent de plus." }],
    };
    expect(ruleDiagnostic(withFollowUps).score).toBe(ruleDiagnostic(expert).score);
  });

  it("le mini plan de l'IA ne garde qu'une phrase par priorité retenue", () => {
    const base = ruleDiagnostic(beginner);
    const merged = mergePersonalized(base, {
      summary: "",
      strengths: [],
      priorities: ["interview", "cv"],
      roles: [],
      steps: [],
      miniPlan: [
        { priority: "interview", text: " Répétez votre présentation. " },
        { priority: "interview", text: "Doublon" },
        { priority: "network", text: "Hors priorités" },
      ],
    });
    expect(merged.miniPlan).toEqual([
      { priority: "interview", text: "Répétez votre présentation." },
    ]);
  });

  it("chaque étape du mini plan est gratuite : aucun lien vers une page payante", () => {
    for (const href of Object.values(miniPlanLinks)) {
      if (href) expect(href).not.toMatch(/entretiens|plan|tarifs/);
    }
  });
});
