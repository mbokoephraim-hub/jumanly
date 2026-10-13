import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { publicNavigation, solutionsNavigation } from "@/config/navigation";
import { Logo } from "@/components/brand";
import { ButtonLink } from "@/components/ui";

/**
 * Light public header (§ 11.4): "Se connecter" tertiary, "Créer un compte" primary.
 * Menus use native <details>: they work without JavaScript.
 */
export function PublicHeader() {
  const t = useTranslations("nav");
  return (
    <header className="sticky top-0 z-30 border-b border-brume/70 bg-creme/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 page-x">
        <Link href="/" aria-label={t("logo.label")}>
          <Logo height={30} />
        </Link>
        <nav aria-label={t("menu.label")} className="hidden lg:block">
          <ul className="flex items-center gap-7 text-[15px] font-medium">
            <li>
              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-1 hover:underline">
                  {t("group.solutions")}
                  <ChevronDown
                    aria-hidden
                    className="size-4 transition-transform group-open:rotate-180"
                  />
                </summary>
                <ul className="absolute left-0 mt-3 flex w-56 flex-col gap-1 rounded-md border border-brume bg-blanc p-2">
                  {solutionsNavigation.map((link) => (
                    <li key={link.key}>
                      <Link
                        href={link.href}
                        className="block rounded-sm px-3 py-2.5 hover:bg-creme"
                      >
                        {t(link.key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
            {publicNavigation.map((link) => (
              <li key={link.key}>
                <Link href={link.href} className="hover:underline">
                  {t(link.key)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/a-propos" className="hover:underline">
                {t("about")}
              </Link>
            </li>
          </ul>
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink href="/connexion" variant="tertiary" size="sm">
            {t("login")}
          </ButtonLink>
          <ButtonLink href="/inscription" size="sm">
            {t("signup")}
          </ButtonLink>
        </div>
        <details className="relative lg:hidden">
          <summary
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full hover:bg-sapin/8"
            aria-label={t("menu.open")}
          >
            <Menu aria-hidden className="size-6" />
          </summary>
          <nav
            aria-label={t("menu.label")}
            className="absolute right-0 mt-2 flex max-h-[calc(100dvh-5rem)] w-72 flex-col gap-1 overflow-y-auto rounded-md border border-brume bg-blanc p-3"
          >
            <p className="px-3 pt-1 pb-1 text-eyebrow text-feuille-fonce">{t("group.discover")}</p>
            {[...publicNavigation, { key: "about", href: "/a-propos" } as const].map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="rounded-sm px-3 py-2.5 font-medium hover:bg-creme"
              >
                {t(link.key)}
              </Link>
            ))}
            <p className="px-3 pt-3 pb-1 text-eyebrow text-feuille-fonce">{t("group.solutions")}</p>
            {solutionsNavigation.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="rounded-sm px-3 py-2.5 font-medium hover:bg-creme"
              >
                {t(link.key)}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-brume pt-3">
              <ButtonLink href="/connexion" variant="tertiary" fullWidth>
                {t("login")}
              </ButtonLink>
              <ButtonLink href="/inscription" fullWidth>
                {t("signup")}
              </ButtonLink>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
