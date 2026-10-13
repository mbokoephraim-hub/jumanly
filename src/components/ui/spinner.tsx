import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

const sizes = { sm: "size-4 border-2", md: "size-6 border-[3px]", lg: "size-10 border-4" };

export function Spinner({
  size = "md",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  const t = useTranslations("ui");
  return (
    <span
      role="status"
      aria-label={t("loading")}
      className={cx(
        "inline-block animate-spin rounded-full border-current border-r-transparent",
        sizes[size],
        className,
      )}
    />
  );
}
