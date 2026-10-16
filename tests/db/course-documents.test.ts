import { randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { afterAll, describe, expect, it } from "vitest";
import { createCourseFromTemplate, getCourseForAdmin } from "@/server/services/course-admin";
import {
  addCourseDocument,
  CourseDocumentError,
  deleteCourseDocument,
  documentAccess,
  documentFileName,
  listCourseDocuments,
  moveCourseDocument,
  openCourseDocument,
  updateCourseDocument,
  visibleDocuments,
  type DocumentForm,
} from "@/server/services/course-documents";
import { fakeStorage } from "@/server/storage";
import { cleanup, db, newUser } from "./helpers";

// Documents PDF des formations (Admin v3, étape 5): checks of the file, then who downloads what.
// Fictional course and accounts, removed at the end.
const users: string[] = [];
const courses: string[] = [];
const storage = fakeStorage();

afterAll(async () => {
  await db.course.deleteMany({ where: { id: { in: courses } } });
  await cleanup(users);
});

async function pdf(pages = 2) {
  const document = await PDFDocument.create();
  for (let page = 0; page < pages; page++) document.addPage();
  return document.save({ useObjectStreams: false });
}

const form = (input: Partial<DocumentForm> = {}): DocumentForm => ({
  title: "Support fictif",
  kind: "support",
  visibility: "enrolled",
  lesson: "",
  ...input,
});

async function newCourse(requiredLevel: "free" | "advanced" = "free") {
  const course = await createCourseFromTemplate(
    db,
    {
      title: `Documents test ${randomUUID().slice(0, 8)}`,
      category: "Test",
      level: "beginner",
      language: "fr",
      requiredLevel,
      template: "short",
    },
    { module: (index) => `M${index}`, finalModule: "F", lesson: (label) => label },
  );
  courses.push(course.id);
  return course;
}

describe("Documents PDF : fichiers", () => {
  it("lit le nombre de pages, refuse un autre type, un PDF illisible ou chiffré", async () => {
    const course = await newCourse();
    const author = await newUser();
    users.push(author.id);
    const added = await addCourseDocument(db, storage, {
      courseId: course.id,
      authorId: author.id,
      form: form(),
      bytes: await pdf(3),
    });
    expect(added.pages).toBe(3);
    expect(added.storageKey.startsWith("public/")).toBe(false);

    const refused = async (bytes: Uint8Array) =>
      addCourseDocument(db, storage, {
        courseId: course.id,
        authorId: author.id,
        form: form(),
        bytes,
      }).catch((error: CourseDocumentError) => error.code);
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]);
    expect(await refused(png)).toBe("fileType");
    expect(await refused(new TextEncoder().encode("%PDF-1.4 illisible"))).toBe("unreadable");
    const text = Buffer.from(await pdf()).toString("latin1");
    const encrypted = Buffer.from(
      text.replace("trailer\n<<", "trailer\n<<\n/Encrypt 1 0 R"),
      "latin1",
    );
    expect(await refused(new Uint8Array(encrypted))).toBe("encrypted");
    const big = new Uint8Array(4 * 1024 * 1024 + 1);
    big.set([0x25, 0x50, 0x44, 0x46]);
    expect(await refused(big)).toBe("fileSize");
  });

  it("un corrigé reste à l'équipe, un document spécialisé n'est jamais public ; ordre et suppression", async () => {
    const course = await newCourse();
    const full = (await getCourseForAdmin(db, course.id))!;
    const lesson = full.modules[0]!.lessons[0]!;
    const author = await newUser();
    users.push(author.id);
    const add = async (input: Partial<DocumentForm>) =>
      addCourseDocument(db, storage, {
        courseId: course.id,
        authorId: author.id,
        form: form(input),
        bytes: await pdf(),
      });
    const key = await add({ title: "Corrigé", kind: "answer_key", visibility: "public" });
    const special = await add({ title: "Spécial", visibility: "public", specialized: "on" });
    const other = await add({ title: "Leçon", lesson: lesson.id });
    expect(key.visibility).toBe("team");
    expect(special.visibility).toBe("enrolled");
    expect(other.lessonId).toBe(lesson.id);
    // A lesson of another course is never attached.
    const elsewhere = await add({ lesson: randomUUID() });
    expect(elsewhere.lessonId).toBeNull();

    expect(await moveCourseDocument(db, course.id, other.id, "up")).toBe(true);
    expect(await moveCourseDocument(db, course.id, key.id, "up")).toBe(false);
    expect((await listCourseDocuments(db, course.id)).map((item) => item.title)).toEqual([
      "Corrigé",
      "Leçon",
      "Spécial",
      "Support fictif",
    ]);

    const replaced = await updateCourseDocument(db, storage, {
      courseId: course.id,
      id: other.id,
      form: form({ title: "Leçon renommée", lesson: lesson.id }),
      bytes: await pdf(5),
    });
    expect(replaced.pages).toBe(5);
    expect(await deleteCourseDocument(db, storage, course.id, special.id)).toBe(true);
    expect(await storage.get(special.storageKey)).toBeNull();
    expect(documentFileName("Fiche d'exercices : été 2026")).toBe("fiche-d-exercices-ete-2026.pdf");
  });
});

describe("Documents PDF : qui télécharge quoi", () => {
  const base = { specialized: false, previewLesson: false, published: true };
  const talent = { team: false, enrolled: true, levelOpens: true, specialized: false };

  it("applique la règle dans l'ordre", () => {
    // Public: everyone, even a visitor.
    expect(documentAccess({ ...base, visibility: "public" }, null)).toBe(true);
    // Enrolled: an enrolled talent whose plan opens the course.
    expect(documentAccess({ ...base, visibility: "enrolled" }, talent)).toBe(true);
    expect(documentAccess({ ...base, visibility: "enrolled" }, null)).toBe(false);
    expect(
      documentAccess({ ...base, visibility: "enrolled" }, { ...talent, enrolled: false }),
    ).toBe(false);
    expect(
      documentAccess({ ...base, visibility: "enrolled" }, { ...talent, levelOpens: false }),
    ).toBe(false);
    // A document of a preview lesson is for everyone.
    expect(documentAccess({ ...base, visibility: "enrolled", previewLesson: true }, null)).toBe(
      true,
    );
    // Specialized: the right is needed.
    expect(documentAccess({ ...base, visibility: "enrolled", specialized: true }, talent)).toBe(
      false,
    );
    expect(
      documentAccess(
        { ...base, visibility: "enrolled", specialized: true },
        { ...talent, specialized: true },
      ),
    ).toBe(true);
    // Team: the team only; an unpublished course too.
    const team = { team: true, enrolled: false, levelOpens: false, specialized: false };
    expect(documentAccess({ ...base, visibility: "team" }, talent)).toBe(false);
    expect(documentAccess({ ...base, visibility: "team" }, team)).toBe(true);
    expect(documentAccess({ ...base, visibility: "public", published: false }, null)).toBe(false);
  });

  it("en base : inscrit, non inscrit, niveau insuffisant, droit spécialisé, équipe", async () => {
    const course = await newCourse("advanced");
    await db.course.update({ where: { id: course.id }, data: { status: "published" } });
    const [enrolled, outsider, special, editor] = await Promise.all([
      newUser(),
      newUser(),
      newUser(),
      newUser(),
    ]);
    users.push(enrolled.id, outsider.id, special.id, editor.id);
    await db.user.update({ where: { id: editor.id }, data: { platformRole: "content_editor" } });
    // `enrolled` has the course but a Free plan; `special` is enrolled with an advanced catalog
    // and the specialized right (overrides, never a plan name).
    await db.enrollment.createMany({
      data: [
        { userId: enrolled.id, courseId: course.id },
        { userId: special.id, courseId: course.id },
      ],
    });
    await db.entitlementOverride.createMany({
      data: [
        {
          subjectType: "user",
          subjectId: special.id,
          key: "learn.catalog.level",
          value: "advanced",
          reason: "test",
        },
        {
          subjectType: "user",
          subjectId: special.id,
          key: "learn.resources.specialized",
          value: "true",
          reason: "test",
        },
      ],
    });
    const add = async (input: Partial<DocumentForm>) =>
      addCourseDocument(db, storage, {
        courseId: course.id,
        authorId: editor.id,
        form: form(input),
        bytes: await pdf(),
      });
    const open = await add({ title: "Public", visibility: "public" });
    const members = await add({ title: "Inscrits" });
    const specialized = await add({ title: "Spécialisé", specialized: "on" });
    const team = await add({ title: "Équipe", kind: "answer_key" });

    const can = async (user: { id: string; platformRole: string } | null, id: string) =>
      Boolean(await openCourseDocument(db, storage, user, id));
    const as = (user: { id: string }, role = "user") => ({ id: user.id, platformRole: role });

    expect(await can(null, open.id)).toBe(true);
    expect(await can(null, members.id)).toBe(false);
    expect(await can(as(outsider), members.id)).toBe(false);
    // Enrolled, but the plan does not open an advanced course.
    expect(await can(as(enrolled), members.id)).toBe(false);
    expect(await can(as(special), members.id)).toBe(true);
    expect(await can(as(special), specialized.id)).toBe(true);
    expect(await can(as(special), team.id)).toBe(false);
    expect(await can(as(editor, "content_editor"), team.id)).toBe(true);
    expect((await db.courseDocument.findUnique({ where: { id: open.id } }))!.downloads).toBe(1);

    const listed = await visibleDocuments(db, { ...course, status: "published" }, null);
    expect(listed.map((item) => item.title)).toEqual(["Public"]);
  });
});
