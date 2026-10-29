/**
 * In-app notifications (textes `notifications.*`). Each one stores its type and the values its
 * text needs; the text itself comes from the translations when it is displayed.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { pushNotification } from "./push";

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
  "orgDeleted",
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
  // Connexions of the Chat (Ephraïm 29/10/2026): a request received, a request accepted.
  "connectionRequest",
  "connectionAccepted",
  // « Faire vérifier » (Ephraïm 29/10/2026): the referent answered.
  "referenceConfirmed",
  "referenceDeclined",
] as const;
export type NotificationType = (typeof notificationTypes)[number];

/** Types worth a toast when they arrive while the person is on the platform (brief § 4.3). */
export const importantNotificationTypes: readonly NotificationType[] = [
  "interviewInvite",
  "newMessage",
  "contactRequest",
  "connectionRequest",
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
    "connectionRequest",
    "connectionAccepted",
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

/**
 * The key of a notification's text under `notifications.item`: a message outside any application
 * says only who wrote (« Nouveau message de Sublime »), without a dangling « · ».
 */
export function notificationKey(type: string, values: Record<string, string>) {
  return type === "newMessage" && !values.jobTitle ? "newMessageDirect" : type;
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
    /** Who did it: their photo shows beside the notification (Ephraïm 29/10/2026). */
    actorId?: string;
  },
) {
  if (input.userIds.length === 0) return;
  const payload = input.actorId ? { ...input.payload, actorId: input.actorId } : input.payload;
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
  // One line per conversation (Ephraïm 29/10/2026): a new message replaces the unread one of the
  // same conversation instead of piling « Nouveau message de … » up.
  if (input.type === "newMessage")
    await db.notification.deleteMany({
      where: { userId: { in: userIds }, type: "newMessage", href: input.href, readAt: null },
    });
  await db.notification.createMany({
    data: userIds.map((userId) => ({ userId, type: input.type, payload, href: input.href })),
  });
  // Also on the phone, outside the app, for what matters (a message, a request…).
  await pushNotification(db, { userIds, type: input.type, payload, href: input.href }).catch(
    (error) => console.error("[push]", error),
  );
}

/**
 * The count of the bell: exactly the lines the list shows (Ephraïm 29/10/2026: once the list is
 * read, the bell must not stay lit). Same types, and one « Nouveau message » per conversation.
 */
export async function unreadNotifications(db: PrismaClient, userId: string) {
  const unread = await db.notification.findMany({
    where: { userId, readAt: null, type: { in: [...notificationTypes] } },
    orderBy: { createdAt: "desc" },
    select: { type: true, href: true },
    take: 100,
  });
  return distinctConversations(unread).length;
}

/** The older « Nouveau message » of a conversation that already has a newer one are left out. */
function distinctConversations<T extends { type: string; href: string | null }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (item.type !== "newMessage" || !item.href) return true;
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

/**
 * The notifications still to read (Ephraïm 29/10/2026: once read, or « Tout marquer comme lu »,
 * a notification leaves the list at once), the newest first; the older « Nouveau message » of a
 * conversation that already has a newer one are left out.
 */
export async function listNotifications(db: PrismaClient, userId: string) {
  const unread = await db.notification.findMany({
    where: { userId, readAt: null, type: { in: [...notificationTypes] } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return distinctConversations(unread);
}

/** Opening a conversation reads its notifications (« Nouveau message », document requested). */
export async function markConversationNotificationsRead(
  db: PrismaClient,
  userId: string,
  conversationId: string,
) {
  await db.notification.updateMany({
    where: { userId, readAt: null, href: `/app/messages/${conversationId}` },
    data: { readAt: new Date() },
  });
}

/**
 * The person beside each notification, for their photo: who did it (`actorId`), or for a message
 * written before it was stored, the other person of the conversation.
 */
export async function notificationActors(
  db: PrismaClient,
  userId: string,
  items: { id: string; type: string; payload: unknown; href: string | null }[],
) {
  const actorOf = new Map<string, string>();
  const conversationOf = new Map<string, string>();
  for (const item of items) {
    const actorId = notificationValues(item.payload).actorId;
    if (actorId) actorOf.set(item.id, actorId);
    else if (item.href?.startsWith("/app/messages/")) {
      const conversationId = item.href.slice("/app/messages/".length).split(/[/?#]/)[0];
      if (conversationId) conversationOf.set(item.id, conversationId);
    }
  }
  if (conversationOf.size > 0) {
    const others = await db.conversationParticipant.findMany({
      where: {
        conversationId: { in: [...new Set(conversationOf.values())] },
        userId: { not: userId },
      },
      select: { conversationId: true, userId: true },
    });
    const byConversation = new Map(others.map((other) => [other.conversationId, other.userId]));
    for (const [id, conversationId] of conversationOf) {
      const other = byConversation.get(conversationId);
      if (other) actorOf.set(id, other);
    }
  }
  const people = actorOf.size
    ? await db.user.findMany({
        where: { id: { in: [...new Set(actorOf.values())] } },
        select: { id: true, name: true, image: true },
      })
    : [];
  const byId = new Map(people.map((person) => [person.id, person]));
  return new Map(
    [...actorOf].flatMap(([id, actorId]) => {
      const person = byId.get(actorId);
      return person ? [[id, person] as const] : [];
    }),
  );
}

/** The latest notifications, for the bell's panel. */
export async function latestNotifications(db: PrismaClient, userId: string, take = 6) {
  return db.notification.findMany({
    where: { userId, type: { in: [...notificationTypes] } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/**
 * Reads one notification, or all of them. A « Nouveau message » read from the list also reads the
 * older ones of its conversation, which the list did not show: nothing is left lit behind it.
 */
export async function markNotificationsRead(db: PrismaClient, userId: string, id?: string) {
  const one = id
    ? await db.notification.findFirst({ where: { id, userId }, select: { type: true, href: true } })
    : null;
  if (id && !one) return;
  await db.notification.updateMany({
    where: {
      userId,
      readAt: null,
      ...(one?.type === "newMessage" && one.href
        ? { OR: [{ id }, { type: "newMessage", href: one.href }] }
        : id
          ? { id }
          : {}),
    },
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
