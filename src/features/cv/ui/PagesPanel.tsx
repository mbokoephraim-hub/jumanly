"use client";

import { pillClass, card } from "@/components/career/kit";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { updateCvStyleAction } from "@/server/actions/cv";
import { usePaginationResult } from "../render/CvPreview";
import { MAX_PAGES, PAGES_WARNING } from "../style";

export type PagesLabels = {
  title: string;
  /** « {count} sur 3 au maximum » */
  count: string;
  /** « Page {number} » */
  page: string;
  breakHere: string;
  breakTarget: string;
  /** « Saut de page avant « {sectionName} » » */
  breakLabel: string;
  removeBreak: string;
  fitOne: string;
  fitFailed: string;
  hint: string;
  tooLong: string;
  overMax: string;
  itemTooLong: string;
};

/**
 * « Pages » (docs/modeles-cv § 4.7 and § 8.2): pages counted by the preview, manual page breaks
 * and « Faire tenir sur une page ».
 */
export function PagesPanel({
  documentId,
  targets,
  breaks,
  fitTried,
  labels,
}: {
  documentId: string;
  /** Blocks and items a page break can be put before. */
  targets: { id: string; name: string }[];
  breaks: string[];
  fitTried: boolean;
  labels: PagesLabels;
}) {
  const result = usePaginationResult();
  const pages = result?.pages ?? 0;
  const nameOf = (id: string) => targets.find((target) => target.id === id)?.name ?? id;
  const free = targets.filter((target) => !breaks.includes(target.id));
  return (
    <section aria-labelledby="cv-pages" className={cx(card, "flex flex-col gap-3 lg:p-5")}>
      <div className="flex items-center justify-between gap-2">
        <h2 id="cv-pages" className="text-[17px] font-semibold">
          {labels.title}
        </h2>
        <span role="status" className="rounded-pill bg-creme px-3 py-1 text-xs font-semibold">
          {pages > 0 ? labels.count.replace("{count}", String(pages)) : "–"}
        </span>
      </div>
      {pages > 0 && (
        <ol className="flex flex-wrap gap-2.5">
          {Array.from({ length: pages }, (_, index) => (
            <li
              key={index}
              className={cx(
                "flex aspect-[210/297] w-14 items-end justify-center rounded-md bg-blanc bg-[repeating-linear-gradient(180deg,transparent_0_9px,var(--color-brume)_9px_10px)] bg-[length:70%_70%] bg-[position:50%_30%] bg-no-repeat pb-1 text-[10px] text-ardoise shadow-[0_8px_16px_-10px_rgb(11_26_31/0.45)]",
                index >= MAX_PAGES
                  ? "ring-2 ring-down-texte"
                  : index === 0
                    ? "ring-2 ring-sapin"
                    : "ring-1 ring-brume",
              )}
            >
              {labels.page.replace("{number}", String(index + 1))}
            </li>
          ))}
          {pages < MAX_PAGES && (
            <li
              aria-hidden
              className="grid aspect-[210/297] w-14 place-items-center rounded-md border-[1.5px] border-dashed border-brume text-ardoise"
            >
              <Icon name="plus" className="size-4" />
            </li>
          )}
        </ol>
      )}
      {result?.alert === "element-trop-long" && (
        <p role="alert" className="text-sm font-semibold text-down-texte">
          {labels.itemTooLong}
        </p>
      )}
      {pages > MAX_PAGES ? (
        <p role="alert" className="text-sm font-semibold text-down-texte">
          {labels.overMax}
        </p>
      ) : (
        pages > PAGES_WARNING && <p className="text-sm text-ardoise">{labels.tooLong}</p>
      )}
      {breaks.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {breaks.map((id) => (
            <li
              key={id}
              className="flex items-center justify-between gap-2 border-y border-dashed border-feuille py-1.5 text-xs font-semibold text-up-texte"
            >
              {labels.breakLabel.replace("{sectionName}", nameOf(id))}
              <form action={updateCvStyleAction}>
                <input type="hidden" name="id" value={documentId} />
                <input type="hidden" name="setting" value="break" />
                <button
                  type="submit"
                  name="value"
                  value={id}
                  className="flex size-8 items-center justify-center rounded-full hover:bg-creme"
                >
                  <Icon name="fermer" label={labels.removeBreak} className="size-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {free.length > 0 && (
        <form action={updateCvStyleAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={documentId} />
          <input type="hidden" name="setting" value="break" />
          <label htmlFor="cv-break-target" className="text-xs font-semibold">
            {labels.breakTarget}
          </label>
          <select
            id="cv-break-target"
            name="value"
            className="h-11 rounded-[14px] bg-blanc px-3 text-sm ring-1 ring-brume"
          >
            {free.map((target) => (
              <option key={target.id} value={target.id}>
                {target.name}
              </option>
            ))}
          </select>
          <button type="submit" className={pillClass("outline", "sm", "h-10")}>
            <Icon name="plus" className="size-4" />
            {labels.breakHere}
          </button>
        </form>
      )}
      <form action={updateCvStyleAction}>
        <input type="hidden" name="id" value={documentId} />
        <input type="hidden" name="setting" value="fitOne" />
        <button type="submit" className={pillClass("outline", "sm", "h-11 w-full")}>
          {labels.fitOne}
        </button>
      </form>
      {fitTried && pages > 1 && (
        <p role="alert" className="text-sm font-semibold text-down-texte">
          {labels.fitFailed}
        </p>
      )}
      <p className="text-xs leading-[18px] text-ardoise">{labels.hint}</p>
    </section>
  );
}
