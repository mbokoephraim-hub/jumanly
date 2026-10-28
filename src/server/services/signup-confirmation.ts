/**
 * Sign-up confirmed by the link sent by e-mail (decision of 2026-10-27, replaces the 6-digit
 * code): the person may open the link on another device, so everything is read from the account
 * itself, never from the sign-up cookie.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { sendWelcome } from "@/server/account-emails";
import { resolvePlan } from "@/server/entitlements";
import { reportError } from "@/server/observability";
import type { SignupProfile } from "@/server/services/accounts";

const CALLBACK = "/inscription/confirmee";

/** Where the link of the e-mail leads once the address is confirmed. */
export function confirmationCallback(options: { plan?: string; next?: string } = {}) {
  const params = new URLSearchParams();
  if (options.plan) params.set("forfait", options.plan);
  if (options.next) params.set("suite", options.next);
  const query = params.toString();
  return query ? `${CALLBACK}?${query}` : CALLBACK;
}

/** The profile chosen at sign-up, as the account records it. */
export async function signupProfileOf(db: PrismaClient, userId: string) {
  const owner = await db.membership.findFirst({
    where: { userId, role: "org_owner" },
    include: { organization: true },
  });
  if (owner) {
    const profile: SignupProfile = owner.organization.type === "company" ? "company" : "rh";
    return { profile, org: owner.organization };
  }
  const recruiter = await db.recruiterProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  const profile: SignupProfile = recruiter ? "rh" : "talent";
  return { profile, org: null };
}

/**
 * Welcome e-mail, once, when the address is confirmed. A recruiter without a company yet
 * (phone, Modèle B recruteur) is welcomed at the end of the profile, once the company is known.
 */
export async function welcomeConfirmedAccount(db: PrismaClient, userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const { profile, org } = await signupProfileOf(db, userId);
  if (profile === "rh" && !org) return;
  const plan = await resolvePlan(
    db,
    org ? { type: "organization", id: org.id } : { type: "user", id: user.id },
  );
  const firstName = user.firstName ?? user.name;
  await (
    org
      ? sendWelcome(user.email, {
          kind: profile === "company" ? "company" : "recruiter",
          firstName,
          plan: plan?.planName ?? "",
          org: org.name,
        })
      : sendWelcome(user.email, { kind: "talent", firstName, plan: plan?.planName ?? "" })
  ).catch((error) => reportError(error, { message: "E-mail de bienvenue non envoyé" }));
}
