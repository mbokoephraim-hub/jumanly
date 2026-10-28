import { intlLocale } from "./display-locale";

/**
 * Amounts are stored in USD cents (integers). Display: "19,9" in French notation (textes, partie 05),
 * "19.9" on the English pages of the public site.
 */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat(intlLocale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
