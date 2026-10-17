"use client";

import { useEffect } from "react";

/**
 * Marks the page as having its own fixed action bar on a phone, so the Hire pill navigation steps
 * aside (talent-mobile.css). An effect, not a CSS `:has()`: a route kept hidden by Next stays in
 * the DOM, but its effects are cleaned up.
 */
export function PhoneBarFlag() {
  useEffect(() => {
    document.body.dataset.phoneBar = "";
    return () => {
      delete document.body.dataset.phoneBar;
    };
  }, []);
  return null;
}
