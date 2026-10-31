import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LetterCancel } from "@/components/phone/career/letter-cancel";
import { OrbiDisc, PhoneIcon } from "@/components/phone/icon";
import { CopyButton } from "@/components/talent/copy-button";
import { OrbiLimit, type OrbiLimitCode } from "@/components/talent/cv/orbi-limit";
import { dynamic } from "@/i18n/dynamic";
import {
  applyCorrectionsAction,
  deleteDocumentAction,
  proofreadAgainAction,
  saveDocumentAction,
} from "@/server/actions/career-documents";
import { aiFeatures } from "@/server/ai";
import type { CareerDocumentContent } from "@/server/services/career-documents";
import { TEXT_MAX } from "@/server/services/career-documents";

/**
 * A letter on the phone (Ephraïm, 31/10/2026), after « Rédiger avec Orbi » or « Relire »: Orbi's
 * corrections to keep, the letter in a framed zone, then « Utiliser cette lettre » (saved, back to
 * Mes documents) or « Relire encore » (Orbi reads it again as it stands). Copy, PDF and delete
 * below. Same head and greens as « Nouvelle lettre ».
 */
export async function PhoneLetter({
  document,
  notice,
  aiError,
  plan,
}: {
  document: { id: string; title: string; updatedAt: Date; data: CareerDocumentContent };
  notice: "cree" | "enregistre" | "relu" | "utilisee" | "input" | null;
  aiError: OrbiLimitCode | null;
  plan: string | null;
}) {
  const t = await getTranslations();
  const d = dynamic(t);
  const { data } = document;
  const back = "/app/career/cv?onglet=documents";
  return (
    <div className="t-flux nb-lt-page">
      <header className="nb-cv-tete nb-lt-tete">
        <Link href={back} className="nb-cv-retour" aria-label={t("docs.back")}>
          <PhoneIcon name="retour" size={20} stroke={2} />
        </Link>
        <div className="nb-cv-titre">
          <h1>{document.title}</h1>
        </div>
      </header>

      {notice === "cree" && (
        <p className="nb-lt-bulle" role="status">
          <OrbiDisc size={28} />
          <span>{t("docs.letter.created")}</span>
        </p>
      )}
      {notice === "relu" && (
        <p className="nb-lt-bulle" role="status">
          <OrbiDisc size={28} />
          <span>
            {data.corrections.length > 0
              ? t("phoneLetter.view.read")
              : t("phoneLetter.view.nothing")}
          </span>
        </p>
      )}
      {notice === "enregistre" && (
        <p className="nb-lt-note" role="status">
          {t("docs.letter.saved")}
        </p>
      )}
      {notice === "input" && (
        <p className="nb-lt-note" role="alert">
          {t("docs.letter.error")}
        </p>
      )}
      {aiError && <OrbiLimit code={aiError} plan={plan} />}
      {notice === "utilisee" && (
        <div className="nb-lt-accueil">
          <div
            className="nb-lt-carte nb-lt-fini"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nb-lt-fini-t"
          >
            <span className="nb-lt-fini-i" aria-hidden>
              <PhoneIcon name="coche" size={30} stroke={2.6} />
            </span>
            <h2 id="nb-lt-fini-t">{t("phoneLetter.saved.title")}</h2>
            <p>{t("phoneLetter.saved.text")}</p>
            <Link href={back} className="nb-lt-bt" autoFocus>
              <PhoneIcon name="document" size={20} />
              {t("phoneLetter.saved.back")}
            </Link>
          </div>
        </div>
      )}

      {data.corrections.length > 0 && (
        <form action={applyCorrectionsAction} className="nb-lt-bloc" data-orbi="">
          <input type="hidden" name="id" value={document.id} />
          <h2 className="nb-lt-h">
            <OrbiDisc size={28} />
            {t("phoneLetter.view.corrections", { count: data.corrections.length })}
          </h2>
          <ul className="nb-lt-corr">
            {data.corrections.map((correction) => (
              <li key={correction.id}>
                <label>
                  <input type="checkbox" name="correction" value={correction.id} defaultChecked />
                  <span>
                    <del>
                      <span className="sr-only">{t("docs.letter.before")}</span>
                      {correction.before}
                    </del>
                    <b>
                      <span className="sr-only">{t("docs.letter.after")}</span>
                      {correction.after}
                    </b>
                    <small>
                      {"text" in correction.why
                        ? correction.why.text
                        : d(`career.documents.proofread.rule.${correction.why.code}`)}
                    </small>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <button type="submit" className="nb-lt-bt">
            {t("phoneLetter.view.keep")}
          </button>
        </form>
      )}

      <form
        id="nb-lettre"
        key={document.updatedAt.toISOString()}
        action={saveDocumentAction}
        className="nb-lt-bloc"
      >
        <input type="hidden" name="id" value={document.id} />
        <input type="hidden" name="fini" value="1" />
        <div className="nb-lt-champ">
          <label htmlFor={`nb-lettre-titre-${document.id}`}>{t("docs.letter.name")}</label>
          <input
            id={`nb-lettre-titre-${document.id}`}
            name="title"
            defaultValue={document.title}
            maxLength={120}
            required
            className="nb-lt-zone"
          />
        </div>
        <div className="nb-lt-champ">
          <label htmlFor={`nb-lettre-texte-${document.id}`}>
            <PhoneIcon name="modifier" size={16} />
            {t("phoneLetter.view.text")}
          </label>
          <textarea
            id={`nb-lettre-texte-${document.id}`}
            name="text"
            defaultValue={data.text}
            maxLength={TEXT_MAX}
            rows={14}
            className="nb-lt-zone"
            data-grande=""
          />
        </div>
        <button type="submit" className="nb-lt-bt">
          {t("phoneLetter.view.use")}
        </button>
        <button type="submit" formAction={proofreadAgainAction} className="nb-lt-annuler">
          <OrbiDisc size={24} />
          {t("phoneLetter.view.again", { count: aiFeatures.proofread.credits })}
        </button>
      </form>

      <div className="nb-lt-outils">
        <CopyButton
          value={data.text}
          label={t("docs.letter.copy")}
          copied={t("docs.letter.copied")}
          className="nb-lt-outil"
        >
          <PhoneIcon name="copier" size={22} />
        </CopyButton>
        <a href={`/app/career/documents/${document.id}/pdf`} className="nb-lt-outil" data-texte="">
          <PhoneIcon name="telecharger" size={22} />
          {t("phoneLetter.view.download")}
        </a>
        <form id="nb-lettre-supprimer" action={deleteDocumentAction} hidden>
          <input type="hidden" name="id" value={document.id} />
        </form>
        <LetterCancel
          formId="nb-lettre-supprimer"
          className="nb-lt-outil nb-lt-danger"
          texts={{
            cancel: t("docs.menu.delete"),
            ask: t("phoneLetter.view.deleteAsk"),
            yes: t("phoneLetter.view.deleteYes"),
            no: t("phoneLetter.cancel.no"),
          }}
        >
          <PhoneIcon name="corbeille" size={22} />
        </LetterCancel>
      </div>
    </div>
  );
}
