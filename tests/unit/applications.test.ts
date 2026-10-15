import { describe, expect, it } from "vitest";
import { applicationTracker } from "@/server/services/applications";

const stages = [
  { kind: "new" as const, name: "Nouvelles candidatures", order: 0 },
  { kind: "screening" as const, name: "Présélection", order: 1 },
  { kind: "interview" as const, name: "Entretien", order: 2 },
  { kind: "offer" as const, name: "Proposition", order: 3 },
  { kind: "hired" as const, name: "Recruté", order: 4 },
  { kind: "rejected" as const, name: "Non retenu", order: 5 },
];

const states = (steps: ReturnType<typeof applicationTracker>) =>
  steps.map((step) => `${step.status}:${step.state}`);

describe("étapes d'une candidature", () => {
  it("suit les étapes du recruteur, sans la boîte de départ ni la décision", () => {
    const steps = applicationTracker(
      { viewedAt: new Date(), stage: { kind: "interview" }, job: { stages } },
      "interview",
    );
    expect(states(steps)).toEqual([
      "sent:done",
      "viewed:done",
      "shortlisted:done",
      "interview:current",
      "offer:next",
    ]);
  });

  it("une candidature envoyée et pas encore lue en est à la première étape", () => {
    const steps = applicationTracker(
      { viewedAt: null, stage: { kind: "new" }, job: { stages } },
      "sent",
    );
    expect(states(steps).slice(0, 2)).toEqual(["sent:current", "viewed:next"]);
  });

  it("lue par le recruteur, elle passe à « consultée »", () => {
    const steps = applicationTracker(
      { viewedAt: new Date(), stage: { kind: "new" }, job: { stages } },
      "viewed",
    );
    expect(states(steps).slice(0, 3)).toEqual(["sent:done", "viewed:current", "shortlisted:next"]);
  });

  it("recrutée : toutes les étapes sont faites", () => {
    const steps = applicationTracker(
      { viewedAt: new Date(), stage: { kind: "hired" }, job: { stages } },
      "hired",
    );
    expect(steps.every((step) => step.state === "done")).toBe(true);
  });
});
