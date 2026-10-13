/** Amounts are stored in USD cents (integers). Display: "19,9" in French notation (textes, partie 05). */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
