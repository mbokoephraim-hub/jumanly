import { Suspense } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { NotificationBell, type BellLabels } from "@/components/app/notification-bell";
import { Toaster } from "@/components/motion/toaster";
import { AppIntroGate } from "@/components/app/app-intro-gate";
import type { IntroData } from "@/components/app/app-intro";
import { hireNavigation, partnerNavigation, talentNavigation } from "@/config/navigation";
import { Logo, Icon } from "@/components/brand";
import { AppMotionRoot } from "@/components/motion/app-motion-root";
import { UniverseBackdrop } from "@/components/motion/universe-header";
import { signOut } from "@/server/actions/auth";
import { AccountMenu, type AccountSummary } from "./account-menu";
import { NavLink } from "./nav-link";
import { SpaceSwitcher, type SpaceOption } from "./space-switcher";
import { OFFLINE_SLOT_ID } from "@/lib/connection";

/**
 * Signed-in space layout (mockup 00-04).
 * Desktop: 92 px Sapin sidebar (settings and logout at the bottom), Crème main panel with
 * 32 px corners, top bar with the space switcher, notifications and the account pill.
 * Mobile: Sapin header, Crème sheet rising over it, floating pill navigation.
 * Motion (docs/experience-animee, lot A): torch over the sidebar, active item that slides, pattern
 * of the module behind the top of the page; all off with « Réduire les animations ».
 */
export function AppShell({
  account,
  space,
  spaces,
  unread,
  reduceMotion = false,
  intro,
  children,
}: {
  account: AccountSummary;
  /** Active organization space, or null for the personal space. */
  space: (SpaceOption & { partner?: boolean }) | null;
  spaces: SpaceOption[];
  unread: number;
  /** « Réduire les animations » (settings): no motion at all in the signed-in space. */
  reduceMotion?: boolean;
  /** Welcome intro played after a sign-in (`?arrivee=1`), docs/refonte-connexion § 7. */
  intro?: IntroData;
  children: ReactNode;
}) {
  const t = useTranslations("appNav");
  const a11y = useTranslations("a11y");
  const tn = useTranslations("notifications");
  const tt = useTranslations("toast");
  const navigation = space?.partner ? partnerNavigation : space ? hireNavigation : talentNavigation;
  const home = space?.partner ? "/app/partenaire" : space ? "/app/hire" : "/app";
  const links = (placement: "sidebar" | "pill") =>
    navigation
      .filter((item) => placement === "sidebar" || item.pill !== false)
      .map(({ key, href, icon }) => (
        <li key={key}>
          <NavLink href={href} label={t(key)} icon={<Icon name={icon} />} placement={placement} />
        </li>
      ));

  const bellLabels: BellLabels = {
    aria: {
      zero: tn("bell.aria", { count: 0 }),
      one: tn("bell.aria", { count: 1 }),
      other: tn("bell.aria", { count: 2 }).replace("2", "#"),
    },
    many: tn("bell.many"),
    title: tn("panel.title"),
    seeAll: tn("panel.seeAll"),
    markAllRead: tn("markAllRead"),
    close: tn("panel.close"),
    empty: tn("empty.text"),
  };
  const notifications = (tone: "light" | "dark") => (
    <NotificationBell initialUnread={unread} tone={tone} labels={bellLabels} />
  );

  return (
    <div
      data-reduce-motion={reduceMotion ? "" : undefined}
      className="min-h-dvh bg-sapin lg:flex lg:py-3.5 lg:pr-3.5"
    >
      <AppMotionRoot reduce={reduceMotion} />
      <Toaster label={tt("region.aria")} closeLabel={tt("close")} />
      {intro && (
        <Suspense fallback={null}>
          <AppIntroGate data={intro} reduce={reduceMotion} />
        </Suspense>
      )}
      <a
        href="#content"
        className="sr-only z-50 rounded-pill bg-lime px-4 py-2 text-sapin focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("skipToContent")}
      </a>

      <aside
        data-torch
        className="sticky top-3.5 isolate hidden h-[calc(100dvh-28px)] w-[92px] shrink-0 flex-col items-center pt-3 pb-1.5 lg:flex"
      >
        <span aria-hidden className="jm-torch jm-torch-pattern absolute inset-0 -z-10" />
        <span aria-hidden className="jm-torch jm-torch-halo absolute inset-0 -z-10" />
        <Link href={home} aria-label={a11y("logo")} className="rounded-sm">
          <Logo variant="tile" height={44} />
        </Link>
        <nav aria-label={a11y("mainNav")} className="mt-[34px]">
          <ul data-nav-slide="sidebar" className="flex flex-col gap-1.5">
            {links("sidebar")}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col gap-1.5">
          <NavLink
            href="/app/parametres"
            label={t("settings")}
            icon={<Icon name="reglages" />}
            placement="sidebar"
          />
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-16 flex-col items-center gap-[5px] rounded-[18px] pt-[9px] pb-[7px] text-center text-[10px] leading-3 font-medium text-blanc/65 hover:bg-blanc/10 hover:text-blanc"
            >
              <Icon name="logout" className="size-[22px]" />
              {t("logout")}
            </button>
          </form>
        </div>
      </aside>

      <header className="flex h-16 items-center justify-between gap-3 px-4 text-blanc lg:hidden">
        <Link href={home} aria-label={a11y("logo")} className="shrink-0">
          <Logo variant="negative" height={26} />
        </Link>
        <div className="flex min-w-0 items-center gap-1">
          <SpaceSwitcher current={space} spaces={spaces} tone="dark" />
          {notifications("dark")}
          <AccountMenu account={account} tone="dark" />
        </div>
      </header>

      <div className="relative isolate min-h-[calc(100dvh-4rem)] min-w-0 rounded-t-[28px] bg-creme lg:min-h-0 lg:flex-1 lg:rounded-panel">
        <UniverseBackdrop />
        <div className="relative hidden h-[78px] items-center justify-end gap-3.5 px-[30px] pt-[26px] lg:flex">
          <SpaceSwitcher current={space} spaces={spaces} tone="light" />
          {notifications("light")}
          <AccountMenu account={account} tone="light" />
        </div>
        <main
          id="content"
          className="relative flex w-full flex-col gap-5 px-4 pt-5 pb-32 sm:px-6 lg:px-[30px] lg:pt-5 lg:pb-[30px]"
        >
          <div id={OFFLINE_SLOT_ID} role="status" className="empty:-mb-5" />
          {children}
        </main>
      </div>

      <nav
        aria-label={t("mobile.aria")}
        data-autohide
        className="fixed bottom-[max(26px,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 rounded-pill bg-sapin p-[7px] shadow-float lg:hidden"
      >
        <ul data-nav-slide="pill" className="flex gap-1">
          {links("pill")}
        </ul>
      </nav>
    </div>
  );
}
