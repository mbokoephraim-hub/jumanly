"use client";

import { useEffect, useRef } from "react";
import { showToast } from "@/components/motion/toaster";

/** « Compte créé · formule Free », once, then `?bienvenue=1` leaves the address. */
export function WelcomeToast({ message }: { message: string }) {
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    // After the toaster of the shell is listening.
    const timer = window.setTimeout(() => showToast({ message, tone: "success" }), 400);
    const url = new URL(window.location.href);
    url.searchParams.delete("bienvenue");
    window.history.replaceState(window.history.state, "", url);
    return () => window.clearTimeout(timer);
  }, [message]);
  return null;
}
