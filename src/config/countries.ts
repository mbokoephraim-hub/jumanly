/** Countries offered in the forms: African countries first, then the main diaspora countries. ISO 3166-1 codes. */
const african = [
  "DZ",
  "AO",
  "BJ",
  "BW",
  "BF",
  "BI",
  "CV",
  "CM",
  "CF",
  "TD",
  "KM",
  "CG",
  "CD",
  "CI",
  "DJ",
  "EG",
  "GQ",
  "ER",
  "SZ",
  "ET",
  "GA",
  "GM",
  "GH",
  "GN",
  "GW",
  "KE",
  "LS",
  "LR",
  "LY",
  "MG",
  "MW",
  "ML",
  "MR",
  "MU",
  "MA",
  "MZ",
  "NA",
  "NE",
  "NG",
  "RW",
  "ST",
  "SN",
  "SC",
  "SL",
  "SO",
  "ZA",
  "SS",
  "SD",
  "TZ",
  "TG",
  "TN",
  "UG",
  "ZM",
  "ZW",
];
const others = ["BE", "CA", "FR", "DE", "CH", "GB", "US"];

/**
 * Country names in French, sorted, for a select field. The value is the name (contact forms,
 * read by a person) or the ISO code (accounts, used by the app).
 */
export function countryOptions(
  value: "name" | "code" = "name",
): { value: string; label: string }[] {
  const names = new Intl.DisplayNames(["fr-FR"], { type: "region" });
  const sort = (codes: string[]) =>
    codes
      .map((code) => ({
        value: value === "code" ? code : (names.of(code) ?? code),
        label: names.of(code) ?? code,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
  return [...sort(african), ...sort(others)];
}

/** "CD" → "Congo-Kinshasa"; any other value is returned as is. */
export function countryName(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  return new Intl.DisplayNames(["fr-FR"], { type: "region" }).of(code) ?? code;
}
