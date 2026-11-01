"use client";

import "@/styles/fil-partage.css";
import { useTranslations } from "next-intl";
import { useState, useTransition, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { shareProfileAction } from "@/server/actions/feed";
import { PhoneSheet } from "../sheet";
import { PhoneIcon } from "../icon";
import { FilAvatar } from "../fil/avatar";
import { BrandIcon } from "../fil/share";
import type { SendTarget } from "../fil/sheets";
import type { CareerView } from "./data";

/**
 * « Partager mon profil » (Ephraïm, 01/11/2026, like Instagram): no link card, no long text. On
 * top, the people of the person's conversations, to send the profile to them in the chat; below,
 * a row of round icons in Jumanly's colours (pastel tiles of the site menu): copy the link,
 * WhatsApp, LinkedIn, Facebook, e-mail, QR code, PDF. Nothing is sent without the person's touch.
 */
export function ShareSheet({
  open,
  onClose,
  name,
  share,
  targets,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  share: CareerView["share"];
  targets: SendTarget[];
}) {
  const t = useTranslations("phoneCareer");
  const [qr, setQr] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const text = t("shareText", { url: share.url });
  const encoded = encodeURIComponent(share.url);
  // Those the person already writes to first, as on Instagram.
  const people = [...targets].sort((a, b) => Number(b.talked) - Number(a.talked));

  const close = () => {
    setQr(false);
    setPicked([]);
    onClose();
  };

  const toggle = (id: string) =>
    setPicked((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const send = () =>
    start(async () => {
      const result = await shareProfileAction(picked);
      if (!result.ok) {
        showToast({ message: t("shareError"), tone: "error" });
        return;
      }
      const one = targets.find((target) => target.conversationId === picked[0]);
      close();
      showToast({
        message:
          result.value === 1 && one
            ? t("shareSentTo", { name: one.name.split(" ")[0] ?? one.name })
            : t("shareSent", { count: result.value }),
      });
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share.url);
      showToast({ message: t("shareCopied") });
    } catch {}
  };
  const external = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  const options: {
    key: string;
    label: string;
    icon: ReactNode;
    run?: () => void;
    href?: string;
  }[] = [
    {
      key: "copy",
      label: t("shareCopyShort"),
      icon: <PhoneIcon name="lien" size={24} stroke={2} />,
      run: () => void copy(),
    },
    {
      key: "whatsapp",
      label: t("shareWhatsapp"),
      icon: <BrandIcon name="whatsapp" />,
      run: () => external(`https://wa.me/?text=${encodeURIComponent(text)}`),
    },
    {
      key: "linkedin",
      label: t("shareLinkedin"),
      icon: <BrandIcon name="linkedin" />,
      run: () => external(`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`),
    },
    {
      key: "facebook",
      label: t("shareFacebook"),
      icon: <BrandIcon name="facebook" />,
      run: () => external(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`),
    },
    {
      key: "email",
      label: t("shareEmail"),
      icon: <PhoneIcon name="email" size={23} stroke={2} />,
      href: `mailto:?subject=${encodeURIComponent(
        t("shareEmailSubject", { name }),
      )}&body=${encodeURIComponent(text)}`,
    },
    {
      key: "qr",
      label: t("shareQrShort"),
      icon: <QrGlyph />,
      run: () => setQr(true),
    },
    ...(share.pdf
      ? [
          {
            key: "pdf",
            label: t("sharePdfShort"),
            icon: <PhoneIcon name="telecharger" size={23} stroke={2.2} />,
            href: share.pdf,
          },
        ]
      : []),
  ];

  return (
    <PhoneSheet open={open} onClose={close} label={t("shareTitle")} closeLabel={t("close")}>
      <b className="nb-ex-feuille-t nb-pp-titre">{t("shareTitle")}</b>
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
        <div className="nb-pp">
          <h3 className="sr-only">{t("shareSendTo")}</h3>
          {people.length === 0 ? (
            <p className="nb-meta nb-pp-vide">{t("shareSendEmpty")}</p>
          ) : (
            <ul className="nb-pp-gens" data-rangee="">
              {people.map((target) => {
                const on = picked.includes(target.conversationId);
                return (
                  <li key={target.conversationId}>
                    <button
                      type="button"
                      className="nb-pt-personne"
                      aria-pressed={on}
                      aria-label={t("sharePick", { name: target.name })}
                      onClick={() => toggle(target.conversationId)}
                    >
                      <span className="nb-pt-photo">
                        <FilAvatar
                          initials={target.initials}
                          image={target.image}
                          tone={target.tone}
                          org={false}
                          size={58}
                        />
                        <span className="nb-pt-coche" aria-hidden>
                          <PhoneIcon name="coche" size={14} stroke={3} />
                        </span>
                      </span>
                      <span className="nb-pt-nom">{target.name.split(" ")[0]}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {picked.length > 0 ? (
            <button
              type="button"
              className="nb-pt-envoyer nb-pp-envoyer"
              disabled={pending}
              aria-busy={pending}
              onClick={send}
            >
              {t("shareSend", { count: picked.length })}
            </button>
          ) : (
            <div
              className="nb-pp-icones"
              role="group"
              aria-label={t("shareOutside")}
              data-rangee=""
            >
              {options.map((item) => {
                const inner = (
                  <>
                    <span className="nb-pp-rond" aria-hidden>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </>
                );
                return item.href ? (
                  <a
                    key={item.key}
                    href={item.href}
                    data-cle={item.key}
                    {...(item.key === "pdf" ? { download: "" } : {})}
                  >
                    {inner}
                  </a>
                ) : (
                  <button key={item.key} type="button" data-cle={item.key} onClick={item.run}>
                    {inner}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </PhoneSheet>
  );
}

/** A small QR code drawn in two tones. */
function QrGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5" />
        <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5" />
        <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5" />
      </g>
      <g fill="currentColor">
        <rect x="14" y="14" width="2.6" height="2.6" rx="0.6" />
        <rect x="17.9" y="17.9" width="2.6" height="2.6" rx="0.6" />
        <rect x="14" y="17.9" width="2.6" height="2.6" rx="0.6" />
        <rect x="17.9" y="14" width="2.6" height="2.6" rx="0.6" />
      </g>
    </svg>
  );
}
