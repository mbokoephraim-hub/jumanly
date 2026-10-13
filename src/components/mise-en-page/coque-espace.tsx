import type { ReactNode } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { navigationEspaceTalent } from "@/config/navigation";
import { Avatar, Logo } from "@/components/ui";
import { LienNavigation } from "./lien-navigation";

/**
 * Gabarit de l'espace connecté.
 * Desktop : barre latérale vert sapin. Mobile : en-tête compact et barre de navigation basse.
 */
export function CoqueEspace({
  nomUtilisateur,
  children,
}: {
  nomUtilisateur: string;
  children: ReactNode;
}) {
  const t = useTranslations("navigation.espace");
  return (
    <div className="min-h-dvh bg-creme lg:pl-64">
      <a
        href="#contenu"
        className="sr-only z-50 rounded-pastille bg-lime px-4 py-2 text-sapin focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("allerAuContenu")}
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-8 bg-sapin px-4 py-6 lg:flex">
        <Link href="/app" className="px-3" aria-label={t("accueil")}>
          <Logo version="negatif" hauteur={28} />
        </Link>
        <nav aria-label={t("principale")}>
          <ul className="flex flex-col gap-1">
            {navigationEspaceTalent.map(({ cle, href, icone: Icone }) => (
              <li key={cle}>
                <LienNavigation
                  href={href}
                  libelle={t(cle)}
                  icone={<Icone aria-hidden className="size-5" strokeWidth={2} />}
                  disposition="barre-laterale"
                />
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-brume/70 bg-creme/90 px-4 backdrop-blur sm:px-6 lg:px-10">
        <Link href="/app" className="lg:hidden" aria-label={t("accueil")}>
          <Logo version="pictogramme" hauteur={34} />
        </Link>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t("notifications")}
            className="flex size-11 items-center justify-center rounded-full text-sapin hover:bg-sapin/8"
          >
            <Bell aria-hidden className="size-5" />
          </button>
          <Avatar nom={nomUtilisateur} taille="sm" />
        </div>
      </header>

      <main id="contenu" className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pb-12">
        {children}
      </main>

      <nav
        aria-label={t("principale")}
        className="fixed inset-x-0 bottom-0 z-20 h-18 border-t border-brume bg-blanc pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="flex h-full">
          {navigationEspaceTalent.map(({ cle, href, icone: Icone }) => (
            <li key={cle} className="flex flex-1">
              <LienNavigation
                href={href}
                libelle={t(cle)}
                icone={<Icone aria-hidden className="size-5" strokeWidth={2} />}
                disposition="barre-basse"
              />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
