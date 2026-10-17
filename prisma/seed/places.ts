/**
 * Countries, cities and provinces (V8 § B1): valid in every environment, upserted so the seed can
 * run again; nothing a person chose is ever deleted.
 */
import type { SeedClient } from "./client";
import {
  centralAfrica,
  isoCountries,
  localities,
  nameOverrides,
  otherAfrica,
  westAfrica,
} from "./places-data";

type Region = "central_africa" | "west_africa" | "other_africa" | "world";

function regionOf(code: string): Region {
  if (centralAfrica.includes(code)) return "central_africa";
  if (westAfrica.includes(code)) return "west_africa";
  if (otherAfrica.includes(code) || code === "EH") return "other_africa";
  return "world";
}

export async function seedPlaces(db: SeedClient) {
  const names = new Intl.DisplayNames(["fr-FR"], { type: "region" });
  for (const code of isoCountries) {
    const name = nameOverrides[code] ?? names.of(code) ?? code;
    const region = regionOf(code);
    await db.country.upsert({
      where: { code },
      update: { name, region },
      create: { code, name, region },
    });
  }
  for (const [countryCode, places] of Object.entries(localities)) {
    const rows = [
      ...places.cities.map((name) => ({ name, kind: "city" as const })),
      ...(places.provinces ?? []).map((name) => ({ name, kind: "province" as const })),
    ];
    for (const [rank, row] of rows.entries()) {
      await db.locality.upsert({
        where: { countryCode_name: { countryCode, name: row.name } },
        update: { kind: row.kind, rank },
        create: { countryCode, name: row.name, kind: row.kind, rank },
      });
    }
  }
  console.log(`Lieux : ${isoCountries.length} pays.`);
}
