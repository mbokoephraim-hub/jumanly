"use server";

import { refresh } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { cvFonts, type CvFontCode } from "@/features/cv/render/palette";
import { cvDensities, cvStyleSchema, cvTitleLanguages } from "@/features/cv/style";
import { DEFAULT_TEMPLATE_ID, findTemplate } from "@/features/cv/templates/registry";
import { PROFILE_COLORS } from "@/lib/profile-colors";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  applyTemplate,
  canUseTemplate,
  cvFromProfile,
  isEmptyCv,
  cvContentInputSchema,
  cvSectionIds,
  MAX_CVS,
  parseCv,
  toggleSection,
  updateCvStyle,
  type CvContent,
} from "@/server/services/cv";
import {
  cvTextKinds,
  decideSuggestion,
  improveCvSummary,
  rewriteCvTexts,
  pendingSuggestions,
  targetSkillsFor,
  type ImproveResult,
} from "@/server/services/cv-coach";
import { applyImport, importCvPhoto, parseImport } from "@/server/services/cv-import";
import {
  dropImportedFile,
  holdImportedFile,
  keepImportedFile,
} from "@/server/services/cv-original";
import { fileStorage } from "@/server/storage";
import {
  applyCvIntoProfile,
  cvFromExtraction,
  planSize,
  previewCvIntoProfile,
} from "@/server/services/cv-to-profile";
import { CV_FILE_MAX_BYTES } from "@/server/services/cv-file";
import { ensureProfile, getFullProfile } from "@/server/services/profile";
import { tailorCv } from "@/server/services/career-documents";
import { blankCv, cvFromWholeProfile, cvStartModes } from "@/server/services/cv-start";
import { can } from "@/server/entitlements";

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

/**
 * « Mes informations » (Ephraïm, 29/10): the whole form, saved while the talent types and on
 * « Continuer ». The CV only; the profile stays as it is.
 */
export async function saveCvContentAction(cvId: string, raw: unknown): Promise<Result> {
  const parsed = cvContentInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv || cv.fileKey) return { ok: false, error: "missing" };
  const content: CvContent = {
    ...parsed.data,
    achievements: parsed.data.achievements.filter(Boolean),
    references: parsed.data.references.filter((item) => item.name),
    links: parsed.data.links.filter((item) => item.url),
  };
  await saveContent(cv.id, content);
  return { ok: true };
}

/** « Couleur » in the menu ··· of a CV (Ephraïm, 29/10): a colour of the profile palette, or none. */
export async function setCvColorAction(cvId: string, color: string | null): Promise<Result> {
  const parsed = z.enum(PROFILE_COLORS).nullable().safeParse(color);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  await db.document.update({
    where: { id: cv.id },
    data: { colorTag: parsed.data, updatedAt: cv.updatedAt },
  });
  refresh();
  return { ok: true };
}

/**
 * « Supprimer » on the CVs selected in the library (Ephraïm, 29/10): each one goes with its
 * imported file; copies sent with applications stay. A CV by default is replaced by the most
 * recent one left.
 */
export async function deleteCvsAction(
  ids: string[],
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const parsed = z.array(id).min(1).max(MAX_CVS).safeParse(ids);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { profile } = await owner();
  const cvs = await db.document.findMany({
    where: { id: { in: parsed.data }, profileId: profile.id, kind: "cv" },
  });
  if (cvs.length === 0) return { ok: false, error: "missing" };
  await db.document.deleteMany({ where: { id: { in: cvs.map((cv) => cv.id) } } });
  const storage = fileStorage(db);
  for (const cv of cvs) if (cv.fileKey) await storage.remove(cv.fileKey);
  if (cvs.some((cv) => cv.isPrimary)) {
    const next = await db.document.findFirst({
      where: { profileId: profile.id, kind: "cv" },
      orderBy: { updatedAt: "desc" },
    });
    if (next) await db.document.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
  refresh();
  return { ok: true, count: cvs.length };
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
  // Replace: « Retour » from Contenu must not land on the template picker and make a second CV.
  redirect(`/app/career/cv/${cv.id}?etape=contenu`, RedirectType.replace);
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
  redirect(`/app/career/cv/${cv.id}?etape=contenu`, RedirectType.replace);
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
 * by Orbi and waits, to be kept if the talent chooses so; what was found waits on « Voici ce qu’Orbi a trouvé ».
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
  if (result.ok)
    await holdImportedFile(fileStorage(db), user.id, result.id, { contentType: type, bytes });
  refresh();
  if (!result.ok) redirect(`${back}&erreur=${result.error === "ai" ? "photo" : "orbi"}`);
  redirect("/app/career/cv/nouveau?etape=trouve");
}

/**
 * « Reprendre mon profil » (Ephraïm, 27/10): an empty CV is filled with what the profile holds,
 * so the PDF is the real CV and never an empty page. The CV's settings stay.
 */
export async function fillCvFromProfileAction(
  cvId: string,
): Promise<{ ok: true } | { ok: false; error: "missing" | "profile" }> {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  const previous = parseCv(cv.content);
  const whole = await cvFromWholeProfile(db, user.id);
  // Everything the profile holds, in the boxes; the CV's own choices stay.
  const content: CvContent = {
    ...whole,
    info: { ...whole.info, showEmail: previous.info.showEmail, phone: previous.info.phone },
    sections: previous.sections,
    hiddenExtras: previous.hiddenExtras,
  };
  if (isEmptyCv(content)) return { ok: false, error: "profile" };
  await saveContent(cv.id, content);
  refresh();
  return { ok: true };
}

/** What « Ajouter à mon profil » would add, counted by part, for the sheet that asks first. */
export async function previewCvIntoProfileAction(cvId: string): Promise<
  | {
      ok: true;
      counts: {
        headline: number;
        summary: number;
        experiences: number;
        educations: number;
        skills: number;
        languages: number;
      };
      total: number;
    }
  | { ok: false; error: "missing" }
> {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  const plan = await previewCvIntoProfile(db, user.id, parseCv(cv.content));
  return {
    ok: true,
    counts: {
      headline: plan.headline ? 1 : 0,
      summary: plan.summary ? 1 : 0,
      experiences: plan.experiences.length,
      educations: plan.educations.length,
      skills: plan.skills.length,
      languages: plan.languages.length,
    },
    total: planSize(plan),
  };
}

/** « Ajouter à mon profil »: only what the profile does not have yet; nothing is replaced. */
export async function addCvToProfileAction(
  cvId: string,
): Promise<{ ok: true; added: number } | { ok: false; error: "missing" }> {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  const added = await applyCvIntoProfile(db, user.id, parseCv(cv.content));
  refresh();
  return { ok: true, added };
}

/**
 * The three ways out of « Voici ce qu’Orbi a trouvé » (Ephraïm, 27/10). Each one makes a CV in
 * « Mes CV » from what was read; the file itself is kept unless a new CV is being made.
 */
type ImportChoice = "keep" | "profile" | "new";

async function cvFromImport(formData: FormData, choice: ImportChoice) {
  const { user, profile } = await owner();
  const importId = id.safeParse(String(formData.get("import") ?? ""));
  const pending = importId.success
    ? await db.aiSuggestion.findFirst({
        where: { id: importId.data, userId: user.id, feature: "cv_parse", status: "pending" },
      })
    : null;
  const read = pending ? parseImport(pending.payload) : null;
  if (!pending || !read) redirect("/app/career/cv/nouveau?etape=import", RedirectType.replace);
  const count = await db.document.count({ where: { profileId: profile.id, kind: "cv" } });
  if (count >= MAX_CVS) redirect("/app/career/cv?onglet=cv&erreur=limite", RedirectType.replace);
  const account = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { name: true, firstName: true, lastName: true, email: true, city: true, country: true },
  });
  const t = await getTranslations("career.cv");
  const fileTitle = read.file?.name
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .trim()
    .slice(0, 80);
  const numbered = count === 0 ? t("default") : `${t("default")} ${count + 1}`;
  const cv = await db.document.create({
    data: {
      profileId: profile.id,
      kind: "cv",
      title: choice === "new" ? numbered : fileTitle || numbered,
      templateId: DEFAULT_TEMPLATE_ID,
      isPrimary: count === 0,
      content: cvFromExtraction(read, {
        name: [account.firstName, account.lastName].filter(Boolean).join(" ") || account.name,
        email: account.email,
        city: account.city ?? "",
        country: account.country ?? "",
      }),
    },
  });
  const storage = fileStorage(db);
  if (choice === "new") await dropImportedFile(storage, user.id, pending.id);
  else if (read.file)
    await keepImportedFile(db, storage, user.id, pending.id, cv.id, {
      name: read.file.name,
      kind: read.file.kind,
    });
  return { user, pending, read, cv };
}

/** 1. « Garder mon CV »: the CV as it is, in « Mes CV », the profile untouched. */
export async function keepImportedCvAction(formData: FormData) {
  const { pending, cv } = await cvFromImport(formData, "keep");
  await db.aiSuggestion.update({ where: { id: pending.id }, data: { status: "applied" } });
  refresh();
  redirect(`/app/career/cv/${cv.id}/lire?importe=garde`, RedirectType.replace);
}

/**
 * 2. « Remplir mon profil avec ce CV »: Orbi puts the groups left ticked into the profile, each
 * in its place, and the CV is kept in « Mes CV » as well.
 */
export async function profileFromImportAction(formData: FormData) {
  const chosen = new Set(formData.getAll("groupe").map(String));
  const { user, pending, read, cv } = await cvFromImport(formData, "profile");
  const all = (group: "experiences" | "educations" | "skills") =>
    chosen.has(group) ? read[group].map((_, index) => index) : [];
  const added = await applyImport(db, user.id, pending.id, {
    experiences: all("experiences"),
    educations: all("educations"),
    skills: all("skills"),
    languages: chosen.has("languages"),
    contact: chosen.has("contact"),
  });
  refresh();
  redirect(
    `/app/career/cv/${cv.id}/lire?importe=profil&ajouts=${typeof added === "number" ? added : 0}`,
    RedirectType.replace,
  );
}

/**
 * 3. « Créer un nouveau CV avec ces informations »: what was read fills a CV made in Jumanly, a
 * template is chosen, then Contenu, Mise en forme and Aperçu as for any CV.
 */
export async function newCvFromImportAction(formData: FormData) {
  const { pending, cv } = await cvFromImport(formData, "new");
  await db.aiSuggestion.update({ where: { id: pending.id }, data: { status: "applied" } });
  refresh();
  redirect(`/app/career/cv/${cv.id}?etape=modele`, RedirectType.replace);
}

// ─── Nouveau CV (Ephraïm, 31/10/2026) ───────────────────────────────────────────────────────

const startSchema = z.object({
  mode: z.enum(cvStartModes),
  job: z.string().max(60).optional(),
});

/**
 * « Valider » on « Nouveau CV »: a CV filled from the whole profile, an empty one, or a copy
 * adapted by Orbi to an offer (`career.cv.tailor`, Pro and above; the others see it locked).
 * Then « Mes informations », step by step; `nouveau=1` lets « Tout annuler » remove it.
 */
export async function createCvAction(formData: FormData) {
  const parsed = startSchema.safeParse({
    mode: formData.get("mode"),
    job: formData.get("job") ?? undefined,
  });
  if (!parsed.success) redirect("/app/career/cv/nouveau?erreur=choix", RedirectType.replace);
  const { user, profile } = await owner();
  const count = await db.document.count({ where: { profileId: profile.id, kind: "cv" } });
  if (count >= MAX_CVS) redirect("/app/career/cv/nouveau?erreur=limite", RedirectType.replace);
  const { mode, job } = parsed.data;
  if (mode === "offre") {
    if (!(await can(db, { type: "user", id: user.id }, "career.cv.tailor")))
      redirect("/app/career/cv/nouveau?erreur=offre", RedirectType.replace);
    if (!job) redirect("/app/career/cv/nouveau?choix=offre&erreur=job", RedirectType.replace);
  }
  const t = await getTranslations("career.cv");
  const base = await db.document.create({
    data: {
      profileId: profile.id,
      kind: "cv",
      title: count === 0 ? t("default") : `${t("default")} ${count + 1}`,
      templateId: DEFAULT_TEMPLATE_ID,
      isPrimary: count === 0,
      content: mode === "zero" ? blankCv() : await cvFromWholeProfile(db, user.id),
    },
  });
  let cvId = base.id;
  if (mode === "offre" && job) {
    const tailor = await getTranslations("career.cv.tailor");
    const result = await tailorCv(db, user.id, {
      cvId: base.id,
      jobId: job,
      title: (jobTitle) => tailor("name", { jobTitle }),
    });
    // The copy is the CV; the profile CV made to start it goes away.
    await db.document.delete({ where: { id: base.id } });
    if (!result.ok) {
      const code =
        ({ notFound: "job", limit: "limite" } as Record<string, string>)[result.code] ??
        result.code;
      redirect(`/app/career/cv/nouveau?choix=offre&erreur=${code}`, RedirectType.replace);
    }
    cvId = result.id;
    if (count === 0) await db.document.update({ where: { id: cvId }, data: { isPrimary: true } });
  }
  refresh();
  redirect(`/app/career/cv/${cvId}?etape=contenu&nouveau=1`, RedirectType.replace);
}

const rewriteSchema = z.object({
  kind: z.enum(cvTextKinds),
  texts: z.array(z.string().max(6000)).min(1).max(12),
  context: cvContentInputSchema,
});

/** « Améliorer avec Orbi » on one box of « Mes informations » (Pro): the texts proposed. */
export async function rewriteCvTextAction(cvId: string, raw: z.input<typeof rewriteSchema>) {
  const parsed = rewriteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "empty" as const };
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false as const, error: "empty" as const };
  const context = parsed.data.context as CvContent;
  return rewriteCvTexts(db, user.id, cv.id, {
    kind: parsed.data.kind,
    texts: parsed.data.texts,
    context,
  });
}

/**
 * « Valider mes informations »: the form is saved, and the changes Orbi proposed for an offer
 * (shown applied, with « Annuler ») are closed: kept when their text is on the CV, else refused.
 */
export async function validateCvInfoAction(cvId: string, raw: unknown): Promise<Result> {
  const saved = await saveCvContentAction(cvId, raw);
  if (!saved.ok) return saved;
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  const text = JSON.stringify(parseCv(cv.content));
  const pending = await pendingSuggestions(db, user.id, cv.id);
  for (const item of pending) {
    const kept = item.payload.after !== null && text.includes(JSON.stringify(item.payload.after));
    await db.aiSuggestion.update({
      where: { id: item.id },
      data: { status: kept ? "applied" : "ignored" },
    });
  }
  return { ok: true };
}

/** A template touched in the studio: the layout changes at once, the texts stay. */
export async function setCvTemplateQuickAction(cvId: string, template: string): Promise<Result> {
  const parsed = z.string().min(1).max(40).safeParse(template);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  const result = await applyTemplate(db, user.id, cv.id, parsed.data);
  return result === "applied" ? { ok: true } : { ok: false, error: result };
}

/** « Tout annuler » on a CV that already existed: its template and look as they were. */
export async function restoreCvDesignAction(
  cvId: string,
  template: string,
  rawStyle: unknown,
): Promise<Result> {
  const style = cvStyleSchema.safeParse(rawStyle);
  if (!style.success) return { ok: false, error: "invalid" };
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  if (cv.templateId !== template) await applyTemplate(db, user.id, cv.id, template);
  await updateCvStyle(db, user.id, cv.id, () => style.data);
  refresh();
  return { ok: true };
}

/** « Enregistrer » on « Voir le CV »: the CV is ready, first in « Mes documents ». */
export async function finishCvAction(cvId: string): Promise<Result> {
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, cvId);
  if (!cv) return { ok: false, error: "missing" };
  // No refresh here: the page would be drawn again and close the « CV enregistré » sheet
  // before the talent reads it (Ephraïm, 31/10). The documents are fresh on each visit.
  await db.document.update({ where: { id: cv.id }, data: { updatedAt: new Date() } });
  return { ok: true };
}
