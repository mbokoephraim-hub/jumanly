import type { ReactNode } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { talentNavigation } from "@/config/navigation";
import { Avatar, Logo } from "@/components/ui";
import { NavLink } from "./nav-link";

/**
 * Signed-in space layout.
 * Desktop: Sapin sidebar. Mobile: compact header and bottom navigation bar.
 */
export function AppShell({ userName, children }: { userName: string; children: ReactNode }) {
  const t = useTranslations("appNav");
  const a11y = useTranslations("a11y");
  const links = (placement: "sidebar" | "bottom-bar") =>
    talentNavigation.map(({ key, href, icon: Icon }) => (
      <li key={key} className={placement === "bottom-bar" ? "flex flex-1" : undefined}>
        <NavLink
          href={href}
          label={t(key)}
          icon={<Icon aria-hidden className="size-5" strokeWidth={2} />}
          placement={placement}
        />
      </li>
    ));

  return (
    <div className="min-h-dvh bg-creme lg:pl-64">
      <a
        href="#content"
        className="sr-only z-50 rounded-pill bg-lime px-4 py-2 text-sapin focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("skipToContent")}
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-8 bg-sapin px-4 py-6 lg:flex">
        <Link href="/app" className="px-3" aria-label={a11y("logo")}>
          <Logo variant="negative" height={28} />
        </Link>
        <nav aria-label={a11y("mainNav")}>
          <ul className="flex flex-col gap-1">{links("sidebar")}</ul>
        </nav>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-brume/70 bg-creme/90 px-4 backdrop-blur sm:px-6 lg:justify-end lg:px-10">
        <Link href="/app" className="lg:hidden" aria-label={a11y("logo")}>
          <Logo variant="symbol" height={34} />
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t("notifications")}
            className="flex size-11 items-center justify-center rounded-full text-sapin hover:bg-sapin/8"
          >
            <Bell aria-hidden className="size-5" />
          </button>
          <Avatar name={userName} size="sm" />
        </div>
      </header>

      <main id="content" className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pb-12">
        {children}
      </main>

      <nav
        aria-label={a11y("mainNav")}
        className="fixed inset-x-0 bottom-0 z-20 h-18 border-t border-brume bg-blanc pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="flex h-full">{links("bottom-bar")}</ul>
      </nav>
    </div>
  );
}
