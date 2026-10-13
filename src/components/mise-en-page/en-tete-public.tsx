import Link from "next/link";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { navigationPublique } from "@/config/navigation";
import { BoutonLien, Logo } from "@/components/ui";

export function EnTetePublic() {
  const t = useTranslations("navigation.public");
  return (
    <header className="sticky top-0 z-30 border-b border-brume/70 bg-creme/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label={t("accueil")}>
          <Logo hauteur={30} />
        </Link>
        <nav aria-label={t("principale")} className="hidden md:block">
          <ul className="flex items-center gap-7 text-[15px] font-medium">
            {navigationPublique.map((lien) => (
              <li key={lien.cle}>
                <Link href={lien.href} className="text-sapin/80 hover:text-sapin">
                  {t(lien.cle)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <BoutonLien href="/connexion" variante="fantome" taille="sm">
            {t("connexion")}
          </BoutonLien>
          <BoutonLien href="/inscription" variante="primaire" taille="sm">
            {t("inscription")}
          </BoutonLien>
        </div>
        {/* Menu mobile sans JavaScript : <details> natif. */}
        <details className="group relative md:hidden">
          <summary
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full hover:bg-sapin/8"
            aria-label={t("menu")}
          >
            <Menu aria-hidden className="size-6" />
          </summary>
          <div className="absolute right-0 mt-2 flex w-64 flex-col gap-1 rounded-composant bg-blanc p-3 shadow-carte">
            {navigationPublique.map((lien) => (
              <Link
                key={lien.cle}
                href={lien.href}
                className="rounded-petit px-3 py-2.5 font-medium hover:bg-creme"
              >
                {t(lien.cle)}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-brume pt-3">
              <BoutonLien href="/connexion" variante="contour" pleineLargeur>
                {t("connexion")}
              </BoutonLien>
              <BoutonLien href="/inscription" pleineLargeur>
                {t("inscription")}
              </BoutonLien>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
