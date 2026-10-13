"use client";

import { useState } from "react";
import { cx } from "@/lib/cx";

type Props = {
  id: string;
  label: string;
  hint?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
};

/** On / off toggle (ARIA "switch" role). */
export function Switch({ id, label, hint, checked = false, disabled, onChange }: Props) {
  const [on, setOn] = useState(checked);
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col">
        <label htmlFor={id} className="text-[15px] leading-6 text-sapin">
          {label}
        </label>
        {hint && (
          <span id={`${id}-hint`} className="text-ardoise text-caption">
            {hint}
          </span>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        aria-describedby={hint ? `${id}-hint` : undefined}
        disabled={disabled}
        onClick={() => {
          setOn(!on);
          onChange?.(!on);
        }}
        className={cx(
          "relative h-7 w-12 shrink-0 rounded-pill transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-45",
          on ? "bg-sapin" : "bg-brume",
        )}
      >
        <span
          aria-hidden
          className={cx(
            "absolute top-1 left-1 size-5 rounded-full transition-transform",
            on ? "translate-x-5 bg-lime" : "bg-blanc",
          )}
        />
      </button>
    </div>
  );
}
