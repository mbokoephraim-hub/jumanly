"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

function estActif(chemin: string, href: string) {
  return href === "/app" ? chemin === href : chemin === href || chemin.startsWith(`${href}/`);
}

/** Lien de navigation de l'espace connecté, mis en avant quand la page est ouverte. */
export function LienNavigation({
  href,
  icone,
  libelle,
  disposition,
}: {
  href: string;
  icone: ReactNode;
  libelle: string;
  disposition: "barre-laterale" | "barre-basse";
}) {
  const actif = estActif(usePathname(), href);
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={cx(
        "flex items-center transition-colors",
        disposition === "barre-laterale"
          ? "h-11 gap-3 rounded-pastille px-4 text-[15px] font-medium"
          : "h-full flex-1 flex-col justify-center gap-1 text-[11px] font-medium",
        disposition === "barre-laterale" &&
          (actif ? "bg-lime text-sapin" : "text-blanc/75 hover:bg-blanc/8 hover:text-blanc"),
        disposition === "barre-basse" && (actif ? "text-sapin" : "text-ardoise"),
      )}
    >
      <span
        className={cx(
          disposition === "barre-basse" && "rounded-pastille px-4 py-1",
          disposition === "barre-basse" && actif && "bg-lime",
        )}
      >
        {icone}
      </span>
      {libelle}
    </Link>
  );
}
