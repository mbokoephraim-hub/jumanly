"use client";

import { useState, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { track } from "@/lib/track";

/**
 * « PDF » of a CV (planche talent-4 § 6): a link to the file that works without JavaScript; with
 * it, the button shows « PDF… » while the server prepares the file, saves it and confirms with a
 * toast. A refusal (template above the plan, too many pages) opens the editor with its reason.
 */
export function PdfButton({
  documentId,
  fileName,
  className,
  children,
  labels,
}: {
  documentId: string;
  fileName: string;
  className?: string;
  children: ReactNode;
  labels: { preparing: string; done: string; error: string };
}) {
  const [busy, setBusy] = useState(false);

  async function run(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/cv/${documentId}/export?format=pdf`, { method: "POST" });
      if (!response.ok) {
        window.location.assign(new URL(`/app/career/cv/${documentId}/pdf`, window.location.origin));
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      showToast({ message: labels.done, tone: "success" });
      track("cv_downloaded", { mode: "download" });
    } catch {
      showToast({ message: labels.error, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <a
      href={`/app/career/cv/${documentId}/pdf`}
      download={fileName}
      onClick={run}
      aria-busy={busy}
      className={className}
    >
      {busy ? (
        <>
          <span aria-hidden className="t-roue" />
          {labels.preparing}
        </>
      ) : (
        children
      )}
    </a>
  );
}
