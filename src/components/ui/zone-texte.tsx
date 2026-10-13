import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";
import { Champ, classesSaisie, type ProprietesChamp } from "./champ";

type Proprietes = ProprietesChamp & Omit<ComponentProps<"textarea">, "id" | "required">;

export function ZoneTexte({ id, label, aide, erreur, requis, className, ...reste }: Proprietes) {
  return (
    <Champ id={id} label={label} aide={aide} erreur={erreur} requis={requis}>
      {(aria) => (
        <textarea
          rows={4}
          className={cx(classesSaisie, "min-h-24 py-3", className)}
          {...aria}
          {...reste}
        />
      )}
    </Champ>
  );
}
