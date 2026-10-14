/**
 * In-app notifications (textes `notifications.*`). Each one stores its type and the values its
 * text needs; the text itself comes from the translations when it is displayed.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

export const notificationTypes = [
  "newApplication",
  "statusChange",
  "notSelected",
  "newMessage",
  "documentRequest",
  "orgInvite",
  "jobApproved",
  "jobRejected",
  "certificateIssued",
  "matchReviewed",
  "paymentSucceeded",
  "paymentFailed",
  "renewalDue",
  "grace",
  "downgraded",
  "upgraded",
  "renewed",
  "mention",
  "contactRequest",
  "contactAccepted",
  "contactDeclined",
  "interviewInvite",
  "interviewTeam",
  "interviewConfirmed",
  "interviewReschedule",
  "interviewDeclined",
  "interviewCanceled",
  "orgVerified",
  "orgVerificationRejected",
  "abnormalUsage",
  "licenseActivated",
  "licenseOnHold",
  "licenseExpiring",
  "licenseExpired",
  "licensesLow",
] as const;
export type NotificationType = (typeof notificationTypes)[number];

/** Types worth a toast when they arrive while the person is on the platform (brief § 4.3). */
export const importantNotificationTypes: readonly NotificationType[] = [
  "interviewInvite",
  "newMessage",
  "contactRequest",
  "documentRequest",
  "orgInvite",
  "paymentSucceeded",
  "paymentFailed",
];

/** Values of a notification's text, from its stored payload. */
export function notificationValues(payload: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries(payload && typeof payload === "object" ? payload : {}).map(([key, value]) => [
      key,
      String(value ?? ""),
    ]),
  );
}

export async function notify(
  db: PrismaClient,
  input: {
    userIds: string[];
    type: NotificationType;
    payload: Prisma.InputJsonObject;
    href: string;
  },
) {
  if (input.userIds.length === 0) return;
  await db.notification.createMany({
    data: [...new Set(input.userIds)].map((userId) => ({
      userId,
      type: input.type,
      payload: input.payload,
      href: input.href,
    })),
  });
}

export async function unreadNotifications(db: PrismaClient, userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}

export async function listNotifications(db: PrismaClient, userId: string, unreadOnly = false) {
  return db.notification.findMany({
    where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/** The latest notifications, for the bell's panel. */
export async function latestNotifications(db: PrismaClient, userId: string, take = 6) {
  return db.notification.findMany({
    where: { userId, type: { in: [...notificationTypes] } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function markNotificationsRead(db: PrismaClient, userId: string, id?: string) {
  await db.notification.updateMany({
    where: { userId, readAt: null, ...(id ? { id } : {}) },
    data: { readAt: new Date() },
  });
}

/** Recipients of a new application e-mail: the organization's members who manage jobs. */
export async function hiringTeam(db: PrismaClient, organizationId: string) {
  const members = await db.membership.findMany({
    where: {
      organizationId,
      status: "active",
      role: { in: ["org_owner", "org_admin", "recruiter"] },
    },
    select: { user: { select: { id: true, email: true, firstName: true } } },
  });
  return members.map((member) => member.user);
}
