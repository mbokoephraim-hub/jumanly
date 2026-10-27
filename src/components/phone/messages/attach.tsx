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
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { shrinkPhoto } from "./media";
import { SheetBack } from "./parts";
import type { AttachDoc, ThreadView } from "./types";

export type AttachSheet = "joindre" | "photos" | "docs" | "cv" | "attestation" | "agenda" | null;

/** The six tiles of « Joindre » (planche Chat-joindre): colour and drawing of each. */
const TILES = [
  ["photo", "#FF9EC7", "M4 5.5h16v13H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17M15.5 9.5v.01"],
  ["camera", "#F4C463", "M4 8.5h3l1.5-2.5h7L17 8.5h3v10H4zM12 10.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  ["document", "#7CC4FF", "M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 12.5h6M9 16h6"],
  ["cv", "#A6F26B", "M5.5 3.5h9l4 4v13h-13zM14.5 3.5v4h4M8.5 11.5h7M8.5 15h7M8.5 18h4"],
  [
    "certificate",
    "#2FD3A6",
    "M12 3.5l2.5 2 3.2.2.6 3.1 2.2 2.2-1.6 2.8.4 3.2-3 1.2-1.8 2.7-2.5-1.4-2.5 1.4-1.8-2.7-3-1.2.4-3.2L3.5 11l2.2-2.2.6-3.1 3.2-.2zM9 12l2 2 4-4",
  ],
  ["meeting", "#C3A6FF", "M4.5 6.5h15v13h-15zM4.5 10.5h15M8.5 4v4M15.5 4v4"],
] as const;

const HOURS = ["10:00", "14:00", "16:00"] as const;
const MODES = ["visio", "place", "call"] as const;

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
  const [day, setDay] = useState(view.days[1]?.value ?? view.days[0]?.value ?? "");
  const [hour, setHour] = useState<(typeof HOURS)[number]>("14:00");
  const [mode, setMode] = useState<(typeof MODES)[number]>("visio");
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

  const hourLabel = (value: string) => t("agenda.hour", { hour: Number(value.slice(0, 2)) });
  const dayLabel = view.days.find((item) => item.value === day)?.label ?? "";
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
          {TILES.map(([key, color, path], index) => (
            <button
              key={key}
              type="button"
              onClick={tile(key)}
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <span style={{ background: `${color}22`, color }} aria-hidden>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={path} />
                </svg>
              </span>
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
          <p className="nb-meta nb-ms-shtnote">{t("agenda.day")}</p>
          <div className="nb-ms-puces">
            {view.days.map((item) => (
              <button
                key={item.value}
                type="button"
                className="nb-chip"
                aria-pressed={day === item.value}
                onClick={() => setDay(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="nb-meta nb-ms-shtnote nb-ms-shtsec">{t("agenda.hourTitle")}</p>
          <div className="nb-ms-puces">
            {HOURS.map((value) => (
              <button
                key={value}
                type="button"
                className="nb-chip"
                aria-pressed={hour === value}
                onClick={() => setHour(value)}
              >
                {hourLabel(value)}
              </button>
            ))}
          </div>
          <p className="nb-meta nb-ms-shtnote nb-ms-shtsec">{t("agenda.how")}</p>
          <div className="nb-ms-puces">
            {MODES.map((value) => (
              <button
                key={value}
                type="button"
                className="nb-chip"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {t(`agenda.mode.${value}`)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="nb-bp nb-ms-go"
            disabled={pending || !day}
            onClick={() =>
              run(() => sendRdvAction(view.id, { date: day, time: hour, mode }), t("agenda.sent"))
            }
          >
            {t("agenda.send", { when: `${dayLabel}, ${hourLabel(hour)}` })}
          </button>
        </div>
      ) : null}
    </PhoneSheet>
  );
}
