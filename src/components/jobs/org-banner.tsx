import { cx } from "@/lib/cx";

/** Same widths as `BRAND_WIDTHS.banner` (src/server/services/organization-brand.ts). */
const widths = [640, 1000, 1500];

/**
 * Banner of a company (V6 § B9): the 3:1 image sent by the organization, or the Jumanly pattern
 * (Sapin gradient, Lime orbits) when it has none. Decorative: the company's name is always written
 * next to it.
 */
export function OrgBanner({
  src,
  sizes = "(min-width: 1024px) 640px, 100vw",
  priority = false,
  className,
}: {
  src?: string | null;
  sizes?: string;
  /** The banner at the top of a job page: loaded at once. */
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cx(
        "relative overflow-hidden bg-[linear-gradient(120deg,#0F3F37,#14745F_60%,#1FA98A)]",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- already resized WebP (640 to 1500 px)
        <img
          src={src}
          srcSet={widths
            .map((width) => `${src.replace(/-\d+\.webp$/, `-${width}.webp`)} ${width}w`)
            .join(", ")}
          sizes={sizes}
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 300 90"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 size-full"
        >
          <g fill="none" stroke="#A6F26B" strokeOpacity=".35">
            <circle cx="240" cy="20" r="30" />
            <circle cx="240" cy="20" r="55" />
            <circle cx="240" cy="20" r="80" />
          </g>
          <circle cx="240" cy="20" r="10" fill="#A6F26B" />
        </svg>
      )}
    </div>
  );
}
