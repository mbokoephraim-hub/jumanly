"use client";

import { useEffect } from "react";
import { showToast, type ToastInput } from "./toaster";

/**
 * Shows a toast once when a page opens after an action (« Offre fermée… »). The same text is in a
 * `<noscript>` next to it, so the confirmation is there without JavaScript too.
 */
export function ToastOnLoad(props: ToastInput) {
  const { message, tone, href } = props;
  useEffect(() => {
    showToast({ message, tone, href });
  }, [message, tone, href]);
  return (
    <noscript>
      <p role="status" className="rounded-[18px] bg-sapin px-4 py-3 text-sm text-blanc">
        {message}
      </p>
    </noscript>
  );
}
