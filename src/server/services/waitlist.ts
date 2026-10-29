/**
 * Waitlist of the public site (29/10/2026): while sign-up is closed (src/lib/signup.ts), visitors
 * leave their details on /liste-attente and get a confirmation e-mail. One row per address: joining
 * again updates the row and sends nothing more.
 */
import { z } from "zod";
import type { PrismaClient, WaitlistProfile } from "@/generated/prisma/client";
import { waitlistProfiles } from "./waitlist-profiles";

export { waitlistProfiles };

/** Profile in the address (`?profil=recruteur`), as written by joinHref. */
const profileAliases: Record<string, WaitlistProfile> = {
  talent: "talent",
  recruteur: "recruiter",
  entreprise: "company",
  partenaire: "partner",
};

export function profileFromQuery(value: unknown): WaitlistProfile | undefined {
  return typeof value === "string" ? profileAliases[value] : undefined;
}

export type WaitlistFieldError = "required" | "email" | "consent" | "profile";

const required = z.string().trim().min(1, "required").max(120, "required");
const optional = z
  .string()
  .trim()
  .max(120, "required")
  .optional()
  .transform((value) => value || undefined);

export const waitlistSchema = z.object({
  profile: z.enum(waitlistProfiles, { error: "profile" }),
  firstName: required,
  lastName: optional,
  email: z
    .string()
    .trim()
    .min(1, "required")
    .pipe(z.email("email"))
    .pipe(z.string().max(200, "email"))
    .transform((value) => value.toLowerCase()),
  country: required,
  city: optional,
  organization: optional,
  consent: z.literal("on", { error: "consent" }),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

export function waitlistErrors(error: z.ZodError): Record<string, WaitlistFieldError> {
  const result: Record<string, WaitlistFieldError> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!result[field]) result[field] = issue.message as WaitlistFieldError;
  }
  return result;
}

/** Saves the entry; `created` is false when the address was already on the list. */
export async function joinWaitlist(
  db: PrismaClient,
  input: WaitlistInput,
  locale: string,
): Promise<{ id: string; created: boolean; emailSent: boolean }> {
  const data = {
    firstName: input.firstName,
    lastName: input.lastName ?? null,
    profile: input.profile,
    country: input.country,
    city: input.city ?? null,
    // A talent has no organization to give.
    organization: input.profile === "talent" ? null : (input.organization ?? null),
    locale,
  };
  const existing = await db.waitlistEntry.findUnique({
    where: { email: input.email },
    select: { id: true, emailSentAt: true },
  });
  if (existing) {
    await db.waitlistEntry.update({ where: { id: existing.id }, data });
    return { id: existing.id, created: false, emailSent: existing.emailSentAt !== null };
  }
  const entry = await db.waitlistEntry.create({ data: { ...data, email: input.email } });
  return { id: entry.id, created: true, emailSent: false };
}

/** Counts per profile for the admin page. */
export async function waitlistCounts(db: PrismaClient) {
  const groups = await db.waitlistEntry.groupBy({ by: ["profile"], _count: { _all: true } });
  const counts = Object.fromEntries(waitlistProfiles.map((profile) => [profile, 0])) as Record<
    WaitlistProfile,
    number
  >;
  for (const group of groups) counts[group.profile] = group._count._all;
  return { ...counts, total: Object.values(counts).reduce((sum, value) => sum + value, 0) };
}
