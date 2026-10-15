/* eslint-disable @next/next/no-img-element -- this page must show even when the rest fails */
"use client";

import texts from "../../../messages/fr.systeme.json";
import { Button, ButtonLink } from "@/components/ui/button";
import { SystemActions, SystemCode } from "./system-page";

const t = texts.system;

/**
 * Page 500 (mockup 08-03): a light page with no dependency on the layout (logo, message, two
 * buttons). Its texts come from `messages/fr.systeme.json`, so it also works in `global-error.tsx`.
 * The error itself is already logged and reported on the server (`src/instrumentation.ts`); the
 * reference lets support find it.
 */
export function ServerError({ digest, onRetry }: { digest?: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col bg-creme text-sapin">
      <div className="px-4 py-5 lg:px-[120px] lg:py-9">
        <img
          src="/marque/jumanly-logo-principal.svg"
          alt={texts.common.brand}
          width={145}
          height={30}
          className="h-[30px] w-auto lg:h-[34px]"
        />
      </div>
      <main id="content" className="flex flex-1 items-center">
        <div className="mx-auto flex w-full max-w-[1248px] flex-col items-center gap-6 px-4 text-center lg:flex-row lg:gap-16 lg:px-6 lg:text-left">
          <div className="flex w-full max-w-[560px] flex-col items-center gap-5 lg:items-start">
            <SystemCode code={t["500"].code} />
            <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.025em] lg:text-[36px] lg:leading-[42px]">
              {t["500"].title}
            </h1>
            <p className="text-base leading-[26px] text-ardoise lg:text-lg lg:leading-7">
              {t["500"].body}
            </p>
            {digest && (
              <p className="text-sm text-ardoise">{t.error.reference.replace("{ref}", digest)}</p>
            )}
            <SystemActions>
              <Button type="button" size="lg" onClick={onRetry}>
                {t["500"].cta.retry}
              </Button>
              <ButtonLink href="/" size="lg" variant="tertiary">
                {t["500"].cta.home}
              </ButtonLink>
            </SystemActions>
          </div>
          <img
            src="/illustrations/jumanly-kofi-perplexe.svg"
            alt=""
            height={380}
            className="h-[220px] w-auto shrink-0 lg:h-[380px]"
          />
        </div>
      </main>
      <p className="p-6 text-center text-[11px] leading-[15px] text-ardoise">{t["500"].footer}</p>
    </div>
  );
}
