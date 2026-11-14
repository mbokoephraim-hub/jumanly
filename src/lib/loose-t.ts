/**
 * A translator called with a key built at run time (`cols.${key}`): next-intl's typed keys only
 * accept literal keys. The keys still come from messages/fr.json; a missing one shows its path.
 */
export type LooseT = (key: string, values?: Record<string, string | number | Date>) => string;
export const loose = (t: unknown) => t as LooseT;
