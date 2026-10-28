"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { readCvPhotoAction } from "@/server/actions/cv-flow";
import { readCvFileAction } from "@/server/actions/cv-import";
import { PhoneIcon } from "../icon";
import { CvFrame } from "./frame";
import { CvMark, OrbiSpark } from "./marks";

/** A photo of a page is read well at this size, and stays far under the upload limit. */
const PHOTO_SIDE = 1600;

/** The photo made lighter in the browser (JPEG, longest side 1600 px); the original if that fails. */
async function lighter(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, PHOTO_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

const READ_MS = 900;

/**
 * « Importer un CV », steps 1 and 2 (captures 13, 14): a PDF or a Word file, or the photo of a
 * paper CV; while Orbi reads, the lines of what it looks for tick one by one. The file is read
 * on the server and never kept; nothing enters the profile before step 3.
 */
export function CvImport({
  max,
  error,
  last,
}: {
  max: number;
  error: string | null;
  /** The last reading not yet decided, to take up again. */
  last: { name: string; when: string; kind: "pdf" | "docx" | "image" | null } | null;
}) {
  const t = useTranslations("phoneCv");
  const form = useRef<HTMLFormElement>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [shown, setShown] = useState(0);
  const lines = [t("read.contact"), t("read.experiences"), t("read.education"), t("read.skills")];

  useEffect(() => {
    if (!reading || shown >= lines.length - 1) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setShown((count) => count + 1), reduced ? 0 : READ_MS);
    return () => window.clearTimeout(timer);
  }, [reading, shown, lines.length]);

  if (reading)
    return (
      <CvFrame
        title={t("import.title")}
        sub={t("import.step", { step: 2 })}
        back={{ href: "/app/career/cv/nouveau?etape=import", label: t("back") }}
        bottom={
          <button
            type="button"
            className="nb-bouton nb-cv-principal"
            data-plein=""
            data-large=""
            disabled
          >
            {t("continue")}
          </button>
        }
      >
        <div className="nb-cv-lecture">
          <div className="nb-cv-feuille" aria-hidden data-ciel="">
            <i data-titre="" />
            <i data-sous="" />
            <i data-section="" />
            <i />
            <i />
            <i data-w="70" />
            <i data-section="" />
            <i />
            <i data-w="80" />
            <span className="nb-cv-loupe" />
            <span className="nb-cv-etoile">
              <OrbiSpark size={24} />
            </span>
          </div>
          <b className="nb-cv-lecture-t" role="status" aria-live="polite">
            {t("read.title", { name: reading })}
          </b>
          <span className="nb-cv-barre" aria-hidden>
            <span style={{ width: `${Math.round((100 * (shown + 0.5)) / lines.length)}%` }} />
          </span>
          <ul className="nb-cv-lus">
            {lines.map((line, index) => (
              <li key={line} data-fait={index < shown ? "" : undefined}>
                <i aria-hidden>
                  {index < shown ? <PhoneIcon name="coche" size={14} stroke={2.6} /> : "…"}
                </i>
                {line}
              </li>
            ))}
          </ul>
          <p className="nb-cv-note">{t("read.never")}</p>
        </div>
      </CvFrame>
    );

  return (
    <CvFrame
      title={t("import.title")}
      sub={t("import.step", { step: 1 })}
      back={{ href: "/app/career/cv/nouveau", label: t("back") }}
    >
      {error ? (
        <p className="nb-cv-erreur" role="alert">
          {error}
        </p>
      ) : null}
      <form ref={form} action={readCvFileAction} className="nb-cv-import">
        <input type="hidden" name="retour" value="nouveau" />
        <label className="nb-cv-depot">
          <span className="nb-cv-depot-i" aria-hidden>
            <CvMark name="import" size={26} />
          </span>
          <b>{t("import.choose")}</b>
          <small>{t("import.chooseText", { max })}</small>
          <input
            id="cv-nouveau-fichier"
            type="file"
            name="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setReading(file.name);
              form.current?.requestSubmit();
            }}
          />
        </label>
      </form>
      <label className="nb-cv-photo">
        <span className="nb-cv-photo-i" aria-hidden>
          <PhoneIcon name="appareil" size={20} />
        </span>
        <span className="nb-cv-photo-t">
          <b>{t("import.photo")}</b>
          <small>{t("import.photoText")}</small>
        </span>
        <input
          id="cv-nouveau-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setReading(t("import.photoName"));
            const data = new FormData();
            data.set("photo", await lighter(file), "photo.jpg");
            await readCvPhotoAction(data);
          }}
        />
      </label>
      {last ? (
        <>
          <h2 className="nb-cv-h">{t("import.last")}</h2>
          <Link href="/app/career/cv/nouveau?etape=trouve" className="nb-cv-fichier">
            <span className="nb-cv-ext" data-type={last.kind ?? "pdf"} aria-hidden>
              {last.kind === "docx" ? "DOC" : last.kind === "image" ? "IMG" : "PDF"}
            </span>
            <span className="nb-cv-fichier-t">
              <b>{last.name}</b>
              <small>{last.when}</small>
            </span>
            <PhoneIcon name="chevron" size={18} />
          </Link>
        </>
      ) : null}
      <p className="nb-cv-note">{t("import.consent")}</p>
    </CvFrame>
  );
}
