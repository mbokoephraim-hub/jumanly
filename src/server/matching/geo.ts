/** Countries and cities compared without accents, case or common variants (« RD Congo » = CD). */
import { african, others } from "@/config/countries";

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const aliases: Record<string, string> = {
  "rd congo": "CD",
  rdc: "CD",
  "republique democratique du congo": "CD",
  "congo kinshasa": "CD",
  "congo brazzaville": "CG",
  "republique du congo": "CG",
  congo: "CG",
  "cote d ivoire": "CI",
  "cote divoire": "CI",
  "ivory coast": "CI",
};

let byName: Map<string, string> | null = null;

/** ISO code of a country written as a name (French or English) or a code; null if unknown. */
export function countryCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  const folded = fold(trimmed);
  if (aliases[folded]) return aliases[folded];
  if (!byName) {
    byName = new Map();
    const codes = [...african, ...others];
    for (const locale of ["fr-FR", "en"]) {
      const names = new Intl.DisplayNames([locale], { type: "region" });
      for (const code of codes) byName.set(fold(names.of(code) ?? code), code);
    }
  }
  return byName.get(folded) ?? null;
}

export function sameCity(a: string | null, b: string | null) {
  return Boolean(a && b && fold(a) === fold(b));
}

export { fold };
