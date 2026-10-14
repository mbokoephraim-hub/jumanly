import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { invalidate } from "@/server/entitlements";
import {
  addLesson,
  addModule,
  addQuestion,
  createCourse,
  setCourseStatus,
  updateCourse,
} from "@/server/services/course-admin";
import {
  addLessonNote,
  completeLesson,
  enroll,
  getLearnerCourse,
  LearnError,
  revokeCertificate,
  submitQuiz,
  verifyCertificate,
} from "@/server/services/learn";
import { cleanup, db, newUser } from "./helpers";

const users: string[] = [];
const courses: string[] = [];

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { actorId: { in: users } } });
  await cleanup(users);
  await db.course.deleteMany({ where: { id: { in: courses } } });
  await db.$disconnect();
});
beforeEach(() => invalidate());

async function talent(catalogLevel?: string) {
  const user = await newUser();
  users.push(user.id);
  if (catalogLevel) {
    // The plan is chosen by its entitlement, never by its name (CLAUDE.md § 2).
    const plan = await db.plan.findFirstOrThrow({
      where: {
        family: "talent",
        entitlements: { some: { key: "learn.catalog.level", value: catalogLevel } },
      },
    });
    const now = new Date();
    await db.subscription.create({
      data: {
        subjectType: "user",
        subjectId: user.id,
        planId: plan.id,
        status: "active",
        source: "self",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 86_400_000),
      },
    });
  }
  return user;
}

/** A published course built with the admin editor: one text lesson and a one-question quiz. */
async function course(requiredLevel: "free" | "fundamentals", maxAttempts = 0) {
  const created = await createCourse(
    db,
    `Formation test ${Math.random().toString(36).slice(2, 8)}`,
  );
  courses.push(created!.id);
  const skill = await db.skill.findFirstOrThrow();
  await updateCourse(db, created!.id, {
    title: created!.title,
    slug: "",
    summary: "Résumé test",
    description: "Description test",
    objectives: "Objectif test",
    audience: "Public test",
    category: "Test",
    level: "beginner",
    language: "fr",
    durationMinutes: 90,
    instructor: "Formateur test",
    prerequisites: "",
    requiredLevel,
    certificateEnabled: "on",
    coverUrl: "",
    skills: skill.name,
    jobFamilies: "",
  });
  const firstModule = await addModule(db, created!.id, "Module test");
  const text = await addLesson(db, created!.id, firstModule!.id, { title: "Texte", kind: "text" });
  const quiz = await addLesson(db, created!.id, firstModule!.id, { title: "Quiz", kind: "quiz" });
  await db.quiz.update({ where: { lessonId: quiz!.id }, data: { maxAttempts } });
  expect(await setCourseStatus(db, created!.id, "published")).toMatchObject({
    ok: false,
    problems: ["quiz"],
  });
  await addQuestion(db, created!.id, quiz!.id, {
    prompt: "Deux plus deux ?",
    type: "single",
    options: "Trois\nQuatre",
    answer: "2",
    explanation: "",
  });
  expect(await setCourseStatus(db, created!.id, "published")).toMatchObject({ ok: true });
  const question = await db.question.findFirstOrThrow({ where: { quiz: { lessonId: quiz!.id } } });
  return { ...created!, textId: text!.id, quizId: quiz!.id, questionId: question.id, skill };
}

describe("Accès au catalogue selon learn.catalog.level", () => {
  it("une formation « fondamentaux » est fermée en Free et ouverte au niveau fondamentaux", async () => {
    const target = await course("fundamentals");
    const free = await talent();
    expect((await getLearnerCourse(db, free.id, target.slug))?.open).toBe(false);
    expect(await enroll(db, free.id, target.slug)).toBe("locked");
    await expect(completeLesson(db, free.id, target.textId)).rejects.toBeInstanceOf(LearnError);

    const starter = await talent("fundamentals");
    expect((await getLearnerCourse(db, starter.id, target.slug))?.open).toBe(true);
    expect(await enroll(db, starter.id, target.slug)).toBe("enrolled");
    expect(await enroll(db, starter.id, target.slug)).toBe("already");
  });

  it("une formation gratuite est ouverte à tous ; un brouillon n'existe pas pour l'apprenant", async () => {
    const target = await course("free");
    const free = await talent();
    expect(await enroll(db, free.id, target.slug)).toBe("enrolled");
    await db.course.update({ where: { id: target.id }, data: { status: "draft" } });
    expect(await getLearnerCourse(db, free.id, target.slug)).toBeNull();
  });
});

describe("Progression, quiz et attestation", () => {
  it("le parcours complet délivre une attestation et des compétences vérifiées", async () => {
    const target = await course("free");
    const user = await talent();
    await expect(completeLesson(db, user.id, target.textId)).rejects.toMatchObject({
      code: "notEnrolled",
    });
    await enroll(db, user.id, target.slug);
    expect(await completeLesson(db, user.id, target.textId)).toBeNull();
    // A quiz is only completed by passing it.
    await expect(completeLesson(db, user.id, target.quizId)).rejects.toMatchObject({
      code: "invalid",
    });

    const failed = await submitQuiz(db, user.id, target.quizId, { [target.questionId]: ["0"] });
    expect(failed).toMatchObject({ passed: false, certificate: null });
    const passed = await submitQuiz(db, user.id, target.quizId, { [target.questionId]: ["1"] });
    expect(passed.passed).toBe(true);
    expect(passed.certificate?.code).toMatch(/^JMN-[A-Z2-9]{4}-[A-Z2-9]{4}$/);

    const enrollment = await db.enrollment.findFirstOrThrow({
      where: { userId: user.id, courseId: target.id },
    });
    expect(enrollment.progress).toBe(100);
    expect(enrollment.completedAt).not.toBeNull();
    const skill = await db.profileSkill.findFirstOrThrow({
      where: { profile: { userId: user.id }, skillId: target.skill.id },
    });
    expect(skill).toMatchObject({ verified: true, source: "course", proof: "certificate" });

    // Passing again does not issue a second attestation.
    const again = await submitQuiz(db, user.id, target.quizId, { [target.questionId]: ["1"] });
    expect(again.certificate).toBeNull();
    expect(await db.certificate.count({ where: { enrollmentId: enrollment.id } })).toBe(1);

    const code = passed.certificate!.code;
    expect((await verifyCertificate(db, code.toLowerCase()))?.revokedAt).toBeNull();
    expect(await verifyCertificate(db, "pas-un-code")).toBeNull();
    const editor = await newUser();
    users.push(editor.id);
    expect(await revokeCertificate(db, editor.id, code)).toBe(true);
    expect(await revokeCertificate(db, editor.id, code)).toBe(false);
    expect((await verifyCertificate(db, code))?.revokedAt).not.toBeNull();
    expect(
      await db.auditLog.count({ where: { action: "certificate.revoke", actorId: editor.id } }),
    ).toBe(1);
  });

  it("le nombre de tentatives d'un quiz est respecté", async () => {
    const target = await course("free", 1);
    const user = await talent();
    await enroll(db, user.id, target.slug);
    await submitQuiz(db, user.id, target.quizId, {});
    await expect(
      submitQuiz(db, user.id, target.quizId, { [target.questionId]: ["1"] }),
    ).rejects.toMatchObject({ code: "attempts" });
  });

  it("les notes sont privées et réservées aux apprenants inscrits", async () => {
    const target = await course("free");
    const user = await talent();
    await expect(addLessonNote(db, user.id, target.textId, "Note")).rejects.toMatchObject({
      code: "notEnrolled",
    });
    await enroll(db, user.id, target.slug);
    await expect(addLessonNote(db, user.id, target.textId, "   ")).rejects.toMatchObject({
      code: "invalid",
    });
    const note = await addLessonNote(db, user.id, target.textId, "Note privée");
    expect(note.body).toBe("Note privée");
  });
});
