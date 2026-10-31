import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CopyButton } from "@/components/talent/copy-button";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { dynamic } from "@/i18n/dynamic";
import {
  applyCorrectionsAction,
  deleteDocumentAction,
  saveDocumentAction,
} from "@/server/actions/career-documents";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { DOCUMENTS_GATE, getDocument, TEXT_MAX } from "@/server/services/career-documents";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";
import { isPhone } from "@/server/view";
import { PhoneLetter } from "@/components/phone/career/letter-view";
import { orbiLimitCode } from "@/components/talent/cv/orbi-limit";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("docs.letter");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * A letter or a document of « Lettres » (planche talent-4 § 6, same screens as « CV et
 * documents »): the corrections Orbi proposes, to keep one by one, then the text to edit, copy or
 * download. Nothing is sent by Jumanly.
 */
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
  const d = dynamic(t);
  const { data } = document;
  const proposal = data.type !== "proofread";

  if (await isPhone()) {
    const plans = await listPublicPlans(db);
    const notices = ["cree", "enregistre", "relu", "utilisee"] as const;
    const notice =
      query.erreur === "input" ? "input" : (notices.find((value) => value === query.ok) ?? null);
    return (
      <PhoneLetter
        document={document}
        notice={notice}
        aiError={orbiLimitCode(query.ia)}
        plan={talentPlanFor(plans, DOCUMENTS_GATE.key)}
      />
    );
  }

  return (
    <div className="t-flux t-od-bas">
      <FlowHead
        back="/app/career/cv?vue=lettres"
        backLabel={t("docs.back")}
        title={document.title}
        end={
          <SheetButton
            target="lettre-options"
            className="t-bi t-press"
            label={t("docs.letter.more")}
          >
            <TalentIcon name="plus-options" size="s" />
          </SheetButton>
        }
      />
      {query.ok === "cree" && <Notice tone="ok">{t("docs.letter.created")}</Notice>}
      {query.ok === "enregistre" && <Notice tone="ok">{t("docs.letter.saved")}</Notice>}
      {query.erreur === "input" && <Notice tone="err">{t("docs.letter.error")}</Notice>}

      {data.type === "proofread" && data.corrections.length > 0 && (
        <form action={applyCorrectionsAction} className="t-flux">
          <input type="hidden" name="id" value={document.id} />
          <h2 className="t-ck-t">
            {t("docs.letter.corrections", { count: data.corrections.length })}
          </h2>
          <ul className="t-flux t-serre">
            {data.corrections.map((correction) => (
              <li key={correction.id}>
                <label className="t-verre t-ch t-corr t-press">
                  <input type="checkbox" name="correction" value={correction.id} defaultChecked />
                  <span className="t-t">
                    <span className="t-avant">
                      <span className="sr-only">{t("docs.letter.before")}</span>
                      <del>{correction.before}</del>
                    </span>
                    <b>
                      <span className="sr-only">{t("docs.letter.after")}</span>
                      {correction.after}
                    </b>
                    <span>
                      {"text" in correction.why
                        ? correction.why.text
                        : d(`career.documents.proofread.rule.${correction.why.code}`)}
                    </span>
                  </span>
                  <span className="t-coche" aria-hidden>
                    <TalentIcon name="valider" size="xs" />
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <button type="submit" className="t-bt t-sec t-m t-press">
            {t("docs.letter.applyCorrections")}
          </button>
        </form>
      )}

      <form
        id="lettre-texte"
        key={document.updatedAt.toISOString()}
        action={saveDocumentAction}
        className="t-flux"
      >
        <input type="hidden" name="id" value={document.id} />
        <div className="t-champ">
          <label htmlFor={`lettre-titre-${document.id}`}>{t("docs.letter.name")}</label>
          <span className="t-verre t-saisie">
            <input
              id={`lettre-titre-${document.id}`}
              name="title"
              defaultValue={document.title}
              maxLength={120}
              required
            />
          </span>
        </div>
        <div className="t-champ">
          <label htmlFor={`lettre-corps-${document.id}`}>{t("docs.letter.text")}</label>
          <textarea
            id={`lettre-corps-${document.id}`}
            name="text"
            defaultValue={data.text}
            maxLength={TEXT_MAX}
            rows={16}
            className="t-verre t-zone-texte"
          />
        </div>
        {proposal && (
          <p className="t-gar">
            <TalentIcon name="cadenas" size="s" />
            {t("docs.letter.note")}
          </p>
        )}
      </form>

      <div className="t-verre t-fort t-bas-f">
        <CopyButton
          value={data.text}
          label={t("docs.letter.copy")}
          copied={t("docs.letter.copied")}
          className="t-bt t-sec t-m t-press"
        />
        <button type="submit" form="lettre-texte" className="t-bt t-p t-pl t-press">
          {t("docs.letter.save")}
        </button>
      </div>

      <Sheet id="lettre-options" title={t("docs.letter.more")} closeLabel={t("offer.close")}>
        <div className="t-verre t-liste t-lignes">
          <div className="t-li">
            <span className="t-cases t-c1">
              <TalentIcon name="telecharger" size="s" />
            </span>
            <span className="t-t">
              <a href={`/app/career/documents/${document.id}/pdf`} className="t-lien">
                <b>{t("docs.menu.pdf")}</b>
              </a>
            </span>
          </div>
          <form action={deleteDocumentAction} className="t-li t-danger">
            <input type="hidden" name="id" value={document.id} />
            <span className="t-cases">
              <TalentIcon name="supprimer" size="s" />
            </span>
            <span className="t-t">
              <button type="submit" className="t-lien">
                <b>{t("docs.menu.delete")}</b>
              </button>
            </span>
          </form>
        </div>
      </Sheet>
    </div>
  );
}
