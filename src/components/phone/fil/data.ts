import "server-only";
import { getFormatter, getTranslations } from "next-intl/server";
import type { FeedAuthor, FeedItem, FeedReply } from "@/server/services/feed";

/**
 * What the screens of the Fil show, with every text already written on the server (times
 * included), so that the phone and the server agree on each word.
 */
export type AuthorView = {
  name: string;
  initials: string;
  image: string | null;
  /** Colour of the initials (one per person or organization, always the same). */
  tone: number;
  org: boolean;
  href: string;
  /** « Analyste crédit · Fleuve Banque », « Fintech · Kinshasa · 8 offres ». */
  line: string;
  /** Under the name of a post: « Entreprise · Kinshasa », « Analyste crédit · Fleuve Banque ». */
  byline: string;
  /** A company verified by Jumanly: a Lime ring. */
  verified: boolean;
  /** The city, beside the time of a post. */
  city: string | null;
};

export type PostView = {
  id: string;
  /** Unique in a list: a post and someone's repost of it are two lines. */
  key: string;
  href: string;
  type: string;
  author: AuthorView;
  tag: { text: string; tone: string } | null;
  ago: string;
  stamp: string;
  /** The hook line (docs/fil-menu-publication § 2); none on the older posts. */
  title: string | null;
  body: string;
  image: { src: string; alt: string } | null;
  job: {
    href: string;
    title: string;
    line: string;
    score: string | null;
    /** The offer's poster (no photo): salary, first skills, then Postuler · Voir · PDF. */
    salary: string | null;
    skills: string[];
    /** « Candidatures jusqu'au 30 novembre 2026 ». */
    closes: string | null;
    applyHref: string | null;
    sheetHref: string;
  } | null;
  attachment: { mark: string; title: string; detail: string; tone: string } | null;
  /** « Republier avec une note »: the original post, with its author, under the note. */
  quoted: {
    id: string;
    href: string;
    name: string;
    author: AuthorView;
    ago: string;
    title: string | null;
    body: string;
    image: { src: string; alt: string } | null;
  } | null;
  event: { participants: number; going: boolean } | null;
  likes: number;
  liked: boolean;
  /** Two faces beside the count of J'aime. */
  likers: { initials: string; image: string | null; tone: number }[];
  replies: number;
  reposts: number;
  reposted: boolean;
  /** « Republier » without a note: « Grace a republié » above the original author. */
  repostedBy: { name: string; href: string; mine: boolean; ago: string } | null;
  saved: boolean;
  mine: boolean;
  canReply: boolean;
  closedNote: string | null;
  /** The last comments, shown under the post in the Fil. */
  comments: ReplyView[];
  edited: boolean;
};

export type ReplyView = {
  id: string;
  author: AuthorView;
  ago: string;
  body: string;
  likes: number;
  liked: boolean;
  mine: boolean;
  edited: boolean;
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function initialsOf(name: string) {
  const words = name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter((word) => /\p{L}/u.test(word));
  return (
    words
      .slice(0, 2)
      .map((word) => word.match(/\p{L}/u)?.[0] ?? "")
      .join("")
      .toUpperCase() || "J"
  );
}

/** Seven colours of initials for people, three for organizations (planche Fil). */
export function toneOf(key: string, org: boolean) {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return org ? hash % 3 : hash % 6;
}

/** The demo organizations carry « (entreprise fictive) » in their name: the Fil shows it plainly. */
export function shortName(name: string) {
  return name.replace(/\s*\((?:entreprise )?fictive?\)\s*$/i, "").trim() || name;
}

export async function feedWords(viewerId: string, now = new Date()) {
  const t = await getTranslations("phoneFil");
  const format = await getFormatter();
  const time = (date: Date) =>
    format.dateTime(date, { hour: "numeric", minute: "2-digit" }).replace(":", " h ");
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const ago = (date: Date) => {
    const spent = now.getTime() - date.getTime();
    if (spent < MINUTE) return t("time.now");
    if (spent < HOUR) return t("time.minutes", { count: Math.floor(spent / MINUTE) });
    if (spent < DAY) return t("time.hours", { count: Math.floor(spent / HOUR) });
    if (spent < 2 * DAY) return t("time.yesterday");
    if (spent < 7 * DAY) return t("time.days", { count: Math.floor(spent / DAY) });
    return format.dateTime(date, { day: "numeric", month: "short" });
  };
  const stamp = (date: Date) => {
    if (date >= startOfDay) return t("stamp.today", { time: time(date) });
    if (date.getTime() >= startOfDay.getTime() - DAY)
      return t("stamp.yesterday", { time: time(date) });
    if (date.getTime() >= startOfDay.getTime() - 6 * DAY) {
      const day = format.dateTime(date, { weekday: "long" });
      return t("stamp.week", { day: day.charAt(0).toUpperCase() + day.slice(1), time: time(date) });
    }
    return t("stamp.date", {
      date: format.dateTime(date, { day: "numeric", month: "long" }),
      time: time(date),
    });
  };

  const author = (value: FeedAuthor): AuthorView => {
    const org = value.kind === "org";
    const name = org ? shortName(value.name) : value.name;
    const line = org
      ? [
          value.sector,
          value.city,
          value.offers > 0 ? t("orbi.companyLine", { count: value.offers }) : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : value.title && value.company
        ? t("person.line", { title: value.title, company: shortName(value.company) })
        : (value.title ?? (value.company ? shortName(value.company) : ""));
    return {
      name,
      initials: initialsOf(name),
      image: value.image,
      tone: toneOf(name, org),
      org,
      href:
        !org && value.id === viewerId
          ? "/app/career/cv"
          : org
            ? `/app/entreprises/${value.id}`
            : `/app/personnes/${value.id}`,
      line,
      byline: org ? [t("tag.company"), value.city].filter(Boolean).join(" · ") : line,
      verified: org && Boolean(value.verified),
      city: value.city,
    };
  };

  const tags: Record<string, { key: string; tone: string }> = {
    company: { key: "tag.company", tone: "entreprise" },
    newRole: { key: "tag.newRole", tone: "poste" },
    work: { key: "tag.work", tone: "realisation" },
    certificate: { key: "tag.certificate", tone: "menthe" },
  };

  const post = (item: FeedItem): PostView => {
    const view = author(item.author);
    const tag = tags[item.type];
    const contract = (value: string) =>
      t.has(`contract.${value}` as "contract.cdi")
        ? t(`contract.${value}` as "contract.cdi")
        : value;
    const remote = (value: string) =>
      t.has(`remote.${value}` as "remote.hybrid") ? t(`remote.${value}` as "remote.hybrid") : value;
    const quotedAuthor = item.quoted ? author(item.quoted.author) : null;
    return {
      id: item.id,
      key: item.repostedBy ? `${item.id}-r-${item.repostedBy.id}` : item.id,
      href: `/app/fil/${item.id}`,
      type: item.type,
      author: view,
      tag: tag ? { text: t(tag.key as "tag.company"), tone: tag.tone } : null,
      ago: ago(item.createdAt),
      stamp: stamp(item.createdAt),
      title: item.title,
      body: item.body,
      image: item.imageUrl
        ? { src: item.imageUrl, alt: item.imageAlt ?? t("publish.photoAlt", { name: view.name }) }
        : null,
      job: item.job
        ? {
            href: `/app/jobs/${item.job.slug}`,
            title: item.job.title,
            line: t("offerLine", {
              city: item.job.city,
              contract: contract(item.job.contractType),
              remote: remote(item.job.remote),
            }),
            score: item.job.score === null ? null : t("score", { score: item.job.score }),
            salary: item.job.salary
              ? item.job.salary.max === null || item.job.salary.max === item.job.salary.min
                ? t("offerSalaryFrom", { min: item.job.salary.min })
                : t("offerSalary", { min: item.job.salary.min, max: item.job.salary.max })
              : null,
            skills: item.job.skills,
            closes: item.job.closesAt
              ? t("poster.closesAt", { date: new Date(item.job.closesAt) })
              : null,
            applyHref: item.job.open ? `/app/jobs/${item.job.slug}/postuler` : null,
            sheetHref: `/api/offres/${item.job.slug}/fiche`,
          }
        : null,
      attachment: item.attachment
        ? {
            mark:
              item.attachment.type === "certificate"
                ? initialsOf(item.attachment.title).slice(0, 3)
                : "PF",
            title: item.attachment.title,
            detail: item.attachment.detail,
            tone: item.attachment.type,
          }
        : null,
      quoted:
        item.quoted && quotedAuthor
          ? {
              id: item.quoted.id,
              href: `/app/fil/${item.quoted.id}`,
              name: shortName(item.quoted.name),
              author: quotedAuthor,
              ago: ago(item.quoted.createdAt),
              title: item.quoted.title,
              body: item.quoted.body,
              image: item.quoted.imageUrl
                ? {
                    src: item.quoted.imageUrl,
                    alt: item.quoted.imageAlt ?? t("publish.photoAlt", { name: quotedAuthor.name }),
                  }
                : null,
            }
          : null,
      event: item.event ? { participants: item.event.participants, going: item.event.going } : null,
      likes: item.likes,
      liked: item.liked,
      likers: item.likers.map((liker) => ({
        initials: initialsOf(liker.name),
        image: liker.image,
        tone: toneOf(liker.name, false),
      })),
      replies: item.replies,
      reposts: item.reposts,
      reposted: item.reposted,
      repostedBy: item.repostedBy
        ? {
            name: item.repostedBy.name,
            href:
              item.repostedBy.id === viewerId
                ? "/app/career/cv"
                : `/app/personnes/${item.repostedBy.id}`,
            mine: item.repostedBy.id === viewerId,
            ago: ago(item.repostedBy.at),
          }
        : null,
      saved: item.saved,
      mine: item.mine,
      canReply: item.canReply,
      closedNote: item.canReply
        ? null
        : t(
            item.replyPolicy === "connections"
              ? "detail.closed.connections"
              : "detail.closed.nobody",
            {
              name: view.name.split(" ")[0] ?? view.name,
            },
          ),
      comments: item.comments.map(reply),
      edited: item.edited,
    };
  };

  const reply = (item: FeedReply): ReplyView => ({
    id: item.id,
    author: author(item.author),
    ago: ago(item.createdAt),
    body: item.body,
    likes: item.likes,
    liked: item.liked,
    mine: item.mine,
    edited: item.edited,
  });

  return { t, format, ago, stamp, author, post, reply };
}

/** What the offer poster shows (Fil, and « Offres pour vous » of Explorer). */
export type PosterView = Pick<
  NonNullable<PostView["job"]>,
  "href" | "title" | "line" | "score" | "salary" | "skills" | "closes"
>;
