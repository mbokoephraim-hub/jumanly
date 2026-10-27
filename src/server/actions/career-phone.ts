"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { ABOUT_TEXT_MAX, ABOUT_TITLE_MAX } from "@/lib/profile-about";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { onMessageSent } from "@/server/application-events";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { connectViewer } from "@/server/hire-context";
import { reportError } from "@/server/observability";
import { cleanSocialLinks, handleInput, socialLinksInput } from "@/lib/social-links";
import { allowAttempt } from "@/server/rate-limit";
import { withdrawApplication } from "@/server/services/applications";
import { ConnectError, sendMessage } from "@/server/services/connect";
import { DEFAULT_TEMPLATE_ID } from "@/features/cv/templates/registry";
import { rewriteCareerText, type RewriteKind } from "@/server/services/career-phone";
import { applyTemplate, cvFromProfile, MAX_CVS } from "@/server/services/cv";
import { improveCvSummary } from "@/server/services/cv-coach";
import {
  educationSchema,
  ensureProfile,
  experienceSchema,
  getFullProfile,
  monthToDate,
  parseProfileLanguages,
  PROFILE_SKILLS_MAX,
  PROFILE_SUMMARY_MAX,
  refreshCompleteness,
} from "@/server/services/profile";
import { mutedAfter, NOTIFICATION_CATEGORIES } from "@/server/services/notifications";
import {
  deleteProject,
  parseProject,
  PortfolioError,
  projectSchema,
  saveProject,
  type NewProjectFile,
} from "@/server/services/portfolio";
import {
  PhotoError,
  removeBanner,
  removePhoto,
  saveBanner,
  savePhoto,
} from "@/server/services/profile-photo";
import { fileStorage } from "@/server/storage";

/**
 * Carrière on the phone (Modèle B, lot B5): the quick changes made from the tab itself. Each one
 * validates, checks the session and touches only the person's own profile.
 */

const skillIds = z.array(z.string().min(1).max(40)).min(1).max(10);

/** « Ajouter » on Orbi's card or in « Ajouter des compétences »: declared skills, level 2. */
export async function addSuggestedSkillsAction(ids: string[]) {
  const parsed = skillIds.safeParse(ids);
  if (!parsed.success) return { ok: false as const, error: "invalid" as const };
  const user = await requireUser("/app/career/cv");
  const profile = await ensureProfile(db, user.id);
  const skills = await db.skill.findMany({
    where: { id: { in: parsed.data } },
    select: { id: true },
  });
  const count = await db.profileSkill.count({ where: { profileId: profile.id } });
  if (count + skills.length > PROFILE_SKILLS_MAX)
    return { ok: false as const, error: "max" as const };
  await db.profileSkill.createMany({
    data: skills.map((skill) => ({ profileId: profile.id, skillId: skill.id, level: 2 })),
    skipDuplicates: true,
  });
  await refreshCompleteness(db, profile.id);
  refresh();
  return { ok: true as const, added: skills.length };
}

type Result = { ok: true } | { ok: false; error: string };

const fail = (error: string): Result => ({ ok: false, error });

async function mine() {
  const user = await requireUser("/app/career/cv");
  const profile = await ensureProfile(db, user.id);
  return { user, profile };
}

/** After a change: completeness again, then the mounted Carrière tab reads it. */
async function saved(profileId: string): Promise<Result> {
  await refreshCompleteness(db, profileId);
  refresh();
  return { ok: true };
}

const nameSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[\p{L}\p{M}' .-]+$/u);

const headSchema = z.object({
  name: nameSchema,
  headline: z.string().trim().max(120),
  city: z.string().trim().min(1).max(120),
  summary: z.string().trim().max(PROFILE_SUMMARY_MAX),
  availability: z.enum(["open", "listening", "not_looking"]),
  /** docs/profil-personne: the handle (empty = drawn from the name), the networks, the e-mail. */
  handle: z.union([z.literal(""), handleInput]).optional(),
  socials: socialLinksInput.optional(),
  showEmail: z.boolean().optional(),
});

const availabilitySchema = z.enum(["open", "listening", "not_looking"]);

/**
 * The availability chip of Carrière (docs/carriere-v3, capture 01): one tap moves it to the next
 * one (Disponible tout de suite · À l’écoute des offres · Pas disponible).
 */
export async function setCareerAvailabilityAction(raw: string): Promise<Result> {
  const parsed = availabilitySchema.safeParse(raw);
  if (!parsed.success) return fail("invalid");
  const { profile } = await mine();
  await db.talentProfile.update({
    where: { id: profile.id },
    data: {
      availability: parsed.data,
      availableFrom: parsed.data === "open" ? null : profile.availableFrom,
    },
  });
  refresh();
  return { ok: true };
}

/**
 * « Modifier le profil » (planche Carrière-modifier): the displayed name (first word = first name),
 * the title, the city, the bio and the availability.
 */
export async function saveCareerHeadAction(raw: z.input<typeof headSchema>): Promise<Result> {
  const parsed = headSchema.safeParse(raw);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return fail(
      field === "name"
        ? "name"
        : field === "handle"
          ? "handle"
          : field === "socials"
            ? "socials"
            : "invalid",
    );
  }
  const { user, profile } = await mine();
  const input = parsed.data;
  const [firstName, ...rest] = input.name.split(/\s+/);
  const done = await db
    .$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          name: input.name,
          firstName,
          lastName: rest.join(" ") || null,
          city: input.city,
        },
      }),
      db.talentProfile.update({
        where: { id: profile.id },
        data: {
          headline: input.headline || null,
          summary: input.summary || null,
          availability: input.availability,
          availableFrom: input.availability === "open" ? null : profile.availableFrom,
          ...(input.handle === undefined ? {} : { handle: input.handle || null }),
          ...(input.socials === undefined
            ? {}
            : { socialLinks: cleanSocialLinks(input.socials) as Prisma.InputJsonValue }),
          ...(input.showEmail === undefined ? {} : { showEmail: input.showEmail }),
        },
      }),
    ])
    .catch((error: unknown) => {
      // Somebody else already has this handle.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
        return "taken" as const;
      throw error;
    });
  if (done === "taken") return fail("handleTaken");
  return saved(profile.id);
}

/** « À propos » (planche Carrière-apropos): its title and its text, before the skills. */
export async function saveCareerAboutAction(raw: { title: string; text: string }): Promise<Result> {
  const parsed = z
    .object({
      title: z.string().trim().max(ABOUT_TITLE_MAX),
      text: z.string().trim().max(ABOUT_TEXT_MAX),
    })
    .safeParse(raw);
  if (!parsed.success) return fail("aboutTooLong");
  const { profile } = await mine();
  await db.talentProfile.update({
    where: { id: profile.id },
    data: { aboutTitle: parsed.data.title || null, summary: parsed.data.text || null },
  });
  return saved(profile.id);
}

const experienceInput = z.object({
  id: z.string().max(40).optional(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  type: z.string(),
  start: z.string(),
  end: z.string(),
  current: z.boolean(),
  description: z.string(),
});

/** « Modifier l'expérience » / « Nouvelle expérience » (planches Carrière-exp, -exp-new). */
export async function saveCareerExperienceAction(
  raw: z.input<typeof experienceInput>,
): Promise<Result> {
  const shape = experienceInput.safeParse(raw);
  if (!shape.success) return fail("invalid");
  const { id, current, ...rest } = shape.data;
  const parsed = experienceSchema.safeParse({ ...rest, ...(current ? { current: "on" } : {}) });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(issue?.message === "endBeforeStart" ? "endBeforeStart" : String(issue?.path[0]));
  }
  const { profile } = await mine();
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
  if (id) {
    const done = await db.experience.updateMany({ where: { id, profileId: profile.id }, data });
    if (done.count === 0) return fail("missing");
  } else {
    await db.experience.create({ data: { ...data, profileId: profile.id } });
  }
  return saved(profile.id);
}

export async function deleteCareerExperienceAction(id: string): Promise<Result> {
  const { profile } = await mine();
  await db.experience.deleteMany({ where: { id: String(id), profileId: profile.id } });
  return saved(profile.id);
}

const educationInput = z.object({
  id: z.string().max(40).optional(),
  degree: z.string(),
  school: z.string(),
  level: z.string(),
  field: z.string(),
  startYear: z.string(),
  endYear: z.string(),
});

/** « Modifier la formation » (planche Carrière-formation): an empty end = in progress. */
export async function saveCareerEducationAction(
  raw: z.input<typeof educationInput>,
): Promise<Result> {
  const shape = educationInput.safeParse(raw);
  if (!shape.success) return fail("invalid");
  const { id, ...rest } = shape.data;
  const parsed = educationSchema.safeParse({
    ...rest,
    ...(rest.endYear.trim() ? {} : { inProgress: "on" }),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(issue?.message === "endBeforeStart" ? "endBeforeStart" : String(issue?.path[0]));
  }
  const { profile } = await mine();
  const input = parsed.data;
  const data = {
    degree: input.degree,
    level: input.level,
    field: input.field || null,
    school: input.school,
    startYear: typeof input.startYear === "number" ? input.startYear : null,
    endYear: input.inProgress || typeof input.endYear !== "number" ? null : input.endYear,
  };
  if (id) {
    const done = await db.education.updateMany({ where: { id, profileId: profile.id }, data });
    if (done.count === 0) return fail("missing");
  } else {
    await db.education.create({ data: { ...data, profileId: profile.id } });
  }
  return saved(profile.id);
}

export async function deleteCareerEducationAction(id: string): Promise<Result> {
  const { profile } = await mine();
  await db.education.deleteMany({ where: { id: String(id), profileId: profile.id } });
  return saved(profile.id);
}

const languagesInput = z.object({
  languages: z.array(z.string().regex(/^[a-z]{2,3}$/)).max(12),
  places: z.array(z.string().trim().min(1).max(80)).max(10),
});

/**
 * « Langues et lieux » (planche Carrière-langues): the languages ticked (a language already
 * there keeps its level, a new one is « professional ») and the places where the person wants
 * to work.
 */
export async function saveCareerLanguagesAction(
  raw: z.input<typeof languagesInput>,
): Promise<Result> {
  const parsed = languagesInput.safeParse(raw);
  if (!parsed.success) return fail("invalid");
  const { profile } = await mine();
  const before = parseProfileLanguages(profile.languages);
  const languages = [...new Set(parsed.data.languages)].map(
    (code) => before.find((item) => item.code === code) ?? { code, level: "professional" as const },
  );
  await db.talentProfile.update({
    where: { id: profile.id },
    data: { languages, desiredLocations: [...new Set(parsed.data.places)] },
  });
  return saved(profile.id);
}

/** « Retirer » in « Photo de profil »: back to the initials. */
export async function removeCareerPhotoAction(): Promise<Result> {
  const { user } = await mine();
  await removePhoto(db, user.id);
  revalidatePath("/app", "layout");
  return { ok: true };
}

/** « Prendre une photo » / « Choisir dans la galerie »: the square JPEG made on the phone. */
export async function saveCareerPhotoAction(formData: FormData): Promise<Result> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return fail("photo");
  const { user } = await mine();
  try {
    await savePhoto(db, user.id, new Uint8Array(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof PhotoError) return fail(error.code);
    throw error;
  }
  revalidatePath("/app", "layout");
  return { ok: true };
}

/** « Changer la bannière » (Modifier le profil): the 1200 × 480 JPEG made on the phone. */
export async function saveCareerBannerAction(formData: FormData): Promise<Result> {
  const file = formData.get("banner");
  if (!(file instanceof File) || file.size === 0) return fail("photo");
  const { user } = await mine();
  try {
    await saveBanner(db, user.id, new Uint8Array(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof PhotoError) return fail(error.code);
    throw error;
  }
  revalidatePath("/app", "layout");
  return { ok: true };
}

/** « Revenir à la bannière Jumanly »: the drawn banner again. */
export async function removeCareerBannerAction(): Promise<Result> {
  const { user } = await mine();
  await removeBanner(db, user.id);
  revalidatePath("/app", "layout");
  return { ok: true };
}

/**
 * « Réécrire » / « Améliorer » (planches Carrière-apropos, -exp): Orbi proposes a version of the
 * text from the person's own words only; nothing is saved until « Utiliser » then « Enregistrer ».
 */
export async function rewriteCareerTextAction(raw: {
  kind: RewriteKind;
  text: string;
  title?: string;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const parsed = z
    .object({
      kind: z.enum(["about", "experience", "project"]),
      text: z.string().max(3000),
      title: z.string().max(160).optional(),
    })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { user } = await mine();
  const result = await rewriteCareerText(db, user.id, parsed.data);
  return typeof result === "string"
    ? { ok: true, text: result }
    : { ok: false, error: result.error };
}

/** « Chercher une compétence » in « Ajouter des compétences »: the reference list only. */
export async function searchCareerSkillsAction(query: string) {
  const parsed = z.string().trim().min(2).max(60).safeParse(query);
  if (!parsed.success) return [];
  await requireUser("/app/career/cv");
  return db.skill.findMany({
    where: { name: { contains: parsed.data, mode: "insensitive" } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 8,
  });
}

const privacyInput = z.object({
  visibility: z.enum(["private", "recruiters", "anonymous"]),
  matching: z.boolean(),
  contactRequests: z.boolean(),
  ai: z.boolean(),
  newsletter: z.boolean(),
});

/**
 * « Confidentialité » on the phone (planche Carrière-confid): each switch saves at once. Applying
 * stays possible whatever is chosen (CLAUDE.md, règle 1).
 */
export async function saveCareerPrivacyAction(raw: z.input<typeof privacyInput>): Promise<Result> {
  const parsed = privacyInput.safeParse(raw);
  if (!parsed.success) return fail("invalid");
  const { user, profile } = await mine();
  const input = parsed.data;
  const consent = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { aiConsentAt: true },
  });
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        aiConsentAt: input.ai ? (consent.aiConsentAt ?? new Date()) : null,
        newsletter: input.newsletter,
      },
    }),
    db.talentProfile.update({
      where: { id: profile.id },
      data: {
        visibility: input.visibility,
        matchingEnabled: input.matching,
        acceptsContactRequests: input.contactRequests,
      },
    }),
  ]);
  refresh();
  return { ok: true };
}

const notificationsInput = z.object({
  categories: z.array(z.enum(NOTIFICATION_CATEGORIES as [string, ...string[]])),
  emails: z.boolean(),
});

/** « Notifications » on the phone (planche Carrière-notif): the categories kept, the e-mails. */
export async function saveCareerNotificationsAction(
  raw: z.input<typeof notificationsInput>,
): Promise<Result> {
  const parsed = notificationsInput.safeParse(raw);
  if (!parsed.success) return fail("invalid");
  const { user } = await mine();
  const kept = new Set(parsed.data.categories);
  await db.user.update({
    where: { id: user.id },
    data: {
      notificationsMuted: mutedAfter(user.notificationsMuted, NOTIFICATION_CATEGORIES, kept),
      notificationEmails: parsed.data.emails,
    },
  });
  refresh();
  return { ok: true };
}

/**
 * « Nouveau CV » on the phone (planches Carrière-cv-nouveau, -cv-modele): a CV filled from the
 * profile, in the template chosen (when the person's plan includes it), or prepared by Orbi (its
 * summary proposed, to accept or not).
 */
export async function newCareerCvAction(formData: FormData) {
  const template = String(formData.get("template") ?? "").slice(0, 40);
  const orbi = formData.get("orbi") === "1";
  const { user, profile } = await mine();
  const count = await db.document.count({ where: { profileId: profile.id, kind: "cv" } });
  if (count >= MAX_CVS) redirect("/app/career/cv?erreur=limite");
  const t = await getTranslations("career.cv");
  const content = cvFromProfile(await getFullProfile(db, user.id));
  const cv = await db.document.create({
    data: {
      profileId: profile.id,
      kind: "cv",
      title: count === 0 ? t("default") : `${t("default")} ${count + 1}`,
      templateId: DEFAULT_TEMPLATE_ID,
      isPrimary: count === 0,
      content,
    },
  });
  if (template) await applyTemplate(db, user.id, cv.id, template);
  refresh();
  // Orbi's summary waits on Contenu, to keep or refuse (docs/carriere-v3, capture 09).
  if (orbi) await improveCvSummary(db, user.id, cv.id);
  redirect(`/app/career/cv/${cv.id}?etape=contenu`, RedirectType.replace);
}

/**
 * « Nouvelle réalisation » and « Modifier » (planche Carrière-real-ajout): the photos added, the
 * kept ones, the title, the description, the link. Returns the id of the project.
 */
export async function saveCareerProjectAction(
  formData: FormData,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const projectId = String(formData.get("id") ?? "").slice(0, 60) || undefined;
  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    context: formData.get("context") ?? "",
    skills: formData.getAll("skills").map(String),
    visible: formData.get("visible") === "1",
    link: String(formData.get("link") ?? "").trim(),
    keep: formData.getAll("keep").map(String),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.path[0] === "link" ? "link" : "title" };
  const { user } = await mine();
  const files: NewProjectFile[] = [];
  for (const entry of formData.getAll("files")) {
    if (entry instanceof File && entry.size > 0)
      files.push({ name: entry.name, bytes: new Uint8Array(await entry.arrayBuffer()) });
  }
  try {
    const id = await saveProject(db, fileStorage(db), user.id, parsed.data, files, projectId);
    refresh();
    return { ok: true, id };
  } catch (error) {
    if (error instanceof PortfolioError) return { ok: false, error: error.code };
    throw error;
  }
}

/** « Mettre en avant sur mon profil »: the project is shown to recruiters and on the page. */
export async function featureCareerProjectAction(id: string, on: boolean): Promise<Result> {
  const { profile } = await mine();
  const document = await db.document.findFirst({
    where: { id: String(id).slice(0, 60), profileId: profile.id, kind: "portfolio_item" },
    select: { id: true, title: true, content: true },
  });
  const project = document ? parseProject(document) : null;
  if (!document || !project) return fail("notFound");
  await db.document.update({
    where: { id: document.id },
    data: {
      content: { ...(document.content as Prisma.JsonObject), visible: on === true },
    },
  });
  refresh();
  return { ok: true };
}

/**
 * « Supprimer » after the confirmation (planche Carrière-real-suppr): « retirée de votre portfolio
 * et du Fil ». A post that only showed this project goes; a post with its own text or photo stays,
 * without the project.
 */
export async function deleteCareerProjectAction(raw: string): Promise<Result> {
  const { user } = await mine();
  const id = String(raw).slice(0, 60);
  await deleteProject(db, fileStorage(db), user.id, id);
  const posts = await db.feedPost.findMany({
    where: {
      authorId: user.id,
      organizationId: null,
      attachment: { path: ["id"], equals: id },
    },
    select: { id: true, body: true, imageUrl: true, quotedId: true },
  });
  for (const post of posts) {
    if (!post.body.trim() && !post.imageUrl && !post.quotedId)
      await db.feedPost.delete({ where: { id: post.id } });
    else
      await db.feedPost.update({
        where: { id: post.id },
        data: { attachment: Prisma.DbNull, kind: "post" },
      });
  }
  refresh();
  return { ok: true };
}

/**
 * « Retirer » after the confirmation (planche Carrière-cand-retirer): the application ends; the
 * recruiting team sees it in its history. Applying elsewhere stays free and open.
 */
export async function withdrawCareerApplicationAction(raw: string): Promise<Result> {
  const { user } = await mine();
  const done = await withdrawApplication(db, user.id, String(raw).slice(0, 60));
  if (!done) return fail("notFound");
  refresh();
  return { ok: true };
}

/** « Envoyer » in « Écrire à … » (planche Carrière-cand-ecrire): one message in the thread. */
export async function sendCareerMessageAction(raw: {
  conversationId: string;
  body: string;
}): Promise<Result> {
  const parsed = z
    .object({ conversationId: z.string().min(1).max(60), body: z.string().trim().min(1).max(4000) })
    .safeParse(raw);
  if (!parsed.success) return fail("empty");
  const { user, viewer } = await connectViewer(`/app/messages/${parsed.data.conversationId}`);
  if (!(await allowAttempt("message", user.id))) return fail("trop");
  try {
    const sent = await sendMessage(db, viewer, parsed.data.conversationId, {
      body: parsed.data.body,
    });
    await onMessageSent({ ...sent, senderName: user.name }).catch((error) => reportError(error));
  } catch (error) {
    if (error instanceof ConnectError) return fail(error.code);
    throw error;
  }
  refresh();
  return { ok: true };
}
