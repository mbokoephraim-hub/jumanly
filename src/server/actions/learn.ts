"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { certificateEmail } from "../../../emails/_components/learn-content";
import { send } from "@/server/account-emails";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { setAttestationOnProfile } from "@/server/services/attestations";
import { EXERCISE_MAX_BYTES, submitExercise } from "@/server/services/exercises";
import { fileStorage } from "@/server/storage";
import {
  addLessonNote,
  checkQuizQuestion,
  completeLesson,
  deleteLessonNote,
  enroll,
  getLearnerCourse,
  LearnError,
  finishedModule,
  lessonsOf,
  submitQuiz,
  toggleSavedCourse,
} from "@/server/services/learn";
import { notify } from "@/server/services/notifications";
import { reportError } from "@/server/observability";

const value = (formData: FormData, key: string, max = 80) =>
  String(formData.get(key) ?? "").slice(0, max);
const coursePath = (slug: string) => `/app/learn/${encodeURIComponent(slug)}`;
const lessonPath = (slug: string, lessonId: string) =>
  `${coursePath(slug)}/${encodeURIComponent(lessonId)}`;

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
  redirect(first ? `${lessonPath(slug, first.id)}?inscrit=1` : coursePath(slug));
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
/**
 * The lesson after `lessonId` and, when that lesson closed its module, the `&module=` flag that
 * shows the module's small celebration (ux-test, étape 4).
 */
async function moduleStep(userId: string, slug: string, lessonId: string) {
  const found = await getLearnerCourse(db, userId, slug);
  const lessons = found ? lessonsOf(found.course) : [];
  const next = lessons[lessons.findIndex((lesson) => lesson.id === lessonId) + 1];
  const finished = found?.enrollment
    ? finishedModule(found.course, found.enrollment.completedLessons, lessonId)
    : null;
  const celebrate =
    finished && next && next.module.id !== finished.id ? `&module=${finished.order}` : "";
  return { next, celebrate };
}

type Learner = { id: string; email: string; firstName?: string | null };

/** A new attestation: the notification and the e-mail (also used by the phone, lot B7). */
export async function announceCertificate(
  user: Learner,
  certificate: NonNullable<Awaited<ReturnType<typeof completeLesson>>>,
) {
  await notify(db, {
    userIds: [user.id],
    type: "certificateIssued",
    payload: { courseTitle: certificate.courseTitle },
    href: `/app/learn/attestations/${certificate.code}`,
  });
  const email = certificateEmail(user.firstName, {
    courseTitle: certificate.courseTitle,
    code: certificate.code,
    certificateId: certificate.id,
  });
  await send(user.email, email.subject, email.props).catch((error) => reportError(error));
}

async function afterProgress(
  user: Learner,
  slug: string,
  lessonId: string,
  certificate: Awaited<ReturnType<typeof completeLesson>>,
) {
  if (certificate) {
    await announceCertificate(user, certificate);
    redirect(`${coursePath(slug)}?vue=terminee`);
  }
  const { next, celebrate } = await moduleStep(user.id, slug, lessonId);
  redirect(next ? `${lessonPath(slug, next.id)}${celebrate.replace("&", "?")}` : coursePath(slug));
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
  const celebrate = result.passed ? (await moduleStep(user.id, slug, lessonId)).celebrate : "";
  redirect(`${lessonPath(slug, lessonId)}?tentative=${result.attemptId}${celebrate}`);
}

export async function addNoteAction(formData: FormData) {
  const slug = value(formData, "slug");
  const lessonId = value(formData, "lesson");
  const user = await requireUser(coursePath(slug));
  await learnerGuard(slug, () =>
    addLessonNote(db, user.id, lessonId, String(formData.get("body") ?? "")),
  );
  refresh();
  redirect(`${lessonPath(slug, lessonId)}?note=1#notes`);
}

export async function deleteNoteAction(formData: FormData) {
  const slug = value(formData, "slug");
  const lessonId = value(formData, "lesson");
  const user = await requireUser(coursePath(slug));
  await deleteLessonNote(db, user.id, value(formData, "note"));
  refresh();
  redirect(`${lessonPath(slug, lessonId)}#notes`);
}

/** The correction of one quiz question while the quiz goes (nothing is recorded). */
export async function checkQuizAnswerAction(input: {
  lessonId: string;
  questionId: string;
  given: string[];
}) {
  const user = await requireUser("/app/learn");
  if (
    typeof input?.lessonId !== "string" ||
    typeof input.questionId !== "string" ||
    !Array.isArray(input.given)
  )
    return { ok: false as const };
  try {
    const result = await checkQuizQuestion(
      db,
      user.id,
      input.lessonId.slice(0, 60),
      input.questionId.slice(0, 60),
      input.given.map((value) => String(value).slice(0, 300)),
    );
    return { ok: true as const, ...result };
  } catch (error) {
    if (error instanceof LearnError) return { ok: false as const };
    throw error;
  }
}

/** « Rendre l'exercice »: a file (PDF or photo, 5 Mo at most) or one of the learner's CVs. */
export async function submitExerciseAction(formData: FormData) {
  const slug = value(formData, "slug");
  const lessonId = value(formData, "lesson");
  const user = await requireUser(lessonPath(slug, lessonId));
  const file = formData.get("fichier");
  const documentId = value(formData, "cv");
  const back = (code: string) => redirect(`${lessonPath(slug, lessonId)}?exercice=${code}`);
  let input: Parameters<typeof submitExercise>[4];
  if (file instanceof File && file.size > 0) {
    if (file.size > EXERCISE_MAX_BYTES) back("taille");
    input = { file: { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) } };
  } else if (documentId) input = { documentId };
  else return back("vide");
  let certificate: Awaited<ReturnType<typeof submitExercise>>;
  try {
    certificate = await submitExercise(db, fileStorage(db), user.id, lessonId, input);
  } catch (error) {
    if (!(error instanceof LearnError)) throw error;
    if (error.code === "invalid") back("format");
    redirect(`${coursePath(slug)}?erreur=${error.code}`);
  }
  await afterProgress(user, slug, lessonId, certificate);
}

/** « Visible sur mon profil » of an attestation. */
export async function attestationOnProfileAction(formData: FormData) {
  const id = value(formData, "id");
  const user = await requireUser("/app/learn/mes-formations?vue=attestations");
  await setAttestationOnProfile(db, user.id, id, formData.get("visible") === "1");
  refresh();
  redirect(`/app/learn/attestations/${encodeURIComponent(value(formData, "code"))}`);
}
