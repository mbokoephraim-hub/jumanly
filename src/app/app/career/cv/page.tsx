import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { StudioFrame } from "@/components/talent/cv/studio/studio-frame";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { CenteredDialog, DialogButton } from "@/components/talent/web/dialog";
import { ImportDrop } from "@/components/talent/cv/import-file";
import { importGroups } from "@/components/talent/cv/import-groups";
import { OrbiLimit, orbiLimitCode } from "@/components/talent/cv/orbi-limit";
import { LetterMenu } from "@/components/talent/cv/letter-menu";
import { PdfButton } from "@/components/talent/cv/pdf-button";
import { OrbiCvCard } from "@/components/talent/cv/studio/orbi-card";
import { CvPage } from "@/components/talent/cv/studio/preview";
import { previewData } from "@/features/cv/document";
import { cvSourceOf } from "@/features/cv/source";
import { cvFileName } from "@/features/cv/export/pdf";
import { templateKey } from "@/features/cv/examples";
import { splitName } from "@/features/cv/render/build";
import { templateOf } from "@/features/cv/templates/registry";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { generateDocumentAction, proofreadAction } from "@/server/actions/career-documents";
import { createCv, deleteCv, duplicateCv, setPrimaryCv } from "@/server/actions/cv";
import {
  applyCvImportAction,
  cancelCvImportAction,
  readCvFileAction,
} from "@/server/actions/cv-import";
import { aiFeatures, AI_CREDITS_KEY } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { usage } from "@/server/entitlements";
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
import { CV_FILE_MAX_BYTES } from "@/server/services/cv-file";
import { parseImport } from "@/server/services/cv-import";
import { pendingSuggestions } from "@/server/services/cv-coach";
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

  const owner = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { image: true },
  });
  const primary = cvs[0] ?? null;
  const [previews, credits, pending, importRow] = await Promise.all([
    Promise.all(cvs.map((cv) => previewData(cvSourceOf(cv, owner.image)))),
    usage(db, { type: "user", id: user.id }, AI_CREDITS_KEY),
    primary ? pendingSuggestions(db, user.id, primary.id) : Promise.resolve([]),
    db.aiSuggestion.findFirst({
      where: { userId: user.id, feature: "cv_parse", status: "pending" },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const left = credits.limit < 0 ? null : Math.max(0, credits.limit - credits.used);
  const read = importRow ? parseImport(importRow.payload) : null;
  const groups = read ? importGroups(read, await getTranslations("docs.import")) : [];
  const megabytes = Math.round(CV_FILE_MAX_BYTES / (1024 * 1024));
  const importError = importErrors.find((code) => code === params.erreur);
  const cvLine = (cv: (typeof cvs)[number]) =>
    cv.adaptedForJobId
      ? t("docs.list.adapted", { date: day(cv.updatedAt) })
      : t("docs.list.cvLine", {
          template: d(`career.cv.template.name.${templateKey(templateOf(cv.templateId).id)}`),
          date: day(cv.updatedAt),
        });

  const tabsNav = (className: string) => (
    <nav aria-label={t("docs.list.tabs")} className={className}>
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
  );
  const notices = (
    <>
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
    </>
  );
  const letterLine = (letter: (typeof letters)[number]) => {
    const type = parseDocument(letter.content)?.type ?? "letter";
    return type === "letter"
      ? t("docs.letters.written", { date: day(letter.updatedAt) })
      : t("docs.letters.line", {
          type: d(`docs.letters.type.${type}`),
          date: day(letter.updatedAt),
        });
  };

  return (
    <>
      {/* ─── Phone (planche talent-4 § 6) ─────────────────────────────────────────────── */}
      <div className="t-mob t-flux">
        <FlowHead back="/app/compte" backLabel={t("docs.back")} title={t("docs.list.title")} />
        {tabsNav("t-seg")}
        {notices}
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
                      <span>{cvLine(cv)}</span>
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
          </>
        ) : (
          <>
            {letters.length > 0 && (
              <ul className="t-flux t-serre">
                {letters.map((letter) => (
                  <li key={letter.id} className="t-verre t-doc">
                    <Mini letter />
                    <span className="t-t">
                      <Link href={`/app/career/documents/${letter.id}`} className="t-lien">
                        <b>{letter.title}</b>
                      </Link>
                      <span>{letterLine(letter)}</span>
                    </span>
                    <SheetButton
                      target={`lettre-menu-${letter.id}`}
                      className="t-bi t-press"
                      label={t("docs.list.more", { title: letter.title })}
                    >
                      <TalentIcon name="plus-options" size="s" />
                    </SheetButton>
                  </li>
                ))}
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
          </>
        )}
      </div>

      {/* ─── Tablet and computer (planche studio-cv § 1 and § 6) ────────────────────────── */}
      <div className="t-large t-sc-liste">
        <StudioFrame />
        <div className="t-sc-wh">
          <div className="t-t">
            <h1>{t("docs.list.title")}</h1>
            <p>{t("docs.web.list.lead")}</p>
          </div>
        </div>
        {tabsNav("t-seg t-sc-seg")}
        {notices}
        {view === "cv" ? (
          <div className="t-sc-g2r">
            <div className="t-sc-col">
              {cvs.length === 0 ? (
                <div className="t-verre t-carte t-vide">
                  <b>{t("docs.list.empty.title")}</b>
                  <p>{t("docs.list.empty.text")}</p>
                </div>
              ) : (
                <ul className="t-sc-cvs">
                  {cvs.map((cv, index) => {
                    const preview = previews[index]!;
                    const source = cvSourceOf(cv, owner.image);
                    return (
                      <li key={cv.id} className="t-verre t-sc-cvk">
                        <div className="t-sc-apc">
                          <div aria-hidden inert>
                            <CvPage
                              data={preview.data}
                              template={source.template}
                              style={source.style}
                              className="t-sc-mini"
                            />
                          </div>
                          <Link
                            href={`/app/career/cv/${cv.id}`}
                            className="t-sc-cover"
                            aria-label={t("docs.web.list.preview", { title: cv.title })}
                            tabIndex={-1}
                          />
                          {cv.isPrimary ? (
                            <span className="t-sc-e">{t("docs.list.primary")}</span>
                          ) : cv.adaptedForJobId ? (
                            <span className="t-sc-e t-a">{t("docs.web.list.adaptedBadge")}</span>
                          ) : null}
                        </div>
                        <div className="t-sc-cvt">
                          <div>
                            <Link href={`/app/career/cv/${cv.id}`} className="t-lien">
                              <b>{cv.title}</b>
                            </Link>
                            <span>{cvLine(cv)}</span>
                          </div>
                          <SheetButton
                            target={`cv-menu-${cv.id}`}
                            className="t-bi t-press"
                            label={t("docs.list.more", { title: cv.title })}
                          >
                            <TalentIcon name="plus-options" size="s" />
                          </SheetButton>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="t-sc-g2e">
                {atLimit ? (
                  <p className="t-gar">
                    <TalentIcon name="aide" size="s" />
                    {t("docs.list.limit", { max: MAX_CVS })}
                  </p>
                ) : (
                  <SheetButton target="cv-nouveau" className="t-sc-cvn t-press">
                    <span className="t-cases" aria-hidden>
                      <TalentIcon name="plus" />
                    </span>
                    <span>
                      {t("docs.list.new")}
                      <small>{t("docs.web.list.newHint")}</small>
                    </span>
                  </SheetButton>
                )}
                <DialogButton target="sc-importer" className="t-sc-cvn t-i t-press">
                  <span className="t-cases" aria-hidden>
                    <TalentIcon name="telecharger" />
                  </span>
                  <span>
                    {t("docs.list.import")}
                    <small>{t("docs.web.list.importHint")}</small>
                  </span>
                </DialogButton>
              </div>
            </div>
            <OrbiCvCard cvId={primary?.id ?? null} credits={left} pending={pending.length} />
          </div>
        ) : (
          <div className="t-sc-lkd">
            <div className="t-sc-col">
              <div className="t-sc-sec">
                <h2>{t("docs.web.letters.title")}</h2>
                <SheetButton target="lettre-nouvelle" className="t-press">
                  {t("docs.letters.new")}
                </SheetButton>
              </div>
              {letters.length === 0 ? (
                <p className="t-sc-sub">{t("docs.web.letters.empty")}</p>
              ) : (
                <ul className="t-sc-lettres">
                  {letters.map((letter, index) => (
                    <li key={letter.id} className="t-verre t-pj">
                      <span className={cx("t-cases", index % 2 === 1 && "t-sc-former")} aria-hidden>
                        <TalentIcon name="document" size="s" />
                      </span>
                      <span className="t-t">
                        <Link href={`/app/career/documents/${letter.id}`} className="t-lien">
                          <b>{letter.title}</b>
                        </Link>
                        <span>{letterLine(letter)}</span>
                      </span>
                      <SheetButton
                        target={`lettre-menu-${letter.id}`}
                        className="t-bi t-press"
                        label={t("docs.list.more", { title: letter.title })}
                      >
                        <TalentIcon name="plus-options" size="s" />
                      </SheetButton>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="t-sc-col">
              <div className="t-verre t-carte t-sugg">
                <OrbiMark size={36} />
                <div className="t-t">
                  <small>{t("docs.web.letters.help")}</small>
                  <b>{t("docs.web.letters.helpText")}</b>
                </div>
              </div>
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
            </div>
          </div>
        )}
      </div>

      {/* ─── Sheets: bottom sheets on a phone, centred windows from 768 px ─────────────────── */}
      {cvs.map((cv) => (
        <CvMenu key={cv.id} cv={cv} fileName={fileName(cv)} atLimit={atLimit} />
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
      {letters.map((letter) => (
        <LetterMenu key={letter.id} letter={letter} />
      ))}
      <Sheet
        id="lettre-nouvelle"
        title={t("docs.letters.create.title")}
        closeLabel={close}
        openParam="nouvelle"
        defaultOpen={params.nouvelle === "1"}
      >
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
              <textarea id="relire-texte" name="text" required maxLength={PROOFREAD_MAX} rows={8} />
            </div>
            <button type="submit" className="t-bt t-p t-pl t-press">
              {t("docs.letters.proofread.submit", { count: aiFeatures.proofread.credits })}
            </button>
          </form>
        </Sheet>
      )}

      {/* « Importer un CV » (planche studio-cv § 1): a centred window from 768 px. */}

      <CenteredDialog
        id="sc-importer"
        title={t("docs.import.title")}
        subtitle={t("docs.web.import.lead")}
        closeLabel={close}
        openParam="importer"
        defaultOpen={params.importer === "1"}
      >
        {importError && (
          <Notice tone="err">{d(`docs.import.error.${importError}`, { max: megabytes })}</Notice>
        )}
        <form action={readCvFileAction}>
          <input type="hidden" name="retour" value="cv" />
          <ImportDrop
            id="sc-import-fichier"
            label={t("docs.web.import.drop")}
            hint={t("docs.web.import.dropHint", { max: megabytes })}
            reading={t("docs.import.reading")}
          />
        </form>
        {read && (
          <form id="sc-import-verifier" action={applyCvImportAction} className="t-flux">
            <input type="hidden" name="import" value={importRow!.id} />
            <input type="hidden" name="retour" value="cv" />
            <h3 className="t-ck-t">
              {read.file
                ? t("docs.import.readIn", { name: read.file.name })
                : t("docs.import.readTitle")}
            </h3>
            {groups.length === 0 ? (
              <p className="t-sc-sub">{t("docs.import.nothing.text")}</p>
            ) : (
              <div className="t-verre t-liste t-lignes t-sc-lus">
                {groups.map((group) => (
                  <label key={group.key} className="t-li">
                    <span className={`t-cases ${group.tone}`} aria-hidden>
                      <TalentIcon name={group.icon} size="s" />
                    </span>
                    <span className="t-t">
                      <b>{group.title}</b>
                      <span>{group.line}</span>
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      name="groupe"
                      value={group.key}
                      defaultChecked
                      className="sr-only"
                    />
                    <span aria-hidden className="t-sw" />
                  </label>
                ))}
              </div>
            )}
          </form>
        )}
        {read && (
          <div className="t-sc-acts2">
            <form action={cancelCvImportAction} className="contents">
              <input type="hidden" name="retour" value="cv" />
              <button type="submit" className="t-bt t-sec t-press">
                {t("docs.web.import.cancel")}
              </button>
            </form>
            {groups.length > 0 && (
              <button type="submit" form="sc-import-verifier" className="t-bt t-p t-press">
                {t("docs.import.submit")}
              </button>
            )}
          </div>
        )}
      </CenteredDialog>
    </>
  );
}

const importErrors = ["format", "size", "empty", "unreadable"] as const;

/** The « … » sheet of a CV: open, PDF, CV principal, template, duplicate, delete. */
async function CvMenu({
  cv,
  fileName,
  atLimit,
}: {
  cv: { id: string; title: string; isPrimary: boolean };
  fileName: string;
  atLimit: boolean;
}) {
  const t = await getTranslations();
  return (
    <Sheet id={`cv-menu-${cv.id}`} title={cv.title} closeLabel={t("offer.close")}>
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
              fileName={fileName}
              labels={{
                preparing: t("docs.pdf.preparing"),
                done: t("docs.pdf.done"),
                error: t("docs.pdf.error"),
              }}
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
  );
}
