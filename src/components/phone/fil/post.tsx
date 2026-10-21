"use client";

/* eslint-disable @next/next/no-img-element -- photos of the Fil: small, already reduced */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { likePostAction, participateAction } from "@/server/actions/feed";
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
export function PostMedia({ post, big = false }: { post: PostView; big?: boolean }) {
  return (
    <>
      {post.image ? (
        <img className="nb-fil-img" data-grand={big ? "" : undefined} src={post.image.src} alt={post.image.alt} loading="lazy" />
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

/** A post in a list of the Fil (façon Threads): the avatar on the left, the rest beside it. */
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
      <Link href={post.author.href} className="nb-fil-gauche" aria-label={t("profile")} tabIndex={-1}>
        <FilAvatar {...post.author} />
      </Link>
      <div className="nb-fil-droite">
        <div className="nb-fil-tete">
          <Link href={post.author.href} id={`p-${post.id}`} className="nb-fil-nom">
            {post.author.name}
          </Link>
          {post.tag ? (
            <span className="nb-tg" data-ton={post.tag.tone}>
              {post.tag.text}
            </span>
          ) : null}
          <span className="nb-meta nb-fil-quand">{post.ago}</span>
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
        <Link href={href} className="nb-fil-texte">
          {post.body ? <p>{post.body}</p> : null}
        </Link>
        <PostMedia post={post} />
        <PostActions post={post} onReshare={() => onSheet(post, "reshare")} replyHref={href} />
        {post.firstReply ? (
          <Link href={href} className="nb-fil-rep1">
            <FilAvatar {...post.firstReply} size={22} />
            <span>
              <b>{post.firstReply.name}</b> {post.firstReply.body}
            </span>
          </Link>
        ) : null}
        {post.replies > 1 ? (
          <Link href={href} className="nb-fil-voir">
            {t("seeReplies", { count: post.replies })}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
