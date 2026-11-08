import { isTester } from "@/server/services/tester";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PhoneShell } from "@/components/phone/shell";
import {
  RecruiterToolsNav,
  type RecruiterToolsGroup,
} from "@/components/phone/recruteur/outils-nav";
import { FilTab } from "@/components/phone/fil/server";
import { CareerTab } from "@/components/phone/career/server";
import { ExplorerTab } from "@/components/phone/explorer/server";
import { FormationTab } from "@/components/phone/learn/server";
import { MessagesTab } from "@/components/phone/messages/server";
import { isPhone } from "@/server/view";
import { ShellLoading } from "@/components/app/shell-loading";
import { requireUser } from "@/server/auth/session";
import { touchPresence } from "@/server/services/hire-messaging";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { ADMIN_SHELL_ROLES } from "@/server/auth/roles";
import { getTranslations } from "next-intl/server";
import { ContentBanners } from "@/components/site/content-banners";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import { unreadNotifications } from "@/server/services/notifications";
import { hireMemberships, partnerMemberships } from "@/server/services/organization";
import { introData } from "@/components/app/app-intro-data";
import { introProfile } from "@/lib/app-intro";
import { unreadCount } from "@/server/services/connect";
import { recruiterBarCounts } from "@/server/services/hire-phone";

/** Signed-in space: every page below needs a session (checked on the server). */
export default function SignedInLayout({ children }: LayoutProps<"/app">) {
  return (
    <Suspense fallback={<ShellLoading />}>
      <SignedIn>{children}</SignedIn>
    </Suspense>
  );
}

async function SignedIn({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/app");
  // Accounts created through Google or a magic link get their talent profile on first visit.
  await db.talentProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  const [hire, partners, space, partnerSpace, unread, , phone] = await Promise.all([
    hireMemberships(db, user.id),
    partnerMemberships(db, user.id),
    getActiveSpace(user.id),
    getPartnerSpace(user.id),
    unreadNotifications(db, user.id),
    // Recruteur lot 6: « En ligne » in the messaging (at most one write a minute).
    touchPresence(db, user.id),
    isPhone(),
  ]);
  const intro = await introData({
    profile: introProfile(
      partnerSpace ? { partner: true } : space ? { type: space.organization.type } : null,
    ),
    name: user.firstName ?? user.name ?? null,
    image: user.image,
    seenAt: user.introSeenAt,
  });

  // Personal space: the talent shell of the mobile redesign (docs/refonte-mobile).
  if (!partnerSpace && !space) {
    // Modèle B (docs/modele-b), dark, five tabs kept mounted: on a phone, and on a computer or a
    // tablet since 07/11/2026 (the same screens, the menu on the left, `wide`).
    {
      // The pill menu's count on Chat (docs/fil-menu-publication § 1).
      const unreadMessages = await unreadCount(db, { userId: user.id });
      return (
        <PhoneShell
          wide={!phone}
          badges={{ messages: unreadMessages }}
          account={{
            id: user.id,
            name: user.name,
            firstName: user.firstName,
            image: user.image ?? null,
          }}
          reduceMotion={user.reduceMotion}
          tabs={{
            fil: (
              <Suspense fallback={null}>
                <FilTab user={{ id: user.id, name: user.name, image: user.image ?? null }} />
              </Suspense>
            ),
            explorer: (
              <Suspense fallback={null}>
                <ExplorerTab user={{ id: user.id, name: user.name, image: user.image ?? null }} />
              </Suspense>
            ),
            carriere: (
              <Suspense fallback={null}>
                <CareerTab user={{ id: user.id }} />
              </Suspense>
            ),
            formation: (
              <Suspense fallback={null}>
                <FormationTab user={{ id: user.id, name: user.name, image: user.image ?? null }} />
              </Suspense>
            ),
            messages: (
              <Suspense fallback={null}>
                <MessagesTab user={{ id: user.id, showPresence: user.showPresence }} />
              </Suspense>
            ),
          }}
        >
          <ContentBanners audience="talents" />
          {children}
        </PhoneShell>
      );
    }
  }

  // Recruiter space: Modèle B (docs/modele-b-recruteur), dark, five tabs, on a phone, and on a
  // computer or a tablet since 08/11/2026 (the same screens, the menu on the left, `wide`, with the
  // tools of the big screen and the company's part for its administrators).
  if (space && !partnerSpace) {
    const counts = await recruiterBarCounts(db, {
      userId: user.id,
      organizationId: space.organizationId,
      role: space.role,
    });
    const tWeb = await getTranslations("hireShell.web");
    const tTools = await getTranslations("phoneRh.outils");
    const company = space.role === "org_owner" || space.role === "org_admin";
    const side = phone ? null : (
      <RecruiterToolsNav
        groups={
          [
            {
              title: tTools("title"),
              items: [
                { href: "/app/hire/rapports", label: tWeb("reports"), icon: "progression" },
                { href: "/app/hire/modeles", label: tTools("templates"), icon: "message" },
              ],
            },
            ...(company
              ? [
                  {
                    title: tWeb("entreprise.aria"),
                    items: [
                      {
                        href: "/app/organisation/equipe",
                        label: tWeb("entreprise.team"),
                        icon: "candidats",
                      },
                      {
                        href: "/app/organisation",
                        label: tWeb("entreprise.page"),
                        icon: "entreprise",
                        exact: true,
                      },
                      {
                        href: "/app/organisation/facturation",
                        label: tWeb("entreprise.billing"),
                        icon: "portefeuille",
                      },
                      {
                        href: "/app/organisation/journal",
                        label: tWeb("entreprise.journal"),
                        icon: "confidentialite",
                      },
                      {
                        href: "/app/organisation/reglages",
                        label: tWeb("entreprise.settings"),
                        icon: "reglages",
                      },
                    ],
                  } satisfies RecruiterToolsGroup,
                ]
              : []),
          ] satisfies RecruiterToolsGroup[]
        }
      />
    );
    return (
      <PhoneShell
        set="recruteur"
        wide={!phone}
        side={side}
        account={{
          id: user.id,
          name: user.name,
          firstName: user.firstName,
          image: user.image ?? null,
        }}
        reduceMotion={user.reduceMotion}
        badges={{
          offres: counts.newApplications,
          agenda: counts.agendaDue,
          messages: counts.unreadMessages,
        }}
        tabs={{}}
      >
        <ContentBanners audience="recruiters" />
        {children}
      </PhoneShell>
    );
  }

  const t = await getTranslations("org.roles");
  const plan = await resolvePlan(db, { type: "user", id: user.id });
  const option = (membership: (typeof hire)[number]) => ({
    id: membership.organizationId,
    name: membership.organization.name,
    role: t(`${membership.role}.text`),
  });
  return (
    <AppShell
      space={
        partnerSpace ? { ...option(partnerSpace), partner: true } : space ? option(space) : null
      }
      spaces={[...hire, ...partners].map(option)}
      unread={unread}
      reduceMotion={user.reduceMotion}
      intro={intro}
      account={{
        name: user.name,
        image: user.image,
        planName: plan?.planName ?? "",
        isAdmin: (ADMIN_SHELL_ROLES as readonly string[]).includes(user.platformRole),
        isTester: isTester(user),
      }}
    >
      <ContentBanners audience={partnerSpace ? "partners" : "recruiters"} />
      {children}
    </AppShell>
  );
}
