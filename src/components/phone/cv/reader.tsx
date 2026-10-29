"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import type { CvDocumentData } from "@/features/cv/render/model";
import { CvPaginationProvider, CvPreview } from "@/features/cv/render/CvPreview";
import type { CvStyle } from "@/features/cv/style";
import type { CvTemplate } from "@/features/cv/templates/registry";
import { deleteCv, duplicateCv } from "@/server/actions/cv";
import { setCvPrimaryAction } from "@/server/actions/cv-flow";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { CvFrame } from "./frame";
import { PdfPages } from "./pdf-pages";
import { savePdf } from "./save-pdf";

export const LIBRARY = "/app/career/cv?onglet=cv";

/**
 * « Lire » a CV of « Mes CV » (Ephraïm, 27/10): the CV itself, read in the app, then closed back
 * to the library. An imported file is shown as it is (PDF pages drawn, a photo), a Word file and
 * a CV made in Jumanly through their layout. From here: save it, use it by default when applying,
 * change it (or make an editable copy of a file), delete it.
 */
export function CvReader({
  cvId,
  title,
  primary,
  file,
  preview,
  empty,
  notice,
}: {
  cvId: string;
  title: string;
  primary: boolean;
  file: { type: "pdf" | "docx" | "image"; name: string } | null;
  preview: { data: CvDocumentData; template: CvTemplate; style: CvStyle } | null;
  /** A CV made in Jumanly with nothing written: the layout shows an example, no PDF yet. */
  empty: boolean;
  notice: { kind: "garde" } | { kind: "profil"; count: number } | null;
}) {
  const t = useTranslations("phoneCv.reader");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [isPrimary, setPrimary] = useState(primary);
  const [deleting, setDeleting] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [unreadable, setUnreadable] = useState(false);
  const fileUrl = `/app/career/cv/${cvId}/fichier`;
  const close = () => router.replace(LIBRARY);
  const onPdfError = useCallback(() => setUnreadable(true), []);

  const download = async () => {
    if (file) {
      const link = document.createElement("a");
      link.href = `${fileUrl}?telecharger=1`;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }
    setPreparing(true);
    try {
      await savePdf(cvId);
      showToast({ message: t("downloaded") });
    } catch {
      showToast({ message: t("downloadError"), tone: "error" });
    } finally {
      setPreparing(false);
    }
  };
  const togglePrimary = () =>
    start(async () => {
      const result = await setCvPrimaryAction(cvId, !isPrimary);
      if (!result.ok) return showToast({ message: t("error"), tone: "error" });
      setPrimary(!isPrimary);
    });

  return (
    <CvFrame
      title={title}
      sub={file ? t(`kind.${file.type}`) : t("kind.jumanly")}
      back={{ href: LIBRARY, label: t("close"), close: true, onClick: close }}
      className="nb-cv-lire"
      bottom={
        <div className="nb-cv-fin">
          <button
            type="button"
            className="nb-bouton nb-cv-principal"
            data-plein=""
            data-large=""
            disabled={preparing || (!file && empty)}
            onClick={download}
          >
            {preparing
              ? t("preparing")
              : !file && empty
                ? t("emptyPdf")
                : file
                  ? t("downloadFile")
                  : t("downloadPdf")}
          </button>
        </div>
      }
    >
      {notice ? (
        <p className="nb-cv-lire-ok" role="status">
          <PhoneIcon name="coche" size={18} stroke={2.4} />
          <span>
            {notice.kind === "garde" ? t("kept") : t("profileFilled", { count: notice.count })}
            {notice.kind === "profil" ? (
              <>
                {" "}
                <Link href="/app/career/cv?onglet=profil">{t("seeProfile")}</Link>
              </>
            ) : null}
          </span>
        </p>
      ) : null}

      <div className="nb-cv-lire-doc">
        {file?.type === "pdf" && !unreadable ? (
          <PdfPages src={fileUrl} label={t("pagesLabel", { title })} onError={onPdfError} />
        ) : file?.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element -- a private file, served as it is
          <img src={fileUrl} alt={t("pagesLabel", { title })} className="nb-cv-lire-page" />
        ) : preview ? (
          <CvPaginationProvider>
            <CvPreview
              data={preview.data}
              template={preview.template}
              style={preview.style}
              label={t("pagesLabel", { title })}
            />
          </CvPaginationProvider>
        ) : null}
        {unreadable ? <p className="nb-cv-note">{t("unreadable")}</p> : null}
      </div>
      {file?.type === "docx" ? <p className="nb-cv-note">{t("wordNote")}</p> : null}
      {!file && empty ? <p className="nb-cv-note">{t("emptyNote")}</p> : null}

      <p className="nb-cv-lire-postuler">
        <PhoneIcon name="offres" size={18} />
        <span>
          {t("apply")} <Link href="/app/jobs">{t("applyLink")}</Link>
        </span>
      </p>

      <ul className="nb-cv-lire-actions">
        <li>
          <button
            type="button"
            className="nb-opt"
            aria-pressed={isPrimary}
            disabled={pending}
            onClick={togglePrimary}
          >
            {isPrimary ? t("primaryIs") : t("primary")}
          </button>
        </li>
        <li>
          {file ? (
            <form action={duplicateCv}>
              <input type="hidden" name="id" value={cvId} />
              <button type="submit" className="nb-opt">
                {t("editable")}
              </button>
            </form>
          ) : (
            <Link href={`/app/career/cv/${cvId}?etape=contenu`} className="nb-opt">
              {t("edit")}
            </Link>
          )}
        </li>
        <li>
          <button type="button" className="nb-opt" data-danger="" onClick={() => setDeleting(true)}>
            {t("delete")}
          </button>
        </li>
      </ul>

      <PhoneSheet
        open={deleting}
        onClose={() => setDeleting(false)}
        label={t("deleteQuestion", { title })}
        closeLabel={t("cancel")}
      >
        <b className="nb-ex-feuille-t">{t("deleteQuestion", { title })}</b>
        <p className="nb-meta nb-ca-feuille-d">{t("deleteText")}</p>
        <form action={deleteCv} className="nb-ca-feuille-b">
          <input type="hidden" name="id" value={cvId} />
          <input type="hidden" name="retour" value="cv" />
          <button type="submit" className="nb-bouton" data-large="" data-plein-rouge="">
            {t("deleteConfirm")}
          </button>
          <button
            type="button"
            className="nb-bouton"
            data-large=""
            data-contour=""
            onClick={() => setDeleting(false)}
          >
            {t("cancel")}
          </button>
        </form>
      </PhoneSheet>
    </CvFrame>
  );
}
