/**
 * Leaked-password check (partie 10 § 10.1) that never blocks a sign-up when the Have I Been Pwned
 * service is slow or unreachable: Better Auth's plugin then throws an internal error (or waits
 * forever), which left people on « Un problème est survenu de notre côté ». A compromised password
 * is still refused; an unanswered check is logged and the password is accepted
 * (docs/decisions/2026-10-15-verification-mots-de-passe.md).
 */
import type { BetterAuthPlugin } from "better-auth";
import { haveIBeenPwned } from "better-auth/plugins";
import { reportError } from "@/server/observability";

/** How long the check may take before the sign-up goes on without it. */
export const PASSWORD_CHECK_TIMEOUT_MS = 4000;

type Hash = (password: string) => Promise<string>;

class CheckTimeout extends Error {
  constructor() {
    super(`Vérification Have I Been Pwned sans réponse après ${PASSWORD_CHECK_TIMEOUT_MS} ms`);
  }
}

/** Better Auth's refusal of a password found in a leak. */
export function isCompromisedPasswordError(error: unknown): boolean {
  const body = (error as { body?: { code?: string } } | null)?.body;
  return body?.code === "PASSWORD_COMPROMISED";
}

/**
 * Hashes with the leak check (`checked`), falling back to the plain hash (`plain`) when the check
 * fails for any reason other than a compromised password.
 */
export async function hashWithLeakCheck(
  password: string,
  checked: Hash,
  plain: Hash,
  options: { timeoutMs?: number; report?: (error: unknown) => unknown } = {},
): Promise<string> {
  const { timeoutMs = PASSWORD_CHECK_TIMEOUT_MS, report = defaultReport } = options;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new CheckTimeout()), timeoutMs);
  });
  try {
    return await Promise.race([checked(password), timeout]);
  } catch (error) {
    if (isCompromisedPasswordError(error)) throw error;
    await report(error);
    return plain(password);
  } finally {
    clearTimeout(timer);
  }
}

function defaultReport(error: unknown) {
  return reportError(error, {
    message: "Vérification des mots de passe divulgués indisponible : mot de passe accepté",
  });
}

/** `haveIBeenPwned()` whose check gives way when the service does not answer. */
export function leakedPasswordCheck(): BetterAuthPlugin {
  const plugin = haveIBeenPwned();
  return {
    ...plugin,
    init(ctx) {
      const plain: Hash = ctx.password.hash;
      const result = plugin.init(ctx);
      const checked: Hash = result.context.password.hash;
      return {
        context: {
          password: {
            ...result.context.password,
            hash: (password: string) => hashWithLeakCheck(password, checked, plain),
          },
        },
      };
    },
  };
}
