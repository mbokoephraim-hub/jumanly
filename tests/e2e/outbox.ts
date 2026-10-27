import type { Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** File where the e2e server writes every fake e-mail (EMAIL_OUTBOX_FILE). */
export const OUTBOX_FILE = join(tmpdir(), "jumanly-e2e-outbox.jsonl");

type Mail = { to: string; subject: string; text: string; at: number | string };

function mails(): Mail[] {
  if (!existsSync(OUTBOX_FILE)) return [];
  return readFileSync(OUTBOX_FILE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Mail);
}

/** Last 6-digit code sent to `to` after `since`, waiting for it if needed. */
export async function lastCode(to: string, since: number): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const mail = mails()
      .filter(
        (item) =>
          item.to === to && new Date(item.at).getTime() >= since && /\d{6}/.test(item.subject),
      )
      .at(-1);
    if (mail) return mail.subject.match(/\d{6}/)![0];
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Aucun code reçu pour ${to}`);
}

/** Every 6-digit code sent to `to` after `since`, the newest first. */
export function codesSince(to: string, since: number): string[] {
  return mails()
    .filter(
      (item) =>
        item.to === to && new Date(item.at).getTime() >= since && /\d{6}/.test(item.subject),
    )
    .map((item) => item.subject.match(/\d{6}/)![0])
    .reverse();
}

/** Last link to `path` sent to `to` after `since`. */
export async function lastLink(to: string, path: string, since: number): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const mail = mails()
      .filter(
        (item) =>
          item.to === to && new Date(item.at).getTime() >= since && item.text.includes(path),
      )
      .at(-1);
    const link = mail?.text.match(new RegExp(`https?://\\S*${path}\\S*`))?.[0];
    if (link) return link;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Aucun lien ${path} reçu pour ${to}`);
}

/**
 * Sign-up: opens the link of the confirmation e-mail (decision of 2026-10-27), which confirms the
 * address and signs the person in, on whichever page (device) opens it.
 */
export async function openConfirmationLink(page: Page, to: string, since: number) {
  const link = await lastLink(to, "/api/auth/verify-email", since);
  await page.goto(link);
}
