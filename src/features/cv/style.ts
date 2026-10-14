/**
 * Settings of a CV (`Document.style`, SPECIFICATION-MODELES-CV.md § 5.3). Null or missing values
 * fall back on the template's defaults. A template only changes the layout: never the content.
 */
import { z } from "zod";
import { accentHex, cvFonts, type CvFontCode, RECOMMENDED_FONT } from "./render/palette";
import {
  cvBlockTypes,
  type CvBlockType,
  type CvDensity,
  type CvTemplate,
} from "./templates/registry";

export const cvDensities = ["airy", "standard", "compact"] as const satisfies readonly CvDensity[];
export const cvTitleLanguages = ["fr", "en"] as const;
export type CvTitleLanguage = (typeof cvTitleLanguages)[number];

/** Maximum number of pages (§ 4.7; `cv.pages.max`, editable later from the admin). */
export const MAX_PAGES = 3;
/** Above this, `career.cv.export.tooLong` is shown without blocking. */
export const PAGES_WARNING = 2;

const blockId = z.string().min(1).max(80);

export const cvStyleSchema = z.object({
  accent: z.string().refine((value) => accentHex(value) !== null),
  font: z.enum(cvFonts.map((font) => font.code) as [CvFontCode, ...CvFontCode[]]),
  density: z.enum(cvDensities),
  showPhoto: z.boolean(),
  titlesLanguage: z.enum(cvTitleLanguages),
  /** Block ids in their order, when the person changed the template's order. */
  sectionOrder: z.array(z.enum(cvBlockTypes)).max(20).optional(),
  /** Blocks moved to the secondary column, when the person changed it. */
  sideSections: z.array(z.enum(cvBlockTypes)).max(20).optional(),
  /** Ids of blocks or items preceded by a manual page break. */
  pageBreaks: z.array(blockId).max(30).optional(),
});

export type CvStyle = z.infer<typeof cvStyleSchema>;

/** What is stored: every field optional, unknown values dropped. */
const storedSchema = cvStyleSchema.partial();

export function defaultStyle(template: CvTemplate, language: CvTitleLanguage = "fr"): CvStyle {
  return {
    accent: template.accent,
    font: RECOMMENDED_FONT,
    density: template.density,
    showPhoto: false,
    titlesLanguage: language,
  };
}

/** Stored settings over the template's defaults; an invalid field takes the default. */
export function resolveStyle(stored: unknown, template: CvTemplate): CvStyle {
  const base = defaultStyle(template);
  if (!stored || typeof stored !== "object") return base;
  const result: CvStyle = { ...base };
  const entries = Object.entries(stored as Record<string, unknown>);
  for (const [key, value] of entries) {
    const field = storedSchema.shape[key as keyof CvStyle];
    if (!field) continue;
    const parsed = field.safeParse(value);
    if (parsed.success && parsed.data !== undefined) {
      (result as Record<string, unknown>)[key] = parsed.data;
    }
  }
  return result;
}

/**
 * Settings after a change of template (§ 4.6): the new template's colour and density are
 * proposed only when the person kept the previous template's ones; their order is kept only
 * when they changed it. Font, photo, language and page breaks stay.
 */
export function styleForTemplate(current: CvStyle, from: CvTemplate, to: CvTemplate): CvStyle {
  return {
    ...current,
    accent: current.accent === from.accent ? to.accent : current.accent,
    density: current.density === from.density ? to.density : current.density,
  };
}

/** Blocks in reading order and the column of each one, for a template and settings. */
export function blockLayout(
  template: CvTemplate,
  style: CvStyle,
  present: readonly CvBlockType[],
): { type: CvBlockType; zone: "main" | "side" }[] {
  const order = style.sectionOrder ?? template.order;
  const known = new Set<CvBlockType>(order);
  // Blocks the template does not plan go at the end of the main column (§ 2, point 2).
  const ordered = [...order, ...present.filter((type) => !known.has(type))].filter((type) =>
    present.includes(type),
  );
  const hasSide = template.layout !== "one";
  const side = new Set<CvBlockType>(style.sideSections ?? template.side);
  const placed = ordered.map((type) => ({
    type,
    zone: hasSide && side.has(type) ? ("side" as const) : ("main" as const),
  }));
  // Reading order = main column first, then the secondary one (§ 7).
  return [
    ...placed.filter((block) => block.zone === "main"),
    ...placed.filter((block) => block.zone === "side"),
  ];
}

/** Moves a block up or down in the order, starting from the template's order. */
export function moveBlock(
  template: CvTemplate,
  style: CvStyle,
  present: readonly CvBlockType[],
  type: CvBlockType,
  direction: -1 | 1,
): CvStyle {
  const order = blockLayout(template, style, present).map((block) => block.type);
  const index = order.indexOf(type);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= order.length) return style;
  [order[index], order[target]] = [order[target]!, order[index]!];
  return { ...style, sectionOrder: order };
}

/** Puts a block in the other column (templates with two columns). */
export function switchColumn(template: CvTemplate, style: CvStyle, type: CvBlockType): CvStyle {
  if (template.layout === "one") return style;
  const side = new Set<CvBlockType>(style.sideSections ?? template.side);
  if (side.has(type)) side.delete(type);
  else side.add(type);
  return { ...style, sideSections: [...side] };
}

/** Adds or removes a manual page break before a block or an item. */
export function togglePageBreak(style: CvStyle, id: string): CvStyle {
  const breaks = new Set(style.pageBreaks ?? []);
  if (breaks.has(id)) breaks.delete(id);
  else breaks.add(id);
  return { ...style, pageBreaks: [...breaks] };
}
