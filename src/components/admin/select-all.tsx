"use client";

import { useState } from "react";

/**
 * « Tout sélectionner » of a list form: ticks or unticks every `name` checkbox of the form, and
 * shows how many are ticked. Without JavaScript the rows are still ticked one by one.
 */
export function SelectAll({
  form,
  name,
  label,
  countLabel,
}: {
  form: string;
  name: string;
  label: string;
  /** « {count} sélectionnés », with `#` replaced by the count. */
  countLabel: string;
}) {
  const [count, setCount] = useState(0);
  const boxes = () => [
    ...(document
      .getElementById(form)
      ?.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`) ?? []),
  ];
  return (
    <span className="flex items-center gap-3">
      <label className="flex items-center gap-2 text-[13px] font-semibold">
        <input
          type="checkbox"
          className="size-[18px] accent-[#a6f26b]"
          onChange={(event) => {
            for (const box of boxes()) box.checked = event.target.checked;
            setCount(event.target.checked ? boxes().length : 0);
          }}
          ref={(node) => {
            const owner = node ? document.getElementById(form) : null;
            if (!owner) return;
            const update = () => setCount(boxes().filter((box) => box.checked).length);
            owner.addEventListener("change", update);
            return () => owner.removeEventListener("change", update);
          }}
        />
        {label}
      </label>
      <span aria-live="polite" className="text-[12.5px] text-ardoise">
        {countLabel.replace("#", String(count))}
      </span>
    </span>
  );
}
