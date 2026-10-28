import { setRequestLocale } from "next-intl/server";
import { siteLocales } from "./site-routes";

export { siteLocales };

/**
 * Language of a public page. English is laid over French (textes/en/): a text not yet translated
 * stays in French. The signed-in space stays in French for now.
 */
export type SiteLocale = (typeof siteLocales)[number];

export function isSiteLocale(value: unknown): value is SiteLocale {
  return (siteLocales as readonly unknown[]).includes(value);
}

/**
 * Sets the language of the page being rendered. Each public layout, page and `generateMetadata`
 * calls it first, before reading any text: the segments of a page render side by side, and the
 * public pages are rendered statically per language (patched next-intl, see
 * docs/decisions/2026-10-28-site-bilingue.md).
 */
export async function applySiteLocale(params: Promise<{ locale: string }>): Promise<SiteLocale> {
  const { locale } = await params;
  const value = isSiteLocale(locale) ? locale : "fr";
  setRequestLocale(value);
  return value;
}
