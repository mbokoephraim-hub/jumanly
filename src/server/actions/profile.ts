"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  ensureProfile,
  educationSchema,
  experienceSchema,
  findSkill,
  identitySchema,
  languageSchema,
  monthToDate,
  parseProfileLanguages,
  preferencesSchema,
  PROFILE_SKILLS_MAX,
  refreshCompleteness,
  skillSchema,
  splitList,
  summarySchema,
  contractPreferences,
} from "@/server/services/profile";

/** Profile sections, also the anchors of /app/profil. */
type Section =
  | "identite"
  | "resume"
  | "experiences"
  | "formations"
  | "competences"
  | "langues"
  | "preferences"
  | "visibilite";

function back(section: Section, params: Record<string, string>): never {
  redirect(`/app/profil?${new URLSearchParams({ section, ...params })}#${section}`);
}

function firstError(error: z.ZodError) {
  return error.issues[0]?.message === "endBeforeStart" ? "endBeforeStart" : "invalid";
}

async function profileOf() {
  const user = await requireUser("/app/profil");
  const profile = await ensureProfile(db, user.id);
  return { user, profile };
}

async function done(profileId: string, section: Section): Promise<never> {
  await refreshCompleteness(db, profileId);
  back(section, { ok: "1" });
}

const fields = (formData: FormData) =>
  Object.fromEntries([...formData.entries()].map(([key, value]) => [key, String(value)]));

export async function saveIdentity(formData: FormData) {
  const { user, profile } = await profileOf();
  const parsed = identitySchema.safeParse(fields(formData));
  if (!parsed.success) back("identite", { erreur: firstError(parsed.error) });
  const input = parsed.data;
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        name: `${input.firstName} ${input.lastName}`,
        country: input.country,
        city: input.city,
      },
    }),
    db.talentProfile.update({
      where: { id: profile.id },
      data: { headline: input.headline || null },
    }),
  ]);
  await done(profile.id, "identite");
}

export async function saveSummary(formData: FormData) {
  const { profile } = await profileOf();
  const parsed = summarySchema.safeParse(fields(formData));
  if (!parsed.success) back("resume", { erreur: "invalid" });
  await db.talentProfile.update({
    where: { id: profile.id },
    data: { summary: parsed.data.summary || null },
  });
  await done(profile.id, "resume");
}

export async function saveExperience(formData: FormData) {
  const { profile } = await profileOf();
  const parsed = experienceSchema.safeParse(fields(formData));
  if (!parsed.success) back("experiences", { erreur: firstError(parsed.error) });
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
  const id = String(formData.get("id") ?? "");
  if (id) {
    await db.experience.updateMany({ where: { id, profileId: profile.id }, data });
  } else {
    await db.experience.create({ data: { ...data, profileId: profile.id } });
  }
  await done(profile.id, "experiences");
}

export async function deleteExperience(formData: FormData) {
  const { profile } = await profileOf();
  await db.experience.deleteMany({
    where: { id: String(formData.get("id")), profileId: profile.id },
  });
  await done(profile.id, "experiences");
}

export async function saveEducation(formData: FormData) {
  const { profile } = await profileOf();
  const parsed = educationSchema.safeParse(fields(formData));
  if (!parsed.success) back("formations", { erreur: firstError(parsed.error) });
  const input = parsed.data;
  const data = {
    degree: input.degree,
    level: input.level,
    field: input.field || null,
    school: input.school,
    startYear: typeof input.startYear === "number" ? input.startYear : null,
    endYear: input.inProgress || typeof input.endYear !== "number" ? null : input.endYear,
  };
  const id = String(formData.get("id") ?? "");
  if (id) {
    await db.education.updateMany({ where: { id, profileId: profile.id }, data });
  } else {
    await db.education.create({ data: { ...data, profileId: profile.id } });
  }
  await done(profile.id, "formations");
}

export async function deleteEducation(formData: FormData) {
  const { profile } = await profileOf();
  await db.education.deleteMany({
    where: { id: String(formData.get("id")), profileId: profile.id },
  });
  await done(profile.id, "formations");
}

export async function addSkill(formData: FormData) {
  const { profile } = await profileOf();
  const parsed = skillSchema.safeParse(fields(formData));
  if (!parsed.success) back("competences", { erreur: "invalid" });
  const skill = await findSkill(db, parsed.data.skill);
  if (!skill) back("competences", { erreur: "unknownSkill" });
  const existing = await db.profileSkill.findUnique({
    where: { profileId_skillId: { profileId: profile.id, skillId: skill.id } },
  });
  if (existing && formData.get("mode") !== "update") back("competences", { erreur: "duplicate" });
  const count = await db.profileSkill.count({ where: { profileId: profile.id } });
  if (!existing && count >= PROFILE_SKILLS_MAX) back("competences", { erreur: "max" });
  const data = {
    level: parsed.data.level,
    proof: parsed.data.proof ?? null,
    proofUrl: parsed.data.proofUrl || null,
  };
  await db.profileSkill.upsert({
    where: { profileId_skillId: { profileId: profile.id, skillId: skill.id } },
    // A skill verified by a Jumanly certificate keeps its level and proof.
    update: existing?.verified ? {} : data,
    create: { profileId: profile.id, skillId: skill.id, ...data },
  });
  await done(profile.id, "competences");
}

export async function removeSkill(formData: FormData) {
  const { profile } = await profileOf();
  await db.profileSkill.deleteMany({
    where: { id: String(formData.get("id")), profileId: profile.id },
  });
  await done(profile.id, "competences");
}

export async function addLanguage(formData: FormData) {
  const { profile } = await profileOf();
  const parsed = languageSchema.safeParse(fields(formData));
  if (!parsed.success) back("langues", { erreur: "invalid" });
  const languages = parseProfileLanguages(profile.languages).filter(
    (language) => language.code !== parsed.data.code,
  );
  languages.push({
    code: parsed.data.code,
    level: parsed.data.level,
    ...(parsed.data.cefr ? { cefr: parsed.data.cefr } : {}),
  });
  await db.talentProfile.update({ where: { id: profile.id }, data: { languages } });
  await done(profile.id, "langues");
}

export async function removeLanguage(formData: FormData) {
  const { profile } = await profileOf();
  const code = String(formData.get("code"));
  const languages = parseProfileLanguages(profile.languages).filter(
    (language) => language.code !== code,
  );
  await db.talentProfile.update({ where: { id: profile.id }, data: { languages } });
  await done(profile.id, "langues");
}

export async function savePreferences(formData: FormData) {
  const { profile } = await profileOf();
  const parsed = preferencesSchema.safeParse(fields(formData));
  if (!parsed.success) back("preferences", { erreur: "invalid" });
  const input = parsed.data;
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
  await db.talentProfile.update({
    where: { id: profile.id },
    data: {
      availability: input.availability,
      availableFrom: input.availableFrom ? new Date(`${input.availableFrom}T00:00:00Z`) : null,
      notice: input.notice || null,
      desiredJobTitles: splitList(input.desiredJobTitles),
      desiredLocations: splitList(input.desiredLocations),
      desiredContracts: contracts,
      remotePreferences: remote,
      relocation: input.relocation === "on",
      salaryMin: typeof input.salaryMin === "number" ? input.salaryMin : null,
      salaryPeriod: input.salaryPeriod,
    },
  });
  await done(profile.id, "preferences");
}

export async function saveVisibility(formData: FormData) {
  const { profile } = await profileOf();
  const visibility = String(formData.get("visibility"));
  if (!["private", "recruiters", "anonymous"].includes(visibility))
    back("visibilite", { erreur: "invalid" });
  await db.talentProfile.update({
    where: { id: profile.id },
    data: { visibility: visibility as "private" | "recruiters" | "anonymous" },
  });
  back("visibilite", { ok: "1", visibilite: visibility });
}
