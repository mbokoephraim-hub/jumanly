import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { hireNavigation, talentNavigation } from "@/config/navigation";
import { Logo, Icon } from "@/components/brand";
import { AccountMenu, type AccountSummary } from "./account-menu";
import { NavLink } from "./nav-link";
import { SpaceSwitcher, type SpaceOption } from "./space-switcher";

/**
 * Signed-in space layout (§ 11.4).
 * Desktop: 92 px Sapin sidebar, Crème main panel with 32 px corners.
 * Mobile: Sapin header, Crème sheet rising over it, floating pill navigation.
 */
export function AppShell({
  account,
  space,
  spaces,
  unread,
  children,
}: {
  account: AccountSummary;
  /** Active organization space, or null for the personal space. */
  space: SpaceOption | null;
  spaces: SpaceOption[];
  unread: number;
  children: ReactNode;
}) {
  const t = useTranslations("appNav");
  const a11y = useTranslations("a11y");
  const tn = useTranslations("notifications");
  const navigation = space ? hireNavigation : talentNavigation;
  const home = space ? "/app/hire" : "/app";
  const links = (placement: "sidebar" | "pill") =>
    navigation.map(({ key, href, icon }) => (
      <li key={key} className={placement === "pill" ? "flex flex-1" : undefined}>
        <NavLink
          href={href}
          label={t(key)}
          icon={<Icon name={icon} className="size-6" />}
          placement={placement}
        />
      </li>
    ));

  const notifications = (
    <Link
      href="/app/notifications"
      aria-label={tn("bell.aria", { count: unread })}
      className="relative flex size-11 items-center justify-center rounded-full hover:bg-sapin/10"
    >
      <Icon name="notification" className="size-5" />
      {unread > 0 && (
        <span
          aria-hidden
          className="absolute top-1.5 right-1.5 flex min-w-5 items-center justify-center rounded-full bg-lime px-1 text-xs font-semibold text-sapin"
        >
          {unread > 9 ? tn("bell.many") : unread}
        </span>
      )}
    </Link>
  );

  return (
    <div className="min-h-dvh bg-sapin lg:flex">
      <a
        href="#content"
        className="sr-only z-50 rounded-pill bg-lime px-4 py-2 text-sapin focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("skipToContent")}
      </a>

      <aside className="sticky top-0 hidden h-dvh w-[92px] shrink-0 flex-col items-center gap-8 py-6 lg:flex">
        <Link href={home} aria-label={a11y("logo")}>
          <Logo variant="symbolLight" height={40} />
        </Link>
        <nav aria-label={a11y("mainNav")}>
          <ul className="flex flex-col gap-2">{links("sidebar")}</ul>
        </nav>
      </aside>

      <header className="flex h-16 items-center justify-between gap-4 px-4 text-blanc lg:hidden">
        <Link href={home} aria-label={a11y("logo")}>
          <Logo variant="negative" height={26} />
        </Link>
        <div className="flex items-center gap-1 [&>a]:hover:bg-blanc/10">
          <SpaceSwitcher current={space} spaces={spaces} tone="dark" />
          {notifications}
          <AccountMenu account={account} tone="dark" />
        </div>
      </header>

      <div className="min-h-[calc(100dvh-4rem)] rounded-t-panel bg-creme lg:my-3 lg:mr-3 lg:min-h-0 lg:flex-1 lg:rounded-panel">
        <div className="hidden h-18 items-center justify-end gap-2 page-x lg:flex">
          <SpaceSwitcher current={space} spaces={spaces} tone="light" />
          {notifications}
          <AccountMenu account={account} tone="light" />
        </div>
        <main id="content" className="mx-auto max-w-6xl page-x pt-6 pb-32 lg:pt-0 lg:pb-12">
          {children}
        </main>
      </div>

      <nav
        aria-label={t("mobile.aria")}
        className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-20 rounded-pill bg-sapin p-1.5 lg:hidden"
      >
        <ul className="flex gap-1">{links("pill")}</ul>
      </nav>
    </div>
  );
}
