/**
 * Logs and error reports (partie 03 § 3.8, partie 12 E11).
 *
 * - Logs are one JSON object per line in staging and production (read by the host's log viewer),
 *   readable text elsewhere.
 * - Errors are logged, then sent to Sentry when `SENTRY_DSN` is set. The report goes through
 *   Sentry's HTTP API from the server only: no Sentry script is sent to browsers, so public pages
 *   keep their JavaScript budget.
 * - No personal data in reports: only the error, the route and an incident reference.
 */
import { appEnv } from "@/lib/env";

type Level = "info" | "warn" | "error";
type Fields = Record<string, unknown>;

function structured() {
  const env = appEnv();
  return env === "production" || env === "staging";
}

export function log(level: Level, message: string, fields: Fields = {}) {
  if (process.env.NODE_ENV === "test" && level !== "error") return;
  const write = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  if (structured()) {
    write(JSON.stringify({ time: new Date().toISOString(), level, message, ...fields }));
  } else {
    write(`[${level}] ${message}`, Object.keys(fields).length > 0 ? fields : "");
  }
}

export const logger = {
  info: (message: string, fields?: Fields) => log("info", message, fields),
  warn: (message: string, fields?: Fields) => log("warn", message, fields),
  error: (message: string, fields?: Fields) => log("error", message, fields),
};

export type ErrorContext = { message?: string; route?: string; method?: string; ref?: string };

/** Where error reports go: Sentry when configured, nowhere else (they are already logged). */
export interface ErrorReporter {
  send(error: Error, context: ErrorContext & { ref: string }): Promise<void>;
}

const noReporter: ErrorReporter = { send: async () => undefined };

type Dsn = { endpoint: string; key: string; raw: string };

export function parseDsn(raw: string | undefined): Dsn | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const project = url.pathname.replace(/^\/+/, "");
    if (!url.username || !/^\d+$/.test(project)) return null;
    return {
      endpoint: `${url.protocol}//${url.host}/api/${project}/envelope/`,
      key: url.username,
      raw,
    };
  } catch {
    return null;
  }
}

/** The body Sentry's envelope endpoint expects: a header line, an item header, the event. */
export function sentryEnvelope(
  dsn: Dsn,
  error: Error,
  context: ErrorContext & { ref: string },
  now = new Date(),
) {
  const event = {
    event_id: context.ref,
    timestamp: now.getTime() / 1000,
    platform: "node",
    level: "error",
    environment: appEnv(),
    release: process.env.APP_VERSION || undefined,
    transaction: context.route,
    tags: { method: context.method },
    message: context.message,
    exception: {
      values: [{ type: error.name, value: error.message, stacktrace: frames(error.stack) }],
    },
  };
  return [
    JSON.stringify({ event_id: context.ref, dsn: dsn.raw, sent_at: now.toISOString() }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");
}

function frames(stack: string | undefined) {
  if (!stack) return undefined;
  const lines = stack.split("\n").slice(1, 30);
  const parsed = lines
    .map((line) => line.trim().match(/^at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/))
    .filter((match) => match !== null)
    .map((match) => ({
      function: match[1] ?? "?",
      filename: match[2],
      lineno: Number(match[3]),
      colno: Number(match[4]),
    }));
  // Sentry lists the innermost frame last.
  return parsed.length > 0 ? { frames: parsed.reverse() } : undefined;
}

export const sentryReporter = (dsn: Dsn): ErrorReporter => ({
  async send(error, context) {
    await fetch(dsn.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${dsn.key}, sentry_client=jumanly/1.0`,
      },
      body: sentryEnvelope(dsn, error, context),
      signal: AbortSignal.timeout(3000),
    });
  },
});

function reporter(): ErrorReporter {
  const dsn = parseDsn(process.env.SENTRY_DSN);
  return dsn ? sentryReporter(dsn) : noReporter;
}

/** A short random reference (32 hex characters, the format Sentry uses for event ids). */
export function incidentRef() {
  return crypto.randomUUID().replaceAll("-", "");
}

/**
 * Logs an error and reports it. Never throws: reporting must not break the action that failed.
 * Returns the incident reference shown to the user on the error page.
 */
export async function reportError(raw: unknown, context: ErrorContext = {}): Promise<string> {
  const error = raw instanceof Error ? raw : new Error(String(raw));
  const ref = context.ref ?? incidentRef();
  logger.error(context.message ?? error.message, {
    ref,
    route: context.route,
    error: { name: error.name, message: error.message, stack: error.stack },
  });
  await reporter()
    .send(error, { ...context, ref })
    .catch(() => undefined);
  return ref;
}
