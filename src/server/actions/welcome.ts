"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { studyFields, studyLevels } from "@/lib/studies";
import { onboardingGoals, welcomeContracts, workModes } from "@/lib/welcome";
import { checkPlaces } from "@/server/services/places";
import { refreshCompleteness } from "@/server/services/profile";
import { readSignupFlow, writeSignupFlow } from "@/server/signup-flow";

const goalSchema = z.object({ goal: z.enum(onboardingGoals) });

/**
 * Step 1 of 4 (planche talent-4 § 1): « Qu'est-ce qui vous amène ? ». The goal orders « Pour moi »
 * (`homeFocus`). Nothing chosen changes nothing and goes on.
 */
export async function saveWelcomeGoal(formData: FormData) {
  const user = await requireUser("/app/bienvenue");
  const parsed = goalSchema.safeParse({ goal: formData.get("goal") });
  if (parsed.success) {
    await db.talentProfile.upsert({
      where: { userId: user.id },
      update: { goal: parsed.data.goal },
      create: { userId: user.id, goal: parsed.data.goal },
    });
  }
  // From « Modifier mon objectif »: straight back to « Pour moi ».
  if (formData.get("only") === "1") redirect("/app");
  redirect("/app/bienvenue?etape=etudes");
}

const studiesSchema = z.object({
  studyLevel: z.enum(studyLevels).optional().catch(undefined),
  studyField: z.enum(studyFields).optional().catch(undefined),
});

/** Step 2 of 4: the level and the field of studies. Only what was chosen is written. */
export async function saveWelcomeStudies(formData: FormData) {
  const user = await requireUser("/app/bienvenue");
  const { studyLevel, studyField } = studiesSchema.parse({
    studyLevel: formData.get("studyLevel") ?? undefined,
    studyField: formData.get("studyField") || undefined,
  });
  const data = { ...(studyLevel && { studyLevel }), ...(studyField && { studyField }) };
  await db.talentProfile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });
  redirect("/app/bienvenue?etape=lieux");
}

const placesSchema = z.object({
  country: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/)
    .optional()
    .catch(undefined),
  city: z.string().trim().max(120).catch(""),
  contracts: z.array(z.enum(welcomeContracts)).catch([]),
  mode: z.enum(workModes).optional().catch(undefined),
});

/**
 * Step 3 of 4: the country where the person lives (asked only here, `User.country`), the city, the
 * contracts and the work mode. The country is checked against the reference; a known city of that
 * country also becomes a place where the person wants to work. Nothing chosen erases nothing.
 */
export async function saveWelcomePlaces(formData: FormData) {
  const user = await requireUser("/app/bienvenue");
  const input = placesSchema.parse({
    country: formData.get("country") || undefined,
    city: formData.get("city") ?? "",
    contracts: formData.getAll("contracts").map(String),
    mode: formData.get("mode") ?? undefined,
  });
  const code = input.country?.toUpperCase();
  const known = code
    ? await db.country.findUnique({ where: { code }, select: { code: true } })
    : null;
  await db.user.update({
    where: { id: user.id },
    data: {
      ...(known && { country: known.code }),
      ...(input.city && { city: input.city }),
    },
  });
  const current = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: { desiredCountries: true, desiredLocations: true },
  });
  const { places } =
    known && input.city
      ? await checkPlaces(db, { countries: [known.code], places: [`${known.code}:${input.city}`] })
      : { places: [] };
  const data = {
    ...(known && !current?.desiredCountries.length && { desiredCountries: [known.code] }),
    ...(places.length > 0 && {
      desiredLocations: [...new Set([...(current?.desiredLocations ?? []), ...places])],
    }),
    ...(input.contracts.length > 0 && { desiredContracts: [...input.contracts] }),
    ...(input.mode && { remotePreferences: [input.mode] }),
  };
  const profile = await db.talentProfile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });
  await refreshCompleteness(db, profile.id);
  redirect("/app/bienvenue?etape=pret");
}

/** « Continuer vers le paiement »: the plan chosen on /tarifs, after the first questions. */
export async function payWelcome() {
  await requireUser("/app/bienvenue");
  redirect("/inscription/paiement");
}

/** Leaves the welcome screen: back to the interrupted action, or to « Pour moi ». */
export async function finishWelcome() {
  const flow = await readSignupFlow();
  // The chosen plan stays known for the « Finaliser mon forfait » reminder.
  await writeSignupFlow({ next: undefined });
  redirect(flow.next ?? "/app?bienvenue=1");
}
