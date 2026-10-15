/**
 * Entry screen of /connexion and /inscription (docs/refonte-connexion/BRIEF-CONNEXION-V2.md):
 * which profile the stage shows, and how its texts are cut into animated words.
 */

export const entryRoles = ["talent", "rh", "company"] as const;
export type EntryRole = (typeof entryRoles)[number];

/** Key under which the last profile chosen on this device is kept (`localStorage`). */
export const ENTRY_ROLE_STORAGE = "jm-role";

const isEntryRole = (value: unknown): value is EntryRole =>
  typeof value === "string" && (entryRoles as readonly string[]).includes(value);

/**
 * Profile shown on arrival: `?profil=` first, then the last choice on this device, else Talent.
 * The partner profile is not offered here (it keeps /activer and /partenaires).
 */
export function pickEntryRole(param?: string | null, stored?: string | null): EntryRole {
  if (isEntryRole(param)) return param;
  if (isEntryRole(stored)) return stored;
  return "talent";
}

export type HookWord = { text: string; hl: boolean };

/**
 * Cuts a text of `textes/` into words, the ones between `<hl>` and `</hl>` marked for the
 * Signature gradient. Punctuation stays glued to the word before it (« ? » after a
 * non-breaking space), so it never starts a line.
 */
export function splitHook(raw: string): HookWord[] {
  const words: HookWord[] = [];
  for (const [index, part] of raw.split(/<\/?hl>/).entries()) {
    const hl = index % 2 === 1;
    for (const text of part.split(/\s+/).filter(Boolean)) {
      const previous = words.at(-1);
      if (previous && /^[,.]/.test(text)) previous.text += text;
      else if (previous && /^[?!:;»]+$/.test(text)) previous.text += `\u00a0${text}`;
      else words.push({ text, hl });
    }
  }
  return words;
}
