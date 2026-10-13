import type { ComponentProps } from "react";
import { Search } from "lucide-react";
import { cx } from "@/lib/cx";

/** Pill-shaped search field (§ 11.5). The label is read by screen readers only. */
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
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ardoise"
      />
      <input
        id={id}
        type="search"
        className={cx(
          "h-12 w-full rounded-pill border border-brume bg-blanc pr-5 pl-12 text-sapin",
          "transition-colors placeholder:text-ardoise hover:border-sapin/40",
          "focus:border-sapin focus:outline-none",
        )}
        {...rest}
      />
    </div>
  );
}
