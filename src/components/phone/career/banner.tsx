"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { removeCareerBannerAction, saveCareerBannerAction } from "@/server/actions/career-phone";
import { PhoneSheet } from "../sheet";

/** The banner's shape on the phone: 5 by 2, kept by every screen that shows it. */
const WIDTH = 1200;
const HEIGHT = 480;

/** Cuts a picture to a 1200 × 480 JPEG (its middle) on the phone before sending it. */
async function wide(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = WIDTH / HEIGHT;
  const fromWidth = Math.min(bitmap.width, bitmap.height * ratio);
  const fromHeight = fromWidth / ratio;
  const width = Math.min(WIDTH, Math.round(fromWidth));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.round(width / ratio);
  canvas
    .getContext("2d")
    ?.drawImage(
      bitmap,
      (bitmap.width - fromWidth) / 2,
      (bitmap.height - fromHeight) / 2,
      fromWidth,
      fromHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("banner"))),
      "image/jpeg",
      0.85,
    ),
  );
}

/** The drawn banner of the Modèle B, shown while the person has not chosen a picture. */
export function DrawnBanner({ opacity = 0.18 }: { opacity?: number }) {
  return (
    <svg viewBox="0 0 390 150" preserveAspectRatio="none" aria-hidden>
      <g fill="none" stroke="#fff" strokeOpacity={opacity} strokeWidth="2">
        <path d="M0 70 C 90 30, 180 110, 270 60 S 390 40, 390 40" />
        <path d="M0 100 C 100 60, 190 140, 280 90 S 390 70, 390 70" />
      </g>
    </svg>
  );
}

/**
 * « Changer la bannière » at the top of « Modifier le profil »: the banner as others see it, and a
 * sheet to take a picture, choose one, or go back to the drawn banner. Saved at once, like the photo.
 */
export function BannerField({ banner }: { banner: string | null }) {
  const t = useTranslations("phoneCareer.form");
  const router = useRouter();
  const [image, setImage] = useState(banner);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);

  const send = (file: File | undefined) => {
    if (!file) return;
    setOpen(false);
    start(async () => {
      try {
        const blob = await wide(file);
        const data = new FormData();
        data.append("banner", new File([blob], "banniere.jpg", { type: "image/jpeg" }));
        const result = await saveCareerBannerAction(data);
        if (!result.ok) throw new Error(result.error);
        setImage(URL.createObjectURL(blob));
        showToast({ message: t("bannerSaved") });
        router.refresh();
      } catch {
        showToast({ message: t("bannerError"), tone: "error" });
      }
    });
  };

  return (
    <div className="nb-ca-form-banniere">
      <div className="nb-ca-form-banniere-i" data-image={image ? "" : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element -- the person's own upload */}
        {image ? <img src={image} alt="" /> : <DrawnBanner />}
      </div>
      <button type="button" onClick={() => setOpen(true)} disabled={pending} aria-busy={pending}>
        {t("bannerChange")}
      </button>

      <PhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        label={t("bannerTitle")}
        closeLabel={t("close")}
      >
        <b className="nb-ex-feuille-t">{t("bannerTitle")}</b>
        <p className="nb-meta nb-ca-form-banniere-txt">{t("bannerText")}</p>
        <button type="button" className="nb-opt nb-fil-opt" onClick={() => camera.current?.click()}>
          {t("bannerCamera")}
        </button>
        <button
          type="button"
          className="nb-opt nb-fil-opt"
          onClick={() => gallery.current?.click()}
        >
          {t("bannerGallery")}
        </button>
        {image ? (
          <button
            type="button"
            className="nb-opt nb-fil-opt"
            data-danger=""
            onClick={() => {
              setOpen(false);
              start(async () => {
                const result = await removeCareerBannerAction().catch(() => null);
                if (!result?.ok) {
                  showToast({ message: t("error"), tone: "error" });
                  return;
                }
                setImage(null);
                showToast({ message: t("bannerRemoved") });
                router.refresh();
              });
            }}
          >
            {t("bannerRemove")}
          </button>
        ) : null}
        <button
          type="button"
          className="nb-opt nb-fil-opt"
          data-gris=""
          onClick={() => setOpen(false)}
        >
          {t("cancel")}
        </button>
      </PhoneSheet>
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        data-banniere=""
        onChange={(event) => send(event.target.files?.[0])}
      />
      <input
        ref={gallery}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        data-banniere=""
        onChange={(event) => send(event.target.files?.[0])}
      />
    </div>
  );
}
