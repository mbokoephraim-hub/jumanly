/**
 * Public contact forms (/contact and /partenaires): validation, routing to the right mailbox,
 * storage and forwarding by e-mail. Contact is by e-mail only, never by phone (CLAUDE.md § 8).
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import type { EmailSender } from "../adapters/email";
import {
  contactSubjects,
  MESSAGE_MAX,
  MESSAGE_MIN,
  partnerPlans,
  partnerTypes,
  quoteNeeds,
  type ContactSubject,
  type FieldError,
} from "./contact-rules";

export * from "./contact-rules";

/** Professional subjects go to the professional mailbox, the others to the general one. */
const professionalSubjects: readonly ContactSubject[] = ["quote", "recruiter", "partners", "press"];

const required = z.string().trim().min(1, "required");
const email = z
  .string()
  .trim()
  .min(1, "required")
  .pipe(z.email("email"))
  .pipe(z.string().max(200, "email"));
const optional = z
  .string()
  .trim()
  .max(200, "required")
  .optional()
  .transform((value) => value || undefined);
const consent = z.literal("on", { error: "consent" });
const optionalCount = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return undefined;
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > 1_000_000) {
      ctx.addIssue({ code: "custom", message: "number" });
      return z.NEVER;
    }
    return number;
  });

export const contactSchema = z
  .object({
    subject: z.enum(contactSubjects, { error: "required" }),
    name: required.pipe(z.string().max(120)),
    email,
    organization: optional,
    country: optional,
    users: optionalCount,
    entities: optionalCount,
    message: z
      .string()
      .trim()
      .min(1, "required")
      .min(MESSAGE_MIN, "messageShort")
      .max(MESSAGE_MAX, "messageLong"),
    consent,
  })
  .superRefine((data, ctx) => {
    // A quote request needs the organization's name (textes, /contact, note d'intégration).
    if (data.subject === "quote" && !data.organization) {
      ctx.addIssue({ code: "custom", path: ["organization"], message: "required" });
    }
  });

export const partnerContactSchema = z.object({
  organization: required.pipe(z.string().max(200)),
  type: z.enum(partnerTypes, { error: "required" }),
  name: required.pipe(z.string().max(120)),
  role: optional,
  email,
  country: optional,
  beneficiaries: optionalCount,
  plan: z.enum(partnerPlans).optional().catch(undefined),
  duration: optional,
  message: z
    .string()
    .trim()
    .max(MESSAGE_MAX, "messageLong")
    .optional()
    .transform((value) => value || undefined),
  consent,
});

const requiredCount = z
  .string()
  .trim()
  .min(1, "required")
  .transform((value, ctx) => {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > 1_000_000) {
      ctx.addIssue({ code: "custom", message: "number" });
      return z.NEVER;
    }
    return number;
  });

/**
 * Company Premium quote request (/contact?sujet=devis, maquette 05-06). Required: organization,
 * name, role, e-mail, country, number of users and consent. Numbers are validated.
 */
export const quoteSchema = z.object({
  organization: required.pipe(z.string().max(200)),
  name: required.pipe(z.string().max(120)),
  role: required.pipe(z.string().max(120)),
  email,
  country: required.pipe(z.string().max(200)),
  users: requiredCount,
  entities: optionalCount,
  jobs: optionalCount,
  /** Unknown values are dropped. */
  needs: z
    .array(z.string())
    .default([])
    .transform((values) => quoteNeeds.filter((need) => values.includes(need))),
  tools: optional,
  message: z
    .string()
    .trim()
    .max(MESSAGE_MAX, "messageLong")
    .optional()
    .transform((value) => value || undefined),
  consent,
});

export type ContactInput = z.infer<typeof contactSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type PartnerContactInput = z.infer<typeof partnerContactSchema>;

export type Mailboxes = { pro: string; general: string };

export function mailboxes(): Mailboxes {
  return {
    pro: process.env.CONTACT_EMAIL_PRO || "assistant@jumanly.io",
    general: process.env.CONTACT_EMAIL_GENERAL || "infojumanly@gmail.com",
  };
}

export function routeContact(subject: ContactSubject, boxes: Mailboxes): string {
  return professionalSubjects.includes(subject) ? boxes.pro : boxes.general;
}

/** Field errors as `{ field: code }`, first error per field. */
export function fieldErrors(error: z.ZodError): Record<string, FieldError> {
  const result: Record<string, FieldError> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!result[field]) result[field] = issue.message as FieldError;
  }
  return result;
}

/** At most 3 messages per address within 10 minutes. */
export const RATE_LIMIT = { count: 3, windowMs: 10 * 60 * 1000 };

export async function isRateLimited(db: PrismaClient, email: string, now = new Date()) {
  const recent = await db.contactMessage.count({
    where: {
      email: email.toLowerCase(),
      createdAt: { gt: new Date(now.getTime() - RATE_LIMIT.windowMs) },
    },
  });
  return recent >= RATE_LIMIT.count;
}

export type ForwardedMessage = {
  audience: "contact" | "partners";
  subject: string;
  name: string;
  email: string;
  organization?: string;
  country?: string;
  message: string;
  details: Record<string, string | number>;
  routedTo: string;
  /** Already-translated e-mail subject and labelled lines. */
  emailSubject: string;
  emailLines: string[];
};

export async function saveAndForward(
  db: PrismaClient,
  sender: EmailSender,
  input: ForwardedMessage,
) {
  await db.contactMessage.create({
    data: {
      audience: input.audience,
      subject: input.subject,
      name: input.name,
      email: input.email.toLowerCase(),
      organization: input.organization,
      country: input.country,
      message: input.message,
      details: input.details,
      routedTo: input.routedTo,
    },
  });
  await sender.send({
    to: input.routedTo,
    subject: input.emailSubject,
    text: input.emailLines.join("\n"),
    replyTo: input.email,
  });
}
