"use client";

/* eslint-disable @next/next/no-img-element -- photos of the conversation, served privately */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PhoneBack } from "../back";
import { PhoneIcon } from "../icon";
import { Toggle, WhoAvatar, WhoName } from "./parts";
import { ConversationSheets, useEphemeralLabel, useMute, type SettingsSheet } from "./settings";
import type { ThreadView } from "./types";

/** The photos, links and documents of a conversation, newest first. */
export function sharedOf(view: ThreadView) {
  const photos = view.messages.flatMap((message) =>
    message.bubble.kind === "photos"
      ? message.bubble.photos.map((photo, index) => ({ message, photo, index }))
      : [],
  );
  const links = view.messages.filter((message) => message.bubble.kind === "link");
  const docs = view.messages.filter((message) => message.bubble.kind === "doc");
  return { photos: photos.reverse(), links: links.reverse(), docs: docs.reverse() };
}

/**
 * « Infos » of a conversation (planche Messages-infos): the face, « En ligne », the green check,
 * « Profil · Rechercher · Son », the media, « Mode silencieux », « Messages éphémères », « Plus ».
 */
export function PhoneInfos({ view }: { view: ThreadView }) {
  const t = useTranslations("phoneMsg");
  const label = useEphemeralLabel();
  const mute = useMute(view);
  const router = useRouter();
  const [sheet, setSheet] = useState<SettingsSheet>(null);
  const shared = sharedOf(view);
  const count = shared.photos.length + shared.links.length + shared.docs.length;
  const who = view.who;
  const search = `/app/messages/${view.id}?chercher=1`;
  return (
    <div className="nb-page nb-ms nb-ms-infos">
      <header className="nb-ms-infos-h">
        <PhoneBack fallback={`/app/messages/${view.id}`} label={t("back")} />
      </header>
      <div className="nb-ms-infos-qui">
        <WhoAvatar who={who} size={96} />
        <WhoName who={who} />
        {who.line ? <span className="nb-meta">{who.line}</span> : null}
        {who.status ? (
          <span className="nb-ms-statut" data-enligne={who.online ? "" : undefined}>
            {who.status}
          </span>
        ) : null}
      </div>
      <div className="nb-ms-infos-act">
        {who.href ? (
          <Link href={who.href}>
            <PhoneIcon name={who.org ? "organisation" : "personne"} size={22} stroke={1.8} />
            {who.org ? t("infos.page") : t("infos.profile")}
          </Link>
        ) : null}
        <Link href={search}>
          <PhoneIcon name="recherche" size={22} stroke={1.8} />
          {t("infos.search")}
        </Link>
        <button
          type="button"
          role="switch"
          aria-checked={mute.muted}
          data-on={mute.muted ? "" : undefined}
          onClick={mute.toggle}
        >
          <PhoneIcon name="muet" size={22} stroke={1.8} />
          {mute.muted ? t("infos.silent") : t("infos.sound")}
        </button>
      </div>
      <Link href={`/app/messages/${view.id}/medias`} className="nb-ms-it nb-ms-it-haut">
        {t("infos.medias")}
        <span className="nb-meta nb-ms-v">
          {count}
          <PhoneIcon name="chevron" size={16} />
        </span>
      </Link>
      {shared.photos.length ? (
        <div className="nb-ms-infos-vign">
          {shared.photos.slice(0, 4).map((item) => (
            <Link
              key={`${item.message.id}-${item.index}`}
              href={`/app/messages/${view.id}/medias`}
              aria-label={t("infos.openMedias")}
            >
              <img src={item.photo.src} alt="" loading="lazy" />
            </Link>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className="nb-ms-it"
        role="switch"
        aria-checked={mute.muted}
        onClick={mute.toggle}
      >
        <span className="nb-ms-grow">{t("menu.mute")}</span>
        <Toggle on={mute.muted} />
      </button>
      {view.kind === "peer" ? (
        <button type="button" className="nb-ms-it" onClick={() => setSheet("ephem")}>
          {t("menu.ephemeral")}
          <span className="nb-meta nb-ms-v">
            {label(view.ephemeral)}
            <PhoneIcon name="chevron" size={16} />
          </span>
        </button>
      ) : null}
      <button type="button" className="nb-ms-it" onClick={() => setSheet("plus")}>
        {t("menu.more")}
        <span className="nb-meta nb-ms-v">
          <PhoneIcon name="chevron" size={16} />
        </span>
      </button>
      <ConversationSheets
        target={view}
        sheet={sheet}
        setSheet={setSheet}
        onSearch={() => router.push(search)}
        mute={mute}
      />
    </div>
  );
}
