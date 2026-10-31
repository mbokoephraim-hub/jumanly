import { getTranslations } from "next-intl/server";
import { PhoneIcon } from "@/components/phone/icon";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { OrbiLimit, type OrbiLimitCode } from "@/components/talent/cv/orbi-limit";
import { generateDocumentAction, proofreadAction } from "@/server/actions/career-documents";
import { aiFeatures } from "@/server/ai";
import { PROOFREAD_MAX } from "@/server/services/career-documents";

/**
 * « Nouvelle lettre » au téléphone (demande d'Ephraïm du 31/10/2026) : deux blocs bien séparés.
 * 1. « Rédiger avec Orbi » : le message d'Orbi encadré, l'offre dans un vrai menu déroulant, le
 *    ton, ce qu'Orbi doit souligner, et le bouton en dégradé. Le type est toujours « lettre ».
 * 2. « Écrire et faire relire par Orbi » : le titre et la lettre dans des zones encadrées, avec
 *    un exemple tant qu'elles sont vides.
 */
export async function PhoneNewLetter({
  state,
  plan,
  offers,
  proofreadReady,
}: {
  state: "ready" | OrbiLimitCode;
  plan: string | null;
  offers: { id: string; title: string; company: string }[];
  proofreadReady: boolean;
}) {
  const t = await getTranslations();
  return (
    <div className="nb-lt">
      <section className="nb-lt-bloc" data-orbi="" aria-labelledby="nb-lt-ecrire">
        <h2 id="nb-lt-ecrire" className="nb-lt-h">
          <span className="nb-lt-num" aria-hidden>
            {1}
          </span>
          {t("phoneLetter.write.title")}
        </h2>
        <p className="nb-lt-bulle">
          <OrbiMark size={26} />
          <span>{t("phoneLetter.write.orbi")}</span>
        </p>
        {state !== "ready" ? (
          <OrbiLimit code={state} plan={plan} />
        ) : (
          <form action={generateDocumentAction} className="nb-lt-f">
            <input type="hidden" name="retour" value="telephone" />
            <input type="hidden" name="type" value="letter" />
            <div className="nb-lt-champ">
              <label htmlFor="nb-lt-offre">{t("phoneLetter.write.offer")}</label>
              <span className="nb-lt-menu">
                <select id="nb-lt-offre" name="jobId" defaultValue="">
                  <option value="">{t("phoneLetter.write.noOffer")}</option>
                  {offers.map((offer) => (
                    <option key={offer.id} value={offer.id}>
                      {[offer.title, offer.company].join(" · ")}
                    </option>
                  ))}
                </select>
                <PhoneIcon name="bas" size={20} />
              </span>
              <small>{t("phoneLetter.write.offerHint")}</small>
            </div>
            <fieldset className="nb-lt-champ">
              <legend>{t("phoneLetter.write.tone")}</legend>
              <div className="nb-lt-tons">
                {(["formal", "warm", "direct"] as const).map((tone) => (
                  <label key={tone} className="nb-lt-ton">
                    <input
                      type="radio"
                      name="tone"
                      value={tone}
                      defaultChecked={tone === "formal"}
                    />
                    {t(`docs.letters.create.tones.${tone}`)}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="nb-lt-champ">
              <label htmlFor="nb-lt-points">{t("phoneLetter.write.points")}</label>
              <small id="nb-lt-points-aide">{t("phoneLetter.write.pointsHint")}</small>
              <textarea
                id="nb-lt-points"
                name="points"
                maxLength={600}
                rows={3}
                className="nb-lt-zone"
                aria-describedby="nb-lt-points-aide"
                placeholder={t("phoneLetter.write.pointsExample")}
              />
            </div>
            <p className="nb-lt-note">
              <TalentIcon name="cadenas" size="s" />
              {t("docs.letters.create.note", { count: aiFeatures.career_document.credits })}
            </p>
            <button type="submit" className="nb-lt-bt" data-orbi="">
              <OrbiMark size={20} />
              {t("docs.letters.create.submit")}
            </button>
          </form>
        )}
      </section>

      {proofreadReady && (
        <>
          <p className="nb-lt-ou" aria-hidden>
            <span>{t("phoneLetter.or")}</span>
          </p>
          <section className="nb-lt-bloc" aria-labelledby="nb-lt-relire">
            <h2 id="nb-lt-relire" className="nb-lt-h">
              <span className="nb-lt-num" aria-hidden>
                {2}
              </span>
              {t("phoneLetter.check.title")}
            </h2>
            <p className="nb-lt-lead">{t("phoneLetter.check.lead")}</p>
            <form action={proofreadAction} className="nb-lt-f">
              <input type="hidden" name="retour" value="telephone" />
              <div className="nb-lt-champ">
                <label htmlFor="nb-lt-titre">{t("phoneLetter.check.name")}</label>
                <input
                  id="nb-lt-titre"
                  name="title"
                  maxLength={120}
                  className="nb-lt-zone"
                  placeholder={t("phoneLetter.check.nameExample")}
                />
              </div>
              <div className="nb-lt-champ">
                <label htmlFor="nb-lt-texte">
                  <PhoneIcon name="modifier" size={16} />
                  {t("phoneLetter.check.text")}
                </label>
                <textarea
                  id="nb-lt-texte"
                  name="text"
                  required
                  maxLength={PROOFREAD_MAX}
                  rows={9}
                  className="nb-lt-zone"
                  data-grande=""
                  placeholder={t("phoneLetter.check.textExample")}
                />
              </div>
              <button type="submit" className="nb-lt-bt">
                {t("docs.letters.proofread.submit", { count: aiFeatures.proofread.credits })}
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
