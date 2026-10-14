/**
 * What a CV prints, ready to render: every text is already written in the language of the titles
 * (SPECIFICATION-MODELES-CV.md § 5.2). The same data feeds the preview and the PDF export.
 */
import type { CvBlockType } from "../templates/registry";

export type CvDocumentItem = {
  /** Stable id, used by manual page breaks. */
  id: string;
  title: string;
  /** « Organisation · Lieu ». */
  subtitle?: string;
  /** « 2024 – aujourd'hui ». */
  period?: string;
  text?: string;
  bullets?: string[];
  tools?: string;
};

export type CvDocumentSkill = {
  name: string;
  level: 1 | 2 | 3 | 4;
  levelLabel: string;
  group?: string;
};
export type CvDocumentLanguage = { name: string; levelLabel: string; dots: 1 | 2 | 3 | 4 };

export type CvDocumentBlock =
  | { id: string; type: "summary"; title: string; text: string }
  | { id: string; type: "highlights"; title: string; bullets: string[] }
  | { id: string; type: "skills"; title: string; skills: CvDocumentSkill[] }
  | { id: string; type: "languages"; title: string; languages: CvDocumentLanguage[] }
  | { id: string; type: "interests"; title: string; names: string[] }
  | { id: string; type: "publications" | "talks"; title: string; references: CvDocumentItem[] }
  | {
      id: string;
      type: Exclude<
        CvBlockType,
        "summary" | "highlights" | "skills" | "languages" | "interests" | "publications" | "talks"
      >;
      title: string;
      items: CvDocumentItem[];
    };

export type CvDocumentData = {
  /** Language of the titles (`lang` attribute of the document). */
  language: "fr" | "en";
  firstName: string;
  lastName: string;
  headline: string;
  /** Contact lines in order: city, e-mail, then labelled links. */
  contact: { label?: string; value: string }[];
  photoUrl?: string;
  blocks: CvDocumentBlock[];
};

/** Block types present in a CV, for the order and column settings. */
export function presentBlocks(data: CvDocumentData): CvBlockType[] {
  return data.blocks.map((block) => block.type);
}

/** Every text of a CV, in reading order (tests: the PDF text keeps them all). */
export function documentTexts(data: CvDocumentData): string[] {
  const texts = [
    data.firstName,
    data.lastName,
    data.headline,
    ...data.contact.map((line) => line.value),
  ];
  for (const block of data.blocks) {
    texts.push(block.title);
    switch (block.type) {
      case "summary":
        texts.push(block.text);
        break;
      case "highlights":
        texts.push(...block.bullets);
        break;
      case "skills":
        texts.push(...block.skills.flatMap((skill) => [skill.name, skill.levelLabel]));
        break;
      case "languages":
        texts.push(...block.languages.flatMap((language) => [language.name, language.levelLabel]));
        break;
      case "interests":
        texts.push(...block.names);
        break;
      case "publications":
      case "talks":
        texts.push(...block.references.map((item) => item.title));
        break;
      default:
        for (const item of block.items) {
          texts.push(
            item.title,
            item.subtitle ?? "",
            item.period ?? "",
            item.text ?? "",
            item.tools ?? "",
          );
          texts.push(...(item.bullets ?? []));
        }
    }
  }
  return texts.filter(Boolean);
}
