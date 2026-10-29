import type { SocialKind } from "@/lib/social-links";

/** The tabs of a person's profile (docs/profil-personne § Onglets), in the order of the segment. */
export const PROFILE_TABS = ["publications", "apropos", "realisations", "portfolio"] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number] | "statistiques";

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
  /** The short line under the name: the person's title. */
  bio: string | null;
  /** « À propos », before the skills: a title and up to 400 characters on who they are. */
  about: { title: string | null; text: string } | null;
  connections: number;
  /** « N abonnés » under the bio (Ephraïm 29/10/2026). */
  followers: number;
  /** A recruiter's profile (Ephraïm 27/10/2026): no portfolio, the post and the hiring. */
  recruiter: {
    post: string | null;
    organization: { name: string; slug: string } | null;
    hiringNow: boolean;
    seeking: string | null;
    domains: string[];
    /** « 3 offres en cours ». */
    offers: string;
  } | null;
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
    /** The company's page on Jumanly, when the experience is linked to it. */
    href: string | null;
    /** Its logo: the page's, or the one the person sent. */
    logo: string | null;
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
