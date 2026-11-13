"use client";

import { useRouter } from "next/navigation";

export type HireTab = { label: string; href: string; active: boolean; count?: number };

/**
 * The tabs in a pill of a page head (`tabsHtml()` of the prototype): buttons, the active one in
 * black, a count in `<em>`. Each tab is an address of the page (shared, kept on reload).
 */
export function HireTabs({ tabs }: { tabs: HireTab[] }) {
  const router = useRouter();
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.href}
          type="button"
          role="tab"
          className={tab.active ? "on" : undefined}
          aria-selected={tab.active}
          onClick={() => router.push(tab.href, { scroll: false })}
        >
          {tab.label}
          {tab.count != null ? <em>{tab.count}</em> : null}
        </button>
      ))}
    </div>
  );
}
