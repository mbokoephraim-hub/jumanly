"use client";
/* eslint-disable @next/next/no-img-element -- small photos of people, already reduced */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition, type ReactNode } from "react";
import {
  markAllNotificationsReadInPlace,
  markNotificationsReadAction,
} from "@/server/actions/connect";
import { PhoneBack } from "../back";
import { PhoneIcon } from "../icon";

const TABS = ["tout", "candidatures", "entretiens", "reseau"] as const;
type Tab = (typeof TABS)[number];
export type RhNotifTab = Exclude<Tab, "tout">;
const GROUPS = ["today", "yesterday", "thisWeek", "earlier"] as const;

export type RhNotifRow = {
  id: string;
  href: string;
  group: (typeof GROUPS)[number];
  tab: RhNotifTab | null;
  text: string;
  ago: string;
  unread: boolean;
  /** The person's initials, or none for what Jumanly says. */
  initials: string | null;
  /** Their photo, when they have one. */
  image: string | null;
  tint: string;
};

/**
 * Notifications of the recruiter (planches 180 to 183): « Retour », « Tout marquer comme lu » and
 * the settings; « Tout · Candidatures · Entretiens · Réseau » with how many are unread; the lines
 * by day. A touch marks the line read and opens its page. `top`: what awaits an answer of the
 * administrator (requests to join, offers closing soon), answered on the spot.
 */
export function RhNotifications({ rows, top }: { rows: RhNotifRow[]; top?: ReactNode }) {
  const t = useTranslations("phoneRhNotifs");
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tout");
  // Read here: the line leaves the list at once (Ephraïm 29/10/2026), before its page opens.
  const [gone, setGone] = useState<ReadonlySet<string>>(new Set());
  const [pending, start] = useTransition();
  const isUnread = (row: RhNotifRow) => row.unread;
  const left = rows.filter((row) => !gone.has(row.id));
  const inTab = (key: Tab) => left.filter((row) => key === "tout" || row.tab === key);
  const unread = (key: Tab) => inTab(key).filter(isUnread).length;
  const groups = GROUPS.map((key) => ({
    key,
    items: inTab(tab).filter((row) => row.group === key),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="nb-page nb-rn">
      <header className="nb-rn-barre">
        <PhoneBack fallback="/app/hire" label={t("back")} text={t("back")} />
        <button
          type="button"
          className="nb-rn-lu"
          disabled={unread("tout") === 0 || pending}
          onClick={() =>
            start(async () => {
              await markAllNotificationsReadInPlace();
              setGone(new Set(rows.map((row) => row.id)));
              router.refresh();
            })
          }
        >
          {t("readAll")}
        </button>
        <Link href="/app/parametres/notifications" className="nb-rond" aria-label={t("settings")}>
          <PhoneIcon name="reglages" size={22} />
        </Link>
      </header>
      <h1 className="nb-rn-titre">{t("title")}</h1>
      <div className="nb-rm-onglets nb-rn-onglets" role="tablist" aria-label={t("tabs.label")}>
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
          >
            {t(`tabs.${key}`)}
            {unread(key) > 0 ? (
              <span className="nb-rm-compte">
                <span aria-hidden>{unread(key)}</span>
                <span className="sr-only">{t("unreadCount", { count: unread(key) })}</span>
              </span>
            ) : null}
          </button>
        ))}
      </div>
      {top ? <div className="nb-rn-haut">{top}</div> : null}
      <div role="tabpanel" aria-label={t(`tabs.${tab}`)}>
        {groups.length === 0 ? <p className="nb-vide nb-rh-marge">{t("empty")}</p> : null}
        {groups.map((group) => (
          <section key={group.key} aria-labelledby={`rn-${group.key}`}>
            <h2 id={`rn-${group.key}`} className="nb-rn-jour">
              {t(`group.${group.key}`)}
            </h2>
            <ul className="nb-rm-liste">
              {group.items.map((row) => (
                <li key={row.id}>
                  <form
                    action={markNotificationsReadAction}
                    onSubmit={() => setGone((ids) => new Set(ids).add(row.id))}
                  >
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="href" value={row.href} />
                    <button
                      type="submit"
                      className="nb-rn-ligne"
                      data-non-lu={isUnread(row) ? "" : undefined}
                    >
                      {row.image ? (
                        <span className="nb-rh-ini nb-rn-photo" aria-hidden>
                          <img src={row.image} alt="" width={44} height={44} />
                        </span>
                      ) : row.initials ? (
                        <span className="nb-rh-ini" data-teinte={row.tint} aria-hidden>
                          {row.initials}
                        </span>
                      ) : (
                        <span className="nb-rh-ini nb-rn-cloche" aria-hidden>
                          <PhoneIcon name="cloche" size={20} />
                        </span>
                      )}
                      <span className="nb-rn-texte">
                        <b>{row.text}</b>
                        <small>{row.ago}</small>
                      </span>
                      {isUnread(row) ? (
                        <span className="nb-rn-point">
                          <span className="sr-only">{t("unread")}</span>
                        </span>
                      ) : null}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
