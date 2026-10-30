import { describe, expect, it } from "vitest";
import {
  testStatusOf,
  testSurveyErrors,
  testSurveySchema,
  weeklyCounts,
} from "@/server/services/waitlist-test";

describe("test de la plateforme (liste d'attente)", () => {
  it("compte les inscrits par semaine, du lundi au dimanche", () => {
    const now = new Date("2026-10-30T12:00:00Z"); // un vendredi
    const weeks = weeklyCounts(
      [
        new Date("2026-10-26T08:00:00Z"), // lundi de la semaine en cours
        new Date("2026-10-30T09:00:00Z"),
        new Date("2026-10-25T23:00:00Z"), // dimanche de la semaine d'avant
        new Date("2025-01-01T00:00:00Z"), // trop ancien
      ],
      now,
      4,
    );
    expect(weeks.map((week) => week.count)).toEqual([0, 0, 1, 2]);
    expect(weeks[3]!.start.toISOString()).toBe("2026-10-26T00:00:00.000Z");
  });

  it("situe chaque personne dans le test", () => {
    const date = new Date();
    expect(testStatusOf({ invitedAt: null, surveySentAt: null })).toBe("waiting");
    expect(testStatusOf({ invitedAt: date, surveySentAt: null })).toBe("invited");
    expect(testStatusOf({ invitedAt: date, surveySentAt: date })).toBe("surveyed");
    expect(testStatusOf({ invitedAt: date, surveySentAt: date, feedback: { id: "x" } })).toBe(
      "answered",
    );
  });

  it("exige les notes, l'appareil et les améliorations", () => {
    const valid = {
      overall: "4",
      ease: "5",
      design: "3",
      usefulness: "4",
      speed: "2",
      recommend: "9",
      areas: ["feed", "learn"],
      device: "phone",
      improvements: "Accélérer le chargement des formations.",
      liked: "",
    };
    const parsed = testSurveySchema.parse(valid);
    expect(parsed.overall).toBe(4);
    expect(parsed.liked).toBeUndefined();

    const result = testSurveySchema.safeParse({
      ...valid,
      overall: "6",
      device: "",
      improvements: " ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(testSurveyErrors(result.error)).toMatchObject({
        overall: "rating",
        device: "required",
        improvements: "required",
      });
    }
  });
});
