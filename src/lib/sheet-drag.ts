/**
 * Heights of a bottom sheet that can be dragged (demande d'Ephraïm du 29/10/2026, comme Instagram):
 * closed (0), half (about half of the screen) and expanded (its full height, up to the top of the
 * screen). A sheet whose content fits in the half opens at its own height, with two states only.
 */

/** Part of the screen the half state takes. */
export const HALF_RATIO = 0.52;
/** A sheet taller than this part of the screen opens at the half state. */
const OPENS_HALF_ABOVE = 0.6;
/** A flick faster than this (px/ms) goes to the next state in its direction. */
const FLICK = 0.55;

/** Open heights of a sheet, lowest first: [half, full], or [full] for a short sheet. */
export function sheetStops(fullHeight: number, viewport: number): number[] {
  const half = Math.round(viewport * HALF_RATIO);
  return fullHeight > viewport * OPENS_HALF_ABOVE ? [half, fullHeight] : [fullHeight];
}

/**
 * Height the sheet settles at when the finger leaves it: `visible` is the height shown at that
 * moment, `velocity` its speed (px/ms, positive when going down). 0 closes it.
 */
export function settleHeight(visible: number, velocity: number, stops: number[]): number {
  const lowest = stops[0] ?? 0;
  const points = [0, ...stops];
  if (velocity > FLICK) {
    const below = points.filter((p) => p < visible - 1);
    return below.length ? below[below.length - 1] : 0;
  }
  if (velocity < -FLICK) {
    return points.find((p) => p > visible + 1) ?? stops[stops.length - 1] ?? 0;
  }
  if (visible < lowest) {
    // Drawn down enough (a third of its height, or 140 px): it closes; otherwise it comes back.
    return lowest - visible > Math.min(140, lowest * 0.3) ? 0 : lowest;
  }
  return stops.reduce((best, p) => (Math.abs(p - visible) < Math.abs(best - visible) ? p : best));
}
