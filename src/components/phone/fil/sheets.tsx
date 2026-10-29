"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { FEED_BODY_MAX } from "@/server/services/feed-limits";
import {
  deletePostAction,
  editPostAction,
  hidePostTypeAction,
  reportPostAction,
  repostAction,
  savePostAction,
} from "@/server/actions/feed";
import { PhoneIcon, type phoneIcons } from "../icon";
import { PhoneSheet } from "../sheet";
import type { PostView } from "./data";
import type { PostSheet } from "./post";
import { PostTextFields } from "./post-fields";
import { NoteBody, ShareBody } from "./share";

export type SendTarget = {
  conversationId: string;
  /** Already writes with the person: shown first. */
  talked: boolean;
  name: string;
  initials: string;
  image: string | null;
  tone: number;
  line: string;
};

const REASONS = ["scam", "harassment", "misinformation", "inappropriate", "other"] as const;

/**
 * The sheets of a post (planche Fil, rangée 06): ··· (voir le profil, enregistrer, copier le lien,
 * ne plus voir ce type de publication, signaler), the reasons of a report, « Republier » (directly
 * or with a note, like LinkedIn) and « Partager » (to connections or elsewhere, like Instagram).
 */
export function PostSheets({
  post,
  sheet,
  onSheet,
  onClose,
  onHidden,
  targets,
}: {
  post: PostView | null;
  sheet: PostSheet | null;
  onSheet: (sheet: PostSheet) => void;
  onClose: () => void;
  /** The post was masked (« Ne plus voir ce type de publication ») or deleted. */
  onHidden?: (post: PostView, how: "hidden" | "deleted") => void;
  targets: SendTarget[];
}) {
  const t = useTranslations("phoneFil");
  const tc = useTranslations("phone");
  const router = useRouter();
  const [pending, start] = useTransition();
  const open = Boolean(post && sheet);
  const failed = () => showToast({ message: t("toast.error"), tone: "error" });

  const act = (work: () => Promise<void>) => start(work);

  if (!post) return null;

  type Row = {
    key: string;
    icon: keyof typeof phoneIcons;
    title: string;
    sub: string;
    alert?: boolean;
    run: () => void;
  };
  const share: Row = {
    key: "share",
    icon: "partager",
    title: t("menu.share"),
    sub: t("menu.shareSub"),
    run: () => onSheet("share"),
  };
  const menu: Row[] = post.mine
    ? [
        {
          key: "edit",
          icon: "modifier",
          title: t("menu.edit"),
          sub: t("menu.editSub"),
          run: () => onSheet("edit"),
        },
        share,
        {
          key: "link",
          icon: "lien",
          title: t("menu.link"),
          sub: t("menu.linkSub"),
          run: () => copy(),
        },
        {
          key: "delete",
          icon: "corbeille",
          title: t("menu.delete"),
          sub: t("menu.deleteSub"),
          alert: true,
          run: () =>
            act(async () => {
              const result = await deletePostAction(post.id);
              if (!result.ok) return failed();
              onClose();
              onHidden?.(post, "deleted");
              showToast({ message: t("toast.deleted") });
            }),
        },
      ]
    : [
        {
          key: "profile",
          icon: "personne",
          title: t("menu.profile"),
          sub: post.author.name,
          run: () => {
            onClose();
            router.push(post.author.href);
          },
        },
        share,
        {
          key: "save",
          icon: "signet",
          title: post.saved ? t("menu.unsave") : t("menu.save"),
          sub: t("menu.saveSub"),
          run: () =>
            act(async () => {
              const result = await savePostAction(post.id);
              if (!result.ok) return failed();
              onClose();
              showToast({ message: t(result.value ? "toast.saved" : "toast.unsaved") });
            }),
        },
        {
          key: "link",
          icon: "lien",
          title: t("menu.link"),
          sub: t("menu.linkSub"),
          run: () => copy(),
        },
        {
          key: "hide",
          icon: "cacher",
          title: t("menu.hide"),
          sub: t("menu.hideSub"),
          run: () =>
            act(async () => {
              const result = await hidePostTypeAction(post.id, true);
              if (!result.ok) return failed();
              onClose();
              onHidden?.(post, "hidden");
              showToast({ message: t("toast.hidden") });
            }),
        },
        {
          key: "report",
          icon: "drapeau",
          title: t("menu.report"),
          sub: t("menu.reportSub"),
          alert: true,
          run: () => onSheet("report"),
        },
      ];

  function copy() {
    const url = new URL(post!.href, window.location.origin).toString();
    void navigator.clipboard?.writeText(url).catch(() => undefined);
    onClose();
    showToast({ message: t("toast.link") });
  }

  const report = (reason: (typeof REASONS)[number]) =>
    act(async () => {
      const result = await reportPostAction(post.id, reason);
      onClose();
      if (!result.ok) return failed();
      showToast({ message: t(result.value === "already" ? "report.already" : "report.done") });
    });

  const reshare = () =>
    act(async () => {
      const result = await repostAction(post.id);
      onClose();
      if (!result.ok) return failed();
      showToast({ message: t(result.value ? "toast.reposted" : "toast.unreposted") });
    });

  const label =
    sheet === "edit"
      ? t("edit.title")
      : sheet === "report"
        ? t("report.title")
        : sheet === "share"
          ? t("shareTo.title")
          : sheet === "note"
            ? t("note.title")
            : sheet === "reshare"
              ? t("reshare.title")
              : post.mine
                ? t("menu.mine")
                : t("menu.title", { name: post.author.name });

  return (
    <PhoneSheet
      open={open}
      onClose={onClose}
      label={label}
      closeLabel={tc("close")}
      className={sheet === "share" ? "nb-feuille-mi nb-pt-feuille" : undefined}
    >
      {sheet === "menu" ? (
        <>
          <p className="nb-meta nb-fil-feuille-t">{label}</p>
          {menu.map((row) => (
            <button
              key={row.key}
              type="button"
              className="nb-opt nb-fil-opt"
              data-alerte={row.alert ? "" : undefined}
              onClick={row.run}
              disabled={pending}
            >
              <PhoneIcon name={row.icon} size={22} />
              <span>
                {row.title}
                <small>{row.sub}</small>
              </span>
            </button>
          ))}
        </>
      ) : null}
      {sheet === "edit" ? <EditPost key={post.id} post={post} onDone={onClose} /> : null}
      {sheet === "report" ? (
        <>
          <div className="nb-feuille-titre">
            {post.mine ? null : (
              <button
                type="button"
                className="nb-retour"
                aria-label={tc("back")}
                data-retour=""
                onClick={() => onSheet("menu")}
              >
                <PhoneIcon name="retour" size={20} stroke={2} />
              </button>
            )}
            <h2>{t("report.title")}</h2>
          </div>
          <p className="nb-meta nb-fil-feuille-t">
            {t("report.anonymous", { name: post.author.name })}
          </p>
          {REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              className="nb-opt nb-fil-opt"
              onClick={() => report(reason)}
              disabled={pending}
            >
              {t(`report.${reason}`)}
            </button>
          ))}
        </>
      ) : null}
      {sheet === "reshare" ? (
        <>
          <p className="nb-meta nb-fil-feuille-t">{t("reshare.title")}</p>
          <button type="button" className="nb-opt nb-fil-opt" onClick={reshare} disabled={pending}>
            <PhoneIcon name="republier" size={22} />
            <span>
              {post.reposted ? t("reshare.undo") : t("reshare.do")}
              <small>{post.reposted ? t("reshare.undoSub") : t("reshare.doSub")}</small>
            </span>
          </button>
          <button type="button" className="nb-opt nb-fil-opt" onClick={() => onSheet("note")}>
            <PhoneIcon name="modifier" size={22} />
            <span>
              {t("reshare.quote")}
              <small>{t("reshare.quoteSub")}</small>
            </span>
          </button>
        </>
      ) : null}
      {sheet === "note" ? (
        <NoteBody key={post.id} post={post} onBack={() => onSheet("reshare")} onDone={onClose} />
      ) : null}
      {sheet === "share" ? (
        <ShareBody key={post.id} post={post} targets={targets} onClose={onClose} />
      ) : null}
      {sheet === "menu" || sheet === "report" || sheet === "reshare" ? (
        <button type="button" className="nb-annuler" onClick={onClose}>
          {tc("cancel")}
        </button>
      ) : null}
    </PhoneSheet>
  );
}

/** « Modifier la publication »: its title and its text, with the same counters as Publier. */
function EditPost({ post, onDone }: { post: PostView; onDone: () => void }) {
  const t = useTranslations("phoneFil");
  const tc = useTranslations("phone");
  const [title, setTitle] = useState(post.title ?? "");
  const [body, setBody] = useState(post.body);
  const [pending, start] = useTransition();
  // The note of a repost has no title: its text only.
  const note = Boolean(post.quoted && !post.title);
  const save = () => {
    if (note ? !body.trim() : !title.trim()) {
      showToast({ message: t(note ? "note.empty" : "edit.empty"), tone: "error" });
      return;
    }
    start(async () => {
      const result = await editPostAction({ id: post.id, title: note ? "" : title, body });
      if (!result.ok) {
        showToast({ message: t("toast.error"), tone: "error" });
        return;
      }
      onDone();
      showToast({ message: t("toast.edited") });
    });
  };
  return (
    <form
      className="nb-fil-modif"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <h2 className="nb-fil-modif-t">{note ? t("edit.noteTitle") : t("edit.title")}</h2>
      {note ? (
        <>
          <label className="sr-only" htmlFor={`fil-modif-${post.id}-note`}>
            {t("note.label")}
          </label>
          <textarea
            id={`fil-modif-${post.id}-note`}
            className="nb-fil-champ"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={FEED_BODY_MAX}
            rows={4}
          />
        </>
      ) : (
        <PostTextFields
          id={`fil-modif-${post.id}`}
          title={title}
          body={body}
          onTitle={setTitle}
          onBody={setBody}
        />
      )}
      <div className="nb-fil-modif-boutons">
        <button type="button" className="nb-annuler" onClick={onDone}>
          {tc("cancel")}
        </button>
        <button type="submit" className="nb-fil-modif-ok" disabled={pending}>
          {t("edit.save")}
        </button>
      </div>
    </form>
  );
}
