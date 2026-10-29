import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { LetterCreateForm, LetterProofreadForm } from "@/components/talent/cv/letter-form";
import { Notice } from "@/components/talent/notice";
import { OrbiLimit, orbiLimitCode } from "@/components/talent/cv/orbi-limit";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { aiState, DOCUMENTS_GATE, tailorOffers } from "@/server/services/career-documents";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("docs.letters.create");
  return { title: t("title"), robots: { index: false } };
}

/**
 * « Nouvelle lettre » on a phone (Carrière › Mes documents, demande d'Ephraïm du 29/10/2026): the
 * form of the sheet of « CV et documents », on its own page, then « Faire relire un texte ». On a
 * computer, the sheet over the documents.
 */
export default async function NewLetterPage({
  searchParams,
}: PageProps<"/app/career/lettres/nouvelle">) {
  const user = await requireUser("/app/career/lettres/nouvelle");
  if (!(await isPhone())) redirect("/app/career/cv?vue=lettres&nouvelle=1");
  const params = await searchParams;
  const [t, generate, check, plans, offers] = await Promise.all([
    getTranslations(),
    aiState(db, user.id, "career_document", DOCUMENTS_GATE),
    aiState(db, user.id, "proofread", DOCUMENTS_GATE),
    listPublicPlans(db),
    tailorOffers(db, user.id),
  ]);
  const aiError = orbiLimitCode(params.ia);
  return (
    <div className="t-flux t-od-bas">
      <FlowHead
        back="/app/career/cv?onglet=documents"
        backLabel={t("docs.back")}
        title={t("docs.letters.create.title")}
      />
      {params.erreur === "input" && <Notice tone="err">{t("docs.letters.inputError")}</Notice>}
      {aiError && <OrbiLimit code={aiError} plan={talentPlanFor(plans, DOCUMENTS_GATE.key)} />}
      <LetterCreateForm
        state={generate.state}
        plan={talentPlanFor(plans, DOCUMENTS_GATE.key)}
        offers={offers}
        phone
      />
      {check.state === "ready" && (
        <section className="t-flux" aria-labelledby="lettre-relire-t">
          <h2 id="lettre-relire-t" className="t-ck-t">
            {t("docs.letters.proofread.title")}
          </h2>
          <LetterProofreadForm phone />
        </section>
      )}
    </div>
  );
}
