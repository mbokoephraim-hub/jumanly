"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { publishAction, uploadFeedImageAction } from "@/server/actions/feed";
import { FEED_BODY_MAX, FEED_TITLE_MAX, postTextSchema } from "@/server/services/feed-limits";
import { PhoneBack } from "../back";
import { OrbiDisc, PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { FilAvatar } from "./avatar";
import type { FilMe } from "./feed";
import { Attachment } from "./post";
import { PostImagePicker, PostPreview, PostTextFields } from "./post-fields";

type Piece = { id: string; title: string; detail: string };
type Audience = "everyone" | "connections" | "nobody";
const AUDIENCES: Audience[] = ["everyone", "connections", "nobody"];

/** Reduces a photo to 1280 px (JPEG) on the phone before sending it. */
export async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("photo"))),
      "image/jpeg",
      0.85,
    ),
  );
}

/**
 * « Nouvelle publication » (planche Fil, rangée 05): the text, a photo, one of the person's works
 * or attestations, a quoted post; Orbi's draft from the last attestation; who may answer.
 */
export function PhoneCompose({
  me,
  works,
  certificates,
  quoted,
  draft,
  back,
  startWithDraft = false,
  startWork = null,
}: {
  me: FilMe;
  works: Piece[];
  certificates: Piece[];
  quoted: { id: string; name: string; body: string } | null;
  /** Orbi's draft about the latest attestation (none without one). */
  draft: { title: string; text: string; course: string; certificate: Piece } | null;
  /** Where « Annuler » goes when the page was opened directly. */
  back: string;
  /** The draft is asked from the start (« Ouvrir le brouillon » of Orbi). */
  startWithDraft?: boolean;
  /** « Partager dans le Fil » of a project (Carrière): the project is attached from the start. */
  startWork?: string | null;
}) {
  const t = useTranslations("phoneFil");
  const tc = useTranslations("phone");
  const router = useRouter();
  const withDraft = startWithDraft && draft !== null && quoted === null;
  const [title, setTitle] = useState(withDraft ? draft.title.slice(0, FEED_TITLE_MAX) : "");
  const [text, setText] = useState(withDraft ? draft.text.slice(0, FEED_BODY_MAX) : "");
  const work = works.find((item) => item.id === startWork);
  const [piece, setPiece] = useState<{ type: "work" | "certificate"; item: Piece } | null>(
    withDraft
      ? { type: "certificate", item: draft.certificate }
      : work
        ? { type: "work", item: work }
        : null,
  );
  const [photo, setPhoto] = useState<{ token: string; preview: string } | null>(null);
  const [pick, setPick] = useState<"work" | "certificate" | null>(null);
  const [audience, setAudience] = useState(0);
  const [pending, start] = useTransition();

  // A title, always (docs/fil-menu-publication § 2); the text, the photo and the rest are free.
  const ready = postTextSchema.safeParse({ title, body: text }).success;

  const choosePhoto = (file: File | undefined) => {
    if (!file) return;
    start(async () => {
      try {
        const blob = await shrink(file);
        const form = new FormData();
        form.append("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        const result = await uploadFeedImageAction(form);
        if (!result.ok) throw new Error(result.error);
        setPhoto({ token: result.value, preview: URL.createObjectURL(blob) });
      } catch {
        showToast({ message: t("publish.photoError"), tone: "error" });
      }
    });
  };

  const publish = () => {
    if (!ready) {
      showToast({ message: t("publish.empty"), tone: "error" });
      return;
    }
    start(async () => {
      const result = await publishAction({
        title,
        body: text,
        attachment: piece?.type,
        attachmentId: piece?.item.id,
        quotedId: quoted?.id,
        image: photo?.token,
        replyPolicy: AUDIENCES[audience],
      });
      if (!result.ok) {
        showToast({ message: t("toast.error"), tone: "error" });
        return;
      }
      showToast({ message: t("publish.done") });
      router.replace("/app");
    });
  };

  const chips = [
    { key: "work" as const, on: piece?.type === "work" },
    { key: "certificate" as const, on: piece?.type === "certificate" },
  ];
  const list = pick === "work" ? works : certificates;

  return (
    <div className="nb-page nb-fil nb-fil-publier-ecran">
      <header className="nb-barre nb-fil-pub-barre">
        <PhoneBack fallback={back} label={t("publish.cancel")} text={t("publish.cancel")} />
        <h1>{t("publish.title")}</h1>
      </header>
      <p className="nb-fil-pub-auteur">
        <FilAvatar initials={me.initials} image={me.image} tone={0} org={false} me size={36} />
        <b>{me.name}</b>
      </p>
      <div className="nb-fil-pub-corps">
        <PostTextFields title={title} body={text} onTitle={setTitle} onBody={setText} />
        <PostImagePicker
          photo={photo}
          onFile={choosePhoto}
          onRemove={() => setPhoto(null)}
          busy={pending}
        />
        {piece ? (
          <span className="nb-fil-pj-ligne">
            <Attachment
              value={{
                mark: piece.type === "work" ? "PF" : piece.item.title.slice(0, 3).toUpperCase(),
                title: piece.item.title,
                detail: piece.item.detail,
                tone: piece.type,
              }}
            />
            <button
              type="button"
              className="nb-rond"
              aria-label={t("publish.remove")}
              onClick={() => setPiece(null)}
            >
              <PhoneIcon name="fermer" size={18} />
            </button>
          </span>
        ) : null}
        {quoted ? (
          <span className="nb-fil-cite" aria-label={t("publish.quoting")}>
            <b>{quoted.name}</b>
            <span>{quoted.body}</span>
          </span>
        ) : null}
        <div className="nb-fil-pub-chips">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="nb-chip nb-fil-chip"
              aria-pressed={chip.on}
              onClick={() => {
                if (chip.on) setPiece(null);
                else setPick(chip.key);
              }}
            >
              {t(`publish.${chip.key}`)}
            </button>
          ))}
        </div>
      </div>
      {draft && !text && !title && !quoted ? (
        <div className="nb-fil-pub-orbi">
          <OrbiDisc size={40} />
          <span>{t("publish.orbi", { course: draft.course })}</span>
          <button
            type="button"
            data-orbi=""
            onClick={() => {
              setTitle(draft.title.slice(0, FEED_TITLE_MAX));
              setText(draft.text.slice(0, FEED_BODY_MAX));
              setPhoto(null);
              setPiece({ type: "certificate", item: draft.certificate });
            }}
          >
            {t("publish.orbiTry")}
          </button>
        </div>
      ) : null}
      <PostPreview
        author={{ name: me.name, initials: me.initials, image: me.image, org: false }}
        title={title}
        body={text}
        image={photo?.preview ?? null}
      />
      <div className="nb-fil-pub-bas">
        <button
          type="button"
          className="nb-fil-audience"
          aria-label={t("publish.audience.label", {
            audience: t(`publish.audience.${AUDIENCES[audience]}`),
          })}
          onClick={() => setAudience((audience + 1) % AUDIENCES.length)}
        >
          {t(`publish.audience.${AUDIENCES[audience]}`)}
          <PhoneIcon name="chevron" size={14} />
        </button>
        <button
          type="button"
          className="nb-bouton"
          data-plein=""
          data-attente={ready ? undefined : ""}
          aria-disabled={!ready || pending}
          onClick={publish}
        >
          {ready ? t("publish.submit") : t("publish.missingTitle")}
        </button>
      </div>
      <PhoneSheet
        open={pick !== null}
        onClose={() => setPick(null)}
        label={pick === "work" ? t("publish.pickWork") : t("publish.pickCertificate")}
        closeLabel={tc("close")}
      >
        <div className="nb-feuille-titre">
          <h2>{pick === "work" ? t("publish.pickWork") : t("publish.pickCertificate")}</h2>
        </div>
        {list.length === 0 ? (
          <>
            <p className="nb-meta nb-fil-feuille-t">
              {pick === "work" ? t("publish.noWork") : t("publish.noCertificate")}
            </p>
            <Link
              href={pick === "work" ? "/app/career/portfolio/nouvelle" : "/app/learn"}
              className="nb-fil-ouvrir"
              onClick={() => setPick(null)}
            >
              {pick === "work" ? t("publish.noWorkLink") : t("publish.noCertificateLink")}
            </Link>
          </>
        ) : (
          list.map((item) => (
            <button
              key={item.id}
              type="button"
              className="nb-opt"
              onClick={() => {
                setPiece({ type: pick!, item });
                setPick(null);
              }}
            >
              <span>
                {item.title}
                <small>{item.detail}</small>
              </span>
            </button>
          ))
        )}
        <button type="button" className="nb-annuler" onClick={() => setPick(null)}>
          {tc("cancel")}
        </button>
      </PhoneSheet>
    </div>
  );
}
