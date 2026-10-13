"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";

type Onglet = { id: string; libelle: string; contenu: ReactNode };

/** Onglets accessibles : flèches gauche / droite, Début, Fin. */
export function Onglets({ onglets, initial }: { onglets: Onglet[]; initial?: string }) {
  const base = useId();
  const [actif, setActif] = useState(initial ?? onglets[0]?.id);
  const boutons = useRef<(HTMLButtonElement | null)[]>([]);

  function auClavier(event: KeyboardEvent, index: number) {
    const dernier = onglets.length - 1;
    const cible =
      event.key === "ArrowRight"
        ? index === dernier
          ? 0
          : index + 1
        : event.key === "ArrowLeft"
          ? index === 0
            ? dernier
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? dernier
              : null;
    if (cible === null) return;
    event.preventDefault();
    setActif(onglets[cible].id);
    boutons.current[cible]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        className="inline-flex max-w-full gap-1 overflow-x-auto rounded-pastille bg-blanc p-1 shadow-carte"
      >
        {onglets.map((onglet, index) => {
          const selectionne = onglet.id === actif;
          return (
            <button
              key={onglet.id}
              ref={(el) => {
                boutons.current[index] = el;
              }}
              id={`${base}-onglet-${onglet.id}`}
              role="tab"
              type="button"
              aria-selected={selectionne}
              aria-controls={`${base}-panneau-${onglet.id}`}
              tabIndex={selectionne ? 0 : -1}
              onClick={() => setActif(onglet.id)}
              onKeyDown={(event) => auClavier(event, index)}
              className={cx(
                "h-9 rounded-pastille px-4 text-sm font-medium whitespace-nowrap transition-colors",
                selectionne ? "bg-sapin text-blanc" : "text-ardoise hover:text-sapin",
              )}
            >
              {onglet.libelle}
            </button>
          );
        })}
      </div>
      {onglets.map((onglet) => (
        <div
          key={onglet.id}
          id={`${base}-panneau-${onglet.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-onglet-${onglet.id}`}
          hidden={onglet.id !== actif}
          className="pt-4"
        >
          {onglet.contenu}
        </div>
      ))}
    </div>
  );
}
