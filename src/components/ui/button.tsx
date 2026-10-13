import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

// Lime always carries Sapin text, never white (contrast rule, CLAUDE.md § 10).
const variants: Record<ButtonVariant, string> = {
  primary: "bg-sapin text-blanc hover:bg-[#145045] active:bg-nuit",
  secondary: "bg-lime text-sapin hover:bg-[#97e85a] active:bg-[#88d94c]",
  outline: "border border-sapin/25 bg-transparent text-sapin hover:border-sapin hover:bg-sapin/5",
  ghost: "bg-transparent text-sapin hover:bg-sapin/8",
  danger: "bg-corail text-blanc hover:bg-[#cf4b3b]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
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
