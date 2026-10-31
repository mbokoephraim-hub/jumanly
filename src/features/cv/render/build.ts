/**
 * From a stored CV (`Document.content`, src/server/services/cv.ts) or a demonstration CV
 * (docs/modeles-cv/modeles/donnees) to what the templates print. Pure functions: the texts arrive
 * in `labels`, already in the language of the titles (§ 4.5: only titles and levels change, the
 * person's text is never translated).
 */
import type { CvContent } from "@/server/services/cv";
import type { CvBlockType } from "../templates/registry";
import type { CvDocumentBlock, CvDocumentData, CvDocumentItem } from "./model";

export type CvLanguageLevel = "native" | "fluent" | "professional" | "intermediate" | "basic";

export type CvTextLabels = {
  language: "fr" | "en";
  titles: Record<CvBlockType, string>;
  /** « Références », printed as the last block (Ephraïm, 29/10). */
  references: string;
  /** Skill levels 1 to 4 (same scale as ProfileSkill). */
  levels: Record<1 | 2 | 3 | 4, string>;
  languageLevels: Record<CvLanguageLevel, string>;
  /** « aujourd'hui ». */
  present: string;
  /** "2024-03" → « mars 2024 ». */
  month: (value: string) => string;
  /** "fr" → « Français ». */
  languageName: (code: string) => string;
  /** City and country on one line. */
  location: (city: string, country: string) => string;
};

const dotsOf: Record<CvLanguageLevel, 1 | 2 | 3 | 4> = {
  native: 4,
  fluent: 4,
  professional: 3,
  intermediate: 2,
  basic: 1,
};

export function period(start: string | undefined, end: string | undefined) {
  if (start && end && start !== end) return `${start} – ${end}`;
  return end || start || undefined;
}

function level(value: number): 1 | 2 | 3 | 4 {
  return Math.min(4, Math.max(1, Math.round(value))) as 1 | 2 | 3 | 4;
}

/** Splits « Grâce Mbuyi » into first name and last name (the first word is the first name). */
export function splitName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: words[0] ?? "", lastName: words.slice(1).join(" ") };
}

/** « https://www.behance.net/awa/ » is printed « behance.net/awa ». */
export function shortLink(url: string) {
  return url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}

/** A stored CV, as printed. Hidden sections are left out. */
export function documentFromCv(
  content: CvContent,
  labels: CvTextLabels,
  photoUrl?: string | null,
): CvDocumentData {
  const visible = new Set(
    content.sections.filter((section) => section.visible).map((section) => section.id),
  );
  const blocks: CvDocumentBlock[] = [];
  const titles = labels.titles;
  if (visible.has("summary") && content.summary.trim()) {
    blocks.push({
      id: "summary",
      type: "summary",
      title: titles.summary,
      text: content.summary.trim(),
    });
  }
  const achievements = content.achievements.map((line) => line.trim()).filter(Boolean);
  if (!content.hiddenExtras.includes("achievements") && achievements.length > 0) {
    blocks.push({
      id: "highlights",
      type: "highlights",
      title: titles.highlights,
      bullets: achievements,
    });
  }
  if (visible.has("experience") && content.experiences.length > 0) {
    blocks.push({
      id: "experience",
      type: "experience",
      title: titles.experience,
      items: content.experiences.map((experience, index) => ({
        id: `experience-${index}`,
        title: experience.title,
        subtitle: join([experience.company, experience.location]),
        period: period(
          experience.start ? labels.month(experience.start) : undefined,
          experience.end ? labels.month(experience.end) : labels.present,
        ),
        // Réalisations left empty in the form are not printed.
        bullets: filled(experience.bullets),
      })),
    });
  }
  if (visible.has("education") && content.education.length > 0) {
    blocks.push({
      id: "education",
      type: "education",
      title: titles.education,
      items: content.education.map((education, index) => ({
        id: `education-${index}`,
        title: education.degree,
        subtitle: join([education.school, education.field]),
        period: period(
          education.startYear ? String(education.startYear) : undefined,
          education.endYear
            ? String(education.endYear)
            : education.startYear
              ? labels.present
              : undefined,
        ),
      })),
    });
  }
  if (visible.has("skills") && content.skills.length > 0) {
    blocks.push({
      id: "skills",
      type: "skills",
      title: titles.skills,
      skills: content.skills.map((skill) => {
        const value = level(skill.level);
        return { name: skill.name, level: value, levelLabel: labels.levels[value] };
      }),
    });
  }
  if (visible.has("languages") && content.languages.length > 0) {
    blocks.push({
      id: "languages",
      type: "languages",
      title: titles.languages,
      languages: content.languages.map((language) => {
        const code = language.level as CvLanguageLevel;
        const text = labels.languageLevels[code] ?? language.level;
        return {
          name: labels.languageName(language.code),
          levelLabel: language.cefr ? `${language.cefr}, ${text.toLowerCase()}` : text,
          dots: dotsOf[code] ?? 2,
        };
      }),
    });
  }
  const references = content.references.filter((item) => item.name.trim());
  if (!content.hiddenExtras.includes("references") && references.length > 0) {
    // Printed as a block of items (« custom »): every template already lays them out.
    blocks.push({
      id: "references",
      type: "custom",
      title: labels.references,
      items: references.map((item, index) => ({
        id: `references-${index}`,
        title: item.name.trim(),
        subtitle: item.role.trim() || undefined,
        text: item.contact.trim() || undefined,
      })),
    });
  }
  const { firstName, lastName } = splitName(content.info.name);
  const place = labels.location(content.info.city, content.info.country);
  return {
    language: labels.language,
    firstName,
    lastName,
    headline: content.info.headline,
    contact: [
      ...(place ? [{ value: place }] : []),
      ...(content.info.showEmail && content.info.email ? [{ value: content.info.email }] : []),
      ...(content.info.phone ? [{ value: content.info.phone }] : []),
      // Portfolio and networks (Ephraïm, 31/10): the address, short, with the contacts.
      ...(content.hiddenExtras.includes("links")
        ? []
        : content.links
            .filter((link) => link.url.trim())
            .map((link) => ({ value: shortLink(link.url) }))),
    ],
    photoUrl: photoUrl ?? undefined,
    blocks,
  };
}

function join(parts: (string | null | undefined)[]) {
  const text = parts.filter(Boolean).join(" · ");
  return text || undefined;
}

// ─── Demonstration CVs (docs/modeles-cv/modeles/donnees/exemple-*.json) ───────────────

type ExampleItem = {
  titre?: string;
  nom?: string;
  organisation?: string;
  lieu?: string;
  debut?: string;
  fin?: string;
  texte?: string;
  puces?: string[];
  outils?: string;
  niveau?: number | string;
  groupe?: string;
  note?: number;
};

export type ExampleCv = {
  info: {
    prenom: string;
    nom: string;
    titre: string;
    ville: string;
    email: string;
    liens: { libelle: string; url: string }[];
    photo?: boolean;
  };
  profil: string;
  points_forts?: string[];
  sections: { type: string; titre_perso?: string; items: ExampleItem[] }[];
};

const exampleTypes: Record<string, CvBlockType> = {
  experience: "experience",
  formation: "education",
  competences: "skills",
  langues: "languages",
  certificats: "certificates",
  projets: "projects",
  engagement: "volunteer",
  interets: "interests",
  publications: "publications",
  communications: "talks",
  enseignement: "teaching",
};

/** Neutral silhouette of the demonstration CVs (same picture as the reference PDFs). */
export const EXAMPLE_PHOTO =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23CDD2D8'/><circle cx='50' cy='40' r='18' fill='%23EEF0F2'/><path d='M14 100c3-22 18-33 36-33s33 11 36 33z' fill='%23EEF0F2'/></svg>";

export function documentFromExample(example: ExampleCv, labels: CvTextLabels): CvDocumentData {
  const titles = labels.titles;
  const blocks: CvDocumentBlock[] = [];
  if (example.profil)
    blocks.push({ id: "summary", type: "summary", title: titles.summary, text: example.profil });
  if (example.points_forts?.length) {
    blocks.push({
      id: "highlights",
      type: "highlights",
      title: titles.highlights,
      bullets: example.points_forts,
    });
  }
  for (const section of example.sections) {
    const type = exampleTypes[section.type] ?? "custom";
    const title = section.titre_perso || titles[type];
    const items = section.items;
    const id = type;
    if (type === "skills") {
      blocks.push({
        id,
        type,
        title,
        skills: items.map((item) => {
          const value = level(Number(item.niveau ?? 2));
          return {
            name: item.nom ?? "",
            level: value,
            levelLabel: labels.levels[value],
            group: item.groupe,
          };
        }),
      });
    } else if (type === "languages") {
      blocks.push({
        id,
        type,
        title,
        languages: items.map((item) => ({
          name: item.nom ?? "",
          levelLabel: String(item.niveau ?? ""),
          dots: item.note === 5 ? 4 : level(item.note ?? 3),
        })),
      });
    } else if (type === "interests") {
      blocks.push({ id, type, title, names: items.map((item) => item.nom ?? "") });
    } else if (type === "publications" || type === "talks") {
      blocks.push({
        id,
        type,
        title,
        references: items.map((item, index) => ({ id: `${id}-${index}`, title: item.titre ?? "" })),
      });
    } else {
      blocks.push({
        id,
        type: type as Extract<CvDocumentBlock, { items: CvDocumentItem[] }>["type"],
        title,
        items: items.map((item, index): CvDocumentItem => ({
          id: `${id}-${index}`,
          title: item.titre ?? "",
          subtitle: join([item.organisation, item.lieu]),
          period: type === "certificates" ? item.fin : period(item.debut, item.fin),
          text: item.texte,
          tools: item.outils,
          bullets: item.puces,
        })),
      });
    }
  }
  const info = example.info;
  return {
    language: labels.language,
    firstName: info.prenom,
    lastName: info.nom,
    headline: info.titre,
    contact: [
      { value: info.ville },
      { value: info.email },
      ...info.liens.map((link) => ({ label: link.libelle, value: link.url })),
    ],
    photoUrl: info.photo ? EXAMPLE_PHOTO : undefined,
    blocks,
  };
}

/** The points that hold text, or nothing when none does. */
function filled(points: string[]) {
  const kept = points.map((point) => point.trim()).filter(Boolean);
  return kept.length > 0 ? kept : undefined;
}
