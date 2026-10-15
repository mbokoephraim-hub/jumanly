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
    <div className="grid grid-cols-8 gap-1.5">
      {cvColors
        .filter((color) => color.ats === ats)
        .map((color) => {
          const active = accent.toUpperCase() === color.hex;
          return (
            <span key={color.code} className="flex justify-center">
              {setting(
                "accent",
                color.code,
                active ? <Icon name="check" className="size-4 text-blanc" /> : null,
                {
                  label: tColors(color.code),
                  pressed: active,
                  color: color.hex,
                  className: cx(
                    "flex size-[30px] items-center justify-center rounded-full ring-offset-2 ring-offset-blanc focus-visible:outline-2 focus-visible:outline-sapin pointer-coarse:size-9",
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
      <div className="flex items-center gap-3.5 rounded-[20px] bg-creme p-3">
        <Image
          src={`/cv-templates/${String(number).padStart(2, "0")}-${template.id}.png`}
          alt=""
          width={600}
          height={849}
          className="h-[90px] w-16 shrink-0 rounded-md bg-blanc object-cover object-top shadow-[0_10px_20px_-12px_rgb(11_26_31/0.5)] ring-1 ring-brume"
        />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <p className="font-semibold">{d(`template.name.${templateKey(template.id)}`)}</p>
          <p className="inline-flex items-center gap-1 rounded-pill bg-lime-clair px-2.5 py-0.5 text-xs font-semibold">
            <Icon name="check" className="size-3" />
            {t(`template.ats.${template.ats}`)}
          </p>
          <Link
            href={`/app/career/cv/modeles?cv=${documentId}`}
            className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-up-texte hover:underline lg:min-h-0"
          >
            {t("template.change")}
            <Icon name="chev-r" className="size-4" />
          </Link>
        </div>
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
          <span className="flex h-11 min-w-[150px] flex-1 items-center gap-2 rounded-pill bg-blanc px-3.5 ring-1 ring-brume focus-within:ring-2 focus-within:ring-sapin">
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
                    "flex min-h-12 w-full items-center gap-3 rounded-[16px] px-4 py-2 hover:bg-creme",
                    active && "bg-blanc ring-2 ring-sapin ring-inset hover:bg-blanc",
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
        <div className="grid grid-cols-3 gap-2">
          {cvDensities.map((density, index) => (
            <span key={density} className="flex">
              {setting(
                "density",
                density,
                <>
                  <span aria-hidden className="flex w-8 flex-col" style={{ gap: 6 - index * 2 }}>
                    {Array.from({ length: 3 + index }, (_, line) => (
                      <span key={line} className="block h-0.5 rounded-sm bg-current" />
                    ))}
                  </span>
                  {t(`template.density.${density}`)}
                </>,
                {
                  pressed: style.density === density,
                  className: cx(
                    "flex min-h-[72px] flex-1 flex-col items-center justify-center gap-2 rounded-[16px] bg-blanc px-2 py-2.5 text-xs font-semibold ring-1 ring-brume ring-inset hover:bg-creme",
                    style.density === density &&
                      "ring-2 ring-sapin shadow-[0_0_0_3px_var(--color-lime)]",
                  ),
                },
              )}
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
                "flex h-7 w-12 shrink-0 items-center rounded-full p-1 [&>span]:bg-blanc",
                style.showPhoto ? "bg-sapin [&>span]:bg-lime" : "bg-brume",
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
        <div className="grid grid-cols-2 gap-1 rounded-pill bg-creme p-1">
          {cvTitleLanguages.map((language) => (
            <span key={language} className="flex">
              {setting("titlesLanguage", language, t(`style.titlesLanguage.${language}`), {
                pressed: style.titlesLanguage === language,
                className: cx(
                  "flex h-11 flex-1 items-center justify-center rounded-pill text-sm font-semibold",
                  style.titlesLanguage === language ? "bg-sapin text-blanc" : "hover:bg-blanc/70",
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
