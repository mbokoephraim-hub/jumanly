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
