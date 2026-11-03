import { describe, expect, it } from "vitest";
import { agendaOf } from "@/server/services/hire-agenda";

const DAY = 86_400_000;
const now = new Date("2026-11-03T12:00:00Z");
const base = {
  jobId: "j1",
  status: "active" as const,
  job: { title: "Analyste", blindSort: false },
  profile: { user: { name: "Awa" } },
  verification: null,
  events: [] as { type: string; createdAt: Date }[],
  shortlistedAt: null as Date | null,
  createdAt: new Date(now.getTime() - DAY),
};

describe("agendaOf", () => {
  it("lists reviews due, late pieces and people waiting", () => {
    const tasks = agendaOf(
      [
        {
          ...base,
          id: "a",
          events: [{ type: "on_hold", createdAt: new Date(now.getTime() - 4 * DAY) }],
        },
        {
          ...base,
          id: "b",
          events: [{ type: "on_hold", createdAt: new Date(now.getTime() - DAY) }],
        },
        { ...base, id: "c", createdAt: new Date(now.getTime() - 9 * DAY) },
        {
          ...base,
          id: "d",
          shortlistedAt: now,
          verification: {
            dueAt: new Date(now.getTime() - DAY),
            items: [
              { required: true, receivedAt: now },
              { required: true, receivedAt: null },
            ],
          },
        },
        { ...base, id: "e" },
      ],
      now,
    );
    expect(tasks.reviews.map((item) => [item.applicationId, item.due])).toEqual([
      ["a", true],
      ["b", false],
    ]);
    expect(tasks.pieces).toMatchObject([
      { applicationId: "d", received: 1, required: 2, late: true },
    ]);
    expect(tasks.waiting).toEqual([{ jobId: "j1", jobTitle: "Analyste", count: 1 }]);
    expect(tasks.due).toBe(3);
  });

  it("hides the name of a blind offer until the person is retained", () => {
    const tasks = agendaOf(
      [
        {
          ...base,
          id: "a",
          job: { title: "Analyste", blindSort: true },
          events: [{ type: "on_hold", createdAt: now }],
        },
      ],
      now,
    );
    expect(tasks.reviews[0]!.name).toBeNull();
  });
});
