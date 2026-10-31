import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import { siteUrl } from "@/lib/seo";
import { parseSocialLinks, SOCIAL_KINDS } from "@/lib/social-links";
import { cvFromProfile, emptyCv, type CvContent } from "./cv";
import { listProjects } from "./portfolio";
import { getFullProfile } from "./profile";

/**
 * « Nouveau CV » (Ephraïm, 31/10/2026): the three ways to start a CV on the phone. « À partir de
 * mon profil » brings everything the profile holds into the form, each in its box: identity and
 * contacts, the bio, the skills, the experiences with their dates and points, the education, the
 * languages, the achievements of the portfolio, its links and the references asked for. All of
 * it stays editable on this CV only.
 */
export const cvStartModes = ["profil", "zero", "offre"] as const;
export type CvStartMode = (typeof cvStartModes)[number];

const NETWORK_LABELS: Record<(typeof SOCIAL_KINDS)[number], string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X",
  facebook: "Facebook",
  website: "Site",
};

/** The whole profile in a CV. Never copied: photo, age, family situation, address (règle 4). */
export async function cvFromWholeProfile(db: PrismaClient, userId: string): Promise<CvContent> {
  const profile = await getFullProfile(db, userId);
  const content = cvFromProfile(profile);
  const [projects, references] = await Promise.all([
    listProjects(db, profile.id),
    db.referenceCheck.findMany({
      where: { profileId: profile.id, status: { in: ["pending", "confirmed"] } },
      orderBy: { createdAt: "desc" },
      select: { referentName: true, referentRole: true, referentEmail: true },
      take: 12,
    }),
  ]);
  const seen = new Set<string>();
  const uniqueReferences = references.filter((item) => {
    const key = item.referentEmail.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const social = parseSocialLinks(profile.socialLinks);
  const links: CvContent["links"] = [
    ...(profile.portfolioSlug && profile.portfolioPublic
      ? [{ label: "Portfolio", url: `${siteUrl()}/portfolio/${profile.portfolioSlug}` }]
      : []),
    ...SOCIAL_KINDS.flatMap((kind) =>
      social[kind] ? [{ label: NETWORK_LABELS[kind], url: social[kind]! }] : [],
    ),
    ...projects.flatMap((project) =>
      project.link ? [{ label: project.title.slice(0, 60), url: project.link }] : [],
    ),
  ].slice(0, 8);
  return {
    ...content,
    achievements: projects
      .map((project) => project.title.trim())
      .filter(Boolean)
      .slice(0, 6),
    references: uniqueReferences.slice(0, 6).map((item) => ({
      name: item.referentName,
      role: item.referentRole ?? "",
      contact: item.referentEmail,
    })),
    links,
  };
}

/** « Tout écrire moi-même »: an empty CV, written from A to Z by the talent. */
export function blankCv(): CvContent {
  return structuredClone(emptyCv);
}
