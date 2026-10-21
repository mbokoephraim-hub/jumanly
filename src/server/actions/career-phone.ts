"use server";

import { refresh, revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { rewriteCareerText } from "@/server/services/career-phone";
import {
  educationSchema,
  ensureProfile,
  experienceSchema,
  monthToDate,
  parseProfileLanguages,
  PROFILE_SKILLS_MAX,
  PROFILE_SUMMARY_MAX,
  refreshCompleteness,
} from "@/server/services/profile";
import { NOTIFICATION_CATEGORIES } from "@/server/services/notifications";
import { PhotoError, removePhoto, savePhoto } from "@/server/services/profile-photo";

/**
 * Carrière on the phone (Modèle B, lot B5): the quick changes made from the tab itself. Each one
 * validates, checks the session and touches only the person's own profile.
 */

const skillIds = z.array(z.string().min(1).max(40)).min(1).max(10);

/** « Ajouter » on Orbi's card or in « Ajouter des compétences »: declared skills, level 2. */
export async function addSuggestedSkillsAction(ids: string[]) {
  const parsed = skillIds.safeParse(ids);
  if (!parsed.success) return { ok: false as const, error: "invalid" as const };
  const user = await requireUser("/app/career/cv");
  const profile = await ensureProfile(db, user.id);
  const skills = await db.skill.findMany({
    where: { id: { in: parsed.data } },
    select: { id: true },
  });
  const count = await db.profileSkill.count({ where: { profileId: profile.id } });
  if (count + skills.length > PROFILE_SKILLS_MAX)
    return { ok: false as const, error: "max" as const };
  await db.profileSkill.createMany({
    data: skills.map((skill) => ({ profileId: profile.id, skillId: skill.id, level: 2 })),
    skipDuplicates: true,
  });
  await refreshCompleteness(db, profile.id);
  refresh();
  return { ok: true as const, added: skills.length };
}

type Result = { ok: true } | { ok: false; error: string };

const fail = (error: string): Result => ({ ok: false, error });

async function mine() {
  const user = await requireUser("/app/career/cv");
  const profile = await ensureProfile(db, user.id);
  return { user, profile };
}

/** After a change: completeness again, then the mounted Carrière tab reads it. */
async function saved(profileId: string): Promise<Result> {
  await refreshCompleteness(db, profileId);
  refresh();
  return { ok: true };
}

const nameSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[\p{L}\p{M}' .-]+$/u);

const headSchema = z.object({
  name: nameSchema,
  headline: z.string().trim().max(120),
  city: z.string().trim().min(1).max(120),
  summary: z.string().trim().max(PROFILE_SUMMARY_MAX),
  availability: z.enum(["open", "listening", "not_looking"]),
});

/**
 * « Modifier le profil » (planche Carrière-modifier): the displayed name (first word = first name),
 * the title, the city, the bio and the availability.
 */
export async function saveCareerHeadAction(raw: z.input<typeof headSchema>): Promise<Result> {
  const parsed = headSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.path[0] === "name" ? "name" : "invalid");
  const { user, profile } = await mine();
  const input = parsed.data;
  const [firstName, ...rest] = input.name.split(/\s+/);
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        name: input.name,
        firstName,
        lastName: rest.join(" ") || null,
        city: input.city,
      },
    }),
    db.talentProfile.update({
      where: { id: profile.id },
      data: {
        headline: input.headline || null,
        summary: input.summary || null,
        availability: input.availability,
        availableFrom: input.availability === "open" ? null : profile.availableFrom,
      },
    }),
  ]);
  return saved(profile.id);
}

/** « À propos » (planche Carrière-apropos): the text alone. */
export async function saveCareerAboutAction(summary: string): Promise<Result> {
  const parsed = z.string().trim().max(PROFILE_SUMMARY_MAX).safeParse(summary);
  if (!parsed.success) return fail("invalid");
  const { profile } = await mine();
  await db.talentProfile.update({
    where: { id: profile.id },
    data: { summary: parsed.data || null },
  });
  return saved(profile.id);
}

const experienceInput = z.object({
  id: z.string().max(40).optional(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  type: z.string(),
  start: z.string(),
  end: z.string(),
  current: z.boolean(),
  description: z.string(),
});

/** « Modifier l'expérience » / « Nouvelle expérience » (planches Carrière-exp, -exp-new). */
export async function saveCareerExperienceAction(
  raw: z.input<typeof experienceInput>,
): Promise<Result> {
  const shape = experienceInput.safeParse(raw);
  if (!shape.success) return fail("invalid");
  const { id, current, ...rest } = shape.data;
  const parsed = experienceSchema.safeParse({ ...rest, ...(current ? { current: "on" } : {}) });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(issue?.message === "endBeforeStart" ? "endBeforeStart" : String(issue?.path[0]));
  }
  const { profile } = await mine();
  const input = parsed.data;
  const data = {
    title: input.title,
    company: input.company,
    type: input.type,
    location: input.location || null,
    startDate: monthToDate(input.start),
    endDate: input.current || !input.end ? null : monthToDate(input.end),
    description: input.description,
  };
  if (id) {
    const done = await db.experience.updateMany({ where: { id, profileId: profile.id }, data });
    if (done.count === 0) return fail("missing");
  } else {
    await db.experience.create({ data: { ...data, profileId: profile.id } });
  }
  return saved(profile.id);
}

export async function deleteCareerExperienceAction(id: string): Promise<Result> {
  const { profile } = await mine();
  await db.experience.deleteMany({ where: { id: String(id), profileId: profile.id } });
  return saved(profile.id);
}

const educationInput = z.object({
  id: z.string().max(40).optional(),
  degree: z.string(),
  school: z.string(),
  level: z.string(),
  field: z.string(),
  startYear: z.string(),
  endYear: z.string(),
});

/** « Modifier la formation » (planche Carrière-formation): an empty end = in progress. */
export async function saveCareerEducationAction(
  raw: z.input<typeof educationInput>,
): Promise<Result> {
  const shape = educationInput.safeParse(raw);
  if (!shape.success) return fail("invalid");
  const { id, ...rest } = shape.data;
  const parsed = educationSchema.safeParse({
    ...rest,
    ...(rest.endYear.trim() ? {} : { inProgress: "on" }),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(issue?.message === "endBeforeStart" ? "endBeforeStart" : String(issue?.path[0]));
  }
  const { profile } = await mine();
  const input = parsed.data;
  const data = {
    degree: input.degree,
    level: input.level,
    field: input.field || null,
    school: input.school,
    startYear: typeof input.startYear === "number" ? input.startYear : null,
    endYear: input.inProgress || typeof input.endYear !== "number" ? null : input.endYear,
  };
  if (id) {
    const done = await db.education.updateMany({ where: { id, profileId: profile.id }, data });
    if (done.count === 0) return fail("missing");
  } else {
    await db.education.create({ data: { ...data, profileId: profile.id } });
  }
  return saved(profile.id);
}

export async function deleteCareerEducationAction(id: string): Promise<Result> {
  const { profile } = await mine();
  await db.education.deleteMany({ where: { id: String(id), profileId: profile.id } });
  return saved(profile.id);
}

const languagesInput = z.object({
  languages: z.array(z.string().regex(/^[a-z]{2,3}$/)).max(12),
  places: z.array(z.string().trim().min(1).max(80)).max(10),
});

/**
 * « Langues et lieux » (planche Carrière-langues): the languages ticked (a language already
 * there keeps its level, a new one is « professional ») and the places where the person wants
 * to work.
 */
export async function saveCareerLanguagesAction(
  raw: z.input<typeof languagesInput>,
): Promise<Result> {
  const parsed = languagesInput.safeParse(raw);
  if (!parsed.success) return fail("invalid");
  const { profile } = await mine();
  const before = parseProfileLanguages(profile.languages);
  const languages = [...new Set(parsed.data.languages)].map(
    (code) => before.find((item) => item.code === code) ?? { code, level: "professional" as const },
  );
  await db.talentProfile.update({
    where: { id: profile.id },
    data: { languages, desiredLocations: [...new Set(parsed.data.places)] },
  });
  return saved(profile.id);
}

/** « Retirer » in « Photo de profil »: back to the initials. */
export async function removeCareerPhotoAction(): Promise<Result> {
  const { user } = await mine();
  await removePhoto(db, user.id);
  revalidatePath("/app", "layout");
  return { ok: true };
}

/** « Prendre une photo » / « Choisir dans la galerie »: the square JPEG made on the phone. */
export async function saveCareerPhotoAction(formData: FormData): Promise<Result> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return fail("photo");
  const { user } = await mine();
  try {
    await savePhoto(db, user.id, new Uint8Array(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof PhotoError) return fail(error.code);
    throw error;
  }
  revalidatePath("/app", "layout");
  return { ok: true };
}

/**
 * « Réécrire » / « Améliorer » (planches Carrière-apropos, -exp): Orbi proposes a version of the
 * text from the person's own words only; nothing is saved until « Utiliser » then « Enregistrer ».
 */
export async function rewriteCareerTextAction(raw: {
  kind: "about" | "experience";
  text: string;
  title?: string;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const parsed = z
    .object({
      kind: z.enum(["about", "experience"]),
      text: z.string().max(3000),
      title: z.string().max(160).optional(),
    })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { user } = await mine();
  const result = await rewriteCareerText(db, user.id, parsed.data);
  return typeof result === "string"
    ? { ok: true, text: result }
    : { ok: false, error: result.error };
}

/** « Chercher une compétence » in « Ajouter des compétences »: the reference list only. */
export async function searchCareerSkillsAction(query: string) {
  const parsed = z.string().trim().min(2).max(60).safeParse(query);
  if (!parsed.success) return [];
  await requireUser("/app/career/cv");
  return db.skill.findMany({
    where: { name: { contains: parsed.data, mode: "insensitive" } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 8,
  });
}

const privacyInput = z.object({
  visibility: z.enum(["private", "recruiters", "anonymous"]),
  matching: z.boolean(),
  contactRequests: z.boolean(),
  ai: z.boolean(),
  newsletter: z.boolean(),
});

/**
 * « Confidentialité » on the phone (planche Carrière-confid): each switch saves at once. Applying
 * stays possible whatever is chosen (CLAUDE.md, règle 1).
 */
export async function saveCareerPrivacyAction(raw: z.input<typeof privacyInput>): Promise<Result> {
  const parsed = privacyInput.safeParse(raw);
  if (!parsed.success) return fail("invalid");
  const { user, profile } = await mine();
  const input = parsed.data;
  const consent = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { aiConsentAt: true },
  });
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        aiConsentAt: input.ai ? (consent.aiConsentAt ?? new Date()) : null,
        newsletter: input.newsletter,
      },
    }),
    db.talentProfile.update({
      where: { id: profile.id },
      data: {
        visibility: input.visibility,
        matchingEnabled: input.matching,
        acceptsContactRequests: input.contactRequests,
      },
    }),
  ]);
  refresh();
  return { ok: true };
}

const notificationsInput = z.object({
  categories: z.array(z.enum(NOTIFICATION_CATEGORIES as [string, ...string[]])),
  emails: z.boolean(),
});

/** « Notifications » on the phone (planche Carrière-notif): the categories kept, the e-mails. */
export async function saveCareerNotificationsAction(
  raw: z.input<typeof notificationsInput>,
): Promise<Result> {
  const parsed = notificationsInput.safeParse(raw);
  if (!parsed.success) return fail("invalid");
  const { user } = await mine();
  const kept = new Set(parsed.data.categories);
  await db.user.update({
    where: { id: user.id },
    data: {
      notificationsMuted: NOTIFICATION_CATEGORIES.filter((category) => !kept.has(category)),
      notificationEmails: parsed.data.emails,
    },
  });
  refresh();
  return { ok: true };
}
