/**
 * Le Fil (Modèle B, lot B3, docs/modele-b rangées 05-06): posts of people and organizations,
 * answers, J'aime, Republier, Citer, Enregistrer, « Ne plus voir ce type de publication »,
 * events and reports. Every post is visible to every signed-in talent; a blocked connection
 * hides each other's posts. « Pour vous » puts professional posts forward (feed-rank.ts, Ephraïm's
 * request of 22/10/2026); the two other tabs stay the most recent first.
 */
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { FeedPostKind, PrismaClient } from "@/generated/prisma/client";
import { matchesForUser } from "@/server/matching/service";
import { recordAudience, recordImpressions } from "./audience";
import { FEED_POST_MAX, FEED_REPLY_MAX, postTextSchema } from "./feed-limits";
import { rankFeed, type AuthorSignals } from "./feed-rank";
import { photoType } from "./profile-photo";
import { notify } from "./notifications";

export const FEED_TABS = ["pourvous", "abonnements", "entreprises"] as const;
export type FeedTab = (typeof FEED_TABS)[number];

export { FEED_POST_MAX, FEED_REPLY_MAX };
/** A photo reduced on the phone stays far below this. */
export const FEED_IMAGE_MAX = 1_000_000;
const IMAGE_PREFIX = "/api/fil/image/";
const PAGE = 30;
/** « Pour vous » chooses its page among this many recent posts. */
const CANDIDATES = 200;
const DAY_MS = 86_400_000;

export class FeedError extends Error {
  constructor(public code: "notFound" | "invalid" | "closed" | "image") {
    super(code);
  }
}

/** The « type » a person can choose to see less of: an organization's posts, or a kind. */
export function feedTypeOf(post: { organizationId: string | null; kind: FeedPostKind }) {
  return post.organizationId ? "company" : post.kind;
}

const personSelect = {
  id: true,
  name: true,
  image: true,
  city: true,
  talentProfile: {
    select: {
      headline: true,
      desiredJobTitles: true,
      experiences: {
        where: { endDate: null },
        orderBy: { startDate: "desc" },
        take: 1,
        select: { company: true, title: true },
      },
    },
  },
} satisfies Prisma.UserSelect;

const orgSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  sector: true,
  city: true,
  verifiedAt: true,
  _count: { select: { jobs: { where: { status: "published" } } } },
} satisfies Prisma.OrganizationSelect;

const postSelect = {
  id: true,
  kind: true,
  title: true,
  body: true,
  imageUrl: true,
  imageAlt: true,
  attachment: true,
  replyPolicy: true,
  eventAt: true,
  createdAt: true,
  editedAt: true,
  authorId: true,
  organizationId: true,
  parentId: true,
  author: { select: personSelect },
  organization: { select: orgSelect },
  job: {
    select: {
      id: true,
      slug: true,
      title: true,
      city: true,
      contractType: true,
      remote: true,
      status: true,
    },
  },
  quoted: {
    select: {
      id: true,
      body: true,
      hiddenAt: true,
      author: { select: { name: true } },
      organization: { select: { name: true } },
    },
  },
  _count: { select: { likes: true, reposts: true, replies: true, participants: true } },
} satisfies Prisma.FeedPostSelect;

type PostRow = Prisma.FeedPostGetPayload<{ select: typeof postSelect }>;

export type FeedAuthor = {
  kind: "person" | "org";
  /** The user, or the organization's slug. */
  id: string;
  name: string;
  image: string | null;
  /** « Analyste crédit · Fleuve Banque », « Fintech · Kinshasa · 8 offres ». */
  title: string | null;
  company: string | null;
  sector: string | null;
  city: string | null;
  offers: number;
  /** A company verified by Jumanly: a Lime ring around its logo in the Fil. */
  verified?: boolean;
};

export type FeedAttachment = {
  type: "work" | "certificate";
  id: string;
  title: string;
  detail: string;
};

export type FeedItem = {
  id: string;
  kind: FeedPostKind;
  type: string;
  author: FeedAuthor;
  /** Null for the posts published before titles (26/10/2026). */
  title: string | null;
  body: string;
  imageUrl: string | null;
  imageAlt: string | null;
  job: {
    slug: string;
    title: string;
    city: string;
    contractType: string;
    remote: string;
    score: number | null;
  } | null;
  attachment: FeedAttachment | null;
  quoted: { id: string; name: string; body: string } | null;
  event: { at: Date; participants: number; going: boolean } | null;
  createdAt: Date;
  likes: number;
  liked: boolean;
  /** The last two people who liked it: their faces beside the count, on the photo. */
  likers: { name: string; image: string | null }[];
  replies: number;
  reposts: number;
  reposted: boolean;
  saved: boolean;
  mine: boolean;
  /** The last two comments, shown under the post in the Fil (oldest first). */
  comments: FeedReply[];
  edited: boolean;
  canReply: boolean;
  replyPolicy: string;
};

function authorOf(row: PostRow): FeedAuthor {
  if (row.organization) {
    return {
      kind: "org",
      id: row.organization.slug,
      name: row.organization.name,
      image: row.organization.logo,
      title: null,
      company: null,
      sector: row.organization.sector,
      city: row.organization.city,
      offers: row.organization._count.jobs,
      verified: Boolean(row.organization.verifiedAt),
    };
  }
  const profile = row.author?.talentProfile;
  return {
    kind: "person",
    id: row.author?.id ?? "",
    name: row.author?.name ?? "",
    image: row.author?.image ?? null,
    title:
      profile?.experiences[0]?.title || profile?.headline || profile?.desiredJobTitles[0] || null,
    company: profile?.experiences[0]?.company ?? null,
    sector: null,
    city: row.author?.city ?? null,
    offers: 0,
  };
}

function attachmentOf(value: Prisma.JsonValue | null): FeedAttachment | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { type, id, title, detail } = value as Record<string, unknown>;
  if ((type !== "work" && type !== "certificate") || typeof title !== "string") return null;
  return { type, id: String(id ?? ""), title, detail: String(detail ?? "") };
}

/** Everyone the viewer is connected to (accepted), and those a block separates from them. */
async function circle(db: PrismaClient, userId: string) {
  const rows = await db.connection.findMany({
    where: {
      status: { in: ["accepted", "blocked"] },
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true, status: true },
  });
  const connected: string[] = [];
  const blocked: string[] = [];
  for (const row of rows) {
    const other = row.requesterId === userId ? row.addresseeId : row.requesterId;
    (row.status === "accepted" ? connected : blocked).push(other);
  }
  return { connected, blocked };
}

/** Whether the viewer may answer: the author's choice, a connection, never a blocked person. */
function mayReply(
  post: { replyPolicy: string; authorId: string | null; organizationId: string | null },
  viewerId: string,
  connected: string[],
) {
  if (post.authorId === viewerId) return true;
  if (post.replyPolicy === "nobody") return false;
  if (post.replyPolicy === "connections")
    return Boolean(post.authorId && connected.includes(post.authorId));
  return true;
}

async function toItems(
  db: PrismaClient,
  viewerId: string,
  rows: PostRow[],
  connected: string[],
  now: Date,
  blocked: string[] = [],
): Promise<FeedItem[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const jobIds = [
    ...new Set(rows.flatMap((row) => (row.job?.status === "published" ? [row.job.id] : []))),
  ];
  const [likes, recentLikes, reposts, saves, going, latest, matches] = await Promise.all([
    db.feedLike.findMany({
      where: { userId: viewerId, postId: { in: ids } },
      select: { postId: true },
    }),
    db.feedLike.findMany({
      where: { postId: { in: ids } },
      orderBy: { createdAt: "desc" },
      take: ids.length * 6,
      select: { postId: true, user: { select: { name: true, image: true } } },
    }),
    db.feedRepost.findMany({
      where: { userId: viewerId, postId: { in: ids } },
      select: { postId: true },
    }),
    db.feedSave.findMany({
      where: { userId: viewerId, postId: { in: ids } },
      select: { postId: true },
    }),
    db.feedEventParticipant.findMany({
      where: { userId: viewerId, postId: { in: ids } },
      select: { postId: true },
    }),
    // Two comments per post, so that the Fil shows them (one small query per commented post).
    Promise.all(
      rows
        .filter((row) => row._count.replies > 0)
        .map((row) =>
          db.feedPost.findMany({
            where: { parentId: row.id, hiddenAt: null, ...notBlocked(blocked) },
            orderBy: { createdAt: "desc" },
            take: 2,
            select: postSelect,
          }),
        ),
    ),
    jobIds.length > 0 ? matchesForUser(db, viewerId, jobIds, now) : new Map(),
  ]);
  const has = (list: { postId: string }[], id: string) => list.some((row) => row.postId === id);
  const shownComments = latest.flat();
  const commentLikes =
    shownComments.length > 0
      ? await db.feedLike.findMany({
          where: { userId: viewerId, postId: { in: shownComments.map((reply) => reply.id) } },
          select: { postId: true },
        })
      : [];
  return rows.map((row) => {
    const match = row.job ? matches.get(row.job.id) : undefined;
    const quoted = row.quoted && !row.quoted.hiddenAt ? row.quoted : null;
    return {
      id: row.id,
      kind: row.kind,
      type: feedTypeOf(row),
      author: authorOf(row),
      title: row.title,
      body: row.body,
      imageUrl: row.imageUrl,
      imageAlt: row.imageAlt,
      job:
        row.job && row.job.status === "published"
          ? {
              slug: row.job.slug,
              title: row.job.title,
              city: row.job.city,
              contractType: row.job.contractType,
              remote: row.job.remote,
              score: match?.state === "ok" ? match.explanation.score : null,
            }
          : null,
      attachment: attachmentOf(row.attachment),
      quoted: quoted
        ? {
            id: quoted.id,
            name: quoted.organization?.name ?? quoted.author?.name ?? "",
            body: quoted.body,
          }
        : null,
      event: row.eventAt
        ? { at: row.eventAt, participants: row._count.participants, going: has(going, row.id) }
        : null,
      createdAt: row.createdAt,
      likes: row._count.likes,
      liked: has(likes, row.id),
      likers: recentLikes
        .filter((like) => like.postId === row.id)
        .slice(0, 2)
        .map((like) => ({ name: like.user.name, image: like.user.image })),
      replies: row._count.replies,
      reposts: row._count.reposts,
      reposted: has(reposts, row.id),
      saved: has(saves, row.id),
      mine: row.authorId === viewerId,
      comments: shownComments
        .filter((reply) => reply.parentId === row.id)
        .reverse()
        .map((reply) => replyOf(reply, viewerId, commentLikes)),
      edited: Boolean(row.editedAt),
      canReply: mayReply(row, viewerId, connected),
      replyPolicy: row.replyPolicy,
    };
  });
}

/**
 * One tab of the Fil: « Pour vous » (everything, professional posts first, feed-rank.ts), then,
 * most recent first, « Abonnements » (people and organizations followed, connections, and the
 * viewer's own posts) and « Entreprises ».
 */
/** The top-level posts a viewer may see in the Fil: not hidden, no blocked author, no masked type. */
async function visiblePosts(
  db: PrismaClient,
  viewerId: string,
  blocked: string[],
): Promise<Prisma.FeedPostWhereInput> {
  const hidden = await db.feedHiddenType.findMany({
    where: { userId: viewerId },
    select: { type: true },
  });
  const hiddenTypes = hidden.map((row) => row.type);
  const hiddenKinds = hiddenTypes.filter((type): type is FeedPostKind => type !== "company");
  return {
    parentId: null,
    hiddenAt: null,
    NOT: [
      ...(blocked.length > 0 ? [{ authorId: { in: blocked }, organizationId: null }] : []),
      ...(hiddenTypes.includes("company") ? [{ organizationId: { not: null } }] : []),
      ...(hiddenKinds.length > 0 ? [{ kind: { in: hiddenKinds }, organizationId: null }] : []),
    ],
  };
}

/**
 * The posts published by others since the Fil was shown (« Nouvelles publications »): the pill
 * that brings them asks every minute, so this only counts, without ranking.
 */
export async function newPostsSince(db: PrismaClient, viewerId: string, since: Date) {
  const { blocked } = await circle(db, viewerId);
  const where = await visiblePosts(db, viewerId, blocked);
  return db.feedPost.count({
    where: {
      ...where,
      createdAt: { gt: since },
      NOT: [
        ...(where.NOT as Prisma.FeedPostWhereInput[]),
        { authorId: viewerId, organizationId: null },
      ],
    },
  });
}

export async function listFeed(
  db: PrismaClient,
  viewerId: string,
  tab: FeedTab,
  now = new Date(),
): Promise<FeedItem[]> {
  const [{ connected, blocked }, follows] = await Promise.all([
    circle(db, viewerId),
    db.feedFollow.findMany({
      where: { followerId: viewerId },
      select: { userId: true, organizationId: true },
    }),
  ]);
  const where = await visiblePosts(db, viewerId, blocked);
  if (tab === "entreprises") where.organizationId = { not: null };
  if (tab === "abonnements") {
    const people = [
      viewerId,
      ...connected,
      ...follows.flatMap((row) => (row.userId ? [row.userId] : [])),
    ];
    const orgs = follows.flatMap((row) => (row.organizationId ? [row.organizationId] : []));
    where.OR = [
      { authorId: { in: people }, organizationId: null },
      ...(orgs.length > 0 ? [{ organizationId: { in: orgs } }] : []),
    ];
  }
  const rows = await db.feedPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: tab === "pourvous" ? CANDIDATES : PAGE,
    select: postSelect,
  });
  if (tab !== "pourvous") {
    await recordImpressions(db, viewerId, rows);
    return toItems(db, viewerId, rows, connected, now, blocked);
  }
  const people = [
    ...new Set(rows.flatMap((row) => (row.authorId && !row.organizationId ? [row.authorId] : []))),
  ];
  const authors = await authorSignals(db, people, now);
  const ranked = rankFeed(
    rows.map((row) => ({
      ...row,
      hasJob: row.job !== null,
      likes: row._count.likes,
      replies: row._count.replies,
      reposts: row._count.reposts,
    })),
    authors,
    viewerId,
    now,
  ).slice(0, PAGE);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const shown = ranked.map((post) => byId.get(post.id)!);
  await recordImpressions(db, viewerId, shown);
  return toItems(db, viewerId, shown, connected, now, blocked);
}

/**
 * What the authors of « Pour vous » did on Jumanly (feed-rank.ts): answers and active days over
 * 30 days, accepted connections, a job obtained through an application in the last 120 days.
 */
export async function authorSignals(
  db: PrismaClient,
  people: string[],
  now = new Date(),
): Promise<Map<string, AuthorSignals>> {
  const result = new Map<string, AuthorSignals>();
  if (people.length === 0) return result;
  const since = new Date(now.getTime() - 30 * DAY_MS);
  const [replies, days, requested, received, hired] = await Promise.all([
    db.feedPost.groupBy({
      by: ["authorId"],
      where: {
        authorId: { in: people },
        organizationId: null,
        parentId: { not: null },
        createdAt: { gte: since },
      },
      _count: { _all: true },
    }),
    db.$queryRaw<{ id: string; days: bigint }[]>`
      SELECT id, COUNT(DISTINCT day) AS days FROM (
        SELECT "authorId" AS id, date_trunc('day', "createdAt") AS day FROM "FeedPost"
        WHERE "authorId" IN (${Prisma.join(people)}) AND "createdAt" >= ${since}
        UNION
        SELECT "userId" AS id, date_trunc('day', "createdAt") AS day FROM "FeedLike"
        WHERE "userId" IN (${Prisma.join(people)}) AND "createdAt" >= ${since}
      ) AS activity GROUP BY id`,
    db.connection.groupBy({
      by: ["requesterId"],
      where: { requesterId: { in: people }, status: "accepted" },
      _count: { _all: true },
    }),
    db.connection.groupBy({
      by: ["addresseeId"],
      where: { addresseeId: { in: people }, status: "accepted" },
      _count: { _all: true },
    }),
    db.application.findMany({
      where: {
        status: "hired",
        updatedAt: { gte: new Date(now.getTime() - 120 * DAY_MS) },
        profile: { userId: { in: people } },
      },
      select: { profile: { select: { userId: true } } },
    }),
  ]);
  const hiredHere = new Set(hired.map((row) => row.profile.userId));
  for (const id of people) {
    result.set(id, {
      replies: replies.find((row) => row.authorId === id)?._count._all ?? 0,
      activeDays: Number(days.find((row) => row.id === id)?.days ?? 0),
      connections:
        (requested.find((row) => row.requesterId === id)?._count._all ?? 0) +
        (received.find((row) => row.addresseeId === id)?._count._all ?? 0),
      hiredHere: hiredHere.has(id),
    });
  }
  return result;
}

export type FeedReply = {
  id: string;
  author: FeedAuthor;
  body: string;
  createdAt: Date;
  likes: number;
  liked: boolean;
  mine: boolean;
  edited: boolean;
};

function notBlocked(blocked: string[]) {
  return blocked.length > 0 ? { NOT: { authorId: { in: blocked }, organizationId: null } } : {};
}

function replyOf(reply: PostRow, viewerId: string, liked: { postId: string }[]): FeedReply {
  return {
    id: reply.id,
    author: authorOf(reply),
    body: reply.body,
    createdAt: reply.createdAt,
    likes: reply._count.likes,
    liked: liked.some((like) => like.postId === reply.id),
    mine: reply.authorId === viewerId,
    edited: Boolean(reply.editedAt),
  };
}

/** A post and its answers (oldest first), or null when it is not visible to the viewer. */
export async function getPost(db: PrismaClient, viewerId: string, id: string, now = new Date()) {
  const { connected, blocked } = await circle(db, viewerId);
  const row = await db.feedPost.findFirst({
    where: { id, parentId: null, hiddenAt: null },
    select: postSelect,
  });
  if (!row || (row.authorId && !row.organizationId && blocked.includes(row.authorId))) return null;
  if (row.authorId && !row.organizationId)
    await recordAudience(
      db,
      viewerId,
      [{ kind: "post_view", ownerId: row.authorId, targetId: row.id }],
      now,
    );
  const [item] = await toItems(db, viewerId, [row], connected, now, blocked);
  const replies = await db.feedPost.findMany({
    where: { parentId: id, hiddenAt: null, ...notBlocked(blocked) },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: postSelect,
  });
  const liked = await db.feedLike.findMany({
    where: { userId: viewerId, postId: { in: replies.map((reply) => reply.id) } },
    select: { postId: true },
  });
  return {
    post: item,
    replies: replies.map((reply) => replyOf(reply, viewerId, liked)),
  };
}

/** A visible top-level post or answer, or a FeedError. */
async function visiblePost(db: PrismaClient, viewerId: string, id: string) {
  const row = await db.feedPost.findFirst({
    where: { id, hiddenAt: null },
    select: {
      id: true,
      authorId: true,
      organizationId: true,
      parentId: true,
      replyPolicy: true,
      kind: true,
      eventAt: true,
      body: true,
    },
  });
  if (!row) throw new FeedError("notFound");
  if (row.authorId && !row.organizationId && row.authorId !== viewerId) {
    const { blocked } = await circle(db, viewerId);
    if (blocked.includes(row.authorId)) throw new FeedError("notFound");
  }
  return row;
}

/**
 * A new post: a title (60 characters) and a text (160), docs/fil-menu-publication § 2; then a
 * photo, an offer, an attachment, a quoted post or an event.
 */
export const newPostSchema = postTextSchema.extend({
  attachment: z.enum(["work", "certificate"]).optional(),
  attachmentId: z.string().trim().max(60).optional(),
  quotedId: z.string().trim().max(60).optional(),
  replyPolicy: z.enum(["everyone", "connections", "nobody"]).default("everyone"),
  image: z.string().trim().max(60).optional(),
  /** A recruiter publishes in their own name or in the name of their company (M3). */
  as: z.enum(["me", "org"]).default("me"),
  /** « Une offre »: a published offer of the recruiter's organization. */
  jobId: z.string().trim().max(60).optional(),
  /** « Un événement »: when it takes place. */
  eventAt: z.coerce.date().optional(),
});
export type NewPost = z.input<typeof newPostSchema>;

/** The career pieces a person may join to a post: their projects and their attestations. */
export async function attachableItems(db: PrismaClient, userId: string) {
  const [projects, certificates] = await Promise.all([
    db.document.findMany({
      where: { profile: { userId }, kind: "portfolio_item" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, title: true },
    }),
    db.certificate.findMany({
      where: { enrollment: { userId }, revokedAt: null },
      orderBy: { issuedAt: "desc" },
      take: 20,
      select: { id: true, issuedAt: true, courseTitle: true },
    }),
  ]);
  return {
    work: projects.map((project) => ({ id: project.id, title: project.title })),
    certificate: certificates.map((certificate) => ({
      id: certificate.id,
      title: certificate.courseTitle,
      issuedAt: certificate.issuedAt,
    })),
  };
}

/**
 * Publishes a post of the viewer: text, a photo they uploaded, one of their projects or
 * attestations, or a quoted post (« Citer »). The texts of the attachment line come from the
 * caller (`labels`), which knows the language.
 */
export async function createPost(
  db: PrismaClient,
  userId: string,
  raw: NewPost,
  labels: { work: string; certificate: (date: Date) => string },
  /**
   * The recruiter's space (Modèle B recruteur, M3): its offers may be joined, and a member who
   * manages the offers may publish in its name. Every offer is read inside this organization.
   */
  hire?: { organizationId: string; canPublishAsOrg: boolean },
  now = new Date(),
) {
  const parsed = newPostSchema.safeParse(raw);
  if (!parsed.success) throw new FeedError("invalid");
  const input = parsed.data;
  if (input.as === "org" && !hire?.canPublishAsOrg) throw new FeedError("invalid");
  if (input.jobId) {
    if (!hire) throw new FeedError("invalid");
    const job = await db.job.findFirst({
      where: { id: input.jobId, organizationId: hire.organizationId, status: "published" },
      select: { id: true },
    });
    if (!job) throw new FeedError("invalid");
  }
  if (input.eventAt && input.eventAt.getTime() < now.getTime() - DAY_MS)
    throw new FeedError("invalid");
  let attachment: FeedAttachment | null = null;
  let kind: FeedPostKind = "post";
  if (input.attachment && input.attachmentId) {
    const items = await attachableItems(db, userId);
    if (input.attachment === "work") {
      const project = items.work.find((item) => item.id === input.attachmentId);
      if (!project) throw new FeedError("invalid");
      attachment = { type: "work", id: project.id, title: project.title, detail: labels.work };
      kind = "work";
    } else {
      const certificate = items.certificate.find((item) => item.id === input.attachmentId);
      if (!certificate) throw new FeedError("invalid");
      attachment = {
        type: "certificate",
        id: certificate.id,
        title: certificate.title,
        detail: labels.certificate(certificate.issuedAt),
      };
      kind = "certificate";
    }
  }
  if (input.quotedId) {
    const quoted = await visiblePost(db, userId, input.quotedId);
    if (quoted.parentId) throw new FeedError("invalid");
  }
  const image = input.image
    ? await db.feedImage.findFirst({
        where: { token: input.image, ownerId: userId, postId: null },
        select: { id: true, token: true },
      })
    : null;
  if (input.image && !image) throw new FeedError("image");
  const post = await db.feedPost.create({
    data: {
      authorId: userId,
      organizationId: input.as === "org" ? hire!.organizationId : null,
      kind: input.eventAt ? "event" : kind,
      eventAt: input.eventAt ?? null,
      jobId: input.jobId ?? null,
      title: input.title,
      body: input.body,
      attachment: attachment ?? undefined,
      quotedId: input.quotedId,
      replyPolicy: input.replyPolicy,
      imageUrl: image ? `${IMAGE_PREFIX}${image.token}` : null,
    },
    select: { id: true },
  });
  if (image) await db.feedImage.update({ where: { id: image.id }, data: { postId: post.id } });
  if (input.quotedId) {
    const quoted = await db.feedPost.findUnique({
      where: { id: input.quotedId },
      select: { authorId: true, organizationId: true },
    });
    if (quoted?.authorId && !quoted.organizationId && quoted.authorId !== userId)
      await notify(db, {
        userIds: [quoted.authorId],
        type: "feedQuote",
        payload: { name: await nameOf(db, userId) },
        href: `/app/fil/${post.id}`,
        actorId: userId,
      });
  }
  return post.id;
}

async function nameOf(db: PrismaClient, userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
  return user?.name ?? "";
}

/** Keeps a photo for a post being written; it joins the post when it is published. */
export async function saveFeedImage(db: PrismaClient, userId: string, bytes: Uint8Array) {
  if (bytes.length === 0 || bytes.length > FEED_IMAGE_MAX) throw new FeedError("image");
  const contentType = photoType(bytes);
  if (!contentType) throw new FeedError("image");
  const token = randomBytes(18).toString("base64url");
  await db.feedImage.create({
    data: { token, ownerId: userId, contentType, bytes: Buffer.from(bytes) },
  });
  return { token, url: `${IMAGE_PREFIX}${token}` };
}

export async function feedImageByToken(db: PrismaClient, token: string) {
  return db.feedImage.findUnique({
    where: { token },
    select: {
      bytes: true,
      contentType: true,
      createdAt: true,
      post: { select: { hiddenAt: true } },
    },
  });
}

export const replySchema = z.object({
  post: z.string().trim().min(1).max(60),
  body: z.string().trim().min(1).max(FEED_REPLY_MAX),
});

/**
 * Answers a post. The author is told; so is anyone named in the answer (« @Prénom Nom »)
 * among the people who took part in the conversation.
 */
export async function replyTo(db: PrismaClient, userId: string, raw: z.input<typeof replySchema>) {
  const parsed = replySchema.safeParse(raw);
  if (!parsed.success) throw new FeedError("invalid");
  const post = await visiblePost(db, userId, parsed.data.post);
  if (post.parentId) throw new FeedError("invalid");
  const { connected } = await circle(db, userId);
  if (!mayReply(post, userId, connected)) throw new FeedError("closed");
  const reply = await db.feedPost.create({
    data: { authorId: userId, parentId: post.id, body: parsed.data.body },
    select: { id: true },
  });
  const name = await nameOf(db, userId);
  const href = `/app/fil/${post.id}`;
  if (post.authorId && !post.organizationId && post.authorId !== userId)
    await notify(db, {
      userIds: [post.authorId],
      type: "feedReply",
      payload: { name },
      href,
      actorId: userId,
    });
  const others = await db.feedPost.findMany({
    where: { parentId: post.id, organizationId: null, authorId: { not: userId } },
    distinct: ["authorId"],
    select: { author: { select: { id: true, name: true } } },
  });
  const named = others
    .flatMap((row) => (row.author ? [row.author] : []))
    .filter(
      (person) => person.id !== post.authorId && parsed.data.body.includes(`@${person.name}`),
    );
  if (named.length > 0)
    await notify(db, {
      userIds: named.map((person) => person.id),
      type: "feedMention",
      payload: { name },
      href,
      actorId: userId,
    });
  return reply.id;
}

/** Toggles a J'aime on a post or an answer; returns the new state. */
export async function toggleLike(db: PrismaClient, userId: string, postId: string) {
  const post = await visiblePost(db, userId, postId);
  const key = { postId_userId: { postId, userId } };
  if (await db.feedLike.findUnique({ where: key })) {
    await db.feedLike.delete({ where: key });
    return false;
  }
  await db.feedLike.create({ data: { postId, userId } });
  if (post.authorId && !post.organizationId && post.authorId !== userId) {
    // One notification per person and post, however often the heart is touched.
    const href = `/app/fil/${post.parentId ?? post.id}`;
    const already = await db.notification.findFirst({
      where: {
        userId: post.authorId,
        type: "feedLike",
        href,
        payload: { path: ["by"], equals: userId },
      },
      select: { id: true },
    });
    if (!already)
      await notify(db, {
        userIds: [post.authorId],
        type: "feedLike",
        payload: { name: await nameOf(db, userId), by: userId },
        href,
        actorId: userId,
      });
  }
  return true;
}

/** Republier (or undo it): the post shows on the person's profile. */
export async function toggleRepost(db: PrismaClient, userId: string, postId: string) {
  const post = await visiblePost(db, userId, postId);
  if (post.parentId) throw new FeedError("invalid");
  const key = { postId_userId: { postId, userId } };
  if (await db.feedRepost.findUnique({ where: key })) {
    await db.feedRepost.delete({ where: key });
    return false;
  }
  await db.feedRepost.create({ data: { postId, userId } });
  if (post.authorId && !post.organizationId && post.authorId !== userId)
    await notify(db, {
      userIds: [post.authorId],
      type: "feedRepost",
      payload: { name: await nameOf(db, userId) },
      href: `/app/fil/${post.id}`,
      actorId: userId,
    });
  return true;
}

/** Enregistrer (or remove it). */
export async function toggleSave(db: PrismaClient, userId: string, postId: string) {
  await visiblePost(db, userId, postId);
  const key = { postId_userId: { postId, userId } };
  if (await db.feedSave.findUnique({ where: key })) {
    await db.feedSave.delete({ where: key });
    return false;
  }
  await db.feedSave.create({ data: { postId, userId } });
  return true;
}

/** « Je participe » to an event (or not any more). */
export async function toggleParticipation(db: PrismaClient, userId: string, postId: string) {
  const post = await visiblePost(db, userId, postId);
  if (!post.eventAt) throw new FeedError("invalid");
  const key = { postId_userId: { postId, userId } };
  if (await db.feedEventParticipant.findUnique({ where: key })) {
    await db.feedEventParticipant.delete({ where: key });
    return false;
  }
  await db.feedEventParticipant.create({ data: { postId, userId } });
  return true;
}

/** « Ne plus voir ce type de publication » (`hide`), or « Annuler » right after. */
export async function setTypeHidden(
  db: PrismaClient,
  userId: string,
  postId: string,
  hide: boolean,
) {
  const post = await visiblePost(db, userId, postId);
  const type = feedTypeOf(post);
  if (hide) {
    await db.feedHiddenType.upsert({
      where: { userId_type: { userId, type } },
      create: { userId, type },
      update: {},
    });
  } else {
    await db.feedHiddenType.deleteMany({ where: { userId, type } });
  }
  return type;
}

/** Deletes one of the viewer's own posts or comments, with its comments. */
export async function deletePost(db: PrismaClient, userId: string, postId: string) {
  const { count } = await db.feedPost.deleteMany({ where: { id: postId, authorId: userId } });
  if (count === 0) throw new FeedError("notFound");
}

export const editSchema = z.object({
  id: z.string().trim().min(1).max(60),
  title: z.string().optional(),
  body: z.string(),
});

/**
 * Changes the title and the text of one of the viewer's own posts, or the text of one of their
 * comments. The photo, the offer and the rest stay; the post shows « modifié ».
 */
export async function editPost(
  db: PrismaClient,
  userId: string,
  raw: z.input<typeof editSchema>,
  now = new Date(),
) {
  const parsed = editSchema.safeParse(raw);
  if (!parsed.success) throw new FeedError("invalid");
  const row = await db.feedPost.findFirst({
    where: { id: parsed.data.id, authorId: userId, hiddenAt: null },
    select: { id: true, parentId: true },
  });
  if (!row) throw new FeedError("notFound");
  if (row.parentId) {
    const body = replySchema.shape.body.safeParse(parsed.data.body);
    if (!body.success) throw new FeedError("invalid");
    await db.feedPost.update({ where: { id: row.id }, data: { body: body.data, editedAt: now } });
    return row.id;
  }
  const text = postTextSchema.safeParse({ title: parsed.data.title, body: parsed.data.body });
  if (!text.success) throw new FeedError("invalid");
  await db.feedPost.update({ where: { id: row.id }, data: { ...text.data, editedAt: now } });
  return row.id;
}

export async function sendTargets(db: PrismaClient, userId: string) {
  const rows = await db.connection.findMany({
    where: { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    orderBy: { respondedAt: "desc" },
    take: 30,
    select: {
      requesterId: true,
      requester: { select: personSelect },
      addressee: { select: personSelect },
      conversation: { select: { id: true, lastMessageAt: true } },
    },
  });
  return rows
    .filter((row) => row.conversation)
    .sort(
      (a, b) =>
        (b.conversation?.lastMessageAt.getTime() ?? 0) -
        (a.conversation?.lastMessageAt.getTime() ?? 0),
    )
    .map((row) => {
      const other = row.requesterId === userId ? row.addressee : row.requester;
      const profile = other.talentProfile;
      return {
        conversationId: row.conversation!.id,
        userId: other.id,
        name: other.name,
        image: other.image,
        title:
          profile?.experiences[0]?.title ||
          profile?.headline ||
          profile?.desiredJobTitles[0] ||
          null,
        company: profile?.experiences[0]?.company ?? null,
      };
    });
}

/** Today's news of the Fil for Orbi's summary: the newest posts of the last day, at most three. */
export async function feedDigest(db: PrismaClient, viewerId: string, now = new Date()) {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const items = (await listFeed(db, viewerId, "pourvous", now)).filter(
    (item) => item.createdAt >= since && !item.mine,
  );
  return items.slice(0, 3);
}

/** A notification's categories on the phone (« Tout / Candidatures / Offres / Réseau »). */
export const phoneNotificationFilters = {
  candidatures: [
    "statusChange",
    "notSelected",
    "documentRequest",
    "interviewInvite",
    "interviewConfirmed",
    "interviewReschedule",
    "interviewDeclined",
    "interviewCanceled",
    "interviewAccepted",
    "matchReviewed",
    "profileViewed",
    "diagnosticReady",
    "diagnosticReminder",
    "certificateIssued",
  ],
  offres: ["jobUnavailable"],
  reseau: [
    "newMessage",
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
} as const;
export type PhoneNotificationFilter = keyof typeof phoneNotificationFilters;

/** A score from which an offer « vous correspond » (bands « high » and « veryHigh », § 8.4). */
export const GOOD_MATCH = 70;

/**
 * Offers published in the last day that match the person well, best first: Orbi's card of the
 * Fil (« 3 offres publiées ce matin vous correspondent »). Empty when the score is off or the
 * profile has no skills: Orbi says nothing then.
 */
export async function freshMatches(db: PrismaClient, userId: string, now = new Date()) {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const jobs = await db.job.findMany({
    where: {
      status: "published",
      publishedAt: { gte: since },
      OR: [{ closesAt: null }, { closesAt: { gte: now } }],
    },
    orderBy: { publishedAt: "desc" },
    take: 40,
    select: {
      id: true,
      slug: true,
      title: true,
      city: true,
      organization: { select: { name: true } },
    },
  });
  if (jobs.length === 0) return [];
  const matches = await matchesForUser(
    db,
    userId,
    jobs.map((job) => job.id),
    now,
  );
  return jobs
    .flatMap((job) => {
      const match = matches.get(job.id);
      return match?.state === "ok" && match.explanation.score >= GOOD_MATCH
        ? [{ ...job, score: match.explanation.score }]
        : [];
    })
    .sort((a, b) => b.score - a.score);
}

/** Organizations with the most offers open right now (« Quelles entreprises recrutent ? »). */
export async function hiringOrganizations(db: PrismaClient, now = new Date(), take = 3) {
  const rows = await db.job.groupBy({
    by: ["organizationId"],
    where: { status: "published", OR: [{ closesAt: null }, { closesAt: { gte: now } }] },
    _count: { _all: true },
    orderBy: { _count: { organizationId: "desc" } },
    take,
  });
  const orgs = await db.organization.findMany({
    where: { id: { in: rows.map((row) => row.organizationId) }, suspendedAt: null },
    select: { id: true, slug: true, name: true, logo: true },
  });
  return rows.flatMap((row) => {
    const org = orgs.find((item) => item.id === row.organizationId);
    return org ? [{ ...org, offers: row._count._all }] : [];
  });
}

/**
 * People and organizations who published in the Fil lately and whom the viewer neither follows
 * nor is connected to (« Qui suivre ? »): the most active first.
 */
export async function whoToFollow(db: PrismaClient, viewerId: string, now = new Date(), take = 3) {
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [{ connected, blocked }, follows] = await Promise.all([
    circle(db, viewerId),
    db.feedFollow.findMany({
      where: { followerId: viewerId },
      select: { userId: true, organizationId: true },
    }),
  ]);
  const known = new Set([
    viewerId,
    ...connected,
    ...blocked,
    ...follows.flatMap((row) => [row.userId, row.organizationId].filter(Boolean) as string[]),
  ]);
  const rows = await db.feedPost.findMany({
    where: { parentId: null, hiddenAt: null, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: postSelect,
  });
  const seen = new Map<string, { author: FeedAuthor; posts: number }>();
  for (const row of rows) {
    const key = row.organizationId ?? row.authorId ?? "";
    if (!key || known.has(key)) continue;
    const entry = seen.get(key) ?? { author: authorOf(row), posts: 0 };
    entry.posts += 1;
    seen.set(key, entry);
  }
  return [...seen.values()].sort((a, b) => b.posts - a.posts).slice(0, take);
}

/** The person's latest attestation, for « Écrire une publication sur mon attestation ». */
export async function latestCertificate(db: PrismaClient, userId: string) {
  return db.certificate.findFirst({
    where: { enrollment: { userId }, revokedAt: null },
    orderBy: { issuedAt: "desc" },
    select: { id: true, courseTitle: true, issuedAt: true },
  });
}

/** Every post a person wrote, in their name or in their company's, most recent first. */
export async function ownPosts(db: PrismaClient, userId: string, now = new Date(), take = 500) {
  const rows = await db.feedPost.findMany({
    where: { parentId: null, authorId: userId, hiddenAt: null },
    orderBy: { createdAt: "desc" },
    take,
    select: postSelect,
  });
  const { connected } = await circle(db, userId);
  return toItems(db, userId, rows, connected, now);
}

/** The posts of one person (in their own name) or of one organization, most recent first. */
export async function authorFeed(
  db: PrismaClient,
  viewerId: string,
  author: { userId: string } | { organizationId: string },
  now = new Date(),
  /** « Mes publications » reaches every post, however old (Ephraïm, 27/10/2026). */
  take = PAGE,
): Promise<FeedItem[]> {
  const { connected, blocked } = await circle(db, viewerId);
  if ("userId" in author && blocked.includes(author.userId)) return [];
  const rows = await db.feedPost.findMany({
    where: {
      parentId: null,
      hiddenAt: null,
      ...("userId" in author
        ? { authorId: author.userId, organizationId: null }
        : { organizationId: author.organizationId }),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: postSelect,
  });
  return toItems(db, viewerId, rows, connected, now, blocked);
}

/** Who a person is, as the Fil shows them (null for someone blocked or unknown). */
export async function personAuthor(db: PrismaClient, viewerId: string, userId: string) {
  const { blocked, connected } = await circle(db, viewerId);
  if (blocked.includes(userId)) return null;
  const user = await db.user.findUnique({ where: { id: userId }, select: personSelect });
  if (!user) return null;
  const profile = user.talentProfile;
  const author: FeedAuthor = {
    kind: "person",
    id: user.id,
    name: user.name,
    image: user.image,
    title:
      profile?.experiences[0]?.title || profile?.headline || profile?.desiredJobTitles[0] || null,
    company: profile?.experiences[0]?.company ?? null,
    sector: null,
    city: null,
    offers: 0,
  };
  const conversation = connected.includes(userId)
    ? await db.conversation.findFirst({
        where: {
          kind: "peer",
          connection: {
            status: "accepted",
            OR: [
              { requesterId: viewerId, addresseeId: userId },
              { requesterId: userId, addresseeId: viewerId },
            ],
          },
        },
        select: { id: true },
      })
    : null;
  return { author, conversationId: conversation?.id ?? null };
}

/** Who an organization is, as the Fil shows it, with its open offers. */
export async function organizationAuthor(db: PrismaClient, slug: string, now = new Date()) {
  const org = await db.organization.findFirst({
    where: { slug, suspendedAt: null },
    select: {
      ...orgSelect,
      jobs: {
        where: { status: "published", OR: [{ closesAt: null }, { closesAt: { gte: now } }] },
        orderBy: { publishedAt: "desc" },
        take: 10,
        select: { slug: true, title: true, city: true, contractType: true, remote: true },
      },
    },
  });
  if (!org) return null;
  const author: FeedAuthor = {
    kind: "org",
    id: org.slug,
    name: org.name,
    image: org.logo,
    title: null,
    company: null,
    sector: org.sector,
    city: org.city,
    offers: org._count.jobs,
    verified: Boolean(org.verifiedAt),
  };
  return { id: org.id, author, jobs: org.jobs };
}

/**
 * « Rechercher dans · Publications » of the recruiter's Fil (Modèle B recruteur, M3): the posts
 * whose text holds the words, newest first, never a reply, a hidden post or one of a blocked person.
 */
export async function searchPosts(db: PrismaClient, viewerId: string, query: string, take = 6) {
  const words = query.trim().slice(0, 100);
  if (!words) return [];
  const { blocked } = await circle(db, viewerId);
  const rows = await db.feedPost.findMany({
    where: {
      parentId: null,
      hiddenAt: null,
      OR: [
        { title: { contains: words, mode: "insensitive" } },
        { body: { contains: words, mode: "insensitive" } },
      ],
      NOT: blocked.length > 0 ? [{ authorId: { in: blocked }, organizationId: null }] : [],
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      body: true,
      author: { select: { name: true } },
      organization: { select: { name: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    body: row.title ? `${row.title} · ${row.body}`.replace(/ · $/, "") : row.body,
    by: row.organization?.name ?? row.author?.name ?? "",
  }));
}
