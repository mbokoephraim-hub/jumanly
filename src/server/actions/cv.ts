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
  orderBlocks,
  switchColumn,
  togglePageBreak,
} from "@/features/cv/style";
import { cvBlockTypes, DEFAULT_TEMPLATE_ID } from "@/features/cv/templates/registry";
import {
  applyTemplate,
  cvFromProfile,
  cvPhoneParts,
  cvSectionIds,
  emptyCv,
  MAX_CVS,
  parseCv,
  toggleSection,
  updateCvStyle,
  type CvContent,
  type CvPhonePart,
} from "@/server/services/cv";
import { decideSuggestion, improveCvSummary, pendingSuggestions } from "@/server/services/cv-coach";
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

/** The part of the phone editor the form came from (screen 28): the editor reopens on it. */
function partOf(formData: FormData): Record<string, string> {
  const part = formData.get("partie");
  return cvPhoneParts.includes(part as CvPhonePart) ? { partie: String(part) } : {};
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

const createSchema = z.object({
  source: z.enum(["profile", "import", "blank"]).catch("profile"),
  title: z.string().trim().max(80).catch(""),
});

/**
 * A new CV (screen 27): from the profile (the default, also when nothing is sent), from an import
 * (the pasted CV fills the profile first, then « Remplir » brings it in), or from a blank page that
 * keeps only the name and the contact of the account.
 */
export async function createCv(formData?: FormData) {
  const { source, title } = createSchema.parse({
    source: formData?.get("source") ?? undefined,
    title: formData?.get("title") ?? undefined,
  });
  if (source === "import") redirect("/app/profil/import");
  const { user, profile } = await owner();
  const count = await db.document.count({ where: { profileId: profile.id, kind: "cv" } });
  if (count >= MAX_CVS) redirect("/app/career/cv?erreur=limite");
  const t = await getTranslations("career.cv");
  const full = await getFullProfile(db, user.id);
  const fromProfile = cvFromProfile(full);
  const content: CvContent =
    source === "blank"
      ? {
          ...emptyCv,
          info: {
            ...emptyCv.info,
            name: fromProfile.info.name,
            email: fromProfile.info.email,
            city: fromProfile.info.city,
            country: fromProfile.info.country,
          },
        }
      : fromProfile;
  const cv = await db.document.create({
    data: {
      profileId: profile.id,
      kind: "cv",
      title: title || (count === 0 ? t("default") : `${t("default")} ${count + 1}`),
      templateId: DEFAULT_TEMPLATE_ID,
      isPrimary: count === 0,
      content,
    },
  });
  back(cv.id);
}

export async function refreshCvFromProfile(formData: FormData) {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const full = await getFullProfile(db, user.id);
  await save(cv.id, cvFromProfile(full, parseCv(cv.content)));
  back(cv.id, { ok: "profil", ...partOf(formData) });
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
    back(cv.id, { erreur: phone ? "telephone" : "1", ...partOf(formData) });
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
  back(cv.id, { ok: "1", ...partOf(formData) });
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
  if (!parsed.success) back(cv.id, partOf(formData));
  const { section, move } = parsed.data;
  if (move === "toggle") {
    await save(cv.id, toggleSection(parseCv(cv.content), section));
  } else {
    await updateCvStyle(db, user.id, cv.id, (style, template) =>
      moveBlock(template, style, cvSectionIds, section, move === "up" ? -1 : 1),
    );
  }
  back(cv.id, partOf(formData));
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
  // From the « … » menu of « Mes CV », the person stays on the list.
  if (formData.get("retour") === "liste") redirect("/app/career/cv?ok=principal");
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

/** « Améliorer » on the summary (planche talent-4 § 6): Orbi proposes, the talent decides. */
export async function improveSummaryAction(formData: FormData) {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const result = await improveCvSummary(db, user.id, cv.id);
  refresh();
  if (result === "done") back(cv.id, { vue: "ameliorer" });
  back(cv.id, { orbi: result });
}

const changeSchema = z.object({
  suggestion: z.string().min(1).max(60),
  decision: z.enum(["applied", "ignored"]),
  text: z.string().max(1000).optional(),
});

/**
 * « Accepter », « Modifier » (the talent's own words) or « Refuser » on a change Orbi proposed;
 * the next change follows, then the editor.
 */
export async function decideChangeAction(formData: FormData) {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const parsed = changeSchema.safeParse({
    suggestion: formData.get("suggestion"),
    decision: formData.get("decision"),
    text: formData.get("text") ?? undefined,
  });
  if (!parsed.success) back(cv.id, { vue: "ameliorer", erreur: "1" });
  const { suggestion, decision, text } = parsed.data;
  const done = await decideSuggestion(db, user.id, suggestion, decision, text);
  refresh();
  if (!done) back(cv.id, { orbi: "obsolete" });
  const left = await pendingSuggestions(db, user.id, cv.id);
  if (left.length > 0) back(cv.id, { vue: "ameliorer" });
  back(cv.id, { ok: decision === "applied" ? "change" : "refus" });
}

const allSchema = z.object({ decision: z.enum(["applied", "ignored"]) });

/**
 * « Tout accepter » or « Tout refuser » of the studio on a computer (planche studio-cv § 5): every
 * pending change of this CV, one after the other, each checked like a single « Accepter » (a
 * change about a text that moved since is not applied). Nothing is decided without this tap.
 */
export async function decideAllChangesAction(formData: FormData) {
  const { user, profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const parsed = allSchema.safeParse({ decision: formData.get("decision") });
  if (!parsed.success) back(cv.id, { vue: "ameliorer", erreur: "1" });
  const { decision } = parsed.data;
  let done = 0;
  for (const change of await pendingSuggestions(db, user.id, cv.id)) {
    if (await decideSuggestion(db, user.id, change.id, decision)) done += 1;
  }
  refresh();
  back(cv.id, decision === "applied" ? { ok: "tout", nombre: String(done) } : { ok: "refus" });
}

/** The summary written by the talent (the « Résumé » row of the editor). */
export async function updateCvSummary(formData: FormData) {
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const summary = z
    .string()
    .trim()
    .max(1000)
    .safeParse(formData.get("summary") ?? "");
  if (!summary.success) back(cv.id, { vue: "resume", erreur: "1" });
  const content = parseCv(cv.content);
  await save(cv.id, { ...content, summary: summary.data });
  back(cv.id, { ok: "1" });
}

/** « Renommer » in the « … » sheet of the editor. */
export async function renameCv(formData: FormData) {
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const title = z.string().trim().min(1).max(80).safeParse(formData.get("title"));
  if (!title.success) back(cv.id, { erreur: "1" });
  await db.document.update({ where: { id: cv.id }, data: { title: title.data } });
  back(cv.id, { ok: "1" });
}

const contactSchema = detailsSchema.pick({ showEmail: true, phone: true });

/** « Coordonnées affichées » of the options sheet: the e-mail shown or not, an optional phone. */
export async function updateCvContact(formData: FormData) {
  const { profile } = await owner();
  const cv = await ownedCv(profile.id, formData.get("id"));
  const parsed = contactSchema.safeParse({
    showEmail: formData.get("showEmail") ?? undefined,
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) back(cv.id, { erreur: "telephone" });
  const content = parseCv(cv.content);
  await save(cv.id, {
    ...content,
    info: {
      ...content.info,
      showEmail: parsed.data.showEmail === "on",
      phone: parsed.data.phone,
    },
  });
  back(cv.id, { ok: "1" });
}

const orderSchema = z.object({
  id: z.string().min(1).max(60),
  order: z.array(z.enum(cvSectionIds)).min(1).max(cvSectionIds.length),
});

/**
 * « Sections · glisser pour réordonner »: the new order, sent when the talent lets go of a row
 * (or moves it with the keyboard). Only the settings change, never the content.
 */
export async function reorderCvSections(id: string, order: string[]) {
  const parsed = orderSchema.safeParse({ id, order });
  if (!parsed.success) return { ok: false as const };
  const { user, profile } = await owner();
  const cv = await db.document.findFirst({
    where: { id: parsed.data.id, profileId: profile.id, kind: "cv" },
    select: { id: true },
  });
  if (!cv) return { ok: false as const };
  const result = await updateCvStyle(db, user.id, cv.id, (style, template) =>
    orderBlocks(template, style, cvSectionIds, parsed.data.order),
  );
  refresh();
  return { ok: result === "saved" };
}
