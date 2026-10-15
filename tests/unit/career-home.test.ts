// @vitest-environment node
import { describe, expect, it } from "vitest";
import { entitlementSeeds, planSeeds } from "../../prisma/seed/plans";
import { careerJourney, CV_READY_SCORE, type JourneyFacts } from "@/server/services/career-journey";
import {
  isEntryPlan,
  lockableTools,
  paidTalentPlans,
  planForTool,
  planOpens,
  upgradeOffer,
} from "@/server/services/career-offer";
import type { PublicPlan } from "@/server/services/plans";

/** Plans as the Career home reads them, built from the seed (no database needed). */
const plans: PublicPlan[] = planSeeds.map((plan) => ({
  code: plan.code,
  family: plan.family,
  name: plan.name,
  tagline: plan.tagline,
  contentKey: plan.contentKey,
  priceCents: plan.priceCents,
  isPurchasable: plan.isPurchasable,
  recommended: plan.recommended,
  entitlements: Object.fromEntries(
    entitlementSeeds()
      .filter((row) => row.planCode === plan.code)
      .map((row) => [row.key, row.value]),
  ),
}));

const nothing: JourneyFacts = {
  diagnosticAt: null,
  cvScore: null,
  documents: 0,
  hasLinkedin: false,
  projects: 0,
  applications: 0,
  simulationsThisMonth: 0,
};

describe("careerJourney", () => {
  it("starts at « Faire le point » with nothing done", () => {
    const journey = careerJourney(nothing);
    expect(journey.done).toBe(0);
    expect(journey.current).toBe("point");
    expect(journey.steps.map((step) => step.state)).toEqual(["current", "next", "next", "next"]);
    expect(journey.progress).toBe(8);
  });

  it("moves to the CV once a diagnostic exists, then on once the CV is ready", () => {
    const afterDiagnostic = careerJourney({ ...nothing, diagnosticAt: new Date(), cvScore: 7 });
    expect(afterDiagnostic.done).toBe(1);
    expect(afterDiagnostic.current).toBe("cv");
    expect(afterDiagnostic.progress).toBe(25);

    const afterCv = careerJourney({ ...nothing, diagnosticAt: new Date(), cvScore: 82 });
    expect(afterCv.done).toBe(2);
    expect(afterCv.current).toBe("apply");
  });

  it("counts the CV as built from 60/100 exactly", () => {
    expect(CV_READY_SCORE).toBe(60);
    expect(careerJourney({ ...nothing, cvScore: 59 }).steps[1]!.state).toBe("next");
    expect(careerJourney({ ...nothing, cvScore: 60 }).steps[1]!.state).toBe("done");
  });

  it("keeps the first step not done as current, even when a later one is done", () => {
    const journey = careerJourney({ ...nothing, simulationsThisMonth: 1 });
    expect(journey.current).toBe("point");
    expect(journey.steps[3]!.state).toBe("done");
    expect(journey.done).toBe(1);
  });

  it("counts any document, LinkedIn proposal, project or application for step 3", () => {
    for (const facts of [
      { documents: 1 },
      { hasLinkedin: true },
      { projects: 2 },
      { applications: 1 },
    ]) {
      expect(careerJourney({ ...nothing, ...facts }).steps[2]!.state).toBe("done");
    }
  });

  it("is finished when the four steps are done", () => {
    const journey = careerJourney({
      ...nothing,
      diagnosticAt: new Date(),
      cvScore: 75,
      applications: 3,
      simulationsThisMonth: 2,
    });
    expect(journey.done).toBe(4);
    expect(journey.current).toBeNull();
    expect(journey.progress).toBe(100);
  });
});

describe("offer band", () => {
  const paid = paidTalentPlans(plans);

  it("shows no band when nothing is locked", () => {
    expect(upgradeOffer(plans, [])).toBeNull();
  });

  it("puts forward the cheapest paid plan that opens a locked tool, with what it opens", () => {
    const offer = upgradeOffer(plans, [...lockableTools]);
    expect(offer).not.toBeNull();
    const cheapest = paid.find((plan) => lockableTools.some((tool) => planOpens(plan, tool)));
    expect(offer!.plan.code).toBe(cheapest!.code);
    expect(offer!.tools).toEqual(lockableTools.filter((tool) => planOpens(offer!.plan, tool)));
    expect(offer!.tools.length).toBeGreaterThan(0);
  });

  it("only lists tools that are locked for the talent", () => {
    const offer = upgradeOffer(plans, ["portfolio"]);
    expect(offer!.tools).toEqual(["portfolio"]);
    expect(offer!.plan.code).toBe(planForTool(plans, "portfolio")!.code);
  });

  it("shows no band when no public plan opens the locked tools", () => {
    const closed = plans.map((plan) => ({ ...plan, entitlements: {} }));
    expect(upgradeOffer(closed, [...lockableTools])).toBeNull();
  });

  it("marks only the first paid level as the entry plan", () => {
    expect(isEntryPlan(plans, paid[0]!)).toBe(true);
    for (const plan of paid.slice(1)) expect(isEntryPlan(plans, plan)).toBe(false);
  });
});
