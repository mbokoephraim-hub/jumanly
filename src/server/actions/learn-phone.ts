"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { reportError } from "@/server/observability";
import { setAttestationOnProfile } from "@/server/services/attestations";
import {
  completeLesson,
  enroll,
  getLearnerCourse,
  LearnError,
  lessonsOf,
  toggleSavedCourse,
} from "@/server/services/learn";
import { answerLessonCheck, formationScopes, searchFormation } from "@/server/services/learn-phone";
import { listPublicPlans } from "@/server/services/plans";
import { foundView, type FoundView } from "@/components/phone/learn/data";
import { announceCertificate } from "./learn";

/**
 * The gestures of Formation on the phone (Modèle B, lot B7). Order of CLAUDE.md: validate →
 * session → service. Each one answers with a small result the screen turns into a toast or a
 * page; nothing throws to the page. Quizzes and exercises keep the forms of `learn.ts`.
 */
export type LearnResult<T> = { ok: true; value: T } | { ok: false; error: string };

const PAGE = "/app/learn";
const idSchema = z
  .string()
  .trim()
  .regex(/^[\w-]{1,60}$/);
const slugSchema = z.string().trim().min(1).max(200);
const searchSchema = z.object({ query: z.string().max(80), scope: z.enum(formationScopes) });

const lessonHref = (slug: string, id: string) =>
  `/app/learn/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`;

/** The results of the search of Formation, from the first letter. */
export async function learnSearchAction(
  query: string,
  scope: string,
): Promise<LearnResult<FoundView>> {
  const parsed = searchSchema.safeParse({ query, scope });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(PAGE);
  try {
    const [found, plans] = await Promise.all([
      searchFormation(db, user.id, parsed.data.query, parsed.data.scope),
      listPublicPlans(db),
    ]);
    return { ok: true, value: await foundView(found, plans) };
  } catch (error) {
    void reportError(error, { message: "Formation · recherche" });
    return { ok: false, error: "failed" };
  }
}

/** « Enregistrer » a course: it comes into « Mes cours ». */
export async function saveCourseAction(slug: string): Promise<LearnResult<boolean>> {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(PAGE);
  try {
    const saved = await toggleSavedCourse(db, user.id, parsed.data);
    if (saved === null) return { ok: false, error: "notFound" };
    refresh();
    return { ok: true, value: saved };
  } catch (error) {
    void reportError(error, { message: "Formation · enregistrer" });
    return { ok: false, error: "failed" };
  }
}

/**
 * « Commencer » or « Reprendre la leçon 3 »: enrolls when needed, then gives the lesson to open
 * (the one touched in the programme, or the first not done). A course above the plan answers `locked`: the screen shows the formulas.
 */
export async function startCourseAction(
  slug: string,
  lessonId?: string,
): Promise<LearnResult<string>> {
  const parsed = slugSchema.safeParse(slug);
  const lesson = lessonId === undefined ? null : idSchema.safeParse(lessonId);
  if (!parsed.success || lesson?.success === false) return { ok: false, error: "invalid" };
  const user = await requireUser(PAGE);
  try {
    const result = await enroll(db, user.id, parsed.data);
    if (result === "notFound" || result === "locked") return { ok: false, error: result };
    const found = await getLearnerCourse(db, user.id, parsed.data);
    if (!found) return { ok: false, error: "notFound" };
    const lessons = lessonsOf(found.course);
    const done = new Set(found.enrollment?.completedLessons ?? []);
    const asked = lesson?.success ? lessons.find((item) => item.id === lesson.data) : undefined;
    const next = asked ?? lessons.find((item) => !done.has(item.id)) ?? lessons[0];
    if (result === "enrolled") refresh();
    return {
      ok: true,
      value: next ? lessonHref(found.course.slug, next.id) : `/app/learn/${found.course.slug}`,
    };
  } catch (error) {
    void reportError(error, { message: "Formation · commencer" });
    return { ok: false, error: "failed" };
  }
}

/** The quick question of a lesson: right or wrong and why. Nothing is recorded. */
export async function lessonCheckAction(
  lessonId: string,
  choice: number,
): Promise<LearnResult<{ correct: boolean; answer: number; explanation: string | null }>> {
  const parsed = z
    .object({ lessonId: idSchema, choice: z.number().int().min(0).max(3) })
    .safeParse({ lessonId, choice });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(PAGE);
  try {
    return {
      ok: true,
      value: await answerLessonCheck(db, user.id, parsed.data.lessonId, parsed.data.choice),
    };
  } catch (error) {
    if (error instanceof LearnError) return { ok: false, error: error.code };
    void reportError(error, { message: "Formation · question rapide" });
    return { ok: false, error: "failed" };
  }
}

/**
 * « Leçon suivante » and « Terminer le cours »: the lesson is done, then the next one, or the
 * attestation when it closes the course (notification and e-mail, as on a computer).
 */
export async function finishLessonAction(
  lessonId: string,
): Promise<LearnResult<{ href: string; certificate: boolean }>> {
  const parsed = idSchema.safeParse(lessonId);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(PAGE);
  try {
    const lesson = await db.lesson.findUnique({
      where: { id: parsed.data },
      select: { kind: true, module: { select: { course: { select: { slug: true } } } } },
    });
    if (!lesson) return { ok: false, error: "notFound" };
    const slug = lesson.module.course.slug;
    // A quiz or an exercise is done by its own form; « Leçon suivante » then only moves on.
    const certificate =
      lesson.kind === "quiz" || lesson.kind === "exercise"
        ? null
        : await completeLesson(db, user.id, parsed.data);
    refresh();
    if (certificate) {
      await announceCertificate(user, certificate);
      return {
        ok: true,
        value: { href: `/app/learn/attestations/${certificate.id}?nouvelle=1`, certificate: true },
      };
    }
    const found = await getLearnerCourse(db, user.id, slug);
    const lessons = found ? lessonsOf(found.course) : [];
    const next = lessons[lessons.findIndex((item) => item.id === parsed.data) + 1];
    return {
      ok: true,
      value: {
        href: next ? lessonHref(slug, next.id) : `/app/learn/${encodeURIComponent(slug)}`,
        certificate: false,
      },
    };
  } catch (error) {
    if (error instanceof LearnError) return { ok: false, error: error.code };
    void reportError(error, { message: "Formation · leçon terminée" });
    return { ok: false, error: "failed" };
  }
}

/** « Ajouter à mon profil »: the attestation shows on the profile in Carrière. */
export async function attestationProfileAction(
  id: string,
  visible: boolean,
): Promise<LearnResult<boolean>> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success || typeof visible !== "boolean") return { ok: false, error: "invalid" };
  const user = await requireUser(PAGE);
  try {
    const done = await setAttestationOnProfile(db, user.id, parsed.data, visible);
    if (!done) return { ok: false, error: "notFound" };
    refresh();
    return { ok: true, value: visible };
  } catch (error) {
    void reportError(error, { message: "Formation · attestation au profil" });
    return { ok: false, error: "failed" };
  }
}
