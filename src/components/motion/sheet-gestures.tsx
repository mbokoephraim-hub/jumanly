"use client";

import { useEffect } from "react";
import { settleHeight, sheetStops } from "@/lib/sheet-drag";

/** The panels that rise from the bottom: Modèle B (`.nb-feuille`) and the talent sheet. */
const PANEL = ".nb-feuille, dialog.t-sheet";
const HANDLE = ":scope > .nb-poignee, :scope > .t-poignee";
/** Top band of a sheet (handle and title) that always drags it. */
const HEAD_BAND = 64;
const SETTLE_MS = 280;
const CURVE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
/** Fields that bring up the keyboard: a sheet holding one opens at its full height. */
const TYPING =
  "textarea, [contenteditable='true'], input:not([type]), input[type='text'], input[type='email'], input[type='url'], input[type='tel'], input[type='number'], input[type='password']";

type Drag = {
  panel: HTMLElement;
  startX: number;
  startY: number;
  inHead: boolean;
  claimed: boolean;
  /** Visible height when the finger landed. */
  from: number;
  stops: number[];
  visible: number;
  samples: { y: number; t: number }[];
};

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A sheet drags only where its handle shows: on a phone (on a computer it is a window). */
function draggable(panel: HTMLElement) {
  const handle = panel.querySelector<HTMLElement>(HANDLE);
  return !!handle && handle.getClientRects().length > 0 && !!panel.closest("dialog")?.open;
}

function veilOf(panel: HTMLElement) {
  const dialog = panel.closest("dialog");
  return dialog?.querySelector<HTMLElement>(":scope > .nb-voile") ?? null;
}

/** Height of the sheet as its design gives it (the expanded state). */
function fullHeight(panel: HTMLElement) {
  const { height, top } = panel.style;
  panel.style.height = "";
  panel.style.top = "";
  const full = panel.offsetHeight;
  panel.style.height = height;
  panel.style.top = top;
  return full;
}

/** Shows `visible` px of the sheet: its height down to the lowest stop, then it slides down. */
function place(panel: HTMLElement, visible: number, stops: number[]) {
  const lowest = stops[0] ?? 0;
  const full = stops[stops.length - 1] ?? 0;
  const height = Math.max(lowest, Math.min(visible, full));
  if (stops.length > 1) {
    panel.style.top = "auto";
    panel.style.height = `${height}px`;
  }
  panel.style.transform = visible < lowest ? `translateY(${lowest - visible}px)` : "";
  const veil = veilOf(panel);
  if (veil) veil.style.opacity = lowest > 0 ? String(Math.min(1, visible / lowest)) : "";
}

function reset(panel: HTMLElement) {
  for (const key of ["height", "top", "transform", "transition", "animation"] as const) {
    panel.style[key] = "";
  }
  const veil = veilOf(panel);
  if (veil) {
    veil.style.opacity = "";
    veil.style.transition = "";
  }
}

/** Nearest box between `node` and the sheet that scrolls up and down. */
function scroller(node: Element, panel: HTMLElement): HTMLElement | null {
  for (let el: Element | null = node; el; el = el.parentElement) {
    if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight + 1) {
      const overflow = getComputedStyle(el).overflowY;
      if (overflow === "auto" || overflow === "scroll") return el;
    }
    if (el === panel) break;
  }
  return null;
}

/**
 * Bottom sheets that follow the finger, like Instagram (demande d'Ephraïm du 29/10/2026), for every
 * sheet of the phone app without touching their design: a long sheet opens at half the screen;
 * drawn up by its top band (or by its content when it is at the half), it grows to its full
 * height; drawn down, it goes back to the half, then closes. A touch on the darkened veil, « Fermer »
 * and Échap still close it. Mounted once, it follows the sheets through the page.
 */
export function SheetGestures() {
  useEffect(() => {
    let drag: Drag | null = null;
    let quietUntil = 0;

    const settle = (panel: HTMLElement, target: number, stops: number[]) => {
      const ms = reduced() ? 120 : SETTLE_MS;
      const veil = veilOf(panel);
      panel.style.transition = `height ${ms}ms ${CURVE}, transform ${ms}ms ${CURVE}`;
      if (veil) veil.style.transition = `opacity ${ms}ms ${CURVE}`;
      if (target === 0) {
        panel.style.transform = `translateY(${panel.offsetHeight + 40}px)`;
        if (veil) veil.style.opacity = "0";
        window.setTimeout(() => panel.closest("dialog")?.close(), ms);
        return;
      }
      place(panel, target, stops);
      window.setTimeout(() => {
        panel.style.transition = "";
        if (veil) veil.style.transition = "";
        // Expanded: the sheet takes back its own height, and follows its content again.
        if (target === stops[stops.length - 1]) {
          panel.style.height = "";
          panel.style.top = "";
        }
      }, ms);
    };

    // A long sheet opens at the half state; one with a field to type in opens whole, unless it
    // asks for the half (`.nb-feuille-mi`: « Partager », whose search field waits for a touch).
    const opened = (dialog: HTMLDialogElement) => {
      const panel = dialog.matches(PANEL) ? dialog : dialog.querySelector<HTMLElement>(PANEL);
      if (!panel || !draggable(panel)) return;
      if (panel.querySelector(TYPING) && !panel.matches(".nb-feuille-mi")) return;
      const stops = sheetStops(fullHeight(panel), window.innerHeight);
      if (stops.length > 1) place(panel, stops[0], stops);
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const node = record.target;
        if (node instanceof HTMLDialogElement && node.open && record.oldValue === null)
          opened(node);
      }
    });
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
      attributeOldValue: true,
    });

    const onClose = (event: Event) => {
      const dialog = event.target;
      if (!(dialog instanceof HTMLDialogElement)) return;
      const panel = dialog.matches(PANEL) ? dialog : dialog.querySelector<HTMLElement>(PANEL);
      if (panel) reset(panel);
    };

    const onStart = (event: TouchEvent) => {
      drag = null;
      if (event.touches.length !== 1 || !(event.target instanceof Element)) return;
      const panel = event.target.closest<HTMLElement>(PANEL);
      if (!panel || !draggable(panel) || event.target.closest("input[type='range']")) return;
      const touch = event.touches[0];
      const box = panel.getBoundingClientRect();
      drag = {
        panel,
        startX: touch.clientX,
        startY: touch.clientY,
        inHead: touch.clientY - box.top < HEAD_BAND && !event.target.closest(TYPING),
        claimed: false,
        from: box.height - Math.max(0, box.top + box.height - window.innerHeight),
        stops: [],
        visible: 0,
        samples: [],
      };
    };

    const onMove = (event: TouchEvent) => {
      if (!drag) return;
      const touch = event.touches[0];
      const dx = touch.clientX - drag.startX;
      const dy = touch.clientY - drag.startY;
      if (!drag.claimed) {
        if (dx === 0 && dy === 0) return;
        if (Math.abs(dx) > Math.abs(dy) || !event.cancelable) {
          drag = null;
          return;
        }
        const { panel } = drag;
        const stops = sheetStops(fullHeight(panel), window.innerHeight);
        const full = stops[stops.length - 1];
        let claim = drag.inHead;
        if (!claim && event.target instanceof Element && !event.target.closest(TYPING)) {
          const box = scroller(event.target, panel);
          // Down: only once the content is back at its top. Up: from the half, to grow first.
          claim = dy > 0 ? !box || box.scrollTop <= 0 : stops.length > 1 && drag.from < full - 2;
        }
        if (!claim) {
          drag = null;
          return;
        }
        drag.claimed = true;
        drag.stops = stops;
        panel.style.animation = "none";
        panel.style.transition = "";
        const veil = veilOf(panel);
        if (veil) veil.style.transition = "";
      }
      event.preventDefault();
      drag.visible = Math.min(drag.from - dy, drag.stops[drag.stops.length - 1]);
      place(drag.panel, drag.visible, drag.stops);
      drag.samples.push({ y: touch.clientY, t: event.timeStamp });
      if (drag.samples.length > 6) drag.samples.shift();
    };

    const onEnd = (event: TouchEvent) => {
      const current = drag;
      drag = null;
      if (!current?.claimed) return;
      quietUntil = event.timeStamp + 400;
      const first = current.samples[0];
      const last = current.samples[current.samples.length - 1];
      const velocity =
        first && last && last.t - first.t > 0 && event.timeStamp - last.t < 100
          ? (last.y - first.y) / (last.t - first.t)
          : 0;
      settle(current.panel, settleHeight(current.visible, velocity, current.stops), current.stops);
    };

    // The finger leaving a dragged sheet is not a tap on what lies under it.
    const onClick = (event: MouseEvent) => {
      if (event.timeStamp < quietUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Typing in a sheet at the half: it grows whole, so the field stays above the keyboard.
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element) || !event.target.matches(TYPING)) return;
      const panel = event.target.closest<HTMLElement>(PANEL);
      if (panel?.style.height && draggable(panel)) {
        const stops = sheetStops(fullHeight(panel), window.innerHeight);
        settle(panel, stops[stops.length - 1], stops);
      }
    };

    document.addEventListener("close", onClose, true);
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    document.addEventListener("click", onClick, true);
    document.addEventListener("focusin", onFocus);
    return () => {
      observer.disconnect();
      document.removeEventListener("close", onClose, true);
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("focusin", onFocus);
    };
  }, []);
  return null;
}
