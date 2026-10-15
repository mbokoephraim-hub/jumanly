import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { cx } from "@/lib/cx";
import { cvTemplateRegistry, type CvTemplate } from "@/features/cv/templates/registry";
import type { CvScore } from "@/server/services/cv-coach";

/** Pieces shared by « Mes CV » and the CV editor (docs/refonte-career/BRIEF-CV-V2.md). */

/** The preview image of a template, as in `StylePanel` (public/cv-templates/NN-<id>.png). */
export function templateThumb(template: CvTemplate) {
  const number = cvTemplateRegistry.findIndex((item) => item.id === template.id) + 1;
  return `/cv-templates/${String(number).padStart(2, "0")}-${template.id}.png`;
}

/** A decorative CV sheet: the template's preview, on a white paper with a soft shadow. */
export function CvSheet({
  template,
  width,
  className,
  style,
}: {
  template: CvTemplate;
  width: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "block overflow-hidden rounded-[6px] bg-blanc shadow-[0_22px_40px_-18px_rgb(11_26_31/0.55)] ring-1 ring-sapin/8",
        className,
      )}
      style={{ width, ...style }}
    >
      <Image
        src={templateThumb(template)}
        alt=""
        width={600}
        height={849}
        sizes={`${width}px`}
        className="block h-auto w-full"
      />
    </span>
  );
}

const criteria = ["ats", "impact", "keywords"] as const;

/** The three real criteria of `cvScore`, as bars (label, Signature bar, tabular value). */
export async function CriteriaBars({
  score,
  dark = false,
  layout = "rows",
}: {
  score: CvScore;
  dark?: boolean;
  /** "columns": side by side (CV principal); "rows": one under the other (coach). */
  layout?: "rows" | "columns";
}) {
  const t = await getTranslations("career.cv.criteria");
  return (
    <dl
      className={cx(
        "grid gap-x-4",
        layout === "columns" ? "grid-cols-3 gap-y-1" : "grid-cols-1 gap-y-2.5",
      )}
    >
      {criteria.map((key) => {
        const value = score[key];
        return (
          <div
            key={key}
            className={cx(
              "grid min-w-0 items-center gap-x-3 gap-y-1.5",
              layout === "columns"
                ? "grid-cols-1"
                : "grid-cols-[minmax(0,92px)_minmax(0,1fr)_auto]",
            )}
          >
            <dt className={cx("truncate text-xs", dark ? "text-blanc/85" : "text-ardoise")}>
              {t(key)}
            </dt>
            <dd className="contents">
              <span
                className={cx(
                  "font-semibold tabular-nums",
                  layout === "columns" ? "order-2 text-[15px]" : "order-3 text-xs",
                )}
              >
                {value}
              </span>
              <span
                aria-hidden
                className={cx(
                  "block h-1.5 overflow-hidden rounded-pill",
                  layout === "columns" ? "order-3" : "order-2",
                  dark ? "bg-blanc/15" : "bg-sapin/10",
                )}
              >
                <span
                  className="jm-gauge block h-full origin-left rounded-pill bg-[image:var(--jm-degrade-signature)]"
                  style={{ transform: `scaleX(${Math.max(0, Math.min(100, value)) / 100})` }}
                />
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Dotted grid over an illustration (Sapin 12 %, or white on dark backgrounds). */
export function Dots({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        "pointer-events-none absolute inset-0",
        light ? "jm-cv-dots-light" : "jm-cv-dots",
        className,
      )}
    />
  );
}
