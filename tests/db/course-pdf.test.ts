import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createTranslator } from "next-intl";
import { PDFDocument } from "pdf-lib";
import { afterAll, describe, expect, it, vi } from "vitest";
import messages from "../../messages/fr.json";
import { createCourseFromTemplate } from "@/server/services/course-admin";
import {
  cachedPdf,
  courseReport,
  loadPdfCourse,
  programmeOf,
  quizKeyOf,
  reportDays,
  supportOf,
} from "@/server/services/course-pdf";
import { buildCoursePdf } from "@/server/pdf/course-pdfs";
import { cleanup, db, newUser } from "./helpers";

// The texts come from messages/fr.json, as in the app.
vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) =>
    createTranslator({ locale: "fr", messages, namespace: namespace as never, timeZone: "UTC" }),
}));

// PDF générés des formations (Admin v3, étape 6): the data each one shows, then the files.
const users: string[] = [];
const courses: string[] = [];

afterAll(async () => {
  await db.course.deleteMany({ where: { id: { in: courses } } });
  await cleanup(users);
});

async function quizCourse() {
  const created = await createCourseFromTemplate(
    db,
    {
      title: `PDF test ${randomUUID().slice(0, 8)}`,
      category: "Test",
      level: "beginner",
      language: "fr",
      requiredLevel: "free",
      template: "short",
    },
    { module: (index) => `Module fictif ${index}`, finalModule: "Bilan", lesson: (label) => label },
  );
  courses.push(created.id);
  const quiz = await db.quiz.findFirstOrThrow({
    where: { lesson: { module: { courseId: created.id } } },
  });
  await db.question.createMany({
    data: [
      {
        quizId: quiz.id,
        order: 1,
        type: "single",
        prompt: "Quelle rubrique vient en premier ?",
        options: ["Loisirs", "Expérience"],
        answer: ["1"],
        explanation: "L'expérience parle d'abord au recruteur.",
      },
      {
        quizId: quiz.id,
        order: 2,
        type: "text",
        prompt: "Le format de fichier conseillé ?",
        options: [],
        answer: ["PDF", "pdf"],
      },
    ],
  });
  const lesson = await db.lesson.findFirstOrThrow({
    where: { module: { courseId: created.id }, kind: "text" },
  });
  await db.lesson.update({
    where: { id: lesson.id },
    data: { content: { paragraphs: ["Un CV tient sur une page.", "Les verbes d'action aident."] } },
  });
  return (await loadPdfCourse(db, { id: created.id }))!;
}

function pdfText(bytes: Uint8Array) {
  const dir = mkdtempSync(join(tmpdir(), "jumanly-pdf-"));
  writeFileSync(join(dir, "file.pdf"), bytes);
  return execFileSync("pdftotext", ["-layout", join(dir, "file.pdf"), "-"], { encoding: "utf8" });
}
const hasPdftotext = (() => {
  try {
    execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

describe("PDF générés : contenu", () => {
  it("le programme ne montre pas les réponses ; le corrigé donne le texte des bonnes réponses", async () => {
    const course = await quizCourse();
    const programme = programmeOf(course);
    expect(programme.modules.length).toBeGreaterThan(0);
    expect(JSON.stringify(programme)).not.toContain("Expérience");

    const support = supportOf(course);
    const lessons = support.modules.flatMap((module) => module.lessons);
    expect(lessons.some((lesson) => lesson.paragraphs.includes("Un CV tient sur une page."))).toBe(
      true,
    );
    expect(JSON.stringify(support)).not.toContain("L'expérience parle d'abord");

    const key = quizKeyOf(course);
    const [first, second] = key.quizzes[0]!.questions;
    expect(first!.options).toEqual([
      { text: "Loisirs", right: false },
      { text: "Expérience", right: true },
    ]);
    expect(second!.accepted).toEqual(["PDF", "pdf"]);
  });

  it("le bilan compte sans nommer personne, sur la période choisie", async () => {
    const course = await quizCourse();
    const [done, stuck, old] = await Promise.all([newUser(), newUser(), newUser()]);
    users.push(done.id, stuck.id, old.id);
    const firstLesson = course.modules[0]!.lessons[0]!;
    const quiz = course.modules
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.quiz)!.quiz!;
    const now = new Date("2026-10-16T12:00:00Z");
    const enrollment = await db.enrollment.create({
      data: {
        userId: done.id,
        courseId: course.id,
        completedAt: now,
        startedAt: now,
        progress: 100,
      },
    });
    await db.enrollment.createMany({
      data: [
        { userId: stuck.id, courseId: course.id, lastLessonId: firstLesson.id, startedAt: now },
        { userId: old.id, courseId: course.id, startedAt: new Date("2025-01-01T00:00:00Z") },
      ],
    });
    await db.quizAttempt.createMany({
      data: [
        { userId: done.id, quizId: quiz.id, score: 100, answers: {}, passed: true, createdAt: now },
        {
          userId: stuck.id,
          quizId: quiz.id,
          score: 50,
          answers: {},
          passed: false,
          createdAt: now,
        },
      ],
    });
    await db.certificate.create({
      data: {
        enrollmentId: enrollment.id,
        code: `JMN-T${randomUUID().slice(0, 3).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`,
        holderName: "Nom fictif",
        courseTitle: course.title,
        hours: 1,
        issuedAt: now,
      },
    });

    const all = await courseReport(db, course, null, now);
    expect(all).toMatchObject({ enrolled: 3, completed: 1, inProgress: 2, completionRate: 33 });
    expect(all.notStarted).toBe(1);
    expect(all.stops[0]!.count).toBe(1);
    expect(all.quizzes[0]).toMatchObject({ attempts: 2, average: 75, passRate: 50 });
    expect(all.issued).toBe(1);
    expect(JSON.stringify(all)).not.toContain("Nom fictif");

    const recent = await courseReport(db, course, reportDays("30"), now);
    expect(recent.enrolled).toBe(2);
    expect(reportDays("12")).toBeNull();
  });

  it("le cache rend le même fichier tant que le contenu ne change pas", async () => {
    let renders = 0;
    const render = async () => {
      renders++;
      return Buffer.from(`pdf ${renders}`);
    };
    const a = await cachedPdf("test", { id: 1 }, render);
    const b = await cachedPdf("test", { id: 1 }, render);
    const c = await cachedPdf("test", { id: 2 }, render);
    expect(a).toBe(b);
    expect(c).not.toBe(a);
    expect(renders).toBe(2);
  });
});

describe("PDF générés : fichiers", () => {
  it("chaque PDF se génère, avec le titre de la formation", async () => {
    const course = await quizCourse();
    for (const kind of ["programme", "support", "quiz", "attestation", "bilan"] as const) {
      const bytes = await buildCoursePdf(db, kind, course, { documents: ["Fiche fictive"] });
      const pdf = await PDFDocument.load(bytes);
      expect(pdf.getPageCount(), kind).toBeGreaterThan(0);
      if (kind !== "attestation") expect(pdf.getTitle(), kind).toContain(course.title);
    }
  });

  it.skipIf(!hasPdftotext)("le texte est lisible : programme, corrigé, aperçu, bilan", async () => {
    const course = await quizCourse();
    const text = async (kind: "programme" | "support" | "quiz" | "attestation" | "bilan") =>
      pdfText(await buildCoursePdf(db, kind, course, { documents: ["Fiche fictive"] }));
    const programme = await text("programme");
    expect(programme).toContain("Aucun prérequis.");
    expect(programme).toContain("assistant@jumanly.io");
    expect(programme).not.toMatch(/\+\d{3}|téléphone/i);
    expect(await text("support")).toContain("Un CV tient sur une page.");
    const key = await text("quiz");
    expect(key).toContain("Expérience (Bonne réponse)");
    expect(key).toContain("Réponses acceptées : PDF ; pdf");
    expect(await text("attestation")).toContain("JMN-APER-CU00");
    expect(await text("bilan")).toContain("aucun nom de talent");
  });
});
