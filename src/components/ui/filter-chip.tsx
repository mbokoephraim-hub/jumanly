import { Icon } from "@/components/brand/icon";
import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

/** Pill look shared by filters (`.chip` of the mockups): white with a Brume outline, Sapin when on. */
export const chipClasses = cx(
  "touch-target inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-pill bg-blanc px-3.5",
  "text-[12.5px] font-medium whitespace-nowrap text-sapin ring-[1.5px] ring-sapin/20 ring-inset transition-colors",
  "hover:ring-sapin/50 [&_svg]:size-3.5",
);

export const chipOnClasses = "bg-sapin text-blanc ring-0 hover:ring-0";

/**
 * Pill filter (mockup 00-02). A styled checkbox: works without JavaScript inside a GET form,
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
          chipClasses,
          "peer-checked:bg-sapin peer-checked:text-blanc peer-checked:ring-0",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sapin",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-45",
          "[&>svg]:hidden peer-checked:[&>svg]:block",
        )}
      >
        <Icon name="check" className="text-lime" />
        {label}
      </span>
    </label>
  );
}
