import { Suspense } from "react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { publicNavigation, solutionsNavigation } from "@/config/navigation";
import { Icon, Logo } from "@/components/brand";
import { SiteButton } from "@/components/site/marketing";
import { cx } from "@/lib/cx";
import { NavLink } from "./nav-link";
import { navLinkClasses } from "./nav-link-styles";

/**
 * Public header (identity of 28/10/2026): a white pill floating at the top of the page, like the
 * menu of the Modèle B app. Logo, « Solutions » (the four audiences), the catalogs and pricing,
 * the language switch, « Se connecter » and « Créer un compte » in Lime. On phones: logo, the Lime
 * pill and a round menu button (native <details>, no JavaScript).
 */
export async function PublicHeader() {
  const t = await getTranslations("nav");
  const pages = [...publicNavigation, { key: "about", href: "/a-propos" } as const];
  const itemLink =
    "flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[15px] font-medium hover:bg-papier";
  return (
    <header className="sticky top-0 z-30 px-2 pt-2 sm:px-3 lg:px-4 lg:pt-3">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 rounded-pill bg-blanc/90 pr-2 pl-4 shadow-[0_10px_30px_rgba(11,26,31,0.08)] ring-1 ring-sapin/8 backdrop-blur-xl lg:h-[68px] lg:pl-6">
        <Link href="/" aria-label={t("logo.label")} className="shrink-0">
          <span className="xl:hidden">
            <Logo height={26} />
          </span>
          <span className="hidden xl:block">
            <Logo height={30} />
          </span>
        </Link>
        <nav aria-label={t("menu.label")} className="hidden flex-1 justify-center xl:flex">
          <ul className="flex items-center gap-1 rounded-pill bg-papier p-1">
            <li className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className="flex h-10 items-center gap-1.5 rounded-pill px-4 text-[14px] font-medium hover:bg-blanc"
              >
                {t("group.solutions")}
                <Icon
                  name="chev-d"
                  className="size-4 transition-transform group-focus-within:rotate-180 group-hover:rotate-180"
                />
              </button>
              {/* Opens on hover and on keyboard focus: no script needed. */}
              <div className="invisible absolute top-full left-0 pt-2 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <ul className="flex w-64 flex-col gap-0.5 rounded-[22px] bg-blanc p-2 shadow-menu ring-1 ring-sapin/8">
                  {solutionsNavigation.map((link) => (
                    <li key={link.key}>
                      <Link href={link.href} className={itemLink}>
                        <span aria-hidden className="size-2 rounded-full bg-lime" />
                        {t(link.key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
            {/* The current page is known at request time only: prerendered pages show the plain list. */}
            <Suspense
              fallback={pages.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className={navLinkClasses("public", false)}>
                    <span>{t(link.key)}</span>
                  </Link>
                </li>
              ))}
            >
              {pages.map((link) => (
                <li key={link.key}>
                  <NavLink href={link.href} label={t(link.key)} placement="public" />
                </li>
              ))}
            </Suspense>
          </ul>
        </nav>
        <div className="flex-1 xl:hidden" />
        <LanguageSwitch className="max-sm:hidden" />
        <Link
          href="/connexion"
          className="hidden h-11 items-center rounded-pill px-4 text-[14px] font-semibold hover:bg-papier xl:flex"
        >
          {t("login")}
        </Link>
        <SiteButton href="/inscription" tone="lime" size="md" className="max-sm:hidden">
          {t("signup")}
        </SiteButton>
        <details className="relative xl:hidden">
          <summary
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full bg-nuit text-lime [&::-webkit-details-marker]:hidden"
            aria-label={t("menu.open")}
          >
            <Icon name="menu" className="size-5" />
          </summary>
          <nav
            aria-label={t("menu.label")}
            className="absolute right-0 mt-3 flex max-h-[calc(100dvh-6rem)] w-[min(20rem,calc(100vw-1rem))] flex-col gap-0.5 overflow-y-auto rounded-[28px] bg-blanc p-3 shadow-menu ring-1 ring-sapin/8"
          >
            <p className="px-3 pt-1 pb-1 text-lab text-feuille-fonce">{t("group.solutions")}</p>
            {solutionsNavigation.map((link) => (
              <Link key={link.key} href={link.href} className={itemLink}>
                <span aria-hidden className="size-2 rounded-full bg-lime" />
                {t(link.key)}
              </Link>
            ))}
            <p className="px-3 pt-3 pb-1 text-lab text-feuille-fonce">{t("group.discover")}</p>
            {pages.map((link) => (
              <Link key={link.key} href={link.href} className={itemLink}>
                <span aria-hidden className="size-2 rounded-full bg-sapin/25" />
                {t(link.key)}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-sapin/10 pt-3">
              <LanguageSwitch className="self-start sm:hidden" />
              <SiteButton href="/inscription" tone="lime" size="md" fullWidth>
                {t("signup")}
              </SiteButton>
              <SiteButton href="/connexion" tone="light" size="md" fullWidth>
                {t("login")}
              </SiteButton>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}

/**
 * « FR | EN »: each language is a link to /langue, which keeps the choice and comes back to the
 * page being read (no JavaScript).
 */
export async function LanguageSwitch({
  dark = false,
  className,
}: {
  dark?: boolean;
  className?: string;
}) {
  const t = await getTranslations("nav.language");
  const current = await getLocale();
  const languages = [
    { code: "fr", short: t("frShort"), name: t("fr") },
    { code: "en", short: t("enShort"), name: t("en") },
  ] as const;
  return (
    <nav
      aria-label={t("label")}
      className={cx(
        "flex items-center rounded-pill p-1",
        dark ? "bg-blanc/10 ring-1 ring-blanc/15 ring-inset" : "bg-papier",
        className,
      )}
    >
      {languages.map((language) => {
        const active = language.code === current;
        return (
          <a
            key={language.code}
            href={`/langue?vers=${language.code}`}
            hrefLang={language.code}
            lang={language.code}
            aria-label={language.name}
            aria-current={active ? "true" : undefined}
            className={cx(
              "flex h-9 min-w-10 items-center justify-center rounded-pill px-2.5 text-[13px] font-semibold transition-colors",
              active
                ? dark
                  ? "bg-lime text-sapin"
                  : "bg-nuit text-blanc"
                : dark
                  ? "text-blanc/80 hover:text-blanc"
                  : "text-sapin/80 hover:bg-blanc",
            )}
          >
            {language.short}
          </a>
        );
      })}
    </nav>
  );
}
