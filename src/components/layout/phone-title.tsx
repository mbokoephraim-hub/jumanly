import type { ReactNode } from "react";
import { BackButton } from "./back-button";
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
      <BackButton fallback={back} label={backLabel} history={false} className="mr-2" />
      <p className="min-w-0 flex-1 truncate text-[20px] font-semibold tracking-[-0.02em]">
        {title}
      </p>
      {children}
    </TopBarOverride>
  );
}
