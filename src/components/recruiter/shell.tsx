import { Suspense, type ReactNode } from "react";
import { DesktopNotifier } from "./desktop-notifications";
import { useTranslations } from "next-intl";
import { AppIntroGate } from "@/components/app/app-intro-gate";
import type { IntroData } from "@/components/app/app-intro";
import { AppMotionRoot } from "@/components/motion/app-motion-root";
import { Toaster } from "@/components/motion/toaster";
import { initials } from "@/components/ui/avatar";
import { AppearanceRoot } from "@/components/talent/appearance";
import { OFFLINE_SLOT_ID } from "@/lib/connection";
import { appearanceScript, type Appearance } from "@/lib/appearance";
import { TalentCommand } from "@/components/talent/web/command";
import { TalentTopBar } from "@/components/talent/web/top-bar";
import { OrbiPanel } from "@/components/talent/web/orbi-panel";
import type { AbstractIntlMessages } from "next-intl";
import { recruiterOrbiActions, recruiterOrbiAides } from "@/server/services/recruiter-orbi";
import { RecruiterBottomBar } from "./bottom-bar";
import { RecruiterHeader } from "./header";
import { OrgMark } from "./org-mark";
import { OrgSheet, type OrgChoice } from "./org-sheet";
import { RecruiterSideNav } from "./side-nav";

/**
 * Recruiter space, one code for three widths (docs/refonte-mobile, brief recruteur lot 1;
 * docs/refonte-web, recruteur lot 1). Phone (< 768 px): the head with the active organization and
 * the big title, the page, the floating bar À traiter · Offres · Orbi · Candidats · Messages.
 * Tablet (768 to 1199 px): the 84 px rail and the top bar. Computer (≥ 1200 px): the 232 px
 * sidebar with the organization and its menu under the name, and the top bar. The frame is the
 * talent's (`t-cadre`, lot W0): same surfaces, icons, `Ctrl K` and light or dark mode.
 */
export function RecruiterShell({
  account,
  org,
  orgs,
  unread,
  unreadMessages,
  appearance,
  reduceMotion,
  intro,
  menu,
  orbiTexts,
  brief,
  children,
}: {
  account: { name: string; image: string | null; line: string };
  org: { id: string; name: string; logo: string | null };
  orgs: OrgChoice[];
  unread: number;
  unreadMessages: number;
  appearance: Appearance;
  reduceMotion: boolean;
  intro: IntroData;
  /** The menu of the avatar on a computer (web recruteur lot 3), streamed. */
  menu: ReactNode;
  /** The texts of Orbi's conversation in the recruiter space, for the panel. */
  orbiTexts: AbstractIntlMessages;
  /** « Votre journée en bref » at the top of the notifications under the bell, streamed. */
  brief?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("hireShell");
  const tt = useTranslations("toast");
  const tc = useTranslations("talentShell.command");
  const tNotifs = useTranslations("notifs");
  const tNotifications = useTranslations("notifications");
  const tOrbi = useTranslations("rhOrbi");
  const tPanel = useTranslations("talentShell.orbiPanel");
  const notifications = {
    zero: t("header.notifications", { count: 0 }),
    one: t("header.notifications", { count: 1 }),
    other: t("header.notifications", { count: 2 }).replace("2", "#"),
  };
  const avatar = account.image ? (
    // eslint-disable-next-line @next/next/no-img-element -- a 44 px avatar, already small
    <img src={account.image} alt="" />
  ) : (
    <span aria-hidden>{initials(account.name)}</span>
  );
  return (
    <div data-reduce-motion={reduceMotion ? "" : undefined} className="t-app t-rh t-cadre">
      <script dangerouslySetInnerHTML={{ __html: appearanceScript(appearance) }} />
      <AppearanceRoot appearance={appearance} />
      <AppMotionRoot reduce={reduceMotion} />
      <DesktopNotifier title={t("web.desktopTitle")} />
      <Toaster label={tt("region.aria")} closeLabel={tt("close")} placement="bottom" />
      <Suspense fallback={null}>
        <AppIntroGate data={intro} reduce={reduceMotion} />
      </Suspense>
      <a
        href="#content"
        className="sr-only z-50 rounded-pill bg-lime px-4 py-2 text-sapin focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("skip")}
      </a>
      <RecruiterSideNav
        name={account.name}
        line={account.line}
        avatar={avatar}
        unreadMessages={unreadMessages}
        org={{ name: org.name, mark: <OrgMark name={org.name} logo={org.logo} /> }}
        labels={{
          aria: t("nav.aria"),
          more: t("web.more"),
          home: t("web.home"),
          brand: t("web.brand"),
          today: t("nav.today"),
          offers: t("nav.offers"),
          orbi: t("nav.orbi"),
          candidates: t("nav.candidates"),
          messages: t("nav.messages"),
          messagesAria: t("web.messages", { count: unreadMessages }),
          agenda: t("web.agenda"),
          talents: t("web.talents"),
          reports: t("web.reports"),
          settings: t("web.settings"),
          account: t("header.account", { name: account.name }),
          shortcut: t("web.shortcut"),
          org: t("org.open", { org: org.name }),
        }}
      />
      <div className="t-main">
        <TalentTopBar
          unread={unread}
          unreadMessages={unreadMessages}
          avatar={avatar}
          menu={menu}
          brief={brief}
          labels={{
            search: t("web.search"),
            shortcut: t("web.shortcut"),
            notifications: notifications,
            messages: {
              zero: t("web.messages", { count: 0 }),
              one: t("web.messages", { count: 1 }),
              other: t("web.messages", { count: 2 }).replace("2", "#"),
            },
            account: t("header.account", { name: account.name }),
            menu: t("web3.menu", { name: account.name }),
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
          <RecruiterHeader
            unread={unread}
            avatar={avatar}
            org={{ name: org.name, mark: <OrgMark name={org.name} logo={org.logo} /> }}
            labels={{
              notifications,
              account: t("header.account", { name: account.name }),
              back: t("header.back"),
              search: t("header.search"),
              org: t("org.open", { org: org.name }),
              tabs: {
                "/app/hire": t("title.today"),
                "/app/hire/offres": t("title.offers"),
                "/app/hire/candidats": t("title.candidates"),
                "/app/hire/talents": t("title.candidates"),
                "/app/messages": t("title.messages"),
              },
            }}
          />
          <main id="content" className="t-colonne t-contenu">
            <div id={OFFLINE_SLOT_ID} role="status" className="empty:hidden" />
            {children}
          </main>
        </div>
      </div>
      <RecruiterBottomBar
        unreadMessages={unreadMessages}
        labels={{
          aria: t("nav.aria"),
          messagesBadge: t("nav.messagesBadge", { count: unreadMessages }),
          today: t("nav.today"),
          offers: t("nav.offers"),
          orbi: t("nav.orbi"),
          candidates: t("nav.candidates"),
          messages: t("nav.messages"),
        }}
      />
      <Suspense fallback={null}>
        <OrbiPanel
          texts={orbiTexts}
          hrefs={recruiterOrbiActions}
          home="/app/hire"
          labels={{
            title: tOrbi("title"),
            close: tPanel("close"),
            expand: tPanel("expand"),
            loading: tPanel("loading"),
            error: tPanel("error"),
            aides: tOrbi("aides.label"),
          }}
          aides={recruiterOrbiAides.map((aide) => ({
            ...aide,
            label: tOrbi(`aides.${aide.key}`),
          }))}
        />
      </Suspense>
      <TalentCommand
        preview="/api/hire/recherche/apercu?q="
        results={null}
        kinds={{ offer: t("command.offer"), candidate: t("command.candidate") }}
        labels={{
          title: t("command.title"),
          label: t("command.label"),
          placeholder: t("web.search"),
          esc: tc("esc"),
          close: tc("close"),
          suggestions: tc("suggestions"),
          ask: tc("ask"),
          askQuery: tc("askQuery", { query: "{query}" }),
          askHint: tc("askHint"),
          goTo: tc("goTo"),
          results: t("command.results"),
          job: t("command.offer"),
          course: t("command.candidate"),
          all: tc("all", { query: "{query}" }),
          none: t("command.none", { query: "{query}" }),
          searching: tc("searching"),
          count: {
            zero: tc("count", { count: 0 }),
            one: tc("count", { count: 1 }),
            other: tc("count", { count: 2 }).replace("2", "#"),
          },
        }}
        destinations={[
          { href: "/app/hire", label: t("nav.today"), icon: "aujourdhui" },
          { href: "/app/hire/offres", label: t("nav.offers"), icon: "offre" },
          { href: "/app/hire/candidats", label: t("nav.candidates"), icon: "candidats" },
          { href: "/app/messages", label: t("nav.messages"), icon: "message" },
          { href: "/app/hire/entretiens", label: t("web.agenda"), icon: "agenda" },
          { href: "/app/hire/candidats?vue=talents", label: t("web.talents"), icon: "recherche" },
          { href: "/app/hire/rapports", label: t("web.reports"), icon: "progression" },
          { href: "/app/parametres", label: t("web.settings"), icon: "reglages" },
        ]}
      />
      <OrgSheet
        orgs={orgs}
        activeId={org.id}
        labels={{
          title: t("org.title"),
          close: t("org.close"),
          current: t("org.current"),
          talent: t("org.talent"),
          note: t("org.note"),
        }}
      />
    </div>
  );
}
