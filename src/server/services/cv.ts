/**
 * CV documents (Career, textes `career.cv.*`): structured content copied from the profile, edited by
 * section, laid out by one of the templates of src/features/cv. The templates a person can use
 * come from the entitlement `career.cv.templates.access` (docs/modeles-cv § 5.4): the code never
 * names a plan.
 */
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { level, type Subject } from "@/server/entitlements";
import { accentHex, isHexColor } from "@/features/cv/render/palette";
import { cvStyleSchema, resolveStyle, styleForTemplate, type CvStyle } from "@/features/cv/style";
import {
  findTemplate,
  includesAccess,
  templateOf,
  type CvTemplate,
} from "@/features/cv/templates/registry";
import { parseProfileLanguages, type FullProfile } from "./profile";

/** Hard ceiling on the number of CVs, against abuse; plans do not change it. */
export const MAX_CVS = 10;

export const TEMPLATES_ACCESS_KEY = "career.cv.templates.access";

/** Level of templates included in the person's plan (« free », « starter », « pro »). */
export async function templatesAccess(db: PrismaClient, subject: Subject) {
  return level(db, subject, TEMPLATES_ACCESS_KEY);
}

/** True when the plan of `subject` includes the template (checked on the server, § 2 point 6). */
export async function canUseTemplate(db: PrismaClient, subject: Subject, template: CvTemplate) {
  return includesAccess(await templatesAccess(db, subject), template.access);
}

export const cvSectionIds = ["summary", "experience", "education", "skills", "languages"] as const;
export type CvSectionId = (typeof cvSectionIds)[number];

const cvContentSchema = z.object({
  info: z.object({
    name: z.string(),
    headline: z.string(),
    email: z.string(),
    city: z.string(),
    country: z.string(),
    showEmail: z.boolean(),
    /** The talent's own number, on this CV only; empty means not shown (added 2026-10-14). */
    phone: z.string().default(""),
  }),
  summary: z.string(),
  experiences: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      location: z.string(),
      /** "2024-03" */
      start: z.string(),
      end: z.string().nullable(),
      bullets: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      school: z.string(),
      field: z.string(),
      startYear: z.number().nullable(),
      endYear: z.number().nullable(),
    }),
  ),
  skills: z.array(z.object({ name: z.string(), level: z.number() })),
  languages: z.array(
    z.object({ code: z.string(), level: z.string(), cefr: z.string().optional() }),
  ),
  sections: z.array(z.object({ id: z.enum(cvSectionIds), visible: z.boolean() })),
  /** « Réalisations » (Ephraïm, 29/10): one line each, printed as the template's key achievements. */
  achievements: z.array(z.string()).default([]),
  /** « Références » (Ephraïm, 29/10): people who can speak about the talent, printed last. */
  references: z
    .array(z.object({ name: z.string(), role: z.string(), contact: z.string() }))
    .default([]),
  /** The blocks added on 29/10 that the talent chose not to print. */
  hiddenExtras: z.array(z.enum(["achievements", "references"])).default([]),
});

/** What the form « Mes informations » sends back: the whole content, bounded. */
export const cvContentInputSchema = z.object({
  info: z.object({
    name: z.string().trim().max(120),
    headline: z.string().trim().max(160),
    email: z.string().trim().max(200),
    city: z.string().trim().max(120),
    country: z.string().trim().max(120),
    showEmail: z.boolean(),
    phone: z.string().trim().max(40),
  }),
  summary: z.string().trim().max(1500),
  experiences: z
    .array(
      z.object({
        title: z.string().trim().max(160),
        company: z.string().trim().max(160),
        location: z.string().trim().max(120),
        start: z.string().regex(/^(\d{4}-\d{2})?$/),
        end: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .nullable(),
        bullets: z.array(z.string().trim().max(400)).max(12),
      }),
    )
    .max(20),
  education: z
    .array(
      z.object({
        degree: z.string().trim().max(160),
        school: z.string().trim().max(160),
        field: z.string().trim().max(160),
        startYear: z.number().int().min(1950).max(2100).nullable(),
        endYear: z.number().int().min(1950).max(2100).nullable(),
      }),
    )
    .max(15),
  skills: z
    .array(
      z.object({ name: z.string().trim().min(1).max(80), level: z.number().int().min(1).max(4) }),
    )
    .max(40),
  languages: z
    .array(
      z.object({
        code: z.string().trim().min(1).max(40),
        level: z.string().max(20),
        cefr: z.string().max(4).optional(),
      }),
    )
    .max(12),
  sections: z.array(z.object({ id: z.enum(cvSectionIds), visible: z.boolean() })),
  achievements: z.array(z.string().trim().max(300)).max(12),
  references: z
    .array(
      z.object({
        name: z.string().trim().max(120),
        role: z.string().trim().max(160),
        contact: z.string().trim().max(160),
      }),
    )
    .max(6),
  hiddenExtras: z.array(z.enum(["achievements", "references"])),
});

export type CvContent = z.infer<typeof cvContentSchema>;

/** The parts of the phone editor, one at a time (prompt 6, screen 28). */
export const cvPhoneParts = [
  "info",
  "summary",
  "experience",
  "education",
  "skills",
  "languages",
] as const;
export type CvPhonePart = (typeof cvPhoneParts)[number];

export const emptyCv: CvContent = {
  info: { name: "", headline: "", email: "", city: "", country: "", showEmail: true, phone: "" },
  summary: "",
  experiences: [],
  education: [],
  skills: [],
  languages: [],
  sections: cvSectionIds.map((id) => ({ id, visible: true })),
  achievements: [],
  references: [],
  hiddenExtras: [],
};

export function parseCv(value: Prisma.JsonValue): CvContent {
  const parsed = cvContentSchema.safeParse(value);
  if (!parsed.success) return emptyCv;
  // Sections added later appear at the end, visible.
  const known = new Set(parsed.data.sections.map((section) => section.id));
  const sections = [
    ...parsed.data.sections,
    ...cvSectionIds.filter((id) => !known.has(id)).map((id) => ({ id, visible: true })),
  ];
  return { ...parsed.data, sections };
}

const month = (date: Date) => date.toISOString().slice(0, 7);

/**
 * Copies the profile into a CV. Section order and visibility of an existing CV are kept.
 * Never copied: photo, age, family situation, address (golden rule n° 4 applies to CVs too).
 */
export function cvFromProfile(profile: FullProfile, previous?: CvContent): CvContent {
  return {
    info: {
      name:
        [profile.user.firstName, profile.user.lastName].filter(Boolean).join(" ") ||
        profile.user.name,
      headline: profile.headline ?? "",
      email: profile.user.email,
      city: profile.user.city ?? "",
      country: profile.user.country ?? "",
      showEmail: previous?.info.showEmail ?? true,
      phone: previous?.info.phone ?? "",
    },
    summary: profile.summary ?? "",
    experiences: profile.experiences.map((experience) => ({
      title: experience.title,
      company: experience.company,
      location: experience.location ?? "",
      start: month(experience.startDate),
      end: experience.endDate ? month(experience.endDate) : null,
      bullets: experience.description
        .split("\n")
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean),
    })),
    education: profile.educations.map((education) => ({
      degree: education.degree,
      school: education.school,
      field: education.field ?? "",
      startYear: education.startYear,
      endYear: education.endYear,
    })),
    skills: profile.skills.map((entry) => ({ name: entry.skill.name, level: entry.level })),
    languages: parseProfileLanguages(profile.languages),
    sections: previous?.sections ?? emptyCv.sections,
    achievements: previous?.achievements ?? [],
    references: previous?.references ?? [],
    hiddenExtras: previous?.hiddenExtras ?? [],
  };
}

/** Moves a section up (-1) or down (+1). */
export function moveSection(content: CvContent, id: CvSectionId, direction: -1 | 1): CvContent {
  const sections = [...content.sections];
  const index = sections.findIndex((section) => section.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= sections.length) return content;
  [sections[index], sections[target]] = [sections[target]!, sections[index]!];
  return { ...content, sections };
}

export function toggleSection(content: CvContent, id: CvSectionId): CvContent {
  return {
    ...content,
    sections: content.sections.map((section) =>
      section.id === id ? { ...section, visible: !section.visible } : section,
    ),
  };
}

/** True when nothing would be printed but the name. */
export function isEmptyCv(content: CvContent) {
  return (
    !content.summary &&
    content.experiences.length === 0 &&
    content.education.length === 0 &&
    content.skills.length === 0
  );
}

// ─── Templates and settings (docs/modeles-cv) ─────────────────────────────────────────

export type ApplyTemplateResult = "applied" | "notFound" | "unknown" | "locked";

/**
 * Applies a template to a CV of `userId`: only `templateId` and the settings change, never the
 * content (§ 2 point 2). A template above the person's plan is refused here, on the server.
 */
export async function applyTemplate(
  db: PrismaClient,
  userId: string,
  documentId: string,
  templateId: string,
): Promise<ApplyTemplateResult> {
  const document = await db.document.findFirst({
    where: { id: documentId, kind: "cv", profile: { userId } },
    select: { id: true, templateId: true, style: true },
  });
  if (!document) return "notFound";
  const target = findTemplate(templateId);
  if (!target) return "unknown";
  if (!(await canUseTemplate(db, { type: "user", id: userId }, target))) return "locked";
  const from = templateOf(document.templateId);
  const style = styleForTemplate(resolveStyle(document.style, from), from, target);
  await db.document.update({
    where: { id: document.id },
    data: { templateId: target.id, style },
  });
  return "applied";
}

export type StyleChangeResult = "saved" | "notFound" | "invalid" | "tooLight";

/** Saves one or more settings of a CV; a custom colour under 4.5:1 is refused (§ 4.1). */
export async function updateCvStyle(
  db: PrismaClient,
  userId: string,
  documentId: string,
  change: (current: CvStyle, template: CvTemplate) => CvStyle,
): Promise<StyleChangeResult> {
  const document = await db.document.findFirst({
    where: { id: documentId, kind: "cv", profile: { userId } },
    select: { id: true, templateId: true, style: true },
  });
  if (!document) return "notFound";
  const template = templateOf(document.templateId);
  const next = change(resolveStyle(document.style, template), template);
  if (isHexColor(next.accent) && accentHex(next.accent) === null) return "tooLight";
  const parsed = cvStyleSchema.safeParse(next);
  if (!parsed.success) return "invalid";
  await db.document.update({ where: { id: document.id }, data: { style: parsed.data } });
  return "saved";
}
