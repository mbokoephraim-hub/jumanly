import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

/**
 * Data table (mockup 00-02): white card with 24 px corners, Ardoise capital headers, rows
 * separated by Brume. Scrolls horizontally on small screens; the caption names it for screen readers.
 */
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
      className="relative overflow-x-auto rounded-box bg-blanc py-1.5"
    >
      <table className={cx("w-full border-collapse text-left text-[13px]", className)} {...rest}>
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
      className={cx("px-[18px] py-2.5 text-lab whitespace-nowrap text-ardoise", className)}
      {...rest}
    />
  );
}

export function Td({ className, ...rest }: ComponentProps<"td">) {
  return (
    <td className={cx("border-t border-brume px-[18px] py-3.5 text-sapin", className)} {...rest} />
  );
}
