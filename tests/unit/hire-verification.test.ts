import { describe, expect, it } from "vitest";
import { coherenceChecks, complete } from "@/server/services/hire-verification";

describe("dossier de vérification", () => {
  it("est complet quand toutes les pièces obligatoires sont là", () => {
    const now = new Date();
    expect(
      complete([
        { required: true, receivedAt: now },
        { required: false, receivedAt: null },
      ]),
    ).toBe(true);
    expect(complete([{ required: true, receivedAt: null }])).toBe(false);
  });

  it("signale une école absente du CV, sans juger", () => {
    expect(
      coherenceChecks({
        education: { school: "Université de Kinshasa", endYear: 2020 },
        cvText: "Licence, ISC Gombe, 2019",
      }),
    ).toEqual([{ key: "school_not_in_cv", values: { school: "Université de Kinshasa" } }]);
  });

  it("compare l'année écrite près de l'école", () => {
    expect(
      coherenceChecks({
        education: { school: "ISC Gombe", endYear: 2020 },
        cvText: "Licence en gestion, ISC Gombe, 2018",
      }),
    ).toEqual([{ key: "year_differs", values: { cv: "2018", piece: "2020" } }]);
    expect(
      coherenceChecks({
        education: { school: "ISC Gombe", endYear: 2018 },
        cvText: "Licence, ISC Gombe (2018)",
      }),
    ).toEqual([]);
  });
});
