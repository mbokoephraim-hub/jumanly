"use client";

import "@/styles/fil-actualiser.css";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { PhoneIcon } from "../icon";

/** Where the disc stands while the Fil is read again (px), as under the finger. */
const READY = 70;
/** The Fil asks whether others published, every minute while it shows and when the app returns. */
const POLL_MS = 60_000;

/**
 * Refreshing the Fil (Ephraïm, 29/10/2026): pulling it down at the top brings the new posts (the
 * phone's PhonePullRefresh, on every screen). Meanwhile the Fil asks every minute whether others
 * published since it was shown, and a pill « N nouvelles publications » brings them up in one
 * touch. Touching « Fil » in the menu while already at the top refreshes too.
 */
export function FilRefresh({ loadedAt }: { loadedAt: string }) {
  const t = useTranslations("phoneFil.refresh");
  const router = useRouter();
  const anchor = useRef<HTMLDivElement>(null);
  const [pending, start] = useTransition();
  const [fresh, setFresh] = useState(0);
  const [known, setKnown] = useState(loadedAt);
  // A Fil read again by the server: what was new is now shown.
  if (known !== loadedAt) {
    setKnown(loadedAt);
    setFresh(0);
  }
  const refresh = useRef(() => {});
  const busy = useRef(false);
  useEffect(() => {
    busy.current = pending;
    refresh.current = () => {
      if (busy.current) return;
      busy.current = true;
      start(() => router.refresh());
    };
  }, [pending, router]);

  // The pull itself is the phone's, on every screen (PhonePullRefresh, 29/10/2026).
  useEffect(() => {
    // « Fil » touched in the menu while the Fil is already at the top.
    const onTop = (event: Event) => {
      const tab = (event as CustomEvent<{ tab: string }>).detail?.tab;
      if (tab === "fil") refresh.current();
    };
    window.addEventListener("jm:onglet-haut", onTop);
    return () => window.removeEventListener("jm:onglet-haut", onTop);
  }, []);

  // « Nouvelles publications »: only while the Fil shows and the app is in front.
  useEffect(() => {
    const ask = async () => {
      const layer = anchor.current?.closest<HTMLElement>("[data-onglet-couche]");
      if (document.visibilityState !== "visible" || layer?.dataset.etat === "cache") return;
      const response = await fetch(`/api/fil/nouveautes?depuis=${encodeURIComponent(loadedAt)}`, {
        cache: "no-store",
      }).catch(() => null);
      if (!response?.ok) return;
      const data = (await response.json()) as { count: number };
      setFresh(data.count);
    };
    const timer = window.setInterval(() => void ask(), POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && void ask();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadedAt]);

  const bringNew = () => {
    anchor.current?.closest(".nb-couche")?.scrollTo({ top: 0, behavior: "smooth" });
    refresh.current();
  };

  const shown = pending ? READY : 0;
  return (
    <div ref={anchor} className="nb-fil-actu">
      <div
        className="nb-fil-actu-disque"
        data-tourne={pending ? "" : undefined}
        style={{
          transform: `translate(-50%, ${shown - 56}px)`,
          opacity: Math.min(1, shown / 40),
        }}
        aria-hidden
      >
        <span>
          <PhoneIcon name="actualiser" size={22} stroke={2.2} />
        </span>
      </div>
      {fresh > 0 && !pending ? (
        <button type="button" className="nb-fil-actu-pilule" onClick={bringNew}>
          <PhoneIcon name="haut" size={16} stroke={2.4} />
          {t("pill", { count: fresh })}
        </button>
      ) : null}
      <p className="sr-only" role="status">
        {pending ? t("loading") : ""}
      </p>
    </div>
  );
}
