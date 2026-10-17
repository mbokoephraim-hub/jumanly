"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/brand/icon";
import { Button } from "@/components/ui";
import { applyAction } from "@/server/actions/jobs";

/**
 * The last step of the staged application (screens 10-12). « Candidature envoyée » comes only
 * from the server's answer (its redirect). If the request does not reach the server, the screen
 * says the application is not sent yet, that the draft is kept, and offers « Réessayer ».
 */
export function SendApplication({
  children,
  hidden,
  labels,
  previousHref,
  laterHref,
  savedAt,
}: {
  /** The review blocks and the consent box. */
  children: ReactNode;
  hidden: Record<string, string>;
  labels: {
    submit: string;
    sending: string;
    previous: string;
    errorTitle: string;
    errorBody: string;
    state: string;
    draft: string;
    lastSave: string;
    later: string;
    retry: string;
  };
  previousHref: string;
  laterHref: string;
  savedAt: string;
}) {
  const [failed, setFailed] = useState(false);
  const [sending, startSending] = useTransition();

  // Sent by hand rather than as a form action: React resets a form after its action, which
  // would untick the consent box before « Réessayer ». Without JavaScript the action still works.
  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFailed(false);
    startSending(async () => {
      try {
        await applyAction(formData);
      } catch (error) {
        // The server's redirect travels as an error: Next.js follows it on its own.
        if (
          typeof error === "object" &&
          error !== null &&
          "digest" in error &&
          String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")
        )
          return;
        setFailed(true);
      }
    });
  };

  return (
    <form action={applyAction} onSubmit={send} className="flex flex-col gap-4">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {failed && (
        <div role="alert" className="flex flex-col gap-3">
          <div className="flex items-start gap-3 rounded-[22px] bg-[#FDF3DF] p-4">
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-[#FCE3B0] text-[#8A5A00]"
            >
              <Icon name="notification" className="size-5" />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-[15.5px] leading-snug font-semibold">{labels.errorTitle}</span>
              <span className="text-[13.5px] text-[#6B4A00]">{labels.errorBody}</span>
            </span>
          </div>
          {/* `.kv` of screen 12: the label on the left, its value right-aligned on the same line. */}
          <dl className="rounded-[22px] bg-blanc px-3.5 py-1 shadow-douce">
            <div className="flex min-h-[54px] items-center justify-between gap-3">
              <dt className="text-[12.5px] whitespace-nowrap text-ardoise">{labels.state}</dt>
              <dd className="rounded-pill bg-[#FFF0CC] px-[11px] py-[5px] text-right text-[12px] font-semibold whitespace-nowrap text-[#7A5200]">
                {labels.draft}
              </dd>
            </div>
            <div className="flex min-h-[54px] items-center justify-between gap-3 border-t border-sapin/7">
              <dt className="text-[12.5px] whitespace-nowrap text-ardoise">{labels.lastSave}</dt>
              <dd className="text-right text-[13.5px] font-semibold">{savedAt}</dd>
            </div>
          </dl>
        </div>
      )}
      <div className={failed ? "hidden" : "flex flex-col gap-4"}>{children}</div>
      <div className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 flex items-center gap-3 rounded-[22px] bg-blanc p-3 shadow-float md:static md:justify-end md:bg-transparent md:p-0 md:shadow-none">
        {failed ? (
          <Link
            href={laterHref}
            className="flex h-12 items-center rounded-pill bg-blanc px-5 text-[15px] font-semibold ring-[1.5px] ring-brume ring-inset"
          >
            {labels.later}
          </Link>
        ) : (
          <Link
            href={previousHref}
            aria-label={labels.previous}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-blanc ring-[1.5px] ring-brume ring-inset"
          >
            <Icon name="chev-l" className="size-5" />
          </Link>
        )}
        <Button
          type="submit"
          variant="principal"
          size="L"
          arrow
          loading={sending}
          className="flex-1 md:flex-none"
        >
          {sending ? labels.sending : failed ? labels.retry : labels.submit}
        </Button>
      </div>
    </form>
  );
}
