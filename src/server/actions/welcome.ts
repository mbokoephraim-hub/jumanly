"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { goalForFocus, homeFocuses } from "@/lib/welcome";
import { checkPlaces } from "@/server/services/places";
import { contractPreferences, refreshCompleteness, splitList } from "@/server/services/profile";
import { readSignupFlow, writeSignupFlow } from "@/server/signup-flow";

const countrySchema = z.object({
  country: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/),
});

/**
 * First-connection step 1 (V8 § B1, screen 81): the country where the person lives, kept as its ISO
 * code in `User.country` like at sign-up. An unknown code changes nothing.
 */
export async function saveWelcomeCountry(formData: FormData) {
  const user = await requireUser("/app/bienvenue");
  const parsed = countrySchema.safeParse({ country: formData.get("country") });
  if (parsed.success) {
    const code = parsed.data.country.toUpperCase();
    const known = await db.country.findUnique({ where: { code }, select: { code: true } });
    if (known) await db.user.update({ where: { id: user.id }, data: { country: code } });
  }
  redirect("/app/bienvenue?etape=objectif");
}

const goalSchema = z.object({ focus: z.enum(homeFocuses) });

/**
 * Goal screen, step 2 of 3 (docs/ux-mobile-talent, screen 01): one question. The answer is stored
 * in `TalentProfile.goal` (no migration), then step 3 asks where the person wants to work.
 */
export async function saveWelcomeGoal(formData: FormData) {
  const user = await requireUser("/app/bienvenue");
  const parsed = goalSchema.safeParse({ focus: formData.get("focus") });
  // Nothing chosen: same as « Plus tard ».
  if (!parsed.success) return finishWelcome();
  const current = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: { goal: true },
  });
  const goal = goalForFocus(parsed.data.focus, current?.goal);
  await db.talentProfile.upsert({
    where: { userId: user.id },
    update: { goal },
    create: { userId: user.id, goal },
  });
  // From « Modifier mon objectif »: straight back to « Pour moi ».
  if (formData.get("only") === "1") return finishWelcome();
  redirect("/app/bienvenue?etape=lieux");
}

const placesSchema = z.object({
  countries: z.array(z.string().trim().min(2).max(2)).max(10),
  places: z.array(z.string().trim().min(4).max(120)).max(60),
  remote: z.boolean(),
});

/**
 * Step 3 of 3 (V8 § B1, screen 82): several countries, then their cities and provinces, and remote
 * work. Countries and places are checked against the reference. Remote work only adds or removes
 * « remote » among the work modes already chosen.
 */
export async function saveWelcomePlaces(formData: FormData) {
  const user = await requireUser("/app/bienvenue");
  const parsed = placesSchema.safeParse({
    countries: formData.getAll("countries").map(String),
    places: formData.getAll("places").map(String),
    remote: formData.get("remote") === "on",
  });
  if (!parsed.success) redirect("/app/bienvenue?etape=lieux");
  const { countries, places } = await checkPlaces(db, parsed.data);
  const current = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: { remotePreferences: true },
  });
  const others = (current?.remotePreferences ?? []).filter((mode) => mode !== "remote");
  const remotePreferences = parsed.data.remote ? [...others, "remote" as const] : others;
  const profile = await db.talentProfile.upsert({
    where: { userId: user.id },
    update: { desiredCountries: countries, desiredLocations: places, remotePreferences },
    create: {
      userId: user.id,
      desiredCountries: countries,
      desiredLocations: places,
      remotePreferences,
    },
  });
  await refreshCompleteness(db, profile.id);
  if (formData.get("then") === "details") redirect("/app/bienvenue?etape=precisions");
  const flow = await readSignupFlow();
  await writeSignupFlow({ next: undefined });
  redirect(flow.next ?? (countries.length > 0 ? "/app/jobs?lieux=1" : "/app/jobs"));
}

const detailsSchema = z.object({
  titles: z.string().trim().max(300).catch(""),
  skills: z.array(z.string().trim().min(1).max(80)).max(30),
});

/**
 * Optional details (screen 02, after the places): job titles, skills, contracts. Only what was filled in is written, so an
 * empty field never erases what the profile already holds.
 */
export async function saveWelcomeDetails(formData: FormData) {
  const user = await requireUser("/app/bienvenue");
  const parsed = detailsSchema.parse({
    titles: formData.get("titles") ?? "",
    skills: formData.getAll("skills").map(String),
  });
  const contracts = formData
    .getAll("contracts")
    .map(String)
    .filter((value): value is (typeof contractPreferences)[number] =>
      (contractPreferences as readonly string[]).includes(value),
    );
  const remote = formData
    .getAll("remote")
    .map(String)
    .filter((value): value is "onsite" | "hybrid" | "remote" =>
      ["onsite", "hybrid", "remote"].includes(value),
    );
  const titles = splitList(parsed.titles, 5);
  const profile = await db.talentProfile.upsert({
    where: { userId: user.id },
    update: {
      ...(titles.length > 0 && { desiredJobTitles: titles, targetJob: titles[0] }),
      ...(contracts.length > 0 && { desiredContracts: contracts }),
      ...(remote.length > 0 && { remotePreferences: remote }),
    },
    create: {
      userId: user.id,
      desiredJobTitles: titles,
      targetJob: titles[0] ?? null,
      desiredContracts: contracts,
      remotePreferences: remote,
    },
  });
  // Only skills of the shared reference are kept (the admin enriches the reference).
  if (parsed.skills.length > 0) {
    const skills = await db.skill.findMany({
      where: {
        OR: [
          { name: { in: parsed.skills, mode: "insensitive" } },
          { aliases: { hasSome: parsed.skills } },
        ],
      },
      select: { id: true },
    });
    for (const skill of skills) {
      await db.profileSkill.upsert({
        where: { profileId_skillId: { profileId: profile.id, skillId: skill.id } },
        update: {},
        create: { profileId: profile.id, skillId: skill.id },
      });
    }
  }
  await refreshCompleteness(db, profile.id);
  await finishWelcome();
}

/** Leaves the welcome screen: back to the interrupted action, or to « Pour moi ». */
export async function finishWelcome() {
  const flow = await readSignupFlow();
  // The chosen plan stays known for the « Finaliser mon forfait » reminder.
  await writeSignupFlow({ next: undefined });
  redirect(flow.next ?? "/app");
}
