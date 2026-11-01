import "@/styles/postuler-v2.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Logo, toneOf } from "@/components/talent/art";
import { ApplyQuestions } from "@/components/talent/apply-questions";
import { ApplySend } from "@/components/talent/apply-send";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OrbiSpark } from "@/components/phone/cv/marks";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { ApplySentDialog } from "@/components/talent/web/apply-sent-dialog";
import { dynamic } from "@/i18n/dynamic";
import { formatDayMonth } from "@/lib/dates";
import { applicationLetterAction } from "@/server/actions/career-documents";
import {
  addApplicationExtraAction,
  applyChoiceAction,
  saveApplicationStepAction,
} from "@/server/actions/jobs";
import { can } from "@/server/entitlements";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";
import { requireUser } from "@/server/auth/session";
import { screeningAnswersOf, screeningQuestionsOf } from "@/server/services/screening";
import { db } from "@/server/db";
import { getJob } from "@/server/queries/public";
import {
  ATTACHMENTS_MAX,
  attachableItems,
  parseRefs,
  savedLetters,
} from "@/server/services/application-attachments";
import {
  applySteps,
  applyStepOf,
  getApplicationDraft,
  type ApplyStep,
} from "@/server/services/application-draft";
import OfferPage from "../page";

export async function generateMetadata({
  params,
}: PageProps<"/app/jobs/[slug]/postuler">): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("apply");
  const data = await getJob(slug);
  return {
    title: { absolute: t("seo", { job: data?.job.title ?? "" }) },
    robots: { index: false },
  };
}

const aiErrors = ["consent", "entitlement", "quota", "unavailable"] as const;

/**
 * « Postuler » in three steps (planche talent-2 § 1): the CV, a letter or documents (optional),
 * then what the recruiter will see, in clear. The draft is saved on the server at each step and on
 * « Quitter ». Applying is always free: no plan, entitlement or quota is read here or in the
 * actions (golden rule n° 1). Only « Rédiger avec Orbi » uses credits, and it is optional.
 *
 * On a computer (planche web talent-2 § 1) the steps stay visible on the left with the offer; the
 * step fills the right. A tablet shows the step alone, its blocks on two columns. The confirmation
 * is a centred window over the offer.
 */
export default async function ApplyPage({
  params,
  searchParams,
}: PageProps<"/app/jobs/[slug]/postuler">) {
  const { slug } = await params;
  const query = await searchParams;
  const base = `/app/jobs/${slug}`;
  const user = await requireUser(`${base}/postuler`);
  const data = await getJob(slug);
  if (!data) notFound();
  const { job, open } = data;
  const t = await getTranslations();
  const d = dynamic(t);
  const company = job.organization.name;
  const tone = toneOf(company);

  const jobRow = await db.job.findUnique({ where: { slug }, select: { id: true } });
  if (!jobRow) notFound();
  const profile = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      documents: {
        where: { kind: "cv" },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          title: true,
          isPrimary: true,
          updatedAt: true,
          pageCount: true,
          adaptedForJobId: true,
        },
      },
    },
  });
  // A withdrawn application can be sent again: the page behaves as if none existed.
  const sent = profile
    ? await db.application.findUnique({
        where: { jobId_profileId: { jobId: jobRow.id, profileId: profile.id } },
        select: { id: true, status: true },
      })
    : null;
  const application = sent?.status === "withdrawn" ? null : sent;

  // ─── Confirmation: only once the server has recorded the application. ─────────────────
  if (application) {
    if (query.envoyee !== "1") redirect(`/app/suivi/${application.id}`);
    const next = (
      <>
        <div className="t-suite">
          <Link href={`/app/suivi/${application.id}`} className="t-verre t-press">
            <span className="t-cases t-accomp" aria-hidden>
              <TalentIcon name="candidature" size="s" />
            </span>
            {t("apply.sent.track")}
          </Link>
          <Link href={`/app/jobs?q=${encodeURIComponent(job.title)}`} className="t-verre t-press">
            <span className="t-cases t-oppo" aria-hidden>
              <TalentIcon name="opportunites" size="s" />
            </span>
            {t("apply.sent.similar")}
          </Link>
        </div>
        <Link href="/app/jobs" className="t-bt t-txt t-press">
          {t("apply.sent.back")}
        </Link>
      </>
    );
    return (
      <>
        <div className="t-conf t-envoyee t-mob">
          <span className="t-rond-ok" aria-hidden>
            <TalentIcon name="valider" />
          </span>
          <h1 className="t-h2s">{t("apply.sent.title")}</h1>
          <p>{t("apply.sent.text", { company })}</p>
          {next}
        </div>
        {/* Tablet and computer: the offer stays behind the window, as a backdrop only. */}
        <div className="t-large t-envoyee-w" inert aria-hidden>
          <OfferPage params={params} searchParams={Promise.resolve({})} />
        </div>
        <ApplySentDialog
          id="ap-envoyee"
          title={t("apply.sent.title")}
          closeLabel={t("offer.close")}
          offerHref={base}
        >
          <div className="t-conf">
            <span className="t-rond-ok" aria-hidden>
              <TalentIcon name="valider" />
            </span>
            <p className="t-conf-t" aria-hidden>
              {t("apply.sent.title")}
            </p>
            <p>{t("apply.sent.text", { company })}</p>
            {next}
          </div>
        </ApplySentDialog>
      </>
    );
  }
  if (!open) redirect(`${base}?candidature=close`);

  const draft = await getApplicationDraft(db, user.id, jobRow.id);
  const step: ApplyStep = applyStepOf(query.etape ?? draft?.step);
  const index = applySteps.indexOf(step);
  const cvs = [...(profile?.documents ?? [])].sort(
    (a, b) => Number(b.adaptedForJobId === jobRow.id) - Number(a.adaptedForJobId === jobRow.id),
  );
  // The CV chosen in the sheet Postuler (adapted by Orbi, maybe) comes along as ?cv=.
  const fromSheet = typeof query.cv === "string" ? cvs.find((cv) => cv.id === query.cv) : undefined;
  const chosenCv =
    fromSheet ??
    (draft?.profileOnly
      ? null
      : (cvs.find((cv) => cv.id === draft?.cvDocumentId) ?? cvs[0] ?? null));
  const letter = draft?.coverLetter ?? "";
  const questions = screeningQuestionsOf(job.screeningQuestions);
  const answers = new Map(
    screeningAnswersOf(draft?.screeningAnswers).map((item) => [item.id, item.answer]),
  );
  const refs = parseRefs(draft?.attachments);
  const [items, letters] =
    step === "cv"
      ? [[], []]
      : await Promise.all([attachableItems(db, user.id), savedLetters(db, user.id)]);
  const joined = refs.flatMap((ref) => {
    const item = items.find((entry) => entry.type === ref.type && entry.id === ref.id);
    return item ? [item] : [];
  });
  const refValue = (ref: { type: string; id: string }) => `${ref.type}:${ref.id}`;
  const stepHref = (to: ApplyStep) => `${base}/postuler?etape=${to}`;
  // The first screen (Ephraïm, 01/11/2026): how to apply, before the list of CVs.
  // An application already started resumes where it was left (Ephraïm, 01/11/2026).
  const choosing =
    step === "cv" &&
    !draft &&
    query.etape === undefined &&
    query.cv === undefined &&
    query.ia === undefined;
  const back = choosing
    ? base
    : index === 0
      ? `${base}/postuler`
      : stepHref(applySteps[index - 1]!);
  const formId = `apply-${step}`;
  const keep = (
    <>
      <input type="hidden" name="job" value={slug} />
      <input type="hidden" name="step" value={step} />
    </>
  );

  const title = (
    <>
      <FlowHead
        back={back}
        history={false}
        backLabel={choosing ? t("apply.backOffer") : t("apply.back")}
        title={t("apply.title")}
        end={
          choosing ? (
            <Link href={base} className="t-bi t-press" aria-label={t("apply.backOffer")}>
              <TalentIcon name="fermer" size="s" />
            </Link>
          ) : (
            <button
              type="submit"
              form={formId}
              name="next"
              value="quitter"
              formNoValidate
              className="t-bi t-press"
              aria-label={t("apply.close")}
            >
              <TalentIcon name="fermer" size="s" />
            </button>
          )
        }
      />
      <p className="t-w-sous">{[job.title, company].join(" · ")}</p>
    </>
  );
  const progress = (
    <>
      <div
        className="t-pas"
        role="img"
        aria-label={t("apply.step", { current: index + 1, total: 3 })}
      >
        {applySteps.map((key, position) => (
          <i key={key} className={position <= index ? "t-ok" : undefined} />
        ))}
      </div>
      <span className="t-pas-t">
        {[
          t("apply.step", { current: index + 1, total: 3 }),
          step === "lettre" ? t("apply.optional") : draft ? t("apply.saved") : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </>
  );

  // Computer: the steps on the left with the offer (planche web talent-2 § 1, `.w-stp`).
  const stepsAside = (
    <nav aria-label={t("apply.web.steps")} className="t-verre t-stp">
      <div className="t-of-r">
        <Logo name={company} src={job.organization.logo} tone={tone} />
        <div>
          <b>{job.title}</b>
          <span>{[company, job.city].filter(Boolean).join(" · ")}</span>
        </div>
      </div>
      <ol>
        {applySteps.map((key, position) => {
          const inner = (
            <>
              <i aria-hidden>
                {position < index ? <TalentIcon name="valider" size="xs" /> : position + 1}
              </i>
              <span>
                {d(`apply.web.step.${key}`)}
                <small>{d(`apply.web.step.${key}Line`)}</small>
              </span>
            </>
          );
          return (
            <li
              key={key}
              className={position < index ? "t-ok" : position === index ? "t-on" : undefined}
            >
              {position < index ? (
                <Link href={stepHref(key)} className="t-press">
                  {inner}
                </Link>
              ) : (
                <span aria-current={position === index ? "step" : undefined}>{inner}</span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="t-gr">{t("apply.web.free")}</p>
    </nav>
  );
  // The first page of a CV, drawn (planche `.pg`): a large screen shows the CVs as pages.
  const page = (
    <span className="t-cv-ap" aria-hidden>
      <span className="t-pg">
        <i className="t-h" />
        <i className="t-s" />
        <i />
        <i />
        <i className="t-c" />
        <i />
        <i className="t-s" />
        <i />
        <i className="t-c" />
        <i />
      </span>
    </span>
  );
  const layout = (content: ReactNode) => (
    <div className="t-flux t-large t-post">
      {title}
      <div className="t-post-g">
        {stepsAside}
        <div className="t-flux t-pane">
          {progress}
          {content}
        </div>
      </div>
    </div>
  );

  // ─── Step 1 · how to apply: a CV I have, adapted by Orbi, imported or created. ─────────
  if (choosing) {
    const subject = { type: "user" as const, id: user.id };
    const [canTailor, plans] = await Promise.all([
      can(db, subject, "career.cv.tailor"),
      listPublicPlans(db),
    ]);
    const options = [
      {
        key: "existant",
        icon: <TalentIcon name="cv" size="s" />,
        line: cvs.length > 0 ? t("apply.choice.existantLine") : t("apply.choice.existantNone"),
        locked: false,
      },
      {
        key: "adapter",
        icon: <OrbiSpark size={22} />,
        line: canTailor
          ? t("apply.choice.adapterLine")
          : t("apply.choice.locked", {
              plan: talentPlanFor(plans, "career.cv.tailor") || t("phoneCv.start.pro"),
            }),
        locked: !canTailor,
      },
      {
        key: "importer",
        icon: <TalentIcon name="telecharger" size="s" />,
        line: t("apply.choice.importerLine"),
        locked: false,
      },
      {
        key: "creer",
        icon: <TalentIcon name="plus" size="s" />,
        line: t("apply.choice.creerLine"),
        locked: false,
      },
    ] as const;
    return layout(
      <>
        <div className="t-verre t-cd t-min t-post-offre">
          <div className="t-haut">
            <Logo name={company} src={job.organization.logo} tone={tone} />
            <div className="t-t">
              <b>{job.title}</b>
              <span>{[company, job.city].filter(Boolean).join(" · ")}</span>
            </div>
          </div>
        </div>
        <form id={formId} action={applyChoiceAction} className="t-flux">
          <input type="hidden" name="job" value={slug} />
          <fieldset className="t-fs">
            <legend className="t-h2s">{t("apply.choice.title")}</legend>
            <div className="t-flux t-serre t-cvg">
              {options.map((option) => (
                <label
                  key={option.key}
                  className="t-verre t-cvc t-press t-ap-choix"
                  data-off={option.locked ? "" : undefined}
                >
                  <input
                    type="radio"
                    name="choice"
                    value={option.key}
                    defaultChecked={option.key === "existant"}
                    disabled={option.locked}
                  />
                  <span
                    className={
                      option.key === "adapter" ? "t-ap-choix-ic t-orbi" : "t-cases t-accomp"
                    }
                    aria-hidden
                  >
                    {option.icon}
                  </span>
                  <span className="t-t">
                    <b>{d(`apply.choice.${option.key}`)}</b>
                    <span>{option.line}</span>
                  </span>
                  {option.locked ? (
                    <TalentIcon name="cadenas" size="xs" />
                  ) : (
                    <span className="t-radio" aria-hidden />
                  )}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="t-verre t-fort t-bas-f">
            <span className="t-post-note">
              <TalentIcon name="cadenas" size="xs" />
              {t("apply.web.nothingSent")}
            </span>
            <button type="submit" className="t-bt t-p t-pl t-press">
              {t("apply.continue")}
              <TalentIcon name="suivant" size="xs" className="t-post-fl" />
            </button>
          </div>
        </form>
      </>,
    );
  }

  // ─── Step 1 · the CV. ──────────────────────────────────────────────────────────────
  if (step === "cv") {
    const adaptError = typeof query.ia === "string" ? query.ia : null;
    const adaptKey = (["entitlement", "quota", "consent", "limit"] as const).find(
      (code) => code === adaptError,
    );
    return layout(
      <>
        <div className="t-verre t-cd t-min t-post-offre">
          <div className="t-haut">
            <Logo name={company} src={job.organization.logo} tone={tone} />
            <div className="t-t">
              <b>{job.title}</b>
              <span>{[company, job.city].filter(Boolean).join(" · ")}</span>
            </div>
          </div>
        </div>
        {query.adapte === "1" && <Notice tone="ok">{t("apply.cv.adaptDone")}</Notice>}
        {adaptError && (
          <p role="status" className="t-gar t-err">
            <TalentIcon name="aide" size="s" />
            <span>{d(`phoneExplorer.apply.adaptError.${adaptKey ?? "other"}`)}</span>
          </p>
        )}
        <form id={formId} action={saveApplicationStepAction} className="t-flux">
          {keep}
          <fieldset className="t-fs">
            <legend className="t-h2s">{t("apply.cv.title")}</legend>
            <div className="t-flux t-serre t-cvg">
              {cvs.map((cv) => {
                const adapted = cv.adaptedForJobId === jobRow.id;
                const line = [
                  adapted
                    ? t("apply.cv.adapted", { date: formatDayMonth(cv.updatedAt) })
                    : t("apply.cv.updated", { date: formatDayMonth(cv.updatedAt) }),
                  cv.pageCount ? t("apply.cv.pages", { count: cv.pageCount }) : null,
                  cv.isPrimary ? t("apply.cv.primary") : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <label key={cv.id} className="t-verre t-cvc t-press">
                    <input
                      type="radio"
                      name="cv"
                      value={cv.id}
                      defaultChecked={chosenCv?.id === cv.id}
                    />
                    <span className="t-mini" aria-hidden>
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    {page}
                    <span className="t-t">
                      <b>{cv.title}</b>
                      <span>{line}</span>
                      {adapted && <span className="t-adp">{t("apply.cv.badge")}</span>}
                    </span>
                    <span className="t-radio" aria-hidden />
                  </label>
                );
              })}
              {cvs.length === 0 && (
                <label className="t-verre t-cvc t-press">
                  <input type="radio" name="cv" value="profil" defaultChecked />
                  <span className="t-mini" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </span>
                  {page}
                  <span className="t-t">
                    <b>{t("apply.cv.profile")}</b>
                    <span>{t("apply.cv.profileLine")}</span>
                  </span>
                  <span className="t-radio" aria-hidden />
                </label>
              )}
            </div>
          </fieldset>
          <div className="t-verre t-fort t-bas-f">
            <span className="t-post-note">
              <TalentIcon name="cadenas" size="xs" />
              {t("apply.web.nothingSent")}
            </span>
            <button type="submit" name="next" value="lettre" className="t-bt t-p t-pl t-press">
              {t("apply.continue")}
              <TalentIcon name="suivant" size="xs" className="t-post-fl" />
            </button>
          </div>
        </form>
      </>,
    );
  }

  // ─── Step 2 · a letter or documents (optional). ─────────────────────────────────────────
  if (step === "lettre") {
    const aiError = aiErrors.find((code) => code === query.ia);
    const remaining = (skip: string) =>
      refs
        .filter((ref) => refValue(ref) !== skip)
        .map((ref) => (
          <input key={refValue(ref)} type="hidden" name="attachment" value={refValue(ref)} />
        ));
    return layout(
      <>
        <h2 className="t-h2s">{t("apply.docs.title")}</h2>
        {query.lettre === "orbi" && <Notice tone="ok">{t("apply.docs.orbi.done")}</Notice>}
        {aiError && (
          <p role="status" className="t-gar t-err">
            <TalentIcon name="aide" size="s" />
            <span>
              {d(`apply.docs.orbi.error.${aiError}`)}{" "}
              {aiError !== "unavailable" && (
                <Link
                  className="t-lien"
                  href={
                    aiError === "consent" ? "/app/parametres#confidentialite" : "/app/abonnement"
                  }
                >
                  {d(`apply.docs.orbi.errorCta.${aiError}`)}
                </Link>
              )}
            </span>
          </p>
        )}
        <div className="t-post-2c">
          <div className="t-flux t-post-col">
            {letter && (
              <div className="t-verre t-pj">
                <span className="t-cases t-accomp" aria-hidden>
                  <TalentIcon name="document" size="s" />
                </span>
                <div className="t-t">
                  <b>{t("apply.docs.letter")}</b>
                  <span>
                    {t("apply.docs.words", { count: letter.split(/\s+/).filter(Boolean).length })}
                  </span>
                </div>
                <SheetButton
                  target="ap-lettre"
                  className="t-bi t-press"
                  label={t("apply.docs.edit")}
                >
                  <TalentIcon name="modifier" size="s" />
                </SheetButton>
              </div>
            )}
            {joined.map((item) => (
              <form
                key={refValue(item)}
                action={saveApplicationStepAction}
                className="t-verre t-pj"
              >
                {keep}
                <input type="hidden" name="next" value="lettre" />
                <input type="hidden" name="attachments" value="1" />
                {remaining(refValue(item))}
                <span
                  className={item.type === "certificate" ? "t-cases t-former" : "t-cases t-accomp"}
                  aria-hidden
                >
                  <TalentIcon
                    name={item.type === "certificate" ? "certificat" : "document"}
                    size="s"
                  />
                </span>
                <div className="t-t">
                  <b>{item.title}</b>
                  <span>
                    {item.type === "certificate"
                      ? t("apply.docs.certificateLine", { date: formatDayMonth(item.date) })
                      : t("apply.docs.documentLine", { date: formatDayMonth(item.date) })}
                  </span>
                </div>
                <button
                  type="submit"
                  className="t-bi t-press"
                  aria-label={t("apply.docs.remove", { name: item.title })}
                >
                  <TalentIcon name="supprimer" size="s" />
                </button>
              </form>
            ))}
            <SheetButton target="ap-ajout" className="t-ap-ajout t-press">
              <span className="t-ap-ajout-ic" aria-hidden>
                <TalentIcon name="plus" size="s" />
              </span>
              <span className="t-t">
                <b>{t("apply.docs.add")}</b>
                <span>{t("apply.docs.addLine")}</span>
              </span>
            </SheetButton>
          </div>
          {!letter && (
            <div className="t-carte t-sugg t-ap-orbi">
              <span className="t-ap-choix-ic t-orbi" aria-hidden>
                <OrbiSpark size={22} />
              </span>
              <div className="t-t">
                <small>{t("apply.docs.orbi.label")}</small>
                <b>{t("apply.docs.orbi.text")}</b>
                <form action={applicationLetterAction}>
                  <input type="hidden" name="job" value={slug} />
                  <button type="submit" className="t-bt t-p t-s t-press">
                    {t("apply.docs.orbi.cta")}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        <form id={formId} action={saveApplicationStepAction} className="t-flux">
          {keep}
          {job.requestedDocuments.length > 0 && (
            <fieldset className="t-flux t-serre">
              <legend className="sr-only">{t("hireOffers.questions.title")}</legend>
              {job.requestedDocuments.length > 0 && (
                <p className="t-aide">
                  {t("hireOffers.questions.documents", {
                    list: job.requestedDocuments
                      .map((kind) => t(`hireOffers.form.document.${kind as "cv"}`))
                      .join(", "),
                  })}
                </p>
              )}
            </fieldset>
          )}
          {questions.length > 0 && (
            <ApplyQuestions questions={questions} answers={answers} form={formId} />
          )}
          <div className="t-verre t-fort t-bas-f">
            <Link href={stepHref("verification")} className="t-bt t-sec t-m t-press">
              {t("apply.skip")}
            </Link>
            <button
              type="submit"
              name="next"
              value="verification"
              className="t-bt t-p t-pl t-press"
            >
              {t("apply.continue")}
              <TalentIcon name="suivant" size="xs" className="t-post-fl" />
            </button>
          </div>
        </form>

        <Sheet
          id="ap-lettre"
          title={t("apply.letter.title")}
          closeLabel={t("offer.close")}
          openParam="ecrire"
          defaultOpen={query.ecrire === "1"}
        >
          <form action={saveApplicationStepAction} className="t-flux">
            {keep}
            <input type="hidden" name="next" value="lettre" />
            <div className="t-champ">
              <label htmlFor="apply-letter">{t("apply.letter.label")}</label>
              <textarea
                id="apply-letter"
                name="coverLetter"
                rows={10}
                maxLength={5000}
                defaultValue={letter}
              />
              <small>{t("apply.letter.hint")}</small>
            </div>
            <button type="submit" className="t-bt t-p t-pl t-press">
              {t("apply.letter.save")}
            </button>
          </form>
          {letter && (
            <form action={saveApplicationStepAction}>
              {keep}
              <input type="hidden" name="next" value="lettre" />
              <input type="hidden" name="coverLetter" value="" />
              <button type="submit" className="t-sig t-press">
                <TalentIcon name="supprimer" size="s" />
                {t("apply.letter.remove")}
              </button>
            </form>
          )}
        </Sheet>

        <Sheet id="ap-ajout" title={t("apply.docs.add")} closeLabel={t("offer.close")}>
          <div className="t-flux">
            <h3 className="t-lab-c">{t("apply.letter.title")}</h3>
            <div className="t-verre t-liste">
              <SheetButton target="ap-lettre" className="t-li t-press">
                <span className="t-cases t-c2" aria-hidden>
                  <TalentIcon name="modifier" size="s" />
                </span>
                <span className="t-t">
                  <b>{letter ? t("apply.docs.edit") : t("apply.letter.write")}</b>
                </span>
                <TalentIcon name="suivant" size="s" />
              </SheetButton>
              {letters.map((saved) => (
                <form key={saved.id} action={saveApplicationStepAction} className="t-li">
                  {keep}
                  <input type="hidden" name="next" value="lettre" />
                  <input type="hidden" name="coverLetter" value={saved.text.slice(0, 5000)} />
                  <span className="t-cases t-c1" aria-hidden>
                    <TalentIcon name="document" size="s" />
                  </span>
                  <span className="t-t">
                    <b>{saved.title}</b>
                    <span>
                      {t("apply.docs.documentLine", { date: formatDayMonth(saved.updatedAt) })}
                    </span>
                  </span>
                  <button type="submit" className="t-bt t-sec t-s t-press">
                    {t("apply.letter.use")}
                  </button>
                </form>
              ))}
            </div>
            <form action={saveApplicationStepAction} className="t-flux">
              {keep}
              <input type="hidden" name="next" value="lettre" />
              <input type="hidden" name="attachments" value="1" />
              <fieldset className="t-fs">
                <legend className="t-lab-c">{t("apply.add.documents")}</legend>
                {items.length === 0 ? (
                  <p className="t-vide-t">{t("apply.add.none")}</p>
                ) : (
                  <div className="t-verre t-liste">
                    {items.map((item) => (
                      <label key={refValue(item)} className="t-li t-coche-l">
                        <input
                          type="checkbox"
                          name="attachment"
                          value={refValue(item)}
                          defaultChecked={refs.some((ref) => refValue(ref) === refValue(item))}
                        />
                        <span
                          className={item.type === "certificate" ? "t-cases t-c1" : "t-cases t-c2"}
                          aria-hidden
                        >
                          <TalentIcon
                            name={item.type === "certificate" ? "certificat" : "document"}
                            size="s"
                          />
                        </span>
                        <span className="t-t">
                          <b>{item.title}</b>
                          <span>
                            {item.type === "certificate"
                              ? t("apply.docs.certificateLine", { date: formatDayMonth(item.date) })
                              : t("apply.docs.documentLine", { date: formatDayMonth(item.date) })}
                          </span>
                        </span>
                        <span className="t-coche" aria-hidden>
                          <TalentIcon name="valider" size="xs" />
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
              {items.length > 0 && (
                <>
                  <small className="t-pas-t">{t("apply.add.max", { max: ATTACHMENTS_MAX })}</small>
                  <button type="submit" className="t-bt t-p t-pl t-press">
                    {t("apply.add.join")}
                  </button>
                </>
              )}
            </form>
          </div>
        </Sheet>
      </>,
    );
  }

  // ─── Step 3 · check and send (Ephraïm, 31/10/2026): nothing is sent yet, everything in clear. ──
  const documents = [
    ...(letter
      ? [{ key: "lettre", title: t("apply.docs.letter"), icon: "document" as const }]
      : []),
    ...joined.map((item) => ({
      key: refValue(item),
      title: item.title,
      icon: item.type === "certificate" ? ("certificat" as const) : ("document" as const),
    })),
  ];
  const initials = (user.name || user.email)
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const cvLine = chosenCv
    ? [
        chosenCv.pageCount ? t("apply.cv.pages", { count: chosenCv.pageCount }) : null,
        t("apply.web.cvLine", { date: formatDayMonth(chosenCv.updatedAt) }),
      ]
        .filter(Boolean)
        .join(" · ")
    : t("apply.cv.profileLine");
  const full = refs.length >= ATTACHMENTS_MAX;
  return layout(
    <>
      <h2 className="t-h2s">{t("apply.review.title")}</h2>
      <div className="t-apv-att" role="note">
        <span className="t-apv-att-ic" aria-hidden>
          <TalentIcon name="horloge" size="s" />
        </span>
        <div>
          <b>{t("apply.check.pendingTitle")}</b>
          <p>{t("apply.check.pendingText")}</p>
        </div>
      </div>

      <p className="t-apv-lab">{t("apply.check.receives", { company })}</p>
      <div className="t-apv">
        <section className="t-verre t-apv-c" aria-labelledby="apv-profil">
          <div className="t-apv-h">
            <span className="t-apv-n" aria-hidden>
              {1}
            </span>
            <h3 id="apv-profil">{t("apply.check.profile")}</h3>
            <Link href="/app/profil/apercu" className="t-apv-a t-press">
              {t("apply.check.see")}
            </Link>
          </div>
          <div className="t-apv-r">
            <span className="t-apv-av" aria-hidden>
              {initials}
            </span>
            <span className="t-t">
              <b>{user.name}</b>
              <span>{user.email}</span>
            </span>
          </div>
        </section>

        <section className="t-verre t-apv-c" aria-labelledby="apv-cv">
          <div className="t-apv-h">
            <span className="t-apv-n" aria-hidden>
              {2}
            </span>
            <h3 id="apv-cv">{t("apply.check.cv")}</h3>
            <Link href={stepHref("cv")} className="t-apv-a t-press">
              {t("apply.check.change")}
            </Link>
          </div>
          <div className="t-apv-r">
            <span className="t-apv-pg" aria-hidden>
              <i className="t-h" />
              <i />
              <i className="t-c" />
              <i />
              <i />
            </span>
            <span className="t-t">
              <b>{chosenCv ? chosenCv.title : t("apply.cv.profile")}</b>
              <span>{cvLine}</span>
            </span>
            {chosenCv && (
              <a
                href={`/app/career/cv/${chosenCv.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="t-bt t-sec t-s t-press"
              >
                {t("apply.web.preview")}
              </a>
            )}
          </div>
        </section>

        <section className="t-verre t-apv-c" aria-labelledby="apv-docs">
          <div className="t-apv-h">
            <span className="t-apv-n" aria-hidden>
              {3}
            </span>
            <h3 id="apv-docs">{t("apply.check.documents")}</h3>
            <Link href={stepHref("lettre")} className="t-apv-a t-press">
              {t("apply.check.edit")}
            </Link>
          </div>
          {documents.length === 0 ? (
            <p className="t-apv-vide">{t("apply.check.noDocument")}</p>
          ) : (
            <ul className="t-apv-docs">
              {documents.map((item) => (
                <li key={item.key}>
                  <span className="t-apv-di" aria-hidden>
                    <TalentIcon name={item.icon} size="xs" />
                  </span>
                  {item.title}
                </li>
              ))}
            </ul>
          )}
          {!full && (
            <SheetButton target="ap-autre" className="t-apv-plus t-press">
              <span className="t-apv-plus-ic" aria-hidden>
                <TalentIcon name="plus" size="s" />
              </span>
              <span className="t-t">
                <b>{t("apply.check.extra")}</b>
                <span>{t("apply.check.extraLine")}</span>
              </span>
            </SheetButton>
          )}
        </section>

        {questions.length > 0 && (
          <section className="t-verre t-apv-c" aria-labelledby="apv-rep">
            <div className="t-apv-h">
              <span className="t-apv-n" aria-hidden>
                {4}
              </span>
              <h3 id="apv-rep">{t("apply.check.answers")}</h3>
              <Link href={`${stepHref("lettre")}#apq-titre`} className="t-apv-a t-press">
                {t("apply.check.edit")}
              </Link>
            </div>
            <dl className="t-apv-rep">
              {questions.map((question) => {
                const saved = answers.get(question.id);
                const shown =
                  question.kind === "yesno" && saved
                    ? t(saved === "yes" ? "apply.questions.yes" : "apply.questions.no")
                    : saved;
                return (
                  <div key={question.id}>
                    <dt>{question.text}</dt>
                    <dd className={shown ? undefined : "t-apv-sans"}>
                      {shown || t("apply.check.noAnswer")}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        )}
      </div>
      <p className="t-gar">
        <TalentIcon name="confidentialite" size="s" />
        <span>{t("apply.review.guard", { company })}</span>
      </p>
      <form id={formId} action={saveApplicationStepAction} hidden>
        {keep}
      </form>
      <ApplySend
        hidden={{
          job: slug,
          cv: chosenCv?.id ?? "",
          coverLetter: letter,
          staged: "1",
        }}
        laterHref={`${base}?brouillon=1`}
        before={
          <Link href={stepHref("lettre")} className="t-bt t-sec t-m t-press t-post-retour">
            {t("apply.web.back")}
          </Link>
        }
        labels={{
          send: t("apply.send"),
          sending: t("apply.sending"),
          failedTitle: t("apply.failed.title"),
          failedText: t("apply.failed.text"),
          retry: t("apply.failed.retry"),
          later: t("apply.failed.later"),
        }}
      />

      <Sheet id="ap-autre" title={t("apply.extra.title")} closeLabel={t("offer.close")}>
        {full ? (
          <p className="t-aide">{t("apply.extra.full", { max: ATTACHMENTS_MAX })}</p>
        ) : (
          <form action={addApplicationExtraAction} className="t-flux">
            <input type="hidden" name="job" value={slug} />
            <input type="hidden" name="back" value="verification" />
            <p className="t-aide">{t("apply.extra.help")}</p>
            <div className="t-champ">
              <label htmlFor="ap-autre-titre">{t("apply.extra.name")}</label>
              <input
                id="ap-autre-titre"
                name="title"
                required
                maxLength={120}
                placeholder={t("apply.extra.namePlaceholder")}
              />
            </div>
            <div className="t-champ">
              <label htmlFor="ap-autre-texte">{t("apply.extra.text")}</label>
              <textarea
                id="ap-autre-texte"
                name="text"
                required
                rows={5}
                maxLength={2000}
                placeholder={t("apply.extra.textPlaceholder")}
              />
            </div>
            <button type="submit" className="t-bt t-p t-pl t-press">
              {t("apply.extra.save")}
            </button>
          </form>
        )}
      </Sheet>
    </>,
  );
}
