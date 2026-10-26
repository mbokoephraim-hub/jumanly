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
  "jobChangesRequested",
  "reportClosed",
  "moderationWarning",
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
  "interviewAccepted",
  "orgVerified",
  "orgVerificationRejected",
  "orgVerificationInfo",
  "orgSuspended",
  "orgReactivated",
  "jobUnavailable",
  "abnormalUsage",
  "licenseActivated",
  "licenseOnHold",
  "licenseExpiring",
  "licenseExpired",
  "licensesLow",
  "diagnosticReady",
  "diagnosticReminder",
  "profileViewed",
  // Recruiter lot 6: the ATS, joining an organization, the end of an offer.
  "atsReady",
  "atsNotRun",
  "orgJoinRequest",
  "orgJoinAccepted",
  "orgJoinDeclined",
  "jobEnding",
  // Modèle B recruteur M5: a colleague entrusted a file to the member (« Répartir »).
  "candidateAssigned",
  // Modèle B recruteur M6: a colleague shared a talent's profile (« Partager le profil »).
  "talentShared",
  // Modèle B recruteur M7: a colleague wrote in « Équipe » of Messages.
  "teamMessage",
  // Modèle B recruteur M8: a member asks the administrators to add a colleague or a plan.
  "colleagueProposed",
  "planRequested",
  // Étape 3, A2: the tasks an administrator entrusts to a member (Équipe).
  "orgTaskAssigned",
  "orgTaskReminder",
  "orgTaskDone",
  // Le Fil (Modèle B, lot B3): answers, names, J'aime, republications and quotes.
  "feedReply",
  "feedMention",
  "feedLike",
  "feedRepost",
  "feedQuote",
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

/**
 * Categories a person can turn off in Paramètres › Notifications (planche talent-4 § 8). A type
 * outside every category (security, moderation, an organization's work) is always delivered.
 */
export const notificationCategories = {
  applications: [
    "statusChange",
    "notSelected",
    "documentRequest",
    "interviewInvite",
    "interviewConfirmed",
    "interviewReschedule",
    "interviewDeclined",
    "interviewCanceled",
    "interviewAccepted",
    "jobUnavailable",
    "matchReviewed",
    "profileViewed",
  ],
  messages: [
    "newMessage",
    "teamMessage",
    "mention",
    "contactRequest",
    "contactAccepted",
    "contactDeclined",
    "feedReply",
    "feedMention",
    "feedLike",
    "feedRepost",
    "feedQuote",
  ],
  learning: ["certificateIssued", "diagnosticReady", "diagnosticReminder"],
  billing: [
    "renewalDue",
    "grace",
    "downgraded",
    "upgraded",
    "renewed",
    "licenseExpiring",
    "licenseExpired",
  ],
} as const satisfies Record<string, readonly NotificationType[]>;
export type NotificationCategory = keyof typeof notificationCategories;
export const NOTIFICATION_CATEGORIES = Object.keys(
  notificationCategories,
) as NotificationCategory[];

/**
 * The recruiter's own switches (Modèle B recruteur M8, planche Recruteur-compte-notifications),
 * stored beside the talent's in `notificationsMuted` with the prefix « rh. ». « Nouveau message »
 * is the talent's category `messages`: one person, one inbox.
 */
export const recruiterNotificationCategories = {
  "rh.applications": ["newApplication", "atsReady", "jobEnding"],
  "rh.interviews": [
    "interviewTeam",
    "interviewConfirmed",
    "interviewReschedule",
    "interviewDeclined",
    "interviewCanceled",
    "interviewAccepted",
  ],
  "rh.team": [
    "candidateAssigned",
    "talentShared",
    "colleagueProposed",
    "planRequested",
    "orgJoinRequest",
    "orgTaskAssigned",
    "orgTaskReminder",
    "orgTaskDone",
  ],
} as const satisfies Record<string, readonly NotificationType[]>;
export type RecruiterNotificationCategory = keyof typeof recruiterNotificationCategories;
export const RECRUITER_NOTIFICATION_CATEGORIES = Object.keys(
  recruiterNotificationCategories,
) as RecruiterNotificationCategory[];
/** The switches of the recruiter's screen, in its order. */
export const RECRUITER_SWITCHES = [
  "rh.applications",
  "rh.interviews",
  "messages",
  "rh.team",
] as const;
export type RecruiterSwitch = (typeof RECRUITER_SWITCHES)[number];

export function recruiterCategoryOf(type: NotificationType): RecruiterNotificationCategory | null {
  return (
    RECRUITER_NOTIFICATION_CATEGORIES.find((category) =>
      (recruiterNotificationCategories[category] as readonly string[]).includes(type),
    ) ?? null
  );
}

/**
 * The muted list after one screen saved its switches: the switches it shows follow `kept`, every
 * other choice (the other screen's) stays as it was.
 */
export function mutedAfter(
  current: readonly string[],
  shown: readonly string[],
  kept: ReadonlySet<string>,
): string[] {
  return [
    ...current.filter((category) => !shown.includes(category)),
    ...shown.filter((category) => !kept.has(category)),
  ];
}

export function categoryOf(type: NotificationType): NotificationCategory | null {
  return (
    NOTIFICATION_CATEGORIES.find((category) =>
      (notificationCategories[category] as readonly string[]).includes(type),
    ) ?? null
  );
}

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
  let userIds = [...new Set(input.userIds)];
  // A category the person turned off (Paramètres › Notifications) creates nothing for them.
  const categories = [categoryOf(input.type), recruiterCategoryOf(input.type)].filter(
    (category): category is NonNullable<typeof category> => category !== null,
  );
  if (categories.length > 0) {
    const muted = await db.user.findMany({
      where: { id: { in: userIds }, notificationsMuted: { hasSome: categories } },
      select: { id: true },
    });
    const off = new Set(muted.map((user) => user.id));
    userIds = userIds.filter((id) => !off.has(id));
    if (userIds.length === 0) return;
  }
  await db.notification.createMany({
    data: userIds.map((userId) => ({
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
