/** Contact form constants shared with the browser (no validation library, no server code). */

export const MESSAGE_MIN = 20;
export const MESSAGE_MAX = 2000;

/** Subjects of /contact (texts `contact.form.subject.*`). */
export const contactSubjects = [
  "account",
  "talent",
  "billing",
  "recruiter",
  "quote",
  "partners",
  "privacy",
  "report",
  "press",
  "other",
] as const;

export type ContactSubject = (typeof contactSubjects)[number];

export const partnerTypes = [
  "bank",
  "university",
  "foundation",
  "company",
  "international",
  "public",
  "other",
] as const;
export const partnerPlans = ["starter", "pro", "premium", "unsure"] as const;

/** Particular needs of a Company Premium quote request (texts `quote.needs.*`). */
export const quoteNeeds = [
  "workflows",
  "integrations",
  "dashboards",
  "onboarding",
  "support",
  "partners",
] as const;
export type QuoteNeed = (typeof quoteNeeds)[number];

/** Error codes, mapped to texts `contact.form.error.*` and `partners.contact.form.error.*`. */
export type FieldError =
  "required" | "email" | "messageShort" | "messageLong" | "consent" | "number";
