import { Fragment, Suspense } from "react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { publicNavigation, solutionsNavigation } from "@/config/navigation";
import { Icon, Logo } from "@/components/brand";
import { MenuArt } from "@/components/site/menu-art";
import { SiteButton } from "@/components/site/marketing";
import { cx } from "@/lib/cx";
import { signupOpen } from "@/lib/signup";
import { NavLink } from "./nav-link";
import { PublicMobileMenu } from "./public-mobile-menu";
import { navLinkClasses } from "./nav-link-styles";

/**
 * Public header (29/10/2026): a glass pill floating away from the edges of the page, outlined by a
 * slowly turning Sapin → Lime gradient. Logo, « Solutions » (the four audiences), the catalogs and
 * pricing, the language switch with its flags and the main action in Lime: « Rejoindre la liste
 * d'attente » while sign-up is closed (src/lib/signup.ts), « Se connecter » and « Créer un compte »
 * once it opens. On phones and tablets: logo, the action and the round menu button
 * (PublicMobileMenu), whose three lines turn into a back arrow.
 */
export async function PublicHeader() {
  const t = await getTranslations("nav");
  const pages = [...publicNavigation, { key: "about", href: "/a-propos" } as const];
  const groups = [
    { key: "solutions", links: solutionsNavigation },
    { key: "discover", links: pages },
  ] as const;
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="jm-glass-pill jm-glass-edge mx-auto flex h-[60px] max-w-[1200px] items-center gap-2 pr-2 pl-4 lg:h-[68px] lg:pl-6">
        <Link href="/" aria-label={t("logo.label")} className="jm-logo-hover shrink-0">
          <span className="xl:hidden">
            <Logo variant="negative" height={24} />
          </span>
          <span className="hidden xl:block">
            <Logo variant="negative" height={28} />
          </span>
        </Link>
        <nav aria-label={t("menu.label")} className="hidden flex-1 justify-center xl:flex">
          <ul className="flex items-center gap-0.5">
            <li className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className="jm-top-link flex h-10 items-center gap-1.5 rounded-pill px-4 text-[15px] font-medium"
              >
                {t("group.solutions")}
                <Icon
                  name="chev-d"
                  className="size-4 transition-transform group-focus-within:rotate-180 group-hover:rotate-180"
                />
              </button>
              {/* Opens on hover and on keyboard focus: no script needed. */}
              <div className="invisible absolute top-full left-0 translate-y-1 pt-3 opacity-0 transition-all duration-300 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <ul className="jm-light jm-menu-sheet grid w-[620px] grid-cols-2 gap-1 rounded-[28px] p-3">
                  {solutionsNavigation.map((link) => (
                    <li key={link.key}>
                      <MenuEntry
                        href={link.href}
                        art={link.key}
                        title={t(link.key)}
                        text={t(`desc.${link.key}`)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </li>
            {/* The current page is known at request time only: prerendered pages show the plain list. */}
            <Suspense
              fallback={pages.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className={cx(navLinkClasses("public", false), "jm-top-link")}
                  >
                    <span>{t(link.key)}</span>
                  </Link>
                </li>
              ))}
            >
              {pages.map((link) => (
                <li key={link.key} className="jm-top-link">
                  <NavLink href={link.href} label={t(link.key)} placement="public" />
                </li>
              ))}
            </Suspense>
          </ul>
        </nav>
        <div className="flex-1 xl:hidden" />
        <LanguageSwitch idPrefix="haut" className="max-sm:hidden" />
        {signupOpen ? (
          <>
            <Link
              href="/connexion"
              className="hidden h-11 items-center rounded-pill px-5 text-[15px] font-semibold ring-1 ring-sapin/25 ring-inset hover:ring-sapin/50 xl:flex"
            >
              {t("login")}
            </Link>
            <SiteButton
              href="/inscription"
              tone="lime"
              size="md"
              className="jm-cta-glow max-sm:hidden"
            >
              {t("signup")}
            </SiteButton>
          </>
        ) : (
          <SiteButton
            href="/liste-attente"
            tone="lime"
            size="md"
            className="jm-cta-glow h-10 px-4 max-[379px]:hidden lg:h-11 lg:px-5"
          >
            <span className="lg:hidden">{t("waitlistShort")}</span>
            <span className="max-lg:hidden">{t("waitlist")}</span>
          </SiteButton>
        )}
        <PublicMobileMenu
          openLabel={t("menu.open")}
          closeLabel={t("menu.close")}
          menuLabel={t("menu.label")}
        >
          {groups.map((group, index) => (
            <Fragment key={group.key}>
              <p
                className={cx(
                  "jm-menu-item px-3 pb-1 text-[12px] font-semibold tracking-[0.08em] text-ardoise uppercase",
                  index === 0 ? "pt-1" : "mt-2 border-t border-sapin/10 pt-4",
                )}
              >
                {t(`group.${group.key}`)}
              </p>
              {group.links.map((link) => (
                <MenuEntry
                  key={link.key}
                  href={link.href}
                  art={link.key}
                  title={t(link.key)}
                  text={t(`desc.${link.key}`)}
                  className="jm-menu-item"
                />
              ))}
            </Fragment>
          ))}
          <div className="jm-menu-item mt-2 flex flex-col gap-2.5 border-t border-sapin/10 pt-3.5">
            <LanguageSwitch idPrefix="menu" className="self-start" />
            {signupOpen ? (
              <>
                <SiteButton href="/inscription" tone="lime" size="md" fullWidth>
                  {t("signup")}
                </SiteButton>
                <SiteButton href="/connexion" tone="light" size="md" fullWidth>
                  {t("login")}
                </SiteButton>
              </>
            ) : (
              <SiteButton
                href="/liste-attente"
                tone="lime"
                size="md"
                className="jm-cta-glow w-full"
              >
                {t("waitlist")}
              </SiteButton>
            )}
          </div>
        </PublicMobileMenu>
      </div>
    </header>
  );
}

/** An entry of the menus: the colored drawing, the title and one line on what the page offers. */
function MenuEntry({
  href,
  art,
  title,
  text,
  className,
}: {
  href: string;
  art: Parameters<typeof MenuArt>[0]["name"];
  title: string;
  text: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "jm-menu-entry group/entry flex items-start gap-3.5 rounded-[20px] p-2.5 transition-colors hover:bg-[#f2ede5]",
        className,
      )}
    >
      <MenuArt name={art} />
      <span className="flex min-w-0 flex-col gap-0.5 pt-0.5">
        <span className="text-[16px] leading-6 font-semibold text-sapin">{title}</span>
        <span className="text-[14px] leading-5 text-ardoise">{text}</span>
      </span>
    </Link>
  );
}

/**
 * « FR | EN » with the small flags of France and the United Kingdom: each language is a link to
 * /langue, which keeps the choice and comes back to the page being read (no JavaScript).
 */
export async function LanguageSwitch({
  dark = false,
  idPrefix = "pied",
  className,
}: {
  dark?: boolean;
  /** Keeps the flags' SVG ids unique when the switch shows twice on a page. */
  idPrefix?: string;
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
        "flex items-center gap-0.5 rounded-pill p-1",
        dark
          ? "bg-blanc/10 ring-1 ring-blanc/15 ring-inset"
          : "bg-[rgb(255_255_255/0.04)] ring-1 ring-sapin/12 ring-inset",
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
              "jm-flag-link flex h-9 items-center justify-center gap-1.5 rounded-pill pr-3 pl-1.5 text-[13px] font-semibold transition-all",
              active
                ? "bg-lime text-[#0f3f37] shadow-[0_0_16px_rgb(166_242_107/0.45)]"
                : dark
                  ? "text-blanc/80 hover:bg-blanc/10 hover:text-blanc"
                  : "text-ardoise hover:bg-[rgb(255_255_255/0.07)] hover:text-sapin",
            )}
          >
            <Flag code={language.code} id={`${idPrefix}-${language.code}`} />
            {language.short}
          </a>
        );
      })}
    </nav>
  );
}

/** A round flag, drawn inline (flag emojis do not show on Windows). */
function Flag({ code, id }: { code: "fr" | "en"; id: string }) {
  return (
    <svg
      aria-hidden
      viewBox={code === "fr" ? "0 0 3 2" : "0 0 60 30"}
      preserveAspectRatio="xMidYMid slice"
      className="jm-flag size-[22px] shrink-0 rounded-full ring-1 ring-black/15"
    >
      {code === "fr" ? (
        <>
          <rect width="1" height="2" fill="#002654" />
          <rect x="1" width="1" height="2" fill="#FFFFFF" />
          <rect x="2" width="1" height="2" fill="#CE1126" />
        </>
      ) : (
        <>
          <clipPath id={`${id}-t`}>
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
          </clipPath>
          <rect width="60" height="30" fill="#012169" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
          <path
            d="M0,0 L60,30 M60,0 L0,30"
            clipPath={`url(#${id}-t)`}
            stroke="#C8102E"
            strokeWidth="4"
          />
          <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
          <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
        </>
      )}
    </svg>
  );
}
