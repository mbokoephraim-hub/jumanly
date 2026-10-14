/**
 * Invoices (partie 09 § 9.2): one per successful payment, numbered in sequence (JMN-2026-000001),
 * with what was billed frozen at issue. Legal and tax mentions are to be completed by the team.
 */
import { z } from "zod";
import { Prisma, type PrismaClient, type SubjectType } from "@/generated/prisma/client";
import type { Subject } from "@/server/entitlements";

export function invoiceNumber(sequence: number, issuedAt: Date) {
  return `JMN-${issuedAt.getUTCFullYear()}-${String(sequence).padStart(6, "0")}`;
}

/** Name, e-mail and address shown on the invoice: the billing details, else the account. */
async function billedTo(
  db: PrismaClient,
  subjectType: SubjectType,
  subjectId: string,
  payerId: string | null,
) {
  const details = await db.billingDetails.findUnique({
    where: { subjectType_subjectId: { subjectType, subjectId } },
  });
  const payer = payerId
    ? await db.user.findUnique({ where: { id: payerId }, select: { name: true, email: true } })
    : null;
  let name = payer?.name ?? "";
  let email = payer?.email ?? "";
  if (subjectType === "user") {
    const user = await db.user.findUnique({
      where: { id: subjectId },
      select: { name: true, email: true },
    });
    name = user?.name ?? name;
    email = user?.email ?? email;
  } else {
    const org = await db.organization.findUnique({
      where: { id: subjectId },
      select: { name: true },
    });
    name = org?.name ?? name;
  }
  return {
    billedName: details?.name || name,
    billedEmail: details?.email || email,
    billedAddress: details?.address || null,
    billedTaxId: details?.taxId || null,
  };
}

/**
 * The invoice of a successful payment, created once. The next number is read and written in the
 * same transaction; two invoices issued at the same instant collide on the unique sequence and
 * the second one retries with the following number.
 */
export async function issueInvoice(db: PrismaClient, paymentId: string, now = new Date()) {
  const existing = await db.invoice.findUnique({ where: { paymentId } });
  if (existing) return existing;
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { plan: { select: { name: true, priceCents: true } } },
  });
  if (!payment || payment.status !== "succeeded") return null;
  const billed = await billedTo(db, payment.subjectType, payment.subjectId, payment.payerId);
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const last = await tx.invoice.aggregate({ _max: { sequence: true } });
        const sequence = (last._max.sequence ?? 0) + 1;
        return tx.invoice.create({
          data: {
            number: invoiceNumber(sequence, now),
            sequence,
            paymentId: payment.id,
            subjectType: payment.subjectType,
            subjectId: payment.subjectId,
            ...billed,
            planName: payment.plan.name,
            amountCents: payment.amountCents,
            creditCents: payment.creditCents,
            currency: payment.currency,
            periodStart: payment.periodStart,
            periodEnd: payment.periodEnd,
            issuedAt: now,
          },
        });
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        throw error;
      }
      const raced = await db.invoice.findUnique({ where: { paymentId } });
      if (raced) return raced;
    }
  }
  throw new Error("Numéro de facture indisponible");
}

/** An invoice for whoever pays for its subject (the user, or an owner of the organization). */
export async function invoiceFor(db: PrismaClient, invoiceId: string, subjects: Subject[]) {
  if (subjects.length === 0) return null;
  return db.invoice.findFirst({
    where: {
      id: invoiceId,
      OR: subjects.map((subject) => ({ subjectType: subject.type, subjectId: subject.id })),
    },
    include: { payment: true },
  });
}

export const billingDetailsSchema = z.object({
  name: z.string().trim().min(1).max(160),
  address: z.string().trim().max(400),
  taxId: z.string().trim().max(60),
  email: z.union([z.email().max(200), z.literal("")]),
});

export async function saveBillingDetails(
  db: PrismaClient,
  subject: Subject,
  input: z.infer<typeof billingDetailsSchema>,
) {
  const data = {
    name: input.name,
    address: input.address || null,
    taxId: input.taxId || null,
    email: input.email || null,
  };
  return db.billingDetails.upsert({
    where: { subjectType_subjectId: { subjectType: subject.type, subjectId: subject.id } },
    create: { subjectType: subject.type, subjectId: subject.id, ...data },
    update: data,
  });
}
