import { useTranslations } from "next-intl";
import { BarreProgression } from "./progression";

/**
 * Jauge de quota : consommation d'un droit limité (ex. crédits IA du mois).
 * `limite` à `null` signifie illimité.
 */
export function JaugeQuota({
  libelle,
  utilise,
  limite,
}: {
  libelle: string;
  utilise: number;
  limite: number | null;
}) {
  const t = useTranslations("composants.jaugeQuota");
  const illimite = limite === null;
  const ratio = illimite || limite === 0 ? 0 : (utilise / limite) * 100;
  const ton = ratio >= 100 ? "erreur" : ratio >= 80 ? "alerte" : "sapin";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-medium text-sapin">{libelle}</span>
        <span className="text-label text-ardoise">
          {illimite ? t("illimite", { utilise }) : t("utilise", { utilise, limite })}
        </span>
      </div>
      {!illimite && <BarreProgression valeur={ratio} label={libelle} ton={ton} />}
      {!illimite && ratio >= 100 && (
        <p className="text-legende font-medium text-corail">{t("atteint")}</p>
      )}
    </div>
  );
}
