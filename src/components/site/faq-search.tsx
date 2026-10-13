"use client";

import { useState } from "react";
import { SearchField } from "@/components/ui/search-field";

/**
 * Filters the questions already rendered by the server (elements marked `data-faq`). Without
 * JavaScript, every question stays visible.
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
    const words = query
      .toLocaleLowerCase("fr")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .split(/\s+/)
      .filter(Boolean);
    let visible = 0;
    document.querySelectorAll<HTMLElement>("[data-faq]").forEach((item) => {
      const text = (item.textContent ?? "")
        .toLocaleLowerCase("fr")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
      const match = words.every((word) => text.includes(word));
      item.hidden = !match;
      if (match) visible++;
    });
    document.querySelectorAll<HTMLElement>("[data-faq-theme]").forEach((theme) => {
      theme.hidden = theme.querySelectorAll("[data-faq]:not([hidden])").length === 0;
    });
    setNoMatch(visible === 0);
  }
  return (
    <div className="flex flex-col gap-3">
      <SearchField
        id="faq-search"
        label={label}
        placeholder={placeholder}
        onChange={(e) => filter(e.target.value)}
      />
      <p role="status" className={noMatch ? "text-ardoise" : "sr-only"}>
        {noMatch ? empty : ""}
      </p>
    </div>
  );
}
