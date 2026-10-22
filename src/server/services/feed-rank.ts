/**
 * Order of « Pour vous » (Ephraïm, 22/10/2026): what is professional comes first, without hiding
 * the rest. A post's score is its freshness multiplied by (1 + its boost); the boost is capped, so
 * a recent everyday post still passes an old opportunity. Deterministic, without any model, and
 * without anything the matching may not use (CLAUDE.md § 4): only what the person does on Jumanly.
 *
 * What raises a post:
 * - what it is: an offer, a new job (more when the job came through Jumanly), an event, a
 *   certificate or a piece of work, professional words in a plain post;
 * - who wrote it: someone who answers others, who comes back often, who connects with people;
 * - how it is received: J'aime, answers and reposts.
 * The same author is not shown twice in a row near the top.
 */

export type RankKind = "post" | "newRole" | "work" | "certificate" | "event";

export type RankPost = {
  id: string;
  kind: RankKind;
  body: string;
  createdAt: Date;
  authorId: string | null;
  organizationId: string | null;
  hasJob: boolean;
  likes: number;
  replies: number;
  reposts: number;
};

/** What each author did on Jumanly lately (30 days, connections: all accepted). */
export type AuthorSignals = {
  /** Answers written under others' posts. */
  replies: number;
  /** Distinct days with an activity (a post, an answer, a J'aime). */
  activeDays: number;
  /** Accepted connections. */
  connections: number;
  /** Hired through an application on Jumanly in the last 120 days. */
  hiredHere: boolean;
};

/** Freshness: halves every day or so (e^(-age/36 h)). */
const FRESH_HOURS = 36;
/** The whole boost never exceeds this: being professional helps, it does not decide everything. */
export const BOOST_MAX = 3;
/** A post of the viewer, just published, is shown on top during this time. */
const OWN_FRESH_MS = 10 * 60_000;
/** Each further post of the same author near the top counts this much less. */
const REPEAT = 0.6;

/** Words of working life in a plain post (French; accents ignored). */
const PRO_WORDS = [
  "offre",
  "emploi",
  "recrut",
  "poste",
  "stage",
  "opportunit",
  "candidat",
  "embauch",
  "entretien",
  "formation",
  "certifi",
  "diplom",
  "competence",
  "conference",
  "atelier",
  "webinaire",
  "salon",
  "seminaire",
  "carriere",
  "mission",
  "projet",
  "promotion",
  "reseau",
  "entreprise",
  "freelance",
  "cdi",
  "cdd",
];

const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function professionalText(body: string) {
  const words = fold(body);
  return PRO_WORDS.some((word) => new RegExp(`\\b${word}`).test(words));
}

const log2 = (n: number) => Math.log2(1 + Math.max(0, n));

/** What the post is. */
function kindBoost(post: RankPost, author: AuthorSignals | undefined) {
  if (post.hasJob) return 1.5;
  switch (post.kind) {
    case "newRole":
      return author?.hiredHere ? 1.5 : 0.9;
    case "event":
      return 0.8;
    case "certificate":
    case "work":
      return 0.6;
    default:
      if (post.organizationId) return 0.4;
      return professionalText(post.body) ? 0.4 : 0;
  }
}

/** Who wrote it. */
function authorBoost(author: AuthorSignals | undefined) {
  if (!author) return 0;
  const answers = Math.min(0.5, 0.1 * author.replies);
  const regular = 0.5 * Math.min(1, author.activeDays / 20);
  const people = Math.min(0.6, 0.15 * log2(author.connections));
  return answers + regular + people;
}

/** How it is received. */
function engagementBoost(post: RankPost) {
  return Math.min(0.5, 0.1 * log2(post.likes + 2 * post.replies + post.reposts));
}

export function postScore(post: RankPost, author: AuthorSignals | undefined, now: Date) {
  const hours = Math.max(0, now.getTime() - post.createdAt.getTime()) / 3_600_000;
  const fresh = Math.exp(-hours / FRESH_HOURS);
  const boost = Math.min(
    BOOST_MAX,
    kindBoost(post, author) + authorBoost(author) + engagementBoost(post),
  );
  return fresh * (1 + boost);
}

/**
 * The posts in the order of « Pour vous ». `authors` gives each person's signals (posts of an
 * organization have none). The viewer's own post of the last minutes comes first.
 */
export function rankFeed<T extends RankPost>(
  posts: T[],
  authors: Map<string, AuthorSignals>,
  viewerId: string,
  now: Date,
): T[] {
  const scored = posts.map((post) => {
    const own =
      post.authorId === viewerId &&
      !post.organizationId &&
      now.getTime() - post.createdAt.getTime() < OWN_FRESH_MS;
    const author = post.authorId && !post.organizationId ? authors.get(post.authorId) : undefined;
    return { post, own, score: postScore(post, author, now) };
  });
  scored.sort(
    (a, b) =>
      Number(b.own) - Number(a.own) ||
      b.score - a.score ||
      b.post.createdAt.getTime() - a.post.createdAt.getTime() ||
      a.post.id.localeCompare(b.post.id),
  );
  // Variety: each further post of the same author counts less, then the order is made again.
  const seen = new Map<string, number>();
  const spread = scored.map((item) => {
    const key = item.post.organizationId ?? item.post.authorId ?? item.post.id;
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    return { ...item, score: item.score * REPEAT ** count };
  });
  spread.sort(
    (a, b) =>
      Number(b.own) - Number(a.own) ||
      b.score - a.score ||
      b.post.createdAt.getTime() - a.post.createdAt.getTime() ||
      a.post.id.localeCompare(b.post.id),
  );
  return spread.map((item) => item.post);
}
