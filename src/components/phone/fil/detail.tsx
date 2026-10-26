"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { likePostAction, replyAction } from "@/server/actions/feed";
import { PhoneBack } from "../back";
import { PhoneIcon } from "../icon";
import { FilAvatar } from "./avatar";
import type { PostView, ReplyView } from "./data";
import type { FilMe } from "./feed";
import { PostActions, PostMedia, type PostSheet } from "./post";
import { PostSheets, type SendTarget } from "./sheets";

function ReplyRow({ reply, onAnswer }: { reply: ReplyView; onAnswer: (name: string) => void }) {
  const t = useTranslations("phoneFil");
  const [shown, set] = useOptimistic({ liked: reply.liked, likes: reply.likes });
  const [, start] = useTransition();
  return (
    <li className="nb-fil-reponse">
      <Link href={reply.author.href} tabIndex={-1} aria-hidden>
        <FilAvatar {...reply.author} size={36} />
      </Link>
      <div>
        <p className="nb-fil-tete">
          <Link href={reply.author.href} className="nb-fil-nom">
            {reply.author.name}
          </Link>
          <span className="nb-meta">{reply.ago}</span>
        </p>
        <p className="nb-fil-rep-texte">{reply.body}</p>
        <div className="nb-fil-actions" data-petit="">
          <button
            type="button"
            aria-pressed={shown.liked}
            aria-label={t("likeCount", { count: shown.likes })}
            data-on={shown.liked ? "" : undefined}
            onClick={() =>
              start(async () => {
                set({ liked: !shown.liked, likes: shown.likes + (shown.liked ? -1 : 1) });
                const result = await likePostAction(reply.id);
                if (!result.ok) showToast({ message: t("toast.error"), tone: "error" });
              })
            }
          >
            <PhoneIcon name="jaime" size={18} fill={shown.liked ? "currentColor" : undefined} />
            <span aria-hidden>{shown.likes}</span>
          </button>
          <button type="button" onClick={() => onAnswer(reply.author.name)}>
            {t("reply")}
          </button>
        </div>
      </div>
    </li>
  );
}

/**
 * A publication and its answers (planche Fil, rangées 05-06): « ‹ Fil », the post in full with its
 * date, J'aime · réponses · Republier, the answers, and the field « Répondre à … » at the bottom.
 * « Répondre » under an answer starts the text with « @Prénom Nom ».
 */
export function PostDetail({
  post,
  replies,
  me,
  back,
  targets,
}: {
  post: PostView;
  replies: ReplyView[];
  me: FilMe;
  back: { href: string; label: string };
  targets: SendTarget[];
}) {
  const t = useTranslations("phoneFil");
  const router = useRouter();
  const [sheet, setSheet] = useState<PostSheet | null>(null);
  const [text, setText] = useState("");
  const [to, setTo] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const field = useRef<HTMLInputElement>(null);
  const first = post.author.name.split(" ")[0] ?? post.author.name;

  const answer = (name: string) => {
    setTo(name);
    setText(`@${name} `);
    field.current?.focus();
  };
  const send = () => {
    const clean = text.trim();
    if (!clean || (to && clean === `@${to}`)) {
      showToast({ message: t("detail.empty"), tone: "error" });
      return;
    }
    start(async () => {
      const result = await replyAction({ post: post.id, body: clean });
      if (!result.ok) {
        showToast({ message: t("toast.error"), tone: "error" });
        return;
      }
      setText("");
      setTo(null);
      showToast({ message: t("detail.sent") });
    });
  };

  return (
    <div className="nb-page nb-fil nb-fil-detail">
      <header className="nb-barre">
        <PhoneBack fallback={back.href} label={back.label} text={back.label} />
        <h1>{t("detail.title")}</h1>
        <button
          type="button"
          className="nb-rond"
          aria-label={t("more")}
          aria-haspopup="dialog"
          onClick={() => setSheet("menu")}
        >
          <PhoneIcon name="plusOptions" size={22} />
        </button>
      </header>
      <article className="nb-fil-grand" aria-labelledby="fil-auteur">
        <div className="nb-fil-grand-tete">
          <Link href={post.author.href} tabIndex={-1} aria-hidden>
            <FilAvatar {...post.author} size={48} />
          </Link>
          <span className="nb-fil-grand-nom">
            <Link href={post.author.href} id="fil-auteur" className="nb-fil-nom">
              {post.author.name}
            </Link>
            <span className="nb-meta">{post.author.line}</span>
          </span>
          {post.mine ? null : (
            <Link href={post.author.href} className="nb-fil-profil">
              {t("detail.profile")}
            </Link>
          )}
        </div>
        {post.title ? <h2 className="nb-fil-grand-titre">{post.title}</h2> : null}
        {post.body ? <p className="nb-fil-grand-texte">{post.body}</p> : null}
        <PostMedia post={post} big />
        <p className="nb-meta nb-fil-date">{post.stamp}</p>
        <PostActions post={post} onReshare={() => setSheet("reshare")} />
      </article>
      {replies.length === 0 ? <p className="nb-vide">{t("detail.noReplies")}</p> : null}
      <ul className="nb-fil-reponses">
        {replies.map((reply) => (
          <ReplyRow key={reply.id} reply={reply} onAnswer={answer} />
        ))}
      </ul>
      <div className="nb-fil-repondre">
        {post.canReply ? (
          <>
            {to ? (
              <p className="nb-meta nb-fil-a">
                {t("detail.replyingTo", { name: to })}
                <button
                  type="button"
                  onClick={() => {
                    setTo(null);
                    setText("");
                  }}
                >
                  {t("detail.cancelReply")}
                </button>
              </p>
            ) : null}
            <form
              className="nb-champ"
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
            >
              <FilAvatar
                initials={me.initials}
                image={me.image}
                tone={0}
                org={false}
                me
                size={34}
              />
              <input
                ref={field}
                value={text}
                onChange={(event) => setText(event.target.value)}
                aria-label={t("detail.replyLabel")}
                placeholder={t("detail.replyTo", { name: to ?? first })}
                maxLength={2000}
              />
              <button type="submit" className="nb-env" disabled={pending}>
                {t("detail.send")}
              </button>
            </form>
          </>
        ) : (
          <p className="nb-meta nb-fil-ferme">{post.closedNote}</p>
        )}
      </div>
      <PostSheets
        post={post}
        sheet={sheet}
        onSheet={setSheet}
        onClose={() => setSheet(null)}
        onHidden={() => router.replace(back.href)}
        targets={targets}
      />
    </div>
  );
}
