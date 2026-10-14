"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { certificateEmail } from "../../../emails/_components/learn-content";
import { send } from "@/server/account-emails";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  addLessonNote,
  completeLesson,
  deleteLessonNote,
  enroll,
  getLearnerCourse,
  LearnError,
  lessonsOf,
  submitQuiz,
  toggleSavedCourse,
} from "@/server/services/learn";
import { notify } from "@/server/services/notifications";
import { reportError } from "@/server/observability";

const value = (formData: FormData, key: string, max = 80) =>
  String(formData.get(key) ?? "").slice(0, max);
const coursePath = (slug: string) => `/app/learn/${encodeURIComponent(slug)}`;

async function learnerGuard<T>(slug: string, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (!(error instanceof LearnError)) throw error;
    redirect(`${coursePath(slug)}?erreur=${error.code}`);
  }
}

export async function enrollAction(formData: FormData) {
  const slug = value(formData, "slug");
  const user = await requireUser(coursePath(slug));
  const result = await enroll(db, user.id, slug);
  if (result === "notFound") redirect("/app/learn");
  if (result === "locked") redirect(`${coursePath(slug)}?erreur=locked`);
  const found = await getLearnerCourse(db, user.id, slug);
  const first = found ? lessonsOf(found.course)[0] : null;
  redirect(
    `${coursePath(slug)}?${new URLSearchParams({ ...(first ? { lecon: first.id } : {}), inscrit: "1" })}`,
  );
}

export async function toggleSavedCourseAction(formData: FormData) {
  const slug = value(formData, "slug");
  const user = await requireUser("/app/learn");
  const saved = await toggleSavedCourse(db, user.id, slug);
  const back = value(formData, "back", 200);
  const base =
    back.startsWith("/app/learn") && !back.startsWith("//")
      ? back.split("#")[0]!
      : coursePath(slug);
  const join = base.includes("?") ? "&" : "?";
  redirect(`${base}${join}enregistre=${saved ? "1" : "0"}`);
}

/** After a lesson or a quiz: the next lesson, or the congratulations when the course is finished. */
async function afterProgress(
  user: { id: string; email: string; firstName?: string | null },
  slug: string,
  lessonId: string,
  certificate: Awaited<ReturnType<typeof completeLesson>>,
) {
  if (certificate) {
    await notify(db, {
      userIds: [user.id],
      type: "certificateIssued",
      payload: { courseTitle: certificate.courseTitle },
      href: "/app/learn/attestations",
    });
    const email = certificateEmail(user.firstName, {
      courseTitle: certificate.courseTitle,
      code: certificate.code,
      certificateId: certificate.id,
    });
    await send(user.email, email.subject, email.props).catch((error) => reportError(error));
    redirect(`${coursePath(slug)}?bravo=${certificate.id}`);
  }
  const found = await getLearnerCourse(db, user.id, slug);
  const lessons = found ? lessonsOf(found.course) : [];
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  const next = lessons[index + 1];
  redirect(
    next
      ? `${coursePath(slug)}?lecon=${next.id}`
      : `${coursePath(slug)}?lecon=${lessonId}&termine=1`,
  );
}

export async function completeLessonAction(formData: FormData) {
  const slug = value(formData, "slug");
  const lessonId = value(formData, "lesson");
  const user = await requireUser(coursePath(slug));
  const certificate = await learnerGuard(slug, () => completeLesson(db, user.id, lessonId));
  await afterProgress(user, slug, lessonId, certificate);
}

export async function submitQuizAction(formData: FormData) {
  const slug = value(formData, "slug");
  const lessonId = value(formData, "lesson");
  const user = await requireUser(coursePath(slug));
  const answers: Record<string, string[]> = {};
  for (const [key, entry] of formData.entries()) {
    if (!key.startsWith("q_")) continue;
    const id = key.slice(2, 62);
    answers[id] = [...(answers[id] ?? []), String(entry).slice(0, 300)];
  }
  const result = await learnerGuard(slug, () => submitQuiz(db, user.id, lessonId, answers));
  if (result.certificate) await afterProgress(user, slug, lessonId, result.certificate);
  redirect(`${coursePath(slug)}?lecon=${lessonId}&tentative=${result.attemptId}`);
}

export async function addNoteAction(formData: FormData) {
  const slug = value(formData, "slug");
  const lessonId = value(formData, "lesson");
  const user = await requireUser(coursePath(slug));
  await learnerGuard(slug, () =>
    addLessonNote(db, user.id, lessonId, String(formData.get("body") ?? "")),
  );
  refresh();
  redirect(`${coursePath(slug)}?lecon=${lessonId}&note=1#notes`);
}

export async function deleteNoteAction(formData: FormData) {
  const slug = value(formData, "slug");
  const lessonId = value(formData, "lesson");
  const user = await requireUser(coursePath(slug));
  await deleteLessonNote(db, user.id, value(formData, "note"));
  refresh();
  redirect(`${coursePath(slug)}?lecon=${lessonId}#notes`);
}
