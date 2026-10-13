import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

export const inputClasses = cx(
  "w-full rounded-sm border border-brume bg-blanc px-4 text-sapin",
  "placeholder:text-ardoise/70 transition-colors",
  "hover:border-sapin/40 focus:border-feuille focus:outline-none focus:ring-3 focus:ring-feuille/20",
  "disabled:cursor-not-allowed disabled:bg-creme disabled:text-ardoise",
  "aria-invalid:border-corail aria-invalid:focus:ring-corail/20",
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

/** Shared wrapper: label, hint and error message linked to the control for accessibility. */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: FieldProps & { children: (aria: FieldAria) => ReactNode }) {
  const t = useTranslations("ui");
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sapin text-label">
        {label}
        {required ? (
          <span className="text-corail" aria-hidden>
            {" *"}
          </span>
        ) : (
          <span className="font-normal text-ardoise"> {t("optional")}</span>
        )}
      </label>
      {children({
        id,
        required,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": [errorId, hintId].filter(Boolean).join(" ") || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-ardoise text-caption">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="font-medium text-corail text-caption">
          {error}
        </p>
      )}
    </div>
  );
}
