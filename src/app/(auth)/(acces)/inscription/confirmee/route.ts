import { NextResponse, type NextRequest } from "next/server";
import { withArrival } from "@/lib/app-intro";
import { isSafeInternalPath } from "@/lib/signup";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { signupProfileOf } from "@/server/services/signup-confirmation";
import { readSignupFlow, writeSignupFlow } from "@/server/signup-flow";

/**
 * Where the link of the confirmation e-mail lands (decision of 2026-10-27): Better Auth has just
 * confirmed the address and signed the person in, on the device where the link was opened. The
 * sign-up goes on from there: first questions, payment of an organization's plan, or the company's
 * next step.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));
  // Expired or altered link: a new one can be asked for where the address is known.
  if (params.get("error")) {
    const flow = await readSignupFlow();
    return to(flow.email ? "/inscription/verification?lien=expire" : "/connexion?lien=expire");
  }
  const session = await getSession();
  // The address was already confirmed (link opened a second time): the person signs in.
  if (!session) return to("/connexion?confirmee=1");
  const suite = params.get("suite");
  const next = suite && isSafeInternalPath(suite) ? suite : undefined;
  const plan = params.get("forfait")?.slice(0, 60) || undefined;
  const { profile, org } = await signupProfileOf(db, session.user.id);
  await writeSignupFlow({ profile, plan, next, email: undefined });
  // The company's administrator goes on with the role (Modèle B, étape 3 A1).
  if (profile === "company") return to("/inscription/entreprise?etape=role");
  // An organization pays the plan chosen before the account; a talent pays it on /tarifs after
  // the first questions (« Votre espace est prêt »).
  const paid =
    org && plan
      ? await db.plan.findUnique({ where: { code: plan }, select: { priceCents: true } })
      : null;
  return to(paid?.priceCents ? "/inscription/paiement" : withArrival("/app/bienvenue"));
}
