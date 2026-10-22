"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { applyFromSheetAction } from "@/server/actions/explore";
import { setJobSavedAction } from "@/server/actions/jobs";
import { PhoneBack } from "../back";
import { OrbiDisc, PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { CompanyMark } from "./cards";

export type PhoneOfferView = {
  slug: string;
  title: string;
  company: string;
  companyHref: string;
  companyLine: string;
  initials: string;
  tone: number;
  logo: string | null;
  /** « Entreprise vérifiée · il y a 2 j », or « Publiée il y a 2 j ». */
  line: string;
  chips: string[];
  match:
    | {
        state: "ok";
        score: number;
        why: { ok: boolean; text: string }[];
        gap: { href: string; text: string } | null;
      }
    | { state: "optedOut" }
    | { state: "incomplete" };
  missions: string[];
  expect: string[];
  about: string | null;
  benefits: string[];
  saved: boolean;
  /** The application already sent, if any. */
  applicationId: string | null;
  open: boolean;
  /** Screening questions: the sheet then leads to the full form, which asks them. */
  questions: number;
  cvs: { id: string; title: string; line: string; adapted: boolean }[];
  /** « Orbi adapte ce CV à l'offre »: the CV editor, which proposes the changes. */
  adaptHref: string | null;
};

/**
 * An offer on the phone (Modèle B, planche Offres-detail, rangée 08): who publishes it, the
 * chips, Orbi's « Pourquoi » with its score, the missions, the company, and « Enregistrer ·
 * Postuler » kept at the bottom. « Postuler » opens its sheet (planche Offres-postuler): the CV,
 * a word to the recruiter, sent at once. Applying is free, always: nothing here checks a plan.
 */
export function PhoneOffer({ offer }: { offer: PhoneOfferView }) {
  const t = useTranslations("phoneExplorer");
  const [saved, setSaved] = useState(offer.saved);
  const [applied, setApplied] = useState(offer.applicationId !== null);
  const [sheet, setSheet] = useState(false);
  const [saving, startSave] = useTransition();

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: offer.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast({ message: t("offer.shared") });
    } catch {}
  };
  const toggleSave = () =>
    startSave(async () => {
      const next = await setJobSavedAction(offer.slug, !saved).catch(() => null);
      if (next === null) {
        showToast({ message: t("offer.saveError"), tone: "error" });
        return;
      }
      setSaved(next);
      showToast({ message: next ? t("offer.savedToast") : t("offer.unsavedToast") });
    });

  return (
    <div className="nb-page nb-ex nb-ex-offre">
      <header className="nb-barre nb-ex-barre">
        <PhoneBack fallback="/app/jobs" label={t("offer.back")} text={t("offer.back")} />
        <span className="nb-ex-vide-h" />
        <button type="button" className="nb-ex-partager" onClick={share}>
          {t("offer.share")}
        </button>
      </header>

      <div className="nb-ex-bloc">
        <div className="nb-ex-offre-e">
          <CompanyMark initials={offer.initials} logo={offer.logo} tone={offer.tone} size={56} />
          <span>
            <b>{offer.company}</b>
            <span className="nb-meta">{offer.line}</span>
          </span>
        </div>
        <h1 className="nb-ex-offre-t">{offer.title}</h1>
        <div className="nb-ex-pis">
          {offer.chips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      </div>

      <div className="nb-ex-bloc">
        <div className="nb-ex-pourquoi">
          {offer.match.state === "ok" ? (
            <>
              <div className="nb-ex-pourquoi-t">
                <OrbiDisc size={40} />
                <span>
                  <b>{t("offer.forYou", { score: offer.match.score })}</b>
                  <span className="nb-meta">{t("offer.why")}</span>
                </span>
              </div>
              <ul>
                {offer.match.why.map((line) => (
                  <li key={line.text} data-ecart={line.ok ? undefined : ""}>
                    <b aria-hidden className="nb-ex-marque" />
                    {line.text}
                  </li>
                ))}
              </ul>
              {offer.match.gap ? (
                <Link href={offer.match.gap.href} className="nb-ex-ecart">
                  {offer.match.gap.text}
                </Link>
              ) : null}
              <Link href={`/app/jobs/${offer.slug}?pourquoi=1`} className="nb-ex-detail">
                {t("offer.whyFull")}
              </Link>
            </>
          ) : (
            <div className="nb-ex-pourquoi-t">
              <OrbiDisc size={40} />
              <span>
                <b className="nb-ex-pourquoi-sans">{t("offer.noScore")}</b>
                <span className="nb-meta">
                  {offer.match.state === "optedOut" ? t("offer.optedOut") : t("offer.noScoreText")}
                </span>
                {offer.match.state === "incomplete" ? (
                  <Link href="/app/career/cv" className="nb-ex-ecart">
                    {t("offer.noScoreLink")}
                  </Link>
                ) : null}
              </span>
            </div>
          )}
        </div>
      </div>

      {offer.missions.length > 0 ? (
        <List title={t("offer.missions")} items={offer.missions} />
      ) : offer.about ? (
        <div className="nb-ex-bloc">
          <h2 className="nb-ex-h3">{t("offer.about")}</h2>
          <p className="nb-ex-texte">{offer.about}</p>
        </div>
      ) : null}
      {offer.expect.length > 0 ? <List title={t("offer.expect")} items={offer.expect} /> : null}
      {offer.benefits.length > 0 ? (
        <List title={t("offer.benefits")} items={offer.benefits} />
      ) : null}

      <Link href={offer.companyHref} className="nb-ex-bloc nb-ex-offre-ent">
        <CompanyMark initials={offer.initials} logo={offer.logo} tone={offer.tone} size={44} />
        <span>
          <b>{offer.company}</b>
          <span className="nb-meta">{offer.companyLine}</span>
        </span>
        <span className="nb-ex-lien">{t("offer.companyPage")}</span>
      </Link>
      <p className="nb-ex-gratuit">{t("offer.free")}</p>

      <div className="nb-ex-bas">
        <button
          type="button"
          className="nb-ex-enreg"
          aria-pressed={saved}
          disabled={saving}
          onClick={toggleSave}
        >
          {saved ? t("offer.saved") : t("offer.save")}
        </button>
        {applied ? (
          <Link href="/app/career/cv?onglet=candidatures" className="nb-ex-postuler" data-fait="">
            <PhoneIcon name="coche" size={18} stroke={2.2} />
            {t("offer.applied")}
          </Link>
        ) : offer.open ? (
          <button type="button" className="nb-ex-postuler" onClick={() => setSheet(true)}>
            {t("offer.apply")}
          </button>
        ) : (
          <span className="nb-ex-postuler" aria-disabled="true">
            {t("offer.closed")}
          </span>
        )}
      </div>

      <ApplySheet
        offer={offer}
        open={sheet}
        onClose={() => setSheet(false)}
        onApplied={() => setApplied(true)}
      />
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="nb-ex-bloc">
      <h2 className="nb-ex-h3">{title}</h2>
      <ul className="nb-ex-puces-l">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** « Postuler chez … »: the CV, a word, « Envoyer ma candidature », then « Candidature envoyée ». */
function ApplySheet({
  offer,
  open,
  onClose,
  onApplied,
}: {
  offer: PhoneOfferView;
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
}) {
  const t = useTranslations("phoneExplorer");
  const [cv, setCv] = useState(offer.cvs[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [sending, start] = useTransition();

  const send = () =>
    start(async () => {
      const result = await applyFromSheetAction({ job: offer.slug, cv, note });
      if (!result.ok) {
        showToast({
          message: result.error === "closed" ? t("apply.closedError") : t("apply.error"),
          tone: "error",
        });
        return;
      }
      setDone(true);
      onApplied();
    });

  return (
    <PhoneSheet
      open={open}
      onClose={onClose}
      label={done ? t("apply.done") : t("apply.title", { company: offer.company })}
      closeLabel={t("apply.close")}
      className="nb-ex-feuille"
    >
      {done ? (
        <div className="nb-ex-envoye" role="status">
          <span className="nb-ex-envoye-ic">
            <PhoneIcon name="coche" size={34} stroke={2.4} />
          </span>
          <b>{t("apply.done")}</b>
          <p className="nb-meta">{t("apply.doneText")}</p>
          <Link
            href="/app/career/cv?onglet=candidatures"
            className="nb-bouton"
            data-plein=""
            data-large=""
          >
            {t("apply.doneSee")}
          </Link>
          <button type="button" className="nb-bouton" data-large="" onClick={onClose}>
            {t("apply.doneBack")}
          </button>
        </div>
      ) : (
        <>
          <b className="nb-ex-feuille-t">{t("apply.title", { company: offer.company })}</b>
          <span className="nb-meta">{offer.title}</span>
          <p className="nb-ex-etiquette">{t("apply.cv")}</p>
          <div className="nb-ex-cvs" role="radiogroup" aria-label={t("apply.cv")}>
            {offer.cvs.length === 0 ? (
              <p className="nb-meta">
                {t("apply.noCv")}{" "}
                <Link href="/app/career/cv" className="nb-ex-lien">
                  {t("apply.noCvLink")}
                </Link>
              </p>
            ) : null}
            {[
              ...offer.cvs,
              {
                id: "",
                title: t("apply.profileOnly"),
                line: t("apply.profileOnlyLine"),
                adapted: false,
              },
            ].map((item) => (
              <button
                key={item.id || "profil"}
                type="button"
                role="radio"
                aria-checked={cv === item.id}
                className="nb-ex-cv"
                onClick={() => setCv(item.id)}
              >
                <span className="nb-ex-cv-r" aria-hidden />
                <span>
                  <b>{item.title}</b>
                  <span className="nb-meta">{item.adapted ? t("apply.adapted") : item.line}</span>
                </span>
              </button>
            ))}
          </div>
          {offer.adaptHref && cv ? (
            <Link
              href={`${offer.adaptHref.replace("{cv}", cv)}`}
              className="nb-ex-adapter"
              data-orbi=""
            >
              {t("apply.adapt")}
            </Link>
          ) : null}
          {offer.questions > 0 ? (
            <>
              <p className="nb-ex-note">{t("apply.questions", { count: offer.questions })}</p>
              <Link
                href={`/app/jobs/${offer.slug}/postuler`}
                className="nb-bouton"
                data-plein=""
                data-large=""
              >
                {t("apply.questionsCta")}
              </Link>
            </>
          ) : (
            <>
              <label className="nb-ex-mot">
                <span className="nb-ex-etiquette">{t("apply.note")}</span>
                <textarea
                  value={note}
                  maxLength={5000}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={t("apply.notePlaceholder")}
                />
              </label>
              <button
                type="button"
                className="nb-bouton"
                data-plein=""
                data-large=""
                disabled={sending}
                onClick={send}
              >
                {sending ? t("apply.sending") : t("apply.send")}
              </button>
            </>
          )}
        </>
      )}
    </PhoneSheet>
  );
}
