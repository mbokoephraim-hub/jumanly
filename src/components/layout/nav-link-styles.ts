import { cx } from "@/lib/cx";

const placements = {
  // 92 px Sapin bar (mockup 00-04): icon above its label, active item on Lime.
  sidebar: {
    base: "jm-nav-link flex w-16 flex-col items-center gap-[5px] rounded-[18px] pt-[9px] pb-[7px] text-center text-[10px] leading-3 font-medium [&_svg]:size-[22px]",
    on: "jm-nav-active jm-ring bg-lime text-sapin",
    off: "text-blanc/65 hover:bg-blanc/10 hover:text-blanc",
  },
  // Floating mobile pill: icons only, the active item widens and shows its label.
  pill: {
    base: "flex h-12 items-center justify-center rounded-pill [&_svg]:size-[22px]",
    on: "jm-nav-active gap-[7px] bg-lime px-4 text-xs font-semibold text-sapin",
    off: "w-[46px] text-blanc/70 hover:text-blanc",
  },
  // Public header, Modèle B (28/10/2026): plain links, the current page in Lime.
  public: {
    base: "flex h-10 items-center rounded-pill px-4 text-[15px] font-medium whitespace-nowrap transition-colors",
    on: "text-lime",
    off: "text-sapin hover:text-lime",
  },
  // Floating gradient column of Jumanly Admin (Admin v3): icon only, label in a tooltip.
  rail: {
    base: "jm-admin-link relative grid size-[46px] shrink-0 place-items-center rounded-full transition-colors [&_svg]:size-[22px]",
    on: "bg-lime text-sapin shadow-[0_0_0_4px_rgb(166_242_107/0.18),0_0_22px_rgb(166_242_107/0.6)]",
    off: "text-blanc/75 hover:bg-blanc/12 hover:text-blanc",
  },
  // Wide Nuit menu of Jumanly Admin (« more » sheet on phones): icon and label on one line.
  admin: {
    base: "flex h-[42px] shrink-0 items-center gap-3 rounded-sm px-3.5 text-[13.5px] whitespace-nowrap [&_svg]:size-5",
    on: "bg-lime font-semibold text-sapin",
    off: "font-medium text-blanc/70 hover:bg-blanc/8 hover:text-blanc",
  },
};

export type NavPlacement = keyof typeof placements;

/** Classes of a navigation link; shared by `NavLink` and its server-rendered fallbacks. */
export function navLinkClasses(placement: NavPlacement, active: boolean) {
  const style = placements[placement];
  return cx(style.base, active ? style.on : style.off);
}
