"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { cvFonts, type CvFontCode } from "@/features/cv/render/palette";
import { cvDensities, cvTitleLanguages } from "@/features/cv/style";
import { DEFAULT_TEMPLATE_ID, findTemplate } from "@/features/cv/templates/registry";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  applyTemplate,
  canUseTemplate,
  cvFromProfile,
  cvSectionIds,
  MAX_CVS,
  parseCv,
  toggleSection,
  updateCvStyle,
  type CvContent,
} from "@/server/services/cv";
import {
  decideSuggestion,
  improveCvSummary,
  pendingSuggestions,
  targetSkillsFor,
  type ImproveResult,
} from "@/server/services/cv-coach";
import { importCvPhoto } from "@/server/services/cv-import";
import { CV_FILE_MAX_BYTES } from "@/server/services/cv-file";
import { ensureProfile, getFullProfile } from "@/server/services/profile";

/**
 * Créer un CV (docs/carriere-v3, captures 06 to 15): the four steps of a CV on the phone and
 * the ways in (a template, Orbi, an import). Each write follows valider → session → service;
 * the template's level is checked by `applyTemplate` (`career.cv.templates.access`), Orbi's
 * consent, right and credits by `runAi`.
 */

type Result = { ok: true } | { ok: false; error: string };

const id = z.string().min(1).max(60);

async function owner() {
  const user = await requireUser("/app/career/cv/nouveau");
  const profile = await ensureProfile(db, user.id);
  return { user, profile };
}

async function ownedCv(profileId: string, raw: string) {
  const parsed = id.safeParse(raw);
  if (!parsed.success) return null;
  return db.document.findFirst({ where: { id: parsed.data, profileId, kind: "cv" } });
}

async function saveContent(cvId: string, content: CvContent) {
  await db.document.update({ where: { id: cvId }, data: { content } });
}

/** A CV filled from the profile, « CV », « CV 2 »…, the first one used by default. */
async function newCv(userId: string, profileId: string) {
  const count = await db.document.count({ where: { profileId, kind: "cv" } });
  if (count >= MAX_CVS) return null;
  const t = await getTranslations("career.cv");
  return db.document.create({
    data: {
      profileId,
      kind: "cv",
      title: count === 0 ? t("default") : `${t("default")} ${count + 1}`,
      templateId: DEFAULT_TEMPLATE_ID,
      isPrimary: count === 0,
      content: cvFromProfile(await getFullProfile(db, userId)),
    },
  });
}

/** « Continuer » or « Utiliser ce modèle » (captures 07, 08): the CV in that template, then Contenu. */
export async function startCvFromTemplateAction(formData: FormData) {
  const template = findTemplate(String(formData.get("template") ?? "").slice(0, 40));
  const { user, profile } = await owner();
  if (!template) redirect("/app/career/cv/nouveau?etape=modele");
  if (!(await canUseTemplate(db, { type: "user", id: user.id }, template)))
    redirect(`/app/career/cv/nouveau?etape=modele&modele=${template.id}&erreur=modele`);
  const cv = await newCv(user.id, profile.id);
  if (!cv) redirect("/app/career/cv/nouveau?erreur=limite");
  await applyTemplate(db, user.id, cv.id, template.id);
  refresh();
  redirect(`/app/career/cv/${cv.id}?etape=contenu`);
}

/** « Appliquer ce modèle » on an existing CV (step Modèle): only the layout changes. */
export async function setCvTemplateStepAction(formData: FormData) {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, String(formData.get("id") ?? ""));
  if (!cv) redirect("/app/career/cv");
  const template = String(formData.get("template") ?? "").slice(0, 40);
  const result = await applyTemplate(db, user.id, cv.id, template);
  refresh();
  if (result === "locked")
    redirect(
      `/app/career/cv/${cv.id}?etape=modele&modele=${encodeURIComponent(template)}&erreur=modele`,
    );
  redirect(`/app/career/cv/${cv.id}?etape=contenu`);
}

/** Orbi lays the CV out in « Moderne » when the person's plan includes it. */
const ORBI_TEMPLATE = "moderne";

/**
 * « Orbi le prépare » (capture 12): a CV from the profile and the Cap, the template Orbi picks,
 * and a summary proposed (not applied: the person accepts it on Contenu).
 */
export async function prepareCvWithOrbiAction(): Promise<
  { ok: true; id: string; orbi: ImproveResult } | { ok: false; error: "limit" }
> {
  const { user, profile } = await owner();
  const cv = await newCv(user.id, profile.id);
  if (!cv) return { ok: false, error: "limit" };
  await applyTemplate(db, user.id, cv.id, ORBI_TEMPLATE);
  const orbi = await improveCvSummary(db, user.id, cv.id);
  refresh();
  return { ok: true, id: cv.id, orbi };
}

/** The switch of a section on Contenu (capture 09). */
export async function toggleCvSectionAction(cvId: string, section: string): Promise<Result> {
  const parsed = z.enum(cvSectionIds).safeParse(section);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  await saveContent(cv.id, toggleSection(parseCv(cv.content), parsed.data));
  refresh();
  return { ok: true };
}

/** « Résumé », written by the person in the sheet of Contenu. */
export async function saveCvSummaryAction(cvId: string, summary: string): Promise<Result> {
  const parsed = z.string().trim().max(1000).safeParse(summary);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  await saveContent(cv.id, { ...parseCv(cv.content), summary: parsed.data });
  refresh();
  return { ok: true };
}

/**
 * « Réécrire avec Orbi » (capture 09): a new summary proposed, shown in place of the old one
 * until the person accepts or refuses it.
 */
export async function rewriteCvSummaryAction(
  cvId: string,
): Promise<{ ok: true; suggestion: { id: string; text: string } } | { ok: false; error: string }> {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  const result = await improveCvSummary(db, user.id, cv.id);
  if (result !== "done") return { ok: false, error: result };
  const pending = await pendingSuggestions(db, user.id, cv.id);
  const summary = pending.find((item) => item.payload.target.section === "summary");
  if (!summary?.payload.after) return { ok: false, error: "same" };
  return { ok: true, suggestion: { id: summary.id, text: summary.payload.after } };
}

const decisionSchema = z.object({
  suggestion: id,
  decision: z.enum(["applied", "ignored"]),
});

/** « Garder » or « Refuser » on Orbi's summary: nothing changes without this tap. */
export async function decideCvSummaryAction(raw: z.input<typeof decisionSchema>): Promise<Result> {
  const parsed = decisionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { user } = await owner();
  const done = await decideSuggestion(db, user.id, parsed.data.suggestion, parsed.data.decision);
  refresh();
  return done ? { ok: true } : { ok: false, error: "obsolete" };
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
]);

/** Mise en forme (capture 10): each setting is saved as soon as it is touched. */
export async function saveCvStyleAction(
  cvId: string,
  raw: z.input<typeof styleSchema>,
): Promise<Result> {
  const parsed = styleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  const input = parsed.data;
  const result = await updateCvStyle(db, user.id, cv.id, (style) => {
    switch (input.setting) {
      case "accent":
        return { ...style, accent: input.value };
      case "font":
        return { ...style, font: input.value };
      case "density":
        return { ...style, density: input.value };
      case "titlesLanguage":
        return { ...style, titlesLanguage: input.value };
      case "showPhoto":
        return { ...style, showPhoto: input.value === "on" };
    }
  });
  refresh();
  return result === "saved" ? { ok: true } : { ok: false, error: result };
}

/** « Nom du CV » (capture 11). */
export async function renameCvAction(cvId: string, title: string): Promise<Result> {
  const parsed = z.string().trim().min(1).max(80).safeParse(title);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  await db.document.update({ where: { id: cv.id }, data: { title: parsed.data } });
  refresh();
  return { ok: true };
}

/**
 * « Utiliser par défaut pour postuler » (capture 11). Turning it off keeps the CV by default
 * when it is the only one: there is always one CV to send.
 */
export async function setCvPrimaryAction(cvId: string, on: boolean): Promise<Result> {
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  if (on) {
    await db.$transaction([
      db.document.updateMany({
        where: { profileId: profile.id, kind: "cv" },
        data: { isPrimary: false },
      }),
      db.document.update({ where: { id: cv.id }, data: { isPrimary: true } }),
    ]);
  } else if (cv.isPrimary) {
    const next = await db.document.findFirst({
      where: { profileId: profile.id, kind: "cv", id: { not: cv.id } },
      orderBy: { updatedAt: "desc" },
    });
    if (!next) return { ok: false, error: "only" };
    await db.$transaction([
      db.document.update({ where: { id: cv.id }, data: { isPrimary: false } }),
      db.document.update({ where: { id: next.id }, data: { isPrimary: true } }),
    ]);
  }
  refresh();
  return { ok: true };
}

const fixable = z.enum(["headline", "skills", "keywords", "languages"]);

/**
 * « Corriger » (capture 11): what can be taken from the profile is put on the CV at once (the
 * title, the skills, those the target jobs ask for, the languages). Nothing is invented: when
 * the profile has nothing to give, the person is sent to the place where they write it.
 */
export async function fixCvCheckAction(
  cvId: string,
  check: string,
): Promise<{ ok: true; added: number } | { ok: false; error: "invalid" | "missing" | "profile" }> {
  const parsed = fixable.safeParse(check);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  const content = parseCv(cv.content);
  const fromProfile = cvFromProfile(await getFullProfile(db, user.id));
  let next: CvContent = content;
  let added = 0;
  switch (parsed.data) {
    case "headline":
      if (fromProfile.info.headline) {
        next = { ...content, info: { ...content.info, headline: fromProfile.info.headline } };
        added = 1;
      }
      break;
    case "languages": {
      const known = new Set(content.languages.map((item) => item.code));
      const fresh = fromProfile.languages.filter((item) => !known.has(item.code));
      next = { ...content, languages: [...content.languages, ...fresh] };
      added = fresh.length;
      break;
    }
    case "skills":
    case "keywords": {
      const known = new Set(content.skills.map((skill) => skill.name.toLowerCase()));
      const wanted =
        parsed.data === "keywords"
          ? new Set((await targetSkillsFor(db, user.id)).skills.map((name) => name.toLowerCase()))
          : null;
      const fresh = fromProfile.skills.filter(
        (skill) =>
          !known.has(skill.name.toLowerCase()) &&
          (wanted === null || wanted.has(skill.name.toLowerCase())),
      );
      next = { ...content, skills: [...content.skills, ...fresh] };
      added = fresh.length;
      break;
    }
  }
  if (added === 0) return { ok: false, error: "profile" };
  await saveContent(cv.id, next);
  refresh();
  return { ok: true, added };
}

const PHOTO_TYPES = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
} as const;
type PhotoType = keyof typeof PHOTO_TYPES;

/** The kind of picture from its first bytes, never from its name alone. */
function photoType(bytes: Uint8Array): PhotoType | null {
  for (const [type, magic] of Object.entries(PHOTO_TYPES) as [PhotoType, readonly number[]][])
    if (magic.every((byte, index) => bytes[index] === byte)) return type;
  return null;
}

/**
 * « Photographier un CV papier » (capture 13): the picture, made lighter on the phone, is read
 * by Orbi and never kept; what was found waits on « Voici ce qu’Orbi a trouvé ».
 */
export async function readCvPhotoAction(formData: FormData) {
  const { user } = await owner();
  const back = "/app/career/cv/nouveau?etape=import";
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) redirect(`${back}&erreur=empty`);
  if (file.size > CV_FILE_MAX_BYTES) redirect(`${back}&erreur=size`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = photoType(bytes);
  if (!type) redirect(`${back}&erreur=format`);
  const result = await importCvPhoto(
    db,
    user.id,
    { mediaType: type, data: Buffer.from(bytes).toString("base64") },
    { name: file.name || "photo.jpg", kind: "image", pages: 1, size: file.size },
  );
  refresh();
  if (!result.ok) redirect(`${back}&erreur=${result.error === "ai" ? "photo" : "orbi"}`);
  redirect("/app/career/cv/nouveau?etape=trouve");
}
