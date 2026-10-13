import type { ComponentProps } from "react";
import { Check } from "lucide-react";
import { cx } from "@/lib/cx";

/**
 * Pill filter (§ 11.5). A styled checkbox: works without JavaScript inside a GET form,
 * which keeps public search pages light.
 */
export function FilterChip({
  id,
  label,
  className,
  ...rest
}: Omit<ComponentProps<"input">, "type" | "id"> & { id: string; label: string }) {
  return (
    <label htmlFor={id} className={cx("cursor-pointer", className)}>
      <input id={id} type="checkbox" className="peer sr-only" {...rest} />
      <span
        className={cx(
          "touch-target inline-flex h-9 items-center gap-1.5 rounded-pill border border-sapin/25 px-4 text-sm font-medium text-sapin transition-colors",
          "peer-checked:border-sapin peer-checked:bg-sapin peer-checked:text-blanc hover:border-sapin",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sapin",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-45",
          "[&>svg]:hidden peer-checked:[&>svg]:block",
        )}
      >
        <Check aria-hidden className="size-4 text-lime" />
        {label}
      </span>
    </label>
  );
}
