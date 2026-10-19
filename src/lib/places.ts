/**
 * Countries, cities and provinces as the screens show them (V8 § B1, screens 81 and 82). Shared by
 * the server (src/server/services/places.ts) and the pickers in the browser.
 */
export const placeRegions = ["central_africa", "west_africa", "other_africa", "world"] as const;
export type PlaceRegion = (typeof placeRegions)[number];

export type CountryOption = { code: string; name: string; region: PlaceRegion };
export type LocalityOption = { name: string; kind: "city" | "province" };

/** RD Congo first, then each region from A to Z (French order). */
export function orderCountries<T extends CountryOption>(countries: T[]): T[] {
  return [...countries].sort((a, b) => {
    if (a.code === "CD" || b.code === "CD") return a.code === "CD" ? -1 : 1;
    const region = placeRegions.indexOf(a.region) - placeRegions.indexOf(b.region);
    return region || a.name.localeCompare(b.name, "fr");
  });
}

/** For searching: « Côte d'Ivoire » is found with « cote ». */
export const foldPlace = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/**
 * The country sheet of the first connection and of the Mobile Money number (brief § 2 decision 5,
 * planche talent-4 « Votre pays »): RD Congo first, the main countries of Central Africa, then of
 * West and East Africa, the main countries outside Africa, then every other country from A to Z.
 */
export const countrySheetGroups = {
  central: ["CG", "CM", "GA", "AO", "RW"],
  westEast: ["CI", "SN", "NG", "GH", "KE", "MA"],
  outside: ["FR", "BE", "GB", "DE", "US", "CA", "RU"],
} as const;

export type CountrySection<T> = {
  key: "first" | keyof typeof countrySheetGroups | "all";
  countries: T[];
};

export function countrySections<T extends { code: string; name: string }>(
  countries: T[],
): CountrySection<T>[] {
  const byCode = new Map(countries.map((country) => [country.code, country]));
  const pick = (codes: readonly string[]) =>
    codes.map((code) => byCode.get(code)).filter((country): country is T => Boolean(country));
  const listed = new Set<string>(["CD", ...Object.values(countrySheetGroups).flat()]);
  const sections: CountrySection<T>[] = [
    { key: "first", countries: pick(["CD"]) },
    { key: "central", countries: pick(countrySheetGroups.central) },
    { key: "westEast", countries: pick(countrySheetGroups.westEast) },
    { key: "outside", countries: pick(countrySheetGroups.outside) },
    {
      key: "all",
      countries: countries
        .filter((country) => !listed.has(country.code))
        .sort((a, b) => a.name.localeCompare(b.name, "fr")),
    },
  ];
  return sections.filter((section) => section.countries.length > 0);
}
