import type { Messages } from "next-intl";

/**
 * Pages are rendered on the server and ship no texts to the browser by default (CLAUDE.md § 9).
 * A client component that needs texts is wrapped in a NextIntlClientProvider that receives only
 * the namespaces it uses, picked with this helper.
 */
export function pickMessages<K extends keyof Messages>(
  messages: Messages,
  namespaces: readonly K[],
) {
  return Object.fromEntries(namespaces.map((ns) => [ns, messages[ns]])) as Pick<Messages, K>;
}
