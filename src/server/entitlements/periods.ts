/**
 * Subscription periods and lifecycle (docs/specifications.md, partie 05 § 6 and partie 06 § 6.7).
 * Mobile Money is prepaid: a period that ends without payment goes into a grace period, then
 * back to the free plan, without losing data.
 */
import type { SubscriptionStatus } from "@/generated/prisma/client";

/** Grace period after an unpaid renewal (provisional value, partie 09 § 9.2). */
export const GRACE_DAYS = 3;
const DAY_MS = 86_400_000;

/** Same day next month(s), clamped to the end of shorter months (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const last = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, last));
  return result;
}

/** The rolling month containing `now`, counted from `anchor` (quotas: partie 05 § 4). */
export function periodAround(anchor: Date, now: Date): { start: Date; end: Date } {
  if (now < anchor) return { start: anchor, end: addMonths(anchor, 1) };
  let months =
    (now.getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - anchor.getUTCMonth());
  while (months > 0 && addMonths(anchor, months) > now) months -= 1;
  while (addMonths(anchor, months + 1) <= now) months += 1;
  return { start: addMonths(anchor, months), end: addMonths(anchor, months + 1) };
}

/** Status as of `now`, whatever has been written yet (no background job needed to read it). */
export function effectiveStatus(
  subscription: { status: SubscriptionStatus; currentPeriodEnd: Date },
  now: Date,
): SubscriptionStatus {
  const ended = subscription.currentPeriodEnd <= now;
  const graceOver = subscription.currentPeriodEnd.getTime() + GRACE_DAYS * DAY_MS <= now.getTime();
  switch (subscription.status) {
    case "active":
    case "past_due":
      return !ended && subscription.status === "active"
        ? "active"
        : graceOver
          ? "expired"
          : "past_due";
    case "trialing":
    case "canceled":
    case "sponsored":
      return ended ? "expired" : subscription.status;
    default:
      return subscription.status;
  }
}
