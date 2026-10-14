/**
 * CV documents (Career, textes `career.cv.*`): structured content copied from the profile, edited by
 * section, rendered by a template. The number of templates a person can use comes from the
 * entitlement `career.cv.templates.max` (partie 05): the code never names a plan.
 */
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { parseProfileLanguages, type FullProfile } from "./profile";

/** Hard ceiling on the number of CVs, against abuse; plans do not change it. */
export const MAX_CVS = 10;

/** Templates in the order they are granted: the first `career.cv.templates.max` are usable. */
export const cvTemplates = [
  { id: "classic", accent: "#0E3B33" },
  { id: "modern", accent: "#1F7A4D" },
  { id: "compact", accent: "#37474F" },
] as const;

export type CvTemplateId = (typeof cvTemplates)[number]["id"];

/** Templates allowed by a `career.cv.templates.max` value (-1 = all, 0 still allows the first). */
export function allowedTemplates(max: number): CvTemplateId[] {
  const count = max < 0 ? cvTemplates.length : Math.max(1, max);
  return cvTemplates.slice(0, count).map((template) => template.id);
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
});

export type CvContent = z.infer<typeof cvContentSchema>;

export const emptyCv: CvContent = {
  info: { name: "", headline: "", email: "", city: "", country: "", showEmail: true },
  summary: "",
  experiences: [],
  education: [],
  skills: [],
  languages: [],
  sections: cvSectionIds.map((id) => ({ id, visible: true })),
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
