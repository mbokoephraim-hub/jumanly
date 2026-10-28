"use client";

import "@/styles/fil-publication.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useOptimistic, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { deletePostAction, editPostAction, likePostAction } from "@/server/actions/feed";
import { FEED_REPLY_MAX } from "@/server/services/feed-limits";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { FilAvatar } from "./avatar";
import type { ReplyView } from "./data";

/**
 * A comment of the Fil: the face, the name, the time (« modifié » once changed) and the text. Its
 * author finds « ··· » to change or delete it. On the publication's page, J'aime and Répondre
 * come under the text; in the Fil, the comment stays short.
 */
export function FilComment({
  reply,
  onAnswer,
  compact = false,
}: {
  reply: ReplyView;
  onAnswer?: (name: string) => void;
  compact?: boolean;
}) {
  const t = useTranslations("phoneFil");
  const tc = useTranslations("phone");
  const [shown, set] = useOptimistic({ liked: reply.liked, likes: reply.likes });
  const [pending, start] = useTransition();
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(reply.body);
  const [gone, setGone] = useState(false);
  const failed = () => showToast({ message: t("toast.error"), tone: "error" });

  if (gone) return null;

  const save = () => {
    const clean = text.trim();
    if (!clean) return failed();
    start(async () => {
      const result = await editPostAction({ id: reply.id, body: clean });
      if (!result.ok) return failed();
      setEditing(false);
      showToast({ message: t("comment.edited") });
    });
  };
  const remove = () =>
    start(async () => {
      const result = await deletePostAction(reply.id);
      setMenu(false);
      if (!result.ok) return failed();
      setGone(true);
      showToast({ message: t("comment.deleted") });
    });

  return (
    <li className="nb-fil-com" data-compact={compact ? "" : undefined}>
      <Link href={reply.author.href} tabIndex={-1} aria-hidden>
        <FilAvatar {...reply.author} size={compact ? 30 : 36} square />
      </Link>
      <div className="nb-fil-com-corps">
        <p className="nb-fil-tete">
          <Link href={reply.author.href} className="nb-fil-nom">
            {reply.author.name}
          </Link>
          <span className="nb-meta nb-fil-quand">
            {reply.edited ? `${reply.ago} · ${t("edited")}` : reply.ago}
          </span>
          {reply.mine ? (
            <button
              type="button"
              className="nb-fil-plus"
              aria-label={t("comment.more")}
              aria-haspopup="dialog"
              onClick={() => setMenu(true)}
            >
              <PhoneIcon name="plusOptions" size={18} />
            </button>
          ) : null}
        </p>
        {editing ? (
          <form
            className="nb-fil-com-modif"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              aria-label={t("comment.label")}
              maxLength={FEED_REPLY_MAX}
              rows={3}
              autoFocus
            />
            <span>
              <button
                type="button"
                className="nb-fil-com-annuler"
                onClick={() => {
                  setEditing(false);
                  setText(reply.body);
                }}
              >
                {t("comment.cancel")}
              </button>
              <button type="submit" className="nb-fil-com-ok" disabled={pending}>
                {t("comment.save")}
              </button>
            </span>
          </form>
        ) : (
          <p className="nb-fil-rep-texte">{reply.body}</p>
        )}
        {compact || editing ? null : (
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
                  if (!result.ok) failed();
                })
              }
            >
              <PhoneIcon name="jaime" size={18} fill={shown.liked ? "currentColor" : undefined} />
              <span aria-hidden>{shown.likes}</span>
            </button>
            {onAnswer ? (
              <button type="button" onClick={() => onAnswer(reply.author.name)}>
                {t("reply")}
              </button>
            ) : null}
          </div>
        )}
      </div>
      {reply.mine ? (
        <PhoneSheet
          open={menu}
          onClose={() => setMenu(false)}
          label={t("comment.sheet")}
          closeLabel={tc("close")}
        >
          <p className="nb-meta nb-fil-feuille-t">{t("comment.sheet")}</p>
          <button
            type="button"
            className="nb-opt nb-fil-opt"
            onClick={() => {
              setMenu(false);
              setText(reply.body);
              setEditing(true);
            }}
          >
            <PhoneIcon name="modifier" size={22} />
            <span>{t("comment.edit")}</span>
          </button>
          <button
            type="button"
            className="nb-opt nb-fil-opt"
            data-alerte=""
            onClick={remove}
            disabled={pending}
          >
            <PhoneIcon name="corbeille" size={22} />
            <span>
              {t("comment.delete")}
              <small>{t("comment.deleteSub")}</small>
            </span>
          </button>
          <button type="button" className="nb-annuler" onClick={() => setMenu(false)}>
            {tc("cancel")}
          </button>
        </PhoneSheet>
      ) : null}
    </li>
  );
}
