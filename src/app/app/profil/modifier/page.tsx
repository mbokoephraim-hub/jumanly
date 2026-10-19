import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CountrySheet } from "@/components/access/country-sheet";
import { TalentAvatar } from "@/components/talent/avatar";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { PhotoEditor } from "@/components/talent/profile/photo-editor";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { saveHeadAction } from "@/server/actions/profile";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { listCountries, listLocalities } from "@/server/services/places";
import { ensureProfile, PROFILE_SUMMARY_MAX } from "@/server/services/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profil.head");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * « Modifier le profil » (planche talent-4, profil : édition): the photo, the title, the summary,
 * the country and the city. The photo never enters the score; one can go without.
 */
export default async function EditHeadPage({ searchParams }: PageProps<"/app/profil/modifier">) {
  const params = await searchParams;
  const user = await requireUser("/app/profil/modifier");
  const t = await getTranslations();
  const [profile, countries, localities] = await Promise.all([
    ensureProfile(db, user.id),
    listCountries(db),
    listLocalities(db),
  ]);
  const cities = (localities[user.country ?? ""] ?? [])
    .filter((row) => row.kind === "city")
    .map((row) => row.name);
  const error = one(params.erreur);
  const ok = one(params.ok);

  return (
    <div className="t-flux t-od-bas">
      <FlowHead back="/app/profil" backLabel={t("profil.back")} title={t("profil.head.title")} />

      {ok === "photo" && <Notice tone="ok">{t("profil.head.photoSaved")}</Notice>}
      {ok === "photo-retiree" && <Notice tone="ok">{t("profil.head.photoRemoved")}</Notice>}
      {error && (
        <Notice tone="err">
          {error === "type" || error === "size" || error === "photo"
            ? t(`profil.head.photoError.${error}`)
            : t("profil.error")}
        </Notice>
      )}

      <div className="t-ph-ed">
        <TalentAvatar name={user.name} image={user.image} className="t-av-l" />
        <SheetButton target="pf-photo" className="t-bi t-press" label={t("profil.head.photo")}>
          <TalentIcon name="photo" size="s" />
        </SheetButton>
      </div>

      <form id="pf-tete" action={saveHeadAction} className="t-flux">
        <input type="hidden" name="retour" value="/app/profil/modifier" />
        <div className="t-champ">
          <label htmlFor="pf-headline">{t("profil.head.headline")}</label>
          <span className="t-verre t-saisie">
            <input
              id="pf-headline"
              name="headline"
              maxLength={120}
              defaultValue={profile.headline ?? ""}
              placeholder={t("profil.head.headlinePlaceholder")}
            />
          </span>
        </div>
        <div className="t-champ">
          <label htmlFor="pf-summary">{t("profil.head.summary")}</label>
          <textarea
            id="pf-summary"
            name="summary"
            rows={4}
            maxLength={PROFILE_SUMMARY_MAX}
            defaultValue={profile.summary ?? ""}
            placeholder={t("profil.head.summaryPlaceholder")}
            aria-describedby="pf-summary-aide"
            className="t-verre t-saisie t-zone"
          />
          <span id="pf-summary-aide" className="t-aide-c">
            {t("profil.head.summaryHelp", { max: PROFILE_SUMMARY_MAX })}
          </span>
        </div>
        <CountrySheet
          countries={countries.map(({ code, name }) => ({ code, name }))}
          initial={user.country}
          labels={{
            label: t("profil.head.country"),
            choose: t("access.onboarding.places.chooseCountry"),
            title: t("access.countries.title"),
            search: t("access.countries.search"),
            none: t("access.countries.none"),
            close: t("access.countries.close"),
            sections: {
              central: t("access.countries.section.central"),
              westEast: t("access.countries.section.westEast"),
              outside: t("access.countries.section.outside"),
              all: t("access.countries.section.all"),
            },
          }}
        />
        <div className="t-champ">
          <label htmlFor="pf-city">{t("profil.head.city")}</label>
          <span className="t-verre t-saisie">
            <TalentIcon name="localisation" size="s" />
            <input
              id="pf-city"
              name="city"
              required
              maxLength={120}
              autoComplete="address-level2"
              list="pf-cities"
              defaultValue={user.city ?? ""}
            />
            <datalist id="pf-cities">
              {cities.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </span>
        </div>
      </form>

      <p className="t-gar">
        <TalentIcon name="confidentialite" size="s" />
        <span>{t("profil.head.photoRule")}</span>
      </p>

      <div className="t-verre t-fort t-bas-f">
        <button type="submit" form="pf-tete" className="t-bt t-p t-pl t-press">
          {t("profil.save")}
        </button>
      </div>

      <Sheet
        id="pf-photo"
        title={t("profil.head.photo")}
        closeLabel={t("offer.close")}
        openParam="photo"
        defaultOpen={one(params.photo) === "1"}
      >
        <PhotoEditor
          current={user.image ?? undefined}
          hasPhoto={Boolean(user.image)}
          labels={{
            take: t("profil.head.photoTake"),
            choose: t("profil.head.photoChoose"),
            remove: t("profil.head.photoRemove"),
            never: t("profil.head.photoRule"),
            zoom: t("profil.head.photoZoom"),
            save: t("profil.save"),
            empty: t("profil.head.photoEmpty"),
            drag: t("profil.head.photoDrag"),
          }}
        />
      </Sheet>
    </div>
  );
}
