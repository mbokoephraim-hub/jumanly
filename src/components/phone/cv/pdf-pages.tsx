"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The pages of an imported PDF, drawn in the app (Ephraïm, 27/10: « lire à partir de l’appli »):
 * phones do not show a PDF inside a page, so each page is drawn on a canvas by pdf.js, loaded only
 * here. On failure the parent offers the file to save instead.
 */
export function PdfPages({
  src,
  label,
  onError,
}: {
  src: string;
  label: string;
  onError: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "done">("loading");
  useEffect(() => {
    let stopped = false;
    const element = box.current;
    (async () => {
      const response = await fetch(src, { credentials: "same-origin" });
      if (!response.ok) throw new Error("file");
      const bytes = new Uint8Array(await response.arrayBuffer());
      const { getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(bytes);
      const width = element?.clientWidth || 360;
      for (let number = 1; number <= Math.min(pdf.numPages, 10); number++) {
        if (stopped || !element) return;
        const page = await pdf.getPage(number);
        const base = page.getViewport({ scale: 1 });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: (width / base.width) * ratio });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.className = "nb-cv-lire-page";
        canvas.setAttribute("aria-hidden", "true");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("canvas");
        await page.render({ canvasContext: context, viewport, canvas } as never).promise;
        if (stopped) return;
        element.appendChild(canvas);
      }
      if (!stopped) setState("done");
    })().catch(() => {
      if (!stopped) onError();
    });
    return () => {
      stopped = true;
      element?.replaceChildren();
    };
  }, [src, onError]);
  return (
    <div
      ref={box}
      className="nb-cv-lire-pages"
      role="img"
      aria-label={label}
      aria-busy={state === "loading"}
      data-pret={state === "done" ? "" : undefined}
    />
  );
}
