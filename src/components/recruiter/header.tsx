"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOP_BAR_SLOT_ID } from "@/lib/top-bar";
import { BackButton, parentPath, useCountPages } from "@/components/talent/back-button";
import { ownHead, PHONE, plural, useUnread } from "@/components/talent/header";
import { TalentIcon } from "@/components/talent/icon";
import { SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";

export const ORG_SHEET_ID = "rh-organisations";

export type RecruiterHeaderLabels = {
  notifications: { zero: string; one: string; other: string };
  account: string;
  back: string;
  search: string;
  /** « Organisation active : … Changer », the name of the chip for screen readers. */
  org: string;
  /** Big title of each destination, by path. */
  tabs: Record<string, string>;
};

/** Destinations whose page draws its own head on a computer or a tablet (planche web recruteur-1). */
const webHead = ["/app/hire", "/app/hire/offres", "/app/hire/candidats"];

/** Recruiter pages that draw their own head, on top of the shared ones of the talent space. */
function ownRecruiterHead(pathname: string) {
  return (
    /^\/app\/hire\/compte(\/.*)?$/.test(pathname) ||
    // Lot 5: organization, team, verification, templates, reports (planches recruteur-3).
    /^\/app\/organisation(\/.*)?$/.test(pathname) ||
    /^\/app\/hire\/(modeles|rapports)$/.test(pathname) ||
    pathname === "/app/bienvenue" ||
    // Lot 2: the offer, its four steps and its job sheet (planches recruteur-1 CR, OD_R, PDF_V).
    /^\/app\/hire\/offres\/[^/]+(\/modifier|\/fiche)?$/.test(pathname) ||
    // Lot 3: a candidate's file and its final decision (planches recruteur-2 DOS, DECIS).
    /^\/app\/hire\/candidats\/[^/]+(\/decision|\/entretien|\/evaluation)?$/.test(pathname) ||
    // Lot 4: the agenda, an interview, a talent's profile and its proposal, the pools.
    /^\/app\/hire\/entretiens(\/[^/]+)?$/.test(pathname) ||
    /^\/app\/hire\/talents\/[^/]+(\/proposer)?$/.test(pathname) ||
    /^\/app\/hire\/viviers(\/[^/]+)?$/.test(pathname) ||
    // Lot 6: the ATS of an offer, a profile for the offer, the retained, the grouped replies.
    /^\/app\/hire\/offres\/[^/]+\/(ats(\/[^/]+)?|retenus|reponses)$/.test(pathname)
  );
}

/**
 * Head of the recruiter space (planche recruteur-1 `tete_r`): the chip of the active organization
 * (a tap opens « Organisation active »), then the big title, the search, the notifications (Lime
 * dot) and the avatar that opens Compte RH. Any other page starts with « Retour ».
 */
export function RecruiterHeader({
  labels,
  unread,
  avatar,
  org,
}: {
  labels: RecruiterHeaderLabels;
  unread: number;
  avatar: ReactNode;
  org: { name: string; mark: ReactNode };
}) {
  useCountPages();
  const pathname = usePathname();
  // On a computer or a tablet the bell is in the top bar of the frame, which keeps it fresh.
  const count = useUnread(unread, PHONE);
  const tab = labels.tabs[pathname];
  // A destination of the bar keeps the head with the organization, even where the talent's page
  // draws its own (Messages, recruteur lot 5).
  if (!tab && (pathname === "/app/orbi" || ownHead(pathname) || ownRecruiterHead(pathname)))
    return null;

  if (!tab) {
    return (
      <header className="t-colonne">
        <div className="t-tete t-sec group/top">
          <div id={TOP_BAR_SLOT_ID} className="contents" />
          <div className="flex min-w-0 flex-1 items-center gap-2 group-has-[[data-top-override][data-active]]/top:hidden">
            <BackButton fallback={parentPath(pathname)} label={labels.back} />
          </div>
        </div>
      </header>
    );
  }

  return (
    // On a computer or a tablet the organization is in the sidebar, the bell and the avatar in the
    // top bar; the destinations of planche web recruteur-1 draw their own head.
    <header className={cx("t-colonne", webHead.includes(pathname) && "t-mob")}>
      <SheetButton target={ORG_SHEET_ID} label={labels.org} className="t-org-l t-press t-mob">
        {org.mark}
        <span>{org.name}</span>
        <TalentIcon name="suivant" size="xs" />
      </SheetButton>
      <div className="t-tete">
        {/* The page keeps its own heading for screen readers; this is its visible name. */}
        <p aria-hidden className="t-h1">
          {tab}
        </p>
        <Link href="/app/recherche" aria-label={labels.search} className="t-bi t-mob">
          <TalentIcon name="recherche" />
        </Link>
        <Link
          href="/app/notifications"
          aria-label={plural(labels.notifications, count)}
          className="t-bi t-mob"
        >
          <TalentIcon name="notification" />
          {count > 0 && <i aria-hidden className="t-pastille" />}
        </Link>
        <Link href="/app/hire/compte" aria-label={labels.account} className="t-av t-mob">
          {avatar}
        </Link>
      </div>
    </header>
  );
}
