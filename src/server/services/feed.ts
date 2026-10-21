/**
 * Le Fil (Modèle B, lot B3, docs/modele-b rangées 05-06): posts of people and organizations,
 * answers, J'aime, Republier, Citer, Enregistrer, « Ne plus voir ce type de publication »,
 * events and reports. Every post is visible to every signed-in talent; a blocked connection
 * hides each other's posts. Nothing here ranks people: « Pour vous » is the most recent first.
 */
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { FeedPostKind, Prisma, PrismaClient } from "@/generated/prisma/client";
import { matchesForUser } from "@/server/matching/service";
import { photoType } from "./profile-photo";
import { notify } from "./notifications";

export const FEED_TABS = ["pourvous", "abonnements", "entreprises"] as const;
export type FeedTab = (typeof FEED_TABS)[number];

/** A post or an answer: at most this many characters. */
export const FEED_BODY_MAX = 2000;
/** A photo reduced on the phone stays far below this. */
export const FEED_IMAGE_MAX = 1_000_000;
const IMAGE_PREFIX = "/api/fil/image/";
const PAGE = 30;

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
  _count: { select: { jobs: { where: { status: "published" } } } },
} satisfies Prisma.OrganizationSelect;

const postSelect = {
  id: true,
  kind: true,
  body: true,
  imageUrl: true,
  imageAlt: true,
  attachment: true,
  replyPolicy: true,
  eventAt: true,
  createdAt: true,
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
  replies: number;
  reposts: number;
  reposted: boolean;
  saved: boolean;
  mine: boolean;
  /** The first answer, shown under the post in the Fil. */
  firstReply: { name: string; org: boolean; image: string | null; body: string } | null;
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
    city: null,
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
): Promise<FeedItem[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const jobIds = [
    ...new Set(rows.flatMap((row) => (row.job?.status === "published" ? [row.job.id] : []))),
  ];
  const [likes, reposts, saves, going, firsts, matches] = await Promise.all([
    db.feedLike.findMany({
      where: { userId: viewerId, postId: { in: ids } },
      select: { postId: true },
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
    db.feedPost.findMany({
      where: { parentId: { in: ids }, hiddenAt: null },
      orderBy: { createdAt: "asc" },
      distinct: ["parentId"],
      select: {
        parentId: true,
        body: true,
        author: { select: { name: true, image: true } },
        organization: { select: { name: true, logo: true } },
      },
    }),
    jobIds.length > 0 ? matchesForUser(db, viewerId, jobIds, now) : new Map(),
  ]);
  const has = (list: { postId: string }[], id: string) => list.some((row) => row.postId === id);
  return rows.map((row) => {
    const first = firsts.find((reply) => reply.parentId === row.id);
    const match = row.job ? matches.get(row.job.id) : undefined;
    const quoted = row.quoted && !row.quoted.hiddenAt ? row.quoted : null;
    return {
      id: row.id,
      kind: row.kind,
      type: feedTypeOf(row),
      author: authorOf(row),
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
      replies: row._count.replies,
      reposts: row._count.reposts,
      reposted: has(reposts, row.id),
      saved: has(saves, row.id),
      mine: row.authorId === viewerId && !row.organizationId,
      firstReply: first
        ? {
            name: first.organization?.name ?? first.author?.name ?? "",
            org: Boolean(first.organization),
            image: first.organization?.logo ?? first.author?.image ?? null,
            body: first.body,
          }
        : null,
      canReply: mayReply(row, viewerId, connected),
      replyPolicy: row.replyPolicy,
    };
  });
}

/**
 * One tab of the Fil, most recent first: « Pour vous » (everything), « Abonnements » (people and
 * organizations followed, connections, and the viewer's own posts), « Entreprises ».
 */
export async function listFeed(
  db: PrismaClient,
  viewerId: string,
  tab: FeedTab,
  now = new Date(),
): Promise<FeedItem[]> {
  const [{ connected, blocked }, hidden, follows] = await Promise.all([
    circle(db, viewerId),
    db.feedHiddenType.findMany({ where: { userId: viewerId }, select: { type: true } }),
    db.feedFollow.findMany({
      where: { followerId: viewerId },
      select: { userId: true, organizationId: true },
    }),
  ]);
  const hiddenTypes = hidden.map((row) => row.type);
  const hiddenKinds = hiddenTypes.filter((type): type is FeedPostKind => type !== "company");
  const where: Prisma.FeedPostWhereInput = {
    parentId: null,
    hiddenAt: null,
    NOT: [
      ...(blocked.length > 0 ? [{ authorId: { in: blocked }, organizationId: null }] : []),
      ...(hiddenTypes.includes("company") ? [{ organizationId: { not: null } }] : []),
      ...(hiddenKinds.length > 0 ? [{ kind: { in: hiddenKinds }, organizationId: null }] : []),
    ],
  };
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
    take: PAGE,
    select: postSelect,
  });
  return toItems(db, viewerId, rows, connected, now);
}

export type FeedReply = {
  id: string;
  author: FeedAuthor;
  body: string;
  createdAt: Date;
  likes: number;
  liked: boolean;
  mine: boolean;
};

/** A post and its answers (oldest first), or null when it is not visible to the viewer. */
export async function getPost(db: PrismaClient, viewerId: string, id: string, now = new Date()) {
  const { connected, blocked } = await circle(db, viewerId);
  const row = await db.feedPost.findFirst({
    where: { id, parentId: null, hiddenAt: null },
    select: postSelect,
  });
  if (!row || (row.authorId && !row.organizationId && blocked.includes(row.authorId))) return null;
  const [item] = await toItems(db, viewerId, [row], connected, now);
  const replies = await db.feedPost.findMany({
    where: {
      parentId: id,
      hiddenAt: null,
      ...(blocked.length > 0 ? { NOT: { authorId: { in: blocked }, organizationId: null } } : {}),
    },
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
    replies: replies.map((reply): FeedReply => ({
      id: reply.id,
      author: authorOf(reply),
      body: reply.body,
      createdAt: reply.createdAt,
      likes: reply._count.likes,
      liked: liked.some((like) => like.postId === reply.id),
      mine: reply.authorId === viewerId && !reply.organizationId,
    })),
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

export const newPostSchema = z
  .object({
    body: z.string().trim().max(FEED_BODY_MAX).default(""),
    attachment: z.enum(["work", "certificate"]).optional(),
    attachmentId: z.string().trim().max(60).optional(),
    quotedId: z.string().trim().max(60).optional(),
    replyPolicy: z.enum(["everyone", "connections", "nobody"]).default("everyone"),
    image: z.string().trim().max(60).optional(),
  })
  .refine((input) => input.body.length > 0 || input.attachment || input.quotedId || input.image, {
    message: "empty",
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
) {
  const parsed = newPostSchema.safeParse(raw);
  if (!parsed.success) throw new FeedError("invalid");
  const input = parsed.data;
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
      kind,
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
  body: z.string().trim().min(1).max(FEED_BODY_MAX),
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
    await notify(db, { userIds: [post.authorId], type: "feedReply", payload: { name }, href });
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

/** Deletes one of the viewer's own posts or answers, with its answers. */
export async function deletePost(db: PrismaClient, userId: string, postId: string) {
  const { count } = await db.feedPost.deleteMany({
    where: { id: postId, authorId: userId, organizationId: null },
  });
  if (count === 0) throw new FeedError("notFound");
}

/** The connections a post can be sent to (« Envoyer à »), with their conversation. */
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

/** The posts of one person (in their own name) or of one organization, most recent first. */
export async function authorFeed(
  db: PrismaClient,
  viewerId: string,
  author: { userId: string } | { organizationId: string },
  now = new Date(),
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
    take: PAGE,
    select: postSelect,
  });
  return toItems(db, viewerId, rows, connected, now);
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
  };
  return { id: org.id, author, jobs: org.jobs };
}
