/**
 * Small rules shared by the screens of Mon profil (planche talent-4 § 3): what proves a skill,
 * the languages and levels offered, what a recruiter sees.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { listProjects } from "./portfolio";
import { getFullProfile } from "./profile";

/** Languages offered in the form: the most useful on the continent first. */
export const profileLanguageCodes = [
  "fr",
  "en",
  "ln",
  "sw",
  "pt",
  "ar",
  "es",
  "de",
  "zh",
  "wo",
  "yo",
  "ha",
  "am",
  "kg",
  "lu",
  "rw",
] as const;

export const educationLevels = [
  "none",
  "secondary",
  "vocational",
  "bachelor",
  "master",
  "doctorate",
] as const;

/** The proof badge of a skill: an attestation, a project, another proof, or declared only. */
export function proofOf(skill: { proof: string | null; verified: boolean }) {
  if (skill.verified || skill.proof === "certificate") return "certificate" as const;
  if (skill.proof === "project") return "project" as const;
  if (skill.proof === "experience") return "experience" as const;
  if (skill.proof === "link") return "link" as const;
  return "none" as const;
}

/**
 * « Vu par un recruteur »: what a recruiter sees once the person applies or shows their profile
 * (never the photo, age, gender, nationality, family situation or precise address for the score).
 */
export async function recruiterPreview(db: PrismaClient, userId: string) {
  const profile = await getFullProfile(db, userId);
  const [projects, attestations] = await Promise.all([
    listProjects(db, profile.id),
    db.certificate.count({
      where: { enrollment: { userId }, revokedAt: null, onProfile: true },
    }),
  ]);
  return {
    title: profile.headline || profile.desiredJobTitles[0] || null,
    skills: profile.skills.map((item) => ({
      name: item.skill.name,
      proven: proofOf(item) !== "none",
    })),
    visibleProjects: projects.filter((project) => project.visible).length,
    attestations,
    city: profile.user.city,
    visibility: profile.visibility,
  };
}
