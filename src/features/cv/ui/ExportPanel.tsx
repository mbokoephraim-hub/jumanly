"use client";

import { useState } from "react";
import { Icon } from "@/components/brand/icon";
import { card, pillClass } from "@/components/career/kit";
import { cx } from "@/lib/cx";
import { usePaginationResult } from "../render/CvPreview";
import { MAX_PAGES } from "../style";

export type ExportLabels = {
  title: string;
  pdf: string;
  /** « {fileName} · # pages · texte sélectionnable » for 1, 2, 3… pages. */
  fileLines: string[];
  download: string;
  preparing: string;
  ready: string;
  error: string;
  overMax: string;
  locked: string;
  neutral: string;
};

type State = "idle" | "preparing" | "ready" | "error" | "overMax" | "locked";

/**
 * « Exporter mon CV » (docs/modeles-cv § 8.2): POST /api/cv/[documentId]/export, then the file is
 * saved by the browser. The server checks the plan and the page limit again.
 */
export function ExportPanel({
  documentId,
  fileName,
  locked,
  labels,
}: {
  documentId: string;
  fileName: string;
  /** The plan no longer includes the template (§ 8.4, « Forfait rétrogradé »). */
  locked: boolean;
  labels: ExportLabels;
}) {
  const result = usePaginationResult();
  const [state, setState] = useState<State>(locked ? "locked" : "idle");
  const pages = result?.pages ?? 0;
  const tooMany = pages > MAX_PAGES;

  async function download() {
    setState("preparing");
    try {
      const response = await fetch(`/api/cv/${documentId}/export?format=pdf`, { method: "POST" });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setState(
          body.error === "overMax" ? "overMax" : body.error === "locked" ? "locked" : "error",
        );
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  const message = {
    idle: null,
    preparing: labels.preparing,
    ready: labels.ready,
    error: labels.error,
    overMax: labels.overMax,
    locked: labels.locked,
  }[tooMany && state !== "locked" ? "overMax" : state];

  return (
    <section aria-labelledby="cv-export" className={cx(card, "flex flex-col gap-3 lg:p-5")}>
      <h2 id="cv-export" className="text-[17px] font-semibold">
        {labels.title}
      </h2>
      <p className="flex items-center gap-2.5 rounded-[16px] bg-blanc px-4 py-3 text-sm font-semibold ring-2 ring-sapin">
        <Icon name="doc" className="size-4" />
        <span className="flex-1">{labels.pdf}</span>
        <span className="grid size-6 place-items-center rounded-full bg-lime">
          <Icon name="check" className="size-3.5" />
        </span>
      </p>
      {pages > 0 && (
        <p className="text-xs leading-[1.5] [overflow-wrap:anywhere] text-ardoise">
          {labels.fileLines[Math.min(pages, labels.fileLines.length) - 1]}
        </p>
      )}
      <button
        type="button"
        onClick={download}
        disabled={state === "preparing" || state === "locked" || tooMany}
        className={pillClass("dark", "md", "w-full")}
      >
        <Icon name="telecharger" className="size-4" />
        {labels.download}
      </button>
      <p
        role="status"
        className={cx(
          "text-sm",
          state === "ready" || state === "preparing"
            ? "text-feuille-fonce"
            : "font-semibold text-down-texte",
        )}
      >
        {message}
      </p>
      <p className="text-center text-xs text-ardoise">{labels.neutral}</p>
    </section>
  );
}
