/* eslint-disable @next/next/no-img-element -- avatars will come from S3 storage at a known size */
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

const sizes = { sm: "size-8 text-xs", md: "size-11 text-sm", lg: "size-16 text-lg" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function Avatar({
  name,
  image,
  size = "md",
  className,
}: {
  name: string;
  image?: string;
  size?: keyof typeof sizes;
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
      className={cx(classes, "items-center justify-center bg-sapin font-semibold text-lime")}
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
}: {
  names: string[];
  max?: number;
  size?: keyof typeof sizes;
}) {
  const t = useTranslations("ui.avatarStack");
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((name) => (
        <Avatar key={name} name={name} size={size} className="ring-2 ring-creme" />
      ))}
      {rest > 0 && (
        <span
          role="img"
          aria-label={t("moreAria", { count: rest })}
          className={cx(
            "inline-flex shrink-0 items-center justify-center rounded-full bg-brume font-semibold text-sapin ring-2 ring-creme",
            sizes[size],
          )}
        >
          {t("more", { count: rest })}
        </span>
      )}
    </div>
  );
}
