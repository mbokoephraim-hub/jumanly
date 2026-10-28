"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition, type ComponentProps } from "react";
import { showToast } from "@/components/motion/toaster";
import type { CvDocumentData } from "@/features/cv/render/model";
import { CvPaginationProvider, CvPreview } from "@/features/cv/render/CvPreview";
import type { CvStyle } from "@/features/cv/style";
import type { CvTemplate } from "@/features/cv/templates/registry";
import { saveCvStyleAction } from "@/server/actions/cv-flow";
import { CvFrame } from "./frame";

type Setting =
  | { setting: "accent"; value: string }
  | { setting: "font"; value: CvStyle["font"] }
  | { setting: "density"; value: CvStyle["density"] }
  | { setting: "titlesLanguage"; value: CvStyle["titlesLanguage"] }
  | { setting: "showPhoto"; value: "on" | "off" };

/**
 * Mise en forme (capture 10): the CV itself changes as each setting is touched; the colours of
 * the catalogue (those advised for recruiting software first), the font, the density, the photo
 * and the language of the titles. Each change is saved at once.
 */
export function CvStyleStep({
  cvId,
  title,
  data,
  template,
  style: saved,
  colors,
  fonts,
  empty,
  steps,
}: {
  cvId: string;
  title: string;
  data: CvDocumentData;
  template: CvTemplate;
  style: CvStyle;
  colors: { code: string; hex: string; ats: boolean; name: string }[];
  fonts: { code: CvStyle["font"]; label: string; family: string }[];
  /** Nothing written yet: the preview is an example. */
  empty: boolean;
  steps: ComponentProps<typeof CvFrame>["steps"];
}) {
  const t = useTranslations("phoneCv");
  const router = useRouter();
  const [style, setStyle] = useState(saved);
  const [, start] = useTransition();

  const change = (next: CvStyle, input: Setting) => {
    setStyle(next);
    start(async () => {
      const result = await saveCvStyleAction(cvId, input);
      if (!result.ok) {
        setStyle(saved);
        showToast({ message: t("error"), tone: "error" });
      }
      // The titles are written in the other language by the server.
      if (input.setting === "titlesLanguage") router.refresh();
    });
  };
  const color = colors.find((item) => item.code === style.accent);
  const densities = ["airy", "standard", "compact"] as const;
  return (
    <CvFrame
      title={t("style.title")}
      sub={t("style.sub")}
      back={{ href: `/app/career/cv/${cvId}?etape=contenu`, label: t("back") }}
      steps={steps}
      bottom={
        <Link
          href={`/app/career/cv/${cvId}?etape=apercu`}
          className="nb-bouton nb-cv-principal"
          data-plein=""
          data-large=""
        >
          {t("style.next")}
        </Link>
      }
    >
      {empty ? <p className="nb-cv-note">{t("style.emptyNote")}</p> : null}
      <div className="nb-cv-vivant">
        <div className="nb-cv-vivant-page">
          <CvPaginationProvider>
            <CvPreview data={data} template={template} style={style} label={title} />
          </CvPaginationProvider>
        </div>
      </div>

      <div className="nb-cv-h">
        <h2 id="cv-style-couleur">{t("style.color")}</h2>
        <small>
          {color ? (color.ats ? t("style.colorAdvised", { name: color.name }) : color.name) : null}
        </small>
      </div>
      <div className="nb-cv-teintes" role="radiogroup" aria-labelledby="cv-style-couleur">
        {colors.map((item) => (
          <button
            key={item.code}
            type="button"
            role="radio"
            aria-checked={item.code === style.accent}
            aria-label={item.ats ? t("style.colorAdvised", { name: item.name }) : item.name}
            onClick={() =>
              change({ ...style, accent: item.code }, { setting: "accent", value: item.code })
            }
          >
            <span style={{ background: item.hex }} />
          </button>
        ))}
      </div>

      <h2 className="nb-cv-h" id="cv-style-police">
        {t("style.font")}
      </h2>
      <div className="nb-cv-trois" role="radiogroup" aria-labelledby="cv-style-police">
        {fonts.map((font) => (
          <button
            key={font.code}
            type="button"
            role="radio"
            aria-checked={style.font === font.code}
            style={{ fontFamily: font.family }}
            onClick={() =>
              change({ ...style, font: font.code }, { setting: "font", value: font.code })
            }
          >
            {font.label}
          </button>
        ))}
      </div>

      <h2 className="nb-cv-h" id="cv-style-densite">
        {t("style.density")}
      </h2>
      <div className="nb-cv-trois" role="radiogroup" aria-labelledby="cv-style-densite">
        {densities.map((density) => (
          <button
            key={density}
            type="button"
            role="radio"
            aria-checked={style.density === density}
            onClick={() => change({ ...style, density }, { setting: "density", value: density })}
          >
            {t(`style.densities.${density}`)}
          </button>
        ))}
      </div>

      <div className="nb-cv-reglages">
        {template.photo ? (
          <div className="nb-cv-reglage">
            <span>{t("style.photo")}</span>
            <button
              type="button"
              role="switch"
              aria-checked={style.showPhoto}
              aria-label={t("style.photo")}
              className="nb-switch"
              onClick={() =>
                change(
                  { ...style, showPhoto: !style.showPhoto },
                  { setting: "showPhoto", value: style.showPhoto ? "off" : "on" },
                )
              }
            >
              <span />
            </button>
          </div>
        ) : (
          <div className="nb-cv-reglage">
            <span>{t("style.photo")}</span>
            <small>{t("style.photoNone")}</small>
          </div>
        )}
        <button
          type="button"
          className="nb-cv-reglage"
          aria-label={t("style.languageChange", {
            current: t(`style.languages.${style.titlesLanguage}`),
          })}
          onClick={() => {
            const value = style.titlesLanguage === "fr" ? "en" : "fr";
            change({ ...style, titlesLanguage: value }, { setting: "titlesLanguage", value });
          }}
        >
          <span>{t("style.language")}</span>
          <small>
            {t("style.languageValue", { language: t(`style.languages.${style.titlesLanguage}`) })}
          </small>
        </button>
      </div>
    </CvFrame>
  );
}
