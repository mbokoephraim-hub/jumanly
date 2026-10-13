import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

/** Data table. Scrolls horizontally on small screens; the caption names it for screen readers. */
export function Table({
  caption,
  className,
  children,
  ...rest
}: ComponentProps<"table"> & { caption: string }) {
  return (
    // Focusable scroll area, so that keyboard users can scroll wide tables.
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="overflow-x-auto rounded-md bg-blanc"
    >
      <table className={cx("w-full border-collapse text-left text-sm", className)} {...rest}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, ...rest }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cx(
        "border-b border-brume px-4 py-3 whitespace-nowrap text-ardoise text-label",
        className,
      )}
      {...rest}
    />
  );
}

export function Td({ className, ...rest }: ComponentProps<"td">) {
  return (
    <td className={cx("border-b border-brume/60 px-4 py-3 text-sapin", className)} {...rest} />
  );
}
