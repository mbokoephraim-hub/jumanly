"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Rendered inside every `Button` (ux-test, étape 1): while the form it belongs to is being sent,
 * the button that was pressed shows a spinner and ignores new clicks, so nothing is sent twice.
 * Outside a form, or for another button of the same form, it renders nothing.
 */
export function PendingMark() {
  const { pending } = useFormStatus();
  const ref = useRef<HTMLSpanElement>(null);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const button = ref.current?.closest("button");
    if (!button || button.type !== "submit") return;
    const press = () => setPressed(true);
    button.addEventListener("click", press);
    return () => button.removeEventListener("click", press);
  }, []);

  // When the sending ends, the next one starts from scratch (state adjusted during render).
  const [wasPending, setWasPending] = useState(pending);
  if (pending !== wasPending) {
    setWasPending(pending);
    if (!pending) setPressed(false);
  }

  const busy = pending && pressed;
  useEffect(() => {
    const button = ref.current?.closest("button");
    if (!button) return;
    if (busy) {
      button.setAttribute("aria-busy", "true");
      button.setAttribute("data-sending", "");
    } else {
      button.removeAttribute("aria-busy");
      button.removeAttribute("data-sending");
    }
  }, [busy]);

  // The button carries aria-busy: the spinner itself is decoration.
  return (
    <span ref={ref} className="contents">
      {busy && (
        <span
          aria-hidden
          className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
    </span>
  );
}
