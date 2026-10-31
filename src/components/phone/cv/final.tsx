"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition, type ComponentProps } from "react";
import { showToast } from "@/components/motion/toaster";
import type { CvDocumentData } from "@/features/cv/render/model";
import { CvPaginationProvider, CvPreview } from "@/features/cv/render/CvPreview";
import type { CvStyle } from "@/features/cv/style";
import type { CvTemplate } from "@/features/cv/templates/registry";
import { finishCvAction } from "@/server/actions/cv-flow";
import { PhoneSheet } from "../sheet";
import { PhoneIcon } from "../icon";
import { CvFrame } from "./frame";
import { useCancelCv } from "./studio";

/**
 * « Voir le CV » (Ephraïm, 31/10/2026): the CV as it will be sent, in the app. Back to the
 * studio and « Modifier encore » at the top; « Annuler » and « Enregistrer » at the bottom.
 * Saving says « Votre CV a été bien enregistré et prêt à être utilisé » and leads back to the
 * documents.
 */
export function CvFinalStep({
  cvId,
  title,
  data,
  template,
  style,
  isNew,
  steps,
}: {
  cvId: string;
  title: string;
  data: CvDocumentData;
  template: CvTemplate;
  style: CvStyle;
  isNew: boolean;
  steps: ComponentProps<typeof CvFrame>["steps"];
}) {
  const t = useTranslations("phoneCv");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const suffix = isNew ? "&nouveau=1" : "";
  const cancel = useCancelCv({ cvId, isNew });
  const documents = "/app/career/cv?onglet=documents";

  const save = () =>
    start(async () => {
      const result = await finishCvAction(cvId);
      if (!result.ok) return showToast({ message: t("error"), tone: "error" });
      setSaved(true);
    });

  return (
    <CvFrame
      title={t("final.title")}
      sub={title}
      back={{ href: `/app/career/cv/${cvId}?etape=studio${suffix}`, label: t("back") }}
      action={
        <Link href={`/app/career/cv/${cvId}?etape=contenu${suffix}`} className="nb-cvs-encore">
          <PhoneIcon name="modifier" size={15} />
          {t("final.editAgain")}
        </Link>
      }
      steps={steps}
      className="nb-cvs"
      bottom={
        <div className="nb-cv-deux">
          <button
            type="button"
            className="nb-bouton"
            data-contour=""
            data-large=""
            onClick={cancel.ask}
          >
            {t("final.cancel")}
          </button>
          <button
            type="button"
            className="nb-bouton nb-cv-principal"
            data-plein=""
            data-large=""
            disabled={pending}
            aria-busy={pending}
            onClick={save}
          >
            {t("final.save")}
          </button>
        </div>
      }
    >
      <div className="nb-cvs-final">
        <CvPaginationProvider>
          <CvPreview data={data} template={template} style={style} label={title} />
        </CvPaginationProvider>
      </div>
      {cancel.sheet}
      <PhoneSheet
        open={saved}
        onClose={() => undefined}
        label={t("final.savedTitle")}
        closeLabel={t("close")}
      >
        <div className="nb-cvs-feuille" data-fete="">
          <span className="nb-cvs-ok" aria-hidden>
            <PhoneIcon name="coche" size={30} stroke={3} />
          </span>
          <h2>{t("final.savedTitle")}</h2>
          <p>{t("final.savedText")}</p>
          <button
            type="button"
            className="nb-bouton nb-cv-principal"
            data-plein=""
            data-large=""
            onClick={() => {
              // A full visit: « Mes documents » opens on its tab with the new CV in it.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full visit, on purpose
              window.location.assign(documents);
            }}
          >
            {t("final.backToDocuments")}
          </button>
        </div>
      </PhoneSheet>
    </CvFrame>
  );
}
