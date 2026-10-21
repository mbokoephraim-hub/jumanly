"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { contractPreferences, findSkill, refreshCompleteness } from "@/server/services/profile";
import { PhotoError, removePhoto, savePhoto } from "@/server/services/profile-photo";
import { checkPlaces } from "@/server/services/places";
import { ensureProfile } from "@/server/services/profile";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { phoneSituations, situationGoal } from "@/lib/phone-onboarding";

/**
 * The six steps of the profile on the phone (Modèle B, planche Accueil, rangée 03). Each step saves
 * as the person goes on, so that the profile is kept if the phone closes in the middle.
 */
export type StepResult =
  | { ok: true; image?: string | null; percent?: number; offers?: number }
  | { ok: false; error: string };

const PAGE = "/app/bienvenue";

async function profileOf() {
  const user = await requireUser(PAGE);
  const profile = await ensureProfile(db, user.id);
  return { user, profile };
}

const personName = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[\p{L}\p{M}' .-]+$/u);

/** Step 1 · « Comment vous appelez-vous ? ». */
export async function saveNameStep(input: {
  firstName: string;
  lastName: string;
}): Promise<StepResult> {
  const { user } = await profileOf();
  const first = personName.safeParse(input.firstName);
  const last = personName.safeParse(input.lastName);
  if (!first.success || !last.success) return { ok: false, error: "name" };
  await db.user.update({
    where: { id: user.id },
    data: {
      firstName: first.data,
      lastName: last.data,
      name: `${first.data} ${last.data}`,
    },
  });
  revalidatePath("/app", "layout");
  return { ok: true };
}

/** Step 2 · « Ajoutez une photo »: the photo, read from its first bytes (JPEG, PNG or WebP). */
export async function savePhotoStep(formData: FormData): Promise<StepResult> {
  const { user } = await profileOf();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "type" };
  try {
    const image = await savePhoto(db, user.id, new Uint8Array(await file.arrayBuffer()));
    revalidatePath("/app", "layout");
    return { ok: true, image };
  } catch (error) {
    if (error instanceof PhotoError) return { ok: false, error: error.code };
    throw error;
  }
}

export async function removePhotoStep(): Promise<StepResult> {
  const { user } = await profileOf();
  await removePhoto(db, user.id);
  revalidatePath("/app", "layout");
  return { ok: true, image: null };
}

const placeSchema = z.object({
  country: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/),
  city: z.string().trim().min(1).max(120),
  relocation: z.boolean(),
});

/**
 * Step 3 · « Où habitez-vous ? »: the country (from the reference), the city, « Je peux
 * déménager ». A known city of that country also becomes a place where the person wants to work.
 */
export async function savePlaceStep(input: z.input<typeof placeSchema>): Promise<StepResult> {
  const { user, profile } = await profileOf();
  const parsed = placeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "place" };
  const code = parsed.data.country.toUpperCase();
  const known = await db.country.findUnique({ where: { code }, select: { code: true } });
  if (!known) return { ok: false, error: "place" };
  await db.user.update({
    where: { id: user.id },
    data: { country: known.code, city: parsed.data.city },
  });
  const { places } = await checkPlaces(db, {
    countries: [known.code],
    places: [`${known.code}:${parsed.data.city}`],
  });
  await db.talentProfile.update({
    where: { id: profile.id },
    data: {
      relocation: parsed.data.relocation,
      ...(!profile.desiredCountries.length && { desiredCountries: [known.code] }),
      ...(places.length > 0 && {
        desiredLocations: [...new Set([...profile.desiredLocations, ...places])],
      }),
    },
  });
  await refreshCompleteness(db, profile.id);
  return { ok: true };
}

/** Step 4 · « Où en êtes-vous ? »: also the goal that orders the home (`homeFocus`). */
export async function saveSituationStep(situation: string): Promise<StepResult> {
  const { profile } = await profileOf();
  const parsed = z.enum(phoneSituations).safeParse(situation);
  if (!parsed.success) return { ok: false, error: "situation" };
  await db.talentProfile.update({
    where: { id: profile.id },
    data: { situation: parsed.data, goal: situationGoal[parsed.data] },
  });
  return { ok: true };
}

const capSchema = z.object({
  cap: z.string().trim().min(2).max(120),
  contracts: z.array(z.enum(contractPreferences)).max(contractPreferences.length),
});

/** Step 5 · « Quel métier visez-vous ? »: the Cap and the contracts looked for. */
export async function saveCapStep(input: z.input<typeof capSchema>): Promise<StepResult> {
  const { profile } = await profileOf();
  const parsed = capSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "cap" };
  const titles = [
    parsed.data.cap,
    ...profile.desiredJobTitles.filter((title) => title !== parsed.data.cap),
  ].slice(0, 5);
  await db.talentProfile.update({
    where: { id: profile.id },
    data: {
      targetJob: parsed.data.cap,
      desiredJobTitles: titles,
      ...(parsed.data.contracts.length > 0 && { desiredContracts: parsed.data.contracts }),
    },
  });
  await refreshCompleteness(db, profile.id);
  return { ok: true };
}

/**
 * Step 6 · « Vos compétences »: at least three, from the reference (they feed the matching). The
 * skills already on the profile keep their level and their proof; the others start at level 2.
 */
export async function saveSkillsStep(names: string[]): Promise<StepResult> {
  const { user, profile } = await profileOf();
  const wanted = [...new Set(names.map((name) => name.trim()).filter(Boolean))].slice(0, 30);
  const skills = (await Promise.all(wanted.map((name) => findSkill(db, name)))).filter(
    (skill): skill is NonNullable<typeof skill> => skill !== null,
  );
  if (new Set(skills.map((skill) => skill.id)).size < 3) return { ok: false, error: "skills" };
  for (const skill of skills) {
    await db.profileSkill.upsert({
      where: { profileId_skillId: { profileId: profile.id, skillId: skill.id } },
      update: {},
      create: { profileId: profile.id, skillId: skill.id, level: 2 },
    });
  }
  const percent = await refreshCompleteness(db, profile.id);
  // « J'ai déjà repéré des offres… à Kinshasa » only when there are open offers in that city.
  const place = await db.user.findUnique({
    where: { id: user.id },
    select: { city: true, country: true },
  });
  const offers = place?.city
    ? await db.job.count({
        where: {
          status: "published",
          city: { equals: place.city, mode: "insensitive" },
          ...(place.country && { country: place.country }),
        },
      })
    : 0;
  revalidatePath("/app", "layout");
  return { ok: true, percent, offers };
}
