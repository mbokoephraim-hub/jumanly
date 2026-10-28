"use client";

/* eslint-disable @next/next/no-img-element -- the photo just chosen, shown before sending */
import { useTranslations } from "next-intl";
import { useRef } from "react";
import {
  FEED_BODY_GOOD_MAX,
  FEED_BODY_GOOD_MIN,
  FEED_BODY_MAX,
  FEED_TITLE_MAX,
  bodyLength,
} from "@/server/services/feed-limits";
import { PhoneIcon } from "../icon";
import { FilAvatar } from "./avatar";

/**
 * The title and the text of a new post (docs/fil-menu-publication § 2, planche Publier): each with
 * its counter (49/60, 129/160), a gauge that aims at about 120 characters under the text.
 */
export function PostTextFields({
  title,
  body,
  onTitle,
  onBody,
  id = "fil-pub",
}: {
  title: string;
  body: string;
  onTitle: (value: string) => void;
  onBody: (value: string) => void;
  id?: string;
}) {
  const t = useTranslations("phoneFil.publish");
  const length = bodyLength(body.length);
  const titleTone = title.length > FEED_TITLE_MAX - 5 ? "ambre" : undefined;
  const bodyTone =
    body.length > FEED_BODY_GOOD_MAX
      ? "ambre"
      : body.length >= FEED_BODY_GOOD_MIN
        ? "lime"
        : undefined;
  return (
    <div className="nb-fil-champs">
      <div className="nb-fil-champ-tete">
        <label htmlFor={`${id}-titre`}>{t("titleLabel")}</label>
        <span data-ton={titleTone} aria-hidden>
          {t("counter", { count: title.length, max: FEED_TITLE_MAX })}
        </span>
      </div>
      <textarea
        id={`${id}-titre`}
        className="nb-fil-champ nb-fil-champ-titre"
        value={title}
        onChange={(event) => onTitle(event.target.value.replace(/\n/g, " "))}
        maxLength={FEED_TITLE_MAX}
        rows={2}
        placeholder={t("titlePlaceholder")}
        aria-describedby={`${id}-titre-compte`}
      />
      <span id={`${id}-titre-compte`} className="sr-only">
        {t("counterLong", { count: title.length, max: FEED_TITLE_MAX })}
      </span>
      <div className="nb-fil-champ-tete">
        <label htmlFor={`${id}-texte`}>{t("bodyLabel")}</label>
        <span data-ton={bodyTone} aria-hidden>
          {t("counter", { count: body.length, max: FEED_BODY_MAX })}
        </span>
      </div>
      <textarea
        id={`${id}-texte`}
        className="nb-fil-champ"
        value={body}
        onChange={(event) => onBody(event.target.value)}
        maxLength={FEED_BODY_MAX}
        rows={4}
        placeholder={t("placeholder")}
        aria-describedby={`${id}-aide`}
      />
      <div className="nb-fil-jauge" aria-hidden>
        <span
          data-ton={bodyTone}
          style={{ width: `${Math.round((body.length / FEED_BODY_MAX) * 100)}%` }}
        />
        <i />
      </div>
      <p id={`${id}-aide`} className="nb-meta nb-fil-aide" aria-live="polite">
        <span className="sr-only">
          {t("counterLong", { count: body.length, max: FEED_BODY_MAX })}{" "}
        </span>
        {t(`bodyHint.${length}`)}
      </p>
    </div>
  );
}

/** « Image · elle prend la forme arrondie du Fil »: the photo chosen, and « + » to choose one. */
export function PostImagePicker({
  photo,
  onFile,
  onRemove,
  busy,
}: {
  photo: { preview: string } | null;
  onFile: (file: File | undefined) => void;
  onRemove: () => void;
  busy: boolean;
}) {
  const t = useTranslations("phoneFil.publish");
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="nb-fil-images">
      <span className="nb-fil-images-t">{t("imageLabel")}</span>
      <div className="nb-fil-tuiles">
        {photo ? (
          <span className="nb-fil-tuile" data-choisie="">
            <img src={photo.preview} alt={t("imageChosen")} />
            <button type="button" className="nb-rond" aria-label={t("remove")} onClick={onRemove}>
              <PhoneIcon name="fermer" size={16} />
            </button>
          </span>
        ) : null}
        <button
          type="button"
          className="nb-fil-tuile nb-fil-tuile-plus"
          aria-label={photo ? t("imageChange") : t("imageAdd")}
          aria-busy={busy || undefined}
          onClick={() => input.current?.click()}
        >
          <PhoneIcon name="plus" size={26} stroke={2} />
        </button>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => {
            onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/** « Aperçu dans le Fil »: the post as it will look, with the photo cut to the Fil's shape. */
export function PostPreview({
  author,
  title,
  body,
  image,
}: {
  author: { name: string; initials: string; image: string | null; org: boolean };
  title: string;
  body: string;
  image: string | null;
}) {
  const t = useTranslations("phoneFil.publish");
  const tf = useTranslations("phoneFil");
  return (
    <section className="nb-fil-apercu" aria-label={t("preview")}>
      <h2 className="nb-fil-apercu-t">{t("preview")}</h2>
      <div className="nb-fil-post" aria-hidden>
        <div className="nb-fil-ph">
          <span className="nb-fil-anneau" data-moi="">
            <FilAvatar
              initials={author.initials}
              image={author.image}
              tone={0}
              org={author.org}
              me={!author.org}
              size={39}
            />
          </span>
          <span className="nb-fil-qui">
            <b className="nb-fil-nom">{author.name}</b>
            <small className="nb-fil-ligne">{tf("time.now")}</small>
          </span>
        </div>
        <div className="nb-fil-pb">
          <p className="nb-fil-titre">{title.trim() || t("previewTitle")}</p>
          <p className="nb-fil-apercu-texte">{body.trim() || t("previewBody")}</p>
          {image ? (
            <div className="nb-fil-im">
              <img src={image} alt="" />
              <i className="nb-fil-k1" />
              <i className="nb-fil-k2" />
              <div className="nb-fil-encoche">
                <span className="nb-fil-ab">
                  <PhoneIcon name="jaime" size={25} stroke={1.9} />
                </span>
                <span className="nb-fil-ab">
                  <PhoneIcon name="repondre" size={23} stroke={1.9} />
                </span>
                <span className="nb-fil-ab">
                  <PhoneIcon name="partager" size={22} stroke={1.9} />
                </span>
                <span className="nb-fil-ab" data-garde="">
                  <PhoneIcon name="signet" size={20} stroke={1.9} />
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
