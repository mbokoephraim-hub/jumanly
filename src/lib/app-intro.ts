/**
 * Welcome intro of the signed-in space (docs/refonte-connexion/BRIEF-CONNEXION-V2.md § 7):
 * when it plays, and which version.
 */

/** Marker added to the address of the space after a successful sign-in. */
export const ARRIVAL_PARAM = "arrivee";
/** « Revoir la présentation » (settings): the full version, even if already seen. */
export const REPLAY_PARAM = "revoir";

export type IntroVersion = "full" | "short" | "toast" | null;

/**
 * - nothing without `?arrivee=1` (a simple navigation, a reload);
 * - in reduced motion (system or account setting), the welcome toast instead;
 * - the full version once per account (or when asked again from the settings), else the short one.
 */
export function introVersion({
  arrival,
  replay = false,
  seenAt,
  reduced,
}: {
  arrival: boolean;
  replay?: boolean;
  seenAt: Date | string | null | undefined;
  reduced: boolean;
}): IntroVersion {
  if (!arrival) return null;
  if (reduced) return "toast";
  return replay || !seenAt ? "full" : "short";
}

/** Destination of a sign-in, with `?arrivee=1` when it is in the signed-in space. */
export function withArrival(path: string): string {
  if (!/^\/app(?:[/?#]|$)/.test(path)) return path;
  const [base, hash] = path.split("#", 2);
  const glue = base.includes("?") ? "&" : "?";
  return `${base}${glue}${ARRIVAL_PARAM}=1${hash === undefined ? "" : `#${hash}`}`;
}

export type IntroProfile = "talent" | "rh" | "company";

/** Version of the intro for the active space; partner spaces see the company one. */
export function introProfile(space: { partner?: boolean; type?: string } | null): IntroProfile {
  if (!space) return "talent";
  if (space.partner || space.type === "company") return "company";
  return "rh";
}

/** Size of a band word: shorter words larger, never wider than the band (in `cqw`). */
export function wordSize(word: string): number {
  return Math.min(5.6, 40 / Math.max(1, [...word].length));
}
