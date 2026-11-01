"use client";

import { useId } from "react";
import { SOCIAL_KINDS, type SocialKind } from "@/lib/social-links";
import { PhoneIcon } from "../icon";

/**
 * The networks' marks for « Modifier le profil » (Ephraïm 01/11/2026: « juste les icônes de ces
 * réseaux »), all in Jumanly's mint (01/11/2026): the mark alone names the network.
 */
const MARKS: Record<SocialKind, { d: string; fill: boolean }> = {
  linkedin: {
    d: "M6.9 9.4H4.4V19h2.5zM5.65 4.9a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9zM19.6 13.7c0-2.7-1.45-4.5-3.85-4.5-1.35 0-2.25.7-2.65 1.4V9.4h-2.45V19h2.5v-5c0-1.3.6-2.25 1.75-2.25s1.65.85 1.65 2.25v5h2.55z",
    fill: true,
  },
  instagram: {
    d: "M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4zM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zM16.9 7.1v.01",
    fill: false,
  },
  x: {
    d: "M17.2 4.5h2.7l-5.9 6.7 6.9 8.3h-5.4l-4.2-5.1-4.9 5.1H3.7l6.3-7.1L3.4 4.5h5.5l3.8 4.7zM16.3 18h1.5L8 6H6.4z",
    fill: true,
  },
  facebook: {
    d: "M13.4 21v-7.3h2.5l.4-2.9h-2.9V9c0-.85.25-1.4 1.45-1.4h1.55V5a20 20 0 0 0-2.25-.12c-2.25 0-3.75 1.35-3.75 3.85v2.1H7.9v2.9h2.5V21z",
    fill: true,
  },
  website: {
    d: "M12 3.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4zM3.8 12h16.4M12 3.8c2.2 2.3 3.2 5 3.2 8.2s-1 5.9-3.2 8.2c-2.2-2.3-3.2-5-3.2-8.2s1-5.9 3.2-8.2z",
    fill: false,
  },
};

/** A network's mark on its colour tile (also used by the e-mail row, with `mail`). */
export function SocialTile({ kind }: { kind: SocialKind | "email" }) {
  const mark =
    kind === "email"
      ? {
          d: "M4.5 6h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 7.2l8 5.6 8-5.6",
          fill: false,
        }
      : MARKS[kind];
  return (
    <span className="nb-mp-tuile" data-reseau={kind} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={20} height={20}>
        <path
          d={mark.d}
          fill={mark.fill ? "currentColor" : "none"}
          stroke={mark.fill ? "none" : "currentColor"}
          strokeWidth={mark.fill ? undefined : 1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function SocialRow({
  kind,
  label,
  placeholder,
  clearLabel,
  value,
  invalid,
  error,
  onChange,
}: {
  kind: SocialKind;
  label: string;
  placeholder: string;
  clearLabel: string;
  value: string;
  invalid: boolean;
  error: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const filled = value.trim() !== "";
  return (
    <li
      className="nb-mp-rs"
      data-rempli={filled ? "" : undefined}
      data-faux={invalid ? "" : undefined}
    >
      <SocialTile kind={kind} />
      <div className="nb-mp-rs-c">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          type="url"
          inputMode="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={300}
          aria-invalid={invalid || undefined}
        />
        {invalid ? (
          <p className="nb-ca-erreur" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      {filled ? (
        <button
          type="button"
          className="nb-mp-rs-x"
          onClick={() => onChange("")}
          aria-label={clearLabel}
        >
          <PhoneIcon name="fermer" size={16} />
        </button>
      ) : null}
    </li>
  );
}

/** The five networks in one card: the mark, the address; « × » empties it. */
export function SocialFields({
  values,
  onChange,
  invalid,
  labels,
}: {
  values: Record<SocialKind, string>;
  onChange: (values: Record<SocialKind, string>) => void;
  /** True after a refused save: each filled network shows the error below its address. */
  invalid: boolean;
  labels: {
    name: (kind: SocialKind) => string;
    placeholder: (kind: SocialKind) => string;
    clear: (kind: SocialKind) => string;
    error: string;
  };
}) {
  return (
    <ul className="nb-mp-carte">
      {SOCIAL_KINDS.map((kind) => (
        <SocialRow
          key={kind}
          kind={kind}
          label={labels.name(kind)}
          placeholder={labels.placeholder(kind)}
          clearLabel={labels.clear(kind)}
          value={values[kind]}
          invalid={invalid && values[kind].trim() !== ""}
          error={labels.error}
          onChange={(value) => onChange({ ...values, [kind]: value })}
        />
      ))}
    </ul>
  );
}
