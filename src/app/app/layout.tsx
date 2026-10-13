import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { ADMIN_ROLES } from "@/server/auth/session";

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
  return (
    <AppShell
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
