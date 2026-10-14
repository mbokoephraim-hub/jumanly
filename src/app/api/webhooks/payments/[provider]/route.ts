import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { paymentProviderById } from "@/server/payments";
import { handlePaymentWebhook } from "@/server/services/payment-webhooks";

/**
 * `POST /api/webhooks/payments/[provider]` (partie 09 § 9.4). The answer is fast: 200 once the
 * event is stored and applied (or already known), 401 for a bad signature so that a forged call
 * is never accepted. An unknown payment is acknowledged and kept for an administrator.
 */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/webhooks/payments/[provider]">,
) {
  const { provider: id } = await params;
  const provider = paymentProviderById(id);
  if (!provider) return new NextResponse(null, { status: 404 });
  const rawBody = await request.text();
  const outcome = await handlePaymentWebhook(db, provider, request.headers, rawBody);
  if (outcome === "invalidSignature") return new NextResponse(null, { status: 401 });
  return NextResponse.json({ received: true, outcome });
}
