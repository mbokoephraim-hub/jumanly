import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { AiOrb } from "@/components/brand/ai-orb";

/**
 * AI suggestion card (§ 11.6): content on the AI gradient, a "Why?" panel and the human
 * controls (Apply / Ignore, passed as `actions`). Nothing changes without the user's consent.
 */
export function AiCard({
  children,
  explanation,
  actions,
}: {
  children: ReactNode;
  explanation: ReactNode;
  actions: ReactNode;
}) {
  const t = useTranslations("ai.card");
  return (
    <section className="flex flex-col gap-3 rounded-card bg-gradient-ai p-5 text-blanc">
      <h3 className="flex items-center gap-2 text-neon text-label">
        <AiOrb />
        {t("title")}
      </h3>
      <div className="text-[15px] leading-6">{children}</div>
      <details>
        <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-lime underline-offset-4 hover:underline">
          <Eye aria-hidden className="size-4" />
          {t("why")}
        </summary>
        <div className="mt-2 text-sm leading-6">{explanation}</div>
      </details>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </section>
  );
}
