"use client";

import { usePathname } from "next/navigation";
import {
  ViewTransition,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PHONE_TABS, rootTab, tabOf, type PhoneTab } from "@/lib/phone-tabs";
import { countPage } from "./pages-seen";

/** How long a tab change lasts (passage d'onglet, 320 ms) before the old tab hides. */
const TAB_MS = 340;
/** A gesture older than this did not start the page that just came (it is forgotten). */
const GESTURE_MS = 20_000;

export type Gesture = "approche" | "carte" | "retour" | "orbi" | "onglet-d" | "onglet-g";

/** Reads what was touched (generateurs/transitions_lib.py): back, Orbi, a big card, or a button. */
function gestureOf(target: Element): Gesture {
  const control = target.closest("a, button, [role='button']");
  if (!control) return "approche";
  if (control.closest("[data-retour]")) return "retour";
  if (control.closest("[data-orbi]")) return "orbi";
  const tab = control.closest<HTMLElement>("[data-onglet]");
  if (tab?.dataset.onglet) {
    const from = PHONE_TABS.indexOf(tabOf(window.location.pathname));
    const to = PHONE_TABS.indexOf(tab.dataset.onglet as PhoneTab);
    return to >= from ? "onglet-d" : "onglet-g";
  }
  const box = control.getBoundingClientRect();
  return box.height >= 64 && box.width >= 160 ? "carte" : "approche";
}

/**
 * The phone interface's layers (brief § 3):
 * - the five tabs kept mounted (`tabs`, given by the layout): changing tab reloads nothing and
 *   comes back to the place left, scroll included; the new tab slides 22 px over the old one,
 *   which steps back 14 px and then hides;
 * - the pile (`children`, the page of the address) above them, for every other page, and for the
 *   first screen of a tab not kept yet;
 * - each page change is a View Transition: the screen left stays until the new one covers it,
 *   never an empty or black screen. The gesture that started it (`html[data-nb-geste]`) picks the
 *   movement: approach from the finger, card opening, back from the left, Orbi's circle.
 */
export function PhoneStack({
  tabs,
  reduce,
  children,
}: {
  tabs: Partial<Record<PhoneTab, ReactNode>>;
  /** « Réduire les animations » (settings): a short fade only. */
  reduce: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const root = rootTab(pathname);
  const kept = (tab: PhoneTab) => tabs[tab] !== undefined;
  const [base, setBase] = useState<PhoneTab>(root ?? tabOf(pathname));
  const [leaving, setLeaving] = useState<{ tab: PhoneTab; dir: "d" | "g" } | null>(null);
  const [entering, setEntering] = useState<"d" | "g" | null>(null);
  const last = useRef(pathname);

  // The gesture of the next page change, on <html> so the transition's pseudo-elements read it.
  useEffect(() => {
    const html = document.documentElement;
    let forget: ReturnType<typeof setTimeout> | undefined;
    let touched: Gesture = "approche";
    const mark = (gesture: Gesture) => {
      html.dataset.nbGeste = gesture;
      clearTimeout(forget);
      forget = setTimeout(() => {
        delete html.dataset.nbGeste;
      }, GESTURE_MS);
    };
    const onPointer = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      touched = gestureOf(event.target);
      html.style.setProperty("--nb-x", `${Math.round(event.clientX)}px`);
      html.style.setProperty("--nb-y", `${Math.round(event.clientY)}px`);
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname)
        return;
      // A keyboard activation has no pointer: the gesture comes from the link itself.
      mark(event.detail === 0 && target ? gestureOf(target) : touched);
    };
    const onSubmit = () => mark("approche");
    const onBack = () => mark("retour");
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", onBack);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", onBack);
      clearTimeout(forget);
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (reduce) html.dataset.nbReduit = "";
    return () => {
      delete html.dataset.nbReduit;
    };
  }, [reduce]);

  useEffect(() => countPage(), [pathname]);

  // A new address: the kept tab underneath follows the first screens visited.
  useLayoutEffect(() => {
    if (last.current === pathname) return;
    const before = last.current;
    last.current = pathname;
    const html = document.documentElement;
    // The movement is played by this change; the next one needs its own gesture.
    const settle = setTimeout(() => {
      delete html.dataset.nbGeste;
    }, 450);
    if (!root || root === base) return () => clearTimeout(settle);
    const previous = base;
    const from = rootTab(before);
    const dir = PHONE_TABS.indexOf(root) >= PHONE_TABS.indexOf(previous) ? "d" : "g";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the address
    setBase(root);
    // Tab to tab, both kept: the new one slides over the old, which steps back then hides.
    if (from && kept(root) && kept(previous)) {
      setLeaving({ tab: previous, dir });
      setEntering(dir);
      const done = setTimeout(() => {
        setLeaving(null);
        setEntering(null);
      }, TAB_MS);
      return () => {
        clearTimeout(done);
        clearTimeout(settle);
      };
    }
    return () => clearTimeout(settle);
    // `kept` reads `tabs`, which only changes with the layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, root, base]);

  const pileEmpty = root !== null && kept(root);
  return (
    <>
      {PHONE_TABS.map((tab) => {
        if (!kept(tab)) return null;
        const state = tab === base ? "actif" : tab === leaving?.tab ? "dessous" : "cache";
        return (
          <section
            key={tab}
            className="nb-couche nb-onglet"
            data-onglet-couche={tab}
            data-explorer={tab === "explorer" ? "" : undefined}
            data-etat={state}
            data-entree={state === "actif" && entering ? entering : undefined}
            data-sortie={state === "dessous" ? leaving?.dir : undefined}
            aria-hidden={state === "actif" && pileEmpty ? undefined : true}
            inert={state !== "actif" || !pileEmpty}
          >
            {tabs[tab]}
          </section>
        );
      })}
      <ViewTransition name="nb-pile">
        <div
          id="content"
          className="nb-couche nb-pile"
          data-racine={root ? "" : undefined}
          data-vide={pileEmpty ? "" : undefined}
        >
          {children}
        </div>
      </ViewTransition>
    </>
  );
}
