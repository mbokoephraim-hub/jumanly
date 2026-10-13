import Link from "next/link";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { publicNavigation } from "@/config/navigation";
import { ButtonLink, Logo } from "@/components/ui";

export function PublicHeader() {
  const t = useTranslations("nav");
  return (
    <header className="sticky top-0 z-30 border-b border-brume/70 bg-creme/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label={t("logo.label")}>
          <Logo height={30} />
        </Link>
        <nav aria-label={t("menu.label")} className="hidden md:block">
          <ul className="flex items-center gap-7 text-[15px] font-medium">
            {publicNavigation.map((link) => (
              <li key={link.key}>
                <Link href={link.href} className="text-sapin/80 hover:text-sapin">
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ButtonLink href="/connexion" variant="ghost" size="sm">
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
          <div className="absolute right-0 mt-2 flex w-64 flex-col gap-1 rounded-md bg-blanc p-3 shadow-card">
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
              <ButtonLink href="/connexion" variant="outline" fullWidth>
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
