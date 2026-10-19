import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { OrbiLimit, orbiLimitCode } from "@/components/talent/cv/orbi-limit";
import { PdfButton } from "@/components/talent/cv/pdf-button";
import { cvFileName } from "@/features/cv/export/pdf";
import { templateKey } from "@/features/cv/examples";
import { splitName } from "@/features/cv/render/build";
import { templateOf } from "@/features/cv/templates/registry";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import {
  deleteDocumentAction,
  generateDocumentAction,
  proofreadAction,
} from "@/server/actions/career-documents";
import { createCv, deleteCv, duplicateCv, setPrimaryCv } from "@/server/actions/cv";
import { aiFeatures } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  aiState,
  documentTypes,
  DOCUMENTS_GATE,
  listDocuments,
  parseDocument,
  PROOFREAD_MAX,
  tailorOffers,
} from "@/server/services/career-documents";
import { MAX_CVS, parseCv } from "@/server/services/cv";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("docs.list");
  return { title: t("seo"), robots: { index: false } };
}

const views = ["cv", "lettres"] as const;
type View = (typeof views)[number];

/** The drawn page of a document (planche `.doc .mini`): five lines, the first one coloured. */
function Mini({ letter = false }: { letter?: boolean }) {
  return (
    <span aria-hidden className={cx("t-mini", letter && "t-l")}>
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

/**
 * CV et documents (planche talent-4 § 6): « CV » lists the CVs with their « … » menu, « Nouveau CV »
 * and « Importer »; « Lettres » lists the letters, the way to LinkedIn and « Nouvelle lettre ».
 */
export default async function CvAndDocumentsPage({ searchParams }: PageProps<"/app/career/cv">) {
  const params = await searchParams;
  const view: View = views.includes(params.vue as View) ? (params.vue as View) : "cv";
  const user = await requireUser("/app/career/cv");
  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const [cvs, letters, generate, check, plans, offers] = await Promise.all([
    db.document.findMany({
      where: { kind: "cv", profile: { userId: user.id } },
      orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        isPrimary: true,
        updatedAt: true,
        templateId: true,
        adaptedForJobId: true,
        content: true,
      },
    }),
    listDocuments(db, user.id),
    aiState(db, user.id, "career_document", DOCUMENTS_GATE),
    aiState(db, user.id, "proofread", DOCUMENTS_GATE),
    listPublicPlans(db),
    tailorOffers(db, user.id),
  ]);
  const atLimit = cvs.length >= MAX_CVS;
  const day = (date: Date) => format.dateTime(date, { day: "numeric", month: "short" });
  const fileName = (cv: (typeof cvs)[number]) => {
    const { firstName, lastName } = splitName(parseCv(cv.content).info.name.trim());
    return cvFileName([firstName, lastName].join(" "), cvs.length > 1 ? cv.title : undefined);
  };
  const plan = talentPlanFor(plans, DOCUMENTS_GATE.key);
  const aiError = orbiLimitCode(params.ia);
  const close = t("offer.close");
  const pdfLabels = {
    preparing: t("docs.pdf.preparing"),
    done: t("docs.pdf.done"),
    error: t("docs.pdf.error"),
  };

  const tabs = [
    { id: "cv", href: "/app/career/cv", label: t("docs.list.tab.cv"), count: cvs.length },
    {
      id: "lettres",
      href: "/app/career/cv?vue=lettres",
      label: t("docs.list.tab.letters"),
      count: letters.length,
    },
    { id: "linkedin", href: "/app/career/linkedin", label: t("docs.list.tab.linkedin") },
  ];

  return (
    <div className="t-flux">
      <FlowHead back="/app/compte" backLabel={t("docs.back")} title={t("docs.list.title")} />
      <nav aria-label={t("docs.list.tabs")} className="t-seg">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={tab.id === view ? "page" : undefined}
            className="t-press"
          >
            {tab.label}
            {tab.count !== undefined && <small>{tab.count}</small>}
          </Link>
        ))}
      </nav>

      {params.ok === "supprime" && (
        <Notice tone="ok">
          {view === "lettres" ? t("docs.list.letterDeleted") : t("docs.list.cvDeleted")}
        </Notice>
      )}
      {params.ok === "principal" && <Notice tone="ok">{t("docs.list.primaryDone")}</Notice>}
      {params.erreur === "limite" && (
        <Notice tone="err">{t("docs.list.limit", { max: MAX_CVS })}</Notice>
      )}
      {params.erreur === "input" && <Notice tone="err">{t("docs.letters.inputError")}</Notice>}
      {aiError && <OrbiLimit code={aiError} plan={plan} />}

      {view === "cv" ? (
        <>
          {cvs.length === 0 ? (
            <div className="t-verre t-carte t-vide">
              <b>{t("docs.list.empty.title")}</b>
              <p>{t("docs.list.empty.text")}</p>
            </div>
          ) : (
            <ul className="t-flux t-serre">
              {cvs.map((cv) => (
                <li key={cv.id} className="t-verre t-doc">
                  <Mini />
                  <span className="t-t">
                    <Link href={`/app/career/cv/${cv.id}`} className="t-lien">
                      <b>{cv.title}</b>
                    </Link>
                    <span>
                      {cv.adaptedForJobId
                        ? t("docs.list.adapted", { date: day(cv.updatedAt) })
                        : t("docs.list.cvLine", {
                            template: d(
                              `career.cv.template.name.${templateKey(templateOf(cv.templateId).id)}`,
                            ),
                            date: day(cv.updatedAt),
                          })}
                    </span>
                    {cv.isPrimary && <span className="t-pp">{t("docs.list.primary")}</span>}
                  </span>
                  <SheetButton
                    target={`cv-menu-${cv.id}`}
                    className="t-bi t-press"
                    label={t("docs.list.more", { title: cv.title })}
                  >
                    <TalentIcon name="plus-options" size="s" />
                  </SheetButton>
                </li>
              ))}
            </ul>
          )}
          <div className="t-bts">
            {atLimit ? (
              <p className="t-gar">
                <TalentIcon name="aide" size="s" />
                {t("docs.list.limit", { max: MAX_CVS })}
              </p>
            ) : (
              <SheetButton target="cv-nouveau" className="t-bt t-p t-m t-pl t-press">
                <TalentIcon name="plus" size="s" />
                {t("docs.list.new")}
              </SheetButton>
            )}
            <Link href="/app/profil/import" className="t-bt t-sec t-m t-pl t-press">
              <TalentIcon name="telecharger" size="s" />
              {t("docs.list.import")}
            </Link>
          </div>

          {cvs.map((cv) => (
            <Sheet key={cv.id} id={`cv-menu-${cv.id}`} title={cv.title} closeLabel={close}>
              <div className="t-verre t-liste t-lignes">
                <div className="t-li">
                  <span className="t-cases t-c2">
                    <TalentIcon name="modifier" size="s" />
                  </span>
                  <span className="t-t">
                    <Link href={`/app/career/cv/${cv.id}`} className="t-lien">
                      <b>{t("docs.menu.open")}</b>
                    </Link>
                  </span>
                  <TalentIcon name="suivant" />
                </div>
                <div className="t-li">
                  <span className="t-cases t-c1">
                    <TalentIcon name="telecharger" size="s" />
                  </span>
                  <span className="t-t">
                    <PdfButton
                      documentId={cv.id}
                      fileName={fileName(cv)}
                      labels={pdfLabels}
                      className="t-lien"
                    >
                      <b>{t("docs.menu.pdf")}</b>
                    </PdfButton>
                  </span>
                </div>
                {!cv.isPrimary && (
                  <form action={setPrimaryCv} className="t-li">
                    <input type="hidden" name="id" value={cv.id} />
                    <input type="hidden" name="retour" value="liste" />
                    <span className="t-cases t-c3">
                      <TalentIcon name="favori" size="s" />
                    </span>
                    <span className="t-t">
                      <button type="submit" className="t-lien">
                        <b>{t("docs.menu.primary")}</b>
                      </button>
                      <span>{t("docs.menu.primaryHint")}</span>
                    </span>
                  </form>
                )}
                <div className="t-li">
                  <span className="t-cases">
                    <TalentIcon name="cv" size="s" />
                  </span>
                  <span className="t-t">
                    <Link href={`/app/career/cv/modeles?cv=${cv.id}`} className="t-lien">
                      <b>{t("docs.menu.template")}</b>
                    </Link>
                  </span>
                  <TalentIcon name="suivant" />
                </div>
                {!atLimit && (
                  <form action={duplicateCv} className="t-li">
                    <input type="hidden" name="id" value={cv.id} />
                    <span className="t-cases">
                      <TalentIcon name="document" size="s" />
                    </span>
                    <span className="t-t">
                      <button type="submit" className="t-lien">
                        <b>{t("docs.menu.duplicate")}</b>
                      </button>
                    </span>
                  </form>
                )}
                <form action={deleteCv} className="t-li t-danger">
                  <input type="hidden" name="id" value={cv.id} />
                  <span className="t-cases">
                    <TalentIcon name="supprimer" size="s" />
                  </span>
                  <span className="t-t">
                    <button type="submit" className="t-lien">
                      <b>{t("docs.menu.delete")}</b>
                    </button>
                    <span>{t("docs.menu.deleteHint")}</span>
                  </span>
                </form>
              </div>
            </Sheet>
          ))}

          {!atLimit && (
            <Sheet
              id="cv-nouveau"
              title={t("docs.create.title")}
              closeLabel={close}
              openParam="creer"
              defaultOpen={params.creer === "1"}
            >
              <form action={createCv} className="t-flux">
                <fieldset className="t-choix">
                  <legend className="sr-only">{t("docs.create.legend")}</legend>
                  {(["profile", "blank"] as const).map((source) => (
                    <label key={source} className="t-verre t-ch t-press">
                      <input
                        type="radio"
                        name="source"
                        value={source}
                        defaultChecked={source === "profile"}
                      />
                      <span className="t-t">
                        <b>{t(`docs.create.${source}`)}</b>
                        <span>{t(`docs.create.${source}Hint`)}</span>
                      </span>
                      <span className="t-radio" aria-hidden />
                    </label>
                  ))}
                </fieldset>
                <div className="t-champ">
                  <label htmlFor="cv-nouveau-nom">{t("docs.create.name")}</label>
                  <span className="t-verre t-saisie">
                    <input
                      id="cv-nouveau-nom"
                      name="title"
                      maxLength={80}
                      defaultValue={
                        cvs.length === 0
                          ? t("career.cv.default")
                          : `${t("career.cv.default")} ${cvs.length + 1}`
                      }
                    />
                  </span>
                </div>
                <button type="submit" className="t-bt t-p t-pl t-press">
                  {t("docs.create.submit")}
                </button>
              </form>
            </Sheet>
          )}
        </>
      ) : (
        <>
          {letters.length > 0 && (
            <ul className="t-flux t-serre">
              {letters.map((letter) => {
                const type = parseDocument(letter.content)?.type ?? "letter";
                return (
                  <li key={letter.id} className="t-verre t-doc">
                    <Mini letter />
                    <span className="t-t">
                      <Link href={`/app/career/documents/${letter.id}`} className="t-lien">
                        <b>{letter.title}</b>
                      </Link>
                      <span>
                        {type === "letter"
                          ? t("docs.letters.written", { date: day(letter.updatedAt) })
                          : t("docs.letters.line", {
                              type: d(`docs.letters.type.${type}`),
                              date: day(letter.updatedAt),
                            })}
                      </span>
                    </span>
                    <SheetButton
                      target={`lettre-menu-${letter.id}`}
                      className="t-bi t-press"
                      label={t("docs.list.more", { title: letter.title })}
                    >
                      <TalentIcon name="plus-options" size="s" />
                    </SheetButton>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="t-verre t-carte t-sugg">
            <OrbiMark size={36} />
            <div className="t-t">
              <small>{t("docs.letters.linkedin.label")}</small>
              <b>{t("docs.letters.linkedin.text")}</b>
              <div>
                <Link href="/app/career/linkedin" className="t-bt t-sec t-s t-press">
                  {t("docs.letters.linkedin.cta")}
                </Link>
              </div>
            </div>
          </div>
          <SheetButton target="lettre-nouvelle" className="t-ajout t-press">
            <TalentIcon name="plus" size="s" />
            {t("docs.letters.new")}
          </SheetButton>

          {letters.map((letter) => (
            <Sheet
              key={letter.id}
              id={`lettre-menu-${letter.id}`}
              title={letter.title}
              closeLabel={close}
            >
              <div className="t-verre t-liste t-lignes">
                <div className="t-li">
                  <span className="t-cases t-c2">
                    <TalentIcon name="modifier" size="s" />
                  </span>
                  <span className="t-t">
                    <Link href={`/app/career/documents/${letter.id}`} className="t-lien">
                      <b>{t("docs.menu.openLetter")}</b>
                    </Link>
                  </span>
                  <TalentIcon name="suivant" />
                </div>
                <div className="t-li">
                  <span className="t-cases t-c1">
                    <TalentIcon name="telecharger" size="s" />
                  </span>
                  <span className="t-t">
                    <a href={`/app/career/documents/${letter.id}/pdf`} className="t-lien">
                      <b>{t("docs.menu.pdf")}</b>
                    </a>
                  </span>
                </div>
                <form action={deleteDocumentAction} className="t-li t-danger">
                  <input type="hidden" name="id" value={letter.id} />
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
          ))}

          <Sheet id="lettre-nouvelle" title={t("docs.letters.create.title")} closeLabel={close}>
            {generate.state !== "ready" ? (
              <OrbiLimit code={generate.state} plan={plan} />
            ) : (
              <form action={generateDocumentAction} className="t-flux">
                <p className="t-ss">{t("docs.letters.create.lead")}</p>
                <div className="t-champ">
                  <label htmlFor="lettre-type">{t("docs.letters.create.type")}</label>
                  <select id="lettre-type" name="type" defaultValue="letter">
                    {documentTypes.map((type) => (
                      <option key={type} value={type}>
                        {d(`docs.letters.type.${type}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="t-champ">
                  <label htmlFor="lettre-offre">{t("docs.letters.create.offer")}</label>
                  <select id="lettre-offre" name="jobId" defaultValue="">
                    <option value="">{t("docs.letters.create.noOffer")}</option>
                    {offers.map((offer) => (
                      <option key={offer.id} value={offer.id}>
                        {[offer.title, offer.company].join(" · ")}
                      </option>
                    ))}
                  </select>
                </div>
                <fieldset className="t-champ">
                  <legend className="t-lab-c">{t("docs.letters.create.tone")}</legend>
                  <div className="t-puces">
                    {(["formal", "warm", "direct"] as const).map((tone) => (
                      <label key={tone} className="t-puce t-press">
                        <input
                          type="radio"
                          name="tone"
                          value={tone}
                          defaultChecked={tone === "formal"}
                          className="sr-only"
                        />
                        {t(`docs.letters.create.tones.${tone}`)}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="t-champ">
                  <label htmlFor="lettre-points">{t("docs.letters.create.points")}</label>
                  <textarea id="lettre-points" name="points" maxLength={600} rows={3} />
                </div>
                <p className="t-gar">
                  <TalentIcon name="cadenas" size="s" />
                  {t("docs.letters.create.note", {
                    count: aiFeatures.career_document.credits,
                  })}
                </p>
                <button type="submit" className="t-bt t-p t-pl t-press">
                  <OrbiMark size={20} />
                  {t("docs.letters.create.submit")}
                </button>
              </form>
            )}
            {check.state === "ready" && (
              <SheetButton target="lettre-relire" className="t-lien-m t-press">
                <TalentIcon name="modifier" size="s" />
                {t("docs.letters.proofread.open")}
              </SheetButton>
            )}
          </Sheet>

          {check.state === "ready" && (
            <Sheet id="lettre-relire" title={t("docs.letters.proofread.title")} closeLabel={close}>
              <form action={proofreadAction} className="t-flux">
                <p className="t-ss">{t("docs.letters.proofread.lead")}</p>
                <div className="t-champ">
                  <label htmlFor="relire-titre">{t("docs.letters.proofread.name")}</label>
                  <span className="t-verre t-saisie">
                    <input id="relire-titre" name="title" maxLength={120} />
                  </span>
                </div>
                <div className="t-champ">
                  <label htmlFor="relire-texte">{t("docs.letters.proofread.text")}</label>
                  <textarea
                    id="relire-texte"
                    name="text"
                    required
                    maxLength={PROOFREAD_MAX}
                    rows={8}
                  />
                </div>
                <button type="submit" className="t-bt t-p t-pl t-press">
                  {t("docs.letters.proofread.submit", { count: aiFeatures.proofread.credits })}
                </button>
              </form>
            </Sheet>
          )}
        </>
      )}
    </div>
  );
}
