import "server-only";
import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { initials } from "@/components/ui/avatar";
import type { RecruiterTab } from "@/lib/phone-tabs";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { unreadNotifications } from "@/server/services/notifications";
import { PhoneIcon } from "../icon";
import { RhTabPage, type RhSearchSetup } from "./tab-page";

/** « Rechercher dans » of each tab (planches Recruteur-*-recherche). */
const SCOPES: Record<RecruiterTab, string[]> = {
  fil: ["tout", "publications", "personnes", "entreprises"],
  offres: ["tout", "offres", "entreprises", "personnes"],
  candidatures: ["tout", "nom", "competence", "ville"],
  talents: ["tout", "personnes", "entreprises"],
  messages: ["tout", "candidats", "personnes"],
};

/**
 * The recruiter's avatar at the top right of each tab (brief § 2, Logos): it opens the account;
 * in its corner, the logo of the company (or its initials), shown only once the person belongs to
 * it — a membership is only created when the administrator accepted the request.
 */
export async function RhAvatar() {
  const user = await requireUser("/app/hire");
  const [t, space] = await Promise.all([getTranslations("phoneRh.head"), getActiveSpace(user.id)]);
  const org = space
    ? await db.organization.findUnique({
        where: { id: space.organizationId },
        select: { name: true, logo: true },
      })
    : null;
  return (
    <Link href="/app/hire/compte" className="nb-rh-moi" aria-label={t("account")}>
      <span>
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- a 36 px picture
          <img src={user.image} alt="" />
        ) : (
          initials(user.name)
        )}
      </span>
      {org ? (
        <span className="nb-rh-logo" aria-hidden>
          {org.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- a 16 px logo
            <img src={org.logo} alt="" />
          ) : (
            initials(org.name)
          )}
        </span>
      ) : (
        <span className="nb-rh-logo" data-attente="" aria-hidden />
      )}
    </Link>
  );
}

/** The bell of the Fil (planche Recruteur-fil): the notifications, with the lime count. */
export async function RhBell() {
  const user = await requireUser("/app/hire");
  const [t, unread] = await Promise.all([
    getTranslations("phoneRh.head"),
    unreadNotifications(db, user.id),
  ]);
  return (
    <Link
      href="/app/notifications"
      className="nb-rond"
      aria-label={t("notifications", { count: unread })}
    >
      <PhoneIcon name="cloche" size={21} stroke={1.8} />
      {unread > 0 ? (
        <span className="nb-compteur" aria-hidden>
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

/** « + » of Offres (planche Recruteur-offres): the lime round that starts a new offer. */
export async function RhNewOffer() {
  const t = await getTranslations("phoneRh.head");
  return (
    <Link
      href="/app/hire/offres/nouvelle"
      className="nb-rond nb-rh-plus"
      aria-label={t("newOffer")}
    >
      <PhoneIcon name="plus" size={22} stroke={2.2} />
    </Link>
  );
}

/**
 * The first screen of a recruiter's tab on the phone: its head (title, magnifier, buttons,
 * avatar), the search in two steps with the scopes of the tab, then the page.
 */
export async function RhTab({
  tab,
  subtitle,
  actions,
  className,
  legacy = true,
  children,
}: {
  tab: RecruiterTab;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** A screen not redone yet on Modèle B (lots M3 to M7): its former content, with its margins. */
  legacy?: boolean;
  children: ReactNode;
}) {
  const t = await getTranslations("phoneRh");
  const search: RhSearchSetup = {
    tab,
    label: t(`search.${tab}.label`),
    placeholder: t(`search.${tab}.placeholder`),
    note: t(`search.${tab}.note`),
    scopes: SCOPES[tab].map((key) => ({
      key,
      label: t(`search.scopes.${key as "tout"}`),
    })),
    ...(tab === "candidatures"
      ? { searchIn: t("search.searchBy"), percent: t("search.percent", { score: "{score}" }) }
      : {}),
  };
  return (
    <RhTabPage
      title={t(`nav.${tab}`)}
      subtitle={subtitle}
      actions={actions}
      avatar={<RhAvatar />}
      search={search}
      className={className}
      ownHeading={!legacy}
      texts={{
        open: t("search.open"),
        cancel: t("search.cancel"),
        clear: t("search.clear"),
        searchIn: t("search.searchIn"),
        recent: t("search.recent"),
        empty: t("search.empty", { query: "{query}" }),
      }}
    >
      {legacy ? <div className="nb-rh-ancien">{children}</div> : children}
    </RhTabPage>
  );
}
