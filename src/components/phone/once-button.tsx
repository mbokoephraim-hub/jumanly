"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

/**
 * A submit button that cannot send its form twice: while the server works (Orbi writing a letter
 * takes a few seconds), every button of the form is held. A second touch made one more letter
 * (Ephraïm, 31/10/2026: « je n'ai créé qu'une lettre, mais ça m'en a affiché deux »).
 */
export function OnceButton({ disabled, ...props }: ComponentProps<"button">) {
  const { pending } = useFormStatus();
  return <button type="submit" {...props} disabled={disabled || pending} aria-busy={pending} />;
}
