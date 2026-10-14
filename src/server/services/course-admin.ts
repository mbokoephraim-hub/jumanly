/**
 * Course editor of Jumanly Admin (partie 07 § 12, E5): courses, modules, lessons, quizzes. Pure
 * database work, called by the admin actions after the role check (content editor or administrator).
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { slugify } from "./accounts";
import { lessonResourceSchema } from "./learn";
import { findSkill } from "./profile";

export const courseStatuses = ["draft", "review", "published", "archived"] as const;
export const catalogLevelOptions = ["free", "fundamentals", "standard", "advanced"] as const;
export const lessonKinds = ["video", "text", "exercise", "quiz", "resource"] as const;
export const questionTypes = ["single", "multiple", "text"] as const;

const text = (max: number) => z.string().trim().max(max);
const lines = (value: string, max = 20) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, max);

export async function listCoursesForAdmin(db: PrismaClient) {
  return db.course.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      requiredLevel: true,
      updatedAt: true,
      enrollmentCount: true,
      modules: { select: { _count: { select: { lessons: true } } } },
    },
  });
}

export async function getCourseForAdmin(db: PrismaClient, id: string) {
  return db.course.findUnique({
    where: { id },
    include: {
      skills: { include: { skill: { select: { name: true } } } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { quiz: { include: { questions: { orderBy: { order: "asc" } } } } },
          },
        },
      },
    },
  });
}

export type AdminCourse = NonNullable<Awaited<ReturnType<typeof getCourseForAdmin>>>;

async function uniqueSlug(db: PrismaClient, wanted: string, exceptId?: string) {
  const base = slugify(wanted).slice(0, 70) || "formation";
  for (let n = 1; n < 50; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const taken = await db.course.findUnique({ where: { slug }, select: { id: true } });
    if (!taken || taken.id === exceptId) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** « Nouvelle formation »: a draft with a title; everything else is filled in the editor. */
export async function createCourse(db: PrismaClient, title: string) {
  const name = title.trim().slice(0, 160);
  if (name.length < 3) return null;
  return db.course.create({
    data: {
      slug: await uniqueSlug(db, name),
      title: name,
      summary: "",
      description: "",
      objectives: [],
      audience: "",
      category: "",
      level: "beginner",
      durationMinutes: 60,
      requiredLevel: "free",
      status: "draft",
    },
  });
}

export const courseFormSchema = z.object({
  title: text(160).min(3),
  slug: text(80),
  summary: text(300),
  description: text(5000),
  objectives: text(3000),
  audience: text(500),
  category: text(80),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  language: text(8).min(2),
  durationMinutes: z.coerce.number().int().min(1).max(100_000),
  instructor: text(120),
  prerequisites: text(1000),
  requiredLevel: z.enum(catalogLevelOptions),
  certificateEnabled: z.literal("on").optional(),
  coverUrl: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(/^(https:\/\/|\/)\S+$/)
      .max(500),
  ]),
  skills: text(500),
  jobFamilies: text(500).default(""),
});

/** Saves the course fields; returns the skill names not found in the reference list. */
export async function updateCourse(
  db: PrismaClient,
  id: string,
  input: z.infer<typeof courseFormSchema>,
) {
  const course = await db.course.findUniqueOrThrow({ where: { id }, select: { slug: true } });
  const slug = input.slug ? await uniqueSlug(db, input.slug, id) : course.slug;
  const names = [
    ...new Set(
      input.skills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ].slice(0, 12);
  const found = await Promise.all(
    names.map(async (name) => ({ name, skill: await findSkill(db, name) })),
  );
  const skillIds = [...new Set(found.flatMap((item) => (item.skill ? [item.skill.id] : [])))];
  await db.$transaction([
    db.course.update({
      where: { id },
      data: {
        title: input.title,
        slug,
        summary: input.summary,
        description: input.description,
        objectives: lines(input.objectives),
        audience: input.audience,
        category: input.category,
        level: input.level,
        language: input.language,
        durationMinutes: input.durationMinutes,
        instructor: input.instructor || null,
        prerequisites: input.prerequisites || null,
        requiredLevel: input.requiredLevel,
        certificateEnabled: input.certificateEnabled === "on",
        coverUrl: input.coverUrl || null,
        jobFamilies: [
          ...new Set(
            input.jobFamilies
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          ),
        ].slice(0, 12),
      },
    }),
    db.courseSkill.deleteMany({ where: { courseId: id, skillId: { notIn: skillIds } } }),
    ...skillIds.map((skillId) =>
      db.courseSkill.upsert({
        where: { courseId_skillId: { courseId: id, skillId } },
        create: { courseId: id, skillId },
        update: {},
      }),
    ),
  ]);
  return {
    slug,
    previousSlug: course.slug,
    unknown: found.filter((item) => !item.skill).map((item) => item.name),
  };
}

/** What a course needs before publication (textes: admin.courses.publish.check). */
export function publishProblems(
  course: Pick<AdminCourse, "modules" | "instructor" | "summary" | "description">,
) {
  const problems: ("lessons" | "instructor" | "summary" | "quiz")[] = [];
  const lessons = course.modules.flatMap((module) => module.lessons);
  if (lessons.length === 0) problems.push("lessons");
  if (!course.instructor) problems.push("instructor");
  if (!course.summary || !course.description) problems.push("summary");
  if (
    lessons.some((lesson) => lesson.kind === "quiz" && (lesson.quiz?.questions.length ?? 0) === 0)
  ) {
    problems.push("quiz");
  }
  return problems;
}

export async function setCourseStatus(
  db: PrismaClient,
  id: string,
  status: (typeof courseStatuses)[number],
) {
  const course = await getCourseForAdmin(db, id);
  if (!course) return { ok: false as const, problems: [] };
  if (status === "published") {
    const problems = publishProblems(course);
    if (problems.length > 0) return { ok: false as const, problems };
  }
  await db.course.update({
    where: { id },
    data: {
      status,
      ...(status === "published" && !course.publishedAt ? { publishedAt: new Date() } : {}),
    },
  });
  return { ok: true as const, slug: course.slug };
}

// ─── Modules and lessons ───────────────────────────────────────────────────────

const nextOrder = (orders: number[]) => (orders.length === 0 ? 1 : Math.max(...orders) + 1);

export async function addModule(db: PrismaClient, courseId: string, title: string) {
  const name = title.trim().slice(0, 160);
  if (!name) return null;
  const modules = await db.courseModule.findMany({ where: { courseId }, select: { order: true } });
  return db.courseModule.create({
    data: { courseId, title: name, order: nextOrder(modules.map((m) => m.order)) },
  });
}

export async function renameModule(
  db: PrismaClient,
  courseId: string,
  moduleId: string,
  title: string,
) {
  const name = title.trim().slice(0, 160);
  if (!name) return;
  await db.courseModule.updateMany({ where: { id: moduleId, courseId }, data: { title: name } });
}

export async function deleteModule(db: PrismaClient, courseId: string, moduleId: string) {
  await db.courseModule.deleteMany({ where: { id: moduleId, courseId } });
}

export async function addLesson(
  db: PrismaClient,
  courseId: string,
  moduleId: string,
  input: { title: string; kind: string },
) {
  const target = await db.courseModule.findFirst({
    where: { id: moduleId, courseId },
    include: { lessons: { select: { order: true } } },
  });
  const kind = lessonKinds.find((value) => value === input.kind);
  const title = input.title.trim().slice(0, 160);
  if (!target || !kind || !title) return null;
  return db.lesson.create({
    data: {
      moduleId,
      title,
      kind,
      order: nextOrder(target.lessons.map((lesson) => lesson.order)),
      ...(kind === "quiz" ? { quiz: { create: {} } } : {}),
    },
  });
}

export const lessonFormSchema = z.object({
  title: text(160).min(1),
  kind: z.enum(lessonKinds),
  videoId: text(300),
  durationMinutes: z.coerce.number().int().min(0).max(600),
  paragraphs: text(20_000),
  resources: text(3000),
  transcript: text(50_000),
  isPreview: z.literal("on").optional(),
  jobSpecific: z.literal("on").optional(),
});

/** « Titre | adresse | type » per line → resources; invalid lines are dropped and counted. */
export function parseResourceLines(value: string) {
  let invalid = 0;
  const resources = lines(value).flatMap((line) => {
    const [title, url, type] = line.split("|").map((part) => part.trim());
    const parsed = lessonResourceSchema.safeParse({ title, url, type: type || "PDF" });
    if (!parsed.success) invalid++;
    return parsed.success ? [parsed.data] : [];
  });
  return { resources, invalid };
}

export async function updateLesson(
  db: PrismaClient,
  courseId: string,
  lessonId: string,
  input: z.infer<typeof lessonFormSchema>,
) {
  const lesson = await db.lesson.findFirst({ where: { id: lessonId, module: { courseId } } });
  if (!lesson) return null;
  const { resources, invalid } = parseResourceLines(input.resources);
  const paragraphs = input.paragraphs
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  await db.lesson.update({
    where: { id: lessonId },
    data: {
      title: input.title,
      kind: input.kind,
      videoId: input.videoId || null,
      durationSec: input.durationMinutes * 60,
      content: paragraphs.length > 0 ? { paragraphs } : {},
      resources,
      transcript: input.transcript || null,
      isPreview: input.isPreview === "on",
      jobSpecific: input.jobSpecific === "on",
      ...(input.kind === "quiz" ? { quiz: { upsert: { create: {}, update: {} } } } : {}),
    },
  });
  return { invalid };
}

export async function deleteLesson(db: PrismaClient, courseId: string, lessonId: string) {
  await db.lesson.deleteMany({ where: { id: lessonId, module: { courseId } } });
}

// ─── Quizzes ─────────────────────────────────────────────────────────────────

async function quizOf(db: PrismaClient, courseId: string, lessonId: string) {
  return db.quiz.findFirst({
    where: { lessonId, lesson: { module: { courseId } } },
    include: { questions: { select: { order: true } } },
  });
}

export const quizSettingsSchema = z.object({
  passingScore: z.coerce.number().int().min(1).max(100),
  maxAttempts: z.coerce.number().int().min(0).max(20),
});

export async function updateQuizSettings(
  db: PrismaClient,
  courseId: string,
  lessonId: string,
  input: z.infer<typeof quizSettingsSchema>,
) {
  const quiz = await quizOf(db, courseId, lessonId);
  if (!quiz) return false;
  await db.quiz.update({ where: { id: quiz.id }, data: input });
  return true;
}

export const questionFormSchema = z.object({
  prompt: text(500).min(3),
  type: z.enum(questionTypes),
  options: text(2000),
  answer: text(1000).min(1),
  explanation: text(1000),
});

/**
 * Options one per line; the answer is the number of the right option (single), the numbers of the
 * right options separated by commas (multiple), or the accepted answers one per line (text).
 * Stored answers are option indices from 0.
 */
export function questionData(input: z.infer<typeof questionFormSchema>) {
  if (input.type === "text") {
    const accepted = lines(input.answer);
    return accepted.length > 0
      ? {
          type: input.type,
          prompt: input.prompt,
          options: [],
          answer: accepted,
          explanation: input.explanation || null,
        }
      : null;
  }
  const options = lines(input.options, 8);
  const numbers = [
    ...new Set(
      input.answer
        .split(/[,;\s]+/)
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value)),
    ),
  ];
  const valid =
    numbers.length > 0 && numbers.every((value) => value >= 1 && value <= options.length);
  if (options.length < 2 || !valid || (input.type === "single" && numbers.length !== 1))
    return null;
  return {
    type: input.type,
    prompt: input.prompt,
    options,
    answer: numbers.sort((a, b) => a - b).map((value) => String(value - 1)),
    explanation: input.explanation || null,
  };
}

export async function addQuestion(
  db: PrismaClient,
  courseId: string,
  lessonId: string,
  input: z.infer<typeof questionFormSchema>,
) {
  const quiz = await quizOf(db, courseId, lessonId);
  const data = questionData(input);
  if (!quiz || !data) return false;
  await db.question.create({
    data: { ...data, quizId: quiz.id, order: nextOrder(quiz.questions.map((q) => q.order)) },
  });
  return true;
}

export async function updateQuestion(
  db: PrismaClient,
  courseId: string,
  questionId: string,
  input: z.infer<typeof questionFormSchema>,
) {
  const data = questionData(input);
  if (!data) return false;
  const result = await db.question.updateMany({
    where: { id: questionId, quiz: { lesson: { module: { courseId } } } },
    data,
  });
  return result.count > 0;
}

export async function deleteQuestion(db: PrismaClient, courseId: string, questionId: string) {
  await db.question.deleteMany({
    where: { id: questionId, quiz: { lesson: { module: { courseId } } } },
  });
}

/** The editor shows stored answers back as the editor types them: numbers from 1, or lines. */
export function answerForEditor(question: { type: string; answer: string[] }) {
  return question.type === "text"
    ? question.answer.join("\n")
    : question.answer.map((index) => String(Number(index) + 1)).join(", ");
}
