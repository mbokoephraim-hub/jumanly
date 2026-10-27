import { isTester } from "@/server/services/tester";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { RecruiterShell } from "@/components/recruiter/shell";
import { PhoneShell } from "@/components/phone/shell";
import { FilTab } from "@/components/phone/fil/server";
import { CareerTab } from "@/components/phone/career/server";
import { ExplorerTab } from "@/components/phone/explorer/server";
import { FormationTab } from "@/components/phone/learn/server";
import { MessagesTab } from "@/components/phone/messages/server";
import { TalentShell } from "@/components/talent/shell";
import { isPhone } from "@/server/view";
import { Skeleton } from "@/components/ui";
import { requireUser } from "@/server/auth/session";
import { touchPresence } from "@/server/services/hire-messaging";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { ADMIN_SHELL_ROLES } from "@/server/auth/roles";
import type { AbstractIntlMessages } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { AvatarMenuContent } from "@/components/talent/web/avatar-menu";
import { RecruiterAvatarMenu } from "@/components/recruiter/avatar-menu";
import { RecruiterBrief } from "@/components/recruiter/brief";
import { recruiterChatTexts } from "@/components/recruiter/orbi";
import { hireToday } from "@/server/services/hire-today";
import type { HireContext } from "@/server/services/hire";
import { ContentBanners } from "@/components/site/content-banners";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import { unreadNotifications } from "@/server/services/notifications";
import { hireMemberships, partnerMemberships } from "@/server/services/organization";
import { introData } from "@/components/app/app-intro-data";
import { introProfile } from "@/lib/app-intro";
import { unreadCount } from "@/server/services/connect";
import { followUpActions } from "@/server/services/follow-up";
import { recruiterBarCounts } from "@/server/services/hire-phone";

/** Signed-in space: every page below needs a session (checked on the server). */
export default function SignedInLayout({ children }: LayoutProps<"/app">) {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-[60dvh] rounded-panel" />}>
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
  const [hire, partners, space, partnerSpace, unread] = await Promise.all([
    hireMemberships(db, user.id),
    partnerMemberships(db, user.id),
    getActiveSpace(user.id),
    getPartnerSpace(user.id),
    unreadNotifications(db, user.id),
    // Recruteur lot 6: « En ligne » in the messaging (at most one write a minute).
    touchPresence(db, user.id),
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
    // On a phone: Modèle B (docs/modele-b), dark, five tabs kept mounted.
    if (await isPhone()) {
      // The pill menu's count on Chat (docs/fil-menu-publication § 1).
      const unreadMessages = await unreadCount(db, { userId: user.id });
      return (
        <PhoneShell
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
    const [followUp, unreadMessages, messages] = await Promise.all([
      followUpActions(db, user.id).then((actions) => actions.total),
      unreadCount(db, { userId: user.id }),
      getMessages(),
    ]);
    // The conversation's texts only, for the Orbi panel of the web frame.
    const orbiTexts = Object.fromEntries(
      Object.entries(messages.talentOrbi).filter(
        ([key]) => !["historyPage", "rules", "web"].includes(key),
      ),
    ) as AbstractIntlMessages;
    return (
      <TalentShell
        account={{ id: user.id, name: user.name, firstName: user.firstName, image: user.image }}
        unread={unread}
        unreadMessages={unreadMessages}
        followUp={followUp}
        appearance={user.appearance}
        reduceMotion={user.reduceMotion}
        intro={intro}
        orbiTexts={orbiTexts}
        menu={
          <Suspense fallback={null}>
            <AvatarMenuContent user={{ id: user.id, name: user.name, image: user.image ?? null }} />
          </Suspense>
        }
      >
        <ContentBanners audience="talents" />
        {children}
      </TalentShell>
    );
  }

  const t = await getTranslations("org.roles");

  // Recruiter space on a phone: Modèle B (docs/modele-b-recruteur), dark, five tabs.
  if (space && !partnerSpace && (await isPhone())) {
    const counts = await recruiterBarCounts(db, {
      userId: user.id,
      organizationId: space.organizationId,
      role: space.role,
    });
    return (
      <PhoneShell
        set="recruteur"
        account={{
          id: user.id,
          name: user.name,
          firstName: user.firstName,
          image: user.image ?? null,
        }}
        reduceMotion={user.reduceMotion}
        badges={{ candidatures: counts.newApplications, messages: counts.unreadMessages }}
        tabs={{}}
      >
        <ContentBanners audience="recruiters" />
        {children}
      </PhoneShell>
    );
  }

  // Recruiter space on a tablet or a computer (docs/refonte-web, recruteur lots 1 to 4).
  if (space && !partnerSpace) {
    const tShell = await getTranslations("hireShell.org");
    const ctx = { userId: user.id, organizationId: space.organizationId, role: space.role };
    const [unreadMessages, logos, plans, messages] = await Promise.all([
      unreadCount(db, {
        userId: user.id,
        hire: { userId: user.id, organizationId: space.organizationId, role: space.role },
      }),
      db.organization.findMany({
        where: { id: { in: hire.map((membership) => membership.organizationId) } },
        select: { id: true, logo: true },
      }),
      Promise.all(
        hire.map((membership) =>
          resolvePlan(db, { type: "organization", id: membership.organizationId }),
        ),
      ),
      getMessages(),
    ]);
    const logoOf = (id: string) => logos.find((org) => org.id === id)?.logo ?? null;
    return (
      <RecruiterShell
        account={{
          name: user.name,
          image: user.image,
          line: space.jobTitle?.trim() || t(`${space.role}.text`),
        }}
        org={{
          id: space.organizationId,
          name: space.organization.name,
          logo: logoOf(space.organizationId),
        }}
        orgs={hire.map((membership, index) => {
          const role = t(`${membership.role}.text`);
          const planName = plans[index]?.planName;
          return {
            id: membership.organizationId,
            name: membership.organization.name,
            logo: logoOf(membership.organizationId),
            line: planName
              ? tShell("line", { role, plan: planName })
              : tShell("lineNoPlan", { role }),
          };
        })}
        unread={unread}
        unreadMessages={unreadMessages}
        // Étape 3 (docs/decisions/2026-10-26-etape-3-cadre.md): the recruiter's space on a
        // computer is always dark, like the Modèle B.
        appearance="dark"
        company={space.role === "org_owner" || space.role === "org_admin"}
        reduceMotion={user.reduceMotion}
        intro={intro}
        orbiTexts={recruiterChatTexts(messages) as AbstractIntlMessages}
        menu={
          <Suspense fallback={null}>
            <RecruiterAvatarMenu
              ctx={ctx}
              user={{ name: user.name, image: user.image ?? null }}
              roleLabel={t(`${space.role}.text`)}
            />
          </Suspense>
        }
        brief={
          <Suspense fallback={null}>
            <BellBrief ctx={ctx} firstName={user.firstName || user.name} />
          </Suspense>
        }
      >
        <ContentBanners audience="recruiters" />
        {children}
      </RecruiterShell>
    );
  }

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

/** « Votre journée en bref » above the notifications under the bell (web recruteur lot 3). */
async function BellBrief({ ctx, firstName }: { ctx: HireContext; firstName: string }) {
  const today = await hireToday(db, ctx);
  return <RecruiterBrief today={today} firstName={firstName} id="r5-brief-pop" />;
}
