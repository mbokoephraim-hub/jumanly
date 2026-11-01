"use client";

/* eslint-disable @next/next/no-img-element -- photos of the Fil: small, already reduced */
import "@/styles/fil-partage.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { publishAction, sharePostAction } from "@/server/actions/feed";
import { FEED_BODY_MAX } from "@/server/services/feed-limits";
import { PhoneIcon } from "../icon";
import { FilAvatar } from "./avatar";
import type { PostView } from "./data";
import type { SendTarget } from "./sheets";

/** Lower case, without accents: « Grâce » is found with « grace ». */
const plain = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** The full link of a post: it opens the post in the app, for the people allowed to see it. */
const linkOf = (post: PostView) => new URL(post.href, window.location.origin).toString();

/**
 * When the search field takes the keyboard, the sheet opens to its full height (the gestures of
 * SheetGestures keep the half state otherwise).
 */
function expandSheet(node: HTMLElement) {
  const panel = node.closest<HTMLElement>(".nb-feuille");
  if (!panel || !panel.style.height) return;
  panel.style.transition = "height 280ms cubic-bezier(0.2, 0.8, 0.2, 1)";
  panel.style.height = `${panel.scrollHeight}px`;
  window.setTimeout(() => {
    panel.style.height = "";
    panel.style.top = "";
    panel.style.transition = "";
  }, 300);
}

/**
 * « Partager » (Ephraïm, 29/10/2026, inspired by Instagram, in Jumanly's colours): a search field
 * and « Toutes mes connexions » on top; the people to send to in a grid (those the person already
 * writes to first, then their connections); one or several are chosen, a word can be added, then
 * « Envoyer » puts the post in each conversation. Below, the ways to share it elsewhere.
 */
export function ShareBody({
  post,
  targets,
  onClose,
}: {
  post: PostView;
  targets: SendTarget[];
  onClose: () => void;
}) {
  const t = useTranslations("phoneFil");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const words = plain(query.trim());
  const shown = words
    ? targets.filter((target) => plain(`${target.name} ${target.line}`).includes(words))
    : targets;

  const toggle = (id: string) =>
    setPicked((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const send = () =>
    start(async () => {
      const result = await sharePostAction(post.id, picked, note);
      if (!result.ok) {
        showToast({ message: t("toast.error"), tone: "error" });
        return;
      }
      onClose();
      const one = targets.find((target) => target.conversationId === picked[0]);
      showToast({
        message:
          result.value === 1 && one
            ? t("toast.sentTo", { name: one.name.split(" ")[0] ?? one.name })
            : t("shareTo.sent", { count: result.value }),
      });
    });

  const text = () => (post.title ? t("shareTo.text", { title: post.title }) : post.author.name);
  const copy = async (hint?: string) => {
    await navigator.clipboard?.writeText(linkOf(post)).catch(() => undefined);
    showToast({ message: hint ?? t("toast.link") });
  };
  const native = async () => {
    if (!navigator.share) return false;
    try {
      await navigator.share({ title: text(), text: text(), url: linkOf(post) });
    } catch {
      // Closed without choosing: nothing to say.
    }
    return true;
  };
  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  const outside: { key: string; label: string; icon: ReactNode; run: () => void }[] = [
    {
      key: "copy",
      label: t("shareTo.copy"),
      icon: <PhoneIcon name="lien" size={24} />,
      run: () => void copy(),
    },
    {
      key: "whatsapp",
      label: t("shareTo.whatsapp"),
      icon: <BrandIcon name="whatsapp" />,
      run: () => open(`https://wa.me/?text=${encodeURIComponent(`${text()} ${linkOf(post)}`)}`),
    },
    {
      key: "linkedin",
      label: t("shareTo.linkedin"),
      icon: <BrandIcon name="linkedin" />,
      run: () =>
        open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkOf(post))}`,
        ),
    },
    {
      // Instagram takes no link from a web page: the phone's sheet offers it (messages, story);
      // otherwise the link is copied, to paste there.
      key: "instagram",
      label: t("shareTo.instagram"),
      icon: <BrandIcon name="instagram" />,
      run: () =>
        void native().then((done) => (done ? undefined : copy(t("shareTo.instagramHint")))),
    },
    {
      key: "other",
      label: t("shareTo.other"),
      icon: <PhoneIcon name="plusOptions" size={24} stroke={2.6} />,
      run: () => void native().then((done) => (done ? undefined : copy())),
    },
  ];

  return (
    <div className="nb-pt">
      <h2 className="sr-only">{t("shareTo.title")}</h2>
      <div className="nb-pt-tete">
        <label className="nb-pt-recherche">
          <PhoneIcon name="recherche" size={18} />
          <span className="sr-only">{t("shareTo.search")}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={(event) => expandSheet(event.currentTarget)}
            placeholder={t("shareTo.search")}
            enterKeyHint="search"
            autoComplete="off"
          />
        </label>
        <Link
          href="/app/messages/connexions?onglet=reseau"
          className="nb-pt-reseau"
          aria-label={t("shareTo.network")}
          onClick={onClose}
        >
          <PhoneIcon name="contact" size={22} />
        </Link>
      </div>

      <div className="nb-pt-zone">
        {targets.length === 0 ? (
          <p className="nb-meta nb-pt-vide">{t("shareTo.empty")}</p>
        ) : shown.length === 0 ? (
          <p className="nb-meta nb-pt-vide">{t("shareTo.none", { query: query.trim() })}</p>
        ) : (
          <ul className="nb-pt-grille">
            {shown.map((target) => {
              const on = picked.includes(target.conversationId);
              return (
                <li key={target.conversationId}>
                  <button
                    type="button"
                    className="nb-pt-personne"
                    aria-pressed={on}
                    aria-label={t("shareTo.pick", { name: target.name })}
                    onClick={() => toggle(target.conversationId)}
                  >
                    <span className="nb-pt-photo">
                      <FilAvatar
                        initials={target.initials}
                        image={target.image}
                        tone={target.tone}
                        org={false}
                        size={62}
                      />
                      <span className="nb-pt-coche" aria-hidden>
                        <PhoneIcon name="coche" size={14} stroke={3} />
                      </span>
                    </span>
                    <span className="nb-pt-nom">{target.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {picked.length > 0 ? (
        <form
          className="nb-pt-envoi"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <label className="sr-only" htmlFor={`pt-mot-${post.id}`}>
            {t("shareTo.noteLabel")}
          </label>
          <input
            id={`pt-mot-${post.id}`}
            type="text"
            className="nb-pt-mot"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onFocus={(event) => expandSheet(event.currentTarget)}
            placeholder={t("shareTo.note")}
            maxLength={500}
            autoComplete="off"
          />
          <button type="submit" className="nb-pt-envoyer" disabled={pending} aria-busy={pending}>
            {t("shareTo.send", { count: picked.length })}
          </button>
        </form>
      ) : (
        <div className="nb-pt-ailleurs" role="group" aria-label={t("shareTo.outside")}>
          {outside.map((item) => (
            <button key={item.key} type="button" data-cle={item.key} onClick={item.run}>
              <span className="nb-pt-rond" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Small glyphs of the apps offered under « Partager ailleurs », drawn in the app's colours. */
export function BrandIcon({ name }: { name: "whatsapp" | "linkedin" | "instagram" | "facebook" }) {
  if (name === "facebook")
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden focusable="false">
        <path
          fill="currentColor"
          d="M13.4 20.5v-7.3h2.5l.4-2.9h-2.9V8.5c0-.8.2-1.4 1.4-1.4h1.5V4.5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8v2.9h2.4v7.3z"
        />
      </svg>
    );
  if (name === "linkedin")
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden focusable="false">
        <path
          fill="currentColor"
          d="M5.2 8.6h3v10.2h-3zM6.7 4a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM10.2 8.6h2.9v1.4h.04c.4-.76 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.7v5.7h-3v-5c0-1.2 0-2.7-1.7-2.7s-1.9 1.3-1.9 2.6v5.1h-3z"
        />
      </svg>
    );
  if (name === "instagram")
    return (
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        aria-hidden
        focusable="false"
      >
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
      </svg>
    );
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <path d="M12 3.6a8.4 8.4 0 0 0-7.3 12.6L3.6 20.4l4.3-1.1A8.4 8.4 0 1 0 12 3.6z" />
      <path
        fill="currentColor"
        stroke="none"
        d="M9.1 7.9c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.5l-.5.6c-.1.1-.1.3 0 .4.6 1.1 1.5 1.9 2.6 2.5.2.1.3.1.4 0l.6-.7c.1-.2.3-.2.5-.1l1.6.8c.2.1.3.2.3.4 0 .9-.7 1.7-1.6 1.8-.8.1-1.9-.1-3.6-1.1-1.4-.9-2.4-2.1-2.9-3.2-.5-1.1-.2-2.2.4-2.8.3-.3.6-.4.9-.4z"
      />
    </svg>
  );
}

/**
 * « Republier avec une note » (like LinkedIn): the person's note, then the original post under it,
 * with its author, as it will show in the Fil.
 */
export function NoteBody({
  post,
  onBack,
  onDone,
}: {
  post: PostView;
  onBack: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("phoneFil");
  const tc = useTranslations("phone");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const publish = () => {
    if (!note.trim()) {
      showToast({ message: t("note.empty"), tone: "error" });
      return;
    }
    start(async () => {
      const result = await publishAction({ title: "", body: note, quotedId: post.id });
      if (!result.ok) {
        showToast({ message: t("toast.error"), tone: "error" });
        return;
      }
      onDone();
      showToast({ message: t("toast.noted") });
    });
  };
  return (
    <form
      className="nb-pt-note"
      onSubmit={(event) => {
        event.preventDefault();
        publish();
      }}
    >
      <div className="nb-feuille-titre">
        <button
          type="button"
          className="nb-retour"
          aria-label={tc("back")}
          data-retour=""
          onClick={onBack}
        >
          <PhoneIcon name="retour" size={20} stroke={2} />
        </button>
        <h2>{t("note.title")}</h2>
      </div>
      <div className="nb-fil-champ-tete">
        <label htmlFor={`pt-note-${post.id}`}>{t("note.label")}</label>
        <span aria-hidden>{t("note.counter", { count: note.length, max: FEED_BODY_MAX })}</span>
      </div>
      <textarea
        id={`pt-note-${post.id}`}
        className="nb-fil-champ"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={FEED_BODY_MAX}
        rows={3}
        placeholder={t("note.placeholder")}
      />
      <QuotedCard quoted={quotedOf(post)} />
      <div className="nb-fil-modif-boutons">
        <button type="button" className="nb-annuler" onClick={onBack}>
          {tc("cancel")}
        </button>
        <button type="submit" className="nb-fil-modif-ok" disabled={pending} aria-busy={pending}>
          {t("note.publish")}
        </button>
      </div>
    </form>
  );
}

/** A post as it shows under a note. */
export function quotedOf(post: PostView): NonNullable<PostView["quoted"]> {
  return {
    id: post.id,
    href: post.href,
    name: post.author.name,
    author: post.author,
    ago: post.ago,
    title: post.title,
    body: post.body,
    image: post.image,
  };
}

/**
 * The original post under a note: its author (photo, name, time) first, so that the content keeps
 * its attribution, then its title, its text and its photo. A touch opens the original.
 */
export function QuotedCard({
  quoted,
  link = false,
}: {
  quoted: NonNullable<PostView["quoted"]>;
  link?: boolean;
}) {
  const t = useTranslations("phoneFil");
  const inside = (
    <>
      <span className="nb-pt-cite-h">
        <FilAvatar {...quoted.author} size={28} square />
        <b>{quoted.author.name}</b>
        <small>{quoted.ago}</small>
      </span>
      {quoted.title ? <b className="nb-pt-cite-t">{quoted.title}</b> : null}
      {quoted.body ? <span className="nb-pt-cite-c">{quoted.body}</span> : null}
      {quoted.image ? <img src={quoted.image.src} alt={quoted.image.alt} loading="lazy" /> : null}
    </>
  );
  return link ? (
    <Link
      href={quoted.href}
      className="nb-pt-cite"
      aria-label={t("quotedLabel", { name: quoted.author.name })}
    >
      {inside}
    </Link>
  ) : (
    <span className="nb-pt-cite">{inside}</span>
  );
}
