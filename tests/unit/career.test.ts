// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  cvFromProfile,
  emptyCv,
  isEmptyCv,
  moveSection,
  parseCv,
  toggleSection,
} from "@/server/services/cv";
import { simpleDiagnostic, simpleAnswersSchema, stepLinks } from "@/server/services/diagnostic";
import { completeness, experienceSchema, type FullProfile } from "@/server/services/profile";

const emptyProfile = {
  headline: null,
  summary: null,
  desiredContracts: [],
  desiredJobTitles: [],
  languages: [],
  user: { city: null, country: null },
  _count: { experiences: 0, educations: 0, skills: 0 },
};

describe("complétude du profil", () => {
  it("vide : 0 %, toutes les sections manquent", () => {
    const result = completeness(emptyProfile);
    expect(result.percent).toBe(0);
    expect(result.missing).toHaveLength(7);
  });

  it("complet : 100 %", () => {
    const result = completeness({
      headline: "Comptable",
      summary: "x".repeat(60),
      desiredContracts: ["cdi"],
      desiredJobTitles: [],
      languages: [{ code: "fr", level: "native" }],
      user: { city: "Kinshasa", country: "CD" },
      _count: { experiences: 1, educations: 1, skills: 3 },
    });
    expect(result).toEqual({ percent: 100, missing: [] });
  });

  it("un résumé trop court et moins de trois compétences ne comptent pas", () => {
    const result = completeness({
      ...emptyProfile,
      summary: "Court",
      _count: { experiences: 0, educations: 0, skills: 2 },
    });
    expect(result.missing).toContain("summary");
    expect(result.missing).toContain("skills");
  });
});

describe("expérience", () => {
  const base = { title: "Poste", company: "Société", type: "job", location: "", description: "" };
  it("demande une fin, sauf poste actuel", () => {
    expect(experienceSchema.safeParse({ ...base, start: "2022-01" }).success).toBe(false);
    expect(experienceSchema.safeParse({ ...base, start: "2022-01", current: "on" }).success).toBe(
      true,
    );
  });
  it("refuse une fin avant le début", () => {
    const parsed = experienceSchema.safeParse({ ...base, start: "2022-05", end: "2021-01" });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("endBeforeStart");
  });
});

describe("diagnostic simplifié", () => {
  const answers = simpleAnswersSchema.parse({
    situation: "a3",
    experience: "a1",
    education: "secondary",
    goal: "a1",
    targetRole: "",
    topSkills: "Excel, rédaction, service client, vente",
    confidence: "2",
    cvStatus: "a1",
    applications: "a1",
    obstacle: "a3",
    time: "a1",
    mobility: "a1",
  });

  it("mêmes réponses, même résultat (règles fixes)", () => {
    expect(simpleDiagnostic(answers)).toEqual(simpleDiagnostic(answers));
  });

  it("donne au plus trois priorités et trois étapes, chacune avec un lien", () => {
    const result = simpleDiagnostic(answers);
    expect(result.readiness).toBe("low");
    expect(result.priorities[0]).toBe("cv");
    expect(result.priorities.length).toBeLessThanOrEqual(3);
    expect(result.steps).toHaveLength(3);
    expect(result.steps[0]).toBe("profile");
    for (const step of result.steps) expect(stepLinks[step]).toMatch(/^\//);
    expect(result.skills).toEqual(["Excel", "rédaction", "service client"]);
  });

  it("un profil expérimenté est prêt à candidater", () => {
    const result = simpleDiagnostic({
      ...answers,
      experience: "a5",
      education: "master",
      confidence: 5,
      cvStatus: "a3",
      applications: "a3",
      targetRole: "Comptable",
    });
    expect(result.readiness).toBe("high");
    expect(result.strengths).toEqual(
      expect.arrayContaining(["experience", "education", "interview"]),
    );
    expect(result.roles).toEqual(["Comptable"]);
  });
});

const profile = {
  headline: "Comptable",
  summary: "Résumé",
  languages: [{ code: "fr", level: "native" }],
  user: {
    firstName: "Awa",
    lastName: "Fictive",
    name: "Awa Fictive",
    email: "awa@jumanly.test",
    city: "Kinshasa",
    country: "CD",
  },
  experiences: [
    {
      title: "Assistante comptable",
      company: "Entreprise fictive",
      location: null,
      startDate: new Date("2021-03-01T00:00:00Z"),
      endDate: null,
      description: "- Saisie\n• Rapprochements\n\n",
    },
  ],
  educations: [
    {
      degree: "Licence",
      school: "Université fictive",
      field: null,
      startYear: 2016,
      endYear: 2019,
    },
  ],
  skills: [{ level: 3, skill: { name: "Excel" } }],
} as unknown as FullProfile;

describe("CV", () => {
  it("se remplit depuis le profil, sans photo ni âge", () => {
    const cv = cvFromProfile(profile);
    expect(cv.info.name).toBe("Awa Fictive");
    expect(cv.experiences[0]).toMatchObject({
      start: "2021-03",
      end: null,
      bullets: ["Saisie", "Rapprochements"],
    });
    expect(Object.keys(cv.info)).not.toContain("photo");
    expect(isEmptyCv(cv)).toBe(false);
    expect(isEmptyCv(emptyCv)).toBe(true);
  });

  it("garde l'ordre des sections lors d'une mise à jour depuis le profil", () => {
    const moved = toggleSection(moveSection(cvFromProfile(profile), "skills", -1), "languages");
    const refreshed = cvFromProfile(profile, moved);
    expect(refreshed.sections).toEqual(moved.sections);
    expect(refreshed.sections.find((section) => section.id === "languages")?.visible).toBe(false);
  });

  it("un contenu illisible devient un CV vide", () => {
    expect(parseCv({ nimporte: "quoi" })).toEqual(emptyCv);
  });
});
