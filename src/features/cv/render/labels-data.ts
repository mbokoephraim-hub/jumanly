/**
 * The printed titles and levels of a CV as plain data, so the browser can lay out the same CV
 * as the server while the talent types (« Mes informations », live preview). The functions
 * (months, language and country names) are rebuilt from `Intl` in the language of the titles.
 */
import type { CvLanguageLevel, CvTextLabels } from "./build";

export type CvLabelData = Omit<CvTextLabels, "month" | "languageName" | "location">;

const locales: Record<CvLabelData["language"], string> = { fr: "fr-FR", en: "en-GB" };

function capitalize(text: string, locale: string) {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

export function labelsFromData(data: CvLabelData): CvTextLabels {
  const locale = locales[data.language];
  const names = new Intl.DisplayNames([locale], { type: "language" });
  const regions = new Intl.DisplayNames([locale], { type: "region" });
  const months = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return {
    ...data,
    month: (value) => {
      const date = new Date(`${value}-01T00:00:00Z`);
      return Number.isNaN(date.getTime()) ? value : months.format(date);
    },
    languageName: (code) => {
      try {
        return capitalize(names.of(code) ?? code, locale);
      } catch {
        // A language written by hand (« Lingala ») is printed as written.
        return capitalize(code, locale);
      }
    },
    location: (city, country) =>
      [city, /^[A-Z]{2}$/.test(country) ? (regions.of(country) ?? country) : country]
        .filter(Boolean)
        .join(", "),
  };
}

export type { CvLanguageLevel };
