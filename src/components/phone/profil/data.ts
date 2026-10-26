import type { SocialKind } from "@/lib/social-links";

/** The tabs of a person's profile (docs/profil-personne § Onglets), in the order of the segment. */
export const PROFILE_TABS = ["publications", "apropos", "realisations", "portfolio"] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];

/**
 * A person's profile as the phone shows it (docs/profil-personne, maquette `Profil.dc.html`):
 * every text already written on the server, colours already chosen.
 */
export type ProfileView = {
  id: string;
  name: string;
  first: string;
  initials: string;
  tone: number;
  image: string | null;
  /** The banner the person chose, or null for the drawn one (`bannerColor` and its motif). */
  banner: string | null;
  bannerColor: { background: string; motif: string };
  /** The small label at the bottom right of the banner (the person's field). */
  domain: string | null;
  /** The ring around the photo: the colours of the first five skills. */
  ring: string[];
  online: boolean;
  socials: { kind: SocialKind | "email"; href: string; label: string }[];
  verified: boolean;
  handle: string;
  place: { flag: string; flagLabel: string; text: string; time: string | null } | null;
  bio: string | null;
  connections: number;
  contract: string | null;
  activity: string | null;
  common: {
    people: { initials: string; image: string | null; color: string }[];
    line: string;
  } | null;
  skills: { name: string; color: string; verified: boolean }[];
  skillsCount: string;
  families: { label: string; color: string; share: number }[];
  experiences: {
    id: string;
    initials: string;
    color: string;
    title: string;
    current: boolean;
    company: string;
    type: string;
    dates: string;
    points: string[];
  }[];
  experiencesCount: string;
  educations: { id: string; title: string; line: string }[];
  languages: { name: string; level: number; label: string }[];
  works: {
    id: string;
    kind: string;
    title: string;
    cover: string | null;
    color: string;
    href: string | null;
    skills: { name: string; color: string }[];
  }[];
  files: { id: string; badge: string; title: string; line: string; href: string; color: string }[];
  /** Connection with the viewer (vue connexion only). */
  link: "none" | "sent" | "connected" | "received";
  conversationId: string | null;
};
