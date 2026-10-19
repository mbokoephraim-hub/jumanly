/** Orbi's conversation, shared by the server and the page (talent lot 4 § 9). */

/** Pages Orbi can propose, by key: an answer never carries a free link. */
export const orbiActions = {
  cv: "/app/career/cv",
  linkedin: "/app/career/linkedin",
  interview: "/app/career/entretiens",
  jobs: "/app/jobs",
  diagnostic: "/app/career/diagnostic",
  plan: "/app/career/plan",
  learn: "/app/learn",
  profile: "/app/profil",
} as const;
export type OrbiAction = keyof typeof orbiActions;

export const MESSAGE_MAX = 1000;

export type OrbiLimit = "consent" | "entitlement" | "quota" | "unavailable";

export type OrbiReply = {
  id: string;
  role: "user" | "orbi";
  /** Paragraphs. */
  text: string[];
  actions: OrbiAction[];
  why: string | null;
  source: "ai" | "rules" | null;
  limit: OrbiLimit | null;
  createdAt: Date;
};

/** The four aids of Orbi (planche Fondations § 11), on its page and in its web panel. */
export const orbiAides = [
  { key: "cv", href: "/app/career/cv", icon: "cv" },
  { key: "interview", href: "/app/career/entretiens", icon: "entretien" },
  { key: "offer", href: "/app/jobs", icon: "opportunites" },
  { key: "path", href: "/app/career/diagnostic", icon: "cap" },
] as const;
