"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/brand/icon";
import { AiChip } from "@/components/ui/ai-chip";
import { cx } from "@/lib/cx";
import { saveIntroAction, type IntroState } from "@/server/actions/profile";

/**
 * Title and bio of the phone profile (screen 25). Saved when a field is left after a change; the
 * fixed bar says « Enregistré » only once the server has answered.
 */
export function IntroForm({
  headline,
  summary,
  max,
  labels,
  preview,
}: {
  headline: string;
  summary: string;
  max: number;
  labels: {
    headline: string;
    headlinePlaceholder: string;
    bio: string;
    bioHint: string;
    bioPlaceholder: string;
    /** « {count} / {max} ». */
    counter: string;
    ai: string;
    aiSoon: string;
    saved: string;
    saving: string;
    error: string;
    idle: string;
  };
  /** The main action of the fixed bar. */
  preview: ReactNode;
}) {
  const [state, action, pending] = useActionState<IntroState, FormData>(saveIntroAction, {
    status: "idle",
  });
  const form = useRef<HTMLFormElement>(null);
  const saved = useRef({ headline, summary });
  const [count, setCount] = useState(summary.length);
  const saveIfChanged = () => {
    const data = new FormData(form.current!);
    const next = { headline: String(data.get("headline")), summary: String(data.get("summary")) };
    if (next.headline === saved.current.headline && next.summary === saved.current.summary) return;
    saved.current = next;
    form.current!.requestSubmit();
  };
  const status = pending
    ? labels.saving
    : state.status === "error"
      ? labels.error
      : state.status === "saved"
        ? labels.saved
        : labels.idle;

  return (
    <form ref={form} action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="phone-headline" className="text-[16px] font-semibold">
          {labels.headline}
        </label>
        <input
          id="phone-headline"
          name="headline"
          defaultValue={headline}
          maxLength={120}
          placeholder={labels.headlinePlaceholder}
          onBlur={saveIfChanged}
          className="h-14 rounded-[18px] bg-blanc px-5 text-[17px] ring-2 shadow-douce ring-transparent outline-none placeholder:text-ardoise focus-visible:ring-sapin"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="phone-bio" className="text-[16px]">
          <span className="font-semibold">{labels.bio}</span>
          <span className="text-ardoise">
            {" · "}
            {labels.bioHint}
          </span>
        </label>
        <textarea
          id="phone-bio"
          name="summary"
          defaultValue={summary}
          maxLength={max}
          rows={4}
          placeholder={labels.bioPlaceholder}
          aria-describedby="phone-bio-count"
          onChange={(event) => setCount(event.target.value.length)}
          onBlur={saveIfChanged}
          className="field-sizing-content min-h-28 resize-none rounded-[20px] bg-blanc px-5 py-4 text-[16px] leading-6 ring-2 shadow-douce ring-transparent outline-none placeholder:text-ardoise focus-visible:ring-sapin"
        />
        <div className="flex items-center justify-between gap-3">
          {/* Jumanly AI arrives with prompt 8: the chip shows where, without acting. */}
          <AiChip tone="suggestion" disabled aria-describedby="phone-bio-ai">
            {labels.ai}
          </AiChip>
          <span id="phone-bio-ai" className="sr-only">
            {labels.aiSoon}
          </span>
          <span id="phone-bio-count" className="text-[15px] text-ardoise">
            {labels.counter.replace("{count}", String(count)).replace("{max}", String(max))}
          </span>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-brume bg-creme/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <p
          role="status"
          className={cx(
            "flex shrink-0 items-center gap-1.5 text-[15px] font-semibold",
            state.status === "error" ? "text-down-texte" : "text-feuille-fonce",
          )}
        >
          {!pending && state.status !== "error" && (
            <Icon name="check" className="size-4 shrink-0" />
          )}
          <span className="min-w-0">{status}</span>
        </p>
        <div className="ml-auto min-w-0 flex-1">{preview}</div>
      </div>
    </form>
  );
}
