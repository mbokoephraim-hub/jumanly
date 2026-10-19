/**
 * Countries, cities and provinces (V8 § B1, screens 81 and 82). The reference lives in the database
 * (seeded from ISO 3166 and GeoNames); this module orders it the way the mockups show it.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { orderCountries, type CountryOption, type LocalityOption } from "@/lib/places";

export { orderCountries, placeRegions } from "@/lib/places";
export type { CountryOption, LocalityOption, PlaceRegion } from "@/lib/places";

export async function listCountries(db: PrismaClient): Promise<CountryOption[]> {
  const rows = await db.country.findMany({ select: { code: true, name: true, region: true } });
  return orderCountries(rows);
}

/** Countries with their dialling code (« Indicatif » of a Mobile Money number), same order. */
export async function listDialCountries(db: PrismaClient) {
  const rows = await db.country.findMany({
    where: { dialCode: { not: null } },
    select: { code: true, name: true, region: true, dialCode: true },
  });
  return orderCountries(rows);
}

/** Cities and provinces of each country, largest first; countries without any are left out. */
export async function listLocalities(db: PrismaClient): Promise<Record<string, LocalityOption[]>> {
  const rows = await db.locality.findMany({
    select: { countryCode: true, name: true, kind: true },
    orderBy: [{ countryCode: "asc" }, { rank: "asc" }],
  });
  const byCountry: Record<string, LocalityOption[]> = {};
  for (const row of rows)
    (byCountry[row.countryCode] ??= []).push({ name: row.name, kind: row.kind });
  return byCountry;
}

/**
 * Keeps only known countries and, for each, only its own places: what the browser sends is checked
 * against the reference, never stored as typed.
 */
export async function checkPlaces(
  db: PrismaClient,
  input: { countries: string[]; places: string[] },
): Promise<{ countries: string[]; places: string[] }> {
  const codes = [...new Set(input.countries.map((code) => code.toUpperCase()))];
  const known = await db.country.findMany({
    where: { code: { in: codes } },
    select: { code: true },
  });
  const countries = codes.filter((code) => known.some((row) => row.code === code));
  // A place is sent as « CD:Kinshasa ».
  const wanted = input.places
    .map((value) => value.split(":"))
    .filter(([code, name]) => code && name && countries.includes(code.toUpperCase()));
  const found = await db.locality.findMany({
    where: {
      OR: wanted.map(([code, name]) => ({ countryCode: code.toUpperCase(), name })),
    },
    select: { name: true },
  });
  return { countries, places: [...new Set(found.map((row) => row.name))] };
}
