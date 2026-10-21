/**
 * Choices of an interview practice on the phone (Modèle B, lot B6), shared by the screens and the
 * service: seven focuses, of which three are not open to the trial session, and 5, 10 or 15
 * minutes (3, 6 or 9 questions).
 */
export const phoneFocuses = [
  "full",
  "experiences",
  "technical",
  "motivation",
  "situations",
  "traps",
  "english",
] as const;
export type PhoneFocus = (typeof phoneFocuses)[number];

export const advancedFocuses = ["situations", "traps", "english"] as const;
export const isAdvancedFocus = (type: string) =>
  (advancedFocuses as readonly string[]).includes(type);

export const phoneDurations = [5, 10, 15] as const;
/** The trial session lasts 5 minutes. */
export const TRIAL_MINUTES = 5;

/** Questions of a phone session: three every 5 minutes. */
export const phoneQuestionCount = (minutes: number) => Math.max(3, Math.round((minutes * 3) / 5));
