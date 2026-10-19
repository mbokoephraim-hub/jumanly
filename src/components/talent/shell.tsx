import { Suspense, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AppIntroGate } from "@/components/app/app-intro-gate";
import type { IntroData } from "@/components/app/app-intro";
import { AppMotionRoot } from "@/components/motion/app-motion-root";
import { Toaster } from "@/components/motion/toaster";
import { initials } from "@/components/ui/avatar";
import { OFFLINE_SLOT_ID } from "@/lib/connection";
import { appearanceScript, type Appearance } from "@/lib/appearance";
import { AppearanceRoot } from "./appearance";
import { TalentBottomBar } from "./bottom-bar";
import { TalentHeader } from "./header";
import { OfflineDrafts } from "./offline-drafts";

/**
 * Talent space (docs/refonte-mobile, lot 1): the phone screen of the planches on every width, in
 * one centred column on a computer. Head with the big title, the page, the floating bar
 * Pour moi · Offres · Orbi · Apprendre · Suivi. Light, dark or Auto (the phone decides).
 */
export function TalentShell({
  account,
  unread,
  unreadMessages,
  followUp,
  appearance,
  reduceMotion,
  intro,
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
  children: ReactNode;
}) {
  const t = useTranslations("talentShell");
  const tt = useTranslations("toast");
  const plural = (key: "header.notifications" | "header.messages") => ({
    zero: t(key, { count: 0 }),
    one: t(key, { count: 1 }),
    other: t(key, { count: 2 }).replace("2", "#"),
  });
  return (
    <div data-reduce-motion={reduceMotion ? "" : undefined} className="t-app">
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
      <TalentHeader
        unread={unread}
        unreadMessages={unreadMessages}
        avatar={
          account.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- a 44 px avatar, already small
            <img src={account.image} alt="" />
          ) : (
            <span aria-hidden>{initials(account.name)}</span>
          )
        }
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
            "/app/tableau-de-bord": t("title.dashboard"),
            "/app/recherche": t("title.search"),
            "/app/compte": t("title.account"),
            "/app/espace": t("title.space"),
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
    </div>
  );
}
