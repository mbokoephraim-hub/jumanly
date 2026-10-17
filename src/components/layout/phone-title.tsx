import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/brand/icon";
import { TopBarOverride } from "./top-bar-override";

/**
 * Top bar of a phone for a page below a destination (screens 18, 19, 24-29, 56): a back arrow and
 * the title of the page, then optional actions. The section tabs step aside on a phone.
 */
export function PhoneTitle({
  back,
  backLabel,
  title,
  children,
}: {
  back: string;
  backLabel: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <TopBarOverride>
      <Link
        href={back}
        aria-label={backLabel}
        className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-blanc/10"
      >
        <Icon name="chev-l" className="size-6" />
      </Link>
      <p className="min-w-0 flex-1 truncate text-[20px] font-semibold tracking-[-0.02em]">
        {title}
      </p>
      {children}
    </TopBarOverride>
  );
}
