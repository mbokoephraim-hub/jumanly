import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { CopyButton } from "@/components/career/copy-button";
import { DocumentsAiPanel, DocumentsAside } from "@/components/career/documents-kit";
import { card, CareerTabs, pillClass } from "@/components/career/kit";
import { Alert, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import {
  applyCorrectionsAction,
  deleteDocumentAction,
  saveDocumentAction,
} from "@/server/actions/career-documents";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  aiState,
  DOCUMENTS_GATE,
  getDocument,
  listDocuments,
  TEXT_MAX,
} from "@/server/services/career-documents";
import { interviewJobs } from "@/server/services/interview-sim";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.documents");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/** A document: proposed corrections to accept one by one, then the text to edit, copy or export. */
export default async function DocumentPage({
  params,
  searchParams,
}: PageProps<"/app/career/documents/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser(`/app/career/documents/${id}`);
  const document = await getDocument(db, user.id, id);
  if (!document) notFound();
  const t = await getTranslations();
  const { data } = document;

  const [generate, plans, documents, jobs] = await Promise.all([
    aiState(db, user.id, "career_document", DOCUMENTS_GATE),
    listPublicPlans(db),
    listDocuments(db, user.id),
    interviewJobs(db, user.id),
  ]);
  const plan = talentPlanFor(plans, DOCUMENTS_GATE.key);
  const proposal = data.type !== "proofread";
  const textId = `document-text-${document.id}`;

  return (
    <>
      <AppPageHeader eyebrow={t("career.documents.subtitle")} title={t("career.documents.title")} />
      <CareerTabs active="documents" />

      <div className="grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)_360px]">
        <div className="order-3 lg:order-1 lg:row-span-2 xl:row-span-1">
          <DocumentsAside documents={documents} activeId={document.id} />
        </div>

        <article
          aria-labelledby="document-title"
          className={cx(card, "order-1 flex min-w-0 flex-col gap-5 lg:order-2 lg:p-[30px]")}
        >
          <header className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {proposal && (
                <span className="flex h-6 items-center gap-1 rounded-pill bg-sapin px-2.5 text-[11px] font-semibold text-neon">
                  <Icon name="intelligence" className="size-3" />
                  {t("career.documents.badge")}
                </span>
              )}
              <span className="text-xs text-ardoise">
                {t(`career.documents.type.${data.type}`)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2
                id="document-title"
                className="text-[22px] leading-tight font-bold tracking-tight lg:text-[26px]"
              >
                {document.title}
              </h2>
              {query.ok === "enregistre" && (
                <span className="flex h-6 items-center gap-1 rounded-pill bg-lime-clair px-2.5 text-[11px] font-semibold">
                  <Icon name="check" className="size-3" />
                  {t("career.documents.saved")}
                </span>
              )}
            </div>
          </header>
          {query.ok === "cree" && (
            <Alert tone="success" title={t("career.documents.created")}>
              {t("career.documents.template.notice")}
            </Alert>
          )}
          {query.erreur === "input" && (
            <Alert tone="error" title={t("career.documents.error.input")} />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton
              value={data.text}
              label={t("career.documents.copy")}
              copiedLabel={t("career.documents.copied")}
              className={pillClass("outline", "sm")}
              icon={<Icon name="doc" className="size-4" />}
            />
            <a
              href={`/app/career/documents/${document.id}/pdf`}
              className={pillClass("outline", "sm")}
            >
              <Icon name="telecharger" className="size-4" />
              {t("career.documents.export")}
            </a>
            <a href={`#${textId}`} className={pillClass("outline", "sm")}>
              <Icon name="edit" className="size-4" />
              {t("career.documents.edit.cta")}
            </a>
          </div>

          {data.type === "proofread" && data.corrections.length > 0 && (
            <form
              id="corrections"
              action={applyCorrectionsAction}
              className="flex scroll-mt-24 flex-col gap-3"
            >
              <input type="hidden" name="id" value={document.id} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[17px] font-semibold">
                  {t("career.documents.type.proofread")}
                </h3>
                <span className="rounded-pill bg-lime px-2.5 py-1 text-[11px] font-semibold">
                  {t("career.documents.proofread.changes", { count: data.corrections.length })}
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {data.corrections.map((correction) => (
                  <li
                    key={correction.id}
                    className="flex gap-3 rounded-[14px] bg-creme px-4 py-3 has-checked:bg-lime-clair"
                  >
                    <input
                      id={`correction-${correction.id}`}
                      type="checkbox"
                      name="correction"
                      value={correction.id}
                      defaultChecked
                      className="mt-0.5 size-5 shrink-0 accent-sapin"
                    />
                    <label
                      htmlFor={`correction-${correction.id}`}
                      className="flex flex-1 flex-col gap-1 text-sm"
                    >
                      <span className="flex flex-wrap items-center gap-x-2">
                        <span className="sr-only">{t("career.documents.proofread.before")}</span>
                        <del className="text-down-texte">{correction.before}</del>
                        <Icon name="chev-r" className="size-3.5 text-ardoise" />
                        <span className="sr-only">{t("career.documents.proofread.after")}</span>
                        <ins className="font-semibold text-feuille-fonce no-underline">
                          {correction.after}
                        </ins>
                      </span>
                      <span className="text-xs text-ardoise">
                        <strong className="text-sapin">
                          {t("career.documents.proofread.why")}
                        </strong>
                        {" · "}
                        {"text" in correction.why
                          ? correction.why.text
                          : t(`career.documents.proofread.rule.${correction.why.code as "spaces"}`)}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <button type="submit" className={pillClass("dark", "sm", "self-start")}>
                {t("career.documents.proofread.apply")}
              </button>
            </form>
          )}
          {data.type === "proofread" &&
            data.corrections.length === 0 &&
            query.ok !== "enregistre" && (
              <Alert title={t("career.documents.proofread.changes", { count: 0 })} />
            )}

          <form
            key={document.updatedAt.toISOString()}
            action={saveDocumentAction}
            className="flex flex-col gap-4"
          >
            <input type="hidden" name="id" value={document.id} />
            <TextField
              id={`document-title-${document.id}`}
              name="title"
              label={t("career.documents.edit.title")}
              defaultValue={document.title}
              maxLength={120}
              required
            />
            <TextArea
              id={textId}
              name="text"
              label={t("career.documents.edit.text")}
              defaultValue={data.text}
              maxLength={TEXT_MAX}
              rows={18}
            />
            {proposal && (
              <p className="flex gap-2 text-xs leading-[17px] text-ardoise">
                <Icon name="eye" className="mt-px size-4 shrink-0" />
                {t("career.documents.aiNotice")}
              </p>
            )}
            <button type="submit" className={pillClass("dark", "sm", "self-start")}>
              {t("career.documents.edit.save")}
            </button>
          </form>

          <details className="border-t border-brume pt-4">
            <summary className="cursor-pointer text-[13px] font-semibold text-ardoise">
              {t("career.documents.delete.cta")}
            </summary>
            <form
              action={deleteDocumentAction}
              className="mt-3 flex flex-col items-start gap-2 rounded-[16px] bg-creme p-4"
            >
              <input type="hidden" name="id" value={document.id} />
              <p className="text-sm">{t("career.documents.delete.confirm")}</p>
              <button type="submit" className={pillClass("outline", "sm")}>
                {t("career.documents.delete.cta")}
              </button>
            </form>
          </details>
        </article>

        {generate.state !== "entitlement" && (
          <div className="order-2 min-w-0 lg:order-3 lg:col-start-2 xl:col-start-3">
            <DocumentsAiPanel
              state={generate.state}
              plan={plan}
              resetsAt={generate.resetsAt}
              jobs={jobs}
              idPrefix={`document-${document.id}`}
            />
          </div>
        )}
      </div>
    </>
  );
}
