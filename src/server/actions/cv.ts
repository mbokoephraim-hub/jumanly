"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { darkenToContrast, cvFonts, type CvFontCode } from "@/features/cv/render/palette";
import {
  cvDensities,
  cvTitleLanguages,
  moveBlock,
  switchColumn,
  togglePageBreak,
} from "@/features/cv/style";
import { cvBlockTypes, DEFAULT_TEMPLATE_ID } from "@/features/cv/templates/registry";
import {
  applyTemplate,
  cvFromProfile,
  cvSectionIds,
  MAX_CVS,
  parseCv,
  toggleSection,
  updateCvStyle,
  type CvContent,
} from "@/server/services/cv";
import { decideSuggestion, runCvCoach } from "@/server/services/cv-coach";
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
      templateId: DEFAULT_TEMPLATE_ID,
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
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+\d\s().-]*$/),
});

export async function updateCvDetails(formData: FormData) {
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const parsed = detailsSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") ?? "",
    showEmail: formData.get("showEmail") ?? undefined,
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    const phone = parsed.error.issues.some((issue) => issue.path[0] === "phone");
    back(cv.id, { erreur: phone ? "telephone" : "1" });
  }
  const content = parseCv(cv.content);
  await save(
    cv.id,
    {
      ...content,
      summary: parsed.data.summary,
      info: {
        ...content.info,
        showEmail: parsed.data.showEmail === "on",
        phone: parsed.data.phone,
      },
    },
    { title: parsed.data.title },
  );
  back(cv.id, { ok: "1" });
}

const sectionSchema = z.object({
  section: z.enum(cvSectionIds),
  move: z.enum(["up", "down", "toggle"]),
});

/** Sections of the editor: shown or hidden in the content, moved in the settings (§ 4.6). */
export async function changeCvSection(formData: FormData) {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const parsed = sectionSchema.safeParse({
    section: formData.get("section"),
    move: formData.get("move"),
  });
  if (!parsed.success) back(cv.id);
  const { section, move } = parsed.data;
  if (move === "toggle") {
    await save(cv.id, toggleSection(parseCv(cv.content), section));
  } else {
    await updateCvStyle(db, user.id, cv.id, (style, template) =>
      moveBlock(template, style, cvSectionIds, section, move === "up" ? -1 : 1),
    );
  }
  back(cv.id);
}

/**
 * « Utiliser ce modèle »: the entitlement `career.cv.templates.access` is checked by the service
 * (CLAUDE.md § 2: entitlement keys only). The content never changes.
 */
export async function setCvTemplate(formData: FormData) {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const result = await applyTemplate(db, user.id, cv.id, String(formData.get("template") ?? ""));
  if (result === "locked") back(cv.id, { erreur: "modele", vue: "style" });
  if (result !== "applied") back(cv.id, { erreur: "1", vue: "style" });
  back(cv.id, { ok: "modele", vue: "style" });
}

const styleSchema = z.discriminatedUnion("setting", [
  z.object({ setting: z.literal("accent"), value: z.string().trim().max(20) }),
  z.object({
    setting: z.literal("font"),
    value: z.enum(cvFonts.map((font) => font.code) as [CvFontCode, ...CvFontCode[]]),
  }),
  z.object({ setting: z.literal("density"), value: z.enum(cvDensities) }),
  z.object({ setting: z.literal("titlesLanguage"), value: z.enum(cvTitleLanguages) }),
  z.object({ setting: z.literal("showPhoto"), value: z.enum(["on", "off"]) }),
  z.object({ setting: z.literal("column"), value: z.enum(cvBlockTypes) }),
  z.object({ setting: z.literal("break"), value: z.string().trim().min(1).max(80) }),
  z.object({ setting: z.literal("fitOne"), value: z.string().optional() }),
]);

/** « Mise en forme »: each setting is saved at once (§ 8.2). */
export async function updateCvStyleAction(formData: FormData) {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const raw = formData.get("value");
  const parsed = styleSchema.safeParse({
    setting: formData.get("setting"),
    value: typeof raw === "string" ? raw : undefined,
  });
  if (!parsed.success) back(cv.id, { erreur: "1", vue: "style" });
  const input = parsed.data;
  // A palette code (« marine ») or a custom colour (« #1B365D », « 1b365d »).
  const accent =
    input.setting !== "accent"
      ? ""
      : /^#?[0-9a-f]{6}$/i.test(input.value)
        ? `#${input.value.replace("#", "").toUpperCase()}`
        : input.value;
  const result = await updateCvStyle(db, user.id, cv.id, (style, template) => {
    switch (input.setting) {
      case "accent":
        return { ...style, accent };
      case "font":
        return { ...style, font: input.value };
      case "density":
        return { ...style, density: input.value };
      case "titlesLanguage":
        return { ...style, titlesLanguage: input.value };
      case "showPhoto":
        return { ...style, showPhoto: input.value === "on" };
      case "column":
        return switchColumn(template, style, input.value);
      case "break":
        return togglePageBreak(style, input.value);
      case "fitOne":
        // « Faire tenir sur une page »: compact density; the preview says if it is not enough.
        return { ...style, density: "compact" };
    }
  });
  if (result === "tooLight") {
    back(cv.id, { erreur: "couleur", proposee: darkenToContrast(accent), vue: "style" });
  }
  if (result !== "saved") back(cv.id, { erreur: "1", vue: "style" });
  back(cv.id, { vue: "style", ...(input.setting === "fitOne" ? { ajuste: "1" } : {}) });
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
      ...(cv.style ? { style: cv.style as Prisma.InputJsonValue } : {}),
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

/** « Analyser mon CV » : the coach checks consent, credits and logs the call (src/server/ai). */
export async function runCoachAction(formData: FormData) {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const result = await runCvCoach(db, user.id, cv.id);
  refresh();
  back(cv.id, { coach: result });
}

export async function decideSuggestionAction(formData: FormData) {
  const decision = z.enum(["applied", "ignored"]).safeParse(formData.get("decision"));
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  if (!decision.success) back(cv.id);
  const done = await decideSuggestion(
    db,
    user.id,
    String(formData.get("suggestion") ?? ""),
    decision.data,
  );
  refresh();
  back(cv.id, { suggestion: done ? decision.data : "obsolete" });
}
