import { describe, expect, it } from "vitest";
import { countByDay, weekOf } from "@/server/services/hire-today";

describe("semaine de « Candidatures cette semaine »", () => {
  it("commence le lundi à minuit UTC et compte sept jours", () => {
    const days = weekOf(new Date("2026-10-21T15:30:00Z"));
    expect(days.map((day) => day.toISOString().slice(0, 10))).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
    ]);
    expect(weekOf(new Date("2026-10-25T23:59:00Z"))[0]!.toISOString()).toBe(
      "2026-10-19T00:00:00.000Z",
    );
    expect(weekOf(new Date("2026-10-26T00:00:00Z"))[0]!.toISOString()).toBe(
      "2026-10-26T00:00:00.000Z",
    );
  });

  it("range chaque date dans son jour, rien hors de la semaine", () => {
    const days = weekOf(new Date("2026-10-21T12:00:00Z"));
    const counts = countByDay(
      [
        new Date("2026-10-19T00:00:00Z"),
        new Date("2026-10-20T23:59:59Z"),
        new Date("2026-10-20T08:00:00Z"),
        new Date("2026-10-18T23:59:59Z"),
        new Date("2026-10-26T00:00:00Z"),
      ],
      days,
    );
    expect(counts.map((item) => item.count)).toEqual([1, 2, 0, 0, 0, 0, 0]);
  });
});
