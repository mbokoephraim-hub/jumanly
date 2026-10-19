"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NotificationGroup } from "@/components/talent/notification-rows";
import { cx } from "@/lib/cx";
import {
  markAllNotificationsReadInPlace,
  markNotificationsReadAction,
} from "@/server/actions/connect";
import { TalentIcon } from "../icon";

export const NOTIFS_PANEL_ID = "t-notifs";
/** Sent when notifications were marked read here: the bell asks for its count again. */
export const NOTIFS_READ_EVENT = "jm:notifications-lues";

export type NotificationsPanelLabels = {
  title: string;
  markAll: string;
  all: string;
  loading: string;
  error: string;
  empty: string;
  unread: string;
};

type State =
  | { kind: "idle" | "loading" | "error" }
  | { kind: "ready"; groups: NotificationGroup[]; unread: boolean };

/**
 * Notifications under the bell (planche web talent-2 § 4, `.pop`): a popover anchored below the
 * bell of the top bar, the page stays visible. Grouped by day, the new ones lit; a row opens its
 * page and marks it read; « Tout marquer comme lu » stays in the panel; « Toutes les
 * notifications » opens `/app/notifications`. Loaded each time it opens, never before.
 */
export function NotificationsPanel({ labels }: { labels: NotificationsPanelLabels }) {
  const panel = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>({ kind: "idle" });

  const load = useCallback(async () => {
    setState((current) => (current.kind === "ready" ? current : { kind: "loading" }));
    const response = await fetch("/api/notifications/panneau", { cache: "no-store" }).catch(
      () => null,
    );
    if (!response?.ok) return setState({ kind: "error" });
    const data = (await response.json()) as { groups: NotificationGroup[]; unread: boolean };
    setState({ kind: "ready", ...data });
  }, []);

  useEffect(() => {
    const node = panel.current;
    if (!node) return;
    const onToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === "open") void load();
    };
    node.addEventListener("toggle", onToggle);
    return () => node.removeEventListener("toggle", onToggle);
  }, [load]);

  const close = () => panel.current?.hidePopover();

  return (
    <div
      ref={panel}
      id={NOTIFS_PANEL_ID}
      popover="auto"
      role="dialog"
      aria-labelledby={`${NOTIFS_PANEL_ID}-t`}
      className="t-pop"
    >
      <div className="t-pop-hd">
        <h2 id={`${NOTIFS_PANEL_ID}-t`}>{labels.title}</h2>
        {state.kind === "ready" && state.unread && (
          <button
            type="button"
            className="t-press"
            onClick={async () => {
              await markAllNotificationsReadInPlace();
              window.dispatchEvent(new Event(NOTIFS_READ_EVENT));
              await load();
            }}
          >
            {labels.markAll}
          </button>
        )}
      </div>
      {state.kind === "ready" ? (
        state.groups.length === 0 ? (
          <p className="t-vide-t">{labels.empty}</p>
        ) : (
          state.groups.map((group) => (
            <section
              key={group.key}
              aria-labelledby={`${NOTIFS_PANEL_ID}-${group.key}`}
              className="t-flux t-serre"
            >
              <h3 id={`${NOTIFS_PANEL_ID}-${group.key}`} className="t-grp-t">
                {group.title}
              </h3>
              <div className="t-liste t-lignes">
                {group.items.map((item) => (
                  <form key={item.id} action={markNotificationsReadAction} onSubmit={close}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="href" value={item.href} />
                    <button type="submit" className={cx("t-li t-press", item.unread && "t-nv")}>
                      <span className={cx("t-cases", item.tone)} aria-hidden>
                        <TalentIcon name={item.icon} size="s" />
                      </span>
                      <span className="t-t">
                        <b>{item.title}</b>
                        {item.line && <span>{item.line}</span>}
                        {item.unread && <span className="sr-only">{labels.unread}</span>}
                      </span>
                      <span className="t-v">{item.time}</span>
                    </button>
                  </form>
                ))}
              </div>
            </section>
          ))
        )
      ) : (
        <p role="status" className="t-vide-t">
          {state.kind === "error" ? labels.error : labels.loading}
        </p>
      )}
      <Link href="/app/notifications" className="t-pop-tout t-press" onClick={close}>
        {labels.all}
      </Link>
    </div>
  );
}
