import { Suspense, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { AppMotionRoot } from "@/components/motion/app-motion-root";
import { Toaster } from "@/components/motion/toaster";
import { OfflineDrafts } from "@/components/talent/offline-drafts";
import { OFFLINE_SLOT_ID } from "@/lib/connection";
import { orbiActions } from "@/lib/orbi";
import {
  RECRUITER_TABS,
  tabsOf,
  type PhoneTab,
  type RecruiterTab,
  type TalentTab,
  type TabSetName,
} from "@/lib/phone-tabs";
import { recruiterOrbiActions } from "@/server/services/recruiter-orbi";
import { phoneThemeScript } from "@/lib/phone-theme";
import { PhoneArrivals } from "./arrivals";
import { PhoneThemeRoot } from "./theme-root";
import { PhoneNav } from "./nav";
import { Opening } from "./opening";
import { openingScript } from "./opening-script";
import { PhoneOrbi, type OrbiTexts } from "./orbi";
import { PhonePreload } from "./preload";
import { PhoneStack } from "./stack";
import { ViewSync } from "./view-sync";

/**
 * The talent space on a phone (Modèle B, docs/modele-b): dark, or light « Crème doux » by choice, the five tabs kept mounted
 * under the pages, the pill menu (docs/fil-menu-publication), Orbi floating on each tab, the logo alone for 1.2 s
 * while everything loads behind it (brief § 3).
 */
export async function PhoneShell({
  account,
  reduceMotion,
  tabs,
  set = "talent",
  badges,
  children,
}: {
  account: { id: string; name: string; firstName: string | null; image: string | null };
  reduceMotion: boolean;
  /** The talent's interface, or the recruiter's (docs/modele-b-recruteur, lot M1). */
  set?: TabSetName;
  /** Counts on the menu: unread conversations on Chat, new applications on Candidatures. */
  badges?: { candidatures?: number; messages: number };
  /** The tabs already drawn for the phone, kept mounted (each lot adds its own). */
  tabs: Partial<Record<PhoneTab, ReactNode>>;
  children: ReactNode;
}) {
  const t = await getTranslations("phone");
  const tShell = await getTranslations("talentShell");
  const tOrbi = await getTranslations("talentOrbi");
  const tBrand = await getTranslations("common");
  const tRh = await getTranslations("phoneRh");
  const tRhOrbi = await getTranslations("rhOrbi.chat");
  const recruiter = set === "recruteur";
  const recruiterTabTexts = (tab: RecruiterTab) => ({
    bubble: tRh(`orbi.${tab}.bubble`),
    from: tRh(`orbi.${tab}.from`),
    questions: [1, 2, 3, 4].map((n) => tRh(`orbi.${tab}.q${n}` as "orbi.fil.q1")),
  });
  const tabTexts = (tab: TalentTab) => {
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
  // The menu's names (docs/fil-menu-publication § 1): Hub and Chat in the pill; the pages keep
  // their own titles.
  const navName = (tab: PhoneTab) => {
    if (!recruiter) return t(`nav.${tab}` as "nav.fil");
    if (tab === "messages") return tRh("nav.chat");
    return tRh(`nav.${tab as RecruiterTab}`);
  };
  const navLabel = (tab: PhoneTab) => {
    if (tab === "candidatures" && badges?.candidatures)
      return tRh("nav.candidaturesNew", { count: badges.candidatures });
    if (tab === "messages" && badges?.messages)
      return recruiter
        ? tRh("nav.messagesUnread", { count: badges.messages })
        : t("nav.messagesUnread", { count: badges.messages });
    return navName(tab);
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
      entitlement: recruiter ? tRhOrbi("limit.entitlement") : tOrbi("limit.entitlement"),
      quota: recruiter ? tRhOrbi("limit.quota") : tOrbi("limit.quota"),
      unavailable: tOrbi("limit.unavailable"),
    },
    limitLinks: {
      consent: tOrbi("limitLink.consent"),
      plans: recruiter ? tRh("orbi.plan") : tOrbi("limitLink.plans"),
    },
    actions: recruiter
      ? Object.fromEntries(
          Object.keys(recruiterOrbiActions).map((key) => [
            key,
            tRhOrbi(`actions.${key}` as "actions.offers"),
          ]),
        )
      : Object.fromEntries(
          Object.keys(orbiActions).map((key) => [key, tOrbi(`actions.${key}` as "actions.cv")]),
        ),
    tabs: recruiter
      ? Object.fromEntries(RECRUITER_TABS.map((tab) => [tab, recruiterTabTexts(tab)]))
      : Object.fromEntries(tabsOf("talent").map((tab) => [tab, tabTexts(tab as TalentTab)])),
    full: recruiter ? tRh("orbi.full") : undefined,
  };
  return (
    <div
      className="nb-app"
      data-reduit={reduceMotion ? "" : undefined}
      data-reduce-motion={reduceMotion ? "" : undefined}
    >
      {/* Before the first paint: the logo alone, and the dark class of the screens without a mockup. */}
      <script dangerouslySetInnerHTML={{ __html: openingScript(tBrand("brand")) }} />
      <script dangerouslySetInnerHTML={{ __html: phoneThemeScript(true) }} />
      <PhoneThemeRoot />
      <Opening />
      <ViewSync view="phone" />
      <AppMotionRoot reduce={reduceMotion} />
      <Toaster label={t("toasts")} closeLabel={t("close")} placement="top" />
      <PhoneArrivals />
      <PhonePreload />
      <OfflineDrafts
        scope={account.id}
        labels={{
          kept: tShell("offline.kept"),
          sending: tShell("offline.sending"),
          restored: tShell("offline.restored"),
        }}
      />
      <PhoneStack tabs={tabs} set={set} reduce={reduceMotion}>
        <div id={OFFLINE_SLOT_ID} role="status" className="empty:hidden" />
        {/* A Modèle B page (`.nb-page`) takes the whole screen; a screen without a mockup of its
            own (diagnostic, LinkedIn, security…) keeps its content, in the colours of the Modèle B
            and under its own head (lot B9). */}
        <div className={recruiter ? "t-app t-rh nb-cadre" : "t-app nb-cadre"}>
          <div className="t-colonne t-contenu">{children}</div>
        </div>
      </PhoneStack>
      <PhoneNav
        aria={t("nav.aria")}
        set={set}
        labels={Object.fromEntries(tabsOf(set).map((tab) => [tab, navLabel(tab)]))}
        names={Object.fromEntries(tabsOf(set).map((tab) => [tab, navName(tab)]))}
        badges={
          badges ? { candidatures: badges.candidatures, messages: badges.messages } : undefined
        }
      />
      <Suspense fallback={null}>
        <PhoneOrbi
          texts={orbi}
          set={set}
          hrefs={recruiter ? recruiterOrbiActions : orbiActions}
          limitHrefs={
            recruiter
              ? { consent: "/app/parametres/confidentialite", plans: "/app/hire/compte" }
              : undefined
          }
        />
      </Suspense>
    </div>
  );
}
