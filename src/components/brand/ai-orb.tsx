import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

/**
 * AI orb (§ 11.6): marks a proposal from the AI, never used anywhere else.
 * Decorative by default; pass `labelled` when it stands alone without text.
 */
export function AiOrb({ className, labelled = false }: { className?: string; labelled?: boolean }) {
  const t = useTranslations("ai.orb");
  return (
    <span
      role={labelled ? "img" : undefined}
      aria-label={labelled ? t("aria") : undefined}
      aria-hidden={labelled ? undefined : true}
      className={cx(
        "inline-block size-3 shrink-0 rounded-full bg-ai-orb shadow-[0_0_10px_rgb(166_242_107/0.7)]",
        className,
      )}
    />
  );
}
