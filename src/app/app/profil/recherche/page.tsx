import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { saveSearch } from "@/server/actions/profile";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { ensureProfile } from "@/server/services/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profil.search");
  return { title: t("seo"), robots: { index: false } };
}

const contracts = ["cdi", "cdd", "internship", "freelance", "apprenticeship", "partTime"] as const;
const modes = ["onsite", "hybrid", "remote"] as const;

/** The values already chosen, kept unless unticked. */
function Chips({ name, values }: { name: string; values: string[] }) {
  return values.map((value) => (
    <label key={value} className="t-puce t-press">
      <input type="checkbox" name={name} value={value} defaultChecked />
      {value}
    </label>
  ));
}

/**
 * « Ce que je cherche » (planche talent-4, profil : édition): the jobs aimed at, where to work,
 * contract and mode, the wished salary (seen only by the person and the recruiters they apply
 * to) and whether they are available now.
 */
export default async function SearchPage({ searchParams }: PageProps<"/app/profil/recherche">) {
  const params = await searchParams;
  const user = await requireUser("/app/profil/recherche");
  const t = await getTranslations();
  const profile = await ensureProfile(db, user.id);
  const error = typeof params.erreur === "string";

  return (
    <div className="t-flux t-od-bas">
      <FlowHead
        back="/app/profil?section=recherche#recherche"
        backLabel={t("profil.back")}
        title={t("profil.search.title")}
      />
      {error && <Notice tone="err">{t("profil.error")}</Notice>}
      <form id="pf-rech" action={saveSearch} className="t-flux">
        <input type="hidden" name="retour" value="/app/profil/recherche" />
        <fieldset className="t-fs">
          <legend className="t-ck-t">{t("profil.search.jobs")}</legend>
          <div className="t-puces">
            <Chips name="jobs" values={profile.desiredJobTitles} />
          </div>
          <span className="t-verre t-saisie">
            <TalentIcon name="plus" size="s" />
            <label htmlFor="pf-rech-job" className="sr-only">
              {t("profil.search.addJob")}
            </label>
            <input
              id="pf-rech-job"
              name="newJob"
              maxLength={300}
              placeholder={t("profil.search.addJob")}
            />
          </span>
        </fieldset>
        <fieldset className="t-fs">
          <legend className="t-ck-t">{t("profil.search.places")}</legend>
          <div className="t-puces">
            <Chips name="places" values={profile.desiredLocations} />
          </div>
          <span className="t-verre t-saisie">
            <TalentIcon name="localisation" size="s" />
            <label htmlFor="pf-rech-place" className="sr-only">
              {t("profil.search.addPlace")}
            </label>
            <input
              id="pf-rech-place"
              name="newPlace"
              maxLength={300}
              placeholder={t("profil.search.addPlace")}
            />
          </span>
        </fieldset>
        <fieldset className="t-fs">
          <legend className="t-ck-t">{t("profil.search.contracts")}</legend>
          <div className="t-puces">
            {contracts.map((value) => (
              <label key={value} className="t-puce t-press">
                <input
                  type="checkbox"
                  name="contracts"
                  value={value}
                  defaultChecked={profile.desiredContracts.includes(value)}
                />
                {t(`profil.contract.${value}`)}
              </label>
            ))}
            {modes.map((value) => (
              <label key={value} className="t-puce t-press">
                <input
                  type="checkbox"
                  name="remote"
                  value={value}
                  defaultChecked={profile.remotePreferences.includes(value)}
                />
                {t(`profil.remote.${value}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="t-champ">
          <label htmlFor="pf-rech-salary">{t("profil.search.salary")}</label>
          <span className="t-verre t-saisie">
            <TalentIcon name="salaire" size="s" />
            <input
              id="pf-rech-salary"
              name="salaryMin"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              defaultValue={profile.salaryMin ?? ""}
              placeholder={t("profil.search.salaryPlaceholder")}
              aria-describedby="pf-rech-salary-aide"
            />
          </span>
          <span id="pf-rech-salary-aide" className="t-aide-c">
            {t("profil.search.salaryHelp")}
          </span>
        </div>
        <label className="t-li t-nu">
          <span className="t-t">
            <b>{t("profil.search.availableNow")}</b>
            <span>{t("profil.search.availableText")}</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            name="available"
            defaultChecked={profile.availability === "open"}
            className="sr-only"
          />
          <span aria-hidden className="t-sw" />
        </label>
      </form>
      <div className="t-verre t-fort t-bas-f">
        <button type="submit" form="pf-rech" className="t-bt t-p t-pl t-press">
          {t("profil.save")}
        </button>
      </div>
    </div>
  );
}
