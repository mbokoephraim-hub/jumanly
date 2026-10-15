"use server";

import { getTranslations } from "next-intl/server";
import { emailSender } from "@/server/adapters/email";
import { db } from "@/server/db";
import {
  contactSchema,
  fieldErrors,
  isRateLimited,
  mailboxes,
  partnerContactSchema,
  quoteSchema,
  routeContact,
  saveAndForward,
  type FieldError,
} from "@/server/services/contact";
import { reportError } from "@/server/observability";

export type ContactFormState =
  | { status: "idle" }
  | { status: "invalid"; errors: Record<string, FieldError>; values: Record<string, string> }
  | { status: "rateLimited" | "failed"; values: Record<string, string> }
  | { status: "sent"; email: string };

function formValues(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()]
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => [k, String(v)]),
  );
}

/**
 * Public contact form. Order (CLAUDE.md): validate → (no session, no plan: anyone can write) →
 * rate limit → service. Never throws to the page: errors come back as texts to display.
 */
export async function sendContactMessage(
  _: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = formValues(formData);
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return { status: "invalid", errors: fieldErrors(parsed.error), values };
  const input = parsed.data;
  if (await isRateLimited(db, input.email)) return { status: "rateLimited", values };

  const t = await getTranslations();
  const subjectLabel = t(`contact.form.subject.${input.subject}`);
  const details: Record<string, number> = {};
  if (input.users) details.users = input.users;
  if (input.entities) details.entities = input.entities;
  const line = (label: string, value?: string | number) =>
    value === undefined ? [] : [`${label} : ${value}`];
  try {
    await saveAndForward(db, emailSender(), {
      audience: "contact",
      subject: input.subject,
      name: input.name,
      email: input.email,
      organization: input.organization,
      country: input.country,
      message: input.message,
      details,
      routedTo: routeContact(input.subject, mailboxes()),
      emailSubject: t("contactEmail.subject", { subject: subjectLabel, name: input.name }),
      emailLines: [
        t("contactEmail.intro"),
        "",
        ...line(t("contact.form.subject.label"), subjectLabel),
        ...line(t("contact.form.name.label"), input.name),
        ...line(t("contact.form.email.label"), input.email),
        ...line(t("contact.form.organization.label"), input.organization),
        ...line(t("contact.form.country.label"), input.country),
        ...line(t("contact.form.quote.users.label"), input.users),
        ...line(t("contact.form.quote.entities.label"), input.entities),
        "",
        input.message,
      ],
    });
  } catch (error) {
    void reportError(error, { message: "Formulaire de contact : envoi impossible" });
    return { status: "failed", values };
  }
  return { status: "sent", email: input.email };
}

/** Jumanly Partners form (/partenaires): always routed to the professional mailbox. */
export async function sendPartnerRequest(
  _: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = formValues(formData);
  const parsed = partnerContactSchema.safeParse(values);
  if (!parsed.success) return { status: "invalid", errors: fieldErrors(parsed.error), values };
  const input = parsed.data;
  if (await isRateLimited(db, input.email)) return { status: "rateLimited", values };

  const t = await getTranslations();
  const f = (key: string) =>
    t(`partners.contact.form.${key}.label` as "partners.contact.form.org.label");
  const line = (label: string, value?: string | number) =>
    value === undefined ? [] : [`${label} : ${value}`];
  const typeLabel = t(`partners.contact.form.type.${input.type}`);
  const planLabel = input.plan ? t(`partners.contact.form.plan.${input.plan}`) : undefined;
  const details: Record<string, string | number> = { type: input.type };
  if (input.role) details.role = input.role;
  if (input.beneficiaries) details.beneficiaries = input.beneficiaries;
  if (input.plan) details.plan = input.plan;
  if (input.duration) details.duration = input.duration;
  try {
    await saveAndForward(db, emailSender(), {
      audience: "partners",
      subject: "partners",
      name: input.name,
      email: input.email,
      organization: input.organization,
      country: input.country,
      message: input.message ?? "",
      details,
      routedTo: mailboxes().pro,
      emailSubject: t("contactEmail.partnersSubject", { organization: input.organization }),
      emailLines: [
        t("contactEmail.intro"),
        "",
        ...line(f("org"), input.organization),
        ...line(f("type"), typeLabel),
        ...line(f("name"), input.name),
        ...line(f("role"), input.role),
        ...line(f("email"), input.email),
        ...line(f("country"), input.country),
        ...line(f("beneficiaries"), input.beneficiaries),
        ...line(f("plan"), planLabel),
        ...line(f("duration"), input.duration),
        "",
        input.message ?? "",
      ],
    });
  } catch (error) {
    void reportError(error, { message: "Formulaire partenaires : envoi impossible" });
    return { status: "failed", values };
  }
  return { status: "sent", email: input.email };
}

/**
 * Company Premium quote request (/contact?sujet=devis, maquette 05-06): stored, then forwarded by
 * e-mail to the professional mailbox. No online sale of Company Premium.
 */
export async function sendQuoteRequest(
  _: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = formValues(formData);
  const needs = formData.getAll("needs").filter((v): v is string => typeof v === "string");
  const parsed = quoteSchema.safeParse({ ...values, needs });
  // Checked needs come back as one comma-separated value, so the form can tick them again.
  const kept = { ...values, needs: needs.join(",") };
  if (!parsed.success) {
    return { status: "invalid", errors: fieldErrors(parsed.error), values: kept };
  }
  const input = parsed.data;
  if (await isRateLimited(db, input.email)) return { status: "rateLimited", values: kept };

  const t = await getTranslations();
  const line = (label: string, value?: string | number) =>
    value === undefined || value === "" ? [] : [`${label} : ${value}`];
  const needLabels = input.needs.map((need) => t(`quote.needs.${need}`)).join(", ");
  const details: Record<string, string | number> = { role: input.role, users: input.users };
  if (input.entities) details.entities = input.entities;
  if (input.jobs) details.jobs = input.jobs;
  if (input.needs.length > 0) details.needs = input.needs.join(",");
  if (input.tools) details.tools = input.tools;
  try {
    await saveAndForward(db, emailSender(), {
      audience: "contact",
      subject: "quote",
      name: input.name,
      email: input.email,
      organization: input.organization,
      country: input.country,
      message: input.message ?? "",
      details,
      routedTo: routeContact("quote", mailboxes()),
      emailSubject: t("contactEmail.subject", {
        subject: t("contact.form.subject.quote"),
        name: input.name,
      }),
      emailLines: [
        t("contactEmail.intro"),
        "",
        ...line(t("quote.org.label"), input.organization),
        ...line(t("quote.name.label"), input.name),
        ...line(t("quote.role.label"), input.role),
        ...line(t("quote.email.label"), input.email),
        ...line(t("quote.country.label"), input.country),
        ...line(t("quote.users.label"), input.users),
        ...line(t("quote.entities.label"), input.entities),
        ...line(t("quote.jobs.label"), input.jobs),
        ...line(t("quote.needs.label"), needLabels),
        ...line(t("quote.tools.label"), input.tools),
        "",
        input.message ?? "",
      ],
    });
  } catch (error) {
    void reportError(error, { message: "Demande de devis : envoi impossible" });
    return { status: "failed", values: kept };
  }
  return { status: "sent", email: input.email };
}
