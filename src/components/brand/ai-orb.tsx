import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

/**
 * AI orb (mockup 00-03): marks a proposal from the AI, never used anywhere else.
 * Radial Lime gradient with its halo. Decorative by default; pass `labelled` when it stands alone.
 */
export function AiOrb({
  size = 24,
  className,
  labelled = false,
}: {
  /** Diameter in pixels (24 next to a label, 26–28 on a card). */
  size?: number;
  className?: string;
  labelled?: boolean;
}) {
  const t = useTranslations("ai.orb");
  return (
    <span
      role={labelled ? "img" : undefined}
      aria-label={labelled ? t("aria") : undefined}
      aria-hidden={labelled ? undefined : true}
      style={{ width: size, height: size }}
      className={cx("inline-block shrink-0 rounded-full bg-ai-orb shadow-orb", className)}
    />
  );
}
