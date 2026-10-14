import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { eyebrow, pillClass } from "@/components/career/kit";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { updateCvStyleAction } from "@/server/actions/cv";
import { templateKey } from "../examples";
import { accentHex, contrastOnWhite, cvColors, cvFonts, RECOMMENDED_FONT } from "../render/palette";
import { cvDensities, cvTitleLanguages, type CvStyle } from "../style";
import { cvTemplateRegistry, type CvTemplate } from "../templates/registry";

/** Typographic sample of each font (« Aa »), not a translatable text. */
const SAMPLE = "Aa";

/**
 * « Mise en forme » (docs/modeles-cv § 8.2, mockups interface/02-*): template, accent colour,
 * font, density, photo and language of the titles. Each choice is a small form saved at once.
 */
export async function StylePanel({
  documentId,
  template,
  style,
  customError,
}: {
  documentId: string;
  template: CvTemplate;
  style: CvStyle;
  /** Suggested colour after a refusal (§ 4.1), or "invalid". */
  customError?: string;
}) {
  const t = await getTranslations("career.cv");
  const d = dynamic(t);
  const tColors = dynamic(await getTranslations("cv.colors"));
  const accent = accentHex(style.accent) ?? accentHex(template.accent) ?? "#1F2933";
  const number = cvTemplateRegistry.findIndex((item) => item.id === template.id) + 1;
  const setting = (
    name: string,
    value: string,
    children: ReactNode,
    props: { label?: string; pressed?: boolean; className: string; color?: string },
  ) => (
    <form action={updateCvStyleAction} className="contents">
      <input type="hidden" name="id" value={documentId} />
      <input type="hidden" name="setting" value={name} />
      <button
        type="submit"
        name="value"
        value={value}
        aria-label={props.label}
        aria-pressed={props.pressed}
        className={props.className}
        style={props.color ? { background: props.color } : undefined}
      >
        {children}
      </button>
    </form>
  );
  const swatches = (ats: boolean) => (
    <div className="flex flex-wrap gap-2">
      {cvColors
        .filter((color) => color.ats === ats)
        .map((color) => {
          const active = accent.toUpperCase() === color.hex;
          return (
            <span key={color.code}>
              {setting(
                "accent",
                color.code,
                active ? <Icon name="check" className="size-4 text-blanc" /> : null,
                {
                  label: tColors(color.code),
                  pressed: active,
                  color: color.hex,
                  className: cx(
                    "flex size-9 items-center justify-center rounded-full ring-offset-2 focus-visible:outline-2 focus-visible:outline-sapin",
                    active && "ring-2 ring-sapin",
                  ),
                },
              )}
            </span>
          );
        })}
    </div>
  );
  const divider = "border-t border-brume pt-5";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Image
          src={`/cv-templates/${String(number).padStart(2, "0")}-${template.id}.png`}
          alt=""
          width={600}
          height={849}
          className="h-[78px] w-[56px] shrink-0 rounded-md object-cover object-top ring-1 ring-brume"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="font-semibold">{d(`template.name.${templateKey(template.id)}`)}</p>
          <p className="text-xs text-ardoise">{t(`template.ats.${template.ats}`)}</p>
        </div>
        <Link
          href={`/app/career/cv/modeles?cv=${documentId}`}
          className="text-sm font-semibold text-up-texte hover:underline"
        >
          {t("template.change")}
        </Link>
      </div>

      <section aria-labelledby="style-color" className={cx(divider, "flex flex-col gap-3")}>
        <h3 id="style-color" className={cx(eyebrow, "text-ardoise")}>
          {t("template.color")}
        </h3>
        <p className="text-[13px] font-semibold">{t("style.color.recommended")}</p>
        {swatches(true)}
        <p className="text-[13px] font-semibold">{t("style.color.others")}</p>
        {swatches(false)}
        <form action={updateCvStyleAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={documentId} />
          <input type="hidden" name="setting" value="accent" />
          <label htmlFor="style-custom" className="sr-only">
            {t("style.color.custom")}
          </label>
          <span className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[14px] bg-blanc px-3 ring-1 ring-brume focus-within:ring-2 focus-within:ring-sapin">
            <span
              aria-hidden
              className="size-5 shrink-0 rounded-full"
              style={{ background: accent }}
            />
            <input
              id="style-custom"
              name="value"
              defaultValue={accent}
              maxLength={7}
              pattern="#?[0-9A-Fa-f]{6}"
              className="w-full min-w-0 bg-transparent text-sm outline-none"
            />
          </span>
          <span className="flex items-center gap-1 rounded-pill bg-lime-clair px-2.5 py-1 text-xs font-semibold">
            <Icon name="check" className="size-3.5" />
            {t("style.color.contrast", {
              ratio: contrastOnWhite(accent),
            })}
          </span>
          <button type="submit" className={pillClass("outline", "sm")}>
            {t("style.color.apply")}
          </button>
        </form>
        {customError && (
          <p role="alert" className="text-sm font-semibold text-down-texte">
            {customError === "invalid"
              ? t("style.color.invalid")
              : t("style.color.tooLight", { suggestion: customError })}
          </p>
        )}
        <p className="text-xs leading-[18px] text-ardoise">{t("style.color.hint")}</p>
      </section>

      <section aria-labelledby="style-font" className={cx(divider, "flex flex-col gap-1")}>
        <h3 id="style-font" className={cx(eyebrow, "pb-2 text-ardoise")}>
          {t("template.font")}
        </h3>
        {cvFonts.map((font) => {
          const active = style.font === font.code;
          return (
            <span key={font.code} className="block">
              {setting(
                "font",
                font.code,
                <>
                  <span
                    aria-hidden
                    className="w-10 text-[22px]"
                    style={{ fontFamily: `'${font.family}'` }}
                  >
                    {SAMPLE}
                  </span>
                  <span className="flex-1 text-left text-sm font-semibold">{font.label}</span>
                  {font.code === RECOMMENDED_FONT && (
                    <span className="rounded-pill bg-lime px-2.5 py-0.5 text-xs font-semibold">
                      {t("style.font.recommended")}
                    </span>
                  )}
                  {active && <Icon name="check" className="size-4 text-feuille" />}
                </>,
                {
                  pressed: active,
                  className: cx(
                    "flex min-h-11 w-full items-center gap-3 rounded-[14px] px-4 py-2 hover:bg-creme",
                    active && "bg-creme ring-2 ring-sapin ring-inset",
                  ),
                },
              )}
            </span>
          );
        })}
        <p className="pt-2 text-xs text-ardoise">{t("style.font.hint")}</p>
      </section>

      <section aria-labelledby="style-density" className={cx(divider, "flex flex-col gap-3")}>
        <h3 id="style-density" className={cx(eyebrow, "text-ardoise")}>
          {t("template.density.text")}
        </h3>
        <div className="flex flex-wrap gap-1">
          {cvDensities.map((density) => (
            <span key={density}>
              {setting("density", density, t(`template.density.${density}`), {
                pressed: style.density === density,
                className: pillClass(
                  style.density === density ? "dark" : "outline",
                  "sm",
                  "h-11 px-4 ring-0",
                ),
              })}
            </span>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="style-photo"
        className={cx(divider, "flex items-start justify-between gap-3")}
      >
        <div className="flex flex-col gap-0.5">
          <h3 id="style-photo" className="text-sm font-semibold">
            {t("info.photo.text")}
          </h3>
          <p className="text-xs text-ardoise">
            {template.photo ? t("info.photo.hint") : t("style.photo.unsupported")}
          </p>
        </div>
        {template.photo ? (
          setting(
            "showPhoto",
            style.showPhoto ? "off" : "on",
            <span
              aria-hidden
              className={cx(
                "block size-5 rounded-full bg-blanc shadow transition",
                style.showPhoto && "translate-x-5",
              )}
            />,
            {
              label: t("info.photo.text"),
              pressed: style.showPhoto,
              className: cx(
                "flex h-7 w-12 shrink-0 items-center rounded-full p-1",
                style.showPhoto ? "bg-sapin" : "bg-brume",
              ),
            },
          )
        ) : (
          <span
            aria-hidden
            className="flex h-7 w-12 shrink-0 items-center rounded-full bg-brume/60 p-1 opacity-50"
          >
            <span className="block size-5 rounded-full bg-blanc" />
          </span>
        )}
      </section>

      <section aria-labelledby="style-language" className={cx(divider, "flex flex-col gap-3")}>
        <h3 id="style-language" className={cx(eyebrow, "text-ardoise")}>
          {t("style.titlesLanguage.text")}
        </h3>
        <div className="flex gap-1">
          {cvTitleLanguages.map((language) => (
            <span key={language}>
              {setting("titlesLanguage", language, t(`style.titlesLanguage.${language}`), {
                pressed: style.titlesLanguage === language,
                className: pillClass(
                  style.titlesLanguage === language ? "dark" : "outline",
                  "sm",
                  "h-11 px-5 ring-0",
                ),
              })}
            </span>
          ))}
        </div>
        <p className="text-xs text-ardoise">{t("style.titlesLanguage.hint")}</p>
      </section>
    </div>
  );
}
