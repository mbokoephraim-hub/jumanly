/**
 * Course editor of Jumanly Admin (partie 07 § 12, E5): courses, modules, lessons, quizzes. Pure
 * database work, called by the admin actions after the role check (content editor or administrator).
 */
import { z } from "zod";
import { editorialLines } from "./learn-domains";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { slugify } from "./accounts";
import { OUTLINE_STEPS_MAX, OUTLINE_TAKEAWAYS_MAX, lessonResourceSchema } from "./learn";
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
      category: true,
      requiredLevel: true,
      updatedAt: true,
      enrollmentCount: true,
      coverUrl: true,
      durationMinutes: true,
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

/** « Prête à publier » percent of several courses at once (drafts of the Studio gallery). */
export async function readinessPercents(db: PrismaClient, ids: string[]) {
  if (ids.length === 0) return new Map<string, number>();
  const courses = await db.course.findMany({
    where: { id: { in: ids } },
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
  return new Map(courses.map((course) => [course.id, courseReadiness(course).percent]));
}

/** Figures of the Studio banner: published courses, drafts, learners and attestations (30 days). */
export async function studioFigures(db: PrismaClient, now: Date) {
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [published, drafts, enrolled, certificates] = await Promise.all([
    db.course.count({ where: { status: "published" } }),
    db.course.count({ where: { status: { in: ["draft", "review"] } } }),
    db.enrollment.count({ where: { startedAt: { gte: since } } }),
    db.certificate.count({ where: { issuedAt: { gte: since }, revokedAt: null } }),
  ]);
  return { published, drafts, enrolled, certificates };
}

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

// ─── Studio formations: new course from a starting template (Admin v3, étape 3) ──────────────

export const courseTemplates = ["short", "certifying", "workshop", "blank"] as const;
export type CourseTemplate = (typeof courseTemplates)[number];
export type TemplateLessonLabel =
  "intro" | "lesson" | "reading" | "moduleQuiz" | "finalQuiz" | "exercise";
type TemplateLesson = { kind: (typeof lessonKinds)[number]; label: TemplateLessonLabel };

/**
 * Structure of each starting template: modules (the last one may be the final assessment), lessons
 * and whether the course delivers an attestation. Titles are texts given by the caller.
 */
export const courseTemplateStructure: Record<
  CourseTemplate,
  { modules: { final?: boolean; lessons: TemplateLesson[] }[]; certificate: boolean }
> = {
  short: {
    certificate: false,
    modules: [
      {
        lessons: [
          { kind: "video", label: "intro" },
          { kind: "text", label: "reading" },
          { kind: "quiz", label: "finalQuiz" },
        ],
      },
    ],
  },
  certifying: {
    certificate: true,
    modules: [
      ...[1, 2, 3].map(() => ({
        lessons: [
          { kind: "video" as const, label: "lesson" as const },
          { kind: "text" as const, label: "reading" as const },
          { kind: "quiz" as const, label: "moduleQuiz" as const },
        ],
      })),
      { final: true, lessons: [{ kind: "quiz", label: "finalQuiz" }] },
    ],
  },
  workshop: {
    certificate: false,
    modules: [
      {
        lessons: [
          { kind: "video", label: "intro" },
          { kind: "exercise", label: "exercise" },
          { kind: "exercise", label: "exercise" },
        ],
      },
    ],
  },
  blank: { certificate: true, modules: [] },
};

export const newCourseSchema = z.object({
  title: text(160).min(3),
  category: text(80),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  language: text(8).min(2),
  requiredLevel: z.enum(catalogLevelOptions),
  template: z.enum(courseTemplates),
});

export type TemplateLabels = {
  module: (index: number) => string;
  finalModule: string;
  lesson: (label: TemplateLessonLabel, index: number) => string;
};

/**
 * « Nouvelle formation » from a template: a draft with its first fields and the template's modules
 * and lessons (quiz lessons get their empty quiz). No content is invented: titles are placeholders
 * to rename, and nothing is published.
 */
export async function createCourseFromTemplate(
  db: PrismaClient,
  input: z.infer<typeof newCourseSchema>,
  labels: TemplateLabels,
) {
  const structure = courseTemplateStructure[input.template];
  let moduleNumber = 0;
  return db.course.create({
    data: {
      slug: await uniqueSlug(db, input.title),
      title: input.title,
      summary: "",
      description: "",
      objectives: [],
      audience: "",
      category: input.category,
      level: input.level,
      language: input.language,
      durationMinutes: 60,
      requiredLevel: input.requiredLevel,
      certificateEnabled: structure.certificate,
      status: "draft",
      modules: {
        create: structure.modules.map((module, index) => {
          if (!module.final) moduleNumber += 1;
          const counts = new Map<TemplateLessonLabel, number>();
          return {
            order: index + 1,
            title: module.final ? labels.finalModule : labels.module(moduleNumber),
            lessons: {
              create: module.lessons.map((lesson, position) => {
                const count = (counts.get(lesson.label) ?? 0) + 1;
                counts.set(lesson.label, count);
                return {
                  order: position + 1,
                  kind: lesson.kind,
                  title: labels.lesson(lesson.label, count),
                  ...(lesson.kind === "quiz" ? { quiz: { create: {} } } : {}),
                };
              }),
            },
          };
        }),
      },
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
  /** Learn v2, étape 1: the domain (empty = none) and the editorial line. */
  domainId: text(40).default(""),
  editorialLine: z.enum(editorialLines).default("originals"),
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
  const domain = input.domainId
    ? await db.learningDomain.findUnique({ where: { id: input.domainId }, select: { id: true } })
    : null;
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
        domainId: domain?.id ?? null,
        editorialLine: input.editorialLine,
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

export const publishProblemKeys = [
  "title",
  "summary",
  "lessons",
  "instructor",
  "quiz",
  "certificateQuiz",
  "cover",
] as const;
export type PublishProblem = (typeof publishProblemKeys)[number];

type ReadinessCourse = Pick<
  AdminCourse,
  | "modules"
  | "instructor"
  | "summary"
  | "description"
  | "title"
  | "coverUrl"
  | "certificateEnabled"
  | "audience"
  | "objectives"
>;

/**
 * What a course needs before publication (Admin v2, étape 6; textes admin.courses.publish.problem):
 * a title, a summary and a description, at least one lesson, the instructor, questions in every
 * quiz, a quiz with questions when it delivers an attestation, and a cover image.
 */
export function publishProblems(course: ReadinessCourse) {
  const problems: PublishProblem[] = [];
  const lessons = course.modules.flatMap((module) => module.lessons);
  const quizzes = lessons.filter((lesson) => lesson.kind === "quiz");
  if (course.title.trim().length < 3) problems.push("title");
  if (!course.summary || !course.description) problems.push("summary");
  if (lessons.length === 0) problems.push("lessons");
  if (!course.instructor) problems.push("instructor");
  if (quizzes.some((lesson) => (lesson.quiz?.questions.length ?? 0) === 0)) problems.push("quiz");
  if (
    course.certificateEnabled &&
    !quizzes.some((lesson) => (lesson.quiz?.questions.length ?? 0) > 0)
  )
    problems.push("certificateQuiz");
  if (!course.coverUrl) problems.push("cover");
  return problems;
}

export const readinessSteps = [
  "info",
  "audience",
  "program",
  "quiz",
  "certificate",
  "publish",
] as const;
export type ReadinessStep = (typeof readinessSteps)[number];

/** Which step of the guided path each missing piece belongs to. */
const stepOf: Record<PublishProblem, ReadinessStep> = {
  title: "info",
  summary: "info",
  instructor: "info",
  cover: "info",
  lessons: "program",
  quiz: "quiz",
  certificateQuiz: "certificate",
};

/**
 * « Prête à publier »: the six steps of the guided path, each done or with what it misses, and the
 * share of the checks already met. The audience step is advice (it never blocks publication).
 */
export function courseReadiness(course: ReadinessCourse & { status: string }) {
  const problems = publishProblems(course);
  const audienceDone = course.audience.trim().length > 0 && course.objectives.length > 0;
  const steps = readinessSteps.map((step) => {
    const missing = problems.filter((problem) => stepOf[problem] === step);
    const done =
      step === "audience"
        ? audienceDone
        : step === "publish"
          ? course.status === "published"
          : missing.length === 0;
    return { step, done, missing };
  });
  const checks = publishProblemKeys.length + 1;
  const met = publishProblemKeys.length - problems.length + (audienceDone ? 1 : 0);
  return {
    steps,
    problems,
    percent: Math.round((100 * met) / checks),
    ready: problems.length === 0,
  };
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

/**
 * « Dupliquer »: a draft copy with its modules, lessons and quizzes (never its learners, their
 * progress or attestations). The copy has no cover: its own is sent before publication, so the
 * files of the source can be replaced without breaking the copy.
 */
export async function duplicateCourse(db: PrismaClient, id: string, title: string) {
  const source = await getCourseForAdmin(db, id);
  if (!source) return null;
  const name = title.trim().slice(0, 160) || source.title;
  return db.course.create({
    data: {
      slug: await uniqueSlug(db, name),
      title: name,
      summary: source.summary,
      description: source.description,
      objectives: source.objectives,
      audience: source.audience,
      category: source.category,
      level: source.level,
      language: source.language,
      durationMinutes: source.durationMinutes,
      coverUrl: null,
      requiredLevel: source.requiredLevel,
      jobFamilies: source.jobFamilies,
      certificateEnabled: source.certificateEnabled,
      instructor: source.instructor,
      prerequisites: source.prerequisites,
      status: "draft",
      skills: { create: source.skills.map((item) => ({ skillId: item.skillId })) },
      modules: {
        create: source.modules.map((module) => ({
          title: module.title,
          order: module.order,
          lessons: {
            create: module.lessons.map((lesson) => ({
              title: lesson.title,
              kind: lesson.kind,
              order: lesson.order,
              videoId: lesson.videoId,
              durationSec: lesson.durationSec,
              content: (lesson.content ?? {}) as Prisma.InputJsonValue,
              resources: (lesson.resources ?? []) as Prisma.InputJsonValue,
              transcript: lesson.transcript,
              isPreview: lesson.isPreview,
              jobSpecific: lesson.jobSpecific,
              ...(lesson.quiz
                ? {
                    quiz: {
                      create: {
                        passingScore: lesson.quiz.passingScore,
                        maxAttempts: lesson.quiz.maxAttempts,
                        questions: {
                          create: lesson.quiz.questions.map((question) => ({
                            order: question.order,
                            type: question.type,
                            prompt: question.prompt,
                            options: question.options,
                            answer: question.answer,
                            explanation: question.explanation,
                          })),
                        },
                      },
                    },
                  }
                : {}),
            })),
          },
        })),
      },
    },
  });
}

export type CourseStats = {
  enrolled: number;
  /** Share of the learners who finished, 0 to 100; null without learners. */
  completion: number | null;
  /** Average best score of the learners at the course's quizzes, 0 to 100; null without attempts. */
  quizAverage: number | null;
  certificates: number;
};

/** Figures of each course for the list: learners, completion, quiz average, attestations. */
export async function courseStats(db: PrismaClient, courseIds: string[]) {
  const stats = new Map<string, CourseStats>();
  if (courseIds.length === 0) return stats;
  const [enrolled, completed, certificates, attempts] = await Promise.all([
    db.enrollment.groupBy({
      by: ["courseId"],
      where: { courseId: { in: courseIds } },
      _count: true,
    }),
    db.enrollment.groupBy({
      by: ["courseId"],
      where: { courseId: { in: courseIds }, completedAt: { not: null } },
      _count: true,
    }),
    db.certificate.findMany({
      where: { revokedAt: null, enrollment: { courseId: { in: courseIds } } },
      select: { enrollment: { select: { courseId: true } } },
    }),
    db.quizAttempt.groupBy({
      by: ["userId", "quizId"],
      where: { quiz: { lesson: { module: { courseId: { in: courseIds } } } } },
      _max: { score: true },
    }),
  ]);
  const quizCourse = new Map(
    (
      await db.quiz.findMany({
        where: { id: { in: [...new Set(attempts.map((row) => row.quizId))] } },
        select: { id: true, lesson: { select: { module: { select: { courseId: true } } } } },
      })
    ).map((quiz) => [quiz.id, quiz.lesson.module.courseId]),
  );
  for (const id of courseIds) {
    const count = enrolled.find((row) => row.courseId === id)?._count ?? 0;
    const done = completed.find((row) => row.courseId === id)?._count ?? 0;
    const scores = attempts
      .filter((row) => quizCourse.get(row.quizId) === id)
      .map((row) => row._max.score ?? 0);
    stats.set(id, {
      enrolled: count,
      completion: count ? Math.round((100 * done) / count) : null,
      quizAverage: scores.length
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : null,
      certificates: certificates.filter((row) => row.enrollment.courseId === id).length,
    });
  }
  return stats;
}

// ─── Editor steps (Admin v3, étape 4) ─────────────────────────────────────────

/** The steps of the course editor (`?etape=`), in order. */
export const editorSteps = [
  "informations",
  "public",
  "programme",
  "documents",
  "quiz",
  "attestation",
  "publication",
] as const;
export type EditorStep = (typeof editorSteps)[number];

export const isEditorStep = (value: unknown): value is EditorStep =>
  (editorSteps as readonly unknown[]).includes(value);

/** The editor step where each step of the guided path « Prête à publier ? » is filled in. */
export const editorStepOf: Record<ReadinessStep, EditorStep> = {
  info: "informations",
  audience: "public",
  program: "programme",
  quiz: "quiz",
  certificate: "attestation",
  publish: "publication",
};

/** Totals shown above the program: modules, lessons, quizzes and the length of the lessons. */
export function programTotals(course: Pick<AdminCourse, "modules">) {
  const lessons = course.modules.flatMap((module) => module.lessons);
  return {
    modules: course.modules.length,
    lessons: lessons.length,
    quizzes: lessons.filter((lesson) => lesson.kind === "quiz").length,
    minutes: Math.round(lessons.reduce((sum, lesson) => sum + lesson.durationSec, 0) / 60),
  };
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

/**
 * Moves a module one place up or down: its order is swapped with its neighbour's, through a
 * free value because the order is unique within a course.
 */
export async function moveModule(
  db: PrismaClient,
  courseId: string,
  moduleId: string,
  direction: "up" | "down",
) {
  const modules = await db.courseModule.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });
  const index = modules.findIndex((item) => item.id === moduleId);
  const current = modules[index];
  const other = modules[index + (direction === "up" ? -1 : 1)];
  if (!current || !other) return false;
  await db.$transaction([
    db.courseModule.update({ where: { id: current.id }, data: { order: -1 } }),
    db.courseModule.update({ where: { id: other.id }, data: { order: current.order } }),
    db.courseModule.update({ where: { id: current.id }, data: { order: other.order } }),
  ]);
  return true;
}

/** Moves a lesson one place up or down within its module (same swap as the modules). */
export async function moveLesson(
  db: PrismaClient,
  courseId: string,
  lessonId: string,
  direction: "up" | "down",
) {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: { moduleId: true },
  });
  if (!lesson) return false;
  const lessons = await db.lesson.findMany({
    where: { moduleId: lesson.moduleId },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });
  const index = lessons.findIndex((item) => item.id === lessonId);
  const current = lessons[index];
  const other = lessons[index + (direction === "up" ? -1 : 1)];
  if (!current || !other) return false;
  await db.$transaction([
    db.lesson.update({ where: { id: current.id }, data: { order: -1 } }),
    db.lesson.update({ where: { id: other.id }, data: { order: current.order } }),
    db.lesson.update({ where: { id: current.id }, data: { order: other.order } }),
  ]);
  return true;
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
  // The outline (screen 14); absent from older forms, hence the defaults.
  brief: text(600).default(""),
  steps: text(2000).default(""),
  takeaways: text(1000).default(""),
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

/**
 * The outline of a lesson (screen 14) from the admin form: « En bref », steps written
 * « Titre | minutes » one per line, and up to three points to remember, one per line.
 */
export function outlineFromForm(input: { brief: string; steps: string; takeaways: string }) {
  const steps = lines(input.steps)
    .slice(0, OUTLINE_STEPS_MAX)
    .map((line) => {
      const [title, minutes] = line.split("|").map((part) => part.trim());
      return { title: (title ?? "").slice(0, 120), minutes: Math.min(600, Number(minutes) || 0) };
    })
    .filter((step) => step.title);
  const takeaways = lines(input.takeaways)
    .slice(0, OUTLINE_TAKEAWAYS_MAX)
    .map((line) => line.slice(0, 120));
  return {
    ...(input.brief.trim() ? { brief: input.brief.trim().slice(0, 600) } : {}),
    ...(steps.length > 0 ? { steps } : {}),
    ...(takeaways.length > 0 ? { takeaways } : {}),
  };
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
      content: {
        ...(paragraphs.length > 0 ? { paragraphs } : {}),
        ...outlineFromForm(input),
      },
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
