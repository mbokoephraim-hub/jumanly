import type { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AiGateNotice, type AiGateState } from "@/components/career/ai-gate";
import { AiBrand, AiPanel, card, eyebrow, IconTile, pillClass, Why } from "@/components/career/kit";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { generateDocumentAction } from "@/server/actions/career-documents";
import { aiFeatures } from "@/server/ai";
import {
  documentLengths,
  documentTones,
  documentTypes,
  parseDocument,
  type DocumentType,
} from "@/server/services/career-documents";

/** Pieces shared by the documents list and a document (mockup 03-11). */

type DocumentRow = { id: string; title: string; content: Prisma.JsonValue; updatedAt: Date };

/** « Mes documents » and the shortcuts of « Nouveau document ». */
export async function DocumentsAside({
  documents,
  activeId,
}: {
  documents: DocumentRow[];
  activeId?: string;
}) {
  const t = await getTranslations("career");
  const prefix = `documents-${activeId ?? "list"}`;
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <section
        aria-labelledby={`${prefix}-mine`}
        className={cx(card, "flex flex-col gap-2 lg:p-3.5")}
      >
        <div className="flex items-center justify-between gap-2 px-2 pt-1 pb-1.5">
          <h2 id={`${prefix}-mine`} className="text-[17px] font-semibold">
            {t("documents.mine")}
          </h2>
          <span className="flex size-[26px] items-center justify-center rounded-full bg-creme text-xs font-semibold">
            {documents.length}
          </span>
        </div>
        {documents.length === 0 ? (
          <p className="px-2 pb-2 text-sm text-ardoise">{t("documents.list.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {documents.map((document) => {
              const content = parseDocument(document.content);
              const active = document.id === activeId;
              return (
                <li key={document.id}>
                  <Link
                    href={`/app/career/documents/${document.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex items-start gap-3 rounded-[18px] p-3",
                      active ? "bg-sapin text-blanc" : "hover:bg-creme",
                    )}
                  >
                    <IconTile icon="doc" size="sm" tone="bg-lime" />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm leading-5 font-semibold">{document.title}</span>
                      {content && (
                        <span className={cx("text-xs", active ? "text-blanc/80" : "text-ardoise")}>
                          {t(`documents.type.${content.type}`)}
                        </span>
                      )}
                      <span className={cx("text-xs", active ? "text-blanc/70" : "text-ardoise")}>
                        {t("cv.updated", { date: formatDate(document.updatedAt) })}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <nav aria-labelledby={`${prefix}-new`} className={cx(card, "flex flex-col gap-1 lg:p-4")}>
        <h2 id={`${prefix}-new`} className={cx(eyebrow, "pb-2 text-ardoise")}>
          {t("documents.new")}
        </h2>
        <ul className="flex flex-col">
          {[...documentTypes, "proofread" as const].map((type) => (
            <li key={type}>
              <Link
                href={
                  type === "proofread"
                    ? "/app/career/documents#correction"
                    : `/app/career/documents?type=${type}#nouveau`
                }
                className="flex items-start gap-2.5 rounded-xl px-1 py-2 text-sm hover:bg-creme"
              >
                <Icon name="plus" className="mt-0.5 size-4 shrink-0 text-feuille" />
                {t(`documents.type.${type}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

const field =
  "h-11 w-full appearance-none pr-10 rounded-[14px] bg-blanc/10 px-3.5 text-sm text-blanc ring-1 ring-blanc/25 ring-inset focus-visible:outline-2 focus-visible:outline-neon [&>option]:text-sapin";
const label = "text-xs font-semibold";

/** « Rédiger avec l'IA »: the proposal form, in the green gradient panel. */
export async function DocumentsAiPanel({
  state,
  plan,
  resetsAt,
  outcome,
  jobs,
  defaultType = "letter",
  idPrefix,
}: {
  /** Unique per page: hidden routes stay in the DOM (cacheComponents). */
  idPrefix: string;
  state: AiGateState;
  plan: string;
  resetsAt: Date | null;
  outcome?: string;
  jobs: { id: string; title: string }[];
  defaultType?: DocumentType;
}) {
  const t = await getTranslations("career.documents");
  const tAi = await getTranslations("ai");
  return (
    <AiPanel labelledBy={`${idPrefix}-new`} className="scroll-mt-24">
      <div className="flex flex-col gap-0.5">
        <h2 id={`${idPrefix}-new`} className="text-[17px] font-semibold">
          {t("generate.title")}
        </h2>
        <AiBrand />
      </div>
      <AiGateNotice state={state} plan={plan} resetsAt={resetsAt} outcome={outcome} />
      {state === "ready" && (
        <form id="nouveau" action={generateDocumentAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${idPrefix}-type`} className={label}>
              {t("generate.type")}
            </label>
            <div className="relative">
              <select
                id={`${idPrefix}-type`}
                name="type"
                defaultValue={defaultType}
                className={field}
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {t(`type.${type}`)}
                  </option>
                ))}
              </select>
              <Icon
                name="chev-d"
                className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${idPrefix}-job`} className={label}>
              {t("generate.job")}
            </label>
            <div className="relative">
              <select id={`${idPrefix}-job`} name="jobId" defaultValue="" className={field}>
                <option value="">{t("generate.noJob")}</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
              <Icon
                name="chev-d"
                className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2"
              />
            </div>
          </div>
          <Segmented
            name="tone"
            legend={t("generate.tone.text")}
            value="formal"
            options={documentTones.map((tone) => ({
              value: tone,
              label: t(`generate.tone.${tone}`),
            }))}
          />
          <Segmented
            name="length"
            legend={t("generate.length.text")}
            value="standard"
            options={documentLengths.map((length) => ({
              value: length,
              label: t(`generate.length.${length}`),
            }))}
            separate
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${idPrefix}-points`} className={label}>
              {t("generate.points.text")}
            </label>
            <textarea
              id={`${idPrefix}-points`}
              name="points"
              rows={2}
              maxLength={600}
              placeholder={t("generate.points.placeholder")}
              className={cx(field, "h-auto py-3 leading-5 placeholder:text-blanc/60")}
            />
          </div>
          <button type="submit" className={pillClass("lime", "md", "w-full")}>
            <Icon name="intelligence" className="size-4" />
            {t("generate.cta")}
          </button>
          <p className="text-center text-xs text-blanc/80">
            {t("generate.cost", { count: aiFeatures.career_document.credits })}
          </p>
        </form>
      )}
      <Why dark>{tAi("disclaimer.noInvention")}</Why>
    </AiPanel>
  );
}

/** Radio pills (tone, length) on the dark panel. */
function Segmented({
  name,
  legend,
  value,
  options,
  separate = false,
}: {
  name: string;
  legend: string;
  value: string;
  options: { value: string; label: string }[];
  separate?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={cx(label, "mb-1.5")}>{legend}</legend>
      <div
        className={cx(
          "flex flex-wrap gap-1.5",
          !separate && "rounded-[16px] bg-blanc/10 p-1 ring-1 ring-blanc/20 ring-inset",
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cx(
              "relative flex h-9 cursor-pointer items-center px-3.5 text-[13px] font-semibold has-focus-visible:outline-2 has-focus-visible:outline-neon",
              separate
                ? "rounded-pill ring-1 ring-blanc/30 ring-inset has-checked:bg-lime has-checked:text-sapin has-checked:ring-lime"
                : "rounded-[12px] has-checked:bg-sapin has-checked:text-blanc",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === value}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
