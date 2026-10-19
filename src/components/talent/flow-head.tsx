import type { ReactNode } from "react";
import { BackButton } from "./back-button";

/**
 * Head of a screen that draws its own (planche `tete_f`): the round « Retour » button, the name of
 * the screen and, at the end, one round action (close, options, settings).
 */
export function FlowHead({
  back,
  backLabel,
  history = true,
  title,
  titleId,
  end,
  children,
}: {
  back: string;
  backLabel: string;
  /** false: « Retour » always goes to `back` (a step that knows the step before it). */
  history?: boolean;
  title?: string;
  titleId?: string;
  end?: ReactNode;
  /** Instead of the title: a person or a company with its line (a conversation). */
  children?: ReactNode;
}) {
  return (
    <div className="t-tete-f">
      <BackButton fallback={back} label={backLabel} history={history} className="t-press" />
      {children ?? <h1 id={titleId}>{title}</h1>}
      {end}
    </div>
  );
}
