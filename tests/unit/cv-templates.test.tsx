// @vitest-environment node
import { strFromU8, unzipSync } from "fflate";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import messages from "@/../messages/fr.json";
import { cvExamples } from "@/features/cv/examples";
import { cvDocx } from "@/features/cv/export/docx";
import { documentFromCv, documentFromExample, type CvTextLabels } from "@/features/cv/render/build";
import { CvDocument } from "@/features/cv/render/CvDocument";
import { documentTexts } from "@/features/cv/render/model";
import {
  accentHex,
  brandColors,
  contrastOnWhite,
  cvColors,
  darkenToContrast,
  MIN_CONTRAST,
} from "@/features/cv/render/palette";
import {
  blockLayout,
  cvStyleSchema,
  defaultStyle,
  moveBlock,
  resolveStyle,
  styleForTemplate,
  togglePageBreak,
} from "@/features/cv/style";
import {
  cvTemplateRegistry,
  includesAccess,
  templateOf,
  type CvBlockType,
} from "@/features/cv/templates/registry";
import { emptyCv, parseCv, type CvContent } from "@/server/services/cv";

/** Labels of the printed CV, read from the generated texts (same as `cvTextLabels`). */
function labels(language: "fr" | "en"): CvTextLabels {
  const cv = messages.cv;
  return {
    language,
    titles: cv.titles[language] as Record<CvBlockType, string>,
    levels: cv.levels[language] as CvTextLabels["levels"],
    languageLevels: cv.languageLevels[language],
    present: cv.present[language],
    month: (value) => value,
    languageName: (code) => code.toUpperCase(),
    location: (city, country) => [city, country].filter(Boolean).join(", "),
  };
}

const content: CvContent = {
  ...emptyCv,
  info: {
    ...emptyCv.info,
    name: "Awa Fictive Kabila",
    headline: "Comptable",
    email: "awa@exemple.cd",
    city: "Goma",
    country: "RD Congo",
    showEmail: true,
  },
  summary: "Comptable rigoureuse.",
  experiences: [
    {
      title: "Assistante comptable",
      company: "Société Démo",
      location: "Goma",
      start: "2023-01",
      end: "",
      bullets: ["Rapprochements bancaires mensuels."],
    },
  ],
  skills: [{ name: "Excel", level: 3 }],
  languages: [{ code: "sw", level: "fluent", cefr: "C1" }],
};

describe("catalogue des modèles (docs/modeles-cv § 3)", () => {
  it("15 modèles : 5 gratuits, 5 dès Starter, 5 dès Pro", () => {
    expect(cvTemplateRegistry).toHaveLength(15);
    for (const access of ["free", "starter", "pro"] as const) {
      expect(cvTemplateRegistry.filter((item) => item.access === access)).toHaveLength(5);
    }
  });

  it("un niveau de droit donne accès aux modèles de son niveau et en dessous", () => {
    expect(includesAccess("none", "free")).toBe(true);
    expect(includesAccess("free", "starter")).toBe(false);
    expect(includesAccess("starter", "starter")).toBe(true);
    expect(includesAccess("starter", "pro")).toBe(false);
    expect(includesAccess("pro", "pro")).toBe(true);
    expect(includesAccess("pro", "free")).toBe(true);
  });

  it("les anciens identifiants restent lisibles", () => {
    expect(templateOf("classic").id).toBe("classique");
    expect(templateOf("modern").id).toBe("moderne");
    expect(templateOf("inconnu").id).toBe("classique");
  });
});

describe("couleurs d'accent (§ 4.1)", () => {
  it("16 couleurs, 8 recommandées pour les ATS, toutes lisibles sur blanc", () => {
    expect(cvColors).toHaveLength(16);
    expect(cvColors.filter((color) => color.ats)).toHaveLength(8);
    for (const color of cvColors)
      expect(contrastOnWhite(color.hex)).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  it("une couleur personnalisée sous 4,5:1 est refusée, une version plus foncée est proposée", () => {
    expect(accentHex("#FFD700")).toBeNull();
    expect(cvStyleSchema.shape.accent.safeParse("#FFD700").success).toBe(false);
    const darker = darkenToContrast("#FFD700");
    expect(contrastOnWhite(darker)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    expect(accentHex(darker)).toBe(darker);
    expect(accentHex("#1F4E79")).toBe("#1F4E79");
  });

  it("aucune couleur proposée n'est une couleur de Jumanly", () => {
    const hexes = cvColors.map((color) => color.hex.toUpperCase());
    for (const brand of brandColors) expect(hexes).not.toContain(brand);
  });
});

describe("réglages et changement de modèle (§ 4.6)", () => {
  const classique = templateOf("classique");
  const moderne = templateOf("moderne");

  it("un réglage invalide reprend la valeur du modèle", () => {
    const style = resolveStyle({ accent: "#FFFFFF", font: "comic", density: "compact" }, classique);
    expect(style.accent).toBe(classique.accent);
    expect(style.font).toBe("sora");
    expect(style.density).toBe("compact");
  });

  it("la couleur et la densité suivent le nouveau modèle seulement si elles n'ont pas été changées", () => {
    const kept = styleForTemplate(defaultStyle(classique), classique, moderne);
    expect(kept.accent).toBe(moderne.accent);
    const custom = { ...defaultStyle(classique), accent: "#1F4E79", font: "lora" as const };
    const changed = styleForTemplate(custom, classique, moderne);
    expect(changed.accent).toBe("#1F4E79");
    expect(changed.font).toBe("lora");
  });

  it("ordre de lecture : colonne principale puis colonne secondaire ; déplacer un bloc", () => {
    const present: CvBlockType[] = ["summary", "experience", "skills", "languages"];
    const layout = blockLayout(moderne, defaultStyle(moderne), present);
    const zones = layout.map((block) => block.zone);
    expect(zones.indexOf("side")).toBeGreaterThan(zones.lastIndexOf("main"));
    const moved = moveBlock(classique, defaultStyle(classique), present, "experience", -1);
    expect(blockLayout(classique, moved, present)[0]?.type).toBe("experience");
  });

  it("un saut de page s'ajoute puis se retire", () => {
    const style = togglePageBreak(defaultStyle(classique), "experience-0");
    expect(style.pageBreaks).toEqual(["experience-0"]);
    expect(togglePageBreak(style, "experience-0").pageBreaks).toEqual([]);
  });
});

describe("document du CV (§ 5 et § 7)", () => {
  it("les sections masquées ne sont pas imprimées ; les titres suivent la langue choisie", () => {
    const hidden = {
      ...content,
      sections: content.sections.map((section) =>
        section.id === "skills" ? { ...section, visible: false } : section,
      ),
    };
    const fr = documentFromCv(hidden, labels("fr"));
    expect(fr.blocks.map((block) => block.type)).toEqual(["summary", "experience", "languages"]);
    expect(fr.blocks[1]?.title).toBe("Expérience professionnelle");
    const en = documentFromCv(content, labels("en"));
    expect(en.blocks.find((block) => block.type === "experience")?.title).toBe(
      messages.cv.titles.en.experience,
    );
  });

  it("le téléphone facultatif n'apparaît que s'il est rempli ; un ancien CV sans téléphone reste lisible", () => {
    expect(documentFromCv(content, labels("fr")).contact.map((item) => item.value)).toEqual([
      "Goma, RD Congo",
      "awa@exemple.cd",
    ]);
    const withPhone = { ...content, info: { ...content.info, phone: "+243 900 000 000" } };
    expect(documentFromCv(withPhone, labels("fr")).contact.map((item) => item.value)).toContain(
      "+243 900 000 000",
    );
    const oldInfo: Partial<CvContent["info"]> = { ...content.info };
    delete oldInfo.phone;
    expect(parseCv({ ...content, info: oldInfo }).info.phone).toBe("");
  });

  it("chaque modèle gratuit imprime tous les champs, niveaux compris, sans marque Jumanly", () => {
    const data = documentFromExample(cvExamples.junior, labels("fr"));
    const texts = documentTexts(data);
    for (const template of cvTemplateRegistry.filter((item) => item.access === "free")) {
      const html = renderToStaticMarkup(
        <CvDocument data={data} template={template} style={defaultStyle(template)} />,
      );
      const visible = html
        .replace(/<[^>]+>/g, " ")
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, "&");
      for (const text of texts) expect(visible).toContain(text);
      expect(html).not.toMatch(/jumanly/i);
      for (const brand of brandColors) expect(html.toUpperCase()).not.toContain(brand);
    }
  });
});

describe("export Word (studio CV web)", () => {
  it("produit un .docx valide, sur une colonne, avec tout le texte et sans mention Jumanly", () => {
    const data = documentFromExample(cvExamples.junior, labels("fr"));
    const files = unzipSync(cvDocx(data));
    for (const path of [
      "[Content_Types].xml",
      "_rels/.rels",
      "word/document.xml",
      "word/styles.xml",
      "docProps/core.xml",
    ]) {
      expect(files[path], path).toBeDefined();
    }
    const xml = strFromU8(files["word/document.xml"]!);
    expect(xml).not.toMatch(/<w:cols w:num="[2-9]"/);
    const visible = xml
      .replace(/<[^>]+>/g, "")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    for (const text of documentTexts(data)) expect(visible).toContain(text);
    const all = Object.values(files)
      .map((file) => strFromU8(file))
      .join(" ");
    expect(all.toLowerCase()).not.toContain("jumanly");
  });

  it("échappe le texte saisi", () => {
    const data = documentFromExample(cvExamples.junior, labels("fr"));
    const xml = strFromU8(
      unzipSync(cvDocx({ ...data, firstName: "A & B", lastName: "<script>" }))[
        "word/document.xml"
      ]!,
    );
    expect(xml).toContain("A &amp; B &lt;script&gt;");
    expect(xml).not.toContain("<script>");
  });
});
