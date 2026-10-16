import { afterAll, describe, expect, it } from "vitest";
import { enroll, LearnError } from "@/server/services/learn";
import { lessonResume, saveLessonPosition } from "@/server/services/lesson-progress";
import { cleanup, db, newUser } from "./helpers";

const courses: string[] = [];
const users: string[] = [];

afterAll(async () => {
  await db.enrollment.deleteMany({ where: { courseId: { in: courses } } });
  await db.course.deleteMany({ where: { id: { in: courses } } });
  await cleanup(users);
  await db.$disconnect();
});

describe("lesson video resume (Learn v2, étape 3)", () => {
  it("saves the position of an enrolled learner only, and resumes there", async () => {
    const slug = `test-reprise-${Math.random().toString(36).slice(2, 8)}`;
    const course = await db.course.create({
      data: {
        slug,
        title: "Formation test reprise",
        summary: "Test",
        description: "Test",
        audience: "Test",
        category: "Test",
        level: "beginner",
        durationMinutes: 10,
        requiredLevel: "free",
        status: "published",
        publishedAt: new Date(),
        modules: {
          create: {
            order: 1,
            title: "Module",
            lessons: {
              create: [
                { order: 1, title: "Vidéo", kind: "video", durationSec: 600 },
                { order: 2, title: "Texte", kind: "text", durationSec: 60 },
              ],
            },
          },
        },
      },
      include: { modules: { include: { lessons: { orderBy: { order: "asc" } } } } },
    });
    courses.push(course.id);
    const [video, text] = course.modules[0]!.lessons;
    const user = await newUser();
    users.push(user.id);

    // Not enrolled: nothing is saved.
    await expect(
      saveLessonPosition(db, user.id, { lessonId: video!.id, position: 30 }),
    ).rejects.toBeInstanceOf(LearnError);

    await enroll(db, user.id, slug);
    expect(
      await saveLessonPosition(db, user.id, { lessonId: video!.id, position: 192, duration: 600 }),
    ).toBe(192);
    expect(await lessonResume(db, user.id, video!.id)).toBe(192);
    const enrollment = await db.enrollment.findFirst({
      where: { userId: user.id, courseId: course.id },
    });
    expect(enrollment?.lastLessonId).toBe(video!.id);

    // A position past the end is kept at the end; near the end, the video starts over.
    expect(
      await saveLessonPosition(db, user.id, { lessonId: video!.id, position: 900, duration: 600 }),
    ).toBe(600);
    expect(await lessonResume(db, user.id, video!.id)).toBe(0);

    // Only video lessons have a position.
    await expect(
      saveLessonPosition(db, user.id, { lessonId: text!.id, position: 10 }),
    ).rejects.toMatchObject({ code: "invalid" });
  });
});
