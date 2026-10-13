/**
 * Accounts: sign-up rules (docs/specifications.md, partie 07 § 2; textes, partie 02), setup of a
 * new account (talent profile, organization for a recruiter or a company) and the subject that
 * pays for a plan.
 */
import { z } from "zod";
import type { PlanFamily, PrismaClient } from "@/generated/prisma/client";
import { passwordProblem, PASSWORD_MAX } from "@/lib/password";
import type { Subject } from "@/server/entitlements";

export const signupProfiles = ["talent", "rh", "company", "partner"] as const;
export type SignupProfile = (typeof signupProfiles)[number];

/** Families offered at step 2, by profile (textes, note d'intégration de l'étape 2). */
export function familiesForProfile(profile: SignupProfile): PlanFamily[] {
  if (profile === "talent") return ["talent"];
  if (profile === "rh") return ["rh"];
  if (profile === "company") return ["rh", "company"];
  return [];
}

export type AuthFieldError =
  | "required"
  | "emailInvalid"
  | "passwordTooShort"
  | "passwordWeak"
  | "passwordCommon"
  | "nameInvalid"
  | "countryRequired"
  | "cityRequired"
  | "orgNameRequired"
  | "termsRequired"
  | "aiConsentRequired"
  | "ageRequired";

const name = z
  .string()
  .trim()
  .min(1, "required")
  .max(80, "nameInvalid")
  .regex(/^[\p{L}\p{M}' .-]+$/u, "nameInvalid");

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "required")
  .pipe(z.email("emailInvalid"))
  .pipe(z.string().max(200, "emailInvalid"));

export const passwordField = z
  .string()
  .max(PASSWORD_MAX, "passwordWeak")
  .superRefine((value, ctx) => {
    const problem = passwordProblem(value);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  });

const accepted = (message: AuthFieldError) => z.literal("on", { error: message });

export const signupAccountSchema = z
  .object({
    profile: z.enum(["talent", "rh", "company"], { error: "required" }),
    firstName: name,
    lastName: name,
    email: emailField,
    password: passwordField,
    country: z.string().trim().min(2, "countryRequired").max(2, "countryRequired"),
    city: z.string().trim().min(1, "cityRequired").max(120, "cityRequired"),
    orgName: z.string().trim().max(160).optional(),
    orgRole: z.string().trim().max(120).optional(),
    terms: accepted("termsRequired"),
    ai: accepted("aiConsentRequired"),
    age: accepted("ageRequired"),
    newsletter: z.literal("on").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.profile !== "talent" && !data.orgName) {
      ctx.addIssue({ code: "custom", path: ["orgName"], message: "orgNameRequired" });
    }
  });

export type SignupAccountInput = z.infer<typeof signupAccountSchema>;

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueOrgSlug(db: PrismaClient, name: string) {
  const base = slugify(name) || "organisation";
  for (let index = 0; ; index += 1) {
    const slug = index === 0 ? base : `${base}-${index + 1}`;
    if (!(await db.organization.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
}

/**
 * Everything a new account needs besides the login itself: a talent profile (every account has
 * one, partie 03 § 3.4) and, for a recruiter or a company, its organization with the person as owner.
 * Safe to call twice.
 */
export async function setupAccount(
  db: PrismaClient,
  userId: string,
  input: { profile: SignupProfile; orgName?: string; orgRole?: string },
) {
  await db.talentProfile.upsert({ where: { userId }, update: {}, create: { userId } });
  if (input.profile !== "rh" && input.profile !== "company") return null;
  const existing = await db.membership.findFirst({
    where: { userId, role: "org_owner" },
    include: { organization: true },
  });
  if (existing) return existing.organization;
  const orgName = input.orgName?.trim() || "";
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  return db.organization.create({
    data: {
      type: input.profile === "company" ? "company" : "recruiter",
      name: orgName,
      slug: await uniqueOrgSlug(db, orgName),
      country: user.country,
      city: user.city,
      memberships: {
        create: { userId, role: "org_owner", jobTitle: input.orgRole || null },
      },
    },
  });
}

/** The organization a person owns (for organization plans), if any. */
export async function ownedOrganization(db: PrismaClient, userId: string) {
  const membership = await db.membership.findFirst({
    where: { userId, role: "org_owner", status: "active" },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  return membership?.organization ?? null;
}

/** Who pays for a plan of this family: the person (talents) or the organization they own. */
export async function billingSubject(
  db: PrismaClient,
  userId: string,
  family: PlanFamily,
): Promise<Subject | null> {
  if (family === "talent") return { type: "user", id: userId };
  const org = await ownedOrganization(db, userId);
  return org ? { type: "organization", id: org.id } : null;
}
