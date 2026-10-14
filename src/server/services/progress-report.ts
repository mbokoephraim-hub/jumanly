/**
 * Detailed progress report of a talent (E10, `reports.progress.detailed`): plan, learning,
 * skills, Career tools and applications, from the talent's own data only. No score of the
 * person: counts and progress they can act on.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { getPlan } from "./progress-plan";
import { parseFeedback } from "./interview-sim";

export const REPORT_KEY = "reports.progress.detailed";

export async function progressReport(db: PrismaClient, userId: string, now = new Date()) {
  const since = new Date(now.getTime() - 90 * 86_400_000);
  const [plan, enrollments, profile, interviews, applications] = await Promise.all([
    getPlan(db, userId),
    db.enrollment.findMany({
      where: { userId },
      select: {
        progress: true,
        completedAt: true,
        course: { select: { title: true } },
        certificate: { select: { id: true, revokedAt: true } },
      },
      orderBy: { startedAt: "desc" },
    }),
    db.talentProfile.findUnique({
      where: { userId },
      select: {
        completeness: true,
        skills: { select: { verified: true } },
        _count: { select: { documents: true } },
        documents: { where: { kind: "cv" }, select: { id: true } },
      },
    }),
    db.interviewSession.findMany({
      where: { userId, status: "completed" },
      select: { completedAt: true, feedback: true },
      orderBy: { completedAt: "desc" },
    }),
    db.application.findMany({
      where: { profile: { userId } },
      select: { createdAt: true, stage: { select: { kind: true } } },
    }),
  ]);

  const steps = plan?.steps ?? [];
  const latest = interviews[0] ? parseFeedback(interviews[0].feedback) : null;
  const stageCount = (kinds: string[]) =>
    applications.filter((application) => kinds.includes(application.stage.kind)).length;
  return {
    plan: {
      goal: plan?.goal || null,
      done: steps.filter((step) => step.done).length,
      total: steps.length,
    },
    learning: {
      enrolled: enrollments.length,
      completed: enrollments.filter((item) => item.completedAt).length,
      certificates: enrollments.filter((item) => item.certificate && !item.certificate.revokedAt)
        .length,
      courses: enrollments.map((item) => ({ title: item.course.title, progress: item.progress })),
    },
    profile: {
      completeness: profile?.completeness ?? 0,
      skills: profile?.skills.length ?? 0,
      verified: profile?.skills.filter((skill) => skill.verified).length ?? 0,
      cvs: profile?.documents.length ?? 0,
      documents: (profile?._count.documents ?? 0) - (profile?.documents.length ?? 0),
    },
    interviews: {
      total: interviews.length,
      recent: interviews.filter((item) => item.completedAt && item.completedAt >= since).length,
      latestCriteria: latest?.criteria ?? [],
    },
    applications: {
      total: applications.length,
      recent: applications.filter((item) => item.createdAt >= since).length,
      inProgress: stageCount(["new", "screening", "test", "interview", "offer"]),
      interview: stageCount(["interview", "offer"]),
      hired: stageCount(["hired"]),
    },
  };
}
export type ProgressReport = Awaited<ReturnType<typeof progressReport>>;
