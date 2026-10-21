"use client";

/* eslint-disable @next/next/no-img-element -- the photo just chosen, shown before sending */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { publishAction, uploadFeedImageAction } from "@/server/actions/feed";
import { PhoneBack } from "../back";
import { OrbiDisc, PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { FilAvatar } from "./avatar";
import type { FilMe } from "./feed";
import { Attachment } from "./post";

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
  draft: { text: string; course: string; certificate: Piece } | null;
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
  const [text, setText] = useState(withDraft ? draft.text : "");
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
  const input = useRef<HTMLInputElement>(null);

  const ready = text.trim().length > 0 || piece !== null || photo !== null || quoted !== null;

  const choosePhoto = (file: File | undefined) => {
    if (!file) return;
    start(async () => {
      try {
        const blob = await shrink(file);
        const form = new FormData();
        form.append("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        const result = await uploadFeedImageAction(form);
        if (!result.ok) throw new Error(result.error);
        setPiece(null);
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
    { key: "photo" as const, on: photo !== null },
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
      <div className="nb-fil-pub">
        <div className="nb-fil-pub-gauche">
          <FilAvatar initials={me.initials} image={me.image} tone={0} org={false} me size={40} />
          <span className="nb-fil-fil" aria-hidden />
        </div>
        <div className="nb-fil-pub-droite">
          <b>{me.name}</b>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-label={t("publish.label")}
            placeholder={t("publish.placeholder")}
            maxLength={2000}
            rows={4}
          />
          {photo ? (
            <span className="nb-fil-pj-photo">
              <img src={photo.preview} alt={t("publish.photoAlt", { name: me.name })} />
              <button
                type="button"
                className="nb-rond"
                aria-label={t("publish.remove")}
                onClick={() => setPhoto(null)}
              >
                <PhoneIcon name="fermer" size={18} />
              </button>
            </span>
          ) : null}
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
                  if (chip.key === "photo") {
                    if (photo) setPhoto(null);
                    else input.current?.click();
                  } else if (chip.on) setPiece(null);
                  else setPick(chip.key);
                }}
              >
                {t(`publish.${chip.key}`)}
              </button>
            ))}
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => {
                choosePhoto(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>
        </div>
      </div>
      {draft && !text && !quoted ? (
        <div className="nb-fil-pub-orbi">
          <OrbiDisc size={40} />
          <span>{t("publish.orbi", { course: draft.course })}</span>
          <button
            type="button"
            data-orbi=""
            onClick={() => {
              setText(draft.text);
              setPhoto(null);
              setPiece({ type: "certificate", item: draft.certificate });
            }}
          >
            {t("publish.orbiTry")}
          </button>
        </div>
      ) : null}
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
          {t("publish.submit")}
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
              href={pick === "work" ? "/app/profil/projet" : "/app/learn"}
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
                setPhoto(null);
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
