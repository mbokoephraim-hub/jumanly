/**
 * Messages of the recruiter space (planche recruteur-3 `MSG_R`, v2.3): one conversation per
 * candidate or per talent who accepted a proposal, the newest first, with the stage badge, the
 * last message and the unread count. Golden rule n° 6: every query is filtered by the member's
 * organization; a member who cannot read applications sees none.
 */
import type { PrismaClient, StageKind } from "@/generated/prisma/client";
import { hirePermissions, type HireContext } from "./hire";

export const inboxFilters = [
  "toutes",
  "non-lues",
  "retenus",
  "propositions",
  "non-retenus",
] as const;
export type InboxFilter = (typeof inboxFilters)[number];

/** The badge of a conversation (`rhInbox.badge.*`). */
export type InboxBadge = "interview" | "hired" | "review" | "rejected" | "withdrawn" | "proposal";

export function badgeOf(
  application: { status: string; stage: { kind: StageKind } } | null,
): InboxBadge {
  if (!application) return "proposal";
  if (application.status === "hired") return "hired";
  if (application.status === "rejected") return "rejected";
  if (application.status === "withdrawn") return "withdrawn";
  if (application.stage.kind === "interview" || application.stage.kind === "offer")
    return "interview";
  return "review";
}

const matches: Record<InboxFilter, (row: { badge: InboxBadge; unread: number }) => boolean> = {
  toutes: () => true,
  "non-lues": (row) => row.unread > 0,
  retenus: (row) => row.badge === "interview" || row.badge === "hired",
  propositions: (row) => row.badge === "proposal",
  "non-retenus": (row) => row.badge === "rejected" || row.badge === "withdrawn",
};

export type InboxRow = Awaited<ReturnType<typeof listRecruiterInbox>>["rows"][number];

/** The organization's conversations, with what the list shows. */
export async function listRecruiterInbox(
  db: PrismaClient,
  ctx: HireContext,
  options: { filter?: InboxFilter; q?: string } = {},
) {
  if (!hirePermissions(ctx.role).readApplications) return { rows: [], unread: 0, waiting: [] };
  const query = (options.q ?? "").trim().slice(0, 100);
  const conversations = await db.conversation.findMany({
    where: {
      organizationId: ctx.organizationId,
      kind: { not: "peer" },
      ...(query
        ? {
            OR: [
              {
                application: {
                  profile: { user: { name: { contains: query, mode: "insensitive" } } },
                },
              },
              { application: { job: { title: { contains: query, mode: "insensitive" } } } },
              {
                contactRequest: {
                  profile: { user: { name: { contains: query, mode: "insensitive" } } },
                },
              },
              { contactRequest: { job: { title: { contains: query, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    select: {
      id: true,
      talentUserId: true,
      lastMessageAt: true,
      blockedAt: true,
      application: {
        select: {
          id: true,
          status: true,
          stage: { select: { kind: true, name: true } },
          job: { select: { title: true } },
          profile: { select: { user: { select: { name: true, firstName: true } } } },
        },
      },
      contactRequest: {
        select: {
          job: { select: { title: true } },
          profile: { select: { id: true, user: { select: { name: true, firstName: true } } } },
        },
      },
      participants: { where: { userId: ctx.userId }, select: { lastReadAt: true } },
      messages: {
        where: { hiddenAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, senderId: true, body: true, kind: true, createdAt: true },
      },
    },
  });
  const rows = conversations.map((conversation) => {
    const readAt = conversation.participants[0]?.lastReadAt ?? null;
    const last = conversation.messages[0] ?? null;
    const unread = conversation.messages.filter(
      (message) =>
        message.senderId !== ctx.userId &&
        message.senderId !== null &&
        (!readAt || message.createdAt > readAt),
    ).length;
    const person =
      conversation.application?.profile.user ?? conversation.contactRequest?.profile.user ?? null;
    return {
      id: conversation.id,
      name: person?.name ?? "",
      firstName: (person?.firstName || person?.name || "").split(/\s+/)[0] ?? "",
      job: conversation.application?.job.title ?? conversation.contactRequest?.job?.title ?? null,
      proposal: !conversation.application,
      badge: badgeOf(conversation.application),
      last,
      lastMine: last?.senderId === ctx.userId,
      /** The last message comes from the candidate: an answer is awaited. */
      waiting: last !== null && last.senderId === conversation.talentUserId,
      unread,
      at: last?.createdAt ?? conversation.lastMessageAt,
    };
  });
  const filtered = rows.filter(matches[options.filter ?? "toutes"]);
  return {
    rows: filtered,
    unread: rows.filter((row) => row.unread > 0).length,
    waiting: rows.filter((row) => row.waiting),
  };
}
