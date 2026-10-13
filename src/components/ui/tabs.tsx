"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";

type Tab = { id: string; label: string; content: ReactNode };

const keyTargets: Record<string, (index: number, last: number) => number> = {
  ArrowRight: (index, last) => (index === last ? 0 : index + 1),
  ArrowLeft: (index, last) => (index === 0 ? last : index - 1),
  Home: () => 0,
  End: (_, last) => last,
};

/** Accessible tabs: left / right arrows, Home, End. */
export function Tabs({ tabs, initial }: { tabs: Tab[]; initial?: string }) {
  const baseId = useId();
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent, index: number) {
    const target = keyTargets[event.key]?.(index, tabs.length - 1);
    if (target === undefined) return;
    event.preventDefault();
    setActive(tabs[target].id);
    buttons.current[target]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        className="inline-flex max-w-full gap-1 overflow-x-auto rounded-pill bg-blanc p-1 shadow-card"
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttons.current[index] = el;
              }}
              id={`${baseId}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cx(
                "h-9 rounded-pill px-4 text-sm font-medium whitespace-nowrap transition-colors",
                selected ? "bg-sapin text-blanc" : "text-ardoise hover:text-sapin",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${baseId}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== active}
          className="pt-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
