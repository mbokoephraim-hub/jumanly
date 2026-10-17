import { describe, expect, it } from "vitest";
import { jobPlacesFor } from "@/server/services/jobs";
import { checkPlaces, listCountries, listLocalities } from "@/server/services/places";
import { db } from "./helpers";

describe("référentiel des pays et des lieux (V8 § B1)", () => {
  it("liste tous les pays, RD Congo en tête, avec leurs villes et provinces", async () => {
    const countries = await listCountries(db);
    expect(countries.length).toBe(249);
    expect(countries[0]).toEqual({ code: "CD", name: "RD Congo", region: "central_africa" });
    expect(countries.find((country) => country.code === "CI")?.name).toBe("Côte d’Ivoire");
    const localities = await listLocalities(db);
    expect(localities.CD?.[0]).toEqual({ name: "Kinshasa", kind: "city" });
    expect(localities.CD?.some((place) => place.kind === "province")).toBe(true);
  });

  it("ne garde que les pays connus et les lieux de ces pays", async () => {
    const checked = await checkPlaces(db, {
      countries: ["cd", "CG", "ZZ"],
      places: ["CD:Kinshasa", "CG:Brazzaville", "CD:Brazzaville", "FR:Paris", "CD:Inventée"],
    });
    expect(checked.countries).toEqual(["CD", "CG"]);
    expect(checked.places.sort()).toEqual(["Brazzaville", "Kinshasa"]);
  });

  it("traduit les lieux du profil en filtre d'offres", async () => {
    const places = await jobPlacesFor(db, {
      desiredCountries: ["CD", "CG"],
      desiredLocations: ["Kinshasa", "Haut-Katanga", "Brazzaville"],
      remotePreferences: ["remote"],
    });
    expect(places?.remote).toBe(true);
    // A province is not a city of the offers: RD Congo is kept whole.
    expect(places?.areas[0]?.cities).toEqual([]);
    expect(places?.areas[1]?.cities).toEqual(["Brazzaville"]);
    expect(
      await jobPlacesFor(db, { desiredCountries: [], desiredLocations: [], remotePreferences: [] }),
    ).toBeNull();
  });
});
