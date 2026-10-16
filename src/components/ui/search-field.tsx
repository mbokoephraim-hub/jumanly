import { Icon } from "@/components/brand/icon";
import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

/** Pill-shaped search field (mockup 00-02, `.champ`). The label is read by screen readers only. */
export function SearchField({
  id,
  label,
  className,
  ...rest
}: Omit<ComponentProps<"input">, "type" | "id"> & { id: string; label: string }) {
  return (
    <div className={cx("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Icon
        name="recherche"
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ardoise"
      />
      <input
        id={id}
        type="search"
        className={cx(
          "h-12 w-full rounded-pill bg-blanc pr-5 pl-11 text-[13px] text-sapin ring-[1.5px] ring-sapin/20 ring-inset",
          "transition-shadow placeholder:text-ardoise hover:ring-sapin/50",
          "focus:shadow-[0_0_0_6px_rgb(166_242_107/0.55)] focus:ring-2 focus:ring-sapin focus:outline-none",
        )}
        {...rest}
      />
    </div>
  );
}
