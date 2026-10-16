/**
 * « Pour moi » (docs/ux-mobile-talent, prompt 3): the data of the talent home, real only. The page
 * orders it by goal (`homeFocus`); nothing here invents a figure or an offer.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { recommendedCourses, recommendedJobs } from "@/server/matching/service";
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
  free: boolean;
  open: boolean;
  /** Progress in percent when the talent follows the course. */
  progress: number | null;
};

const courseSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  level: true,
  durationMinutes: true,
  requiredLevel: true,
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
    },
    progress: number | null,
  ): ForMeCourse => ({
    slug: course.slug,
    title: course.title,
    category: course.category,
    level: course.level,
    durationMinutes: course.durationMinutes,
    free: course.requiredLevel === "free",
    open: opens(course.requiredLevel),
    progress,
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
    list.push(toCourse(course, null));
  }
  return list.slice(0, options.take);
}

/**
 * Skills to strengthen (screen 05): asked by the offers the talent saved or applied to, and not on
 * the profile yet. Each comes with the number of those offers that ask for it (the « Pourquoi ? »).
 */
export async function skillsToStrengthen(db: PrismaClient, userId: string, take = 6) {
  const [saved, applied, profile] = await Promise.all([
    db.savedJob.findMany({ where: { userId }, select: { jobId: true } }),
    db.application.findMany({ where: { profile: { userId } }, select: { jobId: true } }),
    db.talentProfile.findUnique({
      where: { userId },
      select: { skills: { select: { skillId: true } } },
    }),
  ]);
  const jobIds = [...new Set([...saved, ...applied].map((row) => row.jobId))];
  if (jobIds.length === 0) return [];
  const owned = new Set(profile?.skills.map((row) => row.skillId) ?? []);
  const rows = await db.jobSkill.findMany({
    where: { jobId: { in: jobIds } },
    select: { jobId: true, skill: { select: { id: true, name: true } } },
  });
  const counts = new Map<string, { id: string; name: string; offers: number }>();
  for (const row of rows) {
    if (owned.has(row.skill.id)) continue;
    const entry = counts.get(row.skill.id) ?? { ...row.skill, offers: 0 };
    entry.offers += 1;
    counts.set(row.skill.id, entry);
  }
  return [...counts.values()]
    .sort((a, b) => b.offers - a.offers || a.name.localeCompare(b.name, "fr"))
    .slice(0, take);
}

export type NextAction =
  | { kind: "interview"; href: string; company: string; job: string; at: Date }
  | { kind: "document"; href: string; company: string; name: string }
  | { kind: "message"; href: string; company: string }
  | { kind: "course"; href: string; title: string }
  | { kind: "profile"; href: string; percent: number };

/**
 * The next real actions of the talent, most urgent first: interviews to confirm, documents asked
 * for, unread messages, then the course in progress and the profile to complete.
 */
export async function nextActions(
  db: PrismaClient,
  userId: string,
  context: { course?: { slug: string; title: string } | null; percent: number },
  take = 3,
  now = new Date(),
): Promise<NextAction[]> {
  const [interviews, requests, conversations] = await Promise.all([
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
