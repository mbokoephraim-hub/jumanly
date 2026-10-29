/**
 * « Nouvelle offre » step by step on the recruiter's phone (publication d'offre étape par étape,
 * 29/10/2026): the post, the technical and behavioural skills (from the reference list, or typed
 * when it has none), the requirements (languages, studies, place, contract, openings), the
 * responsibilities and the profile point by point, the salary shown or hidden, the company's
 * text, then Orbi's reading and the publication with its Fil post.
 *
 * The post and its text go through `saveJobStep` (same rules as the computer: organization,
 * wording checked, live offers back to review when risky). The rest is written here. Orbi's
 * reading (`analyzeOffer`) is deterministic and free: it recommends, the recruiter decides
 * (golden rule n° 3); no answer, no field ever blocks an application (golden rule n° 1).
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { FEED_BODY_MAX, FEED_TITLE_MAX } from "./feed-limits";
export { postOfferToFeed } from "./job-feed-post";
import {
  getOrgJob,
  hirePermissions,
  HireError,
  isProtectedCriterion,
  moderationFlags,
  REQUIRED_SKILLS_MAX,
  type HireContext,
} from "./hire";
import { OPENINGS_MAX, saveJobStep, type StepResult } from "./hire-offers";
import { findOrCreateSkill } from "./profile";

export const SOFT_SKILLS_MAX = 8;
export const POINTS_MAX = 12;
export const LANGUAGES_MAX = 5;
export const educationLevels = [
  "none",
  "secondary",
  "vocational",
  "bachelor",
  "master",
  "doctorate",
] as const;
export const cefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
/** Languages offered first; any ISO 639-1 code is accepted. */
export const offerLanguages = ["fr", "en", "ln", "sw", "kg", "lu", "pt", "es", "ar", "zh"] as const;

const point = z.string().trim().min(3).max(300);

export const offerWizardSchema = z.object({
  jobId: z.string().trim().max(60).optional(),
  title: z.string().trim().max(120),
  description: z.string().trim().max(8000),
  hardSkills: z.array(z.string().trim().min(2).max(80)).max(REQUIRED_SKILLS_MAX),
  softSkills: z.array(z.string().trim().min(2).max(80)).max(SOFT_SKILLS_MAX),
  languages: z
    .array(z.object({ code: z.string().regex(/^[a-z]{2}$/), level: z.enum(cefrLevels) }))
    .max(LANGUAGES_MAX),
  /** Several levels can be accepted (« Licence ou Master »). */
  educations: z.array(z.enum(educationLevels)).max(educationLevels.length),
  /** « Date limite de candidature », a day to come (YYYY-MM-DD), or none. */
  closesAt: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  city: z.string().trim().max(120),
  country: z.string().trim().max(80),
  remote: z.enum(["onsite", "hybrid", "remote"]),
  contract: z.enum(["cdi", "cdd", "stage", "mission", "freelance", "alternance", "volontariat"]),
  openings: z.number().int().min(1).max(OPENINGS_MAX),
  responsibilities: z.array(point).max(POINTS_MAX),
  experience: z.number().int().min(0).max(40),
  requirements: z.array(point).max(POINTS_MAX),
  salaryShown: z.boolean(),
  salaryMin: z.string().trim().max(9),
  salaryMax: z.string().trim().max(9),
  companyAbout: z.string().trim().max(1500),
  feedTitle: z.string().trim().max(FEED_TITLE_MAX),
  feedText: z.string().trim().max(FEED_BODY_MAX),
});
export type OfferWizardInput = z.input<typeof offerWizardSchema>;

/** Saves everything the steps hold. Creates the draft the first time. */
export async function saveOfferWizard(
  db: PrismaClient,
  ctx: HireContext,
  raw: OfferWizardInput,
): Promise<StepResult & { slug?: string }> {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const parsed = offerWizardSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: "invalid", field: String(issue?.path[0] ?? "") };
  }
  const input = parsed.data;
  const texts = [
    ...input.responsibilities,
    ...input.requirements,
    ...input.hardSkills,
    ...input.softSkills,
  ];
  if (texts.some(isProtectedCriterion)) return { ok: false, error: "forbidden", field: "text" };
  const closesAt = input.closesAt ? new Date(`${input.closesAt}T23:59:59.000Z`) : null;
  if (closesAt && (Number.isNaN(closesAt.getTime()) || closesAt.getTime() < Date.now()))
    return { ok: false, error: "invalid", field: "closesAt" };
  const educations = educationLevels.filter((level) => input.educations.includes(level));
  const job = input.jobId ? await getOrgJob(db, ctx, input.jobId) : null;
  const poste = await saveJobStep(
    db,
    ctx,
    "poste",
    {
      title: input.title,
      domain: job?.domain ?? "",
      experienceMin: String(input.experience),
      city: input.city,
      country: input.country,
      remote: input.remote,
      contractType: input.contract,
      openings: String(input.openings),
      salaryMin: input.salaryShown ? input.salaryMin : "",
      salaryMax: input.salaryShown ? input.salaryMax : "",
    },
    job?.id,
  );
  if (!poste.ok) return poste;
  // The skills are written below (typed ones included), so the step keeps none of its own.
  const text = await saveJobStep(
    db,
    ctx,
    "description",
    {
      description: input.description,
      responsibilities: input.responsibilities.join("\n"),
      requirements: input.requirements.join("\n"),
      benefits: (job?.benefits ?? []).join("\n"),
      requiredSkills: "",
      preferredSkills: "",
    },
    poste.jobId,
  );
  if (!text.ok) return text;
  const skills: { skillId: string; kind: "hard" | "soft" }[] = [];
  for (const [names, kind] of [
    [input.hardSkills, "hard"],
    [input.softSkills, "soft"],
  ] as const)
    for (const name of names) {
      const skill = await findOrCreateSkill(db, name);
      if (skill && !skills.some((item) => item.skillId === skill.id))
        skills.push({ skillId: skill.id, kind });
    }
  const saved = await db.job.update({
    where: { id: poste.jobId },
    data: {
      languagesRequired: input.languages,
      educationLevels: educations,
      // The matching reads the lowest level accepted.
      educationLevelMin: educations[0] ?? null,
      closesAt,
      companyAbout: input.companyAbout || null,
      feedTitle: input.feedTitle || null,
      feedText: input.feedText || null,
      skills: {
        deleteMany: {},
        create: skills.map((item) => ({
          skillId: item.skillId,
          kind: item.kind,
          // Technical skills are the ones the offer requires; behavioural ones count less.
          importance: item.kind === "hard" ? "required" : "preferred",
          weight: item.kind === "hard" ? 4 : 2,
          minLevel: 2,
        })),
      },
    },
    select: { id: true, slug: true },
  });
  return { ok: true, jobId: saved.id, slug: saved.slug };
}

export type OfferCheck = {
  key:
    | "description"
    | "hardSkills"
    | "softSkills"
    | "responsibilities"
    | "requirements"
    | "languages"
    | "salary"
    | "company"
    | "wording";
  state: "ok" | "advice" | "warning";
  /** The step that fixes it. */
  step: number;
};

/**
 * Orbi reads the offer before it goes out: what is complete, what would help talents (advice),
 * what Jumanly checks before publishing (warning). The same rules as the moderation, so a warning
 * here is what would send the offer to review.
 */
export function analyzeOffer(offer: {
  title: string;
  description: string;
  hardSkills: string[];
  softSkills: string[];
  responsibilities: string[];
  requirements: string[];
  languages: unknown[];
  salaryShown: boolean;
  companyAbout: string;
  feedTitle: string;
}): { score: number; checks: OfferCheck[] } {
  const wording = moderationFlags({
    title: offer.title,
    description: offer.description,
    responsibilities: offer.responsibilities,
    requirements: offer.requirements,
    benefits: [],
  });
  const checks: OfferCheck[] = [
    {
      key: "description",
      state: offer.description.length >= 200 ? "ok" : "advice",
      step: 1,
    },
    { key: "hardSkills", state: offer.hardSkills.length >= 3 ? "ok" : "advice", step: 2 },
    { key: "softSkills", state: offer.softSkills.length >= 2 ? "ok" : "advice", step: 2 },
    { key: "languages", state: offer.languages.length > 0 ? "ok" : "advice", step: 3 },
    {
      key: "responsibilities",
      state: offer.responsibilities.length >= 3 ? "ok" : "advice",
      step: 4,
    },
    { key: "requirements", state: offer.requirements.length >= 2 ? "ok" : "advice", step: 5 },
    { key: "salary", state: offer.salaryShown ? "ok" : "advice", step: 6 },
    { key: "company", state: offer.companyAbout.length >= 80 ? "ok" : "advice", step: 7 },
    { key: "wording", state: wording.length === 0 ? "ok" : "warning", step: 1 },
  ];
  const done = checks.filter((check) => check.state === "ok").length;
  return { score: Math.round((done / checks.length) * 100), checks };
}
