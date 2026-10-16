import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { PendingMark } from "./pending-mark";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "white" | "inverse" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

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
};

// 48 / 40 / 32 px. Small buttons keep a 44 px touch area (§ 11.8).
const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-xs gap-1.5 touch-target [&_svg]:size-4",
  md: "h-10 px-[18px] text-[13px] gap-2 [&_svg]:size-[18px]",
  lg: "h-12 px-6 text-sm gap-2 [&_svg]:size-5",
};

type StyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  /** Icon after the label (« Créer mon compte › », « Reprendre › »). */
  iconAfter?: ReactNode;
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
  };

export function Button({
  variant,
  size,
  fullWidth,
  icon,
  iconAfter,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(buttonClasses({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
      {iconAfter}
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
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={cx(buttonClasses({ variant, size, fullWidth }), className)} {...rest}>
      {icon}
      {children}
      {iconAfter}
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
