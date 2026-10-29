"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  ensureProfile,
  educationSchema,
  experienceSchema,
  findOrCreateSkill,
  headSchema,
  languageSchema,
  monthToDate,
  parseProfileLanguages,
  PROFILE_SKILLS_MAX,
  refreshCompleteness,
  searchSchema,
  skillSchema,
  splitList,
  contractPreferences,
} from "@/server/services/profile";
import { PhotoError, removePhoto, savePhoto } from "@/server/services/profile-photo";

/**
 * Mon profil (planche talent-4 § 3). Each form comes from a screen of `/app/profil` (a sub-page or
 * a sheet) and goes back to the profile with its section open; an error goes back to the form.
 */
const PROFILE = "/app/profil";

/** Sections of the profile, also their anchors. */
type Section =
  | "identite"
  | "competences"
  | "projets"
  | "experiences"
  | "etudes"
  | "langues"
  | "recherche"
  | "visibilite";

/** The screen the form was on: a page of the profile only. */
function formPage(formData: FormData) {
  const value = String(formData.get("retour") ?? "");
  return /^\/app\/profil(\/[a-z]+)?$/.test(value) ? value : PROFILE;
}

/** The windows of the web profile (`/app/profil?fenetre=…`) a form can come back to. */
const WINDOWS = ["modifier", "experience", "competence", "recherche"];

function failed(formData: FormData, error: string, extra: Record<string, string> = {}): never {
  const id = String(formData.get("id") ?? "");
  const fenetre = String(formData.get("fenetre") ?? "");
  const params = new URLSearchParams({
    ...(WINDOWS.includes(fenetre) ? { fenetre } : {}),
    ...(id ? { id } : {}),
    ...extra,
    erreur: error,
  });
  redirect(`${formPage(formData)}?${params}`);
}

function firstError(error: z.ZodError) {
  return error.issues[0]?.message === "endBeforeStart" ? "endBeforeStart" : "invalid";
}

async function profileOf() {
  const user = await requireUser(PROFILE);
  const profile = await ensureProfile(db, user.id);
  return { user, profile };
}

async function done(profileId: string, section: Section): Promise<never> {
  await refreshCompleteness(db, profileId);
  redirect(`${PROFILE}?ok=${section}#${section}`);
}

const fields = (formData: FormData) =>
  Object.fromEntries([...formData.entries()].map(([key, value]) => [key, String(value)]));

/** « Modifier le profil »: title, summary, country and city. */
export async function saveHeadAction(formData: FormData) {
  const { user, profile } = await profileOf();
  const parsed = headSchema.safeParse(fields(formData));
  if (!parsed.success) failed(formData, "invalid");
  const input = parsed.data;
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { country: input.country, city: input.city },
    }),
    db.talentProfile.update({
      where: { id: profile.id },
      data: { headline: input.headline || null, summary: input.summary || null },
    }),
  ]);
  await done(profile.id, "identite");
}

export async function saveExperience(formData: FormData) {
  const { profile } = await profileOf();
  const raw = fields(formData);
  const parsed = experienceSchema.safeParse({ type: "job", location: "", ...raw });
  if (!parsed.success) failed(formData, firstError(parsed.error));
  const input = parsed.data;
  const data = {
    title: input.title,
    company: input.company,
    startDate: monthToDate(input.start),
    endDate: input.current || !input.end ? null : monthToDate(input.end),
    description: input.description,
  };
  const id = String(formData.get("id") ?? "");
  if (id) {
    // A company renamed here is no longer the page chosen on the phone: its logo and link go.
    const before = await db.experience.findFirst({
      where: { id, profileId: profile.id },
      select: { company: true },
    });
    const renamed = before !== null && before.company !== input.company;
    await db.experience.updateMany({
      where: { id, profileId: profile.id },
      data: { ...data, ...(renamed ? { organizationId: null } : {}) },
    });
  } else {
    await db.experience.create({
      data: { ...data, type: input.type, location: input.location || null, profileId: profile.id },
    });
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
  if (!parsed.success) redirect(`${PROFILE}?erreur=${firstError(parsed.error)}#etudes`);
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
  await done(profile.id, "etudes");
}

export async function deleteEducation(formData: FormData) {
  const { profile } = await profileOf();
  await db.education.deleteMany({
    where: { id: String(formData.get("id")), profileId: profile.id },
  });
  await done(profile.id, "etudes");
}

/**
 * « Compétences »: a skill of the reference list (or typed, when the list has none), its level
 * and its proof. The proof is one of the person's attestations or projects (`proofRef`), or none
 * (« Déclarée seulement »).
 */
export async function saveSkill(formData: FormData) {
  const { user, profile } = await profileOf();
  const parsed = skillSchema.safeParse(fields(formData));
  const q = String(formData.get("q") ?? "").slice(0, 80);
  if (!parsed.success) failed(formData, "invalid", q ? { q } : {});
  const skill = await findOrCreateSkill(db, parsed.data.skill);
  if (!skill) failed(formData, "unknownSkill", q ? { q } : {});
  const existing = await db.profileSkill.findUnique({
    where: { profileId_skillId: { profileId: profile.id, skillId: skill.id } },
  });
  const count = await db.profileSkill.count({ where: { profileId: profile.id } });
  if (!existing && count >= PROFILE_SKILLS_MAX) failed(formData, "max");
  const [kind, ref] = String(formData.get("preuve") ?? "").split(":");
  let proof: { proof: string | null; proofRef: string | null } = { proof: null, proofRef: null };
  if (kind === "certificate" && ref) {
    const certificate = await db.certificate.findFirst({
      where: { id: ref, enrollment: { userId: user.id } },
      select: { id: true },
    });
    if (certificate) proof = { proof: "certificate", proofRef: certificate.id };
  } else if (kind === "project" && ref) {
    const project = await db.document.findFirst({
      where: { id: ref, profileId: profile.id, kind: "portfolio_item" },
      select: { id: true },
    });
    if (project) proof = { proof: "project", proofRef: project.id };
  } else if (kind === "keep" && existing) {
    proof = { proof: existing.proof, proofRef: existing.proofRef };
  }
  const data = { level: parsed.data.level, ...proof, proofUrl: null };
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
  if (!parsed.success) redirect(`${PROFILE}?erreur=invalid#langues`);
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

/**
 * « Ce que je cherche »: jobs and places (kept ones plus new ones), contract and work mode, the
 * wished salary and whether the person is available now.
 */
export async function saveSearch(formData: FormData) {
  const { profile } = await profileOf();
  const parsed = searchSchema.safeParse(fields(formData));
  if (!parsed.success) failed(formData, "invalid");
  const input = parsed.data;
  const list = (name: string, added: string) =>
    splitList([...formData.getAll(name).map(String), added].join(","));
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
      // « Disponible » on: open now; off: the person keeps listening without being available.
      availability:
        input.available === "on"
          ? "open"
          : profile.availability === "open"
            ? "listening"
            : profile.availability,
      availableFrom: input.available === "on" ? null : profile.availableFrom,
      desiredJobTitles: list("jobs", input.newJob),
      desiredLocations: list("places", input.newPlace),
      desiredContracts: contracts,
      remotePreferences: remote,
      salaryMin: typeof input.salaryMin === "number" ? input.salaryMin : null,
      salaryPeriod: "month",
    },
  });
  await done(profile.id, "recherche");
}

export async function saveVisibility(formData: FormData) {
  const { profile } = await profileOf();
  const visibility = String(formData.get("visibility"));
  if (!["private", "recruiters", "anonymous"].includes(visibility))
    redirect(`${PROFILE}?erreur=invalid`);
  await db.talentProfile.update({
    where: { id: profile.id },
    data: { visibility: visibility as "private" | "recruiters" | "anonymous" },
  });
  redirect(`${PROFILE}?ok=visibilite`);
}

/**
 * The photo of « Modifier le profil »: the square JPEG cropped in the browser or, without
 * JavaScript, the file picked by the camera or the gallery field (one of them is empty).
 */
export async function savePhotoAction(formData: FormData) {
  const { user } = await profileOf();
  const file = formData
    .getAll("photo")
    .find((entry): entry is File => entry instanceof File && entry.size > 0);
  if (!file) redirect("/app/profil/modifier?photo=1&erreur=photo");
  try {
    await savePhoto(db, user.id, new Uint8Array(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof PhotoError) redirect(`/app/profil/modifier?photo=1&erreur=${error.code}`);
    throw error;
  }
  revalidatePath("/app", "layout");
  redirect("/app/profil/modifier?ok=photo");
}

export async function removePhotoAction() {
  const { user } = await profileOf();
  await removePhoto(db, user.id);
  revalidatePath("/app", "layout");
  redirect("/app/profil/modifier?ok=photo-retiree");
}
