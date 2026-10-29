import { achievementsOf, achievementsText } from "@/lib/achievements";
import type { PrismaClient } from "@/generated/prisma/client";
import type { CvContent } from "./cv";
import { emptyCv } from "./cv";
import type { Extraction } from "./cv-import";
import {
  ensureProfile,
  monthToDate,
  normalize,
  parseProfileLanguages,
  refreshCompleteness,
} from "./profile";

/**
 * « Ajouter à mon profil » (Ephraïm, 27/10): what a CV holds goes into the profile, only what the
 * profile does not have yet. Nothing is replaced: a title or a summary already written stays.
 */
export type CvIntoProfilePlan = {
  headline: string | null;
  summary: string | null;
  experiences: CvContent["experiences"];
  educations: CvContent["education"];
  /** Ids of reference skills, with their names. */
  skills: { id: string; name: string }[];
  languages: string[];
};

export type ProfileSnapshot = {
  headline: string | null;
  summary: string | null;
  experiences: { title: string; company: string }[];
  educations: { degree: string; school: string }[];
  skillIds: string[];
  languages: string[];
};

const key = (...parts: string[]) => parts.map((part) => normalize(part)).join("|");
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Pure: what would be added (unit-tested). */
export function planCvIntoProfile(
  content: CvContent,
  profile: ProfileSnapshot,
  reference: { id: string; name: string; aliases: string[] }[],
): CvIntoProfilePlan {
  const jobs = new Set(profile.experiences.map((item) => key(item.title, item.company)));
  const studies = new Set(profile.educations.map((item) => key(item.degree, item.school)));
  const owned = new Set(profile.skillIds);
  const spoken = new Set(profile.languages);
  const skills: CvIntoProfilePlan["skills"] = [];
  for (const { name } of content.skills) {
    const folded = normalize(name);
    const skill = reference.find(
      (row) =>
        normalize(row.name) === folded || row.aliases.some((alias) => normalize(alias) === folded),
    );
    if (!skill || owned.has(skill.id)) continue;
    owned.add(skill.id);
    skills.push({ id: skill.id, name: skill.name });
  }
  return {
    headline:
      !profile.headline?.trim() && content.info.headline.trim() ? content.info.headline : null,
    summary: !profile.summary?.trim() && content.summary.trim() ? content.summary : null,
    experiences: content.experiences.filter((item) => {
      const id = key(item.title, item.company);
      if (!item.title.trim() || !MONTH.test(item.start) || jobs.has(id)) return false;
      jobs.add(id);
      return true;
    }),
    educations: content.education.filter((item) => {
      const id = key(item.degree, item.school);
      if (!item.degree.trim() || studies.has(id)) return false;
      studies.add(id);
      return true;
    }),
    skills,
    languages: content.languages
      .map((item) => item.code)
      .filter((code) => {
        if (!code || spoken.has(code)) return false;
        spoken.add(code);
        return true;
      }),
  };
}

export function planSize(plan: CvIntoProfilePlan) {
  return (
    Number(Boolean(plan.headline)) +
    Number(Boolean(plan.summary)) +
    plan.experiences.length +
    plan.educations.length +
    plan.skills.length +
    plan.languages.length
  );
}

async function snapshot(db: PrismaClient, userId: string) {
  const profile = await ensureProfile(db, userId);
  const [experiences, educations, skills, reference] = await Promise.all([
    db.experience.findMany({
      where: { profileId: profile.id },
      select: { title: true, company: true },
    }),
    db.education.findMany({
      where: { profileId: profile.id },
      select: { degree: true, school: true },
    }),
    db.profileSkill.findMany({ where: { profileId: profile.id }, select: { skillId: true } }),
    db.skill.findMany({ select: { id: true, name: true, aliases: true } }),
  ]);
  return {
    profile,
    reference,
    snapshot: {
      headline: profile.headline,
      summary: profile.summary,
      experiences,
      educations,
      skillIds: skills.map((row) => row.skillId),
      languages: parseProfileLanguages(profile.languages).map((item) => item.code),
    } satisfies ProfileSnapshot,
  };
}

/** What « Ajouter à mon profil » would add, for the sheet that asks first. */
export async function previewCvIntoProfile(db: PrismaClient, userId: string, content: CvContent) {
  const { snapshot: current, reference } = await snapshot(db, userId);
  return planCvIntoProfile(content, current, reference);
}

/** Adds to the profile what it does not have yet; returns how many items were added. */
export async function applyCvIntoProfile(db: PrismaClient, userId: string, content: CvContent) {
  const { profile, snapshot: current, reference } = await snapshot(db, userId);
  const plan = planCvIntoProfile(content, current, reference);
  await db.$transaction(async (tx) => {
    if (plan.headline || plan.summary)
      await tx.talentProfile.update({
        where: { id: profile.id },
        data: {
          ...(plan.headline ? { headline: plan.headline.slice(0, 160) } : {}),
          ...(plan.summary ? { summary: plan.summary.slice(0, 2000) } : {}),
        },
      });
    for (const item of plan.experiences)
      await tx.experience.create({
        data: {
          profileId: profile.id,
          title: item.title.slice(0, 120),
          company: item.company.slice(0, 120) || "—",
          location: item.location || null,
          startDate: monthToDate(item.start),
          endDate: item.end && MONTH.test(item.end) ? monthToDate(item.end) : null,
          description: achievementsText(item.bullets),
        },
      });
    for (const item of plan.educations)
      await tx.education.create({
        data: {
          profileId: profile.id,
          degree: item.degree.slice(0, 160),
          school: item.school.slice(0, 160),
          field: item.field || null,
          level: "none",
          startYear: item.startYear,
          endYear: item.endYear,
        },
      });
    for (const skill of plan.skills)
      await tx.profileSkill.create({
        data: { profileId: profile.id, skillId: skill.id, source: "declared" },
      });
    if (plan.languages.length > 0) {
      const before = parseProfileLanguages(profile.languages);
      await tx.talentProfile.update({
        where: { id: profile.id },
        data: {
          languages: [
            ...before,
            ...plan.languages.map((code) => ({ code, level: "professional" as const })),
          ].slice(0, 12),
        },
      });
    }
  });
  await refreshCompleteness(db, profile.id);
  return planSize(plan);
}

/**
 * « Garder ce CV » after an import: the CV as it was read, kept in « Mes CV » without touching the
 * profile. Name and e-mail come from the account unless the CV gives them.
 */
export function cvFromExtraction(
  read: Extraction,
  account: { name: string; email: string; city: string; country: string },
): CvContent {
  const month = (value: string | null) => (value && MONTH.test(value) ? value : null);
  return {
    ...emptyCv,
    info: {
      ...emptyCv.info,
      name: read.contact.name?.trim() || account.name,
      email: account.email,
      city: read.contact.city?.trim() || account.city,
      country: account.country,
    },
    experiences: read.experiences.map((item) => ({
      title: item.title,
      company: item.company,
      location: "",
      start: month(item.start) ?? "",
      end: month(item.end),
      bullets: achievementsOf(item.description),
    })),
    education: read.educations.map((item) => ({
      degree: item.degree,
      school: item.school,
      field: "",
      startYear: null,
      endYear: item.endYear,
    })),
    skills: read.skills.map((name) => ({ name, level: 3 })),
    languages: read.languages.map((code) => ({ code, level: "professional" })),
  };
}
