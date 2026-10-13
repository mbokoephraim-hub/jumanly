import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

type Proprietes = Omit<ComponentProps<"input">, "type"> & {
  id: string;
  label: string;
  aide?: string;
  /** `radio` pour un choix unique dans un groupe. */
  type?: "checkbox" | "radio";
};

/** Case à cocher ou bouton radio avec son libellé. */
export function CaseACocher({
  id,
  label,
  aide,
  type = "checkbox",
  className,
  ...reste
}: Proprietes) {
  return (
    <div className={cx("flex items-start gap-3", className)}>
      <input
        id={id}
        type={type}
        aria-describedby={aide ? `${id}-aide` : undefined}
        className={cx(
          "mt-0.5 size-5 shrink-0 cursor-pointer border-brume accent-sapin",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        {...reste}
      />
      <div className="flex flex-col">
        <label htmlFor={id} className="cursor-pointer text-[15px] leading-6 text-sapin">
          {label}
        </label>
        {aide && (
          <span id={`${id}-aide`} className="text-legende text-ardoise">
            {aide}
          </span>
        )}
      </div>
    </div>
  );
}

/** Groupe de boutons radio avec une légende commune. */
export function GroupeRadio({
  legende,
  nom,
  options,
  valeurParDefaut,
}: {
  legende: string;
  nom: string;
  options: { valeur: string; libelle: string; aide?: string; desactive?: boolean }[];
  valeurParDefaut?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-label font-medium text-sapin">{legende}</legend>
      {options.map((option) => (
        <CaseACocher
          key={option.valeur}
          id={`${nom}-${option.valeur}`}
          type="radio"
          name={nom}
          value={option.valeur}
          label={option.libelle}
          aide={option.aide}
          disabled={option.desactive}
          defaultChecked={option.valeur === valeurParDefaut}
        />
      ))}
    </fieldset>
  );
}
