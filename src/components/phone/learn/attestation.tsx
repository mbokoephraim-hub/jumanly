"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { attestationProfileAction } from "@/server/actions/learn-phone";
import { PhoneBack } from "../back";

export type AttestationView = {
  id: string;
  /** Just earned: « Bravo Grâce ! » and « Voir d’autres cours ». */
  fresh: boolean;
  hello: string;
  finished: string;
  title: string;
  holder: string;
  line: string;
  verify: string;
  verifyHref: string;
  onProfile: boolean;
  pdf: string;
  fil: string;
  back: { href: string; label: string };
  courseHref: string;
};

/**
 * « Cours terminé » and an attestation (planches Formation-fini, -attestation): the cream card with
 * the verification link, then « Ajouter à mon profil », « Partager dans le Fil » and the PDF.
 */
export function PhoneAttestation({ view }: { view: AttestationView }) {
  const t = useTranslations("phoneLearn.certificate");
  const tl = useTranslations("phoneLearn");
  const [onProfile, setOnProfile] = useState(view.onProfile);
  const [pending, start] = useTransition();

  const addToProfile = () => {
    if (onProfile) {
      showToast({ message: t("alreadyOnProfile") });
      return;
    }
    start(async () => {
      const result = await attestationProfileAction(view.id, true).catch(() => null);
      if (!result?.ok) {
        showToast({ message: tl("error"), tone: "error" });
        return;
      }
      setOnProfile(true);
      showToast({ message: t("addedToProfile") });
    });
  };

  return (
    <div className="nb-page nb-fo nb-fo-att-p">
      <header className="nb-barre nb-ex-barre">
        <PhoneBack
          fallback={view.back.href}
          label={view.back.label}
          text={view.back.label}
          history={!view.fresh}
        />
        <span className="nb-ex-vide-h" />
      </header>
      <div className="nb-fo-att-corps">
        {view.fresh ? (
          <div className="nb-fo-bravo">
            <b>{view.hello}</b>
            <p className="nb-meta">{view.finished}</p>
          </div>
        ) : null}
        <article className="nb-fo-diplome" aria-labelledby="fo-diplome">
          <svg viewBox="0 0 300 200" aria-hidden>
            <circle
              cx="150"
              cy="100"
              r="80"
              fill="none"
              stroke="#A6F26B"
              strokeWidth="22"
              opacity=".55"
            />
          </svg>
          <span className="nb-fo-diplome-k">{t("kicker")}</span>
          <b id="fo-diplome">{view.title}</b>
          <p>
            {t("awardedTo")} <b>{view.holder}</b>
          </p>
          <p className="nb-fo-diplome-l">{view.line}</p>
          <p className="nb-fo-diplome-v">
            {t("verify")}{" "}
            <a href={view.verifyHref} target="_blank" rel="noopener noreferrer">
              {view.verify}
            </a>
          </p>
        </article>
        <div className="nb-fo-att-b">
          <button
            type="button"
            className="nb-bouton"
            data-plein=""
            data-large=""
            data-fait={onProfile ? "" : undefined}
            disabled={pending}
            onClick={addToProfile}
          >
            {onProfile ? t("onProfile") : t("addToProfile")}
          </button>
          <Link href={view.fil} className="nb-bouton" data-contour="" data-large="">
            {t("shareFil")}
          </Link>
          <a href={view.pdf} className="nb-bouton" data-contour="" data-large="" download>
            {t("pdf")}
          </a>
        </div>
        {view.fresh ? (
          <Link href="/app/learn" className="nb-fo-autres">
            {t("more")}
          </Link>
        ) : (
          <Link href={view.courseHref} className="nb-fo-autres">
            {t("course")}
          </Link>
        )}
      </div>
    </div>
  );
}
