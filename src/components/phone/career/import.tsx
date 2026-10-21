"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { readCvFileAction } from "@/server/actions/cv-import";
import { OrbiDisc } from "../icon";

/**
 * « Importer un CV » (planches Carrière-cv-import, -cv-import-lecture): choosing the file sends
 * it at once; Orbi reads it on the server, the file is never kept.
 */
export function CvImportPick({ max }: { max: number }) {
  const t = useTranslations("phoneCareer.cvImport");
  const form = useRef<HTMLFormElement>(null);
  const [name, setName] = useState<string | null>(null);
  if (name)
    return (
      <div className="nb-ca-lecture" role="status" aria-live="polite">
        <OrbiDisc size={72} />
        <b>{t("reading", { name })}</b>
        <span className="nb-ca-barre" aria-hidden>
          <span />
        </span>
        <p className="nb-meta">{t("readingText")}</p>
      </div>
    );
  return (
    <form ref={form} action={readCvFileAction} className="nb-ca-import">
      <label className="nb-ca-depot">
        <b>{t("choose", { max })}</b>
        <span className="nb-meta">{t("chooseText")}</span>
        <input
          type="file"
          name="file"
          accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setName(file.name);
            form.current?.requestSubmit();
          }}
        />
      </label>
    </form>
  );
}
