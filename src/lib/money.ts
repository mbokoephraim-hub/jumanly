/** Amounts are stored in USD cents (integers). Display: "19,90" in French notation. */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
