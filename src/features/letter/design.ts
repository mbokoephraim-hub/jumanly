/**
 * The six visual templates of a cover letter (Ephraïm, 31/10/2026): a white A4 page under a
 * coloured horizontal band that holds the photo (round or square, or none), the name, the
 * professional title and the contact details, then the title « Lettre de motivation » and the
 * text. The same description drives the screen (LetterSheet, sizes in % of the page width) and the
 * PDF (src/server/pdf/letter-document.tsx, sizes in points).
 *
 * Access: the first template is open to everyone; the others follow the entitlement
 * `career.cv.templates.access` (level « starter » and up), like the CV templates. No plan name here.
 */
import { z } from "zod";
import type { CvAccessLevel } from "@/features/cv/templates/registry";

export const letterTemplates = [
  { id: "horizon", access: "free" },
  { id: "centre", access: "starter" },
  { id: "carte", access: "starter" },
  { id: "ruban", access: "starter" },
  { id: "duo", access: "starter" },
  { id: "signature", access: "starter" },
] as const satisfies readonly { id: string; access: CvAccessLevel }[];

export type LetterTemplateId = (typeof letterTemplates)[number]["id"];
export const letterTemplateIds = letterTemplates.map((template) => template.id) as [
  LetterTemplateId,
  ...LetterTemplateId[],
];

/** Dark enough for white text (contrast ≥ 4.5:1, WCAG AA). */
export const letterColors = [
  { code: "sapin", hex: "#0F3F37" },
  { code: "marine", hex: "#1B365D" },
  { code: "bleu", hex: "#1D5FBF" },
  { code: "petrole", hex: "#0B4F5C" },
  { code: "foret", hex: "#24503A" },
  { code: "bordeaux", hex: "#6B1E2E" },
  { code: "prune", hex: "#4A2545" },
  { code: "violet", hex: "#6D3FB3" },
  { code: "encre", hex: "#1F2933" },
] as const;
export type LetterColorCode = (typeof letterColors)[number]["code"];
const colorCodes = letterColors.map((color) => color.code) as [
  LetterColorCode,
  ...LetterColorCode[],
];

export const letterPhotos = ["rond", "carre", "aucune"] as const;
export type LetterPhoto = (typeof letterPhotos)[number];

export const letterDesignSchema = z.object({
  template: z.enum(letterTemplateIds).default("horizon"),
  color: z.enum(colorCodes).default("marine"),
  photo: z.enum(letterPhotos).default("rond"),
  /** Set by « Valider le modèle »: a letter without it has never been laid out. */
  chosen: z.boolean().default(false),
});
export type LetterDesign = z.infer<typeof letterDesignSchema>;

export const DEFAULT_DESIGN: LetterDesign = letterDesignSchema.parse({});

/** The design kept in `Document.style` of a letter, or the defaults. */
export function parseLetterDesign(value: unknown): LetterDesign {
  const parsed = letterDesignSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : DEFAULT_DESIGN;
}

export function letterTemplateOf(id: string) {
  return letterTemplates.find((template) => template.id === id) ?? letterTemplates[0];
}

export function colorHex(code: string) {
  return (letterColors.find((color) => color.code === code) ?? letterColors[0]).hex;
}

/** The colour mixed with white (`amount` of white, 0 to 1): the light tints of the band. */
export function tint(hex: string, amount: number) {
  const mix = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16);
    return Math.round(value + (255 - value) * amount)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${mix.join("")}`;
}

/** What the band and the head of the letter show, already worded. */
export type LetterSheetData = {
  name: string;
  headline: string;
  /** E-mail, then « Ville, Pays ». */
  contacts: string[];
  /** Address of the photo on the screen; null without a photo. */
  photoUrl: string | null;
  initials: string;
  /** « Lettre de motivation ». */
  heading: string;
  /** « Kinshasa, le 31 octobre 2026 », or « Le 31 octobre 2026 » without a city. */
  date: string;
  /** « À l’attention de … » and the offer, framed, when the letter is for an offer. */
  recipient: { to: string; detail: string } | null;
  /** « Objet : », then « candidature au poste de … ». */
  subjectLabel: string;
  subject: string | null;
  text: string;
};

export function paragraphsOf(text: string) {
  // A textarea sends « \r\n »: without this, the whole letter was one paragraph.
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** « Sublime » and « KOYI SALEY »: the band shows the family name in the light colour. */
export function nameParts(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? { first: parts[0]!, last: parts.slice(1).join(" ") }
    : { first: name.trim(), last: "" };
}

export function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "·"
  );
}

/**
 * How each template places its parts, shared by the screen and the PDF so both look the same.
 * `photo`: where the photo sits; `coord`: contacts inside the band, or on a strip under it
 * (white or light tint); `inset`: the band is a rounded card inside the margins; `rule`: a
 * coloured line along the text; `heading`: how « Lettre de motivation » is set.
 */
export type LetterLayout = {
  photo: "left" | "right" | "top";
  coord: "inside" | "column" | "strip-white" | "strip-tint";
  inset: boolean;
  center: boolean;
  rule: boolean;
  heading: "plain" | "underline" | "pill";
  /** Photo size, in % of the page width. */
  photoSize: number;
};

export const letterLayouts: Record<LetterTemplateId, LetterLayout> = {
  horizon: {
    photo: "left",
    coord: "inside",
    inset: false,
    center: false,
    rule: false,
    heading: "plain",
    photoSize: 17,
  },
  centre: {
    photo: "top",
    coord: "inside",
    inset: false,
    center: true,
    rule: false,
    heading: "plain",
    photoSize: 15,
  },
  carte: {
    photo: "right",
    coord: "column",
    inset: true,
    center: false,
    rule: false,
    heading: "underline",
    photoSize: 16,
  },
  ruban: {
    photo: "right",
    coord: "strip-white",
    inset: false,
    center: false,
    rule: false,
    heading: "plain",
    photoSize: 16,
  },
  duo: {
    photo: "left",
    coord: "strip-tint",
    inset: false,
    center: false,
    rule: false,
    heading: "underline",
    photoSize: 16,
  },
  signature: {
    photo: "right",
    coord: "inside",
    inset: false,
    center: false,
    rule: true,
    heading: "pill",
    photoSize: 17,
  },
};

/** Sizes in % of the page width (1 u = 5.953 pt on A4). */
export const U = {
  padX: 9,
  bandY: 6.5,
  inset: 5,
  radius: 2.4,
  name: 4.3,
  headline: 2,
  coord: 1.65,
  body: 1.74,
  gap: 1.4,
  heading: 2.1,
  date: 1.6,
} as const;
export const PT_PER_U = 5.953;
