import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

function borner(valeur: number) {
  return Math.min(100, Math.max(0, Math.round(valeur)));
}

/** Barre de progression horizontale (0 à 100). */
export function BarreProgression({
  valeur,
  label,
  ton = "sapin",
}: {
  valeur: number;
  label: string;
  ton?: "sapin" | "lime" | "alerte" | "erreur";
}) {
  const pourcentage = borner(valeur);
  const couleurs = { sapin: "bg-sapin", lime: "bg-lime", alerte: "bg-ambre", erreur: "bg-corail" };
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pourcentage}
      className="h-2.5 w-full overflow-hidden rounded-pastille bg-brume"
    >
      <div
        className={cx("h-full rounded-pastille transition-[width]", couleurs[ton])}
        style={{ width: `${pourcentage}%` }}
      />
    </div>
  );
}

/** Arc de progression circulaire (charte § 10), avec le pourcentage au centre. */
export function ArcProgression({
  valeur,
  label,
  taille = 96,
}: {
  valeur: number;
  label: string;
  taille?: number;
}) {
  const t = useTranslations("composants");
  const pourcentage = borner(valeur);
  const rayon = 42;
  const circonference = 2 * Math.PI * rayon;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pourcentage}
      className="relative inline-flex items-center justify-center"
      style={{ width: taille, height: taille }}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={rayon} fill="none" strokeWidth="10" className="stroke-brume" />
        <circle
          cx="50"
          cy="50"
          r={rayon}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-lime"
          strokeDasharray={circonference}
          strokeDashoffset={circonference * (1 - pourcentage / 100)}
        />
      </svg>
      <span className="absolute text-lg font-semibold text-sapin" aria-hidden>
        {t("pourcentage", { valeur: pourcentage })}
      </span>
    </div>
  );
}
