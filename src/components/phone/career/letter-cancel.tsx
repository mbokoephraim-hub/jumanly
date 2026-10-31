"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * « Annuler » at the very bottom of « Nouvelle lettre » (Ephraïm, 31/10/2026): asks first, then
 * goes back to Mes documents.
 */
export function LetterCancel({
  href,
  texts,
}: {
  href: string;
  /** Already translated on the server (phoneLetter.cancel.*). */
  texts: Record<"cancel" | "ask" | "yes" | "no", string>;
}) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const stay = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!asking) return;
    stay.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAsking(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [asking]);
  return (
    <>
      <button type="button" className="nb-lt-annuler" onClick={() => setAsking(true)}>
        {texts.cancel}
      </button>
      {asking && (
        <div className="nb-lt-accueil">
          <div
            className="nb-lt-carte"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="nb-lt-annuler-t"
          >
            <h2 id="nb-lt-annuler-t">{texts.ask}</h2>
            <button type="button" className="nb-lt-bt" onClick={() => router.push(href)}>
              {texts.yes}
            </button>
            <button
              ref={stay}
              type="button"
              className="nb-lt-annuler"
              onClick={() => setAsking(false)}
            >
              {texts.no}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
