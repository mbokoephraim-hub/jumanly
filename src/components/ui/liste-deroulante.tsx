import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/lib/cx";
import { Champ, classesSaisie, type ProprietesChamp } from "./champ";

type Option = { valeur: string; libelle: string };

type Proprietes = ProprietesChamp &
  Omit<ComponentProps<"select">, "id" | "required"> & {
    options: Option[];
    /** Texte de la première option vide, si aucune valeur n'est choisie. */
    invite?: string;
  };

export function ListeDeroulante({
  id,
  label,
  aide,
  erreur,
  requis,
  options,
  invite,
  className,
  ...reste
}: Proprietes) {
  return (
    <Champ id={id} label={label} aide={aide} erreur={erreur} requis={requis}>
      {(aria) => (
        <div className="relative">
          <select
            className={cx(classesSaisie, "h-11 appearance-none pr-10", className)}
            {...aria}
            {...reste}
          >
            {invite && <option value="">{invite}</option>}
            {options.map((option) => (
              <option key={option.valeur} value={option.valeur}>
                {option.libelle}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ardoise"
          />
        </div>
      )}
    </Champ>
  );
}
