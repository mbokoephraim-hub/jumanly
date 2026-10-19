import { describe, expect, it } from "vitest";
import { blockLayout, orderBlocks, resolveStyle } from "@/features/cv/style";
import { templateOf } from "@/features/cv/templates/registry";
import { offerGap } from "@/server/services/career-documents";
import { emptyCv, type CvContent } from "@/server/services/cv";
import { acceptable, summaryTemplate, type CoachSuggestion } from "@/server/services/cv-coach";

/** Rules of « CV et documents » (planche talent-4 § 6, lot 6c), without the database. */

const cv: CvContent = {
  ...emptyCv,
  info: { ...emptyCv.info, name: "Awa Fictive", headline: "Analyste de données" },
  summary: "Analyste junior.",
  experiences: [
    {
      title: "Stagiaire",
      company: "Entreprise fictive",
      location: "Abidjan",
      start: "2024-01",
      end: null,
      bullets: ["Suivi de 40 dossiers par semaine avec Power BI"],
    },
  ],
  skills: [
    { name: "Excel", level: 3 },
    { name: "SQL", level: 2 },
  ],
};

const summary = (after: string): CoachSuggestion => ({
  kind: "summary",
  target: { section: "summary", experience: null, bullet: null },
  before: "Analyste junior.",
  after,
  skill: null,
});

describe("CV et documents : règles", () => {
  it("l'écart avec une offre : déjà listé, écrit ailleurs, absent", () => {
    expect(offerGap(cv, ["Excel", "Power BI", "Python"])).toEqual({
      listed: ["Excel"],
      written: ["Power BI"],
      absent: ["Python"],
    });
  });

  it("une reformulation n'invente aucun chiffre et vise le texte actuel", () => {
    expect(acceptable(cv, summary("Analyste de données junior, à l'aise avec Excel et SQL."))).toBe(
      true,
    );
    // 40 is already in the CV (an achievement): it may be put forward in the summary.
    expect(acceptable(cv, summary("Analyste junior : 40 dossiers suivis par semaine."))).toBe(true);
    expect(acceptable(cv, summary("Analyste avec 10 ans d'expérience."))).toBe(false);
    expect(acceptable(cv, { ...summary("Analyste."), before: "Un autre texte." })).toBe(false);
    expect(acceptable(cv, summary(""))).toBe(false);
  });

  it("le résumé proposé sans IA reprend seulement le CV", () => {
    expect(summaryTemplate(cv)).toBe("Analyste de données, Excel, SQL. Analyste junior.");
    expect(summaryTemplate({ ...emptyCv })).toBe("");
  });

  it("l'ordre des sections ne change que s'il reprend les mêmes sections", () => {
    const template = templateOf("classique");
    const style = resolveStyle(null, template);
    const present = ["summary", "experience", "education", "skills"] as const;
    const current = blockLayout(template, style, present).map((block) => block.type);
    const moved = [...current].reverse();
    expect(orderBlocks(template, style, present, moved).sectionOrder).toEqual(moved);
    expect(orderBlocks(template, style, present, current.slice(1))).toBe(style);
    expect(orderBlocks(template, style, present, [...current, current[0]!])).toBe(style);
  });
});
