import { describe, expect, it } from "vitest";
import { hidesRecruiterTabBar } from "@/config/navigation";
import {
  addDays,
  blocksFor,
  busyByDay,
  dayLabels,
  dayLoad,
  freeMornings,
  mondayOf,
  monthGrid,
  nextMonth,
  slotOf,
  suggestSlot,
  zoned,
  zoneLabel,
} from "@/lib/interview-calendar";
import { nextStepOf } from "@/server/services/evaluation";
import { proposedQuestions } from "@/server/services/hire-interviews";
import { experienceLevelOf, skillList } from "@/server/services/talent-search";

describe("calendrier des entretiens", () => {
  it("lit le jour et l'heure dans le fuseau demandé", () => {
    const date = new Date("2026-10-21T23:30:00Z");
    expect(zoned(date, "UTC")).toEqual({ key: "2026-10-21", minutes: 23 * 60 + 30 });
    expect(zoned(date, "Africa/Kinshasa")).toEqual({ key: "2026-10-22", minutes: 30 });
  });

  it("compte les jours et les semaines, lundi en premier", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(mondayOf("2026-10-25")).toBe("2026-10-19");
    expect(nextMonth("2026-12")).toBe("2027-01");
    expect(nextMonth("2026-01", -1)).toBe("2025-12");
    const weeks = monthGrid("2026-10");
    expect(weeks[0]![0]).toBe("2026-09-28");
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks.flat()).toContain("2026-10-31");
  });

  it("lit l'occupation de l'équipe dans ses entretiens Jumanly", () => {
    const byDay = busyByDay(
      [
        {
          organizerId: "a",
          participantIds: ["b"],
          status: "confirmed",
          startsAt: new Date("2026-10-22T09:00:00Z"),
          slots: [],
          durationMinutes: 60,
        },
        {
          organizerId: "c",
          participantIds: [],
          status: "pending",
          startsAt: null,
          slots: [new Date("2026-10-22T14:00:00Z")],
          durationMinutes: 30,
        },
        {
          organizerId: "a",
          participantIds: [],
          status: "canceled",
          startsAt: new Date("2026-10-23T09:00:00Z"),
          slots: [],
          durationMinutes: 60,
        },
      ],
      "UTC",
    );
    const day = byDay.get("2026-10-22")!;
    expect(day).toHaveLength(2);
    expect(day[0]).toMatchObject({ start: 540, end: 600, tentative: false });
    expect(day[1]).toMatchObject({ start: 840, tentative: true });
    expect(byDay.has("2026-10-23")).toBe(false);
    expect(blocksFor(day, ["b"])).toHaveLength(1);
    expect(dayLoad(day)).toBe("free");
    expect(dayLoad([{ start: 480, end: 780, userIds: ["a"], tentative: false }])).toBe("few");
  });

  it("propose les matinées libres et le prochain créneau libre, jamais le week-end", () => {
    const busy = { "2026-10-22": [{ start: 540, end: 720, userIds: ["a"], tentative: false }] };
    // 2026-10-22 is a Thursday, the 24th a Saturday.
    expect(freeMornings(busy, ["a"], "2026-10-22", 4)).toEqual(["2026-10-23"]);
    expect(suggestSlot(busy, ["a"], [], 60, "2026-10-22")).toBe("2026-10-22T12:00");
    expect(suggestSlot(busy, ["a"], ["2026-10-22T12:00"], 60, "2026-10-22")).toBe(
      "2026-10-22T13:00",
    );
    expect(suggestSlot({}, ["a"], [], 60, "2026-10-24")).toBe("2026-10-26T09:00");
    expect(suggestSlot({}, ["a"], [], 60, "2026-10-26", 9 * 60 + 15)).toBe("2026-10-26T10:00");
    expect(slotOf("2026-10-22", 630)).toBe("2026-10-22T10:30");
  });

  it("écrit les jours en français et le fuseau lisiblement", () => {
    const labels = dayLabels("2026-10-20", 2);
    expect(labels["2026-10-20"]!.long).toBe("Mardi 20 octobre");
    expect(labels["2026-10-20"]!.weekday).toBe("MAR");
    expect(labels["2026-10-21"]!.day).toBe("21");
    expect(zoneLabel("UTC")).toBe("UTC");
    expect(zoneLabel("Africa/Kinshasa", new Date("2026-10-20T12:00:00Z"))).toBe("Kinshasa (UTC+1)");
  });
});

describe("préparation et évaluation", () => {
  it("propose des questions sur les compétences de l'offre, les indispensables d'abord", () => {
    const questions = proposedQuestions({
      job: {
        skills: [
          { skillId: "s1", importance: "preferred", skill: { name: "Tableaux de bord" } },
          { skillId: "s2", importance: "required", skill: { name: "SQL" } },
          { skillId: "s3", importance: "required", skill: { name: "Python" } },
        ],
      },
      profile: {
        skills: [
          { skillId: "s2", verified: true, proof: null, source: "certificate", level: 3 },
          { skillId: "s1", verified: false, proof: null, source: "declared", level: 2 },
        ],
      },
    });
    expect(questions.map((item) => item.skill)).toEqual(["SQL", "Python", "Tableaux de bord"]);
    expect(questions[0]).toMatchObject({ kind: "certificate", check: false, required: true });
    expect(questions[1]).toMatchObject({ kind: "missing", check: true });
    expect(questions[2]).toMatchObject({ kind: "declared", check: true, required: false });
  });

  it("lit les anciennes recommandations comme une suite proposée", () => {
    expect(nextStepOf("strong_yes")).toBe("yes");
    expect(nextStepOf("maybe")).toBe("maybe");
    expect(nextStepOf("strong_no")).toBe("no");
  });
});

describe("recherche de talents", () => {
  it("range l'expérience en trois niveaux, sans autre critère personnel", () => {
    expect(experienceLevelOf(0)).toBe("sans");
    expect(experienceLevelOf(3)).toBe("junior");
    expect(experienceLevelOf(4)).toBe("confirme");
  });

  it("lit au plus cinq compétences", () => {
    expect(skillList(" SQL, Power BI ,,Excel,a,b,c")).toEqual([
      "SQL",
      "Power BI",
      "Excel",
      "a",
      "b",
    ]);
  });

  it("garde la barre d'onglets sur l'agenda et les viviers, pas sur un entretien ou un profil", () => {
    expect(hidesRecruiterTabBar("/app/hire/entretiens")).toBe(false);
    expect(hidesRecruiterTabBar("/app/hire/viviers")).toBe(false);
    expect(hidesRecruiterTabBar("/app/hire/entretiens/abc")).toBe(true);
    expect(hidesRecruiterTabBar("/app/hire/talents/abc")).toBe(true);
    expect(hidesRecruiterTabBar("/app/hire/candidats/abc/entretien")).toBe(true);
  });
});
