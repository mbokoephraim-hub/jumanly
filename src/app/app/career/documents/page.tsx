import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { AiGateNotice } from "@/components/career/ai-gate";
import { DocumentsAiPanel, DocumentsAside } from "@/components/career/documents-kit";
import { card, cardTitle, CareerTabs, IconTile, pillClass } from "@/components/career/kit";
import { Alert, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { proofreadAction } from "@/server/actions/career-documents";
import { aiFeatures } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  aiState,
  documentTypes,
  DOCUMENTS_GATE,
  listDocuments,
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

  const defaultType = documentTypes.find((type) => type === query.type);

  return (
    <>
      <AppPageHeader eyebrow={t("career.documents.subtitle")} title={t("career.documents.title")} />
      <CareerTabs active="documents" />
      {query.ok === "supprime" && <Alert tone="success" title={t("career.documents.deleted")} />}
      {query.erreur === "input" && <Alert tone="error" title={t("career.documents.error.input")} />}

      <div className="grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)_360px]">
        <div className="order-3 lg:order-1 lg:row-span-2 xl:row-span-1">
          <DocumentsAside documents={documents} />
        </div>
        <div className="order-2 flex min-w-0 flex-col gap-5 lg:order-2">
          {generate.state === "entitlement" ? (
            <AiGateNotice
              state="entitlement"
              plan={plan}
              lockText={t("career.documents.locked.body", { plan })}
              resetsAt={null}
            />
          ) : (
            <section
              id="correction"
              aria-labelledby="proofread-title"
              className={cx(card, "flex scroll-mt-24 flex-col gap-4 lg:p-[30px]")}
            >
              <div className="flex items-center gap-3">
                <IconTile icon="edit" size="sm" />
                <h2 id="proofread-title" className={cardTitle}>
                  {t("career.documents.type.proofread")}
                </h2>
              </div>
              <AiGateNotice
                state={check.state}
                plan={plan}
                resetsAt={check.resetsAt}
                outcome={typeof query.ia === "string" ? query.ia : undefined}
              />
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
                    rows={10}
                    required
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="submit" className={pillClass("dark")}>
                      {t("career.documents.proofread.cta")}
                    </button>
                    <span className="text-xs text-ardoise">
                      {t("career.documents.generate.cost", { count: aiFeatures.proofread.credits })}
                    </span>
                  </div>
                </form>
              )}
            </section>
          )}
          {documents.length > 0 && (
            <p className="flex items-center gap-2 text-[13px] text-ardoise">
              <Icon name="info" className="size-4 shrink-0" />
              {t("career.documents.pick")}
            </p>
          )}
        </div>
        {generate.state !== "entitlement" && (
          <div className="order-1 min-w-0 lg:order-3 lg:col-start-2 xl:col-start-3">
            <DocumentsAiPanel
              state={generate.state}
              plan={plan}
              resetsAt={generate.resetsAt}
              outcome={outcome}
              jobs={jobs}
              idPrefix="documents"
              defaultType={defaultType}
            />
          </div>
        )}
      </div>
    </>
  );
}
