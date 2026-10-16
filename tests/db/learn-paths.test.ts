import { afterAll, describe, expect, it } from "vitest";
import { createCourse } from "@/server/services/course-admin";
import {
  addCourseToPath,
  createPath,
  followPath,
  getPathForAdmin,
  getPathForLearner,
  listPublishedPaths,
  moveCourseInPath,
  myPaths,
  removeCourseFromPath,
  setPathStatus,
  unfollowPath,
  updatePath,
} from "@/server/services/learn-paths";
import { cleanup, db, newUser } from "./helpers";

const courses: string[] = [];
const paths: string[] = [];
const users: string[] = [];

afterAll(async () => {
  await db.learningPath.deleteMany({ where: { id: { in: paths } } });
  await db.enrollment.deleteMany({ where: { courseId: { in: courses } } });
  await db.course.deleteMany({ where: { id: { in: courses } } });
  await cleanup(users);
  await db.$disconnect();
});

async function course(title: string, requiredLevel: "free" | "advanced", published = true) {
  const created = (await createCourse(db, title))!;
  courses.push(created.id);
  return db.course.update({
    where: { id: created.id },
    data: {
      requiredLevel,
      durationMinutes: 60,
      ...(published ? { status: "published", publishedAt: new Date() } : {}),
    },
  });
}

describe("learning paths (Learn v2, étape 2)", () => {
  it("orders courses, publishes once ready, and follows a path course by course", async () => {
    const first = await course("Parcours test A", "free");
    const second = await course("Parcours test B", "free");
    const locked = await course("Parcours test C", "advanced");
    const draft = await course("Parcours test brouillon", "free", false);

    const path = await createPath(db, "Parcours test");
    paths.push(path.id);
    for (const item of [second, first, draft, locked]) {
      expect(await addCourseToPath(db, path.id, item.id)).toBe("added");
    }
    expect(await addCourseToPath(db, path.id, first.id)).toBe("already");
    expect(await addCourseToPath(db, path.id, "inconnu")).toBe("notFound");
    await moveCourseInPath(db, path.id, first.id, -1);
    await removeCourseFromPath(db, path.id, draft.id);
    const admin = (await getPathForAdmin(db, path.id))!;
    expect(admin.courses.map((item) => item.course.id)).toEqual([first.id, second.id, locked.id]);
    expect(admin.courses.map((item) => item.order)).toEqual([0, 1, 2]);

    // Not ready without a summary; a draft path is invisible to learners.
    expect((await setPathStatus(db, path.id, "published")).problems).toEqual(["summary"]);
    const user = await newUser();
    users.push(user.id);
    expect(await getPathForLearner(db, user.id, path.slug)).toBeNull();

    await updatePath(db, path.id, {
      title: "Parcours test",
      summary: "Résumé",
      domainId: "inconnu",
      editorialLine: "expert_series",
    });
    expect((await setPathStatus(db, path.id, "published")).ok).toBe(true);
    expect((await listPublishedPaths(db)).some((item) => item.slug === path.slug)).toBe(true);

    // A Free learner: the advanced course stays locked; following enrolls in the next course.
    const view = (await getPathForLearner(db, user.id, path.slug))!;
    expect(view.courses.map((item) => item.state)).toEqual(["todo", "todo", "locked"]);
    expect(view.domain).toBeNull();
    const next = await followPath(db, user.id, path.slug);
    expect(next?.id).toBe(first.id);
    expect(await db.enrollment.count({ where: { userId: user.id, courseId: first.id } })).toBe(1);

    await db.enrollment.updateMany({
      where: { userId: user.id, courseId: first.id },
      data: { completedAt: new Date(), progress: 100 },
    });
    const after = (await myPaths(db, user.id)).find((item) => item.slug === path.slug)!;
    expect(after).toMatchObject({ done: 1, total: 3, percent: 33, followed: true });
    expect(after.next?.id).toBe(second.id);

    // Stop following: the enrollment and its progress stay.
    await unfollowPath(db, user.id, path.slug);
    expect((await myPaths(db, user.id)).some((item) => item.slug === path.slug)).toBe(false);
    expect(await db.enrollment.count({ where: { userId: user.id, courseId: first.id } })).toBe(1);
  });
});
