/** True when animations must not play: the system setting, or « Réduire les animations ». */
export function motionReduced() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.querySelector("[data-reduce-motion]") !== null
  );
}
