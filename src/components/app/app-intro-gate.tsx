"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { showToast } from "@/components/motion/toaster";
import { ARRIVAL_PARAM, REPLAY_PARAM, introVersion, type IntroVersion } from "@/lib/app-intro";
import type { IntroData } from "./app-intro";

// Loaded only when it plays: a simple navigation in the space costs nothing.
const AppIntro = dynamic(() => import("./app-intro").then((module) => module.AppIntro), {
  ssr: false,
});

/**
 * Decides, right after a sign-in (`?arrivee=1`), whether the welcome intro plays and which
 * version (docs/refonte-connexion § 7), then takes the marker out of the address so a reload does
 * not play it again. In reduced motion, the welcome toast shows instead.
 */
export function AppIntroGate({ data, reduce }: { data: IntroData; reduce: boolean }) {
  const [version, setVersion] = useState<IntroVersion>(null);
  const params = useSearchParams();
  const arrival = params.get(ARRIVAL_PARAM) === "1";
  const replay = params.get(REPLAY_PARAM) === "1";

  useEffect(() => {
    if (!arrival) return;
    const url = new URL(window.location.href);
    url.searchParams.delete(ARRIVAL_PARAM);
    url.searchParams.delete(REPLAY_PARAM);
    window.history.replaceState(window.history.state, "", url);
    const reduced = reduce || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = introVersion({ arrival, replay, seenAt: data.seen ? "seen" : null, reduced });
    if (next === "toast") {
      showToast({
        message: data.seen ? data.labels.toastBack : data.labels.toastFirst,
        tone: "success",
      });
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the address is only read in the browser
    setVersion(next);
    // Only a new arrival plays it: later renders of the space (new data) do not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrival, replay]);

  if (version !== "full" && version !== "short") return null;
  return <AppIntro version={version} data={data} onDone={() => setVersion(null)} />;
}
