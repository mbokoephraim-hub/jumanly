import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import {
  addLesson,
  addModule,
  addQuestion,
  courseStats,
  createCourse,
  duplicateCourse,
  getCourseForAdmin,
} from "@/server/services/course-admin";
import {
  CourseMediaError,
  coverAt,
  saveCover,
  saveLessonVideoFile,
} from "@/server/services/course-media";
import { fakeStorage } from "@/server/storage";
import { cleanup, db, newUser } from "./helpers";

// Formations, Admin v2 étape 6: duplicate, figures of the list, cover and video sent from the
// computer. Fictional courses, removed at the end.
const users: string[] = [];
const courses: string[] = [];
const storage = fakeStorage();

afterAll(async () => {
  await db.course.deleteMany({ where: { id: { in: courses } } });
  await cleanup(users);
  await db.$disconnect();
});

async function courseWithQuiz() {
  const course = (await createCourse(db, `Formation test ${randomUUID().slice(0, 8)}`))!;
  courses.push(course.id);
  const created = (await addModule(db, course.id, "Module test"))!;
  await addLesson(db, course.id, created.id, { title: "Leçon texte", kind: "text" });
  const quiz = (await addLesson(db, course.id, created.id, { title: "Quiz", kind: "quiz" }))!;
  await addQuestion(db, course.id, quiz.id, {
    prompt: "Deux plus deux ?",
    type: "single",
    options: "Trois\nQuatre",
    answer: "2",
    explanation: "",
  });
  return { course, quizLesson: quiz };
}

describe("formations (Admin v2, étape 6)", () => {
  it("duplique en brouillon le programme et les quiz, sans couverture ni apprenants", async () => {
    const { course } = await courseWithQuiz();
    await db.course.update({
      where: { id: course.id },
      data: { status: "published", coverUrl: "/medias/courses/x/cover-a-960.webp" },
    });
    const copy = (await duplicateCourse(db, course.id, "Copie test"))!;
    courses.push(copy.id);
    const full = (await getCourseForAdmin(db, copy.id))!;
    expect(full.status).toBe("draft");
    expect(full.coverUrl).toBeNull();
    expect(full.slug).not.toBe(course.slug);
    const lessons = full.modules.flatMap((module) => module.lessons);
    expect(lessons.map((lesson) => lesson.title)).toEqual(["Leçon texte", "Quiz"]);
    expect(lessons[1]!.quiz?.questions).toHaveLength(1);
    expect(await db.enrollment.count({ where: { courseId: copy.id } })).toBe(0);
  });

  it("compte inscrits, réussite, moyenne des quiz et attestations", async () => {
    const { course, quizLesson } = await courseWithQuiz();
    const quiz = (await db.quiz.findUnique({ where: { lessonId: quizLesson.id } }))!;
    const [first, second] = [await newUser(), await newUser()];
    users.push(first.id, second.id);
    const done = await db.enrollment.create({
      data: { userId: first.id, courseId: course.id, progress: 100, completedAt: new Date() },
    });
    await db.enrollment.create({ data: { userId: second.id, courseId: course.id } });
    await db.certificate.create({
      data: {
        enrollmentId: done.id,
        code: `JMN-T${randomUUID().slice(0, 7).toUpperCase()}`,
        holderName: "Test Fictif",
        courseTitle: course.title,
        hours: 1,
      },
    });
    // Best score per person: 40 then 90 for the first, 60 for the second → (90 + 60) / 2.
    for (const [userId, score] of [
      [first.id, 40],
      [first.id, 90],
      [second.id, 60],
    ] as const)
      await db.quizAttempt.create({
        data: { userId, quizId: quiz.id, score, answers: {}, passed: score >= 70 },
      });
    const stats = (await courseStats(db, [course.id])).get(course.id);
    expect(stats).toEqual({ enrolled: 2, completion: 50, quizAverage: 75, certificates: 1 });
  });

  it("recadre la couverture en 16:9, en trois largeurs WebP, et remplace l'ancienne", async () => {
    const { course } = await courseWithQuiz();
    const png = new Uint8Array(
      await sharp({
        create: { width: 800, height: 800, channels: 3, background: { r: 166, g: 242, b: 107 } },
      })
        .png()
        .toBuffer(),
    );
    const first = await saveCover(db, storage, course.id, png);
    expect(first).toMatch(/^\/medias\/courses\/.+-960\.webp$/);
    const key = (url: string) => `public/${url.slice("/medias/".length)}`;
    const stored = (await storage.get(key(coverAt(first, 480))))!;
    expect(stored.contentType).toBe("image/webp");
    expect(await sharp(stored.bytes).metadata()).toMatchObject({ width: 480, height: 270 });
    const second = await saveCover(db, storage, course.id, png);
    expect(await storage.get(key(first))).toBeNull();
    expect((await db.course.findUnique({ where: { id: course.id } }))!.coverUrl).toBe(second);
    await expect(
      saveCover(db, storage, course.id, new TextEncoder().encode("pas une image")),
    ).rejects.toBeInstanceOf(CourseMediaError);
  });

  it("enregistre une petite vidéo MP4 sur la leçon, refuse un autre fichier", async () => {
    const { course, quizLesson } = await courseWithQuiz();
    const mp4 = new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
    await saveLessonVideoFile(db, storage, course.id, quizLesson.id, mp4);
    const lesson = (await db.lesson.findUnique({ where: { id: quizLesson.id } }))!;
    expect(lesson.kind).toBe("video");
    expect(lesson.videoId).toMatch(/^\/medias\/lessons\//);
    await expect(
      saveLessonVideoFile(
        db,
        storage,
        course.id,
        quizLesson.id,
        new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
      ),
    ).rejects.toMatchObject({ code: "fileType" });
  });
});
