import type { IconName } from "@/components/brand/icon";

/**
 * One universe per module of the signed-in space (docs/experience-animee/BRIEF-ESPACE-UTILISATEUR.md
 * § 1): its background, its ambient pattern and its shape, shown in the page banner and, very
 * lightly, behind the top of the page. Never behind running text.
 */
export type UniverseKey =
  | "home"
  | "profile"
  | "learn"
  | "career"
  | "intelligence"
  | "jobs"
  | "connect"
  | "hire"
  | "partner"
  | "billing"
  | "settings";

export type Universe = {
  key: UniverseKey;
  /** `public/marque/fonds/<background>-16x9.svg`. */
  background: string;
  /** Pattern family: `public/marque/motifs/motif-<pattern>-clair.svg`, laid at 6 to 10 % behind the top of the Crème page. */
  pattern: string | null;
  /** `public/marque/formes/<shape>.svg`, drifting in the banner. */
  shape: string;
  /** Dark backgrounds carry white text; light ones carry Sapin text (WCAG AA either way). */
  tone: "dark" | "light";
  /** Tint that slowly flows over the background. */
  tint: string;
  icon: IconName;
};

const universes: Record<UniverseKey, Universe> = {
  home: {
    key: "home",
    background: "fond-06-sapin-orbites",
    pattern: "orbites",
    shape: "forme-orbites-lime",
    tone: "dark",
    tint: "linear-gradient(120deg, rgb(15 63 55 / 0.55), rgb(30 154 100 / 0.25), rgb(15 63 55 / 0.55))",
    icon: "accueil",
  },
  profile: {
    key: "profile",
    background: "fond-01-creme-trajectoire",
    pattern: "trajectoires",
    shape: "forme-trajectoire-lime",
    tone: "light",
    tint: "linear-gradient(120deg, rgb(255 255 255 / 0.5), rgb(217 250 114 / 0.28), rgb(255 255 255 / 0.5))",
    icon: "profil",
  },
  learn: {
    key: "learn",
    background: "fond-04-lime-pastilles",
    pattern: "pastilles",
    shape: "forme-pilule-sapin",
    tone: "light",
    tint: "linear-gradient(120deg, rgb(217 250 114 / 0.5), rgb(255 255 255 / 0.22), rgb(217 250 114 / 0.5))",
    icon: "learn",
  },
  career: {
    key: "career",
    background: "fond-07-sapin-trajectoires",
    pattern: "trajectoires",
    shape: "forme-trajectoire-lime",
    tone: "dark",
    tint: "linear-gradient(120deg, rgb(15 63 55 / 0.5), rgb(125 227 107 / 0.18), rgb(15 63 55 / 0.5))",
    icon: "career",
  },
  intelligence: {
    key: "intelligence",
    background: "fond-08-intelligence",
    pattern: "orbites",
    shape: "forme-orbe-couleur",
    tone: "dark",
    tint: "linear-gradient(120deg, rgb(15 63 55 / 0.45), rgb(47 211 166 / 0.22), rgb(15 63 55 / 0.45))",
    icon: "intelligence",
  },
  jobs: {
    key: "jobs",
    background: "fond-02-creme-reseau",
    pattern: "reseau",
    shape: "forme-point-lime",
    tone: "light",
    tint: "linear-gradient(120deg, rgb(226 247 236 / 0.7), rgb(255 255 255 / 0.3), rgb(226 247 236 / 0.7))",
    icon: "jobs",
  },
  connect: {
    key: "connect",
    background: "fond-03-blanc-minimal",
    pattern: "points",
    shape: "forme-point-lime",
    tone: "light",
    tint: "linear-gradient(120deg, rgb(255 255 255 / 0.4), rgb(217 250 114 / 0.2), rgb(255 255 255 / 0.4))",
    icon: "message",
  },
  hire: {
    key: "hire",
    background: "fond-10-profondeur-monogramme",
    pattern: "monogramme",
    shape: "forme-arc-lime",
    tone: "dark",
    tint: "linear-gradient(120deg, rgb(11 26 31 / 0.5), rgb(30 154 100 / 0.2), rgb(11 26 31 / 0.5))",
    icon: "entreprise",
  },
  partner: {
    key: "partner",
    background: "fond-09-nuit-orbe",
    pattern: "orbites",
    shape: "forme-arc-lime",
    tone: "dark",
    tint: "linear-gradient(120deg, rgb(11 26 31 / 0.5), rgb(30 154 100 / 0.2), rgb(11 26 31 / 0.5))",
    icon: "certificat",
  },
  billing: {
    key: "billing",
    background: "fond-05-signature",
    pattern: "pastilles",
    shape: "forme-etincelle-sapin",
    tone: "light",
    tint: "linear-gradient(120deg, rgb(217 250 114 / 0.55), rgb(166 242 107 / 0.3), rgb(217 250 114 / 0.55))",
    icon: "portefeuille",
  },
  settings: {
    key: "settings",
    background: "fond-03-blanc-minimal",
    pattern: null,
    shape: "forme-point-lime",
    tone: "light",
    tint: "linear-gradient(120deg, rgb(255 255 255 / 0.4), rgb(243 239 230 / 0.5), rgb(255 255 255 / 0.4))",
    icon: "reglages",
  },
};

/** Most specific first: the first prefix that matches the path wins. */
const routes: [prefix: string, key: UniverseKey][] = [
  ["/app/career/diagnostic", "intelligence"],
  ["/app/career", "career"],
  ["/app/profil", "profile"],
  ["/app/learn", "learn"],
  ["/app/jobs", "jobs"],
  ["/app/messages", "connect"],
  ["/app/notifications", "connect"],
  ["/app/hire", "hire"],
  ["/app/organisation", "hire"],
  ["/app/partenaire", "partner"],
  ["/app/abonnement", "billing"],
  ["/app/parametres", "settings"],
];

export function universeFor(pathname: string): Universe {
  for (const [prefix, key] of routes) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return universes[key];
  }
  return universes.home;
}

export function universe(key: UniverseKey): Universe {
  return universes[key];
}
