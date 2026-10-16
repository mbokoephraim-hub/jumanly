import { Suspense } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { NotificationBell, type BellLabels } from "@/components/app/notification-bell";
import { Toaster } from "@/components/motion/toaster";
import { AppIntroGate } from "@/components/app/app-intro-gate";
import type { IntroData } from "@/components/app/app-intro";
import { hireNavigation, partnerNavigation, talentNavigation } from "@/config/navigation";
import { Logo, Icon, type IconName } from "@/components/brand";
import { careerTabs } from "@/components/career/kit";
import type { Section } from "@/config/section-navigation";
import { dynamic } from "@/i18n/dynamic";
import { AppMotionRoot } from "@/components/motion/app-motion-root";
import { AccountMenu, type AccountSummary } from "./account-menu";
import { IconRail } from "./icon-rail";
import { NavLink } from "./nav-link";
import { SectionNav } from "./section-nav";
import { TopSearch } from "./top-search";
import { SpaceSwitcher, type SpaceOption } from "./space-switcher";
import { OFFLINE_SLOT_ID } from "@/lib/connection";
import { cx } from "@/lib/cx";

/**
 * Signed-in space layout (Admin v4, étape 2: same shell as Jumanly Admin, for every plan; a plan
 * only changes which tools open, through the rights).
 * Desktop: the floating gradient column of icons on the left (settings and sign out below), and
 * on top of the page a light bar: the sub-sections of the current section on the left, the space
 * switcher, notifications and the account on the right.
 * Tablet (from 768 px): the same column and bar, the search behind an icon.
 * Phone: deep green header (search icon), Crème sheet with the sub-sections on top, floating
 * gradient pill.
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
  // Phone and tablet: the search opens on its own page (with its field) from an icon.
  const searchLink = (tone: "light" | "dark") => (
    <Link
      href="/app/recherche"
      aria-label={t("search.aria")}
      className={
        tone === "dark"
          ? "grid size-10 shrink-0 place-items-center rounded-full text-blanc hover:bg-blanc/10"
          : "grid size-10 shrink-0 place-items-center rounded-full bg-blanc text-sapin ring-1 ring-sapin/10 hover:bg-creme"
      }
    >
      <Icon name="recherche" className="size-5" />
    </Link>
  );
  const notifications = (tone: "light" | "dark") => (
    <NotificationBell initialUnread={unread} tone={tone} labels={bellLabels} />
  );

  return (
    <div
      data-reduce-motion={reduceMotion ? "" : undefined}
      className="jm-admin-bg min-h-dvh text-sapin md:flex"
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

      <header className="flex h-16 items-center justify-between gap-3 px-4 text-blanc md:hidden">
        <Link href={home} aria-label={a11y("logo")} className="shrink-0">
          <Logo variant="negative" height={26} />
        </Link>
        <div className="flex min-w-0 items-center gap-1">
          {searchLink("dark")}
          <SpaceSwitcher current={space} spaces={spaces} tone="dark" />
          {notifications("dark")}
          <AccountMenu account={account} tone="dark" />
        </div>
      </header>

      <div className="relative isolate min-h-[calc(100dvh-4rem)] min-w-0 rounded-t-[28px] bg-creme md:min-h-0 md:flex-1 md:rounded-none md:bg-transparent">
        {/* The secondary menu, above the page: sub-sections left, tools right. */}
        <div className="jm-topbar sticky top-0 z-30 flex items-center gap-3 px-4 pt-3 sm:px-6 md:h-[68px] md:pt-0 lg:gap-5 lg:px-6 xl:px-[max(2rem,calc((100%-1400px)/2+2rem))]">
          <SectionNav sections={sections} className="min-w-0 flex-1" />
          <div className="ml-auto hidden min-w-0 shrink-0 items-center justify-end gap-3 md:flex lg:w-[min(36%,460px)] lg:shrink 2xl:w-[min(42%,560px)]">
            {/* With an organization switcher, the wide search needs a wide screen: an icon below. */}
            <div
              className={cx(
                "hidden min-w-[220px] flex-1 justify-end",
                space ? "2xl:flex" : "lg:flex",
              )}
            >
              <TopSearch
                id="app-search"
                action="/app/recherche"
                label={t("search.aria")}
                placeholder={t("search.placeholder")}
                shortcut={t("search.shortcut")}
              />
            </div>
            <span className={space ? "2xl:hidden" : "lg:hidden"}>{searchLink("light")}</span>
            <SpaceSwitcher current={space} spaces={spaces} tone="light" />
            {notifications("light")}
          </div>
        </div>
        <main
          id="content"
          className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 pt-4 pb-32 sm:px-6 md:pt-2 md:pb-8 lg:px-6 xl:px-8"
        >
          <div id={OFFLINE_SLOT_ID} role="status" className="empty:-mb-5" />
          {children}
        </main>
      </div>

      <nav
        aria-label={t("mobile.aria")}
        data-autohide
        className="fixed bottom-[max(26px,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 rounded-pill bg-sapin bg-(image:--jm-degrade-rail-h) p-[7px] shadow-float md:hidden"
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
  const section = (
    name: string,
    match: string[],
    links: [string, string, IconName][],
  ): Section => ({
    match,
    label: t("section.aria", { section: name }),
    links: links.map(([href, label, icon]) => ({ href, label, icon })),
  });
  return [
    section(
      t("section.account"),
      ["/app", "/app/profil", "/app/notifications", "/app/abonnement", "/app/parametres"],
      [
        ["/app", t("section.dashboard"), "accueil"],
        ["/app/profil", t("section.profile"), "profil"],
        ["/app/notifications", t("notifications"), "notification"],
        ["/app/abonnement", t("section.subscription"), "portefeuille"],
        ["/app/parametres", t("settings"), "reglages"],
      ],
    ),
    section(
      t("learn"),
      ["/app/learn"],
      [
        ["/app/learn", t("section.learnHome"), "accueil"],
        ["/app/learn/explorer", t("section.catalog"), "recherche"],
        ["/app/learn/parcours", t("section.learnPaths"), "learn"],
        ["/app/learn/evaluations", t("section.learnEvaluations"), "quiz"],
        ["/app/learn/coach", t("section.learnCoach"), "intelligence"],
        ["/app/learn/attestations", t("section.certificates"), "certificat"],
      ],
    ),
    {
      ...section(t("career"), ["/app/career"], []),
      links: careerTabs.map((tab) => ({
        href: tab.href,
        label: career(tab.key),
        icon: tab.icon,
        locked: lockedCareer.includes(tab.key),
      })),
      lockedLabel,
    },
    section(
      t("jobs"),
      ["/app/jobs"],
      [
        ["/app/jobs", t("section.offers"), "recherche"],
        ["/app/jobs/candidatures", t("section.applications"), "send"],
        ["/app/jobs/enregistrees", t("section.saved"), "favori"],
      ],
    ),
    section(
      t("hire.text"),
      ["/app/hire", "/app/organisation"],
      [
        ["/app/hire", t("section.dashboard"), "accueil"],
        ...hireNavigation
          .filter((item) => item.key !== "home" && item.key !== "hire.messages")
          .map((item): [string, string, IconName] => [item.href, t(item.key), item.icon]),
      ],
    ),
    section(
      t("partner"),
      ["/app/partenaire"],
      partnerNavigation.map((item): [string, string, IconName] => [
        item.href,
        item.key === "home" ? t("section.dashboard") : t(item.key),
        item.icon,
      ]),
    ),
  ];
}
