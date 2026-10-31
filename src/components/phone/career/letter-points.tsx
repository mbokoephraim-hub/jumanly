"use client";

import { useState } from "react";
import { PhoneIcon } from "@/components/phone/icon";

const MAX_POINTS = 5;
const MAX_LENGTH = 600;

/**
 * « À mettre en avant » (Ephraïm, 31/10/2026) : un détail par ligne, « + Ajouter un autre point »
 * pour en écrire un de plus. Les points partent ensemble dans le champ `points`.
 */
export function LetterPoints({
  label,
  example,
  addLabel,
  removeLabel,
}: {
  label: string;
  example: string;
  addLabel: string;
  removeLabel: string;
}) {
  const [points, setPoints] = useState<string[]>([""]);
  const joined = points
    .map((point) => point.trim())
    .filter(Boolean)
    .join(" ; ")
    .slice(0, MAX_LENGTH);
  const set = (index: number, value: string) =>
    setPoints((list) => list.map((point, i) => (i === index ? value : point)));
  return (
    <fieldset className="nb-lt-champ">
      <legend>{label}</legend>
      <input type="hidden" name="points" value={joined} />
      <ul className="nb-lt-points">
        {points.map((point, index) => (
          <li key={index}>
            <input
              className="nb-lt-zone"
              value={point}
              maxLength={200}
              aria-label={`${label} ${index + 1}`}
              placeholder={index === 0 ? example : undefined}
              autoFocus={index > 0 && index === points.length - 1 && point === ""}
              onChange={(event) => set(index, event.target.value)}
            />
            {points.length > 1 && (
              <button
                type="button"
                className="nb-lt-retirer"
                aria-label={`${removeLabel} ${index + 1}`}
                onClick={() => setPoints((list) => list.filter((_, i) => i !== index))}
              >
                <PhoneIcon name="fermer" size={18} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {points.length < MAX_POINTS && (
        <button
          type="button"
          className="nb-lt-ajouter"
          onClick={() => setPoints((list) => [...list, ""])}
        >
          {addLabel}
        </button>
      )}
    </fieldset>
  );
}
