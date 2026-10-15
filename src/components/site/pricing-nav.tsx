"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";

type Family = { id: string; label: string };

/**
 * Family segments of /tarifs (maquette 05-01): anchors to #talents, #rh, #companies, #partners.
 * The active segment follows the family on screen; once the hero is scrolled past, a copy sticks
 * under the header. Without JavaScript the anchors still work and the first segment stays active.
 */
export function PricingFamilyNav({ label, families }: { label: string; families: Family[] }) {
  const inline = useRef<HTMLElement>(null);
  const [active, setActive] = useState(families[0]?.id ?? "");
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sections = families
      .map((family) => document.getElementById(family.id))
      .filter((section): section is HTMLElement => section !== null);
    const last = sections.at(-1);

    // The copy shows while the inline segments are above the screen and families remain below.
    const update = () => {
      const box = inline.current?.getBoundingClientRect();
      const end = last?.getBoundingClientRect();
      setStuck(Boolean(box && end && box.bottom < 64 && end.bottom > 200));
      // Active family: the last one whose top has reached the line under the sticky bar.
      const reached = sections.filter((section) => section.getBoundingClientRect().top <= 170);
      setActive((reached.at(-1) ?? sections[0])?.id ?? families[0]?.id ?? "");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [families]);

  const segments = () => (
    <ul className="pointer-events-auto flex gap-1 rounded-pill bg-blanc p-[5px] shadow-[0_10px_30px_rgba(11,26,31,0.08)]">
      {families.map((family) => (
        <li key={family.id}>
          <a
            href={`#${family.id}`}
            aria-current={active === family.id ? "true" : undefined}
            className={cx(
              "inline-flex h-11 items-center rounded-pill px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors sm:px-[26px] sm:text-sm",
              active === family.id ? "bg-sapin text-blanc" : "text-sapin hover:bg-creme",
            )}
          >
            {family.label}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <nav aria-label={label} ref={inline} className="flex justify-center">
        {segments()}
      </nav>
      {/* Hidden copy is inert: out of the accessibility tree and of the tab order. */}
      <div
        inert={!stuck}
        className={cx(
          "pointer-events-none fixed inset-x-0 top-[72px] z-20 flex justify-center px-4 transition-[opacity,transform] duration-300 motion-reduce:transition-none xl:top-[96px]",
          stuck
            ? "translate-y-0 opacity-100"
            : "-translate-y-3 opacity-0 [&_ul]:pointer-events-none",
        )}
      >
        {segments()}
      </div>
    </>
  );
}

/** Opens a folded comparison on wide screens only (maquette 05-01: Talents unfolded on desktop). */
export function OpenOnWide({ id }: { id: string }) {
  useEffect(() => {
    const details = document.getElementById(id);
    if (details instanceof HTMLDetailsElement && window.matchMedia("(min-width: 1024px)").matches) {
      details.open = true;
    }
  }, [id]);
  return null;
}
