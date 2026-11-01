import { describe, expect, it } from "vitest";
import {
  confidenceChange,
  confidenceOf,
  potentialOf,
  strongPotential,
} from "@/server/services/hire-scores";

const now = new Date("2026-11-01T00:00:00Z");
const at = (iso: string) => new Date(iso);

describe("trois notes d'Orbi", () => {
  it("le potentiel suit formations récentes, progression et preuves", () => {
    const potential = potentialOf(
      {
        experiences: [
          { title: "Assistante comptable", startDate: at("2021-01-01"), endDate: at("2024-01-01") },
          { title: "Responsable comptable", startDate: at("2024-02-01"), endDate: null },
        ],
        trainings: [{ at: at("2026-05-01") }, { at: at("2026-09-01") }],
        skills: [{ proven: true }, { proven: true }, { proven: false }],
      },
      now,
    );
    expect(potential.value).toBe(90);
    expect(potential.reasons).toEqual(["training", "progression", "proofs"]);
    expect(strongPotential(potential.value, 60)).toBe(true);
    expect(strongPotential(potential.value, 80)).toBe(false);
  });

  it("une formation ancienne ne compte pas", () => {
    expect(
      potentialOf({ experiences: [], trainings: [{ at: at("2023-01-01") }], skills: [] }, now)
        .value,
    ).toBe(0);
  });

  it("la confiance monte avec les pièces reçues", () => {
    const base = {
      skills: [{ proven: true }, { proven: false }],
      items: [{ confirmed: false }],
    };
    expect(confidenceOf({ ...base, pieces: [] })).toEqual({ value: 33, level: "low" });
    const change = confidenceChange({
      ...base,
      pieces: [
        { required: true, received: true },
        { required: true, received: true },
        { required: true, received: true },
      ],
    });
    expect(change.before.level).toBe("low");
    expect(change.after).toEqual({ value: 67, level: "medium" });
    expect(change.changed).toBe(true);
  });
});
