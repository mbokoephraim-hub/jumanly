/* eslint-disable @next/next/no-img-element -- photos of the Fil: small, already reduced */

/**
 * The initials (or the photo) of a person or an organization in the Fil: a round for a person,
 * a rounded square for an organization, always the same colour for the same name.
 */
export function FilAvatar({
  initials,
  image,
  tone,
  org,
  size = 40,
  me = false,
}: {
  initials: string;
  image: string | null;
  tone: number;
  org: boolean;
  size?: number;
  /** The viewer: lime, as in the mockup. */
  me?: boolean;
}) {
  return (
    <span
      className="nb-av nb-fil-av"
      data-org={org ? "" : undefined}
      data-ton={me ? "moi" : String(tone)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.33) }}
      aria-hidden
    >
      {image ? <img src={image} alt="" width={size} height={size} /> : initials}
    </span>
  );
}
