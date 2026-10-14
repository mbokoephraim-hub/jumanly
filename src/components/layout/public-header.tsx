import { Suspense } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { publicHeaderNavigation, solutionsNavigation, publicNavigation } from "@/config/navigation";
import { Icon, Logo } from "@/components/brand";
import { ButtonLink } from "@/components/ui";
import { NavLink } from "./nav-link";
import { navLinkClasses } from "./nav-link-styles";

/**
 * White public header (mockup 00-04): logo, the seven site sections with a Lime underline under
 * the current one, « Se connecter » outlined and « Créer un compte » in Lime. On mobile: logo,
 * « Créer un compte » and a round menu button (native <details>, no JavaScript needed).
 */
export function PublicHeader() {
  const t = useTranslations("nav");
  return (
    <header className="sticky top-0 z-30 bg-blanc shadow-[0_1px_0_#e6e9e7]">
      <div className="mx-auto flex h-16 max-w-[1248px] items-center gap-3 px-4 xl:h-[84px] xl:gap-7 xl:px-6">
        <Link href="/" aria-label={t("logo.label")} className="shrink-0">
          <span className="xl:hidden">
            <Logo height={28} />
          </span>
          <span className="hidden xl:block">
            <Logo height={34} />
          </span>
        </Link>
        <nav aria-label={t("menu.label")} className="hidden flex-1 xl:block">
          {/* The current page is known at request time only: prerendered pages show the plain list. */}
          <Suspense
            fallback={
              <ul className="flex gap-[22px]">
                {publicHeaderNavigation.map((link) => (
                  <li key={link.key}>
                    <Link href={link.href} className={navLinkClasses("public", false)}>
                      <span>{t(link.key)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            }
          >
            <ul className="flex gap-[22px]">
              {publicHeaderNavigation.map((link) => (
                <li key={link.key}>
                  <NavLink href={link.href} label={t(link.key)} placement="public" />
                </li>
              ))}
            </ul>
          </Suspense>
        </nav>
        <div className="flex-1 xl:hidden" />
        <div className="hidden items-center gap-3 xl:flex">
          <ButtonLink href="/connexion" variant="tertiary">
            {t("login")}
          </ButtonLink>
          <ButtonLink href="/inscription">{t("signup")}</ButtonLink>
        </div>
        <ButtonLink href="/inscription" size="sm" className="xl:hidden">
          {t("signup")}
        </ButtonLink>
        <details className="relative xl:hidden">
          <summary
            className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full bg-creme [&::-webkit-details-marker]:hidden"
            aria-label={t("menu.open")}
          >
            <Icon name="menu" className="size-5" />
          </summary>
          <nav
            aria-label={t("menu.label")}
            className="absolute right-0 mt-2 flex max-h-[calc(100dvh-5rem)] w-72 flex-col gap-1 overflow-y-auto rounded-box bg-blanc p-3 shadow-menu"
          >
            <p className="px-3 pt-1 pb-1 text-lab text-feuille-fonce">{t("group.discover")}</p>
            {[...publicNavigation, { key: "about", href: "/a-propos" } as const].map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="rounded-sm px-3 py-2.5 text-[15px] font-medium hover:bg-creme"
              >
                {t(link.key)}
              </Link>
            ))}
            <p className="px-3 pt-3 pb-1 text-lab text-feuille-fonce">{t("group.solutions")}</p>
            {solutionsNavigation.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="rounded-sm px-3 py-2.5 text-[15px] font-medium hover:bg-creme"
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
