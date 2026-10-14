"use client";

import { useTranslations } from "next-intl";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Page 500 (partie 07, textes « system.500 »). The error itself is already logged and reported on
 * the server (`src/instrumentation.ts`); the reference lets support find it.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("system");
  return (
    <main id="content" className="flex min-h-dvh items-center bg-creme">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 page-x py-16 text-center">
        <p className="text-eyebrow text-ardoise">{t("500.code")}</p>
        <h1 className="text-h1">{t("500.title")}</h1>
        <p className="text-lg text-ardoise">{t("500.body")}</p>
        {error.digest && (
          <p className="text-sm text-ardoise">{t("error.reference", { ref: error.digest })}</p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={reset}>
            {t("500.cta.retry")}
          </Button>
          <ButtonLink href="/" variant="tertiary">
            {t("500.cta.home")}
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
