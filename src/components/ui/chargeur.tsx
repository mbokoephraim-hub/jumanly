import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

const tailles = { sm: "size-4 border-2", md: "size-6 border-[3px]", lg: "size-10 border-4" };

export function Chargeur({
  taille = "md",
  className,
}: {
  taille?: keyof typeof tailles;
  className?: string;
}) {
  const t = useTranslations("composants");
  return (
    <span
      role="status"
      aria-label={t("chargement")}
      className={cx(
        "inline-block animate-spin rounded-full border-current border-r-transparent",
        tailles[taille],
        className,
      )}
    />
  );
}
