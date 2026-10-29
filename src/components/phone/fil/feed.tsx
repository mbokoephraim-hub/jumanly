"use client";

import "@/styles/phone-onglets.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { hidePostTypeAction } from "@/server/actions/feed";
import { OrbiDisc, PhoneIcon } from "../icon";
import { askOrbiFrom } from "../orbi-bus";
import { FilAvatar } from "./avatar";
import type { PostView } from "./data";
import { PostCard, type PostSheet } from "./post";
import { FilRefresh } from "./refresh";
import { PostSheets, type SendTarget } from "./sheets";

export const FIL_TABS = ["pourvous", "abonnements", "entreprises"] as const;
export type FilTab = (typeof FIL_TABS)[number];

export type FilMe = { name: string; initials: string; image: string | null };

/**
 * The Fil (Modèle B, planche Fil, rangée 05): the head (bell, avatar), « Pour vous · Abonnements ·
 * Entreprises », the line to publish, then the posts. The three tabs arrive together with the
 * page (no loading when switching); a masked post leaves a line with « Annuler ».
 */
export function PhoneFil({
  me,
  unread,
  lists,
  offersToday,
  targets,
  recruiter,
  loadedAt,
}: {
  me: FilMe;
  unread: number;
  lists: Record<FilTab, PostView[]>;
  /** Offers published this morning that match the person: Orbi's card in « Pour vous ». */
  offersToday: number;
  targets: SendTarget[];
  /**
   * The recruiter's Fil (Modèle B recruteur, M3): the tab's head comes from the page, the line to
   * publish is the talent's, followed by « Publier au nom de… » when they manage the company's
   * offers; no Orbi card, and the end points to Talents.
   */
  recruiter?: { compose: ReactNode; end: { text: string; link: string; href: string } };
  /** When the server read these lists (ISO): « Nouvelles publications » counts from there. */
  loadedAt: string;
}) {
  const t = useTranslations("phoneFil");
  const [tab, setTab] = useState<FilTab>("pourvous");
  const [open, setOpen] = useState<{ post: PostView; sheet: PostSheet } | null>(null);
  const [masked, setMasked] = useState<Record<string, string>>({});
  const [gone, setGone] = useState<string[]>([]);
  const [, start] = useTransition();
  const posts = lists[tab].filter((post) => !gone.includes(post.id));

  const undo = (post: PostView) =>
    start(async () => {
      const result = await hidePostTypeAction(post.id, false);
      if (!result.ok) {
        showToast({ message: t("toast.error"), tone: "error" });
        return;
      }
      setMasked((current) => {
        const next = { ...current };
        for (const [id, type] of Object.entries(next)) if (type === post.type) delete next[id];
        return next;
      });
    });

  return (
    <div className={recruiter ? "nb-fil nb-rh-fil" : "nb-page nb-fil"}>
      <FilRefresh loadedAt={loadedAt} />
      {recruiter ? null : (
        <header className="nb-tete-onglet">
          <h1>{t("title")}</h1>
          <FilBell initial={unread} />
          {/* Paramètres beside the bell, in place of the avatar (Ephraïm, 27/10/2026). */}
          <Link href="/app/parametres" className="nb-rond" aria-label={t("settings")}>
            <PhoneIcon name="reglages" size={23} />
          </Link>
        </header>
      )}
      <div className="nb-onglets nb-fil-onglets" role="tablist" aria-label={t("tabs")}>
        {FIL_TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`fil-${key}`}
            aria-selected={tab === key}
            aria-controls="fil-liste"
            onClick={() => setTab(key)}
          >
            {t(`tab.${key}`)}
          </button>
        ))}
      </div>
      <div className="nb-fil-publier">
        <Link href="/app/fil/publier" className="nb-fil-publier-l">
          <FilAvatar initials={me.initials} image={me.image} tone={0} org={false} me size={40} />
          <span>
            <b>{me.name}</b>
            <span className="nb-meta">{t("compose.prompt")}</span>
          </span>
        </Link>
        <Link href="/app/fil/publier" className="nb-fil-publier-b">
          {t("compose.button")}
        </Link>
      </div>
      {recruiter?.compose}
      <div id="fil-liste" role="tabpanel" aria-labelledby={`fil-${tab}`}>
        {posts.length === 0 ? <p className="nb-vide">{t(`empty.${tab}`)}</p> : null}
        {posts.map((post, index) => (
          <div key={post.id}>
            {masked[post.id] !== undefined || Object.values(masked).includes(post.type) ? (
              masked[post.id] !== undefined ? (
                <div className="nb-fil-masque">
                  <span>{t("masked")}</span>
                  <button type="button" onClick={() => undo(post)}>
                    {t("maskedUndo")}
                  </button>
                </div>
              ) : null
            ) : (
              <PostCard post={post} onSheet={(target, sheet) => setOpen({ post: target, sheet })} />
            )}
            {!recruiter && tab === "pourvous" && index === 1 && offersToday > 0 ? (
              <button
                type="button"
                className="nb-fil-orbi"
                data-orbi=""
                onClick={() => askOrbiFrom("offres")}
              >
                <OrbiDisc size={44} />
                <span>
                  <b>{t("orbiCard.title")}</b>
                  <span>{t("orbiCard.offers", { count: offersToday })}</span>
                </span>
              </button>
            ) : null}
          </div>
        ))}
        {posts.length > 0 ? (
          recruiter ? (
            <p className="nb-fil-fin">
              {recruiter.end.text} <Link href={recruiter.end.href}>{recruiter.end.link}</Link>
            </p>
          ) : (
            <p className="nb-fil-fin">
              {t("end")} <Link href="/app/jobs">{t("endLink")}</Link>
              {t("endAfter")}
            </p>
          )
        ) : null}
      </div>
      <PostSheets
        post={open?.post ?? null}
        sheet={open?.sheet ?? null}
        onSheet={(sheet) => setOpen((current) => (current ? { ...current, sheet } : current))}
        onClose={() => setOpen(null)}
        onHidden={(post, how) => {
          if (how === "deleted") setGone((current) => [...current, post.id]);
          else setMasked((current) => ({ ...current, [post.id]: post.type }));
        }}
        targets={targets}
      />
    </div>
  );
}

/** The bell of the Fil asks again every minute and when the app comes back, only while it shows. */
const POLL_MS = 60_000;

/**
 * The bell of the Fil: its count follows the notifications that arrive while the person is here
 * (the toast of an important one comes from the shell, once for the whole app).
 */
function FilBell({ initial }: { initial: number }) {
  const t = useTranslations("phoneFil");
  const link = useRef<HTMLAnchorElement>(null);
  const [unread, setUnread] = useState(initial);
  const [known, setKnown] = useState(initial);
  // A new page from the server brings a fresh count.
  if (known !== initial) {
    setKnown(initial);
    setUnread(initial);
  }

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/notifications", { cache: "no-store" }).catch(() => null);
      if (!response?.ok) return;
      const data = (await response.json()) as { unread: number };
      setUnread(data.unread);
    };
    const tick = () => {
      if (document.visibilityState === "visible" && link.current?.offsetParent !== null)
        void load();
    };
    const first = window.setTimeout(tick, 1500);
    const timer = window.setInterval(tick, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    // Marked read elsewhere (« Tout marquer comme lu »): the count follows at once.
    window.addEventListener("jm:notifications-lues", tick);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("jm:notifications-lues", tick);
    };
  }, []);

  return (
    <Link
      ref={link}
      href="/app/notifications"
      className="nb-rond"
      aria-label={t("bell", { count: unread })}
    >
      <PhoneIcon name="cloche" size={24} />
      {unread > 0 ? (
        <span className="nb-compteur" aria-hidden>
          {unread > 99 ? t("bellMany") : unread}
        </span>
      ) : null}
    </Link>
  );
}
