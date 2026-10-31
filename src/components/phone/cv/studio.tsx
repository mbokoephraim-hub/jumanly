"use client";

/* eslint-disable @next/next/no-img-element -- the person's own photo, already reduced */
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition, type ComponentProps, type CSSProperties } from "react";
import { showToast } from "@/components/motion/toaster";
import type { CvDocumentData } from "@/features/cv/render/model";
import { CvPaginationProvider, CvPreview } from "@/features/cv/render/CvPreview";
import { styleForTemplate, type CvStyle } from "@/features/cv/style";
import { findTemplate, templateOf } from "@/features/cv/templates/registry";
import {
  deleteCvsAction,
  restoreCvDesignAction,
  saveCvStyleAction,
  setCvTemplateQuickAction,
} from "@/server/actions/cv-flow";
import { PhoneSheet } from "../sheet";
import { PhoneIcon } from "../icon";
import type { TemplateChoice } from "./data";
import { CvFrame } from "./frame";

export type StudioColor = { code: string; hex: string; ats: boolean; name: string };

/**
 * « Tout annuler » (studio) and « Annuler » (aperçu): a CV being created is removed after a
 * confirmation; a CV that already existed gets its look back as it was and the talent goes back
 * to the documents.
 */
export function useCancelCv({
  cvId,
  isNew,
  restore,
}: {
  cvId: string;
  isNew: boolean;
  restore?: { templateId: string; style: CvStyle };
}) {
  const t = useTranslations("phoneCv");
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();
  const leave = () => router.replace("/app/career/cv?onglet=cv");
  const confirm = () =>
    start(async () => {
      if (isNew) {
        const result = await deleteCvsAction([cvId]);
        if (!result.ok) return showToast({ message: t("error"), tone: "error" });
      } else if (restore) {
        await restoreCvDesignAction(cvId, restore.templateId, restore.style);
      }
      setAsking(false);
      leave();
    });
  const sheet = (
    <PhoneSheet
      open={asking}
      onClose={() => setAsking(false)}
      label={t("cancel.title")}
      closeLabel={t("close")}
    >
      <div className="nb-cvs-feuille">
        <h2>{t("cancel.title")}</h2>
        <p>{isNew ? t("cancel.textNew") : t("cancel.text")}</p>
        <div className="nb-cv-deux">
          <button
            type="button"
            className="nb-bouton"
            data-contour=""
            data-large=""
            onClick={() => setAsking(false)}
          >
            {t("cancel.keep")}
          </button>
          <button
            type="button"
            className="nb-bouton"
            data-plein=""
            data-large=""
            data-danger=""
            disabled={pending}
            aria-busy={pending}
            onClick={confirm}
          >
            {t("cancel.confirm")}
          </button>
        </div>
      </div>
    </PhoneSheet>
  );
  return { ask: () => setAsking(true), sheet };
}

/**
 * The studio (Ephraïm, 31/10/2026): the texts are validated, now the look. The photo first
 * (with, or « Pas de photo »), the fifteen templates (those the plan does not include show a
 * padlock and the plan that does), the colours; the CV changes above as each choice is
 * touched, and each choice is saved at once. Back at the top; « Tout annuler » and « Voir le
 * CV » at the bottom.
 */
export function CvStudioStep({
  cvId,
  title,
  data,
  templateId: savedTemplate,
  style: savedStyle,
  choices,
  colors,
  photo,
  isNew,
  steps,
}: {
  cvId: string;
  title: string;
  data: CvDocumentData;
  templateId: string;
  style: CvStyle;
  choices: TemplateChoice[];
  colors: StudioColor[];
  photo: { url: string | null; initials: string };
  isNew: boolean;
  steps: ComponentProps<typeof CvFrame>["steps"];
}) {
  const t = useTranslations("phoneCv");
  const [templateId, setTemplateId] = useState(savedTemplate);
  const [style, setStyle] = useState(savedStyle);
  const [, start] = useTransition();
  const suffix = isNew ? "&nouveau=1" : "";
  const template = templateOf(templateId);
  const cancel = useCancelCv({
    cvId,
    isNew,
    restore: { templateId: savedTemplate, style: savedStyle },
  });
  const included = choices.filter((choice) => !choice.lockedBy).length;

  const pickTemplate = (choice: TemplateChoice) => {
    if (choice.lockedBy) {
      showToast({ message: t("template.locked", { plan: choice.lockedBy }) });
      return;
    }
    const target = findTemplate(choice.id);
    if (!target || target.id === templateId) return;
    const before = { templateId, style };
    setTemplateId(target.id);
    setStyle(styleForTemplate(style, template, target));
    start(async () => {
      const result = await setCvTemplateQuickAction(cvId, target.id);
      if (!result.ok) {
        setTemplateId(before.templateId);
        setStyle(before.style);
        showToast({ message: t("error"), tone: "error" });
      }
    });
  };

  const setting = (next: CvStyle, input: Parameters<typeof saveCvStyleAction>[1]) => {
    const before = style;
    setStyle(next);
    start(async () => {
      const result = await saveCvStyleAction(cvId, input);
      if (!result.ok) {
        setStyle(before);
        showToast({ message: t("error"), tone: "error" });
      }
    });
  };

  const withPhoto = style.showPhoto && photo.url !== null;
  return (
    <CvFrame
      title={t("studio.title")}
      sub={t("studio.sub")}
      back={{ href: `/app/career/cv/${cvId}?etape=contenu${suffix}`, label: t("back") }}
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
            {t("studio.cancelAll")}
          </button>
          <Link
            href={`/app/career/cv/${cvId}?etape=voir${suffix}`}
            className="nb-bouton nb-cv-principal"
            data-plein=""
            data-large=""
          >
            {t("studio.see")}
          </Link>
        </div>
      }
    >
      <div className="nb-cvs-vivant" aria-label={t("studio.live")}>
        <div className="nb-cvs-page">
          <CvPaginationProvider>
            <CvPreview data={data} template={template} style={style} label={title} />
          </CvPaginationProvider>
        </div>
        <small className="nb-cvs-nom">
          {t("studio.current", {
            name: choices.find((choice) => choice.id === templateId)?.name ?? "",
          })}
        </small>
      </div>

      <section className="nb-cvs-partie" aria-labelledby="cvs-photo">
        <h2 id="cvs-photo">{t("studio.photo")}</h2>
        <div className="nb-cvs-photo">
          <span className="nb-cvs-avatar" data-sans={withPhoto ? undefined : ""}>
            {photo.url ? (
              <img src={photo.url} alt="" width={56} height={56} />
            ) : (
              <b>{photo.initials}</b>
            )}
          </span>
          <div className="nb-cvs-photo-choix" role="radiogroup" aria-labelledby="cvs-photo">
            <button
              type="button"
              role="radio"
              aria-checked={withPhoto}
              disabled={photo.url === null}
              onClick={() =>
                setting({ ...style, showPhoto: true }, { setting: "showPhoto", value: "on" })
              }
            >
              {t("studio.withPhoto")}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!withPhoto}
              onClick={() =>
                setting({ ...style, showPhoto: false }, { setting: "showPhoto", value: "off" })
              }
            >
              {t("studio.noPhoto")}
            </button>
          </div>
        </div>
        {photo.url === null ? (
          <p className="nb-cvs-note">{t("studio.photoMissing")}</p>
        ) : withPhoto && !template.photo ? (
          <p className="nb-cvs-note">{t("studio.photoTemplate")}</p>
        ) : null}
      </section>

      <section className="nb-cvs-partie" aria-labelledby="cvs-modeles">
        <div className="nb-cvs-h">
          <h2 id="cvs-modeles">{t("studio.templates")}</h2>
          <small>{t("studio.included", { count: choices.length, included })}</small>
        </div>
        <ul className="nb-cvs-modeles" role="radiogroup" aria-labelledby="cvs-modeles">
          {choices.map((choice) => {
            const selected = choice.id === templateId;
            return (
              <li key={choice.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-verrou={choice.lockedBy ? "" : undefined}
                  aria-label={
                    choice.lockedBy
                      ? t("template.lockedLabel", { name: choice.name, plan: choice.lockedBy })
                      : choice.name
                  }
                  onClick={() => pickTemplate(choice)}
                >
                  <span className="nb-cvs-vignette">
                    <Image src={choice.image} alt="" width={150} height={212} sizes="96px" />
                    {selected ? (
                      <i className="nb-cv-coche" aria-hidden>
                        <PhoneIcon name="coche" size={14} stroke={2.6} />
                      </i>
                    ) : null}
                    {choice.lockedBy ? (
                      <em className="nb-cvs-verrou">
                        <PhoneIcon name="cadenas" size={11} stroke={2.4} />
                        {choice.lockedBy}
                      </em>
                    ) : null}
                  </span>
                  <small>{choice.name}</small>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="nb-cvs-partie" aria-labelledby="cvs-couleur">
        <div className="nb-cvs-h">
          <h2 id="cvs-couleur">{t("studio.color")}</h2>
          <small>{colors.find((item) => item.code === style.accent)?.name}</small>
        </div>
        <div className="nb-cv-teintes" role="radiogroup" aria-labelledby="cvs-couleur">
          {colors.map((item) => (
            <button
              key={item.code}
              type="button"
              role="radio"
              aria-checked={item.code === style.accent}
              aria-label={item.ats ? t("style.colorAdvised", { name: item.name }) : item.name}
              onClick={() =>
                setting({ ...style, accent: item.code }, { setting: "accent", value: item.code })
              }
            >
              <span style={{ background: item.hex } as CSSProperties} />
            </button>
          ))}
        </div>
      </section>
      {cancel.sheet}
    </CvFrame>
  );
}
