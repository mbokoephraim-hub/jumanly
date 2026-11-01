"use client";

/* eslint-disable @next/next/no-img-element -- previews of the photos chosen on the phone */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import {
  sendCertificateAction,
  sendOwnDocumentAction,
  sendPhotosAction,
  sendRdvAction,
  sendUploadAction,
  type MsgResult,
} from "@/server/actions/messages-phone";
import { MenuArt, type MenuArtName } from "@/components/site/menu-art";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { MeetingPicker } from "./agenda";
import { shrinkPhoto } from "./media";
import { SheetBack } from "./parts";
import type { AttachDoc, ThreadView } from "./types";

export type AttachSheet = "joindre" | "photos" | "docs" | "cv" | "attestation" | "agenda" | null;

/** The six tiles of « Joindre »: the coloured drawings of the website's menu. */
const TILES = [
  ["photo", "photo"],
  ["camera", "camera"],
  ["document", "document"],
  ["cv", "cv"],
  ["certificate", "certificate"],
  ["meeting", "calendar"],
] as const satisfies readonly (readonly [string, MenuArtName])[];

type Picked = { file: File; url: string; on: boolean };

/** The error of a sending, said simply. */
export function useSendError() {
  const t = useTranslations("phoneMsg");
  return (result: MsgResult | null) => {
    const error = result && !result.ok ? result.error : "failed";
    const key =
      error === "tooMany"
        ? "errors.tooMany"
        : error === "blocked"
          ? "errors.blocked"
          : error === "type"
            ? "errors.type"
            : error === "size"
              ? "errors.size"
              : "error";
    showToast({ message: t(key), tone: "error" });
  };
}

/**
 * « Joindre » (planche Chat-joindre): Photo, Appareil, Document, Mon CV, Attestation,
 * Rendez-vous; then the photos chosen on the phone (with « HD »), the documents, the CVs, the
 * attestations of the courses finished and the proposal of a meeting. The phone's photos come only
 * through the person's own choice: Jumanly never reads the gallery by itself.
 */
export function AttachSheets({
  view,
  sheet,
  setSheet,
  onCamera,
}: {
  view: ThreadView;
  sheet: AttachSheet;
  setSheet: (sheet: AttachSheet) => void;
  /** « Appareil »: the camera of the conversation. */
  onCamera: () => void;
}) {
  const t = useTranslations("phoneMsg");
  const tc = useTranslations("phoneChat.attach");
  const sendError = useSendError();
  const [picked, setPicked] = useState<Picked[]>([]);
  const [hd, setHd] = useState(false);
  const [pending, start] = useTransition();
  const photoInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const close = () => setSheet(null);

  useEffect(
    () => () => {
      for (const item of picked) URL.revokeObjectURL(item.url);
    },
    [picked],
  );

  const chosen = picked.filter((item) => item.on);

  const run = (task: () => Promise<MsgResult>, done: string, after?: () => void) =>
    start(async () => {
      const result = await task().catch(() => null);
      if (!result?.ok) {
        sendError(result);
        return;
      }
      close();
      after?.();
      showToast({ message: done });
    });

  const sendPhotos = () => {
    const files = chosen.slice(0, 4).map((item) => item.file);
    if (files.length === 0) return;
    run(
      async () => {
        const form = new FormData();
        form.set("conversation", view.id);
        form.set("hd", hd ? "1" : "0");
        for (const file of files) form.append("photo", await shrinkPhoto(file, hd), "photo.jpg");
        return sendPhotosAction(form);
      },
      hd
        ? t("attach.photosSentHd", { count: files.length })
        : t("attach.photosSent", { count: files.length }),
      () => setPicked([]),
    );
  };

  const sendFile = (file: File) =>
    run(() => {
      const form = new FormData();
      form.set("conversation", view.id);
      form.set("file", file);
      return sendUploadAction(form);
    }, t("attach.docSent"));

  const docLine = (doc: AttachDoc, done: string, send: () => Promise<MsgResult>) => (
    <button
      key={doc.id}
      type="button"
      className="nb-opt"
      disabled={pending}
      onClick={() => run(send, done)}
    >
      <span className="nb-ms-ext" aria-hidden>
        {t("pdf")}
      </span>
      <span>
        {doc.title}
        <small>{doc.line}</small>
      </span>
    </button>
  );

  const tile = (key: (typeof TILES)[number][0]) => {
    switch (key) {
      case "photo":
        return () => (picked.length ? setSheet("photos") : photoInput.current?.click());
      case "camera":
        return () => {
          close();
          onCamera();
        };
      case "document":
        return () => setSheet("docs");
      case "cv":
        return () => setSheet("cv");
      case "certificate":
        return () => setSheet("attestation");
      case "meeting":
        return () => setSheet("agenda");
    }
  };

  const label =
    sheet === "joindre" || sheet === null
      ? tc("title")
      : sheet === "photos"
        ? tc("photos")
        : sheet === "attestation"
          ? tc("certificates")
          : t(`attach.sheet.${sheet}`);
  const back = <SheetBack label={tc("title")} onClick={() => setSheet("joindre")} />;

  return (
    <PhoneSheet open={sheet !== null} onClose={close} label={label} closeLabel={t("close")}>
      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          const files = [...(event.target.files ?? [])].slice(0, 8);
          event.target.value = "";
          if (files.length === 0) return;
          setPicked((current) =>
            [
              ...files.map((file, index) => ({
                file,
                url: URL.createObjectURL(file),
                on: index < 4,
              })),
              ...current,
            ].slice(0, 8),
          );
          setSheet("photos");
        }}
      />
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,image/*,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) sendFile(file);
        }}
      />

      {sheet === "joindre" ? (
        <div className="nb-ch-joindre">
          {TILES.map(([key, art], index) => (
            <button
              key={key}
              type="button"
              onClick={tile(key)}
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <MenuArt name={art} size="md" />
              <b>{tc(`${key}.title`)}</b>
              <small>{tc(`${key}.sub`)}</small>
            </button>
          ))}
        </div>
      ) : null}

      {sheet === "photos" ? (
        <div className="nb-ms-joindre">
          {back}
          <div className="nb-ms-recentes-h">
            <b>{tc("photos")}</b>
            <span className="nb-meta">
              {chosen.length ? t("attach.picked", { count: chosen.length }) : t("attach.touch")}
            </span>
          </div>
          <div className="nb-ms-galerie">
            {picked.map((item, index) => {
              const rank = chosen.indexOf(item);
              return (
                <button
                  key={item.url}
                  type="button"
                  aria-label={t("attach.pick")}
                  aria-pressed={item.on}
                  onClick={() =>
                    setPicked((current) =>
                      current.map((other, at) =>
                        at === index
                          ? { ...other, on: !other.on && chosen.length < 4 ? true : false }
                          : other,
                      ),
                    )
                  }
                >
                  <img src={item.url} alt="" />
                  <span className="nb-ms-num">{rank >= 0 ? rank + 1 : ""}</span>
                </button>
              );
            })}
            <button
              type="button"
              className="nb-ms-galerie-plus"
              aria-label={t("attach.more")}
              onClick={() => photoInput.current?.click()}
            >
              <PhoneIcon name="plus" size={24} />
            </button>
          </div>
          {chosen.length ? (
            <div className="nb-ms-envoi">
              <button
                type="button"
                className="nb-rond"
                aria-label={t("attach.cancelPick")}
                onClick={() =>
                  setPicked((current) => current.map((item) => ({ ...item, on: false })))
                }
              >
                <PhoneIcon name="fermer" size={20} stroke={2} />
              </button>
              <button
                type="button"
                className="nb-ms-hdb"
                aria-pressed={hd}
                aria-label={t("attach.hdLabel")}
                onClick={() => setHd(!hd)}
              >
                {t("hd")}
              </button>
              <button type="button" className="nb-bp" disabled={pending} onClick={sendPhotos}>
                {t("attach.send", { count: Math.min(chosen.length, 4) })}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {sheet === "docs" ? (
        <div>
          {back}
          <h2 className="nb-ms-sht">{t("attach.sheet.docs")}</h2>
          <p className="nb-meta nb-ms-shtnote">{t("attach.phone")}</p>
          <button
            type="button"
            className="nb-opt"
            disabled={pending}
            onClick={() => fileInput.current?.click()}
          >
            <span className="nb-ms-ext" data-ton="choisir" aria-hidden>
              <PhoneIcon name="plus" size={18} stroke={2} />
            </span>
            <span>
              {t("attach.pickFile")}
              <small>{tc("pickFileNote")}</small>
            </span>
          </button>
          {view.documents.length ? (
            <>
              <p className="nb-meta nb-ms-shtnote nb-ms-shtsec">{t("attach.jumanly")}</p>
              {view.documents.map((doc) =>
                docLine(doc, t("attach.docSent"), () => sendOwnDocumentAction(view.id, doc.id)),
              )}
            </>
          ) : null}
        </div>
      ) : null}

      {sheet === "cv" ? (
        <div>
          {back}
          <h2 className="nb-ms-sht">{t("attach.sheet.cv")}</h2>
          {view.cvs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              className="nb-opt"
              disabled={pending}
              onClick={() =>
                run(
                  () => sendOwnDocumentAction(view.id, doc.id),
                  t("attach.cvSent", { name: doc.title }),
                )
              }
            >
              <span className="nb-ms-cvmini" aria-hidden>
                <i />
                <i />
                <i />
                <i />
              </span>
              <span>
                {doc.title}
                <small>{doc.line}</small>
              </span>
            </button>
          ))}
          {view.cvs.length === 0 ? (
            <p className="nb-meta nb-ms-shtnote">{t("attach.noCv")}</p>
          ) : null}
          <Link href="/app/career/cv/nouveau" className="nb-ms-plus" onClick={close}>
            {t("attach.newCv")}
          </Link>
        </div>
      ) : null}

      {sheet === "attestation" ? (
        <div>
          {back}
          <h2 className="nb-ms-sht">{tc("certificates")}</h2>
          {view.certificates.map((doc) =>
            docLine(doc, tc("certificateSent"), () => sendCertificateAction(view.id, doc.id)),
          )}
          {view.certificates.length === 0 ? (
            <p className="nb-meta nb-ms-shtnote">{tc("noCertificates")}</p>
          ) : null}
        </div>
      ) : null}

      {sheet === "agenda" ? (
        <div>
          {back}
          <h2 className="nb-ms-sht">{t("attach.sheet.agenda")}</h2>
          <MeetingPicker
            firstDay={view.days[0]?.value ?? ""}
            pending={pending}
            onSend={(input) => run(() => sendRdvAction(view.id, input), t("agenda.sent"))}
          />
        </div>
      ) : null}
    </PhoneSheet>
  );
}
