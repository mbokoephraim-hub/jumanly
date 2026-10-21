"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { plural, useUnread } from "../header";
import { TalentIcon } from "../icon";
import { openTalentCommand } from "./command";
import {
  NOTIFS_PANEL_ID,
  NotificationsPanel,
  type NotificationsPanelLabels,
} from "./notifications-panel";
import { recruiterFullScreen } from "@/components/recruiter/side-nav";
import { classroom, fullScreen } from "./side-nav";

/** Widths of the web frame: the top bar keeps the bell fresh there. */
const WEB = "(min-width: 768px)";
const MENU_ID = "t-amenu";

export type TopBarLabels = {
  search: string;
  shortcut: string;
  notifications: { zero: string; one: string; other: string };
  messages: { zero: string; one: string; other: string };
  /** « Compte de {name} », the button of the avatar. */
  account: string;
  menu: string;
  /** The panel of notifications under the bell (planche web talent-2 § 4). */
  panel: NotificationsPanelLabels;
};

/**
 * Top bar of the web frame (planche web.py `_tb`): the search « Rechercher ou demander à Orbi »
 * with `Ctrl K` (it opens the search window), then the bell, which opens the notifications under
 * it (planche web talent-2 § 4), the messages and the avatar, which opens the account menu
 * (planche talent-4 § 3). Not on Orbi's page nor the full-screen first
 * steps; hidden on a phone, where each destination has its own head.
 */
export function TalentTopBar({
  labels,
  unread,
  unreadMessages,
  avatar,
  menu,
  accountHref,
}: {
  labels: TopBarLabels;
  unread: number;
  unreadMessages: number;
  avatar: ReactNode;
  /** The content of the account menu (server, streamed). */
  menu?: ReactNode;
  /** Instead of the menu, the avatar leads to this page (the recruiter's Compte RH). */
  accountHref?: string;
}) {
  const pathname = usePathname();
  const count = useUnread(unread, WEB);
  const popover = useRef<HTMLDivElement>(null);

  // A new page closes the menu (the frame stays, the menu would stay open over it).
  useEffect(() => {
    const node = popover.current;
    if (node?.matches(":popover-open")) node.hidePopover();
    const panel = document.getElementById(NOTIFS_PANEL_ID);
    if (panel?.matches(":popover-open")) panel.hidePopover();
  }, [pathname]);

  if (pathname === "/app/orbi" || fullScreen(pathname) || recruiterFullScreen(pathname))
    return null;
  return (
    <div className={classroom(pathname) ? "t-tb t-concentre" : "t-tb"}>
      <button
        type="button"
        className="t-verre t-tb-rch t-press"
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        onClick={openTalentCommand}
      >
        <TalentIcon name="recherche" size="s" />
        <span>{labels.search}</span>
        <kbd aria-hidden className="t-kbd">
          {labels.shortcut}
        </kbd>
      </button>
      <span className="t-tb-sp" />
      <button
        type="button"
        aria-label={plural(labels.notifications, count)}
        aria-haspopup="dialog"
        popoverTarget={NOTIFS_PANEL_ID}
        className="t-bi t-press"
      >
        <TalentIcon name="notification" />
        {count > 0 && <i aria-hidden className="t-pastille" />}
      </button>
      <NotificationsPanel labels={labels.panel} />
      <Link
        href="/app/messages"
        aria-label={plural(labels.messages, unreadMessages)}
        className="t-bi t-press"
      >
        <TalentIcon name="message" />
        {unreadMessages > 0 && (
          <b aria-hidden className="t-cpt">
            {unreadMessages > 9 ? "9+" : unreadMessages}
          </b>
        )}
      </Link>
      {accountHref ? (
        <Link href={accountHref} className="t-av t-press" aria-label={labels.account}>
          {avatar}
        </Link>
      ) : (
        <button
          type="button"
          className="t-av t-press"
          aria-label={labels.account}
          popoverTarget={MENU_ID}
        >
          {avatar}
        </button>
      )}
      {!accountHref && (
        <div
          ref={popover}
          id={MENU_ID}
          popover="auto"
          role="dialog"
          aria-label={labels.menu}
          className="t-amenu"
          onClick={(event) => {
            // A choice in the menu closes it (the page changes under the frame).
            if ((event.target as Element).closest("a")) popover.current?.hidePopover();
          }}
        >
          {menu}
        </div>
      )}
    </div>
  );
}
