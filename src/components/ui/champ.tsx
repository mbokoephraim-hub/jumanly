import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

export const classesSaisie = cx(
  "w-full rounded-petit border border-brume bg-blanc px-4 text-sapin",
  "placeholder:text-ardoise/70 transition-colors",
  "hover:border-sapin/40 focus:border-feuille focus:outline-none focus:ring-3 focus:ring-feuille/20",
  "disabled:cursor-not-allowed disabled:bg-creme disabled:text-ardoise",
  "aria-invalid:border-corail aria-invalid:focus:ring-corail/20",
);

export type ProprietesChamp = {
  id: string;
  label: string;
  aide?: string;
  erreur?: string;
  requis?: boolean;
};

/** Enveloppe commune : libellé, aide, message d'erreur reliés au champ pour l'accessibilité. */
export function Champ({
  id,
  label,
  aide,
  erreur,
  requis,
  children,
}: ProprietesChamp & { children: (aria: AttributsAria) => ReactNode }) {
  const t = useTranslations("composants");
  const idAide = aide ? `${id}-aide` : undefined;
  const idErreur = erreur ? `${id}-erreur` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label font-medium text-sapin">
        {label}
        {requis ? (
          <span className="text-corail" aria-hidden>
            {" *"}
          </span>
        ) : (
          <span className="font-normal text-ardoise"> {t("facultatif")}</span>
        )}
      </label>
      {children({
        id,
        required: requis,
        "aria-invalid": erreur ? true : undefined,
        "aria-describedby": [idErreur, idAide].filter(Boolean).join(" ") || undefined,
      })}
      {aide && (
        <p id={idAide} className="text-legende text-ardoise">
          {aide}
        </p>
      )}
      {erreur && (
        <p id={idErreur} className="text-legende font-medium text-corail">
          {erreur}
        </p>
      )}
    </div>
  );
}

export type AttributsAria = {
  id: string;
  required?: boolean;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};
