import { describe, expect, it } from "vitest";
import { emptyCv, isEmptyCv, type CvContent } from "@/server/services/cv";
import {
  cvFromExtraction,
  planCvIntoProfile,
  planSize,
  type ProfileSnapshot,
} from "@/server/services/cv-to-profile";

const cv: CvContent = {
  ...emptyCv,
  info: { ...emptyCv.info, name: "Talent Fictif", headline: "Comptable" },
  summary: "Comptable avec 5 ans d’expérience (fictif).",
  experiences: [
    {
      title: "Comptable",
      company: "Cabinet fictif",
      location: "",
      start: "2021-02",
      end: null,
      bullets: ["Clôtures mensuelles"],
    },
    {
      title: "Stagiaire",
      company: "Banque fictive",
      location: "",
      start: "",
      end: null,
      bullets: [],
    },
  ],
  education: [
    {
      degree: "Licence en gestion",
      school: "Université fictive",
      field: "",
      startYear: null,
      endYear: 2020,
    },
  ],
  skills: [
    { name: "excel", level: 3 },
    { name: "Inconnue", level: 3 },
  ],
  languages: [
    { code: "fr", level: "native" },
    { code: "en", level: "professional" },
  ],
};

const reference = [
  { id: "s-excel", name: "Excel", aliases: [] },
  { id: "s-sql", name: "SQL", aliases: [] },
];

const empty: ProfileSnapshot = {
  headline: null,
  summary: null,
  experiences: [],
  educations: [],
  skillIds: [],
  languages: [],
};

describe("Ajouter un CV à mon profil", () => {
  it("adds what the profile lacks, skipping undated experiences and unknown skills", () => {
    const plan = planCvIntoProfile(cv, empty, reference);
    expect(plan.headline).toBe("Comptable");
    expect(plan.summary).toBe(cv.summary);
    expect(plan.experiences.map((item) => item.title)).toEqual(["Comptable"]);
    expect(plan.educations).toHaveLength(1);
    expect(plan.skills).toEqual([{ id: "s-excel", name: "Excel" }]);
    expect(plan.languages).toEqual(["fr", "en"]);
    expect(planSize(plan)).toBe(7);
  });

  it("never replaces nor duplicates what the profile already has", () => {
    const plan = planCvIntoProfile(
      cv,
      {
        headline: "Analyste",
        summary: "Déjà écrit.",
        experiences: [{ title: "COMPTABLE", company: "cabinet fictif" }],
        educations: [{ degree: "Licence en gestion", school: "Université fictive" }],
        skillIds: ["s-excel"],
        languages: ["fr", "en"],
      },
      reference,
    );
    expect(planSize(plan)).toBe(0);
  });
});

describe("Garder un CV importé", () => {
  it("keeps the CV as read, with the account's name and e-mail when the file has none", () => {
    const content = cvFromExtraction(
      {
        experiences: [
          {
            title: "Comptable",
            company: "Cabinet fictif",
            start: "2021-02",
            end: "bientôt",
            description: "- Clôtures\n- Paie",
          },
        ],
        educations: [
          { degree: "Licence", school: "Université fictive", level: "bachelor", endYear: 2020 },
        ],
        skills: ["Excel"],
        languages: ["fr"],
        contact: { name: null, email: null, city: "Kinshasa" },
      },
      { name: "Talent Fictif", email: "talent@exemple.test", city: "", country: "CD" },
    );
    expect(content.info).toMatchObject({
      name: "Talent Fictif",
      email: "talent@exemple.test",
      city: "Kinshasa",
    });
    expect(content.experiences[0]).toMatchObject({
      start: "2021-02",
      end: null,
      bullets: ["Clôtures", "Paie"],
    });
    expect(content.skills).toEqual([{ name: "Excel", level: 3 }]);
    expect(isEmptyCv(content)).toBe(false);
  });
});
