"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import Link from "next/link";
import { showToast } from "@/components/motion/toaster";
import {
  markAllNotificationsReadInPlace,
  markNotificationsReadAction,
} from "@/server/actions/connect";
import { PhoneBack } from "../back";
import { OrbiDisc, PhoneIcon } from "../icon";
import { FilAvatar } from "./avatar";

export const NOTIF_FILTERS = ["tout", "candidatures", "offres", "reseau"] as const;
export type NotifFilter = (typeof NOTIF_FILTERS)[number];

export type NotifRow = {
  id: string;
  href: string;
  group: "today" | "thisWeek" | "earlier";
  filter: Exclude<NotifFilter, "tout"> | null;
  /** The name written in bold at the start of the sentence, when there is one. */
  who: string | null;
  what: string;
  ago: string;
  unread: boolean;
  avatar: { initials: string; tone: number; org: boolean; image: string | null } | "orbi" | null;
};

/**
 * Notifications from the bell of the Fil (planche Fil, rangée 06): « Tout · Candidatures · Offres
 * · Réseau », how many are unread and « Tout marquer comme lu », then today, this week, earlier.
 * A touch marks the line read and opens its page.
 */
export function PhoneNotifications({ rows }: { rows: NotifRow[] }) {
  const t = useTranslations("phoneFil");
  const router = useRouter();
  const [filter, setFilter] = useState<NotifFilter>("tout");
  const [allRead, setAllRead] = useState(false);
  const [pending, start] = useTransition();
  const unread = allRead ? 0 : rows.filter((row) => row.unread).length;
  const shown = rows.filter((row) => filter === "tout" || row.filter === filter);
  const groups = (["today", "thisWeek", "earlier"] as const)
    .map((key) => ({ key, items: shown.filter((row) => row.group === key) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="nb-page nb-fil nb-fil-notifs">
      <header className="nb-barre">
        <PhoneBack fallback="/app" label={t("notifs.back")} text={t("notifs.back")} />
        <h1>{t("notifs.title")}</h1>
        <Link
          href="/app/parametres?onglet=confidentialite"
          className="nb-rond"
          aria-label={t("notifs.settings")}
        >
          <PhoneIcon name="reglages" size={22} />
        </Link>
      </header>
      <div className="nb-chips nb-fil-filtres" role="group" aria-label={t("notifs.filters")}>
        {NOTIF_FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            className="nb-chip"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {t(`notifs.filter.${key}`)}
          </button>
        ))}
      </div>
      <div className="nb-fil-lus">
        <span className="nb-meta">{t("notifs.unread", { count: unread })}</span>
        <button
          type="button"
          disabled={unread === 0 || pending}
          onClick={() =>
            start(async () => {
              await markAllNotificationsReadInPlace();
              setAllRead(true);
              showToast({ message: t("notifs.markedAll") });
              router.refresh();
            })
          }
        >
          {t("notifs.markAll")}
        </button>
      </div>
      {groups.length === 0 ? <p className="nb-vide">{t("notifs.empty")}</p> : null}
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`nf-${group.key}`}>
          <h2 id={`nf-${group.key}`} className="nb-sec">
            {t(`notifs.group.${group.key}`)}
          </h2>
          {group.items.map((row) => {
            const isUnread = row.unread && !allRead;
            return (
              <form key={row.id} action={markNotificationsReadAction}>
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="href" value={row.href} />
                <button
                  type="submit"
                  className="nb-fil-notif"
                  data-nouveau={isUnread ? "" : undefined}
                >
                  {row.avatar === "orbi" ? (
                    <OrbiDisc size={44} />
                  ) : row.avatar ? (
                    <FilAvatar {...row.avatar} size={44} />
                  ) : (
                    <span className="nb-av nb-fil-av" data-ton="moi" aria-hidden>
                      {t("notifs.systemInitial")}
                    </span>
                  )}
                  <span className="nb-fil-notif-t">
                    <span>
                      {row.who ? <b>{row.who}</b> : null}
                      {row.what}
                    </span>
                    <small>{row.ago}</small>
                  </span>
                  {isUnread ? (
                    <span className="nb-fil-point">
                      <span className="sr-only">{t("notifs.newDot")}</span>
                    </span>
                  ) : null}
                </button>
              </form>
            );
          })}
        </section>
      ))}
    </div>
  );
}
