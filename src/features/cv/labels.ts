import "server-only";
import { getTranslations } from "next-intl/server";
import { countryName } from "@/config/countries";
import { dynamic } from "@/i18n/dynamic";
import type { CvLanguageLevel, CvTextLabels } from "./render/build";
import { cvBlockTypes, type CvBlockType } from "./templates/registry";
import type { CvTitleLanguage } from "./style";

const levelCodes: CvLanguageLevel[] = ["native", "fluent", "professional", "intermediate", "basic"];
const locales: Record<CvTitleLanguage, string> = { fr: "fr-FR", en: "en-GB" };

function capitalize(text: string, locale: string) {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/**
 * Titles and levels printed on a CV, in the language chosen for the titles (`cv.titles.<lang>.*`,
 * `cv.levels.<lang>.*`), whatever the language of the interface (§ 4.5).
 */
export async function cvTextLabels(language: CvTitleLanguage): Promise<CvTextLabels> {
  const t = dynamic(await getTranslations("cv"));
  const locale = locales[language];
  const names = new Intl.DisplayNames([locale], { type: "language" });
  const months = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return {
    language,
    titles: Object.fromEntries(
      cvBlockTypes.map((type) => [type, t(`titles.${language}.${type}`)]),
    ) as Record<CvBlockType, string>,
    levels: {
      1: t(`levels.${language}.1`),
      2: t(`levels.${language}.2`),
      3: t(`levels.${language}.3`),
      4: t(`levels.${language}.4`),
    },
    languageLevels: Object.fromEntries(
      levelCodes.map((code) => [code, t(`languageLevels.${language}.${code}`)]),
    ) as Record<CvLanguageLevel, string>,
    present: t(`present.${language}`),
    month: (value) => months.format(new Date(`${value}-01T00:00:00Z`)),
    languageName: (code) => capitalize(names.of(code) ?? code, locale),
    location: (city, country) =>
      [city, country ? countryName(country) : ""].filter(Boolean).join(", "),
  };
}
