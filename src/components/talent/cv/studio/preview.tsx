"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { showToast } from "@/components/motion/toaster";
import { CvPreview, usePaginationResult } from "@/features/cv/render/CvPreview";
import type { CvDocumentProps } from "@/features/cv/render/CvDocument";
import { cx } from "@/lib/cx";
import { track } from "@/lib/track";
import { TalentIcon } from "../../icon";
import { WideOnly } from "./wide-only";

/** Width of an A4 page in CSS pixels, as `CvPreview` lays it out. */
const PAGE_WIDTH = 794;

/**
 * The A4 page of the studio, of a CV card or of the gallery (planche studio-cv `.page`): the CV
 * exactly as it will be downloaded, white in light and dark modes. `highlight` lists the blocks
 * Orbi changes (`summary`, `headline`, `experience`): they are outlined in Lime with `mark`.
 */
export function CvPage({
  id,
  label,
  highlight = [],
  mark,
  className,
  ...props
}: CvDocumentProps & {
  id?: string;
  label?: string;
  highlight?: string[];
  mark?: string;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={cx("t-sc-page", className)}
      data-hl={highlight.length > 0 ? highlight.join(" ") : undefined}
      style={mark ? ({ "--t-sc-hl": JSON.stringify(mark) } as CSSProperties) : undefined}
    >
      <WideOnly>
        <CvPreview {...props} label={label} />
      </WideOnly>
    </div>
  );
}

/** « 100 % · 1 page sur 2 au maximum » above the page: its scale and its page count. */
export function ZoomBar({
  target,
  labels,
}: {
  /** Id of the `CvPage` measured. */
  target: string;
  labels: { zoom: string; pages: { one: string; other: string } };
}) {
  const result = usePaginationResult();
  const [percent, setPercent] = useState<number | null>(null);
  useEffect(() => {
    const node = document.getElementById(target);
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? PAGE_WIDTH;
      setPercent(Math.round(Math.min(1, width / PAGE_WIDTH) * 100));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);
  const pages = result?.pages ?? 0;
  return (
    <p className="t-sc-zoom" aria-live="polite">
      {percent !== null && <span>{labels.zoom.replace("{percent}", String(percent))}</span>}
      {pages > 0 &&
        (pages === 1 ? labels.pages.one : labels.pages.other).replace("#", String(pages))}
    </p>
  );
}

/**
 * The thumbnails of the « Pages » card (planche `.pgs`): a copy of each page of the preview, drawn
 * small, then the empty slot of the next page. Decorative: the page count is said in words.
 */
export function PageThumbs({ target, add }: { target: string; add: string }) {
  const result = usePaginationResult();
  const host = useRef<HTMLDivElement>(null);
  const pages = result?.pages ?? 0;
  useEffect(() => {
    const node = host.current;
    const article = document.querySelector(`#${target} article.cv`);
    if (!node || !article) return;
    const sources = article.querySelectorAll(".cv-pages > .cv-page");
    node.querySelectorAll<HTMLElement>("[data-vignette]").forEach((slot, index) => {
      slot.replaceChildren();
      const page = sources[index];
      if (!page) return;
      // The article's classes and variables (accent, font, density) style the copied page.
      const shell = article.cloneNode(false) as HTMLElement;
      shell.removeAttribute("id");
      const holder = document.createElement("div");
      holder.className = "cv-pages";
      holder.append(page.cloneNode(true));
      shell.append(holder);
      shell.style.width = `${PAGE_WIDTH}px`;
      shell.style.transformOrigin = "top left";
      shell.style.transform = `scale(${slot.clientWidth / PAGE_WIDTH})`;
      slot.append(shell);
    });
  }, [result, target]);
  return (
    <div ref={host} className="t-sc-pgs" aria-hidden>
      {Array.from({ length: Math.max(1, pages) }, (_, index) => (
        <div key={index} className={cx(index === 0 && "t-on")}>
          <span className="t-sc-vgn" data-vignette="" />
          {index + 1}
        </div>
      ))}
      <div>
        <span className="t-sc-add">
          <TalentIcon name="plus" size="s" />
        </span>
        {pages + 1 || 2}
        <span className="sr-only">{add}</span>
      </div>
    </div>
  );
}

type Format = "pdf" | "docx";

/**
 * « Exporter mon CV » (planche studio-cv § 3 `.fmt`): PDF (recommended, exactly the page shown) or
 * Word (one column, to edit), the file's name and its pages, then « Télécharger ».
 */
export function ExportCard({
  documentId,
  fileName,
  labels,
}: {
  documentId: string;
  /** « Grace-Mbuyi-CV.pdf ». */
  fileName: string;
  labels: {
    formats: string;
    pdf: string;
    pdfHint: string;
    word: string;
    wordHint: string;
    file: { one: string; other: string };
    fileWord: string;
    wordNote: string;
    download: string;
    preparing: string;
    done: string;
    wordDone: string;
    error: string;
  };
}) {
  const [format, setFormat] = useState<Format>("pdf");
  const [busy, setBusy] = useState(false);
  const result = usePaginationResult();
  const pages = result?.pages ?? 0;
  const name = format === "pdf" ? fileName : fileName.replace(/\.pdf$/i, ".docx");
  const fallback = `/app/career/cv/${documentId}/pdf`;
  const word = `/app/career/cv/${documentId}/word`;

  async function run(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const response =
        format === "pdf"
          ? await fetch(`/api/cv/${documentId}/export?format=pdf`, { method: "POST" })
          : await fetch(word);
      if (!response.ok) {
        if (format === "pdf") window.location.assign(new URL(fallback, window.location.origin));
        else showToast({ message: labels.error, tone: "error" });
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      showToast({ message: format === "pdf" ? labels.done : labels.wordDone, tone: "success" });
      track("cv_downloaded", { mode: format === "pdf" ? "download" : "docx" });
    } catch {
      showToast({ message: labels.error, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <fieldset className="t-sc-fmt">
        <legend className="sr-only">{labels.formats}</legend>
        {(
          [
            ["pdf", labels.pdf, labels.pdfHint],
            ["docx", labels.word, labels.wordHint],
          ] as const
        ).map(([value, title, hint]) => (
          <label key={value} className={cx("t-press", format === value && "t-on")}>
            <input
              type="radio"
              name="sc-format"
              value={value}
              checked={format === value}
              onChange={() => setFormat(value)}
              className="sr-only"
            />
            <b>{title}</b>
            {hint}
          </label>
        ))}
      </fieldset>
      <p className="t-sc-fn">
        {format === "pdf"
          ? pages > 0
            ? (pages === 1 ? labels.file.one : labels.file.other)
                .replace("{name}", name)
                .replace("#", String(pages))
            : name
          : labels.fileWord.replace("{name}", name)}
      </p>
      {format === "docx" && <p className="t-sc-sub">{labels.wordNote}</p>}
      <a
        href={format === "pdf" ? fallback : word}
        download={name}
        onClick={run}
        aria-busy={busy}
        className="t-bt t-p t-press"
      >
        {busy ? (
          <>
            <span aria-hidden className="t-roue" />
            {labels.preparing}
          </>
        ) : (
          <>
            <TalentIcon name="telecharger" size="s" />
            {labels.download}
          </>
        )}
      </a>
    </>
  );
}
