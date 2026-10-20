import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Logo, toneOf } from "@/components/talent/art";
import { ApplySend } from "@/components/talent/apply-send";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { ApplySentDialog } from "@/components/talent/web/apply-sent-dialog";
import { dynamic } from "@/i18n/dynamic";
import { formatDayMonth } from "@/lib/dates";
import { applicationLetterAction } from "@/server/actions/career-documents";
import { saveApplicationStepAction } from "@/server/actions/jobs";
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
  const application = profile
    ? await db.application.findUnique({
        where: { jobId_profileId: { jobId: jobRow.id, profileId: profile.id } },
        select: { id: true },
      })
    : null;

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
  const chosenCv = draft?.profileOnly
    ? null
    : (cvs.find((cv) => cv.id === draft?.cvDocumentId) ?? cvs[0] ?? null);
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
  const back = index === 0 ? base : stepHref(applySteps[index - 1]!);
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
        backLabel={index === 0 ? t("apply.backOffer") : t("apply.back")}
        title={t("apply.title")}
        end={
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

  // ─── Step 1 · the CV. ──────────────────────────────────────────────────────────────
  if (step === "cv") {
    const tailored = cvs[0] ?? null;
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
          <div className="t-post-plus">
            <Link href="/app/career/cv?creer=1" className="t-ajout t-press">
              <TalentIcon name="plus" size="s" />
              {t("apply.cv.create")}
            </Link>
            {tailored && (
              <Link
                href={`/app/career/cv/${tailored.id}?adapter=${jobRow.id}`}
                className="t-verre t-prep t-press t-post-adapter"
              >
                <OrbiMark size={32} />
                <span className="t-t">
                  <b>{t("apply.web.tailor")}</b>
                  <span>{t("apply.web.tailorLine")}</span>
                </span>
                <TalentIcon name="suivant" size="s" />
              </Link>
            )}
          </div>
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
            <SheetButton target="ap-ajout" className="t-ajout t-press">
              <TalentIcon name="plus" size="s" />
              {t("apply.docs.add")}
            </SheetButton>
          </div>
          {!letter && (
            <div className="t-verre t-carte t-sugg">
              <OrbiMark size={36} />
              <div className="t-t">
                <small>{t("apply.docs.orbi.label")}</small>
                <b>{t("apply.docs.orbi.text")}</b>
                <form action={applicationLetterAction}>
                  <input type="hidden" name="job" value={slug} />
                  <button type="submit" className="t-bt t-sec t-s t-press">
                    {t("apply.docs.orbi.cta")}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        <form id={formId} action={saveApplicationStepAction} className="t-flux">
          {keep}
          {(questions.length > 0 || job.requestedDocuments.length > 0) && (
            <fieldset className="t-flux t-serre">
              <legend className="t-h2s">{t("hireOffers.questions.title")}</legend>
              {job.requestedDocuments.length > 0 && (
                <p className="t-aide">
                  {t("hireOffers.questions.documents", {
                    list: job.requestedDocuments
                      .map((kind) => t(`hireOffers.form.document.${kind as "cv"}`))
                      .join(", "),
                  })}
                </p>
              )}
              {questions.length > 0 && (
                <>
                  <input type="hidden" name="answers" value="1" />
                  <p className="t-aide">{t("hireOffers.questions.optional")}</p>
                  <div className="t-verre">
                    {questions.map((question) => {
                      const saved = answers.get(question.id) ?? "";
                      const id = `apply-q-${question.id}`;
                      return (
                        <div key={question.id} className="t-rx-rep">
                          {question.kind === "yesno" ? (
                            <fieldset className="t-flux t-serre">
                              <legend>
                                <p>{question.text}</p>
                              </legend>
                              <div className="t-seg">
                                {(["yes", "no"] as const).map((value) => (
                                  <label key={value}>
                                    <input
                                      type="radio"
                                      name={`answer-${question.id}`}
                                      value={value}
                                      defaultChecked={saved === value}
                                    />
                                    {t(`hireOffers.questions.${value}`)}
                                  </label>
                                ))}
                              </div>
                            </fieldset>
                          ) : (
                            <>
                              <label htmlFor={id}>
                                <p>{question.text}</p>
                              </label>
                              <textarea
                                id={id}
                                name={`answer-${question.id}`}
                                maxLength={1000}
                                rows={3}
                                defaultValue={saved}
                                placeholder={t("hireOffers.questions.answer")}
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </fieldset>
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

  // ─── Step 3 · check and send. ────────────────────────────────────────────────────────────
  const documents = [
    ...(letter ? [t("apply.docs.letter")] : []),
    ...joined.map((item) => item.title),
  ];
  return layout(
    <>
      <h2 className="t-h2s">{t("apply.review.title")}</h2>
      {chosenCv && (
        <div className="t-verre t-cv-big">
          {page}
          <div className="t-t">
            <b>{t("apply.review.cv", { title: chosenCv.title })}</b>
            <span>
              {[
                chosenCv.pageCount ? t("apply.cv.pages", { count: chosenCv.pageCount }) : null,
                t("apply.web.cvLine", { date: formatDayMonth(chosenCv.updatedAt) }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <a
              href={`/app/career/cv/${chosenCv.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="t-bt t-sec t-s t-press"
            >
              {t("apply.web.preview")}
            </a>
          </div>
        </div>
      )}
      <div className="t-verre t-liste t-recap">
        <div className="t-li">
          <span className="t-cases t-c2" aria-hidden>
            <TalentIcon name="profil" size="s" />
          </span>
          <div className="t-t">
            <b>{user.name}</b>
            <span>{user.email}</span>
          </div>
          <Link href="/app/profil" className="t-v t-lien-d">
            {t("apply.review.edit")}
          </Link>
        </div>
        <div className={chosenCv ? "t-li t-post-cvl" : "t-li"}>
          <span className="t-cases t-c2" aria-hidden>
            <TalentIcon name="cv" size="s" />
          </span>
          <div className="t-t">
            <b>
              {chosenCv ? t("apply.review.cv", { title: chosenCv.title }) : t("apply.cv.profile")}
            </b>
            <span>
              {chosenCv
                ? [
                    chosenCv.pageCount ? t("apply.cv.pages", { count: chosenCv.pageCount }) : null,
                    "PDF",
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : t("apply.cv.profileLine")}
            </span>
          </div>
          <Link href={stepHref("cv")} className="t-v t-lien-d">
            {t("apply.review.edit")}
          </Link>
        </div>
        <div className="t-li">
          <span className="t-cases t-c1" aria-hidden>
            <TalentIcon name="document" size="s" />
          </span>
          <div className="t-t">
            <b>{t("apply.review.docs", { count: documents.length })}</b>
            {documents.length > 0 && <span>{documents.join(", ")}</span>}
          </div>
          <Link href={stepHref("lettre")} className="t-v t-lien-d">
            {documents.length > 0 ? t("apply.review.see") : t("apply.review.add")}
          </Link>
        </div>
        <div className="t-li t-post-profil">
          <span className="t-cases t-c3" aria-hidden>
            <TalentIcon name="favori" size="s" />
          </span>
          <div className="t-t">
            <b>{t("apply.web.profile")}</b>
            <span>{t("apply.web.profileLine")}</span>
          </div>
          <Link href="/app/profil/apercu" className="t-v t-lien-d">
            {t("apply.web.profileSee")}
          </Link>
        </div>
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
    </>,
  );
}
