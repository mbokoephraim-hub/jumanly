import { getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import {
  deleteCv,
  duplicateCv,
  refreshCvFromProfile,
  renameCv,
  setPrimaryCv,
  updateCvContact,
} from "@/server/actions/cv";

/**
 * « Plus d'options » of a CV (planche talent-4 § 6): its name, the contact printed on it, CV
 * principal, update from the profile, duplicate, delete. A sheet on a phone, a centred window in
 * the web studio; `prefix` keeps the ids of the two apart.
 */
export async function CvOptions({
  cv,
  contact,
  canDuplicate,
  prefix,
}: {
  cv: { id: string; title: string; isPrimary: boolean };
  contact: { email: string; showEmail: boolean; phone?: string | null };
  canDuplicate: boolean;
  prefix: string;
}) {
  const t = await getTranslations();
  return (
    <>
      <form action={renameCv} className="t-champ">
        <input type="hidden" name="id" value={cv.id} />
        <label htmlFor={`${prefix}nom`}>{t("docs.editor.rename")}</label>
        <span className="t-verre t-saisie">
          <input id={`${prefix}nom`} name="title" defaultValue={cv.title} maxLength={80} required />
          <button type="submit" className="t-bt t-sec t-s t-press">
            {t("docs.editor.save")}
          </button>
        </span>
      </form>
      <form action={updateCvContact} className="t-flux">
        <input type="hidden" name="id" value={cv.id} />
        <div className="t-verre t-liste">
          <label className="t-li">
            <span className="t-t">
              <b>{t("career.cv.info.showEmail")}</b>
              <span>{contact.email}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              name="showEmail"
              defaultChecked={contact.showEmail}
              className="sr-only"
            />
            <span aria-hidden className="t-sw" />
          </label>
        </div>
        <div className="t-champ">
          <label htmlFor={`${prefix}telephone`}>{t("career.cv.info.phone.label")}</label>
          <span className="t-verre t-saisie">
            <input
              id={`${prefix}telephone`}
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={contact.phone ?? ""}
              maxLength={30}
              aria-describedby={`${prefix}telephone-aide`}
            />
            <button type="submit" className="t-bt t-sec t-s t-press">
              {t("docs.editor.save")}
            </button>
          </span>
          <p id={`${prefix}telephone-aide`} className="t-aide">
            {t("career.cv.info.phone.hint")}
          </p>
        </div>
      </form>
      <div className="t-verre t-liste t-lignes">
        {!cv.isPrimary && (
          <form action={setPrimaryCv} className="t-li">
            <input type="hidden" name="id" value={cv.id} />
            <span className="t-cases t-c3">
              <TalentIcon name="favori" size="s" />
            </span>
            <span className="t-t">
              <button type="submit" className="t-lien">
                <b>{t("docs.menu.primary")}</b>
              </button>
              <span>{t("docs.menu.primaryHint")}</span>
            </span>
          </form>
        )}
        <form action={refreshCvFromProfile} className="t-li">
          <input type="hidden" name="id" value={cv.id} />
          <span className="t-cases t-c1">
            <TalentIcon name="profil" size="s" />
          </span>
          <span className="t-t">
            <button type="submit" className="t-lien">
              <b>{t("docs.editor.refresh")}</b>
            </button>
            <span>{t("docs.editor.refreshHint")}</span>
          </span>
        </form>
        {canDuplicate && (
          <form action={duplicateCv} className="t-li">
            <input type="hidden" name="id" value={cv.id} />
            <span className="t-cases">
              <TalentIcon name="document" size="s" />
            </span>
            <span className="t-t">
              <button type="submit" className="t-lien">
                <b>{t("docs.menu.duplicate")}</b>
              </button>
            </span>
          </form>
        )}
        <form action={deleteCv} className="t-li t-danger">
          <input type="hidden" name="id" value={cv.id} />
          <span className="t-cases">
            <TalentIcon name="supprimer" size="s" />
          </span>
          <span className="t-t">
            <button type="submit" className="t-lien">
              <b>{t("docs.menu.delete")}</b>
            </button>
            <span>{t("docs.menu.deleteHint")}</span>
          </span>
        </form>
      </div>
    </>
  );
}
