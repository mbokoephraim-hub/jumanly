"use client";

/* eslint-disable @next/next/no-img-element -- photos of the conversation, served privately */
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { PhoneBack } from "../back";
import type { Open } from "./bubble";
import { sharedOf } from "./infos";
import type { ThreadView } from "./types";
import { MediaViewer } from "./viewer";

const TABS = ["medias", "liens", "docs"] as const;
export type MediaTab = (typeof TABS)[number];

/**
 * « Médias, liens et documents » of a conversation (planche Messages-medias): the photos by month,
 * the links, the documents; a photo or a document opens full screen.
 */
export function PhoneMedias({ view, tab: first }: { view: ThreadView; tab: MediaTab }) {
  const t = useTranslations("phoneMsg");
  const format = useFormatter();
  const [tab, setTab] = useState<MediaTab>(first);
  const [open, setOpen] = useState<Open | null>(null);
  const shared = sharedOf(view);
  const months = new Map<string, typeof shared.photos>();
  for (const item of shared.photos) {
    const month = format.dateTime(new Date(item.message.at), { month: "long", year: "numeric" });
    months.set(month, [...(months.get(month) ?? []), item]);
  }
  return (
    <div className="nb-page nb-ms nb-ms-medias">
      <header className="nb-barre">
        <PhoneBack fallback={`/app/messages/${view.id}/infos`} label={t("back")} />
        <h1>{view.who.name}</h1>
      </header>
      <div className="nb-ms-onglets" role="tablist" aria-label={t("medias.tabs")}>
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`mm-${key}`}
            aria-selected={tab === key}
            aria-controls="mm-panneau"
            onClick={() => setTab(key)}
          >
            {t(`medias.tab.${key}`)}
          </button>
        ))}
      </div>
      <div id="mm-panneau" role="tabpanel" aria-labelledby={`mm-${tab}`}>
        {tab === "medias" ? (
          shared.photos.length ? (
            [...months.entries()].map(([month, items]) => (
              <section key={month}>
                <p className="nb-sec nb-ms-mois">
                  {month.charAt(0).toUpperCase() + month.slice(1)}
                </p>
                <div className="nb-ms-grille">
                  {items.map((item) => (
                    <button
                      key={`${item.message.id}-${item.index}`}
                      type="button"
                      aria-label={t("search.seePhoto")}
                      onClick={() =>
                        setOpen({ kind: "photo", messageId: item.message.id, index: item.index })
                      }
                    >
                      <img src={item.photo.src} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <p className="nb-meta nb-ms-vide">{t("medias.noPhotos")}</p>
          )
        ) : null}
        {tab === "liens"
          ? shared.links.map((message) =>
              message.bubble.kind === "link" ? (
                message.bubble.internal ? (
                  <Link
                    key={message.id}
                    href={message.bubble.url}
                    className="nb-ms-ligne nb-ms-lienl"
                  >
                    <span className="nb-ms-lienl-i" aria-hidden>
                      {message.bubble.display.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="nb-ms-ligne-c">
                      <b>{message.bubble.title}</b>
                      <span className="nb-ms-lien-url">{message.bubble.display}</span>
                    </span>
                  </Link>
                ) : (
                  <a
                    key={message.id}
                    href={message.bubble.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="nb-ms-ligne nb-ms-lienl"
                  >
                    <span className="nb-ms-lienl-i" aria-hidden>
                      {message.bubble.display.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="nb-ms-ligne-c">
                      <b>{message.bubble.title}</b>
                      <span className="nb-ms-lien-url">{message.bubble.display}</span>
                    </span>
                  </a>
                )
              ) : null,
            )
          : null}
        {tab === "liens" && shared.links.length === 0 ? (
          <p className="nb-meta nb-ms-vide">{t("medias.noLinks")}</p>
        ) : null}
        {tab === "docs"
          ? shared.docs.map((message) =>
              message.bubble.kind === "doc" ? (
                <button
                  key={message.id}
                  type="button"
                  className="nb-ms-ligne"
                  onClick={() => setOpen({ kind: "doc", messageId: message.id })}
                >
                  <span className="nb-ms-ext" aria-hidden>
                    {message.bubble.ext || t("pdf")}
                  </span>
                  <span className="nb-ms-ligne-c">
                    <b>{message.bubble.name}</b>
                    <span className="nb-meta">
                      {message.time} · {message.bubble.meta}
                    </span>
                  </span>
                </button>
              ) : null,
            )
          : null}
        {tab === "docs" && shared.docs.length === 0 ? (
          <p className="nb-meta nb-ms-vide">{t("medias.noDocs")}</p>
        ) : null}
      </div>
      <MediaViewer
        conversationId={view.id}
        open={open}
        messages={view.messages}
        title={view.who.name}
        forwardTo={view.forwardTo}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}
