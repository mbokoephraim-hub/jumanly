"use client";

import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { CvDocument, type CvDocumentProps } from "./CvDocument";
import { paginateWhenReady, type PaginationResult } from "./paginate";

/** Delay before paginating again after a change (§ 6.2). */
const DELAY_MS = 300;

const PaginationContext = createContext<{
  result: PaginationResult | null;
  setResult: (result: PaginationResult) => void;
} | null>(null);

/** Shares the page count of the preview with the « Pages » and « Exporter » cards. */
export function CvPaginationProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<PaginationResult | null>(null);
  return <PaginationContext value={{ result, setResult }}>{children}</PaginationContext>;
}

export function usePaginationResult() {
  return use(PaginationContext)?.result ?? null;
}

/** Paginates an article after each change, once its fonts are loaded. */
export function usePagination(
  ref: React.RefObject<HTMLElement | null>,
  key: string,
  onResult?: (result: PaginationResult) => void,
) {
  const callback = useRef(onResult);
  useEffect(() => {
    callback.current = onResult;
  });
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const article = ref.current;
      if (!article) return;
      const result = await paginateWhenReady(article);
      if (!cancelled) callback.current?.(result);
    }, DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ref, key]);
}

/** Width of an A4 page in CSS pixels (210 mm at 96 dpi), with the page gutter. */
const PAGE_WIDTH = 794;

/**
 * The CV as A4 pages, exactly as it will be exported. Pages are measured at full size, then
 * shown scaled to the column (a transform does not change the measures used by `paginate`).
 */
export function CvPreview(props: CvDocumentProps & { label?: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const article = useRef<HTMLElement | null>(null);
  const context = use(PaginationContext);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | null>(null);
  const key = JSON.stringify([props.data, props.style, props.template.id, props.maxPages]);
  useEffect(() => {
    article.current = wrapper.current?.querySelector("article.cv") ?? null;
  });
  usePagination(article, key, (result) => {
    context?.setResult(result);
    setHeight(article.current?.scrollHeight ?? null);
  });
  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? PAGE_WIDTH;
      setScale(Math.min(1, width / PAGE_WIDTH));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={wrapper}
      aria-label={props.label}
      role={props.label ? "region" : undefined}
      className="cv-apercu"
      // `contain: inline-size`: the A4 page inside never widens the column (phones).
      style={{
        height: height === null ? undefined : height * scale,
        overflow: "hidden",
        contain: "inline-size",
      }}
    >
      <div style={{ width: PAGE_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <CvDocument
          data={props.data}
          template={props.template}
          style={props.style}
          maxPages={props.maxPages}
        />
      </div>
    </div>
  );
}
