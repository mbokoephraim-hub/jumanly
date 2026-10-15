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
  stageFor,
  type Answers,
} from "@/server/services/diagnostic-scoring";

/** A talent at the very start: no target job, no experience, nothing ready yet. */
const beginner: Answers = answersSchema.parse({
  situation: "a1",
  goal: "a1",
  targetRole: "",
  experience: "a1",
  education: "secondary",
  cvStatus: "a1",
  coverLetter: "a3",
  onlineProfile: "a3",
  confidence: "1",
  interviews: "a1",
  pitch: "a3",
  applications: "a1",
  obstacle: "a1",
  time: "a1",
  mobility: "a1",
  workMode: "a4",
  contacts: "a1",
});

/** Everything at its best. */
const expert: Answers = answersSchema.parse({
  ...beginner,
  targetRole: "Comptable",
  familiarity: "a1",
  companies: "a1",
  sectors: "Banque, audit",
  topSkills: "Excel, fiscalité, SAGE",
  languages: "Français, anglais",
  digital: "Excel",
  skillChecks: [
    { skill: "Excel", level: 4, proof: "a1" },
    { skill: "Fiscalité", level: "4", proof: "a1" },
  ],
  experience: "a5",
  education: "master",
  quantified: "a1",
  achievement:
    "J'ai réduit de moitié le délai de clôture mensuelle en automatisant les rapprochements.",
  cvStatus: "a3",
  coverLetter: "a1",
  onlineProfile: "a1",
  confidence: 5,
  interviews: "a4",
  pitch: "a1",
  applications: "a4",
  obstacle: "a5",
  time: "a4",
  contacts: "a4",
});

const score = (answers: Partial<Answers>, key: (typeof dimensions)[number]) =>
  scoreDimensions(answers).find((item) => item.key === key)!.score;

describe("diagnostic_scoring_v2 · six dimensions", () => {
  it("note chaque dimension sur 100, de 0 au départ à 100 au mieux", () => {
    const low = scoreDimensions(beginner);
    const high = scoreDimensions(expert);
    expect(low.map((item) => item.key)).toEqual([...dimensions]);
    for (const item of high) expect(item.score).toBe(100);
    expect(score(beginner, "clarity")).toBe(0);
    expect(score(beginner, "skills")).toBe(0);
    expect(score(beginner, "tools")).toBe(0);
    expect(score(beginner, "interviews")).toBe(0);
    expect(score(beginner, "experience")).toBe(8);
    expect(score(beginner, "search")).toBe(5);
    for (const item of [...low, ...high]) {
      expect(item.score).toBeGreaterThanOrEqual(0);
      expect(item.score).toBeLessThanOrEqual(100);
      expect(item.reasons.reduce((sum, reason) => sum + reason.max, 0)).toBe(100);
    }
  });

  it("clarté du projet : métier visé, familiarité, entreprises, secteurs, frein", () => {
    expect(score({ ...beginner, targetRole: "Comptable" }, "clarity")).toBe(35);
    expect(score({ ...beginner, targetRole: "Comptable", familiarity: "a2" }, "clarity")).toBe(53);
    // Sans métier visé, la familiarité ne compte pas (question non posée).
    expect(score({ ...beginner, familiarity: "a1", companies: "a1" }, "clarity")).toBe(0);
    expect(score({ ...beginner, obstacle: "a2", sectors: "Santé" }, "clarity")).toBe(20);
  });

  it("compétences : niveau et preuve des compétences demandées, plus les compétences citées", () => {
    const checks = [
      { skill: "Excel", level: 2, proof: "a4" },
      { skill: "Power BI", level: 3, proof: "a2" },
    ];
    // niveaux (1/3 + 2/3) / 2 × 40 = 20 ; preuves (0 + 0.8) / 2 × 30 = 12 ; 2 compétences citées = 8
    expect(score({ ...beginner, skillChecks: checks, topSkills: "Excel, Word" }, "skills")).toBe(
      40,
    );
  });

  it("expérience : années, études, résultats chiffrés seulement avec de l'expérience", () => {
    expect(
      score(
        { ...beginner, experience: "a3", education: "bachelor", quantified: "a2" },
        "experience",
      ),
    ).toBe(58);
    expect(score({ ...beginner, quantified: "a1" }, "experience")).toBe(8);
  });

  it("outils, entretiens et recherche suivent leur barème", () => {
    expect(
      score({ ...beginner, cvStatus: "a2", coverLetter: "a2", onlineProfile: "a2" }, "tools"),
    ).toBe(45);
    expect(score({ ...beginner, confidence: 3, interviews: "a2", pitch: "a2" }, "interviews")).toBe(
      50,
    );
    expect(score({ ...beginner, applications: "a3", time: "a3", contacts: "a3" }, "search")).toBe(
      78,
    );
  });

  it("une question pas encore répondue compte 0 (radar en direct)", () => {
    const partial = scoreDimensions({ situation: "a1" });
    for (const item of partial) expect(item.score).toBe(0);
  });
});

describe("diagnostic_scoring_v2 · quatre stades", () => {
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

describe("diagnostic_scoring_v2 · questions adaptatives", () => {
  const ids = (answers: Partial<Answers>, skills: string[] = [], personalized = false) =>
    screensFor(answers, skills, personalized).map((screen) => screen.id);

  it("pas de question sur le métier visé sans métier visé", () => {
    expect(ids({})).not.toContain("familiarity");
    expect(ids({})).not.toContain("companies");
    expect(ids({ targetRole: "Comptable" })).toEqual(
      expect.arrayContaining(["familiarity", "companies"]),
    );
  });

  it("pas de question sur les résultats chiffrés sans expérience", () => {
    expect(ids({ experience: "a1" })).not.toContain("quantified");
    expect(ids({ experience: "a3" })).toContain("quantified");
  });

  it("un écran par compétence évaluée (cinq au plus), juste après les compétences à développer", () => {
    const list = ids({}, ["A", "B", "C", "D", "E", "F"]);
    const at = list.indexOf("skillsToBuild");
    expect(list.slice(at + 1, at + 6)).toEqual(["skill0", "skill1", "skill2", "skill3", "skill4"]);
    expect(list).not.toContain("skill5");
  });

  it("le diagnostic personnalisé ajoute quatre questions à la fin", () => {
    expect(ids({}, [], true).slice(-4)).toEqual(["values", "workStyle", "feedback", "horizon"]);
    expect(ids({}, [], true)).toHaveLength(ids({}).length + 4);
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
    expect(result.priorities).toEqual(["role", "skills", "cv"]);
    expect(result.steps).toEqual(["profile", "role", "skills"]);
    for (const step of result.steps) expect(stepLinks[step]).toMatch(/^\//);
    expect(prioritiesFor(scoreDimensions(expert), expert)).toHaveLength(3);
  });

  it("peu de contacts : la priorité de recherche devient le réseau", () => {
    const weakSearch = { ...expert, applications: "a1", time: "a1", contacts: "a2" } as Answers;
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
      "contacts",
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
