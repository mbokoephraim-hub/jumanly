"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { applyAction } from "@/server/actions/jobs";
import { TalentIcon } from "./icon";

const isRedirect = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "digest" in error &&
  String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");

/**
 * « Envoyer ma candidature » (planche talent-2 § 1, step 3). « Candidature envoyée » comes only from
 * the server's answer. When the request does not reach the server, the bar says the application is
 * not sent yet and the draft is kept, and offers « Réessayer ». Without JavaScript the form works.
 */
export function ApplySend({
  hidden,
  laterHref,
  before,
  labels,
}: {
  hidden: Record<string, string>;
  laterHref: string;
  /** Shown before « Envoyer » on a large screen (« Retour », planche web talent-2 § 1). */
  before?: ReactNode;
  labels: {
    send: string;
    sending: string;
    failedTitle: string;
    failedText: string;
    retry: string;
    later: string;
  };
}) {
  const [failed, setFailed] = useState(false);
  const [sending, startSending] = useTransition();

  // Sent by hand, not as a form action: the redirect of the server is followed by Next.js, and a
  // cut connection leaves the screen as it is, with the draft kept on the server.
  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFailed(false);
    startSending(async () => {
      try {
        await applyAction(formData);
      } catch (error) {
        if (!isRedirect(error)) setFailed(true);
      }
    });
  };

  return (
    <form action={applyAction} onSubmit={send} className="contents">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {failed && (
        <p role="alert" className="t-gar t-err">
          <TalentIcon name="hors-ligne" size="s" />
          <span>
            <b>{labels.failedTitle}</b> {labels.failedText}
          </span>
        </p>
      )}
      <div className="t-verre t-fort t-bas-f">
        {failed ? (
          <Link href={laterHref} className="t-bt t-sec t-m t-press">
            {labels.later}
          </Link>
        ) : (
          before
        )}
        <button type="submit" className="t-bt t-a t-pl t-press" aria-busy={sending}>
          <TalentIcon name="envoyer" size="s" />
          {sending ? labels.sending : failed ? labels.retry : labels.send}
        </button>
      </div>
    </form>
  );
}
