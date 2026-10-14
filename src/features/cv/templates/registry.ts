/**
 * The 15 CV templates (docs/modeles-cv/SPECIFICATION-MODELES-CV.md § 3, values of
 * docs/modeles-cv/modeles/catalogue.json). The catalogue lives in the code, versioned with the
 * application; names and descriptions are texts (`cv.templates.<id>.*`). The access level of a
 * template is compared with the entitlement `career.cv.templates.access`: no plan name here.
 */

export const cvAccessLevels = ["free", "starter", "pro"] as const;
export type CvAccessLevel = (typeof cvAccessLevels)[number];

/** Blocks of a CV. Their markup names (French, those of the reference CSS) are in `blockMarkup`. */
export const cvBlockTypes = [
  "summary",
  "highlights",
  "experience",
  "education",
  "skills",
  "languages",
  "certificates",
  "projects",
  "volunteer",
  "interests",
  "publications",
  "talks",
  "teaching",
  "custom",
] as const;
export type CvBlockType = (typeof cvBlockTypes)[number];

/** Class and data-type names used by the reference stylesheets (`sec-<name>`). */
export const blockMarkup: Record<CvBlockType, string> = {
  summary: "profil",
  highlights: "points_forts",
  experience: "experience",
  education: "formation",
  skills: "competences",
  languages: "langues",
  certificates: "certificats",
  projects: "projets",
  volunteer: "engagement",
  interests: "interets",
  publications: "publications",
  talks: "communications",
  teaching: "enseignement",
  custom: "perso",
};

export type CvHeaderBlock = "identity" | "contact" | "photo";
export type SkillsPresentation =
  "line" | "levelList" | "chips" | "grid" | "bars" | "dots" | "groups";
export type LanguagesPresentation = "line" | "levelList" | "list" | "dots";
export type InterestsPresentation = "line" | "chips" | "list";
export type CvDensity = "airy" | "standard" | "compact";
/** Markup names of the densities (`d-<name>` in cv-base.css). */
export const densityMarkup: Record<CvDensity, string> = {
  airy: "aeree",
  standard: "standard",
  compact: "compacte",
};

export type CvTemplate = {
  id: string;
  access: CvAccessLevel;
  /** one = one column, two = secondary column on the right, side = side bar on the left. */
  layout: "one" | "two" | "side";
  /** An optional photo slot. */
  photo: boolean;
  /** Default accent colour (palette code). */
  accent: string;
  density: CvDensity;
  ats: "excellent" | "veryGood" | "good";
  /** Advised number of pages (min, max). */
  pages: readonly [number, number];
  /** Default order of the blocks. */
  order: CvBlockType[];
  /** Blocks placed in the secondary column by default. */
  side: CvBlockType[];
  header: CvHeaderBlock[];
  sideHeader: CvHeaderBlock[];
  skills: SkillsPresentation;
  languages: LanguagesPresentation;
  interests: InterestsPresentation;
};

export const cvTemplateRegistry = [
  {
    id: "classique",
    access: "free",
    layout: "one",
    photo: false,
    accent: "encre",
    density: "standard",
    ats: "excellent",
    pages: [1, 2],
    order: [
      "summary",
      "experience",
      "education",
      "skills",
      "languages",
      "certificates",
      "projects",
      "volunteer",
      "interests",
    ],
    side: [],
    header: ["identity", "contact"],
    sideHeader: [],
    skills: "line",
    languages: "line",
    interests: "line",
  },
  {
    id: "epure",
    access: "free",
    layout: "one",
    photo: true,
    accent: "graphite",
    density: "standard",
    ats: "excellent",
    pages: [1, 2],
    order: [
      "summary",
      "experience",
      "education",
      "skills",
      "languages",
      "projects",
      "certificates",
      "volunteer",
      "interests",
    ],
    side: [],
    header: ["identity", "contact", "photo"],
    sideHeader: [],
    skills: "levelList",
    languages: "line",
    interests: "line",
  },
  {
    id: "premier-emploi",
    access: "free",
    layout: "one",
    photo: true,
    accent: "petrole",
    density: "standard",
    ats: "excellent",
    pages: [1, 1],
    order: [
      "summary",
      "education",
      "projects",
      "experience",
      "skills",
      "languages",
      "certificates",
      "volunteer",
      "interests",
    ],
    side: [],
    header: ["photo", "identity", "contact"],
    sideHeader: [],
    skills: "chips",
    languages: "line",
    interests: "line",
  },
  {
    id: "moderne",
    access: "free",
    layout: "two",
    photo: true,
    accent: "bleu",
    density: "standard",
    ats: "veryGood",
    pages: [1, 2],
    order: [
      "summary",
      "experience",
      "education",
      "projects",
      "volunteer",
      "skills",
      "languages",
      "certificates",
      "interests",
    ],
    side: ["skills", "languages", "certificates", "interests"],
    header: ["photo", "identity", "contact"],
    sideHeader: [],
    skills: "levelList",
    languages: "levelList",
    interests: "chips",
  },
  {
    id: "colonne",
    access: "free",
    layout: "side",
    photo: true,
    accent: "foret",
    density: "standard",
    ats: "veryGood",
    pages: [1, 2],
    order: [
      "summary",
      "experience",
      "education",
      "projects",
      "certificates",
      "volunteer",
      "skills",
      "languages",
      "interests",
    ],
    side: ["skills", "languages", "interests"],
    header: ["identity"],
    sideHeader: ["photo", "contact"],
    skills: "levelList",
    languages: "levelList",
    interests: "list",
  },
  {
    id: "executif",
    access: "starter",
    layout: "one",
    photo: false,
    accent: "bordeaux",
    density: "standard",
    ats: "excellent",
    pages: [2, 2],
    order: [
      "summary",
      "highlights",
      "experience",
      "education",
      "skills",
      "languages",
      "certificates",
      "volunteer",
      "interests",
    ],
    side: [],
    header: ["identity", "contact"],
    sideHeader: [],
    skills: "grid",
    languages: "line",
    interests: "line",
  },
  {
    id: "bandeau",
    access: "starter",
    layout: "two",
    photo: true,
    accent: "marine",
    density: "standard",
    ats: "veryGood",
    pages: [1, 2],
    order: [
      "summary",
      "experience",
      "education",
      "projects",
      "volunteer",
      "skills",
      "languages",
      "certificates",
      "interests",
    ],
    side: ["skills", "languages", "certificates", "interests"],
    header: ["photo", "identity", "contact"],
    sideHeader: [],
    skills: "levelList",
    languages: "levelList",
    interests: "chips",
  },
  {
    id: "contraste",
    access: "starter",
    layout: "side",
    photo: true,
    accent: "petrole",
    density: "standard",
    ats: "good",
    pages: [1, 2],
    order: [
      "summary",
      "experience",
      "education",
      "projects",
      "certificates",
      "volunteer",
      "skills",
      "languages",
      "interests",
    ],
    side: ["skills", "languages", "interests"],
    header: ["identity"],
    sideHeader: ["photo", "contact"],
    skills: "dots",
    languages: "dots",
    interests: "list",
  },
  {
    id: "parcours",
    access: "starter",
    layout: "one",
    photo: true,
    accent: "turquoise",
    density: "standard",
    ats: "veryGood",
    pages: [1, 2],
    order: [
      "summary",
      "experience",
      "education",
      "projects",
      "volunteer",
      "skills",
      "languages",
      "certificates",
      "interests",
    ],
    side: [],
    header: ["identity", "contact", "photo"],
    sideHeader: [],
    skills: "chips",
    languages: "line",
    interests: "line",
  },
  {
    id: "compact",
    access: "starter",
    layout: "one",
    photo: false,
    accent: "encre",
    density: "compact",
    ats: "excellent",
    pages: [1, 1],
    order: [
      "summary",
      "experience",
      "education",
      "skills",
      "languages",
      "certificates",
      "projects",
      "volunteer",
      "interests",
    ],
    side: [],
    header: ["identity", "contact"],
    sideHeader: [],
    skills: "grid",
    languages: "line",
    interests: "line",
  },
  {
    id: "academique",
    access: "pro",
    layout: "one",
    photo: false,
    accent: "marine",
    density: "standard",
    ats: "excellent",
    pages: [2, 3],
    order: [
      "summary",
      "education",
      "experience",
      "publications",
      "talks",
      "projects",
      "teaching",
      "skills",
      "languages",
      "volunteer",
    ],
    side: [],
    header: ["identity", "contact"],
    sideHeader: [],
    skills: "line",
    languages: "line",
    interests: "line",
  },
  {
    id: "creatif",
    access: "pro",
    layout: "two",
    photo: true,
    accent: "brique",
    density: "standard",
    ats: "good",
    pages: [1, 2],
    order: [
      "summary",
      "experience",
      "projects",
      "education",
      "volunteer",
      "skills",
      "languages",
      "certificates",
      "interests",
    ],
    side: ["skills", "languages", "certificates", "interests"],
    header: ["photo", "identity", "contact"],
    sideHeader: [],
    skills: "chips",
    languages: "dots",
    interests: "chips",
  },
  {
    id: "tech",
    access: "pro",
    layout: "one",
    photo: false,
    accent: "violet",
    density: "standard",
    ats: "veryGood",
    pages: [1, 2],
    order: [
      "summary",
      "skills",
      "projects",
      "experience",
      "education",
      "certificates",
      "languages",
      "volunteer",
      "interests",
    ],
    side: [],
    header: ["identity", "contact"],
    sideHeader: [],
    skills: "groups",
    languages: "line",
    interests: "line",
  },
  {
    id: "elegant",
    access: "pro",
    layout: "one",
    photo: true,
    accent: "prune",
    density: "standard",
    ats: "veryGood",
    pages: [1, 2],
    order: [
      "summary",
      "experience",
      "education",
      "skills",
      "languages",
      "certificates",
      "projects",
      "volunteer",
      "interests",
    ],
    side: [],
    header: ["photo", "identity", "contact"],
    sideHeader: [],
    skills: "grid",
    languages: "line",
    interests: "line",
  },
  {
    id: "visuel",
    access: "pro",
    layout: "side",
    photo: true,
    accent: "framboise",
    density: "standard",
    ats: "good",
    pages: [1, 2],
    order: [
      "summary",
      "experience",
      "education",
      "projects",
      "certificates",
      "volunteer",
      "skills",
      "languages",
      "interests",
    ],
    side: ["skills", "languages", "interests"],
    header: ["identity"],
    sideHeader: ["photo", "contact"],
    skills: "bars",
    languages: "dots",
    interests: "chips",
  },
] as const satisfies readonly CvTemplate[];

export type CvTemplateId = (typeof cvTemplateRegistry)[number]["id"];

export const DEFAULT_TEMPLATE_ID: CvTemplateId = "classique";

/** Ids of the templates before the catalogue of October 2026. */
const legacyIds: Record<string, CvTemplateId> = {
  classic: "classique",
  modern: "moderne",
  compact: "compact",
};

export function findTemplate(id: string | null | undefined): CvTemplate | null {
  const known = legacyIds[id ?? ""] ?? id;
  return cvTemplateRegistry.find((template) => template.id === known) ?? null;
}

/** The template of a CV, the default one when the id is unknown. */
export function templateOf(id: string | null | undefined): CvTemplate {
  return findTemplate(id) ?? cvTemplateRegistry[0];
}

/** True when a template of level `required` is included in the level `granted` of a plan. */
export function includesAccess(granted: string, required: CvAccessLevel): boolean {
  // The free templates are for everyone, Free included (§ 3.1).
  if (required === "free") return true;
  const have = cvAccessLevels.indexOf(granted as CvAccessLevel);
  return have >= 0 && have >= cvAccessLevels.indexOf(required);
}
