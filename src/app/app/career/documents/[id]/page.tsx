import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CopyButton } from "@/components/career/copy-button";
import { Alert, Button, TextArea, TextField } from "@/components/ui";
import {
  applyCorrectionsAction,
  deleteDocumentAction,
  saveDocumentAction,
} from "@/server/actions/career-documents";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getDocument, TEXT_MAX } from "@/server/services/career-documents";

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

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/career/documents" className="text-sm underline">
        {t("career.documents.back")}
      </Link>
      <header className="flex flex-col gap-2">
        <p className="text-eyebrow text-ardoise">{t(`career.documents.type.${data.type}`)}</p>
        <h1 className="text-h1">{document.title}</h1>
      </header>
      {query.ok === "cree" && (
        <Alert tone="success" title={t("career.documents.created")}>
          {t("career.documents.template.notice")}
        </Alert>
      )}
      {query.ok === "enregistre" && <Alert tone="success" title={t("career.documents.saved")} />}
      {query.erreur === "input" && <Alert tone="error" title={t("career.documents.error.input")} />}

      {data.type === "proofread" && data.corrections.length > 0 && (
        <form
          id="corrections"
          action={applyCorrectionsAction}
          className="flex scroll-mt-24 flex-col gap-4 rounded-card bg-blanc p-6"
        >
          <input type="hidden" name="id" value={document.id} />
          <h2 className="text-h2">
            {t("career.documents.proofread.changes", { count: data.corrections.length })}
          </h2>
          <ul className="flex flex-col gap-3">
            {data.corrections.map((correction) => (
              <li key={correction.id} className="flex gap-3 rounded-card bg-creme p-4">
                <input
                  id={`correction-${correction.id}`}
                  type="checkbox"
                  name="correction"
                  value={correction.id}
                  defaultChecked
                  className="mt-1 size-5 shrink-0 accent-sapin"
                />
                <label htmlFor={`correction-${correction.id}`} className="flex-1">
                  <dl className="grid gap-1 text-sm sm:grid-cols-[100px_1fr]">
                    <dt className="font-medium">{t("career.documents.proofread.before")}</dt>
                    <dd className="line-through">{correction.before}</dd>
                    <dt className="font-medium">{t("career.documents.proofread.after")}</dt>
                    <dd className="font-semibold">{correction.after}</dd>
                    <dt className="font-medium">{t("career.documents.proofread.why")}</dt>
                    <dd>
                      {"text" in correction.why
                        ? correction.why.text
                        : t(`career.documents.proofread.rule.${correction.why.code as "spaces"}`)}
                    </dd>
                  </dl>
                </label>
              </li>
            ))}
          </ul>
          <div>
            <Button type="submit">{t("career.documents.proofread.apply")}</Button>
          </div>
        </form>
      )}
      {data.type === "proofread" && data.corrections.length === 0 && query.ok !== "enregistre" && (
        <Alert title={t("career.documents.proofread.changes", { count: 0 })} />
      )}

      <form
        key={document.updatedAt.toISOString()}
        action={saveDocumentAction}
        className="flex flex-col gap-4 rounded-card bg-blanc p-6"
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
          id={`document-text-${document.id}`}
          name="text"
          label={t("career.documents.edit.text")}
          defaultValue={data.text}
          maxLength={TEXT_MAX}
          rows={16}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">{t("career.documents.edit.save")}</Button>
          <CopyButton
            value={data.text}
            label={t("career.documents.copy")}
            copiedLabel={t("career.documents.copied")}
          />
          <a href={`/app/career/documents/${document.id}/pdf`} className="underline">
            {t("career.documents.export")}
          </a>
        </div>
      </form>

      <form action={deleteDocumentAction} className="flex flex-col items-start gap-2">
        <input type="hidden" name="id" value={document.id} />
        <p className="text-sm text-ardoise">{t("career.documents.delete.confirm")}</p>
        <Button type="submit" variant="tertiary">
          {t("career.documents.delete.cta")}
        </Button>
      </form>
    </div>
  );
}
