/**
 * « Pour moi » (docs/ux-mobile-talent, prompt 3): the data of the talent home, real only. The page
 * orders it by goal (`homeFocus`); nothing here invents a figure or an offer.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { recommendedCourses, recommendedJobs } from "@/server/matching/service";
import { openDrafts } from "./application-draft";
import { listConversations } from "./connect";
import { jobOrderBy, openJobWhere } from "./jobs";
import { catalogLevelOf, opensCourse } from "./learn";

/**
 * Offers for the talent: the matching's recommendations when it can run (skills given, calculation
 * on), otherwise the newest open offers, marked as a general selection. Never a closed offer, never
 * the same offer twice.
 */
export async function forMeJobs(db: PrismaClient, userId: string, take: number, now = new Date()) {
  const recommended = await recommendedJobs(db, userId, take, now);
  if (recommended.length > 0) {
    return {
      personalised: true,
      jobs: recommended.map(({ jobId, explanation }) => ({ jobId, explanation })),
    };
  }
  const latest = await db.job.findMany({
    where: openJobWhere(now),
    orderBy: jobOrderBy("recent"),
    take,
    select: { id: true },
  });
  return { personalised: false, jobs: latest.map((job) => ({ jobId: job.id, explanation: null })) };
}

export type ForMeCourse = {
  slug: string;
  title: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  durationMinutes: number;
  /** Number of modules and the cover chosen in the admin, for the course card. */
  modules: number;
  coverUrl: string | null;
  free: boolean;
  open: boolean;
  /** Progress in percent when the talent follows the course. */
  progress: number | null;
  /** Recommended: the skills it brings that the recommended offers ask for (the « Pourquoi ? »). */
  reason: string[];
};

const courseSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  level: true,
  durationMinutes: true,
  requiredLevel: true,
  coverUrl: true,
  _count: { select: { modules: true } },
} as const;

/**
 * Courses for the talent: the ones in progress first, then those that close the gaps of the
 * recommended offers, then the newest published ones (`levels` narrows that last list, for the
 * specialisation courses of the career home). No course twice.
 */
export async function forMeCourses(
  db: PrismaClient,
  userId: string,
  options: { take: number; levels?: ForMeCourse["level"][] },
  now = new Date(),
): Promise<ForMeCourse[]> {
  const catalog = await catalogLevelOf(db, userId);
  const opens = (required: string) => opensCourse(catalog, required);
  const [enrollments, recommended] = await Promise.all([
    db.enrollment.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      select: { progress: true, completedAt: true, course: { select: courseSelect } },
    }),
    recommendedCourses(db, userId, { opens, take: options.take }, now),
  ]);
  const taken = new Set(enrollments.map((row) => row.course.id));
  const toCourse = (
    course: { slug: string; title: string; category: string; level: ForMeCourse["level"] } & {
      durationMinutes: number;
      requiredLevel: string;
      coverUrl: string | null;
      _count: { modules: number };
    },
    progress: number | null,
  ): ForMeCourse => ({
    slug: course.slug,
    title: course.title,
    category: course.category,
    level: course.level,
    durationMinutes: course.durationMinutes,
    modules: course._count.modules,
    coverUrl: course.coverUrl,
    free: course.requiredLevel === "free",
    open: opens(course.requiredLevel),
    progress,
    reason: [],
  });
  const list = enrollments
    .filter((row) => !row.completedAt)
    .map((row) => toCourse(row.course, row.progress));
  const seen = new Set(list.map((course) => course.slug));
  const wanted = recommended.map((course) => course.slug).filter((slug) => !seen.has(slug));
  const [picked, newest] = await Promise.all([
    wanted.length > 0
      ? db.course.findMany({
          where: { status: "published", slug: { in: wanted } },
          select: courseSelect,
        })
      : Promise.resolve([]),
    db.course.findMany({
      where: {
        status: "published",
        id: { notIn: [...taken] },
        ...(options.levels && { level: { in: options.levels } }),
      },
      orderBy: { publishedAt: "desc" },
      take: options.take,
      select: courseSelect,
    }),
  ]);
  // The recommended ones keep their order, before the newest ones.
  picked.sort((a, b) => wanted.indexOf(a.slug) - wanted.indexOf(b.slug));
  for (const course of [...picked, ...newest]) {
    if (seen.has(course.slug)) continue;
    seen.add(course.slug);
    list.push({
      ...toCourse(course, null),
      reason: recommended.find((item) => item.slug === course.slug)?.skills ?? [],
    });
  }
  return list.slice(0, options.take);
}

export type NextAction =
  | { kind: "interview"; href: string; company: string; job: string; at: Date }
  | { kind: "document"; href: string; company: string; name: string }
  | { kind: "draft"; href: string; company: string; job: string }
  | { kind: "message"; href: string; company: string }
  | { kind: "course"; href: string; title: string }
  | { kind: "profile"; href: string; percent: number };

/**
 * The next real actions of the talent, most urgent first: interviews to confirm, documents asked
 * for, applications left as drafts, unread messages, then the course in progress and the profile.
 */
export async function nextActions(
  db: PrismaClient,
  userId: string,
  context: { course?: { slug: string; title: string } | null; percent: number },
  take = 3,
  now = new Date(),
): Promise<NextAction[]> {
  const [interviews, requests, conversations, drafts] = await Promise.all([
    db.interview.findMany({
      where: { application: { profile: { userId } }, status: "pending", slots: { isEmpty: false } },
      orderBy: { createdAt: "desc" },
      select: {
        slots: true,
        organization: { select: { name: true } },
        application: {
          select: { job: { select: { title: true } }, conversation: { select: { id: true } } },
        },
      },
    }),
    db.message.findMany({
      where: {
        kind: "document_request",
        hiddenAt: null,
        conversation: { talentUserId: userId, blockedAt: null },
      },
      orderBy: { createdAt: "desc" },
      select: {
        conversationId: true,
        payload: true,
        conversation: { select: { organization: { select: { name: true } } } },
      },
    }),
    listConversations(db, { userId }),
    openDrafts(db, userId, now),
  ]);
  const actions: NextAction[] = [];
  const counted = new Set<string>();
  for (const interview of interviews) {
    const next = interview.slots.filter((slot) => slot >= now).sort((a, b) => +a - +b)[0];
    if (!next) continue;
    const conversation = interview.application.conversation?.id;
    if (conversation) counted.add(conversation);
    actions.push({
      kind: "interview",
      href: conversation ? `/app/messages/${conversation}` : "/app/suivi",
      company: interview.organization.name,
      job: interview.application.job.title,
      at: next,
    });
  }
  for (const request of requests) {
    const payload = (request.payload ?? {}) as { name?: unknown; submittedAt?: unknown };
    if (payload.submittedAt) continue;
    counted.add(request.conversationId);
    actions.push({
      kind: "document",
      href: `/app/messages/${request.conversationId}`,
      company: request.conversation.organization?.name ?? "",
      name: typeof payload.name === "string" ? payload.name : "",
    });
  }
  for (const draft of drafts)
    actions.push({
      kind: "draft",
      href: `/app/jobs/${draft.job.slug}?postuler=1`,
      company: draft.job.organization.name,
      job: draft.job.title,
    });
  for (const conversation of conversations) {
    if (!conversation.unread || counted.has(conversation.id)) continue;
    actions.push({
      kind: "message",
      href: `/app/messages/${conversation.id}`,
      company: conversation.organization?.name ?? "",
    });
  }
  if (context.course)
    actions.push({
      kind: "course",
      href: `/app/learn/${context.course.slug}`,
      title: context.course.title,
    });
  if (context.percent < 100)
    actions.push({ kind: "profile", href: "/app/profil", percent: context.percent });
  return actions.slice(0, take);
}

export type OrbiFocus = {
  /** The skill asked for most often by the talent's most compatible offers and absent from the profile. */
  skill: string;
  /** In how many of those offers it is asked for. */
  count: number;
  /** A published course that teaches it, when there is one. */
  course: { slug: string; title: string; durationMinutes: number } | null;
};

/**
 * « Orbi vous suggère » (planche web talent-1 § 1): the required skill missing most often in the
 * 20 most compatible open offers, and a course that teaches it. Computed from the deterministic
 * matching, never invented; null when the matching cannot run or nothing is missing.
 */
export async function orbiFocus(
  db: PrismaClient,
  userId: string,
  now = new Date(),
): Promise<OrbiFocus | null> {
  const top = await recommendedJobs(db, userId, 20, now);
  const counts = new Map<string, { skill: string; count: number; courses: string[] }>();
  for (const { explanation } of top) {
    for (const missing of explanation.missingSkills) {
      if (missing.importance !== "required") continue;
      const entry = counts.get(missing.skillId) ?? {
        skill: missing.skill,
        count: 0,
        courses: missing.courses,
      };
      entry.count += 1;
      counts.set(missing.skillId, entry);
    }
  }
  const best = [...counts.values()].sort(
    (a, b) => b.count - a.count || a.skill.localeCompare(b.skill),
  )[0];
  if (!best) return null;
  const course =
    best.courses.length > 0
      ? await db.course.findFirst({
          where: { status: "published", slug: { in: best.courses } },
          orderBy: { durationMinutes: "asc" },
          select: { slug: true, title: true, durationMinutes: true },
        })
      : null;
  return { skill: best.skill, count: best.count, course };
}
