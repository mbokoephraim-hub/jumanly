/** Choices of the end-of-test questionnaire (shared with the client form). */

/** Parts of the platform a tester can say they tried (`testSurvey.areas.<key>`). */
export const testAreas = [
  "feed",
  "explore",
  "career",
  "learn",
  "messages",
  "jobs",
  "hire",
  "orbi",
] as const;
export const testDevices = ["phone", "computer", "tablet"] as const;
/** Ratings from 1 to 5 (`testSurvey.questions.<key>`). */
export const testRatings = ["overall", "ease", "design", "usefulness", "speed"] as const;
export type TestRating = (typeof testRatings)[number];
