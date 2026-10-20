import { Suspense, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AppIntroGate } from "@/components/app/app-intro-gate";
import type { IntroData } from "@/components/app/app-intro";
import { AppMotionRoot } from "@/components/motion/app-motion-root";
import { Toaster } from "@/components/motion/toaster";
import { initials } from "@/components/ui/avatar";
import { AppearanceRoot } from "@/components/talent/appearance";
import { OFFLINE_SLOT_ID } from "@/lib/connection";
import { appearanceScript, type Appearance } from "@/lib/appearance";
import { RecruiterBottomBar } from "./bottom-bar";
import { RecruiterHeader } from "./header";
import { OrgMark } from "./org-mark";
import { OrgSheet, type OrgChoice } from "./org-sheet";

/**
 * Recruiter space (docs/refonte-mobile, brief recruteur lot 1): the head with the active
 * organization and the big title, the page, the floating bar À traiter · Offres · Orbi ·
 * Candidats · Messages. Same surfaces, icons and light or dark mode as the talent space. The
 * frame of a computer or a tablet comes with the web lots (docs/refonte-web): until then the
 * phone column is drawn at every width.
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
  children,
}: {
  account: { name: string; image: string | null };
  org: { id: string; name: string; logo: string | null };
  orgs: OrgChoice[];
  unread: number;
  unreadMessages: number;
  appearance: Appearance;
  reduceMotion: boolean;
  intro: IntroData;
  children: ReactNode;
}) {
  const t = useTranslations("hireShell");
  const tt = useTranslations("toast");
  const avatar = account.image ? (
    // eslint-disable-next-line @next/next/no-img-element -- a 44 px avatar, already small
    <img src={account.image} alt="" />
  ) : (
    <span aria-hidden>{initials(account.name)}</span>
  );
  return (
    <div data-reduce-motion={reduceMotion ? "" : undefined} className="t-app t-rh">
      <script dangerouslySetInnerHTML={{ __html: appearanceScript(appearance) }} />
      <AppearanceRoot appearance={appearance} />
      <AppMotionRoot reduce={reduceMotion} />
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
      <div className="t-main">
        <div className="t-zone">
          <RecruiterHeader
            unread={unread}
            avatar={avatar}
            org={{ name: org.name, mark: <OrgMark name={org.name} logo={org.logo} /> }}
            labels={{
              notifications: {
                zero: t("header.notifications", { count: 0 }),
                one: t("header.notifications", { count: 1 }),
                other: t("header.notifications", { count: 2 }).replace("2", "#"),
              },
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
      <OrgSheet
        orgs={orgs}
        activeId={org.id}
        labels={{
          title: t("org.title"),
          close: t("org.close"),
          current: t("org.current"),
          talent: t("org.talent"),
        }}
      />
    </div>
  );
}
