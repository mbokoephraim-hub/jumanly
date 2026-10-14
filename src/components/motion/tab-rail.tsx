"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

/**
 * Rail of tabs that scrolls when the bar is longer than the screen (docs/experience-animee § 7):
 * faded edges on the side where tabs are hidden, round glass arrows on hover, a Lime progress line,
 * wheel turned horizontal, drag with the mouse, the active tab brought into view on arrival, and the
 * active pill sliding from the previous one. Left and right arrow keys move between the tabs.
 * The links themselves stay ordinary links: without JavaScript the rail is a scrolling list.
 */
export function TabRail({
  name,
  children,
  tone = "light",
  className,
}: {
  /** Identifies the rail across pages, so the active pill can slide from the previous tab. */
  name: string;
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const t = useTranslations("common.rail");
  const scroller = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    const animated = document.documentElement.hasAttribute("data-app-motion");

    const update = () => {
      const max = box.scrollWidth - box.clientWidth;
      const start = box.scrollLeft > 2;
      const end = box.scrollLeft < max - 2;
      setEdges((now) => (now.start === start && now.end === end ? now : { start, end }));
      const bar = progress.current;
      if (bar) {
        const visible = box.scrollWidth ? box.clientWidth / box.scrollWidth : 1;
        bar.style.opacity = max > 2 ? "1" : "0";
        bar.style.transform = `translateX(${(max > 0 ? box.scrollLeft / box.scrollWidth : 0) * 100 * (1 / visible)}%)`;
        bar.style.width = `${visible * 100}%`;
      }
    };

    // The active tab is brought into view, then slides from where the previous one was.
    const active = box.querySelector<HTMLElement>(
      '[aria-current="page"], [aria-current="true"], [aria-pressed="true"]',
    );
    if (active) {
      const left = active.offsetLeft - (box.clientWidth - active.offsetWidth) / 2;
      box.scrollTo({ left: Math.max(0, left), behavior: "instant" });
      const key = `jm-rail:${name}`;
      let before: number | null = null;
      try {
        const stored = sessionStorage.getItem(key);
        before = stored === null ? null : Number(stored);
        sessionStorage.setItem(key, String(active.getBoundingClientRect().left));
      } catch {}
      const dx = before === null ? 0 : before - active.getBoundingClientRect().left;
      if (animated && Math.abs(dx) > 1 && Math.abs(dx) < box.clientWidth) {
        active.animate([{ transform: `translateX(${dx}px)` }, { transform: "translateX(0)" }], {
          duration: 320,
          easing: "cubic-bezier(.2,.8,.2,1)",
        });
      }
    }
    update();

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = box.scrollWidth - box.clientWidth;
      if (max <= 0) return;
      const next = box.scrollLeft + event.deltaY;
      if ((next <= 0 && box.scrollLeft <= 0) || (next >= max && box.scrollLeft >= max)) return;
      event.preventDefault();
      box.scrollBy({ left: event.deltaY, behavior: "instant" });
    };

    let drag: { x: number; left: number; moved: boolean } | null = null;
    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      drag = { x: event.clientX, left: box.scrollLeft, moved: false };
    };
    const onMove = (event: PointerEvent) => {
      if (!drag) return;
      const dx = event.clientX - drag.x;
      if (Math.abs(dx) > 5) drag.moved = true;
      if (drag.moved) box.scrollLeft = drag.left - dx;
    };
    const onUp = () => {
      const moved = drag?.moved;
      drag = null;
      if (moved) {
        // A drag is not a click on the tab under the pointer.
        box.addEventListener("click", (event) => event.preventDefault(), {
          capture: true,
          once: true,
        });
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const tabs = [...box.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
      const index = tabs.indexOf(document.activeElement as HTMLElement);
      if (index < 0) return;
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      const next = tabs[(index + step + tabs.length) % tabs.length];
      next?.focus();
      next?.scrollIntoView({ block: "nearest", inline: "nearest" });
    };

    const resize = new ResizeObserver(update);
    resize.observe(box);
    box.addEventListener("scroll", update, { passive: true });
    box.addEventListener("wheel", onWheel, { passive: false });
    box.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    box.addEventListener("keydown", onKey);
    return () => {
      resize.disconnect();
      box.removeEventListener("scroll", update);
      box.removeEventListener("wheel", onWheel);
      box.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      box.removeEventListener("keydown", onKey);
    };
  }, [name]);

  const page = (direction: 1 | -1) => {
    const box = scroller.current;
    if (box) box.scrollBy({ left: direction * box.clientWidth * 0.8 });
  };

  const fade = [edges.start && "start", edges.end && "end"].filter(Boolean).join(" ");
  const arrow =
    "jm-rail-arrow absolute top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-blanc/70 text-sapin shadow-sm ring-1 ring-sapin/10 backdrop-blur-[8px] lg:flex";
  return (
    <div
      data-fade={fade || undefined}
      className={cx(
        "jm-rail relative min-w-0 rounded-[99px] p-1",
        tone === "dark" ? "bg-blanc/8" : "bg-sapin/6",
        className,
      )}
    >
      <div ref={scroller} className="jm-rail-scroll overflow-x-auto">
        {children}
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("previous")}
        data-on={edges.start ? "" : undefined}
        onClick={() => page(-1)}
        className={cx(arrow, "left-1")}
      >
        <Icon name="chev-l" className="size-4" />
      </button>
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("next")}
        data-on={edges.end ? "" : undefined}
        onClick={() => page(1)}
        className={cx(arrow, "right-1")}
      >
        <Icon name="chev-r" className="size-4" />
      </button>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 -bottom-1.5 h-0.5 overflow-hidden rounded-full"
      >
        <span
          ref={progress}
          className="block h-full origin-left rounded-full bg-lime opacity-0 transition-opacity"
        />
      </span>
    </div>
  );
}
