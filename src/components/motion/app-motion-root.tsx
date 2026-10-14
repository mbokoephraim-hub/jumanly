"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Motion of the signed-in space (docs/experience-animee/BRIEF-ESPACE-UTILISATEUR.md, lot A).
 * One component for the whole shell:
 * - `[data-reveal]` blocks (and the page sections) appear when they enter the screen, coming from
 *   below when scrolling down and from above when scrolling up (`html[data-dir]`); a block hides
 *   again only once it is more than a screen away, so nothing blinks;
 * - the brand shapes of the banners drift with the scroll (`--jm-par`, 0 to 24 px);
 * - the torch of the sidebar follows the pointer (`[data-torch]`, fine pointers only);
 * - the active item of a navigation slides from the previous one (`[data-nav-slide]`);
 * - the mobile navigation hides when scrolling down (`[data-autohide]`) and ripples on touch.
 * Nothing runs when the person or the system asked to reduce motion: the page stays complete.
 */
export function AppMotionRoot({ reduce }: { reduce: boolean }) {
  const pathname = usePathname();
  const previous = useRef(new Map<string, DOMRect>());

  // Listeners that live as long as the shell.
  useEffect(() => {
    if (reduce || reducedMotion()) return;
    const root = document.documentElement;
    root.setAttribute("data-motion", "");
    root.setAttribute("data-app-motion", "");
    root.dataset.dir = "down";

    let lastY = window.scrollY;
    let frame = 0;
    const autohide = [...document.querySelectorAll<HTMLElement>("[data-autohide]")];
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        if (Math.abs(y - lastY) < 2) return;
        const down = y > lastY;
        root.dataset.dir = down ? "down" : "up";
        root.style.setProperty("--jm-par", String(Math.min(24, y * 0.08)));
        for (const bar of autohide) bar.toggleAttribute("data-hidden", down && y > 80);
        lastY = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const torches = window.matchMedia("(pointer: fine)").matches
      ? [...document.querySelectorAll<HTMLElement>("[data-torch]")]
      : [];
    let torchFrame = 0;
    const onMove = (event: PointerEvent) => {
      const target = event.currentTarget as HTMLElement;
      if (torchFrame) cancelAnimationFrame(torchFrame);
      torchFrame = requestAnimationFrame(() => {
        const box = target.getBoundingClientRect();
        target.style.setProperty("--mx", `${event.clientX - box.left}px`);
        target.style.setProperty("--my", `${event.clientY - box.top}px`);
        target.setAttribute("data-lit", "");
      });
    };
    const onLeave = (event: PointerEvent) =>
      (event.currentTarget as HTMLElement).removeAttribute("data-lit");
    for (const torch of torches) {
      torch.addEventListener("pointermove", onMove);
      torch.addEventListener("pointerleave", onLeave);
    }

    const onTouch = (event: PointerEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLElement>("[data-nav-slide] a");
      if (!link) return;
      const box = link.getBoundingClientRect();
      link.style.setProperty("--rx", `${event.clientX - box.left}px`);
      link.style.setProperty("--ry", `${event.clientY - box.top}px`);
      link.removeAttribute("data-ripple");
      void link.offsetWidth; // restart the animation
      link.setAttribute("data-ripple", "");
    };
    document.addEventListener("pointerdown", onTouch);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerdown", onTouch);
      for (const torch of torches) {
        torch.removeEventListener("pointermove", onMove);
        torch.removeEventListener("pointerleave", onLeave);
      }
      cancelAnimationFrame(frame);
      root.removeAttribute("data-motion");
      root.removeAttribute("data-app-motion");
      delete root.dataset.dir;
    };
  }, [reduce]);

  // On each page: the active navigation item slides, the blocks below the fold wait to appear.
  useEffect(() => {
    if (reduce || reducedMotion()) return;
    slideNavigation(previous.current);

    const content = document.getElementById("content");
    if (!content) return;
    const blocks = [
      ...content.querySelectorAll<HTMLElement>("[data-reveal], .jm-page > * section"),
    ].filter((block) => !block.closest("[hidden]") && block.offsetParent !== null);
    for (const block of blocks) block.setAttribute("data-reveal", block.dataset.reveal ?? "");

    const show = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.setAttribute("data-shown", "");
        }
      },
      { threshold: 0.08 },
    );
    // More than a screen away: ready to appear again, from the side it will come back.
    const far = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) entry.target.removeAttribute("data-shown");
        }
      },
      { rootMargin: "100% 0px 100% 0px" },
    );
    const height = window.innerHeight;
    for (const block of blocks) {
      const top = block.getBoundingClientRect().top;
      // What is on screen when the page opens is shown at once (the page entry animates it).
      if (top < height * 0.95) block.setAttribute("data-shown", "");
      show.observe(block);
      far.observe(block);
    }
    return () => {
      show.disconnect();
      far.disconnect();
    };
  }, [pathname, reduce]);

  return null;
}

/** The active item of each `[data-nav-slide]` list glides from where the previous one was. */
function slideNavigation(previous: Map<string, DOMRect>) {
  for (const list of document.querySelectorAll<HTMLElement>("[data-nav-slide]")) {
    const key = list.dataset.navSlide ?? "";
    const active = list.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active || active.offsetParent === null) continue;
    const now = active.getBoundingClientRect();
    const before = previous.get(key);
    previous.set(key, now);
    if (!before) continue;
    const dx = before.left - now.left;
    const dy = before.top - now.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
    active.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
      { duration: 350, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
