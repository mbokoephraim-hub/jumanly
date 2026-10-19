import { NextResponse, type NextRequest } from "next/server";
import { withArrival } from "@/lib/app-intro";
import { isSafeInternalPath } from "@/lib/signup";
import { sendWelcome } from "@/server/account-emails";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { reportError } from "@/server/observability";
import { pendingSocialSignup, setupAccount } from "@/server/services/accounts";
import { writeSignupFlow } from "@/server/signup-flow";

/**
 * A talent who created their account with Google, LinkedIn or Apple (refonte mobile, lot 2): no
 * plan step, the account is set up like after the e-mail code, then the first questions.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/connexion", request.url));
  const params = request.nextUrl.searchParams;
  const suite = params.get("suite");
  const next = suite && isSafeInternalPath(suite) ? suite : undefined;
  const forfait = params.get("forfait")?.slice(0, 60);
  const plan = forfait
    ? await db.plan.findFirst({
        where: { code: forfait, family: "talent", priceCents: { gt: 0 } },
        select: { code: true },
      })
    : null;
  if (await pendingSocialSignup(db, session.user.id)) {
    const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });
    await setupAccount(db, user.id, { profile: "talent" });
    await sendWelcome(user.email, {
      kind: "talent",
      firstName: user.firstName ?? user.name,
      plan: (await resolvePlan(db, { type: "user", id: user.id }))?.planName ?? "",
    }).catch((error) => reportError(error, { message: "E-mail de bienvenue non envoyé" }));
  }
  await writeSignupFlow({ profile: "talent", plan: plan?.code, next });
  return NextResponse.redirect(new URL(withArrival("/app/bienvenue"), request.url));
}
