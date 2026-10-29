import { getTranslations } from "next-intl/server";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiLimit, type OrbiLimitCode } from "@/components/talent/cv/orbi-limit";
import { dynamic } from "@/i18n/dynamic";
import { generateDocumentAction, proofreadAction } from "@/server/actions/career-documents";
import { aiFeatures } from "@/server/ai";
import { documentTypes, PROOFREAD_MAX } from "@/server/services/career-documents";

/**
 * « Nouvelle lettre » (planche talent-4 § 6): the kind of document, the offer, the tone and the
 * points to stress, then Orbi writes it. In a sheet on a computer, on its own page on a phone
 * (`phone`: an error comes back to that page).
 */
export async function LetterCreateForm({
  state,
  plan,
  offers,
  phone = false,
}: {
  state: "ready" | OrbiLimitCode;
  plan: string | null;
  offers: { id: string; title: string; company: string }[];
  phone?: boolean;
}) {
  const t = await getTranslations();
  const d = dynamic(t);
  return state !== "ready" ? (
    <OrbiLimit code={state} plan={plan} />
  ) : (
    <form action={generateDocumentAction} className="t-flux">
      {phone ? <input type="hidden" name="retour" value="telephone" /> : null}
      <p className="t-ss">{t("docs.letters.create.lead")}</p>
      <div className="t-champ">
        <label htmlFor="lettre-type">{t("docs.letters.create.type")}</label>
        <select id="lettre-type" name="type" defaultValue="letter">
          {documentTypes.map((type) => (
            <option key={type} value={type}>
              {d(`docs.letters.type.${type}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="t-champ">
        <label htmlFor="lettre-offre">{t("docs.letters.create.offer")}</label>
        <select id="lettre-offre" name="jobId" defaultValue="">
          <option value="">{t("docs.letters.create.noOffer")}</option>
          {offers.map((offer) => (
            <option key={offer.id} value={offer.id}>
              {[offer.title, offer.company].join(" · ")}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="t-champ">
        <legend className="t-lab-c">{t("docs.letters.create.tone")}</legend>
        <div className="t-puces">
          {(["formal", "warm", "direct"] as const).map((tone) => (
            <label key={tone} className="t-puce t-press">
              <input
                type="radio"
                name="tone"
                value={tone}
                defaultChecked={tone === "formal"}
                className="sr-only"
              />
              {t(`docs.letters.create.tones.${tone}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="t-champ">
        <label htmlFor="lettre-points">{t("docs.letters.create.points")}</label>
        <textarea id="lettre-points" name="points" maxLength={600} rows={3} />
      </div>
      <p className="t-gar">
        <TalentIcon name="cadenas" size="s" />
        {t("docs.letters.create.note", {
          count: aiFeatures.career_document.credits,
        })}
      </p>
      <button type="submit" className="t-bt t-p t-pl t-press">
        <OrbiMark size={20} />
        {t("docs.letters.create.submit")}
      </button>
    </form>
  );
}

/** « Faire relire un texte »: the person's own text, corrected by Orbi. */
export async function LetterProofreadForm({ phone = false }: { phone?: boolean }) {
  const t = await getTranslations();
  return (
    <form action={proofreadAction} className="t-flux">
      {phone ? <input type="hidden" name="retour" value="telephone" /> : null}
      <p className="t-ss">{t("docs.letters.proofread.lead")}</p>
      <div className="t-champ">
        <label htmlFor="relire-titre">{t("docs.letters.proofread.name")}</label>
        <span className="t-verre t-saisie">
          <input id="relire-titre" name="title" maxLength={120} />
        </span>
      </div>
      <div className="t-champ">
        <label htmlFor="relire-texte">{t("docs.letters.proofread.text")}</label>
        <textarea id="relire-texte" name="text" required maxLength={PROOFREAD_MAX} rows={8} />
      </div>
      <button type="submit" className="t-bt t-p t-pl t-press">
        {t("docs.letters.proofread.submit", { count: aiFeatures.proofread.credits })}
      </button>
    </form>
  );
}
