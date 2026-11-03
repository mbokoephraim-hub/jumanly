import { describe, expect, it } from "vitest";
import {
  allowedSearch,
  candidateSearchSchema,
  orderCandidates,
  searchCount,
} from "@/server/services/hire-offer-candidates";

// « Candidats » of an offer (Ephraïm, 03/11/2026): the order of application, unless the recruiter
// moved the cards; the filters follow `hire.ats.filters`.
const day = (n: number) => new Date(Date.UTC(2026, 10, n));

describe("ordre des candidats d'une offre", () => {
  it("garde l'ordre de candidature tant que personne n'a déplacé les cartes", () => {
    const rows = [
      { id: "c", recruiterRank: null, createdAt: day(3) },
      { id: "a", recruiterRank: null, createdAt: day(1) },
      { id: "b", recruiterRank: null, createdAt: day(2) },
    ];
    expect(orderCandidates(rows).map((row) => row.id)).toEqual(["a", "b", "c"]);
  });

  it("met d'abord les places choisies, puis les nouvelles candidatures", () => {
    const rows = [
      { id: "a", recruiterRank: 2, createdAt: day(1) },
      { id: "b", recruiterRank: 1, createdAt: day(2) },
      { id: "nouveau", recruiterRank: null, createdAt: day(5) },
    ];
    expect(orderCandidates(rows).map((row) => row.id)).toEqual(["b", "a", "nouveau"]);
  });
});

describe("recherche et filtres des candidats", () => {
  it("lit l'adresse sans jamais échouer", () => {
    const search = candidateSearchSchema.parse({ q: "  excel ", dispo: "n'importe", skill: "x" });
    expect(search).toEqual({ q: "excel", skill: "x", dispo: undefined, ville: "" });
    expect(searchCount(search)).toBe(1);
  });

  it("ne garde que la recherche sans formule qui ouvre les filtres", () => {
    const search = candidateSearchSchema.parse({
      q: "ana",
      skill: "sql",
      dispo: "open",
      ville: "Goma",
    });
    expect(allowedSearch(search, "simple")).toEqual({ q: "ana", skill: "", ville: "" });
    expect(allowedSearch(search, "all")).toEqual(search);
  });
});
