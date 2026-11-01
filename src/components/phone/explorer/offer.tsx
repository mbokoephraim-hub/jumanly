"use client";

import "@/styles/offre-fiche.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { MenuArt, type MenuArtName } from "@/components/site/menu-art";
import { criterionText, useCriterionDetail } from "@/components/matching/talent-why";
import { dynamic } from "@/i18n/dynamic";
import type { CriterionResult } from "@/server/matching/types";
import { showToast } from "@/components/motion/toaster";
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
  /** City (with the seat's flag), contract, experience and salary: one row, each with its icon. */
  facts: { kind: "city" | "contract" | "level" | "salary"; text: string; flag?: string }[];
  /** « En bref »: studies, languages, openings, closing date, as the recruiter set them. */
  brief: {
    education: string[];
    /** Level is a CEFR level (A1 to C2), or empty when the recruiter gave none. */
    languages: { name: string; level: string }[];
    openings: number;
    closes: string | null;
  };
  /** The company's few lines written for this offer. */
  companyAbout: string | null;
  match:
    | {
        state: "ok";
        score: number;
        why: { ok: boolean; text: string }[];
        gap: { href: string; text: string } | null;
        /** The criteria of the deterministic score, for « Voir le détail du score ». */
        criteria: CriterionResult[];
      }
    | { state: "optedOut" }
    | { state: "incomplete" };
  missions: string[];
  expect: string[];
  /** Technical then behavioural skills the offer asks for. */
  hardSkills: string[];
  softSkills: string[];
  /** « Télécharger la fiche de poste »: the recruiter's PDF, or the sheet drawn by Jumanly. */
  sheetHref: string;
  about: string | null;
  benefits: string[];
  saved: boolean;
  /** The application already sent, if any. */
  applicationId: string | null;
  /** An application started and left: « Postuler » becomes « Reprendre ma candidature ». */
  resume: boolean;
  open: boolean;
  /** Screening questions: the sheet then leads to the full form, which asks them. */
  questions: number;
  cvs: { id: string; title: string; line: string; adapted: boolean }[];
  /** « Orbi adapte ce CV à l'offre », done inside the sheet: the offer's id, null when unknown. */
  jobId: string | null;
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
  const applied = offer.applicationId !== null;
  const [whyOpen, setWhyOpen] = useState(false);
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
        <ul className="nb-ex-faits" aria-label={t("offer.facts")} tabIndex={0}>
          {offer.facts.map((fact) => (
            <li key={fact.kind} data-sorte={fact.kind}>
              {fact.flag ? (
                <span aria-hidden>{fact.flag}</span>
              ) : fact.kind !== "salary" ? (
                <PhoneIcon name={FACT_ICONS[fact.kind]} size={15} stroke={2} />
              ) : null}
              {fact.text}
            </li>
          ))}
        </ul>
      </div>

      {offer.about ? (
        <div className="nb-ex-bloc">
          <SectionTitle art="jobs" title={t("offer.about")} />
          <p className="nb-ex-texte">{offer.about}</p>
        </div>
      ) : null}
      <Brief brief={offer.brief} />
      {offer.missions.length > 0 ? (
        <List art="career" title={t("offer.missions")} items={offer.missions} />
      ) : null}
      {offer.expect.length > 0 ? (
        <List art="talents" title={t("offer.expect")} items={offer.expect} />
      ) : null}
      {offer.benefits.length > 0 ? (
        <List art="free" title={t("offer.benefits")} items={offer.benefits} />
      ) : null}

      {offer.hardSkills.length > 0 ? (
        <div className="nb-ex-bloc">
          <SectionTitle art="trainings" title={t("offer.hardSkills")} />
          <div className="nb-ex-pis nb-ex-comp">
            {offer.hardSkills.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      ) : null}
      {offer.softSkills.length > 0 ? (
        <div className="nb-ex-bloc">
          <SectionTitle art="connect" title={t("offer.softSkills")} />
          <div className="nb-ex-pis nb-ex-comp">
            {offer.softSkills.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      ) : null}

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
              <button type="button" className="nb-ex-detail-b" onClick={() => setWhyOpen(true)}>
                {t("offer.whyFull")}
                <PhoneIcon name="chevron" size={16} stroke={2.2} />
              </button>
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

      {offer.companyAbout ? (
        <div className="nb-ex-bloc">
          <SectionTitle
            art="companies"
            title={t("offer.companyAbout", { company: offer.company })}
          />
          <p className="nb-ex-texte">{offer.companyAbout}</p>
        </div>
      ) : null}

      <a href={offer.sheetHref} className="nb-ex-bloc nb-ex-offre-ent" download>
        <MenuArt name="cv" size="sm" className="nb-ex-art" />
        <span>
          <b>{t("offer.sheet")}</b>
          <span className="nb-meta">{t("offer.sheetLine")}</span>
        </span>
        <span className="nb-ex-lien">{t("offer.sheetDownload")}</span>
      </a>

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
          <Link href={`/app/jobs/${offer.slug}/postuler`} className="nb-ex-postuler">
            {offer.resume ? t("offer.resume") : t("offer.apply")}
          </Link>
        ) : (
          <span className="nb-ex-postuler" aria-disabled="true">
            {t("offer.closed")}
          </span>
        )}
      </div>

      {offer.match.state === "ok" ? (
        <WhySheet
          open={whyOpen}
          onClose={() => setWhyOpen(false)}
          score={offer.match.score}
          criteria={offer.match.criteria}
          gap={offer.match.gap}
          contestHref={`/app/jobs/${offer.slug}?pourquoi=1`}
        />
      ) : null}
    </div>
  );
}

const FACT_ICONS = {
  city: "drapeau",
  contract: "offres",
  level: "horloge",
} as const;

/**
 * « Voir le détail du score » on the phone (Ephraïm, 31/10/2026): one sheet on the offer itself,
 * no other page and no bars. What already matches, then the gaps, each in one sentence built from
 * the facts of the calculation. Contesting stays one link away.
 */
function WhySheet({
  open,
  onClose,
  score,
  criteria,
  gap,
  contestHref,
}: {
  open: boolean;
  onClose: () => void;
  score: number;
  criteria: CriterionResult[];
  gap: { href: string; text: string } | null;
  contestHref: string;
}) {
  const t = useTranslations("phoneExplorer");
  const all = useTranslations();
  const d = dynamic(all);
  const detail = useCriterionDetail();
  const shown = criteria.filter((criterion) => criterion.status !== "not_applicable");
  const good = shown.filter((criterion) => criterion.status === "met");
  const gaps = shown.filter((criterion) => criterion.status !== "met");
  const row = (criterion: CriterionResult, met: boolean) => (
    <li key={criterion.key} data-ok={met ? "" : undefined}>
      <span className="nb-ex-ec-ic" aria-hidden>
        <PhoneIcon name={met ? "coche" : "fleche"} size={16} stroke={2.4} />
      </span>
      <span>
        <b>{d(`match.criterion.${criterionText[criterion.key]}.text`)}</b>
        <small>{detail(criterion)}</small>
      </span>
    </li>
  );
  return (
    <PhoneSheet
      open={open}
      onClose={onClose}
      label={t("offer.whySheet.title", { score })}
      closeLabel={t("apply.close")}
      className="nb-ex-feuille nb-ex-ec"
    >
      <b className="nb-ex-feuille-t">{t("offer.whySheet.title", { score })}</b>
      <span className="nb-meta">{t("offer.whySheet.lead")}</span>
      {gaps.length > 0 ? (
        <>
          <p className="nb-ex-ec-h" data-ton="ecart">
            {t("offer.whySheet.gaps", { count: gaps.length })}
          </p>
          <ul className="nb-ex-ec-l">{gaps.map((criterion) => row(criterion, false))}</ul>
          {gap ? (
            <Link href={gap.href} className="nb-ex-ecart">
              {gap.text}
            </Link>
          ) : null}
        </>
      ) : (
        <p className="nb-ex-ec-h">{t("offer.whySheet.noGap")}</p>
      )}
      {good.length > 0 ? (
        <>
          <p className="nb-ex-ec-h">{t("offer.whySheet.good", { count: good.length })}</p>
          <ul className="nb-ex-ec-l">{good.map((criterion) => row(criterion, true))}</ul>
        </>
      ) : null}
      <p className="nb-ex-ec-garde">{t("offer.whySheet.guard")}</p>
      <Link href={contestHref} className="nb-ex-ec-contester">
        {t("offer.whySheet.contest")}
      </Link>
    </PhoneSheet>
  );
}

/** A section title with its menu drawing, the same drawings as the menus (Ephraïm, 31/10/2026). */
function SectionTitle({ art, title }: { art: MenuArtName; title: string }) {
  return (
    <h2 className="nb-ex-h3 nb-ex-h3-art">
      <MenuArt name={art} size="sm" className="nb-ex-art" />
      {title}
    </h2>
  );
}

const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

/**
 * « En bref », redrawn on 31/10/2026: studies and openings as two tiles, the closing date, then
 * each language on its own line with its level drawn as six steps (A1 to C2) and named in words.
 */
function Brief({ brief }: { brief: PhoneOfferView["brief"] }) {
  const t = useTranslations("phoneExplorer");
  return (
    <div className="nb-ex-bloc">
      <SectionTitle art="why" title={t("offer.brief")} />
      <div className="nb-ex-br">
        {brief.education.length > 0 ? (
          <div className="nb-ex-br-tuile">
            <span className="nb-ex-br-ic" aria-hidden>
              <PhoneIcon name="formation" size={18} />
            </span>
            <small>{t("offer.education")}</small>
            <b>{brief.education.join(" · ")}</b>
          </div>
        ) : null}
        <div className="nb-ex-br-tuile">
          <span className="nb-ex-br-ic" aria-hidden>
            <PhoneIcon name="personne" size={18} />
          </span>
          <small>{t("offer.openings")}</small>
          <b>{t("offer.openingsCount", { count: brief.openings })}</b>
        </div>
        {brief.closes ? (
          <div className="nb-ex-br-tuile" data-large="">
            <span className="nb-ex-br-ic" aria-hidden>
              <PhoneIcon name="agenda" size={18} />
            </span>
            <small>{t("offer.closes")}</small>
            <b>{brief.closes}</b>
          </div>
        ) : null}
        {brief.languages.length > 0 ? (
          <div className="nb-ex-br-tuile" data-large="">
            <span className="nb-ex-br-ic" aria-hidden>
              <PhoneIcon name="messages" size={18} />
            </span>
            <small>{t("offer.languages")}</small>
            <ul className="nb-ex-langues">
              {brief.languages.map((item) => {
                const rank = CEFR.indexOf(item.level as (typeof CEFR)[number]) + 1;
                return (
                  <li key={item.name}>
                    <b>{item.name}</b>
                    {rank > 0 ? (
                      <>
                        <span className="nb-ex-niveau" aria-hidden>
                          {CEFR.map((level, index) => (
                            <i key={level} data-plein={index < rank ? "" : undefined} />
                          ))}
                        </span>
                        <span className="nb-ex-niveau-t">
                          {t("offer.languageLevel", {
                            level: item.level,
                            word: t(`offer.cefr.${CEFR[rank - 1]!}`),
                          })}
                        </span>
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function List({ art, title, items }: { art: MenuArtName; title: string; items: string[] }) {
  return (
    <div className="nb-ex-bloc">
      <SectionTitle art={art} title={title} />
      <ul className="nb-ex-puces-l">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
