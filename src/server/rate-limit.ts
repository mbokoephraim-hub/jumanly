/**
 * Rate limits for the sign-in and sign-up forms (partie 10). Better Auth only limits requests that
 * reach its HTTP routes; our forms call it from server actions, so the same limits are applied here,
 * in the same `rateLimit` table (shared by every server instance).
 */
import "server-only";
import { headers } from "next/headers";
import { db } from "@/server/db";

export const authLimits = {
  signIn: { window: 15 * 60, max: 10 },
  signUp: { window: 60 * 60, max: 10 },
  passwordReset: { window: 15 * 60, max: 5 },
  sendCode: { window: 60, max: 3 },
  magicLink: { window: 15 * 60, max: 5 },
  activate: { window: 15 * 60, max: 10 },
} as const;

/** The visitor's address as given by the hosting proxy, or null when unknown. */
export async function clientIp(): Promise<string | null> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    null
  );
}

/**
 * Counts one attempt for `scope` and `subject` (an address, or the IP) and says whether it is
 * allowed. The window restarts once it has elapsed.
 */
export async function allowAttempt(
  scope: keyof typeof authLimits,
  subject: string,
  now = Date.now(),
): Promise<boolean> {
  if (process.env.AUTH_RATE_LIMIT === "off") return true;
  const { window, max } = authLimits[scope];
  const key = `jm:${scope}:${subject.toLowerCase()}`;
  const windowStart = BigInt(now - window * 1000);
  await db.rateLimit.upsert({
    where: { key },
    update: {},
    create: { key, count: 0, lastRequest: BigInt(now) },
  });
  // Expired window: start again from 1, only if nobody did it in between.
  const reset = await db.rateLimit.updateMany({
    where: { key, lastRequest: { lt: windowStart } },
    data: { count: 1, lastRequest: BigInt(now) },
  });
  if (reset.count === 1) return true;
  const counted = await db.rateLimit.updateMany({
    where: { key, count: { lt: max } },
    data: { count: { increment: 1 } },
  });
  return counted.count === 1;
}
