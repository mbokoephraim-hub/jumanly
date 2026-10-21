"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { PhoneSheet } from "../sheet";

/**
 * « Exporter » (planche Carrière-cv-export): PDF or Word, downloaded at once. The file carries no
 * Jumanly logo.
 */
export function CvExportButton({
  id,
  title,
  label,
  open: openAtFirst = false,
  className = "nb-ca-ok",
}: {
  id: string;
  title: string;
  label: string;
  open?: boolean;
  className?: string;
}) {
  const t = useTranslations("phoneCareer.cvEdit");
  const [open, setOpen] = useState(openAtFirst);
  const [format, setFormat] = useState<"pdf" | "word">("pdf");
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      <PhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        label={t("exportTitle", { title })}
        closeLabel={t("close")}
      >
        <div className="nb-ca-feuille">
          <b className="nb-ex-feuille-t">{t("exportTitle", { title })}</b>
          <p className="nb-meta" id="ca-format">
            {t("format")}
          </p>
          <div className="nb-ca-deux-b" role="radiogroup" aria-labelledby="ca-format">
            {(["pdf", "word"] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={format === key}
                className="nb-ex-chip"
                data-fort=""
                onClick={() => setFormat(key)}
              >
                {t(`formats.${key}`)}
              </button>
            ))}
          </div>
          <p className="nb-meta">{t("exportNote")}</p>
          <a
            href={`/app/career/cv/${id}/${format}`}
            download
            className="nb-bouton"
            data-plein=""
            data-large=""
            onClick={() => setOpen(false)}
          >
            {t("download")}
          </a>
        </div>
      </PhoneSheet>
    </>
  );
}
