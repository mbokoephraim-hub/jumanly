"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { limit } from "@/server/entitlements";
import {
  allowedTemplates,
  cvFromProfile,
  cvSectionIds,
  MAX_CVS,
  moveSection,
  parseCv,
  toggleSection,
  type CvContent,
} from "@/server/services/cv";
import { ensureProfile, getFullProfile } from "@/server/services/profile";

async function owner() {
  const user = await requireUser("/app/career/cv");
  const profile = await ensureProfile(db, user.id);
  return { user, profile };
}

async function ownedCv(profileId: string, id: FormDataEntryValue | null) {
  const cv = await db.document.findFirst({
    where: { id: String(id ?? ""), profileId, kind: "cv" },
  });
  if (!cv) redirect("/app/career/cv");
  return cv;
}

function back(id: string, params: Record<string, string> = {}): never {
  const query = new URLSearchParams(params).toString();
  redirect(`/app/career/cv/${id}${query ? `?${query}` : ""}`);
}

async function save(
  id: string,
  content: CvContent,
  data: { title?: string; templateId?: string } = {},
) {
  await db.document.update({ where: { id }, data: { ...data, content } });
}

export async function createCv() {
  const { user, profile } = await owner();
  const count = await db.document.count({ where: { profileId: profile.id, kind: "cv" } });
  if (count >= MAX_CVS) redirect("/app/career/cv?erreur=limite");
  const t = await getTranslations("career.cv");
  const full = await getFullProfile(db, user.id);
  const cv = await db.document.create({
    data: {
      profileId: profile.id,
      kind: "cv",
      title: count === 0 ? t("default") : `${t("default")} ${count + 1}`,
      templateId: "classic",
      isPrimary: count === 0,
      content: cvFromProfile(full),
    },
  });
  back(cv.id);
}

export async function refreshCvFromProfile(formData: FormData) {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const full = await getFullProfile(db, user.id);
  await save(cv.id, cvFromProfile(full, parseCv(cv.content)));
  back(cv.id, { ok: "profil" });
}

const detailsSchema = z.object({
  title: z.string().trim().min(1).max(80),
  summary: z.string().trim().max(1000),
  showEmail: z.literal("on").optional(),
});

export async function updateCvDetails(formData: FormData) {
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const parsed = detailsSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") ?? "",
    showEmail: formData.get("showEmail") ?? undefined,
  });
  if (!parsed.success) back(cv.id, { erreur: "1" });
  const content = parseCv(cv.content);
  await save(
    cv.id,
    {
      ...content,
      summary: parsed.data.summary,
      info: { ...content.info, showEmail: parsed.data.showEmail === "on" },
    },
    { title: parsed.data.title },
  );
  back(cv.id, { ok: "1" });
}

const sectionSchema = z.object({
  section: z.enum(cvSectionIds),
  move: z.enum(["up", "down", "toggle"]),
});

export async function changeCvSection(formData: FormData) {
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const parsed = sectionSchema.safeParse({
    section: formData.get("section"),
    move: formData.get("move"),
  });
  if (!parsed.success) back(cv.id);
  const content = parseCv(cv.content);
  const { section, move } = parsed.data;
  await save(
    cv.id,
    move === "toggle"
      ? toggleSection(content, section)
      : moveSection(content, section, move === "up" ? -1 : 1),
  );
  back(cv.id);
}

/** Templates beyond `career.cv.templates.max` stay locked (CLAUDE.md § 2: entitlement keys only). */
export async function setCvTemplate(formData: FormData) {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const template = String(formData.get("template") ?? "");
  const max = await limit(db, { type: "user", id: user.id }, "career.cv.templates.max");
  if (!(allowedTemplates(max) as string[]).includes(template)) back(cv.id, { erreur: "modele" });
  await db.document.update({ where: { id: cv.id }, data: { templateId: template } });
  back(cv.id, { ok: "modele" });
}

export async function setPrimaryCv(formData: FormData) {
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  await db.$transaction([
    db.document.updateMany({
      where: { profileId: profile.id, kind: "cv" },
      data: { isPrimary: false },
    }),
    db.document.update({ where: { id: cv.id }, data: { isPrimary: true } }),
  ]);
  back(cv.id, { ok: "1" });
}

export async function duplicateCv(formData: FormData) {
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const count = await db.document.count({ where: { profileId: profile.id, kind: "cv" } });
  if (count >= MAX_CVS) back(cv.id, { erreur: "limite" });
  const copy = await db.document.create({
    data: {
      profileId: profile.id,
      kind: "cv",
      title: `${cv.title} (2)`.slice(0, 80),
      templateId: cv.templateId,
      content: parseCv(cv.content),
    },
  });
  back(copy.id);
}

export async function deleteCv(formData: FormData) {
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  await db.document.delete({ where: { id: cv.id } });
  if (cv.isPrimary) {
    const next = await db.document.findFirst({
      where: { profileId: profile.id, kind: "cv" },
      orderBy: { updatedAt: "desc" },
    });
    if (next) await db.document.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
  redirect("/app/career/cv?ok=supprime");
}
