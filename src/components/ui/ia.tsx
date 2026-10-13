import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

/** Orbe IA (charte § 10) : signale une suggestion ou une analyse produite par l'IA. */
export function OrbeIA({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        "inline-block size-3 shrink-0 rounded-full bg-lime shadow-[0_0_0_3px_rgb(166_242_107/0.3),0_0_12px_rgb(47_211_166/0.6)]",
        className,
      )}
    />
  );
}

/**
 * Score de compatibilité avec son explication « Pourquoi ? ».
 * Règle : chaque score affiché doit être accompagné de son explication.
 */
export function ScoreExplique({
  titre,
  score,
  explication,
}: {
  titre: string;
  score: number;
  explication: ReactNode;
}) {
  const t = useTranslations("composants.ia");
  const tc = useTranslations("composants");
  return (
    <div className="rounded-composant bg-degrade-intelligence p-5 text-blanc">
      <div className="flex items-center gap-2 text-label font-medium text-neon">
        <OrbeIA />
        {t("suggere")}
      </div>
      <p className="mt-3 text-[15px] leading-6 opacity-90">{titre}</p>
      <p className="text-h1 font-semibold">{tc("pourcentage", { valeur: Math.round(score) })}</p>
      <details className="group mt-2">
        <summary className="cursor-pointer list-none text-sm font-medium text-lime underline-offset-4 hover:underline">
          {t("pourquoi")}
        </summary>
        <div className="mt-2 text-sm leading-6 opacity-90">{explication}</div>
      </details>
      <p className="mt-3 text-legende opacity-70">{t("humainDecide")}</p>
    </div>
  );
}
