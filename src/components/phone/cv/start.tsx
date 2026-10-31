"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createCvAction } from "@/server/actions/cv-flow";
import { CompanyMark } from "../explorer/cards";
import { PhoneIcon } from "../icon";
import { CvFrame } from "./frame";
import { CvMark, OrbiSpark } from "./marks";

type Mode = "profil" | "zero" | "offre";
export type StartOffer = {
  id: string;
  title: string;
  company: string;
  initials: string;
  logo: string | null;
  tone: number;
};

function Validate({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const t = useTranslations("phoneCv.start");
  return (
    <button
      type="submit"
      form="cv-depart"
      className="nb-bouton nb-cv-principal"
      data-plein=""
      data-large=""
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending ? t("validating") : t("validate")}
    </button>
  );
}

/**
 * « Nouveau CV » (Ephraïm, 31/10/2026): before the studio, three choices to tick, then
 * « Valider ». From the profile (everything placed in the boxes, all editable), written from A
 * to Z, or adapted to an offer by Orbi: Pro and above; the others see it locked, with why.
 */
export function CvStart({
  percent,
  error,
  tailor,
  offers,
  initial,
}: {
  percent: number;
  error: string | null;
  /** null when the plan includes « Adapter à une offre », else the plan that does. */
  tailor: { locked: string | null };
  offers: StartOffer[];
  initial: { mode: Mode | null; job: string | null };
}) {
  const t = useTranslations("phoneCv.start");
  const tc = useTranslations("phoneCv");
  const [mode, setMode] = useState<Mode | null>(initial.mode);
  const [job, setJob] = useState<string | null>(initial.job ?? offers[0]?.id ?? null);
  const [why, setWhy] = useState(false);
  const ways: { key: Mode; mark: "nouveau" | "modele" | "orbi"; tag?: string }[] = [
    { key: "profil", mark: "nouveau", tag: t("advised") },
    { key: "zero", mark: "modele" },
    { key: "offre", mark: "orbi", tag: tailor.locked ?? t("pro") },
  ];
  const ready = mode !== null && (mode !== "offre" || (!tailor.locked && job !== null));
  return (
    <CvFrame
      title={t("title")}
      sub={t("sub")}
      back={{ href: "/app/career/cv?onglet=cv", label: tc("close"), close: true }}
      className="nb-cvd"
      bottom={<Validate disabled={!ready} />}
    >
      <form id="cv-depart" action={createCvAction}>
        {error ? (
          <p className="nb-cv-erreur" role="alert">
            {error}
          </p>
        ) : null}
        <p className="nb-cvd-intro">
          <OrbiSpark size={16} />
          <span>{t("intro", { percent })}</span>
        </p>
        <fieldset className="nb-cvd-choix">
          <legend className="nb-cvd-legende">{t("choose")}</legend>
          {ways.map((way, index) => {
            const locked = way.key === "offre" && tailor.locked !== null;
            const chosen = mode === way.key;
            return (
              <label
                key={way.key}
                className="nb-cvd-carte"
                data-cle={way.key}
                data-choisi={chosen ? "" : undefined}
                data-verrou={locked ? "" : undefined}
                style={{ animationDelay: `${0.06 * index + 0.05}s` }}
              >
                <input
                  type="radio"
                  name="mode"
                  value={way.key}
                  checked={chosen}
                  aria-describedby={`cvd-${way.key}-t`}
                  onChange={() => {
                    if (locked) {
                      setWhy(true);
                      return;
                    }
                    setWhy(false);
                    setMode(way.key);
                  }}
                  onClick={() => {
                    if (locked) setWhy(true);
                  }}
                />
                <span className="nb-cvd-i" aria-hidden>
                  <CvMark name={way.mark} size={22} />
                </span>
                <span className="nb-cvd-t">
                  <b>
                    {t(`${way.key}.title`)}
                    {way.tag ? (
                      <em data-verrou={locked ? "" : undefined}>
                        {locked ? <PhoneIcon name="cadenas" size={11} stroke={2.4} /> : null}
                        {way.tag}
                      </em>
                    ) : null}
                  </b>
                  <small id={`cvd-${way.key}-t`}>{t(`${way.key}.text`)}</small>
                </span>
                <i className="nb-cvd-coche" aria-hidden>
                  {chosen ? <PhoneIcon name="coche" size={14} stroke={3} /> : null}
                </i>
              </label>
            );
          })}
        </fieldset>

        {why && tailor.locked ? (
          <div className="nb-cvd-pourquoi" role="status">
            <b>{t("lockedTitle", { plan: tailor.locked })}</b>
            <p>{t("lockedText")}</p>
            <Link href="/app/abonnement/formules" className="nb-bouton" data-contour="">
              {t("lockedSee")}
            </Link>
          </div>
        ) : null}

        {mode === "offre" && !tailor.locked ? (
          <div className="nb-cvd-offres">
            <p className="nb-cvd-legende" id="cvd-offre">
              {t("offerWhich")}
            </p>
            {offers.length === 0 ? (
              <div className="nb-cvd-pourquoi">
                <p>{t("offerNone")}</p>
                <Link href="/app/jobs" className="nb-bouton" data-contour="">
                  {t("offerFind")}
                </Link>
              </div>
            ) : (
              <ul role="radiogroup" aria-labelledby="cvd-offre">
                {offers.map((offer) => (
                  <li key={offer.id}>
                    <label className="nb-cvd-offre" data-choisi={job === offer.id ? "" : undefined}>
                      <input
                        type="radio"
                        name="job"
                        value={offer.id}
                        checked={job === offer.id}
                        onChange={() => setJob(offer.id)}
                      />
                      <CompanyMark
                        initials={offer.initials}
                        logo={offer.logo}
                        tone={offer.tone}
                        size={36}
                      />
                      <span>
                        <b>{offer.title}</b>
                        <small>{offer.company}</small>
                      </span>
                      <i className="nb-cvd-coche" aria-hidden>
                        {job === offer.id ? <PhoneIcon name="coche" size={14} stroke={3} /> : null}
                      </i>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </form>

      <Link href="/app/career/cv/nouveau?etape=import" className="nb-cvd-import">
        <CvMark name="import" size={18} />
        <span>
          {t("importLead")} <b>{t("importLink")}</b>
        </span>
      </Link>
    </CvFrame>
  );
}
