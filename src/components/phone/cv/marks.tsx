/**
 * The marks of « Créer un CV » (docs/carriere-v3, maquette Cv.dc.html): the three ways in, drawn
 * with the same strokes as the mockup, and Orbi's star.
 */
const PATHS = {
  modele: "M5.5 3.5h9l4 4v13h-13zM14.5 3.5v4h4M8.5 11.5h7M8.5 15h7M8.5 18h4",
  import:
    "M12 15.5V4M7.5 8.5 12 4l4.5 4.5M4.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V15",
  orbi: "M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5zM18.5 16.5l.6 2 2 .6-2 .6-.6 2-.6-2-2-.6 2-.6z",
} as const;

export function CvMark({ name, size = 24 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Orbi's four-pointed star, filled. */
export function OrbiSpark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5z"
        fill="currentColor"
      />
    </svg>
  );
}
