"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";

type Tab = { id: string; label: string; content: ReactNode };

const keyTargets: Record<string, (index: number, last: number) => number> = {
  ArrowRight: (index, last) => (index === last ? 0 : index + 1),
  ArrowLeft: (index, last) => (index === 0 ? last : index - 1),
  Home: () => 0,
  End: (_, last) => last,
};

/**
 * Underlined tabs (§ 11.5), keyboard accessible: arrows, Home, End.
 * With `syncHash`, the active tab follows the URL fragment (/tarifs#rh) so that it can be linked.
 */
export function Tabs({
  tabs,
  initial,
  syncHash = false,
}: {
  tabs: Tab[];
  initial?: string;
  syncHash?: boolean;
}) {
  const baseId = useId();
  const [active, setActiveState] = useState(initial ?? tabs[0]?.id);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!syncHash) return;
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (tabs.some((tab) => tab.id === id)) setActiveState(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [syncHash, tabs]);

  function setActive(id: string) {
    setActiveState(id);
    if (syncHash) window.history.replaceState(null, "", `#${id}`);
  }

  function onKeyDown(event: KeyboardEvent, index: number) {
    const target = keyTargets[event.key]?.(index, tabs.length - 1);
    if (target === undefined) return;
    event.preventDefault();
    setActive(tabs[target].id);
    buttons.current[target]?.focus();
  }

  return (
    <div>
      <div role="tablist" className="flex max-w-full gap-6 overflow-x-auto border-b border-brume">
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
                // Mockup 00-02: underlined tabs, 2.5 px Sapin under the active one.
                "-mb-px h-11 border-b-[2.5px] px-0.5 text-sm whitespace-nowrap transition-colors",
                selected
                  ? "border-sapin font-semibold text-sapin"
                  : "border-transparent text-ardoise hover:text-sapin",
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
          className="pt-5"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
