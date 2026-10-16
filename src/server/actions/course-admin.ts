"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { videoProvider, type VideoUpload } from "@/server/adapters/video";
import { getTranslations } from "next-intl/server";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import { reportError } from "@/server/observability";
import { CourseMediaError, saveCover, saveLessonVideoFile } from "@/server/services/course-media";
import {
  addCourseDocument,
  CourseDocumentError,
  deleteCourseDocument,
  documentFormSchema,
  moveCourseDocument,
  updateCourseDocument,
} from "@/server/services/course-documents";
import { fileStorage } from "@/server/storage";
import {
  addLesson,
  addModule,
  addQuestion,
  courseFormSchema,
  courseStatuses,
  createCourse,
  createCourseFromTemplate,
  deleteLesson,
  deleteModule,
  deleteQuestion,
  duplicateCourse,
  lessonFormSchema,
  newCourseSchema,
  questionFormSchema,
  quizSettingsSchema,
  isEditorStep,
  moveLesson,
  moveModule,
  renameModule,
  type EditorStep,
  setCourseStatus,
  updateCourse,
  updateLesson,
  updateQuestion,
  updateQuizSettings,
} from "@/server/services/course-admin";
import { revokeCertificate } from "@/server/services/learn";

const value = (formData: FormData, key: string, max = 80) =>
  String(formData.get(key) ?? "").slice(0, max);

/** Every course write: a content editor or an administrator, then the audit log. */
async function editor() {
  const user = await requireCourseEditor();
  if (!user) notFound();
  return user;
}

async function audit(
  actorId: string,
  action: string,
  targetId: string,
  metadata: Prisma.InputJsonValue = {},
) {
  const requestHeaders = await headers();
  await db.auditLog.create({
    data: {
      actorId,
      action,
      targetType: "course",
      targetId,
      metadata,
      ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    },
  });
}

/** The public catalog and the course page are cached: they are refreshed after each change. */
async function invalidate(courseId: string, ...slugs: string[]) {
  const course = await db.course.findUnique({ where: { id: courseId }, select: { slug: true } });
  updateTag("courses");
  for (const slug of new Set([...slugs, course?.slug ?? ""].filter(Boolean)))
    updateTag(`course:${slug}`);
}

/** The editor step a form was sent from (`etape`), or the step its action belongs to. */
const stepFrom = (formData: FormData, fallback: EditorStep): EditorStep => {
  const step = formData.get("etape");
  return isEditorStep(step) ? step : fallback;
};

/** Back to the editor, on the step of the change (Admin v3, étape 4). */
function back(courseId: string, params: Record<string, string>, anchor: string, step: EditorStep) {
  refresh();
  const query = new URLSearchParams({ etape: step, ...params });
  redirect(`/admin/formations/${courseId}?${query}${anchor}`);
}

export async function createCourseAction(formData: FormData) {
  const user = await editor();
  const course = await createCourse(db, value(formData, "title", 200));
  if (!course) redirect("/admin/formations?erreur=titre");
  await audit(user.id, "course.create", course.id);
  redirect(`/admin/formations/${course.id}?ok=creee`);
}

/**
 * « Nouvelle formation » of the Studio (Admin v3, étape 3): first fields and a starting template;
 * the draft opens in the editor with the template's modules and lessons to rename.
 */
export async function createCourseFromTemplateAction(formData: FormData) {
  const user = await editor();
  const parsed = newCourseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/formations/nouvelle?erreur=champs");
  const t = await getTranslations("admin.courses.v3.template");
  const course = await createCourseFromTemplate(db, parsed.data, {
    module: (index) => t("moduleTitle", { index }),
    finalModule: t("finalModule"),
    lesson: (label, index) => t(`lessonTitle.${label}`, { index }),
  });
  await audit(user.id, "course.create", course.id, { template: parsed.data.template });
  redirect(
    `/admin/formations/${course.id}?ok=${parsed.data.template === "blank" ? "creee" : "modele"}`,
  );
}

export async function updateCourseAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const parsed = courseFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) back(id, { erreur: "fiche" }, "#fiche", stepFrom(formData, "informations"));
  const result = await updateCourse(db, id, parsed.data!);
  // The cover sent with the card (Admin v2, étape 6): resized, then saved on the course.
  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    try {
      await saveCover(db, fileStorage(db), id, new Uint8Array(await cover.arrayBuffer()));
      await audit(user.id, "course.cover", id);
    } catch (error) {
      if (!(error instanceof CourseMediaError)) throw error;
      await invalidate(id, result.previousSlug);
      back(
        id,
        { erreur: `couverture-${error.code}` },
        "#fiche",
        stepFrom(formData, "informations"),
      );
    }
  }
  await audit(user.id, "course.update", id);
  await invalidate(id, result.previousSlug);
  back(
    id,
    {
      ok: "fiche",
      ...(result.unknown.length ? { inconnues: result.unknown.join(", ").slice(0, 300) } : {}),
    },
    "#fiche",
    stepFrom(formData, "informations"),
  );
}

export async function setCourseStatusAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const status = courseStatuses.find((item) => item === formData.get("status"));
  if (!status) back(id, {}, "", "publication");
  const result = await setCourseStatus(db, id, status!);
  if (!result.ok) back(id, { publication: result.problems.join(",") }, "", "publication");
  // Admin v3, étape 4: an optional reason, kept in the audit log with the new status.
  const reason = value(formData, "reason", 500).trim();
  await audit(user.id, "course.status", id, { status: status!, ...(reason ? { reason } : {}) });
  await invalidate(id);
  back(id, { ok: "statut" }, "", "publication");
}

export async function addModuleAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const created = await addModule(db, id, value(formData, "title", 200));
  if (created) await audit(user.id, "course.module.add", id, { moduleId: created.id });
  await invalidate(id);
  back(id, {}, "#programme", "programme");
}

export async function renameModuleAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  await renameModule(db, id, value(formData, "module"), value(formData, "title", 200));
  await audit(user.id, "course.module.rename", id);
  await invalidate(id);
  back(id, {}, "#programme", "programme");
}

export async function deleteModuleAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  await deleteModule(db, id, value(formData, "module"));
  await audit(user.id, "course.module.delete", id);
  await invalidate(id);
  back(id, {}, "#programme", "programme");
}

/** Moves a module one place up or down in the program (Admin v3, étape 4). */
export async function moveModuleAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const direction = formData.get("direction") === "up" ? "up" : "down";
  const moved = await moveModule(db, id, value(formData, "module"), direction);
  if (moved) {
    await audit(user.id, "course.module.move", id, { direction });
    await invalidate(id);
  }
  back(id, {}, `#module-${value(formData, "module")}`, "programme");
}

/** Moves a lesson one place up or down within its module. */
export async function moveLessonAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const lessonId = value(formData, "lesson");
  const direction = formData.get("direction") === "up" ? "up" : "down";
  const moved = await moveLesson(db, id, lessonId, direction);
  if (moved) {
    await audit(user.id, "course.lesson.move", id, { lessonId, direction });
    await invalidate(id);
  }
  back(id, {}, `#lesson-row-${lessonId}`, "programme");
}

export async function addLessonAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const lesson = await addLesson(db, id, value(formData, "module"), {
    title: value(formData, "title", 200),
    kind: value(formData, "kind"),
  });
  if (!lesson) back(id, {}, "#programme", "programme");
  await audit(user.id, "course.lesson.add", id, { lessonId: lesson!.id });
  await invalidate(id);
  back(id, { lecon: lesson!.id }, "#lecon", "programme");
}

export async function updateLessonAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const lessonId = value(formData, "lesson");
  const parsed = lessonFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    back(id, { lecon: lessonId, erreur: "lecon" }, "#lecon", stepFrom(formData, "programme"));
  const result = await updateLesson(db, id, lessonId, parsed.data!);
  await audit(user.id, "course.lesson.update", id, { lessonId });
  await invalidate(id);
  back(
    id,
    {
      lecon: lessonId,
      ok: "lecon",
      ...(result?.invalid ? { ignorees: String(result.invalid) } : {}),
    },
    "#lecon",
    stepFrom(formData, "programme"),
  );
}

export async function deleteLessonAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  await deleteLesson(db, id, value(formData, "lesson"));
  await audit(user.id, "course.lesson.delete", id);
  await invalidate(id);
  back(id, {}, "#programme", stepFrom(formData, "programme"));
}

export async function updateQuizAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const lessonId = value(formData, "lesson");
  const parsed = quizSettingsSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) await updateQuizSettings(db, id, lessonId, parsed.data);
  await audit(user.id, "course.quiz.update", id, { lessonId });
  await invalidate(id);
  back(
    id,
    { lecon: lessonId, ...(parsed.success ? { ok: "quiz" } : { erreur: "quiz" }) },
    "#quiz",
    stepFrom(formData, "programme"),
  );
}

export async function saveQuestionAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const lessonId = value(formData, "lesson");
  const questionId = value(formData, "question");
  const parsed = questionFormSchema.safeParse(Object.fromEntries(formData));
  const saved =
    parsed.success &&
    (questionId
      ? await updateQuestion(db, id, questionId, parsed.data)
      : await addQuestion(db, id, lessonId, parsed.data));
  if (saved) {
    await audit(user.id, "course.question.save", id, { lessonId });
    await invalidate(id);
  }
  back(
    id,
    { lecon: lessonId, ...(saved ? { ok: "quiz" } : { erreur: "question" }) },
    "#quiz",
    stepFrom(formData, "programme"),
  );
}

export async function deleteQuestionAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const lessonId = value(formData, "lesson");
  await deleteQuestion(db, id, value(formData, "question"));
  await audit(user.id, "course.question.delete", id, { lessonId });
  await invalidate(id);
  back(id, { lecon: lessonId }, "#quiz", stepFrom(formData, "programme"));
}

/** « Dupliquer »: a draft copy, opened at once. */
export async function duplicateCourseAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const copy = await duplicateCourse(db, id, value(formData, "title", 200));
  if (!copy) notFound();
  await audit(user.id, "course.duplicate", copy.id, { from: id });
  redirect(`/admin/formations/${copy.id}?ok=copie`);
}

/** A lesson video sent through the site (no provider taking direct uploads). */
export async function uploadLessonVideoAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const lessonId = value(formData, "lesson");
  const file = formData.get("video");
  if (!(file instanceof File) || file.size === 0)
    back(
      id,
      { lecon: lessonId, erreur: "video-fileType" },
      "#lecon",
      stepFrom(formData, "programme"),
    );
  try {
    await saveLessonVideoFile(
      db,
      fileStorage(db),
      id,
      lessonId,
      new Uint8Array(await (file as File).arrayBuffer()),
    );
  } catch (error) {
    if (!(error instanceof CourseMediaError)) throw error;
    back(
      id,
      { lecon: lessonId, erreur: `video-${error.code}` },
      "#lecon",
      stepFrom(formData, "programme"),
    );
  }
  await audit(user.id, "course.lesson.video", id, { lessonId });
  await invalidate(id);
  back(id, { lecon: lessonId, ok: "video" }, "#lecon", stepFrom(formData, "programme"));
}

/**
 * Direct upload to the video provider: the browser sends the file itself (no size limit of the
 * site), with a signature valid for this one video.
 */
export async function prepareVideoUploadAction(
  courseId: string,
  lessonId: string,
): Promise<VideoUpload | null> {
  await editor();
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: { title: true },
  });
  if (!lesson) return null;
  try {
    return await videoProvider().createUpload(lesson.title);
  } catch (error) {
    reportError(error, { message: "Envoi vidéo non préparé" });
    return null;
  }
}

/** Once the browser has sent the file: the lesson plays this video. */
export async function attachVideoAction(courseId: string, lessonId: string, videoId: string) {
  const user = await editor();
  if (!/^[\w-]{8,64}$/.test(videoId)) return;
  const updated = await db.lesson.updateMany({
    where: { id: lessonId, module: { courseId } },
    data: { videoId, kind: "video" },
  });
  if (updated.count === 0) return;
  await audit(user.id, "course.lesson.video", courseId, { lessonId });
  await invalidate(courseId);
}

export async function revokeCertificateAction(formData: FormData) {
  const user = await editor();
  // Revoking an attestation is for administrators only (Admin v2, étape 6).
  if (user.platformRole !== "platform_admin") notFound();
  const id = value(formData, "course");
  const code = value(formData, "code", 20).trim().toUpperCase();
  // A sensitive action: the reason is required and kept in the audit log.
  const reason = value(formData, "reason", 500).trim();
  if (!reason) back(id, { action: "revoquer", code }, "#attestation", "attestation");
  // Only an attestation of this course can be revoked from its page.
  const ofCourse = await db.certificate.findFirst({
    where: { code, enrollment: { courseId: id } },
    select: { id: true },
  });
  const revoked = ofCourse ? await revokeCertificate(db, user.id, code, new Date(), reason) : false;
  if (revoked) updateTag(`certificate:${code}`);
  back(id, { attestation: revoked ? "revoquee" : "introuvable" }, "#attestation", "attestation");
}

// ─── PDF documents (Admin v3, étape 5) ─────────────────────────────────────────

const pdfOf = async (formData: FormData) => {
  const file = formData.get("file");
  return file instanceof File && file.size > 0 ? new Uint8Array(await file.arrayBuffer()) : null;
};

/** Where a document form goes back: its lesson panel, or the « Documents » step. */
const documentBack = (formData: FormData, courseId: string, params: Record<string, string>) => {
  const lessonId = value(formData, "panel");
  if (lessonId)
    back(
      courseId,
      { lecon: lessonId, ...params },
      "#lecon-documents",
      stepFrom(formData, "programme"),
    );
  back(courseId, params, "#documents", "documents");
};

/** Sends a PDF: checked (type, size, readable), stored privately, then listed. */
export async function addCourseDocumentAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const parsed = documentFormSchema.safeParse(Object.fromEntries(formData));
  const bytes = await pdfOf(formData);
  if (!parsed.success) documentBack(formData, id, { erreur: "document-champs" });
  if (!bytes) documentBack(formData, id, { erreur: "document-fileType" });
  try {
    const document = await addCourseDocument(db, fileStorage(db), {
      courseId: id,
      authorId: user.id,
      form: parsed.data!,
      bytes: bytes!,
    });
    await audit(user.id, "course.document.add", id, { documentId: document.id });
  } catch (error) {
    if (!(error instanceof CourseDocumentError)) throw error;
    documentBack(formData, id, { erreur: `document-${error.code}` });
  }
  await invalidate(id);
  documentBack(formData, id, { ok: "document" });
}

/** Renames, reclassifies, moves to a lesson, or replaces the file of a document. */
export async function updateCourseDocumentAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const documentId = value(formData, "document");
  const parsed = documentFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) documentBack(formData, id, { erreur: "document-champs" });
  const bytes = await pdfOf(formData);
  try {
    await updateCourseDocument(db, fileStorage(db), {
      courseId: id,
      id: documentId,
      form: parsed.data!,
      ...(bytes ? { bytes } : {}),
    });
    await audit(user.id, bytes ? "course.document.replace" : "course.document.update", id, {
      documentId,
    });
  } catch (error) {
    if (!(error instanceof CourseDocumentError)) throw error;
    documentBack(formData, id, { erreur: `document-${error.code}` });
  }
  await invalidate(id);
  documentBack(formData, id, { ok: "document" });
}

export async function deleteCourseDocumentAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const documentId = value(formData, "document");
  if (await deleteCourseDocument(db, fileStorage(db), id, documentId)) {
    await audit(user.id, "course.document.delete", id, { documentId });
    await invalidate(id);
  }
  documentBack(formData, id, { ok: "document-supprime" });
}

export async function moveCourseDocumentAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const documentId = value(formData, "document");
  const direction = formData.get("direction") === "up" ? "up" : "down";
  if (await moveCourseDocument(db, id, documentId, direction)) {
    await audit(user.id, "course.document.move", id, { documentId, direction });
    await invalidate(id);
  }
  back(id, {}, `#document-${documentId}`, "documents");
}
