"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

const fold = (text: string) =>
  text
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

/**
 * Filters the questions already rendered by the server (elements marked `data-faq`); themes left
 * without a match are hidden. Without JavaScript, every question stays visible.
 */
export function FaqSearch({
  label,
  placeholder,
  empty,
}: {
  label: string;
  placeholder: string;
  empty: string;
}) {
  const [noMatch, setNoMatch] = useState(false);
  function filter(query: string) {
    const words = fold(query).split(/\s+/).filter(Boolean);
    let visible = 0;
    document.querySelectorAll<HTMLElement>("[data-faq]").forEach((item) => {
      const match = words.every((word) => fold(item.textContent ?? "").includes(word));
      item.hidden = !match;
      if (match) visible++;
    });
    document.querySelectorAll<HTMLElement>("[data-faq-theme]").forEach((theme) => {
      const hidden = theme.querySelectorAll("[data-faq]:not([hidden])").length === 0;
      theme.hidden = hidden;
      document
        .querySelector<HTMLElement>(`[data-faq-link="${theme.id}"]`)
        ?.toggleAttribute("hidden", hidden);
    });
    setNoMatch(visible === 0);
  }
  return (
    <div className="flex max-w-[640px] flex-col gap-2">
      <label
        htmlFor="faq-search"
        className="text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-sapin/85 uppercase"
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          name="recherche"
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-[22px] size-5 -translate-y-1/2"
        />
        <input
          id="faq-search"
          type="search"
          placeholder={placeholder}
          onChange={(event) => filter(event.target.value)}
          className="h-14 w-full rounded-pill bg-blanc pr-6 pl-[54px] text-[15px] text-sapin shadow-[0_10px_30px_rgba(11,26,31,0.08)] ring-2 ring-sapin transition-shadow ring-inset placeholder:text-ardoise focus:shadow-[0_0_0_6px_rgb(166_242_107/0.55)] focus:outline-none lg:h-16"
        />
      </div>
      <p role="status" className={noMatch ? "pt-1 text-[15px] text-ardoise" : "sr-only"}>
        {noMatch ? empty : ""}
      </p>
    </div>
  );
}

/**
 * Theme list (mockup 01-07): a sticky column on desktop, a row of chips that scrolls sideways on
 * mobile. The theme on screen is highlighted.
 */
export function FaqThemes({
  label,
  themes,
}: {
  label: string;
  themes: { id: string; label: string; count: number; icon: IconName }[];
}) {
  const [active, setActive] = useState(themes[0]?.id);
  useEffect(() => {
    // The active theme is the last one whose heading has passed a line at 30 % of the screen.
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      let current = themes[0]?.id;
      for (const theme of themes) {
        const element = document.getElementById(theme.id);
        if (element && !element.hidden && element.getBoundingClientRect().top <= line) {
          current = theme.id;
        }
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [themes]);

  return (
    <nav aria-label={label} className="min-w-0">
      <p className="hidden px-1 pb-1.5 text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-ardoise uppercase lg:block">
        {label}
      </p>
      <ul className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-0">
        {themes.map((theme) => {
          const on = theme.id === active;
          return (
            <li key={theme.id} data-faq-link={theme.id} className="shrink-0">
              <a
                href={`#${theme.id}`}
                aria-current={on ? "location" : undefined}
                className={cx(
                  "flex h-[34px] items-center gap-2 rounded-pill px-3.5 text-[12.5px] font-medium whitespace-nowrap transition-colors lg:h-11 lg:rounded-[14px]",
                  on
                    ? "bg-sapin text-blanc"
                    : "bg-blanc ring-[1.5px] ring-brume ring-inset hover:ring-sapin",
                )}
              >
                <Icon name={theme.icon} className="size-4 shrink-0" />
                {theme.label}
                <span className="ml-auto hidden pl-3 text-[11px] opacity-60 lg:inline">
                  {theme.count}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
