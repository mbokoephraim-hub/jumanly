"use client";

import "@/styles/fil-actualiser.css";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { PhoneIcon } from "../icon";

/** How far the finger pulls the disc at most, and from where letting go refreshes (px). */
const PULL_MAX = 110;
const READY = 70;
/** The Fil asks whether others published, every minute while it shows and when the app returns. */
const POLL_MS = 60_000;

/**
 * Refreshing the Fil (Ephraïm, 29/10/2026): at the top of the Fil, pulling it down shows a disc
 * that turns with the finger; letting it go past the mark brings the new posts. Meanwhile the Fil
 * asks every minute whether others published since it was shown, and a pill « N nouvelles
 * publications » brings them up in one touch. Touching « Fil » in the menu while already at the
 * top refreshes too.
 */
export function FilRefresh({ loadedAt }: { loadedAt: string }) {
  const t = useTranslations("phoneFil.refresh");
  const router = useRouter();
  const anchor = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0);
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

  // The pull, on the layer that scrolls the Fil (its tab, or the page when it is not kept).
  useEffect(() => {
    const layer = anchor.current?.closest<HTMLElement>(".nb-couche");
    if (!layer) return;
    let from: { x: number; y: number } | null = null;
    let dragging = false;
    let distance = 0;
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      from =
        event.touches.length === 1 && touch && layer.scrollTop <= 0 && !busy.current
          ? { x: touch.clientX, y: touch.clientY }
          : null;
      dragging = false;
      distance = 0;
    };
    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!from || !touch) return;
      const dy = touch.clientY - from.y;
      const dx = touch.clientX - from.x;
      if (!dragging) {
        if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return;
        // Up, sideways (the tabs, a carousel) or already scrolled: the Fil scrolls as usual.
        if (dy <= 0 || Math.abs(dx) > dy || layer.scrollTop > 0) {
          from = null;
          return;
        }
        dragging = true;
      }
      if (event.cancelable) event.preventDefault();
      distance = Math.max(0, Math.min(PULL_MAX, dy * 0.55));
      setPull(distance);
    };
    const onEnd = () => {
      if (dragging && distance >= READY) refresh.current();
      from = null;
      dragging = false;
      distance = 0;
      setPull(0);
    };
    layer.addEventListener("touchstart", onStart, { passive: true });
    layer.addEventListener("touchmove", onMove, { passive: false });
    layer.addEventListener("touchend", onEnd);
    layer.addEventListener("touchcancel", onEnd);
    // « Fil » touched in the menu while the Fil is already at the top.
    const onTop = (event: Event) => {
      const tab = (event as CustomEvent<{ tab: string }>).detail?.tab;
      if (tab === "fil") refresh.current();
    };
    window.addEventListener("jm:onglet-haut", onTop);
    return () => {
      layer.removeEventListener("touchstart", onStart);
      layer.removeEventListener("touchmove", onMove);
      layer.removeEventListener("touchend", onEnd);
      layer.removeEventListener("touchcancel", onEnd);
      window.removeEventListener("jm:onglet-haut", onTop);
    };
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

  const shown = pending ? READY : pull;
  return (
    <div ref={anchor} className="nb-fil-actu">
      <div
        className="nb-fil-actu-disque"
        data-pret={pull >= READY ? "" : undefined}
        data-tourne={pending ? "" : undefined}
        data-tire={pull > 0 ? "" : undefined}
        style={{
          transform: `translate(-50%, ${shown - 56}px)`,
          opacity: Math.min(1, shown / 40),
        }}
        aria-hidden
      >
        <span style={pending ? undefined : { transform: `rotate(${(pull / READY) * 270}deg)` }}>
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
