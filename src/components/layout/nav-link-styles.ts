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
  // White public header: Lime underline under the current page.
  public: {
    base: "flex h-[84px] items-center text-[14.5px] font-medium whitespace-nowrap",
    on: "text-sapin [&>span]:shadow-[0_2px_0_var(--jm-lime)]",
    off: "text-sapin hover:[&>span]:shadow-[0_2px_0_var(--jm-brume)]",
  },
  // Wide Nuit bar of Jumanly Admin: icon and label on one line.
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
