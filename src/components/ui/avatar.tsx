/* eslint-disable @next/next/no-img-element -- avatars will come from S3 storage at a known size */
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
}: {
  name: string;
  image?: string;
  size?: keyof typeof sizes;
}) {
  const classes = cx("inline-flex shrink-0 rounded-full", sizes[size]);
  if (image) return <img src={image} alt={name} className={cx(classes, "object-cover")} />;
  return (
    <span
      role="img"
      aria-label={name}
      className={cx(classes, "items-center justify-center bg-sapin font-semibold text-lime")}
    >
      {initials(name)}
    </span>
  );
}
