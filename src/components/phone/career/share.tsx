"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { showToast } from "@/components/motion/toaster";
import { PhoneSheet } from "../sheet";
import type { CareerView } from "./data";

/**
 * « Partager mon profil » (planche Carrière-partager): the link, the usual apps, the QR code for a
 * job fair, and the PDF of the CV used by default. Nothing is sent without the person's touch.
 */
export function ShareSheet({
  open,
  onClose,
  name,
  share,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  share: CareerView["share"];
}) {
  const t = useTranslations("phoneCareer");
  const [qr, setQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = t("shareText", { url: share.url });
  const encoded = encodeURIComponent(share.url);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      showToast({ message: t("shareCopied") });
    } catch {}
  };

  return (
    <PhoneSheet
      open={open}
      onClose={() => {
        setQr(false);
        onClose();
      }}
      label={t("shareTitle")}
      closeLabel={t("close")}
    >
      <b className="nb-ex-feuille-t">{t("shareTitle")}</b>
      {qr ? (
        <div className="nb-ca-qr">
          <span
            role="img"
            aria-label={t("shareQrAlt", { name })}
            // The SVG is drawn on the server by `qrcode` from the person's own link.
            dangerouslySetInnerHTML={{ __html: share.qr }}
          />
          <p className="nb-meta">{t("shareQrText")}</p>
          <button type="button" className="nb-bouton" data-large="" onClick={() => setQr(false)}>
            {t("back")}
          </button>
        </div>
      ) : (
        <>
          <div className="nb-ca-carte-lien">
            <b>{name}</b>
            <small>{share.url.replace(/^https?:\/\//, "")}</small>
          </div>
          {!share.open ? <p className="nb-meta nb-ca-note">{t("sharePrivate")}</p> : null}
          <button type="button" className="nb-opt nb-fil-opt" onClick={copy}>
            {copied ? t("shareCopied") : t("shareCopy")}
          </button>
          <a
            className="nb-opt nb-fil-opt"
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("shareWhatsapp")}
          </a>
          <a
            className="nb-opt nb-fil-opt"
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("shareLinkedin")}
          </a>
          <a
            className="nb-opt nb-fil-opt"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("shareFacebook")}
          </a>
          <a
            className="nb-opt nb-fil-opt"
            href={`mailto:?subject=${encodeURIComponent(
              t("shareEmailSubject", { name }),
            )}&body=${encodeURIComponent(text)}`}
          >
            {t("shareEmail")}
          </a>
          <button type="button" className="nb-opt nb-fil-opt" onClick={() => setQr(true)}>
            <span>
              {t("shareQr")}
              <small className="nb-meta">{t("shareQrText")}</small>
            </span>
          </button>
          {share.pdf ? (
            <a className="nb-opt nb-fil-opt" href={share.pdf} download>
              {t("sharePdf")}
            </a>
          ) : null}
        </>
      )}
    </PhoneSheet>
  );
}
