/** Main goals offered on the welcome screen (textes `welcome.talent.goal.*`). */
export const welcomeGoals = [
  "firstJob",
  "newJob",
  "reconversion",
  "promotion",
  "skills",
  "freelance",
] as const;

export type WelcomeGoal = (typeof welcomeGoals)[number];

/** The three homes of « Pour moi » (docs/ux-mobile-talent, BRIEF § 2 point 1). */
export const homeFocuses = ["job", "skills", "career"] as const;
export type HomeFocus = (typeof homeFocuses)[number];

/**
 * The home of « Pour moi » for a stored goal, without migration: the six goals of the profile fall
 * into three homes. No goal yet: the job home, marked as not personalised.
 */
export function homeFocus(goal: string | null | undefined): {
  focus: HomeFocus;
  personalised: boolean;
} {
  switch (goal) {
    case "skills":
    case "reconversion":
      return { focus: "skills", personalised: true };
    case "promotion":
      return { focus: "career", personalised: true };
    case "firstJob":
    case "newJob":
    case "freelance":
      return { focus: "job", personalised: true };
    default:
      return { focus: "job", personalised: false };
  }
}

/**
 * The goal stored when the talent picks a home on the goal screen (screen 01). A finer goal already
 * stored that falls into the same home is kept (« Me reconvertir » stays, for example).
 */
export function goalForFocus(focus: HomeFocus, current: string | null | undefined): WelcomeGoal {
  if (current && homeFocus(current).personalised && homeFocus(current).focus === focus)
    return current as WelcomeGoal;
  return focus === "job" ? "newJob" : focus === "skills" ? "skills" : "promotion";
}
