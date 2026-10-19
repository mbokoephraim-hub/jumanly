import { isTester } from "@/server/services/tester";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TalentShell } from "@/components/talent/shell";
import { Skeleton } from "@/components/ui";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { ADMIN_ROLES } from "@/server/auth/session";
import type { AbstractIntlMessages } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { AvatarMenuContent } from "@/components/talent/web/avatar-menu";
import { ContentBanners } from "@/components/site/content-banners";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import { unreadNotifications } from "@/server/services/notifications";
import { hireMemberships, partnerMemberships } from "@/server/services/organization";
import { introData } from "@/components/app/app-intro-data";
import { introProfile } from "@/lib/app-intro";
import { unreadCount } from "@/server/services/connect";
import { followUpActions } from "@/server/services/follow-up";

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

  const plan = await resolvePlan(db, { type: "user", id: user.id });
  const t = await getTranslations("org.roles");
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
        isAdmin: (ADMIN_ROLES as readonly string[]).includes(user.platformRole),
        isTester: isTester(user),
      }}
    >
      <ContentBanners audience={partnerSpace ? "partners" : "recruiters"} />
      {children}
    </AppShell>
  );
}
