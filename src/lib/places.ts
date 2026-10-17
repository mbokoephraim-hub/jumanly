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
