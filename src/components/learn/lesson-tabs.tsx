"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

export type LessonTab = { id: string; label: string; icon: IconName; panel: ReactNode };

/**
 * Tabs of a lesson as cards with an icon (`.lr-tabs` of screens 14, 67 to 69). Switching tab
 * never reloads the page, so the video keeps playing. Every panel is rendered on the server; the
 * hidden ones carry `hidden`. A link to an anchor inside a panel (`#notes` after saving a note)
 * opens that panel.
 */
export function LessonTabs({
  tabs,
  label,
  lesson,
}: {
  tabs: LessonTab[];
  label: string;
  /** The lesson shown: another lesson opens on the first tab (the page itself is kept). */
  lesson: string;
}) {
  const id = useId();
  const [active, setActive] = useState(tabs[0]?.id);
  const [shownLesson, setShownLesson] = useState(lesson);
  if (shownLesson !== lesson) {
    setShownLesson(lesson);
    setActive(tabs[0]?.id);
  }
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const open = () => {
      const target = window.location.hash.slice(1);
      if (!target) return;
      const panel = document.getElementById(target)?.closest<HTMLElement>("[data-lesson-tab]");
      const tab = panel?.dataset.lessonTab ?? tabs.find((item) => item.id === target)?.id;
      if (!tab) return;
      setActive(tab);
      requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView());
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [tabs]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // From the tab that has the focus (arrows move it and open that tab).
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
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="grid grid-cols-5 gap-[5px]"
      >
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
              aria-controls={`${id}-${tab.id}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={cx(
                "jm-press flex min-h-14 min-w-0 flex-col items-center justify-center gap-[3px] rounded-[16px] px-0.5 text-[11px] leading-tight shadow-douce transition-colors focus-visible:ring-4 focus-visible:ring-lime focus-visible:outline-none sm:text-[12.5px]",
                on ? "bg-gradient-principal font-semibold text-blanc" : "bg-blanc font-medium",
              )}
            >
              <Icon name={tab.icon} className={cx("size-[18px]", on && "text-lime")} />
              <span className="max-w-full truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${id}-${tab.id}-panel`}
          aria-labelledby={`${id}-${tab.id}`}
          data-lesson-tab={tab.id}
          hidden={tab.id !== active}
          className="flex flex-col gap-3.5"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
