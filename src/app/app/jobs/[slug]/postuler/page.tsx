import type { Metadata } from "next";
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
import { dynamic } from "@/i18n/dynamic";
import { formatDayMonth } from "@/lib/dates";
import { applicationLetterAction } from "@/server/actions/career-documents";
import { saveApplicationStepAction } from "@/server/actions/jobs";
import { requireUser } from "@/server/auth/session";
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
    return (
      <div className="t-conf t-envoyee">
        <span className="t-rond-ok" aria-hidden>
          <TalentIcon name="valider" />
        </span>
        <h1 className="t-h2s">{t("apply.sent.title")}</h1>
        <p>{t("apply.sent.text", { company })}</p>
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
      </div>
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

  const head = (
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

  // ─── Step 1 · the CV. ──────────────────────────────────────────────────────────────
  if (step === "cv") {
    return (
      <div className="t-flux">
        {head}
        <div className="t-verre t-cd t-min">
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
            <div className="t-flux t-serre">
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
                  <span className="t-t">
                    <b>{t("apply.cv.profile")}</b>
                    <span>{t("apply.cv.profileLine")}</span>
                  </span>
                  <span className="t-radio" aria-hidden />
                </label>
              )}
            </div>
          </fieldset>
          <Link href="/app/career/cv?nouveau=1" className="t-ajout t-press">
            <TalentIcon name="plus" size="s" />
            {t("apply.cv.create")}
          </Link>
          <div className="t-verre t-fort t-bas-f">
            <button type="submit" name="next" value="lettre" className="t-bt t-p t-pl t-press">
              {t("apply.continue")}
            </button>
          </div>
        </form>
      </div>
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
    return (
      <div className="t-flux">
        {head}
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
            <SheetButton target="ap-lettre" className="t-bi t-press" label={t("apply.docs.edit")}>
              <TalentIcon name="modifier" size="s" />
            </SheetButton>
          </div>
        )}
        {joined.map((item) => (
          <form key={refValue(item)} action={saveApplicationStepAction} className="t-verre t-pj">
            {keep}
            <input type="hidden" name="next" value="lettre" />
            <input type="hidden" name="attachments" value="1" />
            {remaining(refValue(item))}
            <span
              className={item.type === "certificate" ? "t-cases t-former" : "t-cases t-accomp"}
              aria-hidden
            >
              <TalentIcon name={item.type === "certificate" ? "certificat" : "document"} size="s" />
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

        <form id={formId} action={saveApplicationStepAction}>
          {keep}
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
      </div>
    );
  }

  // ─── Step 3 · check and send. ────────────────────────────────────────────────────────────
  const documents = [
    ...(letter ? [t("apply.docs.letter")] : []),
    ...joined.map((item) => item.title),
  ];
  return (
    <div className="t-flux">
      {head}
      <h2 className="t-h2s">{t("apply.review.title")}</h2>
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
        <div className="t-li">
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
        labels={{
          send: t("apply.send"),
          sending: t("apply.sending"),
          failedTitle: t("apply.failed.title"),
          failedText: t("apply.failed.text"),
          retry: t("apply.failed.retry"),
          later: t("apply.failed.later"),
        }}
      />
    </div>
  );
}
