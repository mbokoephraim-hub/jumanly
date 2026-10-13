import type { Messages } from "next-intl";

type Values = Record<string, string | number | Date>;

/**
 * Translator for keys built at run time (a plan's `contentKey` read from the database, for instance).
 * Typed keys stay the rule; this is only for keys the compiler cannot know.
 */
export type DynamicTranslator = ((key: string, values?: Values) => string) & {
  has(key: string): boolean;
};

export function dynamic(t: unknown): DynamicTranslator {
  return t as DynamicTranslator;
}

/** Numbered texts of a group: `prefix.f1`, `prefix.f2`… until the first missing one. */
export function numbered(t: DynamicTranslator, prefix: string, values?: Values): string[] {
  const result: string[] = [];
  for (let i = 1; t.has(`${prefix}${i}`); i++) result.push(t(`${prefix}${i}`, values));
  return result;
}

/** Child keys of a message group, in file order (e.g. the sections of a legal page). */
export function childKeys(messages: Messages, path: string): string[] {
  let node: unknown = messages;
  for (const part of path.split(".")) node = (node as Record<string, unknown> | undefined)?.[part];
  return node && typeof node === "object" ? Object.keys(node) : [];
}
