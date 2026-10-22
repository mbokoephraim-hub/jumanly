"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { withArrival } from "@/lib/app-intro";
import { sendWelcome } from "@/server/account-emails";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { setActiveSpace } from "@/server/hire-context";
import { mailJoinRequest } from "@/server/hire-emails";
import { reportError } from "@/server/observability";
import { HireError } from "@/server/services/hire";
import { seatUsage } from "@/server/services/organization";
import {
  becomeIndependent,
  companyState,
  createCompany,
  createCompanySchema,
  ensureRecruiterProfile,
  finishRecruiterProfile,
  resetCompanyChoice,
  requestCompany,
  saveRecruiterContacts,
  saveRecruiterPlace,
  saveRecruiterRole,
  saveRecruits,
  searchCompanies,
  type CompanyCard,
  type CompanyState,
} from "@/server/services/recruiter-onboarding";
import { clearSignupFlow } from "@/server/signup-flow";

/**
 * The recruiter's profile in seven steps on a phone (Modèle B recruteur, M2). Each step saves as the
 * person goes on; order of CLAUDE.md: validate (in the service) → session → service.
 */

const PAGE = "/app/bienvenue";

async function recruiter() {
  const user = await requireUser(PAGE);
  await ensureRecruiterProfile(db, user.id);
  return user;
}

export type RhResult = { ok: true } | { ok: false; error: string };

export async function rhSavePlace(input: {
  country: string;
  city: string;
  otherCities: string[];
}): Promise<RhResult> {
  const user = await recruiter();
  return (await saveRecruiterPlace(db, user.id, input))
    ? { ok: true }
    : { ok: false, error: "place" };
}

export async function rhSaveContacts(input: {
  workEmail: string;
  phone: string;
  phoneCountry: string;
  whatsapp: boolean;
  linkedin: string;
  contactsFor: "nobody" | "interview" | "connections";
}): Promise<RhResult> {
  const user = await recruiter();
  const error = await saveRecruiterContacts(db, user.id, input);
  return error ? { ok: false, error } : { ok: true };
}

export async function rhSaveRole(input: { kind: string; jobTitle: string }): Promise<RhResult> {
  const user = await recruiter();
  return (await saveRecruiterRole(db, user.id, input as { kind: "charge"; jobTitle: string }))
    ? { ok: true }
    : { ok: false, error: "role" };
}

export async function rhSearchCompanies(query: string): Promise<CompanyCard[]> {
  const user = await recruiter();
  return searchCompanies(db, user.id, String(query ?? "").slice(0, 80));
}

export async function rhCompanyState(): Promise<CompanyState> {
  const user = await recruiter();
  return companyState(db, user.id);
}

/** « Envoyer la demande »: the administrators are told in the app and by e-mail. */
export async function rhRequestCompany(
  organizationId: string,
  message: string,
): Promise<{ ok: true; state: CompanyState; sentTo: string | null } | { ok: false }> {
  const user = await recruiter();
  let result;
  try {
    result = await requestCompany(
      db,
      user.id,
      String(organizationId ?? "").slice(0, 60),
      String(message ?? ""),
    );
  } catch (error) {
    if (error instanceof HireError) return { ok: false };
    throw error;
  }
  const t = await getTranslations("orgJoin");
  const seats = await seatUsage(db, result.card.id);
  const seatsAfter =
    seats.max === null
      ? t("seatsUnlimited")
      : t("seatsAfter", { used: seats.used + 1, max: seats.max });
  for (const admin of result.admins)
    await mailJoinRequest(admin, {
      name: user.name,
      org: result.card.name,
      domain: result.request.matchedBy === "domain",
      seatsAfter,
    }).catch((error) => reportError(error, { message: "Demande de rattachement non envoyée" }));
  return { ok: true, state: await companyState(db, user.id), sentTo: result.card.manager };
}

export async function rhCancelRequest(): Promise<CompanyState> {
  const user = await recruiter();
  await resetCompanyChoice(db, user.id);
  return companyState(db, user.id);
}

export async function rhCreateCompany(input: {
  name: string;
  sector: string;
  size: string;
}): Promise<{ ok: true; state: CompanyState } | { ok: false }> {
  const user = await recruiter();
  const parsed = createCompanySchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const orgId = await createCompany(db, user.id, parsed.data);
  await setActiveSpace(orgId);
  return { ok: true, state: await companyState(db, user.id) };
}

export async function rhBecomeIndependent(): Promise<CompanyState> {
  const user = await recruiter();
  await becomeIndependent(db, user.id);
  return companyState(db, user.id);
}

export async function rhSaveRecruits(input: {
  domains: string[];
  levels: string[];
  hiresPerYear: "few" | "some" | "many" | null;
}): Promise<RhResult> {
  const user = await recruiter();
  return (await saveRecruits(db, user.id, input))
    ? { ok: true }
    : { ok: false, error: "recruits" };
}

/** « Terminer »: the profile is complete; the welcome e-mail names the company or the person. */
export async function rhFinish(input: { headline: string; hiringNow: boolean }): Promise<RhResult> {
  const user = await recruiter();
  if (!(await finishRecruiterProfile(db, user.id, input)))
    return { ok: false, error: "headline" };
  const state = await companyState(db, user.id);
  const space = await db.membership.findFirst({
    where: { userId: user.id, status: "active", role: "org_owner" },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true },
  });
  const org = state.state === "independent" || state.state === "none" ? null : state.card;
  const subject = org ?? (space ? { id: space.organizationId, name: user.name } : null);
  if (subject) {
    const plan = await resolvePlan(db, { type: "organization", id: subject.id });
    await sendWelcome(user.email, {
      kind: "recruiter",
      firstName: user.firstName ?? user.name,
      plan: plan?.planName ?? "",
      org: subject.name,
    }).catch((error) => reportError(error, { message: "E-mail de bienvenue non envoyé" }));
  }
  return { ok: true };
}

/**
 * « Entrer dans Jumanly »: into the company once the attachment is accepted (or the page created),
 * otherwise into the space under the person's name; the Fil of the recruiter opens.
 */
export async function rhEnter() {
  const user = await recruiter();
  const state = await companyState(db, user.id);
  if (state.state === "accepted" || state.state === "created") await setActiveSpace(state.card.id);
  await clearSignupFlow();
  redirect(withArrival("/app/hire"));
}
