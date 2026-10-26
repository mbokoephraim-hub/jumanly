"use client";

/* eslint-disable @next/next/no-img-element -- photos of the Fil: small, already reduced */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { likePostAction, participateAction, savePostAction } from "@/server/actions/feed";
import { PhoneIcon } from "../icon";
import { FilAvatar } from "./avatar";
import type { PostView } from "./data";

export type PostSheet = "menu" | "report" | "reshare" | "send";

/** The tag line of an attachment: a work of the portfolio, or an attestation. */
export function Attachment({ value }: { value: NonNullable<PostView["attachment"]> }) {
  return (
    <span className="nb-fil-pj">
      <span className="nb-fil-pj-mark" data-ton={value.tone}>
        {value.mark}
      </span>
      <span>
        <b>{value.title}</b>
        <small>{value.detail}</small>
      </span>
    </span>
  );
}

/** What hangs under the text: the photo, the offer, the attachment, the quoted post. */
export function PostMedia({
  post,
  big = false,
  withImage = true,
}: {
  post: PostView;
  big?: boolean;
  /** The Fil's card draws the photo itself, with its notch. */
  withImage?: boolean;
}) {
  return (
    <>
      {withImage && post.image ? (
        <img
          className="nb-fil-img"
          data-grand={big ? "" : undefined}
          src={post.image.src}
          alt={post.image.alt}
          loading="lazy"
        />
      ) : null}
      {post.job ? (
        <Link href={post.job.href} className="nb-fil-offre">
          <span>
            <b>{post.job.title}</b>
            <small>{post.job.line}</small>
          </span>
          {post.job.score ? <span className="nb-fil-score">{post.job.score}</span> : null}
        </Link>
      ) : null}
      {post.attachment ? <Attachment value={post.attachment} /> : null}
      {post.quoted ? (
        <Link href={post.quoted.href} className="nb-fil-cite">
          <b>{post.quoted.name}</b>
          <span>{post.quoted.body}</span>
        </Link>
      ) : null}
      {post.event ? <EventRow id={post.id} event={post.event} /> : null}
    </>
  );
}

function EventRow({ id, event }: { id: string; event: NonNullable<PostView["event"]> }) {
  const t = useTranslations("phoneFil");
  const [shown, set] = useOptimistic(event);
  const [, start] = useTransition();
  return (
    <span className="nb-fil-event">
      <button
        type="button"
        className="nb-fil-part"
        aria-pressed={shown.going}
        onClick={() =>
          start(async () => {
            const going = !shown.going;
            set({ going, participants: shown.participants + (going ? 1 : -1) });
            const result = await participateAction(id);
            showToast({
              message: result.ok
                ? t(result.value ? "event.registeredToast" : "event.canceledToast")
                : t("toast.error"),
            });
          })
        }
      >
        {shown.going ? t("event.registered") : t("event.going")}
      </button>
      <span className="nb-meta">{t("event.participants", { count: shown.participants })}</span>
    </span>
  );
}

/** J'aime · Répondre · Republier, with their counts. */
export function PostActions({
  post,
  onReshare,
  replyHref,
}: {
  post: PostView;
  onReshare: () => void;
  /** Where « Répondre » leads (the publication); on its own page, the field below. */
  replyHref?: string;
}) {
  const t = useTranslations("phoneFil");
  const [shown, set] = useOptimistic({ liked: post.liked, likes: post.likes });
  const [, start] = useTransition();
  const like = () =>
    start(async () => {
      set({ liked: !shown.liked, likes: shown.likes + (shown.liked ? -1 : 1) });
      const result = await likePostAction(post.id);
      if (!result.ok) showToast({ message: t("toast.error"), tone: "error" });
    });
  return (
    <div className="nb-fil-actions">
      <button
        type="button"
        onClick={like}
        aria-pressed={shown.liked}
        aria-label={t("likeCount", { count: shown.likes })}
        data-on={shown.liked ? "" : undefined}
      >
        <PhoneIcon name="jaime" size={20} fill={shown.liked ? "currentColor" : undefined} />
        <span aria-hidden>{shown.likes}</span>
      </button>
      {replyHref ? (
        <Link href={replyHref} aria-label={t("replyCount", { count: post.replies })}>
          <PhoneIcon name="repondre" size={20} />
          <span aria-hidden>{post.replies}</span>
        </Link>
      ) : (
        <span className="nb-fil-nb">
          <PhoneIcon name="repondre" size={20} />
          <span>{t("detail.replies", { count: post.replies })}</span>
        </span>
      )}
      <button
        type="button"
        onClick={onReshare}
        aria-haspopup="dialog"
        aria-label={t("repostCount", { count: post.reposts })}
        data-on={post.reposted ? "" : undefined}
      >
        <PhoneIcon name="republier" size={20} />
        <span aria-hidden>{post.reposts}</span>
      </button>
    </div>
  );
}

/** J'aime · Commenter · Envoyer · Enregistrer: in the notch of the photo, or under the text. */
function CardActions({
  post,
  href,
  onSheet,
}: {
  post: PostView;
  href: string;
  onSheet: (post: PostView, sheet: PostSheet) => void;
}) {
  const t = useTranslations("phoneFil");
  const [shown, set] = useOptimistic({
    liked: post.liked,
    likes: post.likes,
    saved: post.saved,
  });
  const [, start] = useTransition();
  const like = () =>
    start(async () => {
      set({ ...shown, liked: !shown.liked, likes: shown.likes + (shown.liked ? -1 : 1) });
      const result = await likePostAction(post.id);
      if (!result.ok) showToast({ message: t("toast.error"), tone: "error" });
    });
  const save = () =>
    start(async () => {
      set({ ...shown, saved: !shown.saved });
      const result = await savePostAction(post.id);
      showToast(
        result.ok
          ? { message: t(result.value ? "toast.saved" : "toast.unsaved") }
          : { message: t("toast.error"), tone: "error" },
      );
    });
  return (
    <>
      <button
        type="button"
        className="nb-fil-ab"
        onClick={like}
        aria-pressed={shown.liked}
        aria-label={t("likeCount", { count: shown.likes })}
        data-on={shown.liked ? "" : undefined}
      >
        <PhoneIcon
          name="jaime"
          size={25}
          stroke={1.9}
          fill={shown.liked ? "currentColor" : undefined}
        />
      </button>
      <Link
        href={href}
        className="nb-fil-ab"
        aria-label={t("commentCount", { count: post.replies })}
      >
        <PhoneIcon name="repondre" size={23} stroke={1.9} />
      </Link>
      <button
        type="button"
        className="nb-fil-ab"
        onClick={() => onSheet(post, "reshare")}
        aria-haspopup="dialog"
        aria-label={t("share")}
      >
        <PhoneIcon name="partager" size={22} stroke={1.9} />
      </button>
      <button
        type="button"
        className="nb-fil-ab"
        data-garde=""
        onClick={save}
        aria-pressed={shown.saved}
        aria-label={t("save")}
        data-on={shown.saved ? "" : undefined}
      >
        <PhoneIcon
          name="signet"
          size={20}
          stroke={1.9}
          fill={shown.saved ? "currentColor" : undefined}
        />
      </button>
    </>
  );
}

/** Two faces, a heart and the count of J'aime (bottom right of the photo). */
function Reactions({ post }: { post: PostView }) {
  const t = useTranslations("phoneFil");
  if (post.likes === 0) return null;
  return (
    <span className="nb-fil-reac" role="img" aria-label={t("reactions", { count: post.likes })}>
      {post.likers.map((liker, index) => (
        <FilAvatar key={index} {...liker} org={false} size={24} />
      ))}
      <PhoneIcon name="jaime" size={13} stroke={0} fill="#FF6B6B" />
      <span aria-hidden>{post.likes}</span>
    </span>
  );
}

/**
 * A post in a list of the Fil (docs/fil-menu-publication § 2): the author on top (avatar 44, a
 * Lime ring when the company is verified, name, line and time, « ··· »), then, aligned on the
 * name: the title (two lines), the text, and the photo with its notch for J'aime · Commenter ·
 * Envoyer · Enregistrer and the reactions on the right. Nothing else on the photo. Without a
 * photo, the actions come under the text.
 */
export function PostCard({
  post,
  onSheet,
  from,
}: {
  post: PostView;
  onSheet: (post: PostView, sheet: PostSheet) => void;
  /** Where the publication's page comes back to (« Fil », a profile…). */
  from?: string;
}) {
  const t = useTranslations("phoneFil");
  const href = from ? `${post.href}?de=${from}` : post.href;
  return (
    <article className="nb-fil-post" aria-labelledby={`p-${post.id}`}>
      <div className="nb-fil-ph">
        <Link
          href={post.author.href}
          className="nb-fil-anneau"
          data-verifie={post.author.verified ? "" : undefined}
          aria-label={t("profile")}
          tabIndex={-1}
        >
          <FilAvatar {...post.author} size={39} />
        </Link>
        <span className="nb-fil-qui">
          <Link href={post.author.href} id={`p-${post.id}`} className="nb-fil-nom">
            {post.author.name}
            {post.author.verified ? (
              <svg width="15" height="15" viewBox="0 0 24 24" role="img" aria-label={t("verified")}>
                <path
                  d="M12 2.5l2.4 1.8 3-.1.9 2.8 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-.9 2.8-3-.1L12 21.5l-2.4-1.8-3 .1-.9-2.8-2.4-1.8.9-2.9-.9-2.9 2.4-1.8.9-2.8 3 .1z"
                  fill="#A6F26B"
                />
                <path
                  d="m8.5 12 2.4 2.4 4.6-4.8"
                  fill="none"
                  stroke="#0B1A1F"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </Link>
          <small className="nb-fil-ligne">
            {[post.author.byline, post.ago].filter(Boolean).join(" · ")}
          </small>
        </span>
        <button
          type="button"
          className="nb-fil-plus"
          aria-label={t("more")}
          aria-haspopup="dialog"
          onClick={() => onSheet(post, "menu")}
        >
          <PhoneIcon name="plusOptions" size={20} />
        </button>
      </div>
      <div className="nb-fil-pb">
        {post.title ? (
          <h2 className="nb-fil-titre">
            <Link href={href}>{post.title}</Link>
          </h2>
        ) : null}
        {post.body ? (
          <Link href={href} className="nb-fil-texte">
            <p>{post.body}</p>
          </Link>
        ) : null}
        <PostMedia post={post} withImage={false} />
        {post.image ? (
          <div className="nb-fil-im">
            <img src={post.image.src} alt={post.image.alt} loading="lazy" />
            <Reactions post={post} />
            <i className="nb-fil-k1" aria-hidden />
            <i className="nb-fil-k2" aria-hidden />
            <div className="nb-fil-encoche">
              <CardActions post={post} href={href} onSheet={onSheet} />
            </div>
          </div>
        ) : (
          <div className="nb-fil-sous">
            <CardActions post={post} href={href} onSheet={onSheet} />
            <Reactions post={post} />
          </div>
        )}
        {post.replies > 0 ? (
          <Link href={href} className="nb-fil-voir">
            {t("comments", { count: post.replies })}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
