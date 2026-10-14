"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { welcomeGoals } from "@/lib/welcome";
import { refreshCompleteness } from "@/server/services/profile";
import { readSignupFlow, writeSignupFlow } from "@/server/signup-flow";

const welcomeSchema = z.object({
  goal: z.enum(welcomeGoals).optional().catch(undefined),
  targetJob: z.string().trim().max(120).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(30),
  visibility: z.enum(["private", "recruiters", "anonymous"]).catch("private"),
});

/** Step 6 · first answers of a talent. Every answer is optional (« Passer pour l'instant »). */
export async function saveTalentWelcome(formData: FormData) {
  const user = await requireUser("/app/bienvenue");
  const parsed = welcomeSchema.parse({
    goal: formData.get("goal") ?? undefined,
    targetJob: formData.get("targetJob") ?? undefined,
    skills: formData.getAll("skills").map(String),
    visibility: formData.get("visibility"),
  });
  const profile = await db.talentProfile.upsert({
    where: { userId: user.id },
    update: {
      goal: parsed.goal ?? null,
      targetJob: parsed.targetJob || null,
      visibility: parsed.visibility,
    },
    create: {
      userId: user.id,
      goal: parsed.goal,
      targetJob: parsed.targetJob || null,
      visibility: parsed.visibility,
    },
  });
  // Only skills of the shared reference are kept (the admin enriches the reference).
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
  await refreshCompleteness(db, profile.id);
  await finishWelcome();
}

/** Leaves the welcome screen: back to the interrupted action, or to the dashboard. */
export async function finishWelcome() {
  const flow = await readSignupFlow();
  // The chosen plan stays known for the « Finaliser mon forfait » reminder.
  await writeSignupFlow({ next: undefined });
  redirect(flow.next ?? "/app");
}
