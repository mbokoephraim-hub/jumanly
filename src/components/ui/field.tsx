import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

/**
 * Mockup 00-02: white field, radius 14, 1.5 px Brume border drawn inside; focus Sapin + Lime
 * halo; error Corail with its message; valid state Feuille.
 */
export const inputClasses = cx(
  "w-full rounded-sm bg-blanc px-4 text-sm text-sapin ring-[1.5px] ring-brume ring-inset",
  "placeholder:text-[#8a9794] transition-shadow",
  "hover:ring-sapin/35",
  "focus:shadow-[0_0_0_6px_rgb(166_242_107/0.55)] focus:ring-2 focus:ring-sapin focus:outline-none",
  "disabled:cursor-not-allowed disabled:bg-creme disabled:text-ardoise",
  "aria-invalid:ring-corail",
);

export type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

export type FieldAria = {
  id: string;
  required?: boolean;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

/** Shared wrapper: label above, hint and error message linked to the control for accessibility. */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: FieldProps & { children: (aria: FieldAria) => ReactNode }) {
  const t = useTranslations("common");
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] leading-[18px] font-semibold text-sapin">
        {label}
        {required ? (
          <span className="text-corail-fonce" aria-hidden>
            {" *"}
          </span>
        ) : (
          <span className="font-medium text-ardoise">
            {" · "}
            {t("optional")}
          </span>
        )}
      </label>
      {children({
        id,
        required,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": [errorId, hintId].filter(Boolean).join(" ") || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-xs leading-[17px] text-ardoise">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs leading-[17px] font-medium text-down-texte">
          {error}
        </p>
      )}
    </div>
  );
}
