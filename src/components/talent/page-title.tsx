import type { ReactNode } from "react";
import { BackButton } from "./back-button";
import { TopBarOverride } from "./top-bar-override";

/**
 * Head of a page below a destination (planche Fondations § 5, page secondaire): « Retour », the
 * title of the page, then optional actions, in place of the default head of the talent space.
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
      <BackButton fallback={back} label={backLabel} history={false} />
      <p className="t-h1">{title}</p>
      {children}
    </TopBarOverride>
  );
}
