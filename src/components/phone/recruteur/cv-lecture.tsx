"use client";

import { useCallback, useState } from "react";
import type { CvDocumentData } from "@/features/cv/render/model";
import { CvPaginationProvider, CvPreview } from "@/features/cv/render/CvPreview";
import type { CvStyle } from "@/features/cv/style";
import type { CvTemplate } from "@/features/cv/templates/registry";
import { CvFrame } from "../cv/frame";
import { PdfPages } from "../cv/pdf-pages";
import { useRhBack } from "./retour";

/**
 * « Consulter » the CV of a candidate (Ephraïm, 03/11/2026): the CV itself, read inside the app,
 * never a download or another tab. An imported PDF is drawn page by page, a photo shown as it is,
 * a CV made on Jumanly (or a Word file) through its layout.
 */
export function RhCvReader({
  title,
  sub,
  back,
  fileUrl,
  file,
  preview,
  texts,
}: {
  title: string;
  sub: string;
  back: { href: string; label: string };
  fileUrl: string;
  file: "pdf" | "image" | null;
  preview: { data: CvDocumentData; template: CvTemplate; style: CvStyle } | null;
  texts: { pages: string; unreadable: string; empty: string; open: string };
}) {
  // Closing goes back to the file it was opened from, without adding a page to the history.
  const close = useRhBack(back.href);
  return (
    <CvFrame
      title={title}
      sub={sub}
      back={{ ...back, close: true, onClick: close }}
      className="nb-rh-cvl"
    >
      <RhCvDocument fileUrl={fileUrl} file={file} preview={preview} texts={texts} />
    </CvFrame>
  );
}

type CvReading = {
  fileUrl: string;
  file: "pdf" | "image" | null;
  preview: { data: CvDocumentData; template: CvTemplate; style: CvStyle } | null;
  texts: { pages: string; unreadable: string; empty: string; open: string };
};

/** The CV itself: the pages of an imported PDF, a photo, or a CV made on Jumanly. */
export function RhCvDocument({ fileUrl, file, preview, texts }: CvReading) {
  const [unreadable, setUnreadable] = useState(false);
  const onError = useCallback(() => setUnreadable(true), []);
  return (
    <div className="nb-cv-lire-doc">
      {file === "pdf" && !unreadable ? (
        <PdfPages src={fileUrl} label={texts.pages} onError={onError} />
      ) : file === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element -- a private file, served as it is
        <img src={fileUrl} alt={texts.pages} className="nb-cv-lire-page" />
      ) : preview ? (
        <CvPaginationProvider>
          <CvPreview
            data={preview.data}
            template={preview.template}
            style={preview.style}
            label={texts.pages}
          />
        </CvPaginationProvider>
      ) : (
        <p className="nb-cv-note">{texts.empty}</p>
      )}
      {unreadable ? (
        <p className="nb-cv-note">
          {texts.unreadable}{" "}
          <a href={fileUrl} download>
            {texts.open}
          </a>
        </p>
      ) : null}
    </div>
  );
}

/**
 * The CV beside the candidate's file on a computer (08/11/2026: « une interface approfondie »):
 * read while deciding, without leaving the file. The phone opens it on its own page.
 */
export function RhCvAside({ title, sub, ...reading }: CvReading & { title: string; sub: string }) {
  return (
    <aside className="nb-rh-cv-cote" aria-label={title}>
      <p className="nb-rh-cv-cote-t">
        <b>{title}</b>
        <span className="nb-meta">{sub}</span>
      </p>
      <RhCvDocument {...reading} />
    </aside>
  );
}
