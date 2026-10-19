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

/** The four goals of the first connection (planche talent-4 § 1, step 1 of 4). */
export const onboardingGoals = [
  "firstJob",
  "newJob",
  "skills",
  "reconversion",
] as const satisfies readonly WelcomeGoal[];

/** Contracts offered at the first connection (planche: CDI, CDD, Stage, Freelance). */
export const welcomeContracts = ["cdi", "cdd", "internship", "freelance"] as const;

/** Work modes of the first connection (planche: Sur site, Hybride, À distance). */
export const workModes = ["onsite", "hybrid", "remote"] as const;
