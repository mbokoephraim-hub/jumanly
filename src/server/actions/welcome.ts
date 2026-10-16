"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { goalForFocus, homeFocuses } from "@/lib/welcome";
import { contractPreferences, refreshCompleteness, splitList } from "@/server/services/profile";
import { readSignupFlow, writeSignupFlow } from "@/server/signup-flow";

const goalSchema = z.object({ focus: z.enum(homeFocuses) });

/**
 * Goal screen, step 1 (docs/ux-mobile-talent, screen 01): one question. The answer is stored in
 * `TalentProfile.goal` (no migration), then step 2 asks for the optional details.
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
  redirect("/app/bienvenue?etape=2");
}

const detailsSchema = z.object({
  titles: z.string().trim().max(300).catch(""),
  locations: z.string().trim().max(300).catch(""),
  skills: z.array(z.string().trim().min(1).max(80)).max(30),
});

/**
 * Goal screen, step 2 (screen 02): everything is optional. Only what was filled in is written, so an
 * empty field never erases what the profile already holds.
 */
export async function saveWelcomeDetails(formData: FormData) {
  const user = await requireUser("/app/bienvenue");
  const parsed = detailsSchema.parse({
    titles: formData.get("titles") ?? "",
    locations: formData.get("locations") ?? "",
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
  const locations = splitList(parsed.locations, 5);
  const profile = await db.talentProfile.upsert({
    where: { userId: user.id },
    update: {
      ...(titles.length > 0 && { desiredJobTitles: titles, targetJob: titles[0] }),
      ...(locations.length > 0 && { desiredLocations: locations }),
      ...(contracts.length > 0 && { desiredContracts: contracts }),
      ...(remote.length > 0 && { remotePreferences: remote }),
    },
    create: {
      userId: user.id,
      desiredJobTitles: titles,
      targetJob: titles[0] ?? null,
      desiredLocations: locations,
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
