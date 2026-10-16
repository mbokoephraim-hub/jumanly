import { Suspense } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { NotificationBell, type BellLabels } from "@/components/app/notification-bell";
import { Toaster } from "@/components/motion/toaster";
import { AppIntroGate } from "@/components/app/app-intro-gate";
import type { IntroData } from "@/components/app/app-intro";
import {
  hireNavigation,
  partnerNavigation,
  talentMenu,
  talentNavigation,
} from "@/config/navigation";
import { Logo, Icon, type IconName } from "@/components/brand";
import { careerTabs } from "@/components/career/kit";
import type { Section } from "@/config/section-navigation";
import { dynamic } from "@/i18n/dynamic";
import { AppMotionRoot } from "@/components/motion/app-motion-root";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/server/actions/auth";
import { AccountMenu, type AccountSummary } from "./account-menu";
import { IconRail } from "./icon-rail";
import { NavLink } from "./nav-link";
import { SectionNav } from "./section-nav";
import { TopSearch } from "./top-search";
import { SpaceSwitcher, type SpaceOption } from "./space-switcher";
import { TabBar } from "./tab-bar";
import { TopMenu } from "./top-menu";
import { TopTitle } from "./top-title";
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
 * Talent space (docs/ux-mobile-talent, prompt 2): on a phone, a 52 px top bar (logo or title of
 * the section, search, notifications, the avatar and its menu) and a bottom bar of four
 * destinations; on a computer, the same four destinations plus Career in the column of icons.
 */
export function AppShell({
  account,
  space,
  spaces,
  unread,
  reduceMotion = false,
  intro,
  lockedCareer = [],
  followUp = 0,
  unreadMessages = 0,
  children,
}: {
  /** Talent: real number of actions to take (badge of Suivi). */
  followUp?: number;
  /** Talent: conversations with an unread message (badge of Messages in the avatar menu). */
  unreadMessages?: number;
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
  const talent = !space;
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
            <AccountMenu account={account} tone="rail" talent={talent} />
          </>
        }
      />

      {talent ? (
        <header className="flex h-[52px] items-center gap-1 pr-2 pl-[18px] text-blanc md:hidden">
          <div className="flex min-w-0 flex-1 items-center">
            <TopTitle
              logo={
                <Link href={home} aria-label={a11y("logo")} className="shrink-0">
                  <Logo variant="negative" height={24} />
                </Link>
              }
              titles={{
                "/app/jobs": t("tabs.offers"),
                "/app/learn": t("tabs.learn"),
                "/app/suivi": t("tabs.suivi"),
                "/app/career": t("title.career"),
                "/app/messages": t("title.messages"),
                "/app/notifications": t("title.notifications"),
                "/app/profil": t("title.profile"),
                "/app/abonnement": t("title.subscription"),
                "/app/parametres": t("title.settings"),
                "/app/tableau-de-bord": t("title.dashboard"),
                "/app/recherche": t("title.search"),
              }}
            />
          </div>
          {searchLink("dark")}
          {notifications("dark")}
          <TopMenu
            label={t("topMenu.label")}
            openLabel={t("topMenu.open")}
            trigger={
              <Avatar
                name={account.name}
                image={account.image ?? undefined}
                size="sm"
                className="ring-2 ring-lime/70"
              />
            }
          >
            <TalentMenu account={account} unreadMessages={unreadMessages} />
          </TopMenu>
        </header>
      ) : (
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
      )}

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

      {talent ? (
        <TabBar
          label={t("mobile.aria")}
          tabs={talentNavigation
            .filter((item) => item.pill !== false)
            .map(({ key, href, icon }) => ({ key, href, icon, label: t(key) }))}
          badge={{
            key: "tabs.suivi",
            count: followUp,
            label: t("tabs.badge", { count: followUp }),
          }}
        />
      ) : (
        <nav
          aria-label={t("mobile.aria")}
          data-autohide
          className="fixed bottom-[max(26px,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 rounded-pill bg-sapin bg-(image:--jm-degrade-rail-h) p-[7px] shadow-float md:hidden"
        >
          <ul data-nav-slide="pill" className="flex gap-1">
            {pillLinks}
          </ul>
        </nav>
      )}
    </div>
  );
}

/**
 * The card of the avatar menu (screen 34): who is signed in, the shortcuts, then « Tout Mon
 * espace » and sign out. Jumanly AI takes the first line once the assistant exists (prompt 7).
 */
function TalentMenu({
  account,
  unreadMessages,
}: {
  account: AccountSummary;
  unreadMessages: number;
}) {
  const t = useTranslations();
  return (
    <>
      <div className="flex items-center gap-3 px-2.5 pt-2 pb-3">
        <Avatar name={account.name} image={account.image ?? undefined} size="md" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-semibold">{account.name}</span>
          <span className="truncate text-[13px] text-ardoise">
            {t("account.menu.roleBadge.text", {
              space: t("account.menu.roleBadge.talent"),
              plan: account.planName,
            })}
          </span>
        </div>
      </div>
      <ul className="flex flex-col gap-0.5">
        {talentMenu.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="jm-press flex min-h-12 items-center gap-3 rounded-[16px] px-2 py-1.5 text-[15px] hover:bg-creme active:bg-lime-clair"
            >
              <span
                aria-hidden
                className={cx(
                  "grid size-9 shrink-0 place-items-center rounded-[11px] [&_svg]:size-[18px]",
                  item.tone,
                )}
              >
                <Icon name={item.icon} />
              </span>
              <span className="min-w-0 flex-1 truncate">{t(`appNav.topMenu.${item.key}`)}</span>
              {item.key === "messages" && unreadMessages > 0 && (
                <>
                  <span
                    aria-hidden
                    className="grid h-6 min-w-6 place-items-center rounded-full bg-sapin px-1.5 text-[12px] font-bold text-lime"
                  >
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                  <span className="sr-only">
                    {t("appNav.topMenu.unread", { count: unreadMessages })}
                  </span>
                </>
              )}
              <Icon name="chev-r" className="size-4 shrink-0 text-ardoise" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-1 flex items-center justify-between gap-2 border-t border-brume px-2 pt-2 pb-1">
        <Link
          href="/app/espace"
          className="flex min-h-11 items-center gap-1 text-[14px] font-semibold whitespace-nowrap text-feuille-fonce"
        >
          {t("appNav.topMenu.all")}
          <Icon name="chev-r" className="size-4" />
        </Link>
        <form action={signOut}>
          <button type="submit" className="min-h-11 px-1 text-[15px] font-semibold text-down-texte">
            {t("account.menu.logout")}
          </button>
        </form>
      </div>
    </>
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
      [
        "/app/tableau-de-bord",
        "/app/profil",
        "/app/notifications",
        "/app/abonnement",
        "/app/parametres",
      ],
      [
        ["/app/tableau-de-bord", t("section.dashboard"), "statistiques"],
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
    // Offres itself has no sub-sections any more (prompt 2): its pages below keep them.
    section(
      t("jobs"),
      ["/app/jobs/candidatures", "/app/jobs/enregistrees"],
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
