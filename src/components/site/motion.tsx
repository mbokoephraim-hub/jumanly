"use client";

import { useEffect, useRef, useState } from "react";
import { splitLastNumber } from "@/lib/numbers";

/**
 * Motion of the immersive home page (src/styles/motion.css). One observer for the whole page:
 * `[data-reveal]` elements get `data-shown` once they enter the screen, `[data-scene]` sections get
 * `data-inview` while visible (their animations pause otherwise), and `[data-spotlight]` follows
 * the pointer. Nothing happens when the visitor asked to reduce motion: everything stays visible.
 */
export function MotionRoot() {
  useEffect(() => {
    if (reducedMotion()) return;
    const root = document.documentElement;

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-shown", "");
          reveal.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    const scenes = new IntersectionObserver((entries) => {
      for (const entry of entries)
        entry.target.toggleAttribute("data-inview", entry.isIntersecting);
    });

    // What is already on screen stays shown, so nothing blinks when the script starts.
    for (const element of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
      if (element.getBoundingClientRect().top < window.innerHeight * 0.92) {
        element.setAttribute("data-shown", "");
      } else {
        reveal.observe(element);
      }
    }
    for (const scene of document.querySelectorAll("[data-scene]")) scenes.observe(scene);
    root.setAttribute("data-motion", "");

    const spotlights = [...document.querySelectorAll<HTMLElement>("[data-spotlight]")];
    const follow = (event: PointerEvent) => {
      const target = event.currentTarget as HTMLElement;
      const box = target.getBoundingClientRect();
      target.style.setProperty("--mx", `${event.clientX - box.left}px`);
      target.style.setProperty("--my", `${event.clientY - box.top}px`);
    };
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (finePointer) for (const spot of spotlights) spot.addEventListener("pointermove", follow);

    return () => {
      reveal.disconnect();
      scenes.disconnect();
      root.removeAttribute("data-motion");
      for (const spot of spotlights) spot.removeEventListener("pointermove", follow);
    };
  }, []);
  return null;
}

/**
 * A text whose last number counts up when it comes into view (« 87 % compatible »,
 * « De 0 à 19 USD/mois »). Server rendering and screen readers get the final text.
 */
export function CountUp({ text, duration = 1400 }: { text: string; duration?: number }) {
  const parts = splitLastNumber(text);
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!parts || !element || reducedMotion()) return;
    const { value, decimals } = parts;
    const format = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - (1 - progress) ** 3;
          setShown(progress < 1 ? format.format(value * eased) : null);
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        setShown(format.format(0));
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [parts?.value, parts?.decimals, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!parts) return <>{text}</>;
  return (
    <span ref={ref}>
      <span aria-hidden className="tabular-nums">
        {parts.before}
        {shown ?? parts.number}
        {parts.after}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
