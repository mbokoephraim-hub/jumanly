"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { pinAction, reportChatAction } from "@/server/actions/chat";
import { blockPhoneAction, muteAction } from "@/server/actions/messages-phone";
import { PhoneSheet } from "../sheet";
import { WhoAvatar } from "./parts";
import type { ThreadView } from "./types";

export type MenuSheet = "menu" | "signaler" | "bloquer" | null;

const REASONS = ["harassment", "scam", "spam", "inappropriate", "other"] as const;

/** The drawings of the menu ··· (planche Chat-menu), with their colour. */
const ICON = {
  profile: ["M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4.5 20a7.5 7.5 0 0 1 15 0", "#C3A6FF"],
  application: ["M3.5 8.5h17v11h-17zM8.5 8.5V5.5h7v3M3.5 12.5h17", "#A6F26B"],
  search: ["M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.4-4.4", "#7CC4FF"],
  medias: ["M4 5.5h16v13H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17", "#FF9EC7"],
  notifications: ["M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5h4", "#F4C463"],
  pin: ["M9 3.5h6l-1 5 3.5 3.5h-11L10 8.5zM12 12v8.5", "#2FD3A6"],
  report: ["M5 21V4.5h11l-1.5 4 1.5 4H5", "#FF8A7A"],
  block: ["M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM6 6l12 12", "#FF8A7A"],
} as const;

function Glyph({ name }: { name: keyof typeof ICON }) {
  const [path, color] = ICON[name];
  return (
    <span className="nb-ch-mi" style={{ background: `${color}22`, color }} aria-hidden>
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={path} />
      </svg>
    </span>
  );
}

function Chevron() {
  return (
    <svg
      className="nb-ch-chev"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/** « Notifications » kept in step with the server, answered at once on the screen. */
export function useMute(view: ThreadView) {
  const t = useTranslations("phoneMsg");
  const [muted, setMuted] = useState(view.muted);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the server
    setMuted(view.muted);
  }, [view.muted]);
  const toggle = () => {
    const next = !muted;
    setMuted(next);
    void muteAction(view.id, next).then((result) => {
      if (!result.ok) {
        setMuted(!next);
        showToast({ message: t("error"), tone: "error" });
        return;
      }
      showToast({ message: next ? t("mute.on") : t("mute.off") });
    });
  };
  return { muted, toggle };
}

/**
 * The menu ··· of a conversation (planche Chat-menu): the person's card, then « Voir le profil »,
 * « Voir la candidature », « Rechercher dans la discussion », « Médias, liens et documents »,
 * « Notifications » (a switch), « Épingler la discussion », and « Signaler » and « Bloquer » in
 * coral, each confirmed at the next step.
 */
export function ChatMenu({
  view,
  sheet,
  setSheet,
  onSearch,
  mute,
}: {
  view: ThreadView;
  sheet: MenuSheet;
  setSheet: (sheet: MenuSheet) => void;
  onSearch: () => void;
  mute: ReturnType<typeof useMute>;
}) {
  const t = useTranslations("phoneChat.menu");
  const tm = useTranslations("phoneMsg");
  const tc = useTranslations("phoneChat");
  const router = useRouter();
  const [pinned, setPinned] = useState(view.pinned);
  const [reason, setReason] = useState<(typeof REASONS)[number] | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the server
    setPinned(view.pinned);
  }, [view.pinned]);
  const close = () => setSheet(null);
  const who = view.who;
  const name = who.first;

  const fail = () => showToast({ message: tm("error"), tone: "error" });

  const pin = () => {
    const next = !pinned;
    setPinned(next);
    close();
    void pinAction(view.id, next).then((result) => {
      if (!result.ok) {
        setPinned(!next);
        fail();
        return;
      }
      showToast({ message: next ? t("pinnedToast") : t("unpinnedToast") });
    });
  };

  const report = () =>
    start(async () => {
      if (!reason) return;
      const result = await reportChatAction(view.id, reason).catch(() => null);
      if (!result?.ok) return fail();
      close();
      setReason(null);
      showToast({ message: result.value === "already" ? t("report.already") : t("report.done") });
    });

  const block = () =>
    start(async () => {
      const result = await blockPhoneAction(view.id, !view.blockedByMe).catch(() => null);
      if (!result?.ok) return fail();
      close();
      showToast({
        message: view.blockedByMe
          ? tm("confirm.unblocked", { name })
          : tm("confirm.blocked", { name }),
      });
      router.refresh();
    });

  const row = (
    key: string,
    glyph: keyof typeof ICON,
    label: string,
    end: ReactNode = <Chevron />,
  ) => ({
    key,
    glyph,
    label,
    end,
  });
  const linkRows = [
    who.href
      ? { ...row("profil", "profile", who.org ? t("page") : t("profile")), href: who.href }
      : null,
    view.applicationHref
      ? { ...row("candidature", "application", t("application")), href: view.applicationHref }
      : null,
  ].filter((item) => item !== null);

  return (
    <PhoneSheet
      open={sheet !== null}
      onClose={close}
      label={
        sheet === "signaler"
          ? t("report.title", { name })
          : sheet === "bloquer"
            ? t("block.title", { name })
            : t("label")
      }
      closeLabel={tm("close")}
    >
      {sheet === "menu" ? (
        <div className="nb-ch-menu">
          <div className="nb-ch-fiche">
            <WhoAvatar who={who} size={48} />
            <span>
              <b>{who.name}</b>
              <span>{who.line}</span>
            </span>
          </div>
          <div className="nb-ch-options">
            {linkRows.map((item, index) => (
              <Link
                key={item.key}
                href={item.href}
                className="nb-ch-opt"
                style={{ animationDelay: `${index * 0.035}s` }}
                onClick={close}
              >
                <Glyph name={item.glyph} />
                <span>{item.label}</span>
                {item.end}
              </Link>
            ))}
            <button
              type="button"
              className="nb-ch-opt"
              onClick={() => {
                close();
                onSearch();
              }}
            >
              <Glyph name="search" />
              <span>{t("search")}</span>
              <Chevron />
            </button>
            <Link href={`/app/messages/${view.id}/medias`} className="nb-ch-opt" onClick={close}>
              <Glyph name="medias" />
              <span>{t("medias")}</span>
              <Chevron />
            </Link>
            <button
              type="button"
              className="nb-ch-opt"
              role="switch"
              aria-checked={!mute.muted}
              onClick={mute.toggle}
            >
              <Glyph name="notifications" />
              <span>{t("notifications")}</span>
              <i className="nb-ch-sw" data-on={!mute.muted ? "" : undefined} aria-hidden />
            </button>
            <button type="button" className="nb-ch-opt" onClick={pin}>
              <Glyph name="pin" />
              <span>{pinned ? t("unpin") : t("pin")}</span>
              <Chevron />
            </button>
            <button
              type="button"
              className="nb-ch-opt"
              data-corail=""
              onClick={() => setSheet("signaler")}
            >
              <Glyph name="report" />
              <span>{t("report.label")}</span>
              <Chevron />
            </button>
            <button
              type="button"
              className="nb-ch-opt"
              data-corail=""
              onClick={() => setSheet("bloquer")}
            >
              <Glyph name="block" />
              <span>{view.blockedByMe ? t("unblock") : t("block.label")}</span>
              <Chevron />
            </button>
          </div>
        </div>
      ) : null}

      {sheet === "signaler" ? (
        <div className="nb-ch-confirme">
          <h2>{t("report.title", { name })}</h2>
          <p>{t("report.text")}</p>
          <div className="nb-ch-raisons" role="radiogroup" aria-label={t("report.reasons")}>
            {REASONS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={reason === key}
                onClick={() => setReason(key)}
              >
                {t(`report.reason.${key}`)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="nb-ch-corail"
            disabled={pending || !reason}
            onClick={report}
          >
            {t("report.send")}
          </button>
          <button type="button" className="nb-ch-non" onClick={() => setSheet("menu")}>
            {tc("cancel")}
          </button>
        </div>
      ) : null}

      {sheet === "bloquer" ? (
        <div className="nb-ch-confirme">
          <h2>{view.blockedByMe ? t("unblockTitle", { name }) : t("block.title", { name })}</h2>
          <p>
            {view.blockedByMe
              ? t("unblockText", { name })
              : view.kind === "peer"
                ? tm("confirm.blockPerson", { name })
                : tm("confirm.blockOrg", { name })}
          </p>
          <button
            type="button"
            className={view.blockedByMe ? "nb-ch-oui" : "nb-ch-corail"}
            disabled={pending}
            onClick={block}
          >
            {view.blockedByMe ? t("unblock") : tm("confirm.block")}
          </button>
          <button type="button" className="nb-ch-non" onClick={() => setSheet("menu")}>
            {tc("cancel")}
          </button>
        </div>
      ) : null}
    </PhoneSheet>
  );
}
