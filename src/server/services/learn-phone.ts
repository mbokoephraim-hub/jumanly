/**
 * Formation on the phone (Modèle B, lot B7, planches Formation-*): what the tab shows (the course to
 * continue, why it matters for the person's offers, the courses that fill the gaps of those offers,
 * the interview to prepare, my courses, my attestations), the quick question of a lesson and the
 * search. Reads only, except the quick question which records nothing; enrolling, progress,
 * quizzes and attestations stay in `learn.ts`.
 */
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { talentAttestations } from "./attestations";
import { forMeCourses } from "./for-me";
import { catalogLevelOf, LearnError, lessonContext, opensCourse } from "./learn";
import { followedCourses, savedCourses } from "./learn-space";

// ─── The quick question of a lesson ──────────────────────────────────────────

/** `content.check` of a lesson (admin « Question rapide »): one question, the right option. */
const checkSchema = z.object({
  question: z.string().min(1).max(300),
  options: z.array(z.string().min(1).max(160)).min(2).max(4),
  answer: z.number().int().min(0).max(3),
  explanation: z.string().max(400).optional(),
});
export type LessonCheck = z.infer<typeof checkSchema>;

export function lessonCheck(content: Prisma.JsonValue | null): LessonCheck | null {
  const value =
    content && typeof content === "object" && !Array.isArray(content)
      ? (content as Record<string, unknown>).check
      : null;
  const parsed = checkSchema.safeParse(value);
  if (!parsed.success || parsed.data.answer >= parsed.data.options.length) return null;
  return parsed.data;
}

/** The question for the screen: the options only, never the answer. */
export function publicCheck(check: LessonCheck | null) {
  return check ? { question: check.question, options: check.options } : null;
}

/**
 * « Question rapide » from the admin form: the question on the first line, one option per line,
 * the right one starting with « * », the explanation on a line starting with « > ».
 */
export function checkFromForm(value: string): LessonCheck | null {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const [question, ...rest] = lines;
  if (!question) return null;
  const explanation = rest
    .find((line) => line.startsWith(">"))
    ?.slice(1)
    .trim();
  const options = rest.filter((line) => !line.startsWith(">")).slice(0, 4);
  const answer = options.findIndex((line) => line.startsWith("*"));
  const parsed = checkSchema.safeParse({
    question: question.slice(0, 300),
    options: options.map((line) => line.replace(/^\*\s*/, "").slice(0, 160)),
    answer,
    ...(explanation ? { explanation: explanation.slice(0, 400) } : {}),
  });
  return parsed.success ? parsed.data : null;
}

/** The text of the admin field for a question already written. */
export function checkToForm(check: LessonCheck | null) {
  if (!check) return "";
  return [
    check.question,
    ...check.options.map((option, index) => (index === check.answer ? `* ${option}` : option)),
    ...(check.explanation ? [`> ${check.explanation}`] : []),
  ].join("\n");
}

/** Right or wrong, the right option and why. Nothing is recorded (a lesson is not a quiz). */
export async function answerLessonCheck(
  db: PrismaClient,
  userId: string,
  lessonId: string,
  choice: number,
) {
  const ctx = await lessonContext(db, userId, lessonId).catch(async (error) => {
    // The free first lesson of a course above the plan can be tried without enrolling.
    if (!(error instanceof LearnError) || error.code !== "notEnrolled") throw error;
    const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson?.isPreview) throw error;
    return { lesson };
  });
  const check = lessonCheck(ctx.lesson.content);
  if (!check) throw new LearnError("notFound");
  return {
    correct: choice === check.answer,
    answer: check.answer,
    explanation: check.explanation ?? null,
  };
}

// ─── The tab ─────────────────────────────────────────────────────────────────

const courseCard = {
  id: true,
  slug: true,
  title: true,
  category: true,
  level: true,
  durationMinutes: true,
  requiredLevel: true,
  domain: { select: { name: true } },
  skills: { select: { skill: { select: { id: true, name: true } } } },
  _count: { select: { modules: true } },
  modules: { select: { _count: { select: { lessons: true } } } },
} as const;

type CardRow = Prisma.CourseGetPayload<{ select: typeof courseCard }>;

const cardOf = (row: CardRow, open: boolean) => ({
  slug: row.slug,
  title: row.title,
  category: row.category,
  domain: row.domain?.name ?? null,
  level: row.level,
  minutes: row.durationMinutes,
  lessons: row.modules.reduce((sum, module) => sum + module._count.lessons, 0),
  free: row.requiredLevel === "free",
  requiredLevel: row.requiredLevel,
  open,
  skills: row.skills.map((item) => item.skill.name),
});
export type FormationCard = ReturnType<typeof cardOf>;

type Explanation = { missingSkills?: { skillId: string; skill: string; courses: string[] }[] };

/** The person's offers as the matching saw them (best first), with the skills they ask. */
async function myOffers(db: PrismaClient, userId: string, now: Date) {
  const rows = await db.matchResult.findMany({
    where: {
      profile: { userId },
      job: {
        status: "published",
        OR: [{ closesAt: null }, { closesAt: { gt: now } }],
        organization: { suspendedAt: null },
      },
    },
    orderBy: { score: "desc" },
    take: 30,
    select: {
      score: true,
      explanation: true,
      job: {
        select: {
          id: true,
          slug: true,
          title: true,
          organization: { select: { name: true } },
          skills: { select: { skillId: true } },
        },
      },
    },
  });
  return rows.map((row) => ({
    score: row.score,
    job: row.job,
    missing: ((row.explanation ?? {}) as Explanation).missingSkills ?? [],
  }));
}

/** Everything the tab shows, read at once while the logo shows (brief § 3). */
export async function formationHome(db: PrismaClient, userId: string, now = new Date()) {
  const [followed, saved, certificates, planLevel, offers, interview] = await Promise.all([
    followedCourses(db, userId),
    savedCourses(db, userId),
    talentAttestations(db, userId),
    catalogLevelOf(db, userId),
    myOffers(db, userId, now),
    db.interview.findFirst({
      where: {
        status: "confirmed",
        startsAt: { gt: now },
        application: { profile: { userId } },
      },
      orderBy: { startsAt: "asc" },
      select: {
        startsAt: true,
        timezone: true,
        applicationId: true,
        application: {
          select: { job: { select: { title: true, organization: { select: { name: true } } } } },
        },
      },
    }),
  ]);

  // « Continuer »: the most recent course not finished, with the lesson to open.
  const current =
    followed.find((course) => !course.finished && course.next && course.progress > 0) ??
    followed.find((course) => !course.finished && course.next) ??
    null;
  let advice: { offers: number; company: string; job: string } | null = null;
  if (current) {
    const skills = await db.courseSkill.findMany({
      where: { course: { slug: current.slug } },
      select: { skillId: true },
    });
    const ids = new Set(skills.map((item) => item.skillId));
    const asking = offers.filter((offer) => offer.job.skills.some((item) => ids.has(item.skillId)));
    if (asking.length > 0)
      advice = {
        offers: asking.length,
        company: asking[0]!.job.organization.name,
        job: asking[0]!.job.title,
      };
  }

  // « Pour vos offres »: the courses that teach what the offers ask and the profile lacks, then
  // the courses recommended for the person.
  const gapSlugs = [
    ...new Set(offers.flatMap((offer) => offer.missing.flatMap((item) => item.courses))),
  ];
  const taken = new Set(followed.map((course) => course.slug));
  const [gapRows, picks] = await Promise.all([
    gapSlugs.length > 0
      ? db.course.findMany({
          where: { slug: { in: gapSlugs }, status: "published" },
          select: courseCard,
        })
      : Promise.resolve([] as CardRow[]),
    forMeCourses(db, userId, { take: 12 }, now),
  ]);
  const pickRows = await db.course.findMany({
    where: { slug: { in: picks.map((pick) => pick.slug) }, status: "published" },
    select: courseCard,
  });
  const order = [...gapSlugs, ...picks.map((pick) => pick.slug)];
  const forOffers = [...new Map([...gapRows, ...pickRows].map((row) => [row.slug, row])).values()]
    .filter((row) => !taken.has(row.slug))
    .sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug))
    .slice(0, 10)
    .map((row) => cardOf(row, opensCourse(planLevel, row.requiredLevel)));

  const savedRows = await db.course.findMany({
    where: { slug: { in: saved.map((course) => course.slug) } },
    select: courseCard,
  });
  const savedCards = saved.flatMap((course) => {
    const row = savedRows.find((item) => item.slug === course.slug);
    return row && !taken.has(row.slug)
      ? [cardOf(row, opensCourse(planLevel, row.requiredLevel))]
      : [];
  });

  return {
    current,
    advice,
    forOffers,
    interview: interview?.startsAt
      ? {
          startsAt: interview.startsAt,
          timezone: interview.timezone,
          applicationId: interview.applicationId,
          company: interview.application.job.organization.name,
          job: interview.application.job.title,
        }
      : null,
    inProgress: followed.filter((course) => !course.finished),
    finished: followed.filter((course) => course.finished),
    saved: savedCards,
    certificates: certificates.map((item) => ({
      id: item.id,
      code: item.code,
      title: item.courseTitle,
      issuedAt: item.issuedAt,
      score: item.score,
      slug: item.enrollment.course.slug,
    })),
  };
}

export type FormationHome = Awaited<ReturnType<typeof formationHome>>;

// ─── Search ──────────────────────────────────────────────────────────────────

export const formationScopes = ["tout", "cours", "lecons", "attestations"] as const;
export type FormationScope = (typeof formationScopes)[number];

/** Courses, lessons and attestations whose title holds the words typed (12 of each at most). */
export async function searchFormation(
  db: PrismaClient,
  userId: string,
  query: string,
  scope: FormationScope,
) {
  const q = query.trim().slice(0, 80);
  if (!q) return { courses: [], lessons: [], certificates: [] };
  const has = (key: FormationScope) => scope === "tout" || scope === key;
  const contains = { contains: q, mode: "insensitive" as const };
  const [planLevel, enrollments, courses, lessons, certificates] = await Promise.all([
    catalogLevelOf(db, userId),
    db.enrollment.findMany({
      where: { userId },
      select: { courseId: true, progress: true, completedAt: true },
    }),
    has("cours")
      ? db.course.findMany({
          where: {
            status: "published",
            OR: [
              { title: contains },
              { category: contains },
              { skills: { some: { skill: { name: contains } } } },
            ],
          },
          orderBy: { enrollmentCount: "desc" },
          take: 12,
          select: courseCard,
        })
      : Promise.resolve([] as CardRow[]),
    has("lecons")
      ? db.lesson.findMany({
          where: { title: contains, module: { course: { status: "published" } } },
          take: 12,
          select: {
            id: true,
            title: true,
            order: true,
            durationSec: true,
            module: { select: { order: true, course: { select: { slug: true, title: true } } } },
          },
        })
      : Promise.resolve([]),
    has("attestations")
      ? db.certificate.findMany({
          where: { enrollment: { userId }, revokedAt: null, courseTitle: contains },
          orderBy: { issuedAt: "desc" },
          take: 12,
          select: { id: true, courseTitle: true, issuedAt: true },
        })
      : Promise.resolve([]),
  ]);
  const enrolled = new Map(enrollments.map((row) => [row.courseId, row]));
  return {
    courses: courses.map((row) => {
      const mine = enrolled.get(row.id);
      return {
        ...cardOf(row, opensCourse(planLevel, row.requiredLevel)),
        progress: mine ? mine.progress : null,
        finished: Boolean(mine?.completedAt),
      };
    }),
    lessons: await Promise.all(
      lessons.map(async (lesson) => ({
        id: lesson.id,
        title: lesson.title,
        minutes: Math.max(1, Math.round(lesson.durationSec / 60)),
        course: { slug: lesson.module.course.slug, title: lesson.module.course.title },
        // Its place in the course (« 3 »), all modules together.
        num:
          (await db.lesson.count({
            where: {
              module: { course: { slug: lesson.module.course.slug } },
              OR: [
                { module: { order: { lt: lesson.module.order } } },
                { module: { order: lesson.module.order }, order: { lte: lesson.order } },
              ],
            },
          })) || 1,
      })),
    ),
    certificates,
  };
}

export type FormationFound = Awaited<ReturnType<typeof searchFormation>>;
