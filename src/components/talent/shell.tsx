import { Suspense, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AppIntroGate } from "@/components/app/app-intro-gate";
import type { IntroData } from "@/components/app/app-intro";
import { AppMotionRoot } from "@/components/motion/app-motion-root";
import { Toaster } from "@/components/motion/toaster";
import { initials } from "@/components/ui/avatar";
import { OFFLINE_SLOT_ID } from "@/lib/connection";
import { appearanceScript, type Appearance } from "@/lib/appearance";
import type { AbstractIntlMessages } from "next-intl";
import { AppearanceRoot } from "./appearance";
import { TalentBottomBar } from "./bottom-bar";
import { TalentHeader } from "./header";
import { OfflineDrafts } from "./offline-drafts";
import { TalentCommand } from "./web/command";
import { OrbiPanel } from "./web/orbi-panel";
import { TalentSideNav } from "./web/side-nav";
import { TalentTopBar } from "./web/top-bar";

/**
 * Talent space, one code for three widths (docs/refonte-mobile, lot 1; docs/refonte-web, W0).
 * Phone (< 768 px): the head with the big title, the page, the floating bar Pour moi · Offres ·
 * Orbi · Apprendre · Suivi. Tablet (768 to 1199 px): the 84 px rail of icons and the top bar.
 * Computer (≥ 1200 px): the 232 px sidebar and the top bar. Everywhere: `Ctrl K` (search and
 * Orbi), the Orbi panel on the right (`?orbi=1`). Light, dark or Auto (the device decides).
 */
export function TalentShell({
  account,
  unread,
  unreadMessages,
  followUp,
  appearance,
  reduceMotion,
  intro,
  menu,
  orbiTexts,
  children,
}: {
  account: { id: string; name: string; firstName: string | null; image: string | null };
  /** Unread notifications (Lime dot of the bell). */
  unread: number;
  /** Conversations with an unread message (Corail counter). */
  unreadMessages: number;
  /** Actions to take in Suivi (badge of the tab). */
  followUp: number;
  appearance: Appearance;
  /** « Réduire les animations » (settings): no motion at all. */
  reduceMotion: boolean;
  /** Welcome intro played after a sign-in (`?arrivee=1`), docs/refonte-connexion § 7. */
  intro: IntroData;
  /** Content of the avatar's menu of the web top bar (server, streamed). */
  menu: ReactNode;
  /** The `talentOrbi` texts of the conversation, for the Orbi panel. */
  orbiTexts: AbstractIntlMessages;
  children: ReactNode;
}) {
  const t = useTranslations("talentShell");
  const tt = useTranslations("toast");
  const tOrbi = useTranslations("talentOrbi");
  const tNotifs = useTranslations("notifs");
  const tNotifications = useTranslations("notifications");
  const avatar = account.image ? (
    // eslint-disable-next-line @next/next/no-img-element -- a 44 px avatar, already small
    <img src={account.image} alt="" />
  ) : (
    <span aria-hidden>{initials(account.name)}</span>
  );
  const plural = (key: "header.notifications" | "header.messages" | "command.count") => ({
    zero: t(key, { count: 0 }),
    one: t(key, { count: 1 }),
    other: t(key, { count: 2 }).replace("2", "#"),
  });
  return (
    <div data-reduce-motion={reduceMotion ? "" : undefined} className="t-app t-cadre">
      {/* Before the first paint: a dark phone never flashes the light page. */}
      <script dangerouslySetInnerHTML={{ __html: appearanceScript(appearance) }} />
      <AppearanceRoot appearance={appearance} />
      <AppMotionRoot reduce={reduceMotion} />
      <Toaster label={tt("region.aria")} closeLabel={tt("close")} placement="bottom" />
      <Suspense fallback={null}>
        <AppIntroGate data={intro} reduce={reduceMotion} />
      </Suspense>
      <OfflineDrafts
        scope={account.id}
        labels={{
          kept: t("offline.kept"),
          sending: t("offline.sending"),
          restored: t("offline.restored"),
        }}
      />
      <a
        href="#content"
        className="sr-only z-50 rounded-pill bg-lime px-4 py-2 text-sapin focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("skip")}
      </a>
      <TalentSideNav
        name={account.name}
        avatar={avatar}
        followUp={followUp}
        unreadMessages={unreadMessages}
        labels={{
          aria: t("nav.aria"),
          badge: t("nav.badge", { count: followUp }),
          forMe: t("nav.forMe"),
          offers: t("nav.offers"),
          orbi: t("nav.orbi"),
          learn: t("nav.learn"),
          suivi: t("nav.suivi"),
          home: t("web.home"),
          brand: t("web.brand"),
          more: t("web.more"),
          messages: t("web.messages"),
          messagesAria: t("header.messages", { count: unreadMessages }),
          cv: t("web.cv"),
          connections: t("web.connections"),
          settings: t("web.settings"),
          accountKind: t("web.accountKind"),
          account: t("header.account", { name: account.name }),
          shortcut: t("web.shortcut"),
        }}
      />
      <div className="t-main">
        <TalentTopBar
          unread={unread}
          unreadMessages={unreadMessages}
          avatar={avatar}
          menu={menu}
          labels={{
            search: t("web.search"),
            shortcut: t("web.shortcut"),
            notifications: plural("header.notifications"),
            messages: plural("header.messages"),
            account: t("menu.open", { name: account.name }),
            menu: t("menu.label"),
            panel: {
              title: tNotifs("web.title"),
              markAll: tNotifications("markAllRead"),
              all: tNotifs("web.all"),
              loading: tNotifs("web.loading"),
              error: tNotifs("web.error"),
              empty: tNotifs("empty.title"),
              unread: tNotifications("item.unread"),
            },
          }}
        />
        <div className="t-zone">
          <TalentHeader
            unread={unread}
            unreadMessages={unreadMessages}
            avatar={avatar}
            labels={{
              notifications: plural("header.notifications"),
              messages: plural("header.messages"),
              account: t("header.account", { name: account.name }),
              back: t("header.back"),
              search: {
                label: t("search.label"),
                placeholder: t("search.placeholder"),
                placeholderOffers: t("search.placeholderOffers"),
                placeholderLearn: t("search.placeholderLearn"),
                filters: t("search.filters"),
              },
              tabs: {
                "/app": account.firstName
                  ? t("header.hello", { name: account.firstName })
                  : t("header.helloAnon"),
                "/app/jobs": t("nav.offers"),
                "/app/learn": t("nav.learn"),
                "/app/suivi": t("nav.suivi"),
              },
              titles: {
                "/app/career": t("title.career"),
                "/app/messages": t("title.messages"),
                "/app/notifications": t("title.notifications"),
                "/app/profil": t("title.profile"),
                "/app/abonnement": t("title.subscription"),
                "/app/parametres": t("title.settings"),
                "/app/recherche": t("title.search"),
                "/app/compte": t("title.account"),
                "/app/orbi/historique": t("title.orbiHistory"),
                "/app/jobs": t("nav.offers"),
                "/app/learn": t("nav.learn"),
                "/app/suivi": t("nav.suivi"),
              },
            }}
          />
          <main id="content" className="t-colonne t-contenu">
            <div id={OFFLINE_SLOT_ID} role="status" className="empty:hidden" />
            {children}
          </main>
        </div>
      </div>
      <TalentBottomBar
        badge={followUp}
        labels={{
          aria: t("nav.aria"),
          badge: t("nav.badge", { count: followUp }),
          forMe: t("nav.forMe"),
          offers: t("nav.offers"),
          orbi: t("nav.orbi"),
          learn: t("nav.learn"),
          suivi: t("nav.suivi"),
        }}
      />
      <Suspense fallback={null}>
        <OrbiPanel
          texts={orbiTexts}
          labels={{
            title: tOrbi("title"),
            close: t("orbiPanel.close"),
            expand: t("orbiPanel.expand"),
            loading: t("orbiPanel.loading"),
            error: t("orbiPanel.error"),
            aides: tOrbi("aides.label"),
            cv: tOrbi("aides.cv"),
            interview: tOrbi("aides.interview"),
            offer: tOrbi("aides.offer"),
            path: tOrbi("aides.path"),
          }}
        />
      </Suspense>
      <TalentCommand
        labels={{
          title: t("command.title"),
          label: t("command.label"),
          placeholder: t("web.search"),
          esc: t("command.esc"),
          close: t("command.close"),
          suggestions: t("command.suggestions"),
          ask: t("command.ask"),
          askQuery: t("command.askQuery", { query: "{query}" }),
          askHint: t("command.askHint"),
          goTo: t("command.goTo"),
          results: t("command.results"),
          job: t("command.job"),
          course: t("command.course"),
          all: t("command.all", { query: "{query}" }),
          none: t("command.none", { query: "{query}" }),
          searching: t("command.searching"),
          count: plural("command.count"),
        }}
        destinations={[
          { href: "/app", label: t("nav.forMe"), icon: "accueil" },
          { href: "/app/jobs", label: t("nav.offers"), icon: "opportunites" },
          { href: "/app/learn", label: t("nav.learn"), icon: "former" },
          { href: "/app/suivi", label: t("nav.suivi"), icon: "candidature" },
          { href: "/app/messages", label: t("web.messages"), icon: "message" },
          { href: "/app/career/cv", label: t("web.cv"), icon: "cv" },
          { href: "/app/compte/connexions", label: t("web.connections"), icon: "connexion" },
          { href: "/app/parametres", label: t("web.settings"), icon: "reglages" },
        ]}
      />
    </div>
  );
}
