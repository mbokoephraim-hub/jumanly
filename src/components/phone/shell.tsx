import { Suspense, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { AppMotionRoot } from "@/components/motion/app-motion-root";
import { Toaster } from "@/components/motion/toaster";
import { AppearanceRoot } from "@/components/talent/appearance";
import { OfflineDrafts } from "@/components/talent/offline-drafts";
import { appearanceScript } from "@/lib/appearance";
import { OFFLINE_SLOT_ID } from "@/lib/connection";
import { orbiActions } from "@/lib/orbi";
import { PHONE_TABS, type PhoneTab } from "@/lib/phone-tabs";
import type { HeaderLabels } from "@/components/talent/header";
import { PhoneLegacyHead } from "./legacy-head";
import { PhoneNav } from "./nav";
import { Opening } from "./opening";
import { openingScript } from "./opening-script";
import { PhoneOrbi, type OrbiTexts } from "./orbi";
import { PhoneStack } from "./stack";
import { ViewSync } from "./view-sync";

/**
 * The talent space on a phone (Modèle B, docs/modele-b): dark only, the five tabs kept mounted
 * under the pages, the bottom bar of icons, Orbi floating on each tab, the logo alone for 1.2 s
 * while everything loads behind it (brief § 3).
 */
export async function PhoneShell({
  account,
  unread,
  unreadMessages,
  reduceMotion,
  tabs,
  children,
}: {
  account: { id: string; name: string; firstName: string | null; image: string | null };
  /** Unread notifications and conversations, for the head of the pages not redrawn yet. */
  unread: number;
  unreadMessages: number;
  reduceMotion: boolean;
  /** The tabs already drawn for the phone, kept mounted (each lot adds its own). */
  tabs: Partial<Record<PhoneTab, ReactNode>>;
  children: ReactNode;
}) {
  const t = await getTranslations("phone");
  const tShell = await getTranslations("talentShell");
  const tOrbi = await getTranslations("talentOrbi");
  const tBrand = await getTranslations("common");
  const tabTexts = (tab: PhoneTab): OrbiTexts["tabs"][PhoneTab] => {
    const bubble =
      tab === "fil" || tab === "explorer" || tab === "formation"
        ? t(`orbi.${tab}.bubble`)
        : undefined;
    return {
      bubble,
      from: t(`orbi.${tab}.from`),
      questions: [1, 2, 3, 4].map((n) => t(`orbi.${tab}.q${n}` as "orbi.fil.q1")),
    };
  };
  const orbi: OrbiTexts = {
    open: t("orbi.open"),
    hello: account.firstName ? t("orbi.hello", { name: account.firstName }) : t("orbi.helloAnon"),
    title: t("orbi.title"),
    close: t("close"),
    back: t("back"),
    placeholder: t("orbi.placeholder"),
    input: t("orbi.input"),
    send: t("orbi.send"),
    thinking: tOrbi("chat.thinking"),
    decide: t("orbi.decide"),
    failed: tOrbi("error.failed"),
    invalid: tOrbi("error.invalid"),
    limits: {
      consent: tOrbi("limit.consent"),
      entitlement: tOrbi("limit.entitlement"),
      quota: tOrbi("limit.quota"),
      unavailable: tOrbi("limit.unavailable"),
    },
    limitLinks: { consent: tOrbi("limitLink.consent"), plans: tOrbi("limitLink.plans") },
    actions: Object.fromEntries(
      Object.keys(orbiActions).map((key) => [key, tOrbi(`actions.${key}` as "actions.cv")]),
    ),
    tabs: Object.fromEntries(PHONE_TABS.map((tab) => [tab, tabTexts(tab)])) as OrbiTexts["tabs"],
  };
  const plural = (key: "header.notifications" | "header.messages") => ({
    zero: tShell(key, { count: 0 }),
    one: tShell(key, { count: 1 }),
    other: tShell(key, { count: 2 }).replace("2", "#"),
  });
  const legacyLabels: HeaderLabels = {
    notifications: plural("header.notifications"),
    messages: plural("header.messages"),
    account: tShell("header.account", { name: account.name }),
    back: tShell("header.back"),
    search: {
      label: tShell("search.label"),
      placeholder: tShell("search.placeholder"),
      placeholderOffers: tShell("search.placeholderOffers"),
      placeholderLearn: tShell("search.placeholderLearn"),
      filters: tShell("search.filters"),
    },
    tabs: {
      "/app": account.firstName
        ? tShell("header.hello", { name: account.firstName })
        : tShell("header.helloAnon"),
      "/app/jobs": tShell("nav.offers"),
      "/app/learn": tShell("nav.learn"),
      "/app/suivi": tShell("nav.suivi"),
    },
    titles: {
      "/app/career": tShell("title.career"),
      "/app/messages": tShell("title.messages"),
      "/app/notifications": tShell("title.notifications"),
      "/app/profil": tShell("title.profile"),
      "/app/abonnement": tShell("title.subscription"),
      "/app/parametres": tShell("title.settings"),
      "/app/recherche": tShell("title.search"),
      "/app/compte": tShell("title.account"),
      "/app/orbi/historique": tShell("title.orbiHistory"),
      "/app/jobs": tShell("nav.offers"),
      "/app/learn": tShell("nav.learn"),
      "/app/suivi": tShell("nav.suivi"),
    },
  };
  return (
    <div
      className="nb-app"
      data-reduit={reduceMotion ? "" : undefined}
      data-reduce-motion={reduceMotion ? "" : undefined}
    >
      {/* Before the first paint: the logo alone, and the dark class for the pages not redrawn yet. */}
      <script dangerouslySetInnerHTML={{ __html: openingScript(tBrand("brand")) }} />
      <script dangerouslySetInnerHTML={{ __html: appearanceScript("dark") }} />
      <AppearanceRoot appearance="dark" />
      <Opening />
      <ViewSync view="phone" />
      <AppMotionRoot reduce={reduceMotion} />
      <Toaster label={t("toasts")} closeLabel={t("close")} placement="top" />
      <OfflineDrafts
        scope={account.id}
        labels={{
          kept: tShell("offline.kept"),
          sending: tShell("offline.sending"),
          restored: tShell("offline.restored"),
        }}
      />
      <PhoneStack tabs={tabs} reduce={reduceMotion}>
        <div id={OFFLINE_SLOT_ID} role="status" className="empty:hidden" />
        {/* Pages not redrawn yet (lots B2 to B8) keep their previous dark look in this frame;
            a Modèle B page (`.nb-page`) takes the whole screen. Removed in B9. */}
        <div className="t-app nb-ancien">
          <PhoneLegacyHead
            account={account}
            unread={unread}
            unreadMessages={unreadMessages}
            labels={legacyLabels}
          />
          <div className="t-colonne t-contenu">{children}</div>
        </div>
      </PhoneStack>
      <PhoneNav
        aria={t("nav.aria")}
        labels={
          Object.fromEntries(PHONE_TABS.map((tab) => [tab, t(`nav.${tab}`)])) as Record<
            PhoneTab,
            string
          >
        }
      />
      <Suspense fallback={null}>
        <PhoneOrbi texts={orbi} />
      </Suspense>
    </div>
  );
}
