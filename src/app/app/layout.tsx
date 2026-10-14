import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { ADMIN_ROLES } from "@/server/auth/session";
import { getTranslations } from "next-intl/server";
import { getActiveSpace } from "@/server/hire-context";
import { unreadNotifications } from "@/server/services/notifications";
import { hireMemberships } from "@/server/services/organization";

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
  const plan = await resolvePlan(db, { type: "user", id: user.id });
  const t = await getTranslations("org.roles");
  const [memberships, space, unread] = await Promise.all([
    hireMemberships(db, user.id),
    getActiveSpace(user.id),
    unreadNotifications(db, user.id),
  ]);
  const option = (membership: (typeof memberships)[number]) => ({
    id: membership.organizationId,
    name: membership.organization.name,
    role: t(`${membership.role === "partner_manager" ? "viewer" : membership.role}.text`),
  });
  return (
    <AppShell
      space={space ? option(space) : null}
      spaces={memberships.map(option)}
      unread={unread}
      account={{
        name: user.name,
        planName: plan?.planName ?? "",
        isAdmin: (ADMIN_ROLES as readonly string[]).includes(user.platformRole),
      }}
    >
      {children}
    </AppShell>
  );
}
