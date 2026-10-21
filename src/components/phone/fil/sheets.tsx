"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import {
  deletePostAction,
  hidePostTypeAction,
  reportPostAction,
  repostAction,
  savePostAction,
  sendPostAction,
} from "@/server/actions/feed";
import { PhoneIcon, type phoneIcons } from "../icon";
import { PhoneSheet } from "../sheet";
import { FilAvatar } from "./avatar";
import type { PostView } from "./data";
import type { PostSheet } from "./post";

export type SendTarget = {
  conversationId: string;
  name: string;
  initials: string;
  image: string | null;
  tone: number;
  line: string;
};

const REASONS = ["scam", "harassment", "misinformation", "inappropriate", "other"] as const;

/**
 * The sheets of a post (planche Fil, rangée 06): ··· (voir le profil, enregistrer, copier le lien,
 * ne plus voir ce type de publication, signaler), the reasons of a report, Republier · Citer ·
 * Envoyer, and « Envoyer à » one of the person's connections.
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
  const menu: Row[] = post.mine
    ? [
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
        { key: "link", icon: "lien", title: t("menu.link"), sub: t("menu.linkSub"), run: () => copy() },
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

  const send = (target: SendTarget) =>
    act(async () => {
      const result = await sendPostAction(post.id, target.conversationId);
      onClose();
      if (!result.ok) return failed();
      showToast({ message: t("toast.sentTo", { name: target.name.split(" ")[0] ?? target.name }) });
    });

  const label =
    sheet === "report"
      ? t("report.title")
      : sheet === "send"
        ? t("send.title")
        : sheet === "reshare"
          ? t("repost")
          : post.mine
            ? t("menu.mine")
            : t("menu.title", { name: post.author.name });

  return (
    <PhoneSheet open={open} onClose={onClose} label={label} closeLabel={tc("close")}>
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
          <p className="nb-meta nb-fil-feuille-t">{t("report.anonymous", { name: post.author.name })}</p>
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
          <button type="button" className="nb-opt nb-fil-opt" onClick={reshare} disabled={pending}>
            <PhoneIcon name="republier" size={22} />
            <span>
              {post.reposted ? t("reshare.undo") : t("reshare.do")}
              <small>{post.reposted ? t("reshare.undoSub") : t("reshare.doSub")}</small>
            </span>
          </button>
          <Link href={`/app/fil/publier?citer=${post.id}`} className="nb-opt nb-fil-opt" onClick={onClose}>
            <PhoneIcon name="citer" size={22} />
            <span>
              {t("reshare.quote")}
              <small>{t("reshare.quoteSub")}</small>
            </span>
          </Link>
          <button type="button" className="nb-opt nb-fil-opt" onClick={() => onSheet("send")}>
            <PhoneIcon name="repondre" size={22} />
            <span>
              {t("reshare.send")}
              <small>{t("reshare.sendSub")}</small>
            </span>
          </button>
        </>
      ) : null}
      {sheet === "send" ? (
        <>
          <div className="nb-feuille-titre">
            <button
              type="button"
              className="nb-retour"
              aria-label={tc("back")}
              data-retour=""
              onClick={() => onSheet("reshare")}
            >
              <PhoneIcon name="retour" size={20} stroke={2} />
            </button>
            <h2>{t("send.title")}</h2>
          </div>
          {targets.length === 0 ? <p className="nb-meta nb-fil-feuille-t">{t("send.none")}</p> : null}
          {targets.map((target) => (
            <div key={target.conversationId} className="nb-opt nb-fil-opt nb-fil-envoi">
              <FilAvatar initials={target.initials} image={target.image} tone={target.tone} org={false} size={44} />
              <span>
                {target.name}
                <small>{target.line}</small>
              </span>
              <button
                type="button"
                className="nb-fil-envoyer"
                onClick={() => send(target)}
                disabled={pending}
                aria-label={t("send.to", { name: target.name })}
              >
                {t("send.button")}
              </button>
            </div>
          ))}
          <Link href="/app/messages" className="nb-fil-ouvrir" onClick={onClose}>
            {t("send.open")}
          </Link>
        </>
      ) : null}
      {sheet !== "send" ? (
        <button type="button" className="nb-annuler" onClick={onClose}>
          {tc("cancel")}
        </button>
      ) : null}
    </PhoneSheet>
  );
}
