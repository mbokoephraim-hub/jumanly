"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { track } from "@/lib/track";

type State = "idle" | "preparing" | "done" | "error";

const noSubscription = () => () => {};

/**
 * The « PDF » of a CV on a phone (screens 29, 56): a link to the file that works without
 * JavaScript; with it, the button shows « PDF… » while the server prepares the file, saves it (or
 * hands it to the phone's share sheet) and confirms with a toast.
 */
export function PdfButton({
  documentId,
  fileName,
  mode = "download",
  raised = false,
  className,
  children,
  labels,
}: {
  documentId: string;
  fileName: string;
  mode?: "download" | "share";
  /** The page has its own fixed bar: the toast sits above it. */
  raised?: boolean;
  className?: string;
  children: ReactNode;
  labels: { preparing: string; preparingLabel: string; done: string; error: string };
}) {
  const [state, setState] = useState<State>("idle");
  // The toast goes to the body: an entrance animation of the page would pin it to the page.
  const mounted = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  // The toast goes away by itself; a new click starts again.
  useEffect(() => {
    if (state !== "done" && state !== "error") return;
    const timer = window.setTimeout(() => setState("idle"), 4000);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function run(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (state === "preparing") return;
    setState("preparing");
    try {
      const response = await fetch(`/api/cv/${documentId}/export?format=pdf`, { method: "POST" });
      if (!response.ok) {
        // The editor explains the refusal (plan, too many pages): the link takes the person there.
        window.location.assign(new URL(`/app/career/cv/${documentId}/pdf`, window.location.origin));
        return;
      }
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: "application/pdf" });
      if (mode === "share" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
      setState("done");
      track("cv_downloaded", { mode });
    } catch (error) {
      // Closing the share sheet is not a failure.
      setState(error instanceof DOMException && error.name === "AbortError" ? "idle" : "error");
    }
  }

  return (
    <>
      <a
        href={`/app/career/cv/${documentId}/pdf`}
        download={fileName}
        onClick={run}
        aria-busy={state === "preparing"}
        className={className}
      >
        {state === "preparing" ? (
          <>
            <span
              aria-hidden
              className="size-5 shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current motion-reduce:animate-none"
            />
            <span aria-hidden>{labels.preparing}</span>
            <span className="sr-only">{labels.preparingLabel}</span>
          </>
        ) : (
          children
        )}
      </a>
      {mounted &&
        createPortal(
          <p
            role="status"
            className={cx(
              "fixed inset-x-4 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-[18px] bg-sapin px-5 py-4 text-[16px] text-blanc shadow-float",
              raised
                ? "bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.5rem)]"
                : "bottom-[max(1rem,env(safe-area-inset-bottom))]",
              state === "done" || state === "error" ? "" : "hidden",
            )}
          >
            {state === "done" && <Icon name="check" className="size-5 shrink-0 text-lime" />}
            {state === "done" ? labels.done : state === "error" ? labels.error : null}
          </p>,
          document.body,
        )}
    </>
  );
}
