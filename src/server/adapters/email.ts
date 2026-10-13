/**
 * E-mail sending behind an interface (CLAUDE.md, conventions). Without RESEND_API_KEY the fake
 * adapter is used: messages are printed in the console and kept in memory for tests. When
 * EMAIL_OUTBOX_FILE is set (end-to-end tests), each message is also appended to that file as JSON.
 */
import { appendFileSync } from "node:fs";

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export interface EmailSender {
  readonly id: "fake" | "resend";
  send(email: OutgoingEmail): Promise<void>;
}

export class FakeEmailSender implements EmailSender {
  readonly id = "fake";
  readonly outbox: OutgoingEmail[] = [];

  async send(email: OutgoingEmail) {
    this.outbox.push(email);
    const file = process.env.EMAIL_OUTBOX_FILE;
    if (file) {
      const { to, subject, text } = email;
      appendFileSync(file, `${JSON.stringify({ to, subject, text, at: Date.now() })}\n`);
    }
    console.info(`[e-mail factice] À : ${email.to} · Objet : ${email.subject}\n${email.text}`);
  }
}

export class ResendEmailSender implements EmailSender {
  readonly id = "resend";

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(email: OutgoingEmail) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: this.from,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        html: email.html,
        reply_to: email.replyTo,
      }),
    });
    if (!response.ok) throw new Error(`Resend a répondu ${response.status}`);
  }
}

let sender: EmailSender | undefined;

export function emailSender(): EmailSender {
  if (!sender) {
    const apiKey = process.env.RESEND_API_KEY;
    sender = apiKey
      ? new ResendEmailSender(apiKey, process.env.EMAIL_FROM ?? "Jumanly <assistant@jumanly.io>")
      : new FakeEmailSender();
  }
  return sender;
}
