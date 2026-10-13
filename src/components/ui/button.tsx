import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "inverse" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

// Spec § 11.5: primary Lime, secondary Sapin, tertiary outline.
// Lime always carries Sapin text, never white (§ 11.1).
const variants: Record<ButtonVariant, string> = {
  primary: "bg-lime text-sapin hover:bg-[#97e85a] active:bg-[#88d94c]",
  secondary: "bg-sapin text-blanc hover:bg-[#145045] active:bg-nuit",
  tertiary: "border border-sapin/30 bg-transparent text-sapin hover:border-sapin hover:bg-sapin/5",
  // Outline on dark backgrounds (Sapin bands).
  inverse: "border border-blanc/40 bg-transparent text-blanc hover:border-blanc hover:bg-blanc/10",
  danger: "bg-corail-fonce text-blanc hover:bg-[#8a2718]",
};

// Small buttons keep a 44 px touch area (§ 11.8).
const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm gap-1.5 touch-target",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

type StyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: StyleProps = {}) {
  return cx(
    "inline-flex items-center justify-center rounded-pill font-medium whitespace-nowrap",
    "transition-colors disabled:pointer-events-none disabled:opacity-45",
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
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={cx(buttonClasses({ variant, size, fullWidth }), className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

const iconVariants = {
  plain: "text-sapin hover:bg-sapin/8",
  outline: "border border-sapin/30 text-sapin hover:border-sapin",
  sapin: "bg-sapin text-blanc hover:bg-[#145045]",
  lime: "bg-lime text-sapin hover:bg-[#97e85a]",
};

/** Round icon button. `label` is mandatory: it is the accessible name. */
export function IconButton({
  label,
  variant = "plain",
  className,
  children,
  type = "button",
  ...rest
}: Omit<ComponentProps<"button">, "aria-label"> & {
  label: string;
  variant?: keyof typeof iconVariants;
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors",
        "disabled:pointer-events-none disabled:opacity-45",
        iconVariants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
