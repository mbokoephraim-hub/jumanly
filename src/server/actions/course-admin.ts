"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  addLesson,
  addModule,
  addQuestion,
  courseFormSchema,
  courseStatuses,
  createCourse,
  deleteLesson,
  deleteModule,
  deleteQuestion,
  lessonFormSchema,
  questionFormSchema,
  quizSettingsSchema,
  renameModule,
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

function back(courseId: string, params: Record<string, string>, anchor = "") {
  refresh();
  redirect(`/admin/formations/${courseId}?${new URLSearchParams(params)}${anchor}`);
}

export async function createCourseAction(formData: FormData) {
  const user = await editor();
  const course = await createCourse(db, value(formData, "title", 200));
  if (!course) redirect("/admin/formations?erreur=titre");
  await audit(user.id, "course.create", course.id);
  redirect(`/admin/formations/${course.id}?ok=creee`);
}

export async function updateCourseAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const parsed = courseFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) back(id, { erreur: "fiche" }, "#fiche");
  const result = await updateCourse(db, id, parsed.data!);
  await audit(user.id, "course.update", id);
  await invalidate(id, result.previousSlug);
  back(
    id,
    {
      ok: "fiche",
      ...(result.unknown.length ? { inconnues: result.unknown.join(", ").slice(0, 300) } : {}),
    },
    "#fiche",
  );
}

export async function setCourseStatusAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const status = courseStatuses.find((item) => item === formData.get("status"));
  if (!status) back(id, {});
  const result = await setCourseStatus(db, id, status!);
  if (!result.ok) back(id, { publication: result.problems.join(",") });
  await audit(user.id, "course.status", id, { status: status! });
  await invalidate(id);
  back(id, { ok: "statut" });
}

export async function addModuleAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const created = await addModule(db, id, value(formData, "title", 200));
  if (created) await audit(user.id, "course.module.add", id, { moduleId: created.id });
  await invalidate(id);
  back(id, {}, "#programme");
}

export async function renameModuleAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  await renameModule(db, id, value(formData, "module"), value(formData, "title", 200));
  await audit(user.id, "course.module.rename", id);
  await invalidate(id);
  back(id, {}, "#programme");
}

export async function deleteModuleAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  await deleteModule(db, id, value(formData, "module"));
  await audit(user.id, "course.module.delete", id);
  await invalidate(id);
  back(id, {}, "#programme");
}

export async function addLessonAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const lesson = await addLesson(db, id, value(formData, "module"), {
    title: value(formData, "title", 200),
    kind: value(formData, "kind"),
  });
  if (!lesson) back(id, {}, "#programme");
  await audit(user.id, "course.lesson.add", id, { lessonId: lesson!.id });
  await invalidate(id);
  back(id, { lecon: lesson!.id }, "#lecon");
}

export async function updateLessonAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const lessonId = value(formData, "lesson");
  const parsed = lessonFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) back(id, { lecon: lessonId, erreur: "lecon" }, "#lecon");
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
  );
}

export async function deleteLessonAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  await deleteLesson(db, id, value(formData, "lesson"));
  await audit(user.id, "course.lesson.delete", id);
  await invalidate(id);
  back(id, {}, "#programme");
}

export async function updateQuizAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const lessonId = value(formData, "lesson");
  const parsed = quizSettingsSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) await updateQuizSettings(db, id, lessonId, parsed.data);
  await audit(user.id, "course.quiz.update", id, { lessonId });
  back(id, { lecon: lessonId, ...(parsed.success ? { ok: "quiz" } : { erreur: "quiz" }) }, "#quiz");
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
  if (saved) await audit(user.id, "course.question.save", id, { lessonId });
  back(id, { lecon: lessonId, ...(saved ? { ok: "quiz" } : { erreur: "question" }) }, "#quiz");
}

export async function deleteQuestionAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const lessonId = value(formData, "lesson");
  await deleteQuestion(db, id, value(formData, "question"));
  await audit(user.id, "course.question.delete", id, { lessonId });
  back(id, { lecon: lessonId }, "#quiz");
}

export async function revokeCertificateAction(formData: FormData) {
  const user = await editor();
  const id = value(formData, "course");
  const code = value(formData, "code", 20).trim().toUpperCase();
  // A sensitive action: the reason is required and kept in the audit log.
  const reason = value(formData, "reason", 500).trim();
  if (!reason) back(id, { action: "revoquer", code }, "#attestation");
  // Only an attestation of this course can be revoked from its page.
  const ofCourse = await db.certificate.findFirst({
    where: { code, enrollment: { courseId: id } },
    select: { id: true },
  });
  const revoked = ofCourse ? await revokeCertificate(db, user.id, code, new Date(), reason) : false;
  if (revoked) updateTag(`certificate:${code}`);
  back(id, { attestation: revoked ? "revoquee" : "introuvable" }, "#attestation");
}
