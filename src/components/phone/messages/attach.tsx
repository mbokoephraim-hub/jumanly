"use client";

/* eslint-disable @next/next/no-img-element -- previews of the photos chosen on the phone */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import {
  sendContactAction,
  sendOrganizationAction,
  sendOwnDocumentAction,
  sendPhotosAction,
  sendRdvAction,
  sendUploadAction,
  type MsgResult,
} from "@/server/actions/messages-phone";
import { FilAvatar } from "../fil/avatar";
import { OrbiDisc, PhoneIcon, type PhoneIconName } from "../icon";
import { askOrbi } from "../orbi-bus";
import { PhoneSheet } from "../sheet";
import { shrinkPhoto } from "./media";
import { SheetBack, WhoAvatar } from "./parts";
import type { AttachDoc, ThreadView } from "./types";

export type AttachSheet =
  "joindre" | "docs" | "cv" | "lettre" | "contact" | "agenda" | "org" | null;

const CHOICES = [
  ["docs", "document", "#1E4E79"],
  ["cv", "cv", "#14745F"],
  ["lettre", "email", "#7A5C00"],
  ["contact", "personne", "#3A2A4F"],
  ["agenda", "agenda", "#B8432F"],
  ["org", "organisation", "#0F3F37"],
] as const satisfies readonly (readonly [
  Exclude<AttachSheet, null | "joindre">,
  PhoneIconName,
  string,
])[];

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
 * « Joindre » (planches Messages-joindre, -photos-hd, -sans-acces, -docs, -cv, -lettre, -contact,
 * -agenda, -org): the six choices, the photos chosen on the phone (with « HD »), then each list.
 * The phone's photos come only through the person's own choice (« Autoriser l’accès » opens the
 * phone's picker): Jumanly never reads the gallery by itself.
 */
export function AttachSheets({
  view,
  sheet,
  setSheet,
}: {
  view: ThreadView;
  sheet: AttachSheet;
  setSheet: (sheet: AttachSheet) => void;
}) {
  const t = useTranslations("phoneMsg");
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

  const docLine = (doc: AttachDoc, done: string) => (
    <button
      key={doc.id}
      type="button"
      className="nb-opt"
      disabled={pending}
      onClick={() => run(() => sendOwnDocumentAction(view.id, doc.id), done)}
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

  const hourLabel = (value: string) => t("agenda.hour", { hour: Number(value.slice(0, 2)) });
  const dayLabel = view.days.find((item) => item.value === day)?.label ?? "";
  const label =
    sheet === "joindre" || sheet === null ? t("attach.title") : t(`attach.sheet.${sheet}`);

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
        }}
      />
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) sendFile(file);
        }}
      />

      {sheet === "joindre" ? (
        <div className="nb-ms-joindre">
          <div className="nb-ms-choix6">
            {CHOICES.map(([key, icon, color]) => (
              <button key={key} type="button" className="nb-ms-type" onClick={() => setSheet(key)}>
                <span style={{ background: color }}>
                  <PhoneIcon name={icon} size={24} stroke={1.8} />
                </span>
                {t(`attach.choice.${key}`)}
              </button>
            ))}
          </div>
          <div className="nb-ms-recentes-h">
            <b>{t("attach.recent")}</b>
            <span className="nb-meta">
              {chosen.length ? t("attach.picked", { count: chosen.length }) : t("attach.touch")}
            </span>
          </div>
          {picked.length ? (
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
          ) : (
            <div className="nb-ms-acces">
              <p>{t("attach.allowText")}</p>
              <button
                type="button"
                className="nb-ms-oui"
                onClick={() => photoInput.current?.click()}
              >
                {t("attach.allow")}
              </button>
            </div>
          )}
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
          <SheetBack label={t("attach.title")} onClick={() => setSheet("joindre")} />
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
              <small>{t("attach.pickFileNote")}</small>
            </span>
          </button>
          {view.documents.length ? (
            <>
              <p className="nb-meta nb-ms-shtnote nb-ms-shtsec">{t("attach.jumanly")}</p>
              {view.documents.map((doc) => docLine(doc, t("attach.docSent")))}
            </>
          ) : null}
        </div>
      ) : null}

      {sheet === "cv" ? (
        <div>
          <SheetBack label={t("attach.title")} onClick={() => setSheet("joindre")} />
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
          <Link href="/app/career/cv/modeles?nouveau=1" className="nb-ms-plus" onClick={close}>
            {t("attach.newCv")}
          </Link>
        </div>
      ) : null}

      {sheet === "lettre" ? (
        <div>
          <SheetBack label={t("attach.title")} onClick={() => setSheet("joindre")} />
          <h2 className="nb-ms-sht">{t("attach.sheet.lettre")}</h2>
          {view.letters.map((doc) => docLine(doc, t("attach.letterSent")))}
          {view.letters.length === 0 ? (
            <p className="nb-meta nb-ms-shtnote">{t("attach.noLetter")}</p>
          ) : null}
          <div className="nb-ms-orbilettre">
            <OrbiDisc size={34} />
            <span>
              {view.company
                ? t("attach.orbiLetter", { company: view.company })
                : t("attach.orbiLetterAny")}
            </span>
            <button
              type="button"
              onClick={() => {
                close();
                askOrbi(
                  view.company
                    ? t("attach.orbiLetterAsk", { company: view.company })
                    : t("attach.orbiLetterAskAny"),
                );
              }}
            >
              {t("attach.write")}
            </button>
          </div>
        </div>
      ) : null}

      {sheet === "contact" ? (
        <div>
          <SheetBack label={t("attach.title")} onClick={() => setSheet("joindre")} />
          <h2 className="nb-ms-sht">{t("attach.sheet.contact")}</h2>
          <p className="nb-meta nb-ms-shtnote">{t("attach.fromConnections")}</p>
          {view.contacts.map((item) => (
            <button
              key={item.connectionId}
              type="button"
              className="nb-opt"
              disabled={pending}
              onClick={() =>
                run(() => sendContactAction(view.id, item.connectionId), t("attach.contactSent"))
              }
            >
              <WhoAvatar who={item.who} size={40} />
              <span>
                {item.who.name}
                <small>{item.who.line}</small>
              </span>
            </button>
          ))}
          {view.contacts.length === 0 ? (
            <p className="nb-meta nb-ms-shtnote">{t("attach.noContacts")}</p>
          ) : null}
        </div>
      ) : null}

      {sheet === "agenda" ? (
        <div>
          <SheetBack label={t("attach.title")} onClick={() => setSheet("joindre")} />
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

      {sheet === "org" ? (
        <div>
          <SheetBack label={t("attach.title")} onClick={() => setSheet("joindre")} />
          <h2 className="nb-ms-sht">{t("attach.sheet.org")}</h2>
          {view.orgs.map((org) => (
            <button
              key={org.id}
              type="button"
              className="nb-opt"
              disabled={pending}
              onClick={() =>
                run(() => sendOrganizationAction(view.id, org.id), t("attach.orgSent"))
              }
            >
              <FilAvatar initials={org.initials} image={org.image} tone={org.tone} org size={40} />
              <span>
                {org.name}
                <small>{org.line}</small>
              </span>
            </button>
          ))}
          {view.orgs.length === 0 ? (
            <p className="nb-meta nb-ms-shtnote">{t("attach.noOrgs")}</p>
          ) : null}
        </div>
      ) : null}
    </PhoneSheet>
  );
}
