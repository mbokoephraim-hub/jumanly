import { Icon } from "@/components/brand/icon";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AiOrb } from "@/components/brand/ai-orb";

/**
 * AI suggestion card (mockup 00-03): AI gradient, orb and Néon label, the suggestion, a
 * « Pourquoi ? » with the eye icon, and the human controls (Appliquer / Ignorer, passed as
 * `actions`). Nothing changes without the user's consent.
 */
export function AiCard({
  children,
  explanation,
  actions,
  label,
}: {
  children: ReactNode;
  explanation: ReactNode;
  actions: ReactNode;
  /** Replaces the default « Jumanly Intelligence » label (e.g. the coach's name). */
  label?: string;
}) {
  const t = useTranslations("ai.card");
  return (
    <section className="relative isolate flex flex-col gap-3 overflow-hidden rounded-box bg-gradient-ai px-[22px] py-5 text-blanc">
      <span
        aria-hidden
        className="absolute -top-20 -right-20 -z-10 size-60 rounded-full border-[18px] border-blanc/10"
      />
      <h3 className="flex items-center gap-2.5 text-lab text-neon">
        <AiOrb />
        {label ?? t("title")}
      </h3>
      <div className="text-sm leading-5 text-blanc/90 [&_strong]:text-blanc">{children}</div>
      <details className="group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-neon underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
          <Icon name="eye" className="size-4" />
          {t("why")}
        </summary>
        <div className="mt-2 rounded-[16px] bg-nuit/35 px-3.5 py-3 text-xs leading-[18px] text-blanc/85">
          {explanation}
        </div>
      </details>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </section>
  );
}
