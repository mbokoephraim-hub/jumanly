"use client";

import { useTranslations } from "next-intl";
import { initials } from "@/components/ui/avatar";
import { TalentHeader } from "@/components/talent/header";

/**
 * Head of the pages not redrawn yet (lots B2 to B8): the previous head of the talent space (title,
 * « Retour », notifications, account, search), so that nothing becomes unreachable between two
 * lots. A Modèle B page draws its own head and hides this one (`.nb-ancien:has(.nb-page)`).
 * Removed in B9.
 */
export function PhoneLegacyHead({
  account,
  unread,
  unreadMessages,
}: {
  account: { name: string; firstName: string | null; image: string | null };
  unread: number;
  unreadMessages: number;
}) {
  const t = useTranslations("talentShell");
  const plural = (key: "header.notifications" | "header.messages") => ({
    zero: t(key, { count: 0 }),
    one: t(key, { count: 1 }),
    other: t(key, { count: 2 }).replace("2", "#"),
  });
  const avatar = account.image ? (
    // eslint-disable-next-line @next/next/no-img-element -- a 44 px avatar, already small
    <img src={account.image} alt="" />
  ) : (
    <span aria-hidden>{initials(account.name)}</span>
  );
  return (
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
  );
}
