/**
 * E-mail sending behind an interface (CLAUDE.md, conventions). RESEND_API_KEY selects Resend;
 * otherwise SMTP_HOST selects a mailbox's SMTP server (Gmail, Hostinger…). Without either the fake
 * adapter is used: messages are printed in the console and kept in memory for tests. When
 * EMAIL_OUTBOX_FILE is set (end-to-end tests), each message is also appended to that file as JSON.
 */
import { appendFileSync } from "node:fs";
import { createTransport } from "nodemailer";

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export interface EmailSender {
  readonly id: "fake" | "resend" | "smtp";
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
    if (!response.ok) {
      // Resend explains the refusal (unverified domain, invalid key…): keep it in the logs.
      const detail = (await response.text().catch(() => "")).slice(0, 300);
      throw new Error(`Resend a répondu ${response.status} ${detail}`.trim());
    }
  }
}

export type SmtpSettings = {
  host: string;
  port: number;
  user: string;
  password: string;
};

export class SmtpEmailSender implements EmailSender {
  readonly id = "smtp";
  private readonly transport: ReturnType<typeof createTransport>;

  constructor(
    settings: SmtpSettings,
    private readonly from: string,
  ) {
    this.transport = createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.port === 465,
      auth: { user: settings.user, pass: settings.password },
    });
  }

  async send(email: OutgoingEmail) {
    await this.transport.sendMail({
      from: this.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      replyTo: email.replyTo,
    });
  }
}

let sender: EmailSender | undefined;

function smtpSender(): EmailSender | undefined {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!host || !user || !password) return undefined;
  const port = Number(process.env.SMTP_PORT || 465);
  // Gmail and most mailboxes only accept their own address as sender.
  const from = process.env.EMAIL_FROM || `Jumanly <${user}>`;
  return new SmtpEmailSender({ host, port, user, password }, from);
}

export function emailSender(): EmailSender {
  if (!sender) {
    const apiKey = process.env.RESEND_API_KEY;
    sender = apiKey
      ? new ResendEmailSender(apiKey, process.env.EMAIL_FROM || "Jumanly <assistant@jumanly.io>")
      : (smtpSender() ?? new FakeEmailSender());
    if (sender.id === "fake" && process.env.VERCEL_ENV === "production") {
      console.error(
        "[e-mail] Ni RESEND_API_KEY ni SMTP_HOST en production : aucun e-mail ne part (codes visibles seulement dans les journaux).",
      );
    }
  }
  return sender;
}
