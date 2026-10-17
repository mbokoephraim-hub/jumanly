/* eslint-disable @next/next/no-img-element -- avatars will come from S3 storage at a known size */
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

const sizes = {
  xs: "size-7 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-11 text-base",
  lg: "size-16 text-xl",
};

/** Initial palettes of the mockups (00-02): never a photo by default, never a person's color. */
const palettes = [
  "bg-lime text-sapin",
  "bg-sapin text-lime",
  "bg-neon text-sapin",
  "bg-ia text-neon",
  "bg-menthe-claire text-sapin",
];

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

/** Stable palette for a name, so that a person keeps the same colors everywhere. */
function paletteFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palettes[hash % palettes.length];
}

export type AvatarSize = keyof typeof sizes;

export function Avatar({
  name,
  image,
  size = "md",
  className,
}: {
  name: string;
  image?: string;
  size?: AvatarSize;
  className?: string;
}) {
  const t = useTranslations("a11y.avatar");
  const classes = cx("inline-flex shrink-0 rounded-full", sizes[size], className);
  if (image)
    return <img src={image} alt={t("text", { name })} className={cx(classes, "object-cover")} />;
  return (
    <span
      role="img"
      aria-label={t("initials", { name })}
      className={cx(
        classes,
        "items-center justify-center font-semibold tracking-[-0.02em]",
        paletteFor(name),
      )}
    >
      {initials(name)}
    </span>
  );
}

const logoSizes = {
  sm: "size-8 rounded-[10px] text-[11px]",
  md: "size-11 rounded-[13px] text-[15px]",
  lg: "size-[52px] rounded-[16px] text-lg",
};

/**
 * Company logo (mockup 00-02): a rounded square with the logo sent by the organization (prompt 4
 * bis), or its initials on the same palettes as avatars.
 */
export function CompanyLogo({
  name,
  size = "md",
  src,
  className,
}: {
  name: string;
  size?: keyof typeof logoSizes;
  /** The saved logo (256 px WebP); the 128 px one is used on small screens. */
  src?: string | null;
  className?: string;
}) {
  const t = useTranslations("a11y.avatar");
  if (src)
    return (
      // Already resized WebP (128 and 256 px).
      <img
        src={src}
        srcSet={`${src.replace(/-256\.webp$/, "-128.webp")} 128w, ${src} 256w`}
        sizes="72px"
        alt={t("logo", { name })}
        loading="lazy"
        decoding="async"
        className={cx("shrink-0 bg-blanc object-cover", logoSizes[size], className)}
      />
    );
  return (
    <span
      role="img"
      aria-label={t("initials", { name })}
      className={cx(
        "inline-flex shrink-0 items-center justify-center font-bold tracking-[-0.03em]",
        logoSizes[size],
        paletteFor(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Overlapping avatars; extra people are summed up in a "+N" bubble. */
export function AvatarStack({
  names,
  max = 4,
  size = "sm",
  ring = "ring-blanc",
}: {
  names: string[];
  max?: number;
  size?: AvatarSize;
  /** Color of the 2 px separating ring: the background the stack sits on. */
  ring?: string;
}) {
  const t = useTranslations("ui.avatarStack");
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((name) => (
        <Avatar key={name} name={name} size={size} className={cx("ring-2", ring)} />
      ))}
      {rest > 0 && (
        <span
          role="img"
          aria-label={t("moreAria", { count: rest })}
          className={cx(
            "inline-flex shrink-0 items-center justify-center rounded-full bg-sapin font-semibold text-neon ring-2",
            ring,
            sizes[size],
          )}
        >
          {t("more", { count: rest })}
        </span>
      )}
    </div>
  );
}
