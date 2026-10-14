import type { ReactNode } from "react";
import { UniverseHeader } from "@/components/motion/universe-header";
import type { UniverseKey } from "@/config/universes";

/**
 * Title of a signed-in page: the banner of the module's universe (docs/experience-animee § 1),
 * with the eyebrow, the title and the page actions.
 */
export function AppPageHeader(props: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** "p" when the page's h1 is further down (the lesson title in the player). */
  titleAs?: "h1" | "p";
  module?: UniverseKey;
  className?: string;
}) {
  return <UniverseHeader {...props} />;
}
