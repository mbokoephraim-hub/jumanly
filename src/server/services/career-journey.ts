/**
 * The Career journey of the Career home (docs/refonte-career/BRIEF-CAREER-V2.md § 3): four steps,
 * each done by a fact read in the database, the current one being the first not done. Pure, so
 * it is tested without a database. Rules and the CV threshold:
 * docs/decisions/2026-10-15-career-v2.md.
 */
import { stageFloors } from "./diagnostic-scoring";

export const journeySteps = ["point", "cv", "apply", "train"] as const;
export type JourneyStep = (typeof journeySteps)[number];

/** A CV is "built" at the « Prêt » floor of the diagnostic scale (60/100). */
export const CV_READY_SCORE = stageFloors.ready;

export type JourneyFacts = {
  /** Date of the last diagnostic, or null. */
  diagnosticAt: Date | null;
  /** Score of the primary CV out of 100, or null without a CV. */
  cvScore: number | null;
  documents: number;
  hasLinkedin: boolean;
  projects: number;
  applications: number;
  /** Simulations (written or oral) done this month. */
  simulationsThisMonth: number;
};

export type JourneyItem = {
  key: JourneyStep;
  state: "done" | "current" | "next";
};

export type Journey = {
  steps: JourneyItem[];
  done: number;
  /** The step in progress, or null when all four are done. */
  current: JourneyStep | null;
  /** Width of the progress bar, in percent (at least 8 while a step is in progress). */
  progress: number;
};

export function stepDone(step: JourneyStep, facts: JourneyFacts): boolean {
  switch (step) {
    case "point":
      return facts.diagnosticAt !== null;
    case "cv":
      return facts.cvScore !== null && facts.cvScore >= CV_READY_SCORE;
    case "apply":
      return (
        facts.documents > 0 || facts.hasLinkedin || facts.projects > 0 || facts.applications > 0
      );
    case "train":
      return facts.simulationsThisMonth > 0;
  }
}

export function careerJourney(facts: JourneyFacts): Journey {
  const finished = journeySteps.map((step) => stepDone(step, facts));
  const currentIndex = finished.indexOf(false);
  const steps = journeySteps.map((key, index) => ({
    key,
    state: finished[index]
      ? ("done" as const)
      : index === currentIndex
        ? ("current" as const)
        : ("next" as const),
  }));
  const done = finished.filter(Boolean).length;
  const current = currentIndex === -1 ? null : journeySteps[currentIndex]!;
  const progress = current === null ? 100 : Math.max(8, (done / journeySteps.length) * 100);
  return { steps, done, current, progress };
}
