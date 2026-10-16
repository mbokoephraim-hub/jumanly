import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { PendingMark } from "./pending-mark";
import { Spinner } from "./spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "white"
  | "inverse"
  | "danger"
  // Mobile Talent v5 range (planche « Boutons », docs/ux-mobile-talent).
  | "principal"
  | "accent"
  | "soft"
  | "outline"
  | "link"
  | "ai"
  | "dangerOutline";
/** sm/md/lg: 32/40/48 px. L/M/S (v5): 52 px for fixed action bars, 44 px in cards, 36 px in lists. */
export type ButtonSize = "sm" | "md" | "lg" | "L" | "M" | "S";

// Mockup 00-02: always pills. Primary Lime (one per area), secondary Sapin, tertiary outline.
// Lime always carries Sapin text, never white (§ 11.1). Hover: Lime −8 %.
const variants: Record<ButtonVariant, string> = {
  primary: "bg-lime text-sapin hover:bg-[#8fd957] active:bg-[#82cc4b]",
  secondary: "bg-sapin text-blanc hover:bg-[#145045] active:bg-nuit",
  tertiary:
    "bg-transparent text-sapin ring-[1.5px] ring-brume ring-inset hover:bg-blanc hover:ring-sapin/40",
  // On a tinted card (module colors): white pill.
  white: "bg-blanc text-sapin ring-1 ring-brume hover:ring-sapin/40",
  // On dark backgrounds (Sapin, Nuit, AI gradient).
  inverse: "bg-blanc/10 text-blanc ring-1 ring-blanc/22 ring-inset hover:bg-blanc/18",
  // Corail of the mockup, darkened for AA contrast with white text (CLAUDE.md § 10).
  danger: "bg-corail-fonce text-blanc hover:bg-[#8a2718]",
  // v5: the action that moves forward, one per screen. Pressed: darker, Lime halo.
  principal:
    "bg-gradient-principal text-blanc shadow-[var(--jm-ombre-principal)] hover:brightness-110 active:brightness-90 active:ring-2 active:ring-lime",
  // v5: Lime gradient, Sapin text (resume a course, discover a plan). Never white on Lime.
  accent: "bg-gradient-accent text-sapin hover:brightness-105 active:ring-2 active:ring-lime/70",
  // v5 « secondaire »: white with a soft shadow, next to a principal (Later, Preview).
  soft: "bg-blanc text-sapin shadow-douce hover:ring-1 hover:ring-brume active:bg-lime-clair active:ring-2 active:ring-lime",
  outline:
    "bg-blanc text-sapin ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40 active:bg-lime-clair",
  link: "bg-transparent text-sapin underline-offset-4 hover:underline px-1.5!",
  // Reserved to Jumanly AI: night aurora with an iridescent ring.
  ai: "jm-ai-surface text-blanc hover:brightness-110",
  dangerOutline:
    "bg-blanc text-corail-fonce ring-[1.5px] ring-corail/45 ring-inset hover:bg-corail/6",
};

// 48 / 40 / 32 px. Small buttons keep a 44 px touch area (§ 11.8).
const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-xs gap-1.5 touch-target [&_svg]:size-4",
  md: "h-10 px-[18px] text-[13px] gap-2 [&_svg]:size-[18px]",
  lg: "h-12 px-6 text-sm gap-2 [&_svg]:size-5",
  L: "h-[52px] px-6 text-[15px] gap-2.5 [&_svg]:size-5",
  M: "h-11 px-5 text-sm gap-2 [&_svg]:size-[18px]",
  S: "h-9 px-4 text-[13px] gap-1.5 touch-target [&_svg]:size-4",
};

// The Lime round with an arrow that ends a principal button (Postuler ›).
const arrowSizes: Partial<Record<ButtonSize, string>> = {
  L: "size-9 -mr-3.5",
  lg: "size-8 -mr-3.5",
  M: "size-8 -mr-3",
  md: "size-7 -mr-2.5",
};

function ButtonArrow({ size = "md" }: { size?: ButtonSize }) {
  return (
    <span
      aria-hidden
      className={cx(
        "ml-1 inline-flex shrink-0 items-center justify-center rounded-full bg-lime text-sapin",
        arrowSizes[size] ?? "-mr-2 size-6",
      )}
    >
      <Icon name="chev-r" />
    </span>
  );
}

type StyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  /** Icon after the label (« Créer mon compte › », « Reprendre › »). */
  iconAfter?: ReactNode;
  /** v5: ends the button with the Lime round and its arrow (actions that move forward). */
  arrow?: boolean;
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: StyleProps = {}) {
  return cx(
    "inline-flex shrink-0 items-center justify-center rounded-pill font-semibold whitespace-nowrap",
    "jm-press transition-[color,background-color,box-shadow,transform] disabled:pointer-events-none disabled:opacity-45",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
  );
}

type ButtonProps = ComponentProps<"button"> &
  StyleProps & {
    /** Shows a spinner and blocks the button while an action runs. */
    loading?: boolean;
    /** Done, confirmed by the server: accent look with a check, no second click. */
    done?: boolean;
  };

export function Button({
  variant,
  size,
  fullWidth,
  icon,
  iconAfter,
  arrow = false,
  loading = false,
  done = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading || done}
      aria-busy={loading || undefined}
      className={cx(
        buttonClasses({ variant: done ? "accent" : variant, size, fullWidth }),
        // Sending or done still looks alive; a disabled gradient turns flat grey, never a dull gradient.
        (done || loading) && "disabled:opacity-100!",
        loading && "disabled:brightness-110",
        disabled &&
          !loading &&
          !done &&
          (variant === "principal" || variant === "accent") &&
          "disabled:bg-brume! disabled:bg-none! disabled:text-ardoise! disabled:opacity-100! disabled:shadow-none!",
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : done ? <Icon name="check" /> : icon}
      {children}
      {iconAfter}
      {arrow && !loading && !done && <ButtonArrow size={size} />}
      {type === "submit" && !loading && <PendingMark />}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & StyleProps;

/** A navigation link that looks like a button. */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  icon,
  iconAfter,
  arrow = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={cx(buttonClasses({ variant, size, fullWidth }), className)} {...rest}>
      {icon}
      {children}
      {iconAfter}
      {arrow && <ButtonArrow size={size} />}
    </Link>
  );
}

const iconVariants = {
  plain: "text-sapin hover:bg-sapin/8",
  outline: "bg-blanc text-sapin ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40",
  creme: "bg-creme text-sapin hover:bg-brume",
  sapin: "bg-sapin text-blanc hover:bg-[#145045]",
  lime: "bg-lime text-sapin hover:bg-[#8fd957]",
  inverse: "bg-blanc/10 text-blanc hover:bg-blanc/18",
};

const iconSizes = { sm: "size-8 touch-target [&_svg]:size-4", md: "size-10 [&_svg]:size-5" };

/** Round icon button. `label` is mandatory: it is the accessible name. */
export function IconButton({
  label,
  variant = "plain",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: Omit<ComponentProps<"button">, "aria-label"> & {
  label: string;
  variant?: keyof typeof iconVariants;
  size?: keyof typeof iconSizes;
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-colors",
        "disabled:pointer-events-none disabled:opacity-45",
        iconSizes[size],
        iconVariants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
