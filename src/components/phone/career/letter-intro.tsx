"use client";

import { useEffect, useRef, useState } from "react";
import { OrbiDisc } from "@/components/phone/icon";

/**
 * « Nouvelle lettre » au téléphone (Ephraïm, 31/10/2026) : à l'arrivée, la page est floutée
 * derrière un court message qui explique les deux choix ; « C'est parti » ou « Passer » l'enlève.
 */
export function LetterIntro({
  texts,
}: {
  /** Already translated on the server (phoneLetter.intro.*). */
  texts: Record<"title" | "one" | "two" | "three" | "start" | "skip", string>;
}) {
  const t = (key: keyof typeof texts) => texts[key];
  const [open, setOpen] = useState(true);
  const start = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    start.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div className="nb-lt-accueil">
      <div
        className="nb-lt-carte"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nb-lt-accueil-t"
      >
        <button type="button" className="nb-lt-passer" onClick={() => setOpen(false)}>
          {t("skip")}
        </button>
        <OrbiDisc size={48} />
        <h2 id="nb-lt-accueil-t">{t("title")}</h2>
        <ol>
          <li>{t("one")}</li>
          <li>{t("two")}</li>
          <li>{t("three")}</li>
        </ol>
        <button
          ref={start}
          type="button"
          className="nb-lt-bt"
          data-orbi=""
          onClick={() => setOpen(false)}
        >
          {t("start")}
        </button>
      </div>
    </div>
  );
}
