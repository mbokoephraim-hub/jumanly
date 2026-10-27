/** Password rules (docs/specifications.md, partie 10 § 10.1; textes `signup.account.password.*`). */
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

export type PasswordProblem = "passwordTooShort" | "passwordWeak";

/** First rule a password breaks, or null. Leaked passwords are checked by the server. */
export function passwordProblem(password: string): PasswordProblem | null {
  if (password.length < PASSWORD_MIN) return "passwordTooShort";
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) return "passwordWeak";
  return null;
}

export type PasswordStrength = "weak" | "medium" | "strong";

export function passwordStrength(password: string): PasswordStrength {
  if (passwordProblem(password)) return "weak";
  const classes = [/\p{Ll}/u, /\p{Lu}/u, /\d/, /[^\p{L}\d]/u].filter((r) => r.test(password));
  return password.length >= 14 && classes.length >= 3 ? "strong" : "medium";
}

/** Minimum age to use Jumanly (textes `signup.account.consent.age`). */
export const MIN_AGE = 16;
/** Digits of e-mail codes (verification and two-step sign-in). */
export const CODE_DIGITS = 6;
/** E-mail codes and sign-in links stay valid this long. */
export const CODE_MINUTES = 15;
/** Life of the sign-up confirmation link sent by e-mail. */
export const VERIFY_LINK_HOURS = 24;
