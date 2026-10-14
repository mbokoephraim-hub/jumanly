import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Signed, single-use token of the internal print page (SPECIFICATION-MODELES-CV.md § 6.3): the
 * headless browser carries no session cookie, so the page trusts this token only. It names what
 * to print and expires after 60 seconds.
 */

export const printSources = ["document", "application", "message"] as const;
export type PrintSource = (typeof printSources)[number];
export type PrintTicket = { source: PrintSource; id: string; nonce: string; expiresAt: number };

const LIFETIME_MS = 60_000;

function secret() {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value) throw new Error("BETTER_AUTH_SECRET manquant : impossible de signer l'impression.");
  return `cv-print:${value}`;
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function createPrintToken(source: PrintSource, id: string, now = Date.now()) {
  const ticket: PrintTicket = { source, id, nonce: randomUUID(), expiresAt: now + LIFETIME_MS };
  const body = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** The ticket when the signature is right and the token has not expired; never consumes it. */
export function readPrintToken(token: string, now = Date.now()): PrintTicket | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const ticket = JSON.parse(Buffer.from(body, "base64url").toString()) as PrintTicket;
    if (!printSources.includes(ticket.source) || typeof ticket.id !== "string") return null;
    return ticket.expiresAt >= now ? ticket : null;
  } catch {
    return null;
  }
}

/** Marks the token as used; false when it was already used (a second load is refused). */
export async function consumePrintToken(db: PrismaClient, ticket: PrintTicket) {
  try {
    await db.jobRun.create({ data: { key: `cv-print:${ticket.nonce}` } });
    return true;
  } catch {
    return false;
  }
}
