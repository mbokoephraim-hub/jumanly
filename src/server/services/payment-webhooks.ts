/**
 * Payment webhooks (partie 09 § 9.4): raw body, signature, the event stored under its unique
 * (provider, event id), then applied. A replayed event finds its row and does nothing; a payment
 * moves only from pending, so a webhook and the polling never activate twice.
 */
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { isWebhookSignatureError, type PaymentProvider } from "@/server/payments";
import { applyPaymentStatus } from "./subscriptions";

export type WebhookOutcome =
  "processed" | "duplicate" | "invalidSignature" | "unknownPayment" | "amountMismatch";

export async function handlePaymentWebhook(
  db: PrismaClient,
  provider: PaymentProvider,
  headers: Headers,
  rawBody: string,
  now = new Date(),
): Promise<WebhookOutcome> {
  let event;
  try {
    event = await provider.verifyWebhook(headers, rawBody);
  } catch (error) {
    if (isWebhookSignatureError(error)) return "invalidSignature";
    throw error;
  }
  let payload: Prisma.InputJsonValue;
  try {
    payload = JSON.parse(rawBody) as Prisma.InputJsonValue;
  } catch {
    payload = { raw: rawBody.slice(0, 2000) };
  }
  let row;
  try {
    row = await db.paymentEvent.create({
      data: {
        provider: provider.id,
        eventId: event.id,
        providerRef: event.providerRef,
        status: event.status,
        payload,
        receivedAt: now,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return "duplicate";
    }
    throw error;
  }
  const finish = async (outcome: WebhookOutcome, message?: string) => {
    await db.paymentEvent.update({
      where: { id: row.id },
      data: { processedAt: new Date(), error: message ?? null },
    });
    return outcome;
  };
  const payment = await db.payment.findFirst({
    where: { provider: provider.id, providerRef: event.providerRef },
  });
  if (!payment) return finish("unknownPayment", "unknownPayment");
  if (
    event.status === "succeeded" &&
    event.amountCents !== undefined &&
    event.amountCents !== payment.amountCents
  ) {
    // Never activate a plan for a different amount: an administrator looks at it.
    return finish("amountMismatch", `amount ${event.amountCents} != ${payment.amountCents}`);
  }
  await applyPaymentStatus(db, payment.id, event.status, now);
  return finish("processed");
}
