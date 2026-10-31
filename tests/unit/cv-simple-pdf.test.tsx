// @vitest-environment node
/**
 * The CV drawn without a browser (src/server/pdf/cv-simple.tsx), sent when Chromium fails
 * (Ephraïm, 31/10/2026): every text of the CV is in the file. Fictional data.
 */
import { extractText, getDocumentProxy } from "unpdf";
import { expect, test } from "vitest";
import { documentTexts, type CvDocumentData } from "@/features/cv/render/model";
import { renderSimpleCv } from "@/server/pdf/cv-simple";

const data: CvDocumentData = {
  language: "fr",
  firstName: "Grâce",
  lastName: "Exemple-Fictif",
  headline: "Analyste crédit junior",
  contact: [{ value: "Kinshasa" }, { value: "grace@exemple.test" }],
  blocks: [
    { id: "s", type: "summary", title: "Profil", text: "Analyste rigoureuse, données." },
    {
      id: "e",
      type: "experience",
      title: "Expérience professionnelle",
      items: [
        {
          id: "e1",
          title: "Stagiaire analyste",
          subtitle: "Banque Fictive · Kinshasa",
          period: "2025 – aujourd'hui",
          bullets: ["Analyse de dossiers de crédit.", "Tableaux de bord mensuels."],
        },
      ],
    },
    {
      id: "k",
      type: "skills",
      title: "Compétences",
      skills: [{ name: "Excel", level: 3, levelLabel: "Avancé" }],
    },
    {
      id: "l",
      type: "languages",
      title: "Langues",
      languages: [{ name: "Lingala", levelLabel: "Courant", dots: 4 }],
    },
  ],
};

test("le CV dessiné sans navigateur garde tous ses textes", { timeout: 60_000 }, async () => {
  const pdf = await renderSimpleCv({ data, accent: "#A23B2A", photo: null, title: "CV" });
  const document = await getDocumentProxy(new Uint8Array(pdf));
  const { text } = await extractText(document, { mergePages: true });
  const flat = text.replace(/\s+/g, " ").toLowerCase();
  for (const piece of documentTexts(data)) expect(flat).toContain(piece.toLowerCase());
});
