"use client";

import { useState } from "react";
import { cx } from "@/lib/cx";

type Proprietes = {
  id: string;
  label: string;
  aide?: string;
  actif?: boolean;
  desactive?: boolean;
  onChange?: (actif: boolean) => void;
};

/** Interrupteur marche / arrêt (rôle ARIA « switch »). */
export function Interrupteur({ id, label, aide, actif = false, desactive, onChange }: Proprietes) {
  const [etat, setEtat] = useState(actif);
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col">
        <label htmlFor={id} className="text-[15px] leading-6 text-sapin">
          {label}
        </label>
        {aide && (
          <span id={`${id}-aide`} className="text-legende text-ardoise">
            {aide}
          </span>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={etat}
        aria-describedby={aide ? `${id}-aide` : undefined}
        disabled={desactive}
        onClick={() => {
          setEtat(!etat);
          onChange?.(!etat);
        }}
        className={cx(
          "relative h-7 w-12 shrink-0 rounded-pastille transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-45",
          etat ? "bg-sapin" : "bg-brume",
        )}
      >
        <span
          aria-hidden
          className={cx(
            "absolute top-1 left-1 size-5 rounded-full transition-transform",
            etat ? "translate-x-5 bg-lime" : "bg-blanc",
          )}
        />
      </button>
    </div>
  );
}
