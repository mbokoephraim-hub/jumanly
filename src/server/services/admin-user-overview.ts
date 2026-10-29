/**
 * Fiche utilisateur de l'admin (Ephraïm, 29/10/2026): one screen about one person, what they do on
 * Jumanly, their payments, the end of their subscription, their complaints and the alerts about
 * them. Never private messages, CVs or documents (privacy rule of the admin).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { resolvePlan } from "@/server/entitlements";

const DAY = 86_400_000;

export type ActivityKind =
  "signIn" | "application" | "course" | "courseDone" | "certificate" | "post";

export type UserAlert =
  | { kind: "suspended"; reason: string | null }
  | { kind: "emailUnverified" }
  | { kind: "deletionScheduled"; date: Date }
  | { kind: "paymentFailed"; date: Date }
  | { kind: "pastDue" }
  | { kind: "endingSoon"; date: Date; days: number }
  | { kind: "canceling"; date: Date }
  | { kind: "reported"; count: number };

/** The reports whose content belongs to the person: their profile, their posts, their messages, their jobs. */
async function reportsAbout(db: PrismaClient, userId: string, profileId: string | null) {
  const candidates = await db.report.findMany({
    where: {
      OR: [
        ...(profileId ? [{ targetType: "profile", targetId: profileId }] : []),
        { targetType: { in: ["post", "message", "job"] } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      status: true,
      createdAt: true,
    },
  });
  const ids = (type: string) =>
    candidates.filter((report) => report.targetType === type).map((report) => report.targetId);
  const [posts, messages, jobs] = await Promise.all([
    db.feedPost.findMany({
      where: { id: { in: ids("post") }, authorId: userId },
      select: { id: true },
    }),
    db.message.findMany({
      where: { id: { in: ids("message") }, senderId: userId },
      select: { id: true },
    }),
    db.job.findMany({
      where: { id: { in: ids("job") }, createdById: userId },
      select: { id: true },
    }),
  ]);
  const owned = new Set([...posts, ...messages, ...jobs].map((row) => row.id));
  return candidates.filter(
    (report) => report.targetType === "profile" || owned.has(report.targetId),
  );
}

export async function userOverview(db: PrismaClient, userId: string, now = new Date()) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      status: true,
      emailVerified: true,
      deletionScheduledAt: true,
      talentProfile: { select: { id: true } },
    },
  });
  if (!user) return null;
  const profileId = user.talentProfile?.id ?? null;
  const plan = await resolvePlan(db, { type: "user", id: userId }, now);

  const [
    subscription,
    payments,
    sessions,
    applications,
    enrollments,
    certificates,
    posts,
    counts,
    filed,
    disputes,
    about,
    suspension,
  ] = await Promise.all([
    plan?.subscriptionId
      ? db.subscription.findUnique({
          where: { id: plan.subscriptionId },
          select: {
            status: true,
            source: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            pendingPlan: { select: { name: true } },
          },
        })
      : null,
    db.payment.findMany({
      where: { OR: [{ subjectType: "user", subjectId: userId }, { payerId: userId }] },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        amountCents: true,
        currency: true,
        status: true,
        method: true,
        kind: true,
        createdAt: true,
        paidAt: true,
        refundedAt: true,
        plan: { select: { name: true } },
      },
    }),
    db.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, createdAt: true },
    }),
    profileId
      ? db.application.findMany({
          where: { profileId },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { id: true, createdAt: true, job: { select: { title: true } } },
        })
      : [],
    db.enrollment.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 6,
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        course: { select: { title: true } },
      },
    }),
    db.certificate.findMany({
      where: { enrollment: { userId } },
      orderBy: { issuedAt: "desc" },
      take: 4,
      select: {
        id: true,
        issuedAt: true,
        enrollment: { select: { course: { select: { title: true } } } },
      },
    }),
    db.feedPost.findMany({
      where: { authorId: userId, organizationId: null },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, createdAt: true, title: true },
    }),
    Promise.all([
      profileId ? db.application.count({ where: { profileId } }) : 0,
      db.enrollment.count({ where: { userId, completedAt: null } }),
      db.certificate.count({ where: { enrollment: { userId }, revokedAt: null } }),
      db.feedPost.count({ where: { authorId: userId, organizationId: null } }),
    ]),
    db.report.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, targetType: true, reason: true, status: true, createdAt: true },
    }),
    db.matchDispute.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, reason: true, status: true, createdAt: true },
    }),
    reportsAbout(db, userId, profileId),
    user.status === "suspended"
      ? db.auditLog.findFirst({
          where: { targetType: "user", targetId: userId, action: "user.suspend" },
          orderBy: { createdAt: "desc" },
          select: { metadata: true },
        })
      : null,
  ]);

  type Activity = { id: string; kind: ActivityKind; date: Date; label: string | null };
  const activity: Activity[] = [
    ...sessions.map((row) => ({
      id: `s-${row.id}`,
      kind: "signIn" as const,
      date: row.createdAt,
      label: null,
    })),
    ...applications.map((row) => ({
      id: `a-${row.id}`,
      kind: "application" as const,
      date: row.createdAt,
      label: row.job.title,
    })),
    ...enrollments.flatMap((row) => [
      { id: `e-${row.id}`, kind: "course" as const, date: row.startedAt, label: row.course.title },
      ...(row.completedAt
        ? [
            {
              id: `c-${row.id}`,
              kind: "courseDone" as const,
              date: row.completedAt,
              label: row.course.title,
            },
          ]
        : []),
    ]),
    ...certificates.map((row) => ({
      id: `t-${row.id}`,
      kind: "certificate" as const,
      date: row.issuedAt,
      label: row.enrollment.course.title,
    })),
    ...posts.map((row) => ({
      id: `p-${row.id}`,
      kind: "post" as const,
      date: row.createdAt,
      label: row.title,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 12);

  const paid = subscription && plan && plan.priceCents !== 0 ? subscription : null;
  const daysLeft = paid
    ? Math.max(0, Math.ceil((paid.currentPeriodEnd.getTime() - now.getTime()) / DAY))
    : null;

  const alerts: UserAlert[] = [];
  if (user.status === "suspended") {
    const reason = (suspension?.metadata as { reason?: unknown } | null)?.reason;
    alerts.push({
      kind: "suspended",
      reason: typeof reason === "string" && reason ? reason : null,
    });
  }
  if (user.status !== "deleted" && !user.emailVerified) alerts.push({ kind: "emailUnverified" });
  if (user.deletionScheduledAt)
    alerts.push({ kind: "deletionScheduled", date: user.deletionScheduledAt });
  const failed = payments.find(
    (payment) =>
      payment.status === "failed" && now.getTime() - payment.createdAt.getTime() < 30 * DAY,
  );
  if (failed) alerts.push({ kind: "paymentFailed", date: failed.createdAt });
  if (paid?.status === "past_due") alerts.push({ kind: "pastDue" });
  else if (paid?.cancelAtPeriodEnd) alerts.push({ kind: "canceling", date: paid.currentPeriodEnd });
  else if (paid && daysLeft !== null && daysLeft <= 7)
    alerts.push({ kind: "endingSoon", date: paid.currentPeriodEnd, days: daysLeft });
  const openAbout = about.filter((report) => report.status !== "closed").length;
  if (openAbout > 0) alerts.push({ kind: "reported", count: openAbout });

  const [applicationCount, coursesInProgress, certificateCount, postCount] = counts;
  return {
    plan,
    subscription: paid ? { ...paid, daysLeft: daysLeft ?? 0 } : null,
    payments,
    paidTotalCents: payments
      .filter((payment) => payment.status === "succeeded")
      .reduce((sum, payment) => sum + payment.amountCents, 0),
    activity,
    counts: { applicationCount, coursesInProgress, certificateCount, postCount },
    complaints: { reports: filed, disputes },
    reportsAbout: about.slice(0, 10),
    alerts,
  };
}

export type UserOverview = NonNullable<Awaited<ReturnType<typeof userOverview>>>;
