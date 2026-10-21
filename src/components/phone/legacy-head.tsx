"use client";

import { initials } from "@/components/ui/avatar";
import { TalentHeader, type HeaderLabels } from "@/components/talent/header";

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
  labels,
}: {
  account: { name: string; image: string | null };
  unread: number;
  unreadMessages: number;
  labels: HeaderLabels;
}) {
  const avatar = account.image ? (
    // eslint-disable-next-line @next/next/no-img-element -- a 44 px avatar, already small
    <img src={account.image} alt="" />
  ) : (
    <span aria-hidden>{initials(account.name)}</span>
  );
  return (
    <TalentHeader unread={unread} unreadMessages={unreadMessages} avatar={avatar} labels={labels} />
  );
}
