import Link from "next/link";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { publicNavigation } from "@/config/navigation";
import { Logo } from "@/components/brand";
import { ButtonLink } from "@/components/ui";

/** Light public header (§ 11.4): "Se connecter" tertiary, "Créer un compte" primary. */
export function PublicHeader() {
  const t = useTranslations("nav");
  return (
    <header className="sticky top-0 z-30 border-b border-brume/70 bg-creme/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 page-x">
        <Link href="/" aria-label={t("logo.label")}>
          <Logo height={30} />
        </Link>
        <nav aria-label={t("menu.label")} className="hidden md:block">
          <ul className="flex items-center gap-7 text-[15px] font-medium">
            {publicNavigation.map((link) => (
              <li key={link.key}>
                <Link href={link.href} className="hover:underline">
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ButtonLink href="/connexion" variant="tertiary" size="sm">
            {t("login")}
          </ButtonLink>
          <ButtonLink href="/inscription" size="sm">
            {t("signup")}
          </ButtonLink>
        </div>
        {/* Mobile menu without JavaScript: native <details>. */}
        <details className="relative md:hidden">
          <summary
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full hover:bg-sapin/8"
            aria-label={t("menu.open")}
          >
            <Menu aria-hidden className="size-6" />
          </summary>
          <div className="absolute right-0 mt-2 flex w-64 flex-col gap-1 rounded-md border border-brume bg-blanc p-3">
            {publicNavigation.map((link) => (
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
          </div>
        </details>
      </div>
    </header>
  );
}
