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
import { careerTabs } from "@/components/career/kit";
import type { Section } from "@/config/section-navigation";
import { dynamic } from "@/i18n/dynamic";
import { AppMotionRoot } from "@/components/motion/app-motion-root";
import { UniverseBackdrop } from "@/components/motion/universe-header";
import { AccountMenu, type AccountSummary } from "./account-menu";
import { IconRail } from "./icon-rail";
import { NavLink } from "./nav-link";
import { SectionNav } from "./section-nav";
import { TopSearch } from "./top-search";
import { SpaceSwitcher, type SpaceOption } from "./space-switcher";
import { OFFLINE_SLOT_ID } from "@/lib/connection";

/**
 * Signed-in space layout (Admin v4, étape 2: same shell as Jumanly Admin, for every plan; a plan
 * only changes which tools open, through the rights).
 * Desktop: the floating gradient column of icons on the left (settings and sign out below), and
 * on top of the page a light bar: the sub-sections of the current section on the left, the space
 * switcher, notifications and the account on the right.
 * Mobile: deep green header, Crème sheet with the sub-sections on top, floating gradient pill.
 */
export function AppShell({
  account,
  space,
  spaces,
  unread,
  reduceMotion = false,
  intro,
  lockedCareer = [],
  children,
}: {
  account: AccountSummary;
  /** Career tools the plan keeps locked: a padlock in the Career menu. */
  lockedCareer?: readonly string[];
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
  const tc = useTranslations("career");
  const navigation = space?.partner ? partnerNavigation : space ? hireNavigation : talentNavigation;
  const home = space?.partner ? "/app/partenaire" : space ? "/app/hire" : "/app";
  const pillLinks = navigation
    .filter((item) => item.pill !== false)
    .map(({ key, href, icon }) => (
      <li key={key}>
        <NavLink href={href} label={t(key)} icon={<Icon name={icon} />} placement="pill" />
      </li>
    ));

  const sections = appSections({
    t,
    career: (key) => (key === "home" ? tc("nav.home") : dynamic(tc)(`home.${key}.title`)),
    lockedCareer,
    lockedLabel: tc("nav.locked"),
  });

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
      className="jm-admin-bg min-h-dvh text-sapin lg:flex"
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

      <IconRail
        home={home}
        homeLabel={a11y("logo")}
        homeTip={t("brand.text")}
        label={a11y("mainNav")}
        groups={[{ items: navigation.map((item) => ({ ...item, label: t(item.key) })) }]}
        footer={
          <>
            <NavLink
              href="/app/parametres"
              label={t("settings")}
              icon={<Icon name="reglages" />}
              placement="rail"
            />
            <AccountMenu account={account} tone="rail" />
          </>
        }
      />

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

      <div className="relative isolate min-h-[calc(100dvh-4rem)] min-w-0 rounded-t-[28px] bg-creme lg:min-h-0 lg:flex-1 lg:rounded-none lg:bg-transparent">
        <UniverseBackdrop />
        {/* The secondary menu, above the page: sub-sections left, tools right. */}
        <div className="jm-topbar sticky top-0 z-30 flex items-center gap-3 px-4 pt-3 sm:px-6 lg:h-[68px] lg:gap-5 lg:px-6 lg:pt-0 xl:px-8">
          <SectionNav sections={sections} className="min-w-0 flex-1" />
          <div className="ml-auto hidden min-w-0 shrink items-center justify-end gap-3 lg:flex lg:w-[min(42%,560px)]">
            <TopSearch
              id="app-search"
              action="/app/recherche"
              label={t("search.aria")}
              placeholder={t("search.placeholder")}
              shortcut={t("search.shortcut")}
            />
            <SpaceSwitcher current={space} spaces={spaces} tone="light" />
            {notifications("light")}
          </div>
        </div>
        <main
          id="content"
          className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 pt-4 pb-32 sm:px-6 lg:px-6 lg:pt-2 lg:pb-8 xl:px-8"
        >
          <div id={OFFLINE_SLOT_ID} role="status" className="empty:-mb-5" />
          {children}
        </main>
      </div>

      <nav
        aria-label={t("mobile.aria")}
        data-autohide
        className="fixed bottom-[max(26px,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 rounded-pill bg-sapin bg-(image:--jm-degrade-rail-h) p-[7px] shadow-float lg:hidden"
      >
        <ul data-nav-slide="pill" className="flex gap-1">
          {pillLinks}
        </ul>
      </nav>
    </div>
  );
}

/** Sub-sections of each section of the signed-in space (the secondary horizontal menu). */
function appSections({
  t,
  career,
  lockedCareer,
  lockedLabel,
}: {
  t: ReturnType<typeof useTranslations<"appNav">>;
  career: (key: (typeof careerTabs)[number]["key"]) => string;
  lockedCareer: readonly string[];
  lockedLabel: string;
}): Section[] {
  const section = (name: string, match: string[], links: [string, string][]): Section => ({
    match,
    label: t("section.aria", { section: name }),
    links: links.map(([href, label]) => ({ href, label })),
  });
  return [
    section(
      t("section.account"),
      ["/app", "/app/profil", "/app/notifications", "/app/abonnement", "/app/parametres"],
      [
        ["/app", t("section.dashboard")],
        ["/app/profil", t("section.profile")],
        ["/app/notifications", t("notifications")],
        ["/app/abonnement", t("section.subscription")],
        ["/app/parametres", t("settings")],
      ],
    ),
    section(
      t("learn"),
      ["/app/learn"],
      [
        ["/app/learn", t("section.catalog")],
        ["/app/learn/attestations", t("section.certificates")],
      ],
    ),
    {
      ...section(t("career"), ["/app/career"], []),
      links: careerTabs.map((tab) => ({
        href: tab.href,
        label: career(tab.key),
        locked: lockedCareer.includes(tab.key),
      })),
      lockedLabel,
    },
    section(
      t("jobs"),
      ["/app/jobs"],
      [
        ["/app/jobs", t("section.offers")],
        ["/app/jobs/candidatures", t("section.applications")],
        ["/app/jobs/enregistrees", t("section.saved")],
      ],
    ),
    section(
      t("hire.text"),
      ["/app/hire", "/app/organisation"],
      [
        ["/app/hire", t("section.dashboard")],
        ...hireNavigation
          .filter((item) => item.key !== "home" && item.key !== "hire.messages")
          .map((item): [string, string] => [item.href, t(item.key)]),
      ],
    ),
    section(
      t("partner"),
      ["/app/partenaire"],
      partnerNavigation.map((item): [string, string] => [
        item.href,
        item.key === "home" ? t("section.dashboard") : t(item.key),
      ]),
    ),
  ];
}
