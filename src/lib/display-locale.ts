import { cache } from "react";

/**
 * Language used to format dates, amounts and country names. A public page in English sets it
 * (`applySiteLocale`); everywhere else, and in client components, it stays French.
 */
const store = cache((): { locale: "fr" | "en" } => ({ locale: "fr" }));

export function setDisplayLocale(locale: "fr" | "en") {
  store().locale = locale;
}

export function displayLocale(): "fr" | "en" {
  return store().locale;
}

/** BCP 47 tag for `Intl`: "fr-FR" or "en-US". */
export function intlLocale(): string {
  return displayLocale() === "en" ? "en-US" : "fr-FR";
}
