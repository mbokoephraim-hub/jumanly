"use client";

/* eslint-disable @next/next/no-img-element -- a photo of a conversation, served privately */
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { forwardAction } from "@/server/actions/messages-phone";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import type { Open } from "./bubble";
import { WhoAvatar, WhoName } from "./parts";
import type { MessageView, WhoView } from "./types";

/**
 * The full-screen view of a photo or a document of a conversation (planche Messages-medias):
 * « Transférer » to another conversation, « Enregistrer » on the phone. Échap or « Fermer » closes.
 */
export function MediaViewer({
  conversationId,
  open,
  messages,
  title,
  forwardTo,
  onClose,
}: {
  conversationId: string;
  open: Open | null;
  messages: MessageView[];
  title: string;
  forwardTo: { id: string; who: WhoView }[];
  onClose: () => void;
}) {
  const t = useTranslations("phoneMsg.viewer");
  const tm = useTranslations("phoneMsg");
  const dialog = useRef<HTMLDialogElement>(null);
  const [forwarding, setForwarding] = useState(false);
  const [pending, start] = useTransition();
  const message = open ? messages.find((item) => item.id === open.messageId) : undefined;
  const bubble = message?.bubble;

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && message && !node.open) node.showModal();
    if ((!open || !message) && node.open) node.close();
  }, [open, message]);

  const photo =
    open?.kind === "photo" && bubble?.kind === "photos" ? bubble.photos[open.index] : null;
  const doc = open?.kind === "doc" && bubble?.kind === "doc" ? bubble : null;
  const saveHref = photo ? `${photo.src}&dl=1` : doc ? doc.href : "";

  const forward = (to: { id: string; who: WhoView }) => {
    if (!message) return;
    start(async () => {
      const result = await forwardAction(conversationId, message.id, to.id).catch(() => null);
      if (!result?.ok) {
        showToast({ message: tm("error"), tone: "error" });
        return;
      }
      setForwarding(false);
      onClose();
      showToast({ message: t("forwarded", { name: to.who.name }) });
    });
  };

  return (
    <>
      <dialog
        ref={dialog}
        className="nb-ms-vue"
        aria-label={doc ? doc.name : title}
        onClose={onClose}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
        {open && message ? (
          <>
            <div className="nb-ms-vue-h">
              <button type="button" className="nb-rond" aria-label={tm("close")} onClick={onClose}>
                <PhoneIcon name="fermer" size={22} stroke={2} />
              </button>
              <span>
                <b>{doc ? doc.name : title}</b>
                <span className="nb-meta">
                  {doc ? doc.meta : t("photoOf", { date: message.time })}
                </span>
              </span>
            </div>
            <div className="nb-ms-vue-c">
              {photo ? <img src={photo.src} alt="" /> : null}
              {doc ? (
                <a
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nb-ms-vue-doc"
                >
                  <span className="nb-ms-ext" aria-hidden>
                    {doc.ext || tm("pdf")}
                  </span>
                  <b>{doc.name}</b>
                  <span>{t("openDoc")}</span>
                </a>
              ) : null}
            </div>
            <div className="nb-ms-vue-b">
              <button type="button" className="nb-bs" onClick={() => setForwarding(true)}>
                {t("forward")}
              </button>
              <a
                href={saveHref}
                download
                className="nb-bp"
                onClick={() => showToast({ message: t("saved") })}
              >
                {t("save")}
              </a>
            </div>
          </>
        ) : null}
      </dialog>
      <PhoneSheet
        open={forwarding}
        onClose={() => setForwarding(false)}
        label={t("forwardTitle")}
        closeLabel={tm("close")}
      >
        <h2 className="nb-ms-sht">{t("forwardTitle")}</h2>
        {forwardTo.map((item) => (
          <button
            key={item.id}
            type="button"
            className="nb-opt"
            disabled={pending}
            onClick={() => forward(item)}
          >
            <WhoAvatar who={item.who} size={40} />
            <span>
              <WhoName who={item.who} as="span" />
              <small>{item.who.line}</small>
            </span>
          </button>
        ))}
        {forwardTo.length === 0 ? <p className="nb-meta">{t("nobody")}</p> : null}
      </PhoneSheet>
    </>
  );
}
