import { cx } from "@/lib/cx";

/**
 * Small colored drawings of the public menu (30/10/2026): each entry gets a pastel tile and a
 * flat two-tone drawing in Jumanly's colors (Sapin, Lime, Menthe, Corail, Ambre, plus Lilas and
 * Rose for liveliness). Decorative only: the title next to it says what the entry is.
 */
export type MenuArtName =
  | "talents"
  | "recruiters"
  | "companies"
  | "partners"
  | "trainings"
  | "jobs"
  | "pricing"
  | "about"
  | "cv"
  | "career"
  | "connect"
  | "free"
  | "why"
  | "privacy"
  | "payment";

const SAPIN = "#0f3f37";
const LIME = "#a6f26b";
const MENTHE = "#2fd3a6";
const CORAIL = "#f08a7c";
const AMBRE = "#f4c463";
const LILAS = "#9b87f5";
const ROSE = "#f5a3c7";

const tiles: Record<MenuArtName, string> = {
  talents: "bg-[#e9fbd9]",
  recruiters: "bg-[#ece8ff]",
  companies: "bg-[#ffeedd]",
  partners: "bg-[#fde7f0]",
  trainings: "bg-[#fff4d6]",
  jobs: "bg-[#dcf8ef]",
  pricing: "bg-[#ffe5e0]",
  about: "bg-[#e3f1ff]",
  cv: "bg-[#ece8ff]",
  career: "bg-[#e9fbd9]",
  connect: "bg-[#fde7f0]",
  free: "bg-[#dcf8ef]",
  why: "bg-[#fff4d6]",
  privacy: "bg-[#e3f1ff]",
  payment: "bg-[#ffeedd]",
};

export function MenuArt({
  name,
  size = "md",
  className,
}: {
  name: MenuArtName;
  /** md: menu entries; lg: cards of the home page. */
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "jm-menu-art flex shrink-0 items-center justify-center",
        size === "lg" ? "size-16 rounded-[20px]" : "size-[52px] rounded-[16px]",
        tiles[name],
        className,
      )}
    >
      <svg viewBox="0 0 48 48" className={size === "lg" ? "size-11" : "size-9"} fill="none">
        {drawings[name]}
      </svg>
    </span>
  );
}

const drawings: Record<MenuArtName, React.ReactNode> = {
  // A person and a growing spark.
  talents: (
    <>
      <circle cx="21" cy="16" r="8" fill={SAPIN} />
      <path d="M7 40c0-8.3 6.3-14 14-14s14 5.7 14 14z" fill={LIME} />
      <path d="M38 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill={MENTHE} />
    </>
  ),
  // A profile card under a magnifying glass.
  recruiters: (
    <>
      <rect x="4" y="9" width="28" height="22" rx="5" fill={LILAS} />
      <circle cx="13" cy="18" r="4" fill="#fff" />
      <rect x="19" y="15" width="9" height="3" rx="1.5" fill="#fff" />
      <rect x="19" y="21" width="6" height="3" rx="1.5" fill="#fff" />
      <circle cx="31" cy="30" r="8" fill="#fff" stroke={SAPIN} strokeWidth="4" />
      <path d="M37 36l6 6" stroke={SAPIN} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  // Two buildings.
  companies: (
    <>
      <rect x="6" y="12" width="20" height="30" rx="3" fill={SAPIN} />
      <rect x="26" y="20" width="16" height="22" rx="3" fill={CORAIL} />
      <rect x="11" y="18" width="4" height="4" rx="1" fill={AMBRE} />
      <rect x="18" y="18" width="4" height="4" rx="1" fill={AMBRE} />
      <rect x="11" y="26" width="4" height="4" rx="1" fill={AMBRE} />
      <rect x="18" y="26" width="4" height="4" rx="1" fill={AMBRE} />
      <rect x="13" y="34" width="6" height="8" rx="1" fill={AMBRE} />
      <rect x="31" y="26" width="6" height="3" rx="1.5" fill="#fff" />
      <rect x="31" y="32" width="6" height="3" rx="1.5" fill="#fff" />
    </>
  ),
  // Two linked rings.
  partners: (
    <>
      <circle cx="18" cy="24" r="11" stroke={ROSE} strokeWidth="7" />
      <circle cx="30" cy="24" r="11" stroke={SAPIN} strokeWidth="7" />
      <path d="M24 14.8a11 11 0 0 1 0 18.4" stroke={ROSE} strokeWidth="7" />
    </>
  ),
  // An open book and a cap.
  trainings: (
    <>
      <path d="M4 18l20-9 20 9-20 9z" fill={SAPIN} />
      <path d="M12 23v8c0 3 5.4 6 12 6s12-3 12-6v-8l-12 5.4z" fill={AMBRE} />
      <path d="M40 20v12" stroke={SAPIN} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="40" cy="34" r="3" fill={CORAIL} />
    </>
  ),
  // A briefcase.
  jobs: (
    <>
      <path d="M17 14v-3a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" stroke={SAPIN} strokeWidth="4" />
      <rect x="5" y="14" width="38" height="26" rx="6" fill={MENTHE} />
      <path d="M5 24h38" stroke={SAPIN} strokeWidth="3" />
      <rect x="20" y="21" width="8" height="7" rx="2" fill={LIME} stroke={SAPIN} strokeWidth="2" />
    </>
  ),
  // A price tag.
  pricing: (
    <>
      <path
        d="M24 5h15a4 4 0 0 1 4 4v15L23 44a3 3 0 0 1-4.2 0L4 29.2a3 3 0 0 1 0-4.2z"
        fill={CORAIL}
      />
      <circle cx="34" cy="14" r="4" fill="#fff" />
      <path d="M15 28l10-10" stroke={SAPIN} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  // A speech bubble with a heart.
  about: (
    <>
      <path
        d="M8 8h32a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H20l-9 8v-8H8a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z"
        fill="#5aa9f0"
      />
      <path
        d="M24 28s-8-4.7-8-10a4.5 4.5 0 0 1 8-2.8 4.5 4.5 0 0 1 8 2.8c0 5.3-8 10-8 10z"
        fill={LIME}
      />
    </>
  ),
  // A CV sheet with a photo and lines.
  cv: (
    <>
      <rect x="9" y="4" width="30" height="40" rx="5" fill={LILAS} />
      <circle cx="19" cy="15" r="5" fill="#fff" />
      <rect x="15" y="25" width="18" height="3" rx="1.5" fill="#fff" />
      <rect x="15" y="31" width="13" height="3" rx="1.5" fill="#fff" />
      <path
        d="M33 30l4 4 8-9"
        stroke={SAPIN}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  // Bars that grow, an arrow going up.
  career: (
    <>
      <rect x="6" y="30" width="8" height="12" rx="2.5" fill={MENTHE} />
      <rect x="18" y="22" width="8" height="20" rx="2.5" fill={LIME} />
      <rect x="30" y="13" width="8" height="29" rx="2.5" fill={SAPIN} />
      <path
        d="M6 20L18 11l6 5L38 5"
        stroke={CORAIL}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  // Two speech bubbles.
  connect: (
    <>
      <path
        d="M6 7h24a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H16l-7 6v-6H6a4 4 0 0 1-4-4V11a4 4 0 0 1 4-4z"
        fill={ROSE}
      />
      <path
        d="M42 18H24a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h11l6 5v-5h1a4 4 0 0 0 4-4V22a4 4 0 0 0-4-4z"
        fill={SAPIN}
      />
      <circle cx="28" cy="27" r="2" fill={LIME} />
      <circle cx="34" cy="27" r="2" fill={LIME} />
      <circle cx="40" cy="27" r="2" fill={LIME} />
    </>
  ),
  // A check in a round seal.
  free: (
    <>
      <circle cx="24" cy="24" r="19" fill={MENTHE} />
      <circle cx="24" cy="24" r="13" fill="#fff" />
      <path
        d="M17 24.5l5 5 9-10"
        stroke={SAPIN}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  // An eye and a spark: the « Pourquoi ? » of each suggestion.
  why: (
    <>
      <path d="M3 24s8-13 21-13 21 13 21 13-8 13-21 13S3 24 3 24z" fill={AMBRE} />
      <circle cx="24" cy="24" r="8" fill={SAPIN} />
      <circle cx="27" cy="21" r="2.5" fill="#fff" />
    </>
  ),
  // A padlock.
  privacy: (
    <>
      <path d="M15 21v-6a9 9 0 0 1 18 0v6" stroke={SAPIN} strokeWidth="4.5" />
      <rect x="8" y="20" width="32" height="24" rx="6" fill="#5aa9f0" />
      <circle cx="24" cy="30" r="3.5" fill="#fff" />
      <rect x="22.5" y="31" width="3" height="7" rx="1.5" fill="#fff" />
    </>
  ),
  // A phone paying a card.
  payment: (
    <>
      <rect x="6" y="14" width="30" height="20" rx="4" fill={CORAIL} />
      <rect x="6" y="19" width="30" height="4" fill={SAPIN} />
      <rect x="26" y="8" width="16" height="32" rx="4" fill={SAPIN} />
      <rect x="29" y="12" width="10" height="20" rx="2" fill={LIME} />
      <circle cx="34" cy="36" r="1.6" fill="#fff" />
    </>
  ),
};
