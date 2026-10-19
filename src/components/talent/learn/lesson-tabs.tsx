"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";

export type LessonTab = { id: string; label: string; panel: ReactNode };

/**
 * Tabs of the classroom (planche talent-3 § 5, `.seg`): Leçon, Texte, Notes, Fichiers. Switching
 * never reloads the page, so the video keeps playing. Every panel is rendered on the server; the
 * hidden ones carry `hidden`. An address ending in `#notes` (after saving a note) opens that tab.
 */
export function LessonTabs({ tabs, label }: { tabs: LessonTab[]; label: string }) {
  const id = useId();
  const [active, setActive] = useState(tabs[0]?.id);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const open = () => {
      const target = window.location.hash.slice(1);
      if (tabs.some((tab) => tab.id === target)) setActive(target);
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [tabs]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const focused = buttons.current.findIndex((button) => button === document.activeElement);
    const index = focused >= 0 ? focused : tabs.findIndex((tab) => tab.id === active);
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = (next + tabs.length) % tabs.length;
    setActive(tabs[target]!.id);
    buttons.current[target]?.focus();
  };

  return (
    <>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="t-seg">
        {tabs.map((tab, index) => {
          const on = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                buttons.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${id}-${tab.id}`}
              aria-selected={on}
              aria-controls={`${id}-${tab.id}-p`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={cx(on && "t-on")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${id}-${tab.id}-p`}
          aria-labelledby={`${id}-${tab.id}`}
          hidden={tab.id !== active}
          className="t-flux t-serre"
        >
          {tab.panel}
        </div>
      ))}
    </>
  );
}
