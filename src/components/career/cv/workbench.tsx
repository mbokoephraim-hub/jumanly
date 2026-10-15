"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { usePaginationResult } from "@/features/cv/render/CvPreview";

export type WorkbenchLabels = {
  /** « Page {page} sur {total} · A4 » */
  pageOf: string;
  zoomIn: string;
  zoomOut: string;
  fullscreen: string;
  close: string;
  hint: string;
  /** Name of the scrolling sheet area (reachable with the keyboard). */
  label: string;
};

/** Width of the sheet, as a share of the bench (100 % = the sheet fills the bench). */
const ZOOMS = [0.6, 0.8, 1, 1.25, 1.5] as const;
/** Width of an A4 page in CSS pixels (as in CvPreview). */
const PAGE_WIDTH = 794;

/**
 * The work bench around the CV preview (BRIEF-CV-V2 § 2.4): page counter, zoom and full screen.
 * `CvPreview` is unchanged: the zoom only changes the width it is given, and the full screen is
 * the same bench pinned over the page (§ 8.3 of the templates specification: a touch on the
 * reduced preview opens it on a phone).
 */
export function Workbench({ labels, children }: { labels: WorkbenchLabels; children: ReactNode }) {
  const result = usePaginationResult();
  const total = result?.pages ?? 0;
  const [zoom, setZoom] = useState(2);
  const [full, setFull] = useState(false);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  // The real scale of the sheet, read from its width (shown next to the zoom buttons).
  useEffect(() => {
    const element = sheet.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? PAGE_WIDTH;
      setScale(Math.min(1, width / PAGE_WIDTH));
    });
    observer.observe(element);
    return () => observer.disconnect();
    // The full screen mounts the bench again, elsewhere in the page.
  }, [full]);

  // The page in view: the last one whose top has passed the upper third of the bench.
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const update = () => {
      const pages = element.querySelectorAll(".cv-pages > .cv-page");
      const limit = element.getBoundingClientRect().top + element.clientHeight / 3;
      let current = 1;
      pages.forEach((item, index) => {
        if (item.getBoundingClientRect().top <= limit) current = index + 1;
      });
      setPage(current);
    };
    update();
    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      element.removeEventListener("scroll", update);
      window.removeEventListener("scroll", update);
    };
  }, [total, full]);

  // Full screen: Escape closes it, the page behind does not scroll.
  useEffect(() => {
    if (!full) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFull(false);
    };
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      root.style.overflow = overflow;
      window.removeEventListener("keydown", close);
    };
  }, [full]);

  const button =
    "grid size-11 place-items-center rounded-full hover:bg-creme disabled:opacity-40 min-[900px]:size-9";
  const percent = scale === null ? null : `${Math.round(scale * 100)} %`;
  const bench = (
    <div
      data-full={full ? "" : undefined}
      className={cx(
        "jm-cv-bench flex flex-col gap-3 p-3 sm:p-4",
        full
          ? "fixed inset-0 z-50 rounded-none"
          : "rounded-[30px] ring-1 ring-sapin/6 min-[900px]:max-h-[calc(100dvh-178px)]",
      )}
    >
      <div className="flex min-h-11 items-center justify-between gap-2 rounded-pill bg-blanc/80 py-1 pr-1.5 pl-4 backdrop-blur-sm">
        <p role="status" className="text-[13px] font-semibold tabular-nums">
          {total > 0
            ? labels.pageOf
                .replace("{page}", String(Math.min(page, total)))
                .replace("{total}", String(total))
            : null}
        </p>
        <div className="flex items-center gap-0.5">
          <span className={cx("items-center gap-0.5", full ? "flex" : "hidden min-[900px]:flex")}>
            <button
              type="button"
              className={button}
              aria-label={labels.zoomOut}
              disabled={zoom === 0}
              onClick={() => setZoom((value) => Math.max(0, value - 1))}
            >
              <span aria-hidden className="block h-0.5 w-3.5 rounded-sm bg-current" />
            </button>
            <span className="min-w-12 text-center text-xs font-semibold tabular-nums">
              {percent}
            </span>
            <button
              type="button"
              className={button}
              aria-label={labels.zoomIn}
              disabled={zoom === ZOOMS.length - 1 || (scale !== null && scale >= 1)}
              onClick={() => setZoom((value) => Math.min(ZOOMS.length - 1, value + 1))}
            >
              <Icon name="plus" className="size-4" />
            </button>
          </span>
          <button
            type="button"
            className={button}
            aria-label={full ? labels.close : labels.fullscreen}
            aria-pressed={full}
            onClick={() => setFull((value) => !value)}
          >
            <Icon name={full ? "fermer" : "expand"} className="size-4" />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        role="group"
        aria-label={labels.label}
        tabIndex={0}
        className={cx(
          "relative min-h-0 flex-1 overscroll-contain",
          full ? "overflow-auto" : "overflow-x-auto min-[900px]:overflow-y-auto",
        )}
      >
        <div
          ref={sheet}
          className={cx("relative mx-auto", !full && "max-[899px]:max-w-[300px]")}
          style={{ width: `${ZOOMS[zoom] * 100}%`, maxWidth: full ? PAGE_WIDTH : undefined }}
        >
          {children}
          {!full && (
            <button
              type="button"
              className="absolute inset-0 min-[900px]:hidden"
              aria-label={labels.fullscreen}
              onClick={() => setFull(true)}
            />
          )}
        </div>
      </div>
      <p className="text-center text-xs text-ardoise">{labels.hint}</p>
    </div>
  );
  // Full screen: the bench goes to the end of the page, above the bars and the menus (an
  // ancestor of the editor makes its own stacking context).
  return full ? createPortal(bench, document.body) : bench;
}
