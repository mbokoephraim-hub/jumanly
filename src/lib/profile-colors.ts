/**
 * The colours of a person's profile (docs/profil-personne § À propos): each skill has its own,
 * stable colour, drawn from its name (the same skill has the same colour everywhere), in the
 * palette of the brief. Shared by the server and the browser.
 */
export const PROFILE_PALETTE = {
  lime: "#A6F26B",
  menthe: "#2FD3A6",
  ambre: "#F4C463",
  ciel: "#7CC4FF",
  corail: "#FF8A7A",
  lilas: "#C3A6FF",
  sable: "#E8D3A6",
  rose: "#FF9EC7",
} as const;

export type ProfileColor = keyof typeof PROFILE_PALETTE;
export const PROFILE_COLORS = Object.keys(PROFILE_PALETTE) as ProfileColor[];

/** « Power BI », « power bi » and « Power  BI » are the same skill. */
const fold = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

/** A small stable hash (FNV-1a), the same on the server and in the browser. */
function hash(value: string) {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193);
  }
  return result >>> 0;
}

/** The colour of a skill, a company or a family: the same name, the same colour. */
export function colorOf(name: string): ProfileColor {
  return PROFILE_COLORS[hash(fold(name)) % PROFILE_COLORS.length]!;
}

/**
 * The part of each family of skills (the bar above the skills): the largest first, in whole
 * percents adding up to 100, at most `take` families (the rest joins the last one shown).
 */
export function familyShares(categories: string[], take = 3) {
  if (categories.length === 0) return [];
  const counts = new Map<string, number>();
  for (const category of categories) counts.set(category, (counts.get(category) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const kept = sorted.slice(0, take);
  const rest = sorted.slice(take).reduce((sum, [, count]) => sum + count, 0);
  if (rest > 0)
    kept[kept.length - 1] = [kept[kept.length - 1]![0], kept[kept.length - 1]![1] + rest];
  const total = categories.length;
  const shares = kept.map(([family, count]) => ({
    family,
    share: Math.round((count * 100) / total),
  }));
  // Rounding never leaves the bar at 99 or 101 %.
  const gap = 100 - shares.reduce((sum, item) => sum + item.share, 0);
  shares[0]!.share += gap;
  return shares;
}
