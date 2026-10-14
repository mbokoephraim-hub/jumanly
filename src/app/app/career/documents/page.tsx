import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand/ai-orb";
import { AiGateNotice } from "@/components/career/ai-gate";
import { Alert, Button, EmptyState, Select, TextArea, TextField } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { generateDocumentAction, proofreadAction } from "@/server/actions/career-documents";
import { aiFeatures } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  aiState,
  documentLengths,
  documentTones,
  documentTypes,
  DOCUMENTS_GATE,
  listDocuments,
  parseDocument,
  PROOFREAD_MAX,
} from "@/server/services/career-documents";
import { interviewJobs } from "@/server/services/interview-sim";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.documents");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/**
 * Letters and documents (partie 07 § 3, `career.documents`): a proposal written from the profile
 * (and a job), then edited by the talent; proofreading of any text.
 */
export default async function DocumentsPage({ searchParams }: PageProps<"/app/career/documents">) {
  const query = await searchParams;
  const user = await requireUser("/app/career/documents");
  const t = await getTranslations();
  const [generate, check, plans, documents, jobs] = await Promise.all([
    aiState(db, user.id, "career_document", DOCUMENTS_GATE),
    aiState(db, user.id, "proofread", DOCUMENTS_GATE),
    listPublicPlans(db),
    listDocuments(db, user.id),
    interviewJobs(db, user.id),
  ]);
  const plan = talentPlanFor(plans, DOCUMENTS_GATE.key);
  const outcome = typeof query.ia === "string" ? query.ia : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/career" className="text-sm underline">
        {t("career.home.eyebrow")}
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{t("career.documents.title")}</h1>
        <p className="text-ardoise">{t("career.documents.subtitle")}</p>
      </header>
      {query.ok === "supprime" && <Alert tone="success" title={t("career.documents.deleted")} />}
      {query.erreur === "input" && <Alert tone="error" title={t("career.documents.error.input")} />}

      {generate.state === "entitlement" ? (
        <AiGateNotice
          state="entitlement"
          plan={plan}
          lockText={t("career.documents.locked.body", { plan })}
          resetsAt={null}
        />
      ) : (
        <>
          <section
            id="nouveau"
            aria-labelledby="new-title"
            className="flex scroll-mt-24 flex-col gap-4 rounded-card bg-blanc p-6"
          >
            <div className="flex items-center gap-2">
              <AiOrb />
              <h2 id="new-title" className="text-h2">
                {t("career.documents.generate.title")}
              </h2>
            </div>
            <AiGateNotice
              state={generate.state}
              plan={plan}
              resetsAt={generate.resetsAt}
              outcome={outcome}
            />
            {generate.state === "ready" && (
              <form action={generateDocumentAction} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    id="document-type"
                    name="type"
                    label={t("career.documents.generate.type")}
                    defaultValue="letter"
                    options={documentTypes.map((type) => ({
                      value: type,
                      label: t(`career.documents.type.${type}`),
                    }))}
                  />
                  <Select
                    id="document-job"
                    name="jobId"
                    label={t("career.documents.generate.job")}
                    defaultValue=""
                    options={[
                      { value: "", label: t("career.documents.generate.noJob") },
                      ...jobs.map((job) => ({ value: job.id, label: job.title })),
                    ]}
                  />
                  <Select
                    id="document-tone"
                    name="tone"
                    label={t("career.documents.generate.tone.text")}
                    defaultValue="formal"
                    options={documentTones.map((tone) => ({
                      value: tone,
                      label: t(`career.documents.generate.tone.${tone}`),
                    }))}
                  />
                  <Select
                    id="document-length"
                    name="length"
                    label={t("career.documents.generate.length.text")}
                    defaultValue="standard"
                    options={documentLengths.map((length) => ({
                      value: length,
                      label: t(`career.documents.generate.length.${length}`),
                    }))}
                  />
                </div>
                <TextArea
                  id="document-points"
                  name="points"
                  label={t("career.documents.generate.points.text")}
                  placeholder={t("career.documents.generate.points.placeholder")}
                  maxLength={600}
                  rows={3}
                />
                <p className="text-sm text-ardoise">
                  {t("career.documents.generate.cost", {
                    count: aiFeatures.career_document.credits,
                  })}
                </p>
                <div>
                  <Button type="submit">{t("career.documents.generate.cta")}</Button>
                </div>
              </form>
            )}
          </section>

          <section
            id="correction"
            aria-labelledby="proofread-title"
            className="flex scroll-mt-24 flex-col gap-4 rounded-card bg-blanc p-6"
          >
            <h2 id="proofread-title" className="text-h2">
              {t("career.documents.type.proofread")}
            </h2>
            <AiGateNotice state={check.state} plan={plan} resetsAt={check.resetsAt} />
            {check.state === "ready" && (
              <form action={proofreadAction} className="flex flex-col gap-4">
                <TextField
                  id="proofread-title-field"
                  name="title"
                  label={t("career.documents.proofread.title")}
                  maxLength={120}
                />
                <TextArea
                  id="proofread-text"
                  name="text"
                  label={t("career.documents.proofread.paste")}
                  maxLength={PROOFREAD_MAX}
                  rows={8}
                  required
                />
                <p className="text-sm text-ardoise">
                  {t("career.documents.generate.cost", { count: aiFeatures.proofread.credits })}
                </p>
                <div>
                  <Button type="submit" variant="secondary">
                    {t("career.documents.proofread.cta")}
                  </Button>
                </div>
              </form>
            )}
          </section>
        </>
      )}

      <section aria-labelledby="list-title" className="flex flex-col gap-3">
        <h2 id="list-title" className="text-h2">
          {t("career.documents.title")}
        </h2>
        {documents.length === 0 ? (
          <EmptyState title={t("career.documents.list.empty")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {documents.map((document) => {
              const content = parseDocument(document.content);
              return (
                <li
                  key={document.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-blanc p-4"
                >
                  <span className="flex flex-col gap-1">
                    <Link
                      href={`/app/career/documents/${document.id}`}
                      className="font-semibold underline"
                    >
                      {document.title}
                    </Link>
                    <span className="text-sm text-ardoise">
                      {[
                        content ? t(`career.documents.type.${content.type}`) : null,
                        t("career.cv.updated", { date: formatDate(document.updatedAt) }),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <Link href={`/app/career/documents/${document.id}`} className="underline">
                    {t("career.documents.open")}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
