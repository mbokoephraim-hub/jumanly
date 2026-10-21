import type { ReactNode } from "react";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { ModerationChanges } from "@/components/hire/moderation-changes";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { Sheet } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { pickMessages } from "@/i18n/client-messages";
import { studyFields } from "@/lib/studies";
import { publishOfferAction, saveJobStepAction } from "@/server/actions/hire-offers";
import { db } from "@/server/db";
import { limit } from "@/server/entitlements";
import {
  activeJobCount,
  contractTypes,
  getOrgJob,
  isOrgVerified,
  moderationFlags,
  remoteModes,
  REQUIRED_SKILLS_MAX,
  type HireContext,
} from "@/server/services/hire";
import {
  experienceBands,
  JOB_SHEET_MAX_BYTES,
  jobSteps,
  missingForPublication,
  OPENINGS_MAX,
  requestedDocumentKinds,
  SCREENING_MAX,
  screeningQuestionsOf,
  type JobStep,
} from "@/server/services/hire-offers";
import { jobWriterReadiness } from "@/server/services/job-writer";
import { parseCriteria } from "@/server/services/jobs";
import { cheapestPlanWhere, limitOf, listPublicPlans } from "@/server/services/plans";
import {
  OpeningsStepper,
  OrbiWriter,
  QuestionsEditor,
  ResponsibilitiesEditor,
  SheetOrbi,
  SkillsEditor,
} from "./job-flow-client";
import { ListingPreview } from "./listing-preview";
import { fileSize, OrbiLine, PdfRow } from "./offers";
import { OrgMark } from "./org-mark";

type Job = Awaited<ReturnType<typeof getOrgJob>>;
export type FlowQuery = Record<string, string | undefined>;

const OFFERS = "/app/hire/offres";
const day = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "");
const dollars = (cents: number | null) => (cents === null ? "" : String(Math.round(cents / 100)));

/** The band of experience a saved minimum falls in (0, 2, 5 or 10 years). */
const bandOf = (years: number) => [...experienceBands].reverse().find((band) => years >= band) ?? 0;

/**
 * « Nouvelle offre » and « Modifier l'offre » (brief recruteur § 2.5 to 2.6, planches recruteur-1
 * CR1 to CR4, QUOTA): four steps, each saved at once. Step 4 shows the whole offer as talents will
 * read it, what is missing, the verification of the organization and the active-offer limit.
 */
export async function JobFlow({
  ctx,
  org,
  job,
  step,
  query,
}: {
  ctx: HireContext;
  org: { name: string; banner: string | null; logo: string | null };
  job: Job | null;
  step: JobStep;
  query: FlowQuery;
}) {
  const t = await getTranslations("hireOffers");
  const tw = await getTranslations("hireWeb.flow");
  const tg = await getTranslations();
  const messages = await getMessages();
  const index = jobSteps.indexOf(step);
  const live = job ? ["published", "paused", "pending_review"].includes(job.status) : false;
  const formId = `rx-job-${job?.id ?? "new"}-${step}`;
  const stepHref = (at: number) =>
    job ? `${OFFERS}/${job.id}/modifier?etape=${at}` : `${OFFERS}/nouvelle`;
  const back = index === 0 ? (job && live ? `${OFFERS}/${job.id}` : OFFERS) : stepHref(index);
  const errorText: Record<string, string> = {
    required: t("form.error.required"),
    salaryRange: t("form.error.salaryRange"),
    tooMany: t("form.error.tooMany"),
    forbidden: t("form.error.forbidden"),
    unknownSkills: t("form.error.unknownSkills", { skills: query.inconnues ?? "" }),
    description: t("form.error.description"),
    skills: t("form.error.skills"),
  };
  const error = query.erreur ? (errorText[query.erreur] ?? t("form.error.invalid")) : null;
  const invalid = (field: string) => Boolean(error && query.champ === field);
  const sheetError = ["type", "size", "active", "encrypted", "unreadable"].find(
    (code) => code === query.fiche,
  );
  const toast =
    query.ok === "fiche"
      ? t("form.sheetOk")
      : query.ok === "fiche-retiree"
        ? t("form.sheetRemoved")
        : query.ok === "missions"
          ? t("form.missionsAdded", { count: Number(query.nombre ?? 0) || 0 })
          : query.ok === "copie"
            ? tg("hire.jobForm.draft.copied")
            : null;

  const quit = job ? (
    <button
      type="submit"
      form={formId}
      name="next"
      value="quitter"
      formNoValidate
      className="t-bi t-press"
      aria-label={live ? t("form.quitLive") : t("form.quit")}
    >
      <TalentIcon name="fermer" size="s" />
    </button>
  ) : (
    <Link href={OFFERS} className="t-bi t-press" aria-label={t("form.quitLive")}>
      <TalentIcon name="fermer" size="s" />
    </Link>
  );
  // On a computer or a tablet (planche web recruteur-1 § 3): the title of the page, the four steps
  // in a bar at the top, the form in a card on the left and the listing's preview on the right.
  // A draft never published is still being created (« Créer une offre », « Nouvelle offre »).
  const creating = !job || (job.status === "draft" && !job.publishedAt);
  const webHead = (
    <div className="t-rw-h t-web">
      <div className="t-t">
        <h1>{creating ? tw("title") : t("form.titleEdit")}</h1>
      </div>
      {job && (step === "verifier" ? null : quit)}
    </div>
  );
  const webSteps = (
    <div className="t-verre t-rw-stp t-web">
      <div className="t-rw-of">
        <OrgMark name={org.name} logo={org.logo} size="sm" />
        <div>
          <b>{creating ? t("form.titleNew") : t("form.titleEdit")}</b>
          <span>{job && live ? t("form.live") : t("form.saved")}</span>
        </div>
      </div>
      <ol aria-label={tw("steps")}>
        {jobSteps.map((item, at) => {
          const done = at < index;
          return (
            <li
              key={item}
              className={cx(done && "t-ok", at === index && "t-on")}
              aria-current={at === index ? "step" : undefined}
            >
              <i aria-hidden>{done ? <TalentIcon name="valider" size="xs" /> : at + 1}</i>
              <div>
                {tw(`step.${item}`)}
                <small>{tw(`hint.${item}`)}</small>
                {done && <span className="sr-only">{tw("done")}</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
  const head = (
    <>
      {webHead}
      {webSteps}
      <FlowHead
        back={back}
        backLabel={t("form.back")}
        history={false}
        title={job ? t("form.titleEdit") : t("form.titleNew")}
        end={
          step === "verifier" ? (
            <Link
              href={live ? `${OFFERS}/${job!.id}` : `${OFFERS}?onglet=brouillons`}
              className="t-bi t-press"
              aria-label={live ? t("form.quitLive") : t("form.quit")}
            >
              <TalentIcon name="fermer" size="s" />
            </Link>
          ) : (
            quit
          )
        }
      />
      <div
        className="t-pas t-mob"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={index + 1}
        aria-label={t("form.progress", { step: index + 1 })}
      >
        {jobSteps.map((item, at) => (
          <i key={item} className={cx(at <= index && "t-ok")} />
        ))}
      </div>
      <p className="t-pas-t t-mob">
        {t("form.progress", { step: index + 1 })}
        {job && ` · ${live ? t("form.live") : t("form.saved")}`}
      </p>
      <h2 className="t-h2s t-mob">{t(`form.step.${step}`)}</h2>
      {toast && <ToastOnLoad message={toast} tone="success" />}
      {error && <Notice tone="err">{error}</Notice>}
    </>
  );
  const keep = (
    <>
      {job && <input type="hidden" name="id" value={job.id} />}
      <input type="hidden" name="step" value={step} />
    </>
  );
  const bar = (primary: string) => (
    <div className="t-verre t-fort t-bas-f">
      {index === 0 ? (
        <button
          type="submit"
          name="next"
          value="later"
          formNoValidate
          className="t-bt t-sec t-m t-press"
        >
          {t("form.later")}
        </button>
      ) : (
        <button
          type="submit"
          name="next"
          value="back"
          formNoValidate
          className="t-bt t-sec t-m t-press"
        >
          {t("form.back")}
        </button>
      )}
      <button type="submit" name="next" value="continue" className="t-bt t-p t-pl t-press">
        {primary}
      </button>
    </div>
  );
  const required0 = job?.skills.filter((item) => item.importance === "required") ?? [];
  const preferred0 = job?.skills.filter((item) => item.importance === "preferred") ?? [];
  const preview = (
    <ListingPreview
      formId={formId}
      org={org}
      saved={{
        title: job?.title ?? "",
        city: job?.city ?? "",
        contractType: job?.contractType ?? "cdi",
        remote: job?.remote ?? "onsite",
        responsibilities: job?.responsibilities ?? [],
        required: required0.map((item) => item.skill.name),
        preferred: preferred0.map((item) => item.skill.name),
        closesAt: day(job?.closesAt ?? null),
        documents: job?.requestedDocuments ?? [],
      }}
      labels={{
        title: tw("preview.title"),
        free: t("form.free"),
        contract: Object.fromEntries(contractTypes.map((key) => [key, t(`contract.${key}`)])),
        remote: Object.fromEntries(remoteModes.map((key) => [key, t(`remote.${key}`)])),
        documents: Object.fromEntries(
          requestedDocumentKinds.map((key) => [key, t(`form.document.${key}`)]),
        ),
        preferred: t("form.preview.preferred", { skill: "{skill}" }),
        deadline: tw("preview.deadline", { date: "{date}" }),
        noDeadline: tw("preview.noDeadline"),
      }}
    />
  );
  /** `side`: what stands on the right on a computer (the preview by default). */
  const wrap = (children: ReactNode, side: ReactNode = <div className="t-web">{preview}</div>) => (
    <NextIntlClientProvider messages={pickMessages(messages, ["hireOffers"])}>
      <div className="t-flux t-large t-rw-wz">
        {head}
        <div className="t-rw-g">
          <div className="t-rw-frm">
            <h2 className="t-web">{t(`form.step.${step}`)}</h2>
            {children}
          </div>
          <div className="t-rw-c">{side}</div>
        </div>
      </div>
    </NextIntlClientProvider>
  );

  // ─── Step 1 · the job ──────────────────────────────────────────────────────────────────
  if (step === "poste") {
    return wrap(
      <form id={formId} action={saveJobStepAction} className="t-flux">
        {keep}
        <div className="t-champ">
          <label htmlFor={`${formId}-title`}>{t("form.title")}</label>
          <div className={cx("t-verre t-saisie", invalid("title") && "t-err")}>
            <input
              id={`${formId}-title`}
              name="title"
              required
              minLength={3}
              maxLength={120}
              defaultValue={job?.title ?? ""}
              placeholder={t("form.titlePlaceholder")}
              aria-invalid={invalid("title") || undefined}
            />
          </div>
        </div>
        <div className="t-dates">
          <div className="t-champ">
            <label htmlFor={`${formId}-domain`}>{t("form.domain")}</label>
            <div className="t-verre t-saisie">
              <select id={`${formId}-domain`} name="domain" defaultValue={job?.domain ?? ""}>
                <option value="">{t("form.domainNone")}</option>
                {studyFields.map((field) => (
                  <option key={field} value={field}>
                    {tg(`access.onboarding.studies.field.${field}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="t-champ">
            <label htmlFor={`${formId}-exp`}>{t("form.experience")}</label>
            <div className="t-verre t-saisie">
              <select
                id={`${formId}-exp`}
                name="experienceMin"
                defaultValue={String(bandOf(job?.experienceMin ?? 0))}
              >
                {experienceBands.map((years) => (
                  <option key={years} value={years}>
                    {t("form.experienceBand", { years: String(years) })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="t-dates">
          <div className="t-champ">
            <label htmlFor={`${formId}-city`}>{t("form.city")}</label>
            <div className={cx("t-verre t-saisie", invalid("city") && "t-err")}>
              <TalentIcon name="localisation" size="s" />
              <input
                id={`${formId}-city`}
                name="city"
                required
                maxLength={120}
                defaultValue={job?.city ?? ""}
                autoComplete="address-level2"
              />
            </div>
          </div>
          <div className="t-champ">
            <label htmlFor={`${formId}-country`}>{t("form.country")}</label>
            <div className={cx("t-verre t-saisie", invalid("country") && "t-err")}>
              <input
                id={`${formId}-country`}
                name="country"
                required
                maxLength={80}
                defaultValue={job?.country ?? ""}
                autoComplete="country-name"
              />
            </div>
          </div>
        </div>
        <fieldset className="t-flux t-serre">
          <legend className="t-lab-c">{t("form.remote")}</legend>
          <div className="t-seg t-rx-seg">
            {remoteModes.map((mode) => (
              <label key={mode}>
                <input
                  type="radio"
                  name="remote"
                  value={mode}
                  defaultChecked={(job?.remote ?? "onsite") === mode}
                />
                {t(`remote.${mode}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="t-flux t-serre">
          <legend className="t-lab-c">{t("form.contract")}</legend>
          <div className="t-puces">
            {contractTypes.map((contract) => (
              <label key={contract} className="t-puce t-press">
                <input
                  type="radio"
                  name="contractType"
                  value={contract}
                  defaultChecked={(job?.contractType ?? "cdi") === contract}
                />
                {t(`contract.${contract}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="t-li !min-h-10 !border-0 !p-0">
          <span className="t-t">
            <b id={`${formId}-openings`}>{t("form.openings")}</b>
          </span>
          <OpeningsStepper
            name="openings"
            defaultValue={job?.openings ?? 1}
            max={OPENINGS_MAX}
            labelId={`${formId}-openings`}
          />
        </div>
        <fieldset className="t-flux t-serre">
          <legend className="t-lab-c">{t("form.salary")}</legend>
          <div className="t-dates">
            <div className="t-champ">
              <label htmlFor={`${formId}-smin`} className="!text-[12px] !font-medium">
                {t("form.salaryMin")}
              </label>
              <div className="t-verre t-saisie">
                <input
                  id={`${formId}-smin`}
                  name="salaryMin"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  defaultValue={dollars(job?.salaryMin ?? null)}
                />
              </div>
            </div>
            <div className="t-champ">
              <label htmlFor={`${formId}-smax`} className="!text-[12px] !font-medium">
                {t("form.salaryMax")}
              </label>
              <div className={cx("t-verre t-saisie", invalid("salaryMax") && "t-err")}>
                <input
                  id={`${formId}-smax`}
                  name="salaryMax"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  defaultValue={dollars(job?.salaryMax ?? null)}
                />
              </div>
            </div>
          </div>
        </fieldset>
        <OrbiLine>{t("form.orbiNext")}</OrbiLine>
        {bar(t("form.continue"))}
      </form>,
    );
  }

  const current = job!;

  // ─── Step 2 · the description ──────────────────────────────────────────────────────────
  if (step === "description") {
    const [readiness, skills] = await Promise.all([
      jobWriterReadiness(db, ctx),
      db.skill.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    ]);
    const descriptionId = `${formId}-desc`;
    const requirementsId = `${formId}-req`;
    return wrap(
      <form id={formId} action={saveJobStepAction} className="t-flux">
        {keep}
        <OrbiWriter
          readiness={readiness}
          descriptionId={descriptionId}
          requirementsId={requirementsId}
          facts={{
            title: current.title,
            contract: t(`contract.${current.contractType}` as "contract.cdi"),
            workMode: t(`remote.${current.remote}` as "remote.onsite"),
            city: current.city,
            country: current.country,
          }}
        />
        <div className="t-champ">
          <label htmlFor={descriptionId}>{t("form.presentation")}</label>
          <textarea
            id={descriptionId}
            name="description"
            className={cx("t-verre t-zone", invalid("description") && "t-err")}
            rows={5}
            maxLength={8000}
            defaultValue={current.description}
            placeholder={t("form.presentationPlaceholder")}
          />
        </div>
        <div className="t-flux t-serre">
          <span className="t-lab-c">{t("form.responsibilities")}</span>
          <ResponsibilitiesEditor
            name="responsibilities"
            defaultItems={current.responsibilities}
            max={20}
          />
        </div>
        <div className="t-flux t-serre">
          <span className="t-lab-c">{t("form.skills")}</span>
          <SkillsEditor
            defaultSkills={[...current.skills]
              .sort((a, b) =>
                a.importance === b.importance ? 0 : a.importance === "required" ? -1 : 1,
              )
              .map((item) => ({ name: item.skill.name, required: item.importance === "required" }))}
            options={skills.map((item) => item.name)}
            maxRequired={REQUIRED_SKILLS_MAX}
            invalid={invalid("requiredSkills") || query.erreur === "skills"}
          />
        </div>
        <div className="t-champ">
          <label htmlFor={requirementsId}>{t("form.requirements")}</label>
          <textarea
            id={requirementsId}
            name="requirements"
            className="t-verre t-zone"
            rows={3}
            defaultValue={current.requirements.join("\n")}
            aria-describedby={`${requirementsId}-h`}
          />
          <p id={`${requirementsId}-h`} className="t-aide">
            {t("form.requirementsHint")}
          </p>
        </div>
        <div className="t-champ">
          <label htmlFor={`${formId}-ben`}>{t("form.benefits")}</label>
          <textarea
            id={`${formId}-ben`}
            name="benefits"
            className="t-verre t-zone"
            rows={3}
            defaultValue={current.benefits.join("\n")}
            aria-describedby={`${formId}-ben-h`}
          />
          <p id={`${formId}-ben-h`} className="t-aide">
            {t("form.benefitsHint")}
          </p>
        </div>
        {bar(t("form.continue"))}
      </form>,
    );
  }

  // ─── Step 3 · the application ──────────────────────────────────────────────────────────
  if (step === "candidature") {
    const readiness = await jobWriterReadiness(db, ctx);
    const required = current.skills.find((item) => item.importance === "required");
    const tl = await getTranslations("learn.documents");
    return wrap(
      <form id={formId} action={saveJobStepAction} className="t-flux">
        {keep}
        <div className="t-champ">
          <label htmlFor={`${formId}-closes`}>{t("form.deadline")}</label>
          <div className="t-verre t-saisie">
            <TalentIcon name="agenda" size="s" />
            <input
              id={`${formId}-closes`}
              name="closesAt"
              type="date"
              defaultValue={day(current.closesAt)}
              aria-describedby={`${formId}-closes-h`}
            />
          </div>
          <p id={`${formId}-closes-h`} className="t-aide">
            {t("form.deadlineHint")}
          </p>
        </div>
        <fieldset className="t-flux t-serre">
          <legend className="t-lab-c">{t("form.documents")}</legend>
          <div className="t-puces">
            {requestedDocumentKinds.map((kind) => (
              <label key={kind} className="t-puce t-press">
                <input
                  type="checkbox"
                  name="documents"
                  value={kind}
                  defaultChecked={current.requestedDocuments.includes(kind)}
                />
                {t(`form.document.${kind}`)}
              </label>
            ))}
          </div>
          <p className="t-aide">{t("form.documentsHint")}</p>
        </fieldset>
        <div className="t-flux t-serre">
          <span className="t-lab-c">{t("form.questions")}</span>
          <QuestionsEditor
            name="questions"
            defaultQuestions={screeningQuestionsOf(current.screeningQuestions)}
            max={SCREENING_MAX}
            invalid={invalid("questions")}
            suggestion={
              required ? t("form.orbiQuestionText", { skill: required.skill.name }) : null
            }
          />
        </div>
        <div className="t-flux t-serre">
          <span className="t-lab-c">{t("form.sheet")}</span>
          {current.jobSheetKey && current.jobSheetName ? (
            <>
              <PdfRow
                name={current.jobSheetName}
                badge={t("sheet.pdf")}
                line={t("form.sheetLine", {
                  pages: current.jobSheetPages ?? 1,
                  size: fileSize(current.jobSheetSize ?? 0, tl),
                })}
              >
                <Link
                  href={`${OFFERS}/${current.id}/fiche`}
                  className="t-bt t-sec t-s t-press"
                  aria-label={t("form.sheetReadAria", { name: current.jobSheetName })}
                >
                  {t("form.sheetRead")}
                </Link>
                <button
                  type="submit"
                  name="sheetRemove"
                  value="1"
                  formNoValidate
                  className="t-bt t-sec t-s t-press"
                  aria-label={t("form.sheetRemoveAria", { name: current.jobSheetName })}
                >
                  {t("form.sheetRemove")}
                </button>
              </PdfRow>
              {readiness !== "consent" && <SheetOrbi jobId={current.id} />}
            </>
          ) : (
            <div className="t-verre t-rx-depot">
              <label htmlFor={`${formId}-sheet`} className="sr-only">
                {t("form.sheetChoose")}
              </label>
              <input
                id={`${formId}-sheet`}
                name="sheet"
                type="file"
                accept="application/pdf,.pdf"
                aria-describedby={`${formId}-sheet-h`}
                data-max={JOB_SHEET_MAX_BYTES}
              />
              <p id={`${formId}-sheet-h`} className="t-aide">
                {t("form.sheetHint")}
              </p>
              {sheetError && (
                <p role="alert" className="t-aide t-err">
                  {t(`form.sheetError.${sheetError as "type"}`)}
                </p>
              )}
              <button
                type="submit"
                name="next"
                value="upload"
                className="t-bt t-sec t-s t-press self-start"
              >
                <TalentIcon name="document" size="s" />
                {t("form.sheetUpload")}
              </button>
            </div>
          )}
        </div>
        <div className="t-champ">
          <label htmlFor={`${formId}-instr`}>{t("form.instructions")}</label>
          <textarea
            id={`${formId}-instr`}
            name="instructions"
            className="t-verre t-zone"
            rows={2}
            maxLength={1000}
            defaultValue={current.applicationInstructions ?? ""}
            placeholder={t("form.instructionsPlaceholder")}
          />
        </div>
        <div className="t-champ">
          <label htmlFor={`${formId}-ko`}>{t("form.knockout")}</label>
          <textarea
            id={`${formId}-ko`}
            name="knockout"
            className={cx("t-verre t-zone", invalid("knockout") && "t-err")}
            rows={2}
            defaultValue={parseCriteria(current.knockoutCriteria).join("\n")}
            aria-describedby={`${formId}-ko-h`}
          />
          <p id={`${formId}-ko-h`} className="t-aide">
            {t("form.knockoutHint")}
          </p>
        </div>
        <p className="t-gar">
          <TalentIcon name="valider" size="s" />
          <span>{t("form.free")}</span>
        </p>
        {bar(t("form.check"))}
      </form>,
    );
  }

  // ─── Step 4 · check and publish ────────────────────────────────────────────────────────
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [verified, max, active, plans] = await Promise.all([
    isOrgVerified(db, ctx.organizationId),
    limit(db, subject, "jobs.active.max"),
    activeJobCount(db, ctx.organizationId),
    listPublicPlans(db),
  ]);
  const tl = await getTranslations("learn.documents");
  const flags = moderationFlags(current);
  const missing = missingForPublication(current);
  const questions = screeningQuestionsOf(current.screeningQuestions);
  const holdsPlace = ["published", "pending_review"].includes(current.status);
  const after = holdsPlace ? active : active + 1;
  const reached = max >= 0 && !holdsPlace && active >= max;
  const required = current.skills.filter((item) => item.importance === "required");
  const preferred = current.skills.filter((item) => item.importance === "preferred");
  const salary =
    current.salaryMin !== null && current.salaryMax !== null
      ? t("form.preview.salaryRange", {
          min: formatUsd(current.salaryMin),
          max: formatUsd(current.salaryMax),
        })
      : current.salaryMin !== null
        ? t("form.preview.salaryFrom", { min: formatUsd(current.salaryMin) })
        : current.salaryMax !== null
          ? t("form.preview.salaryTo", { max: formatUsd(current.salaryMax) })
          : null;
  const next = cheapestPlanWhere(plans, ["rh", "company"], (plan) => {
    const value = limitOf(plan, "jobs.active.max");
    return value !== null && (value < 0 || value > max) && plan.isPurchasable;
  });
  const nextJobs = next ? limitOf(next, "jobs.active.max") : null;
  const resolvedPlan = plans.find(
    (plan) => limitOf(plan, "jobs.active.max") === max && ["rh", "company"].includes(plan.family),
  );
  const editing =
    current.status === "published" ||
    current.status === "paused" ||
    current.status === "pending_review";
  const publishLabel =
    verified && current.status !== "changes_requested" ? t("form.publish") : t("form.submit");
  const section = (title: string, body: ReactNode) => (
    <div className="t-rx-sec">
      <h3>{title}</h3>
      {body}
    </div>
  );

  const checks = (
    <>
      {missing.length > 0 && (
        <div className="t-rx-manq" role="status">
          <TalentIcon name="aide" size="s" />
          <span className="flex-1">
            <b>{t("form.missing")}</b> {missing.map((key) => errorText[key]).join(" ")}
          </span>
          <Link href={stepHref(2)} className="t-bt t-sec t-s t-press">
            {t("form.missingFix")}
          </Link>
        </div>
      )}
      {!salary && (
        <div className="t-rx-manq">
          <TalentIcon name="aide" size="s" />
          <span>
            <b>{t("form.salaryMissing")}</b> {t("form.salaryMissingText")}
          </span>
        </div>
      )}
      {verified ? (
        <div className="t-rx-okl">
          <TalentIcon name="valider" size="s" />
          {t("form.verified")}
        </div>
      ) : (
        <div className="t-rx-manq">
          <TalentIcon name="horloge" size="s" />
          {t("form.unverified")}
        </div>
      )}
      <div className="t-verre t-rx-quota">
        <TalentIcon name="offre" size="s" />
        <div className="t-t">
          {max < 0 ? (
            <b>{t("form.quotaUnlimited", { count: active })}</b>
          ) : (
            <>
              <b>{t("form.quota", { count: active, max })}</b>
              {!holdsPlace && !reached && t("form.quotaAfter", { count: after, max })}
            </>
          )}
        </div>
      </div>
      <div className="t-web t-rw-c">{preview}</div>
    </>
  );

  return wrap(
    <>
      {current.status === "changes_requested" && <ModerationChanges job={current} />}
      {current.status === "rejected" && current.moderationReason && (
        <Notice tone="err">
          {tg("hire.jobs.rejected.reason", { reason: current.moderationReason })}
        </Notice>
      )}
      <OrbiLine>{flags.length === 0 ? t("form.reviewOk") : t("form.reviewFlags")}</OrbiLine>
      <div className="t-verre t-rx-apercu t-mob">
        <span className="t-rx-ban" aria-hidden>
          {org.banner && (
            // eslint-disable-next-line @next/next/no-img-element -- the organization's banner, already sized
            <img src={org.banner} alt="" />
          )}
        </span>
        <div className="t-c">
          <b>{current.title}</b>
          <span>
            {t("form.previewMeta", {
              org: org.name,
              place: [
                current.city,
                t(`contract.${current.contractType}` as "contract.cdi"),
                t(`remote.${current.remote}` as "remote.onsite"),
              ].join(" · "),
              openings: current.openings,
            })}
          </span>
        </div>
      </div>
      <div className="t-verre t-rx-all" aria-label={t("form.previewFull")} role="region">
        {section(
          t("form.preview.description"),
          current.description ? (
            <p>{current.description}</p>
          ) : (
            <p className="t-aide">{t("form.preview.empty")}</p>
          ),
        )}
        {current.responsibilities.length > 0 &&
          section(
            t("form.preview.responsibilities"),
            <ul>
              {current.responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>,
          )}
        {section(
          t("form.preview.criteria"),
          <div className="t-rx-chx">
            {required.map((item) => (
              <span key={item.skillId} className="t-v">
                {item.skill.name}
              </span>
            ))}
            {preferred.map((item) => (
              <span key={item.skillId} className="t-s">
                {t("form.preview.preferred", { skill: item.skill.name })}
              </span>
            ))}
            <span className="t-s">
              {t("form.experienceBand", { years: String(bandOf(current.experienceMin)) })}
            </span>
          </div>,
        )}
        {current.requirements.length > 0 &&
          section(
            t("form.preview.requirements"),
            <ul>
              {current.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>,
          )}
        {salary && section(t("form.preview.salary"), <p>{salary}</p>)}
        {current.benefits.length > 0 &&
          section(
            t("form.preview.benefits"),
            <ul>
              {current.benefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>,
          )}
        {current.requestedDocuments.length > 0 &&
          section(
            t("form.preview.documents"),
            <div className="t-rx-chx">
              {current.requestedDocuments.map((kind) => (
                <span key={kind}>{t(`form.document.${kind as "cv"}`)}</span>
              ))}
            </div>,
          )}
        {questions.length > 0 &&
          section(
            t("form.preview.questions", { count: questions.length }),
            <ul>
              {questions.map((question) => (
                <li key={question.id}>{question.text}</li>
              ))}
            </ul>,
          )}
        {current.applicationInstructions &&
          section(t("form.preview.instructions"), <p>{current.applicationInstructions}</p>)}
        {current.jobSheetName &&
          section(
            t("form.preview.sheet"),
            <PdfRow
              bare
              name={current.jobSheetName}
              badge={t("sheet.pdf")}
              line={t("form.sheetLine", {
                pages: current.jobSheetPages ?? 1,
                size: fileSize(current.jobSheetSize ?? 0, tl),
              })}
            >
              <Link href={`${OFFERS}/${current.id}/fiche`} className="t-bt t-sec t-s t-press">
                {t("form.sheetRead")}
              </Link>
            </PdfRow>,
          )}
      </div>
      {/* Last on a phone, as before the web layout (its bar is fixed at the bottom). */}
      <form id={formId} action={publishOfferAction} className="t-rw-o9">
        <input type="hidden" name="id" value={current.id} />
        <div className="t-verre t-fort t-bas-f">
          {editing ? (
            <>
              <Link href={stepHref(3)} className="t-bt t-sec t-m t-press">
                {t("form.back")}
              </Link>
              <Link
                href={`${OFFERS}/${current.id}?ok=enregistree`}
                className="t-bt t-p t-pl t-press"
              >
                {t("form.save")}
              </Link>
            </>
          ) : (
            <>
              <button type="submit" name="intent" value="draft" className="t-bt t-sec t-m t-press">
                {t("form.draft")}
              </button>
              <button
                type="submit"
                name="intent"
                value="publish"
                className="t-bt t-a t-pl t-press"
                disabled={missing.length > 0}
              >
                <TalentIcon name="envoyer" size="s" />
                {publishLabel}
              </button>
            </>
          )}
        </div>
      </form>
      <Sheet
        id="rx-limite"
        title={t("limit.title")}
        closeLabel={t("orbi.close")}
        openParam="limite"
        defaultOpen={query.limite === "1"}
      >
        <div className="t-verre t-rx-quota mt-3">
          <TalentIcon name="offre" size="s" />
          <div className="t-t">
            <b>{t("limit.count", { count: active, max: Math.max(max, 0) })}</b>
            {resolvedPlan ? t("limit.plan", { plan: resolvedPlan.name }) : t("limit.free")}
          </div>
        </div>
        <ul className="t-verre t-liste t-lignes mt-3">
          <li>
            <Link href={OFFERS} className="t-li t-press">
              <span className="t-cases" aria-hidden>
                <TalentIcon name="fermer" size="s" />
              </span>
              <span className="t-t">
                <b>{t("limit.close")}</b>
                <span>{t("limit.closeText")}</span>
              </span>
              <TalentIcon name="suivant" />
            </Link>
          </li>
          {next && (
            <li>
              <Link href="/app/abonnement/formules" className="t-li t-press">
                <span className="t-cases t-c2" aria-hidden>
                  <TalentIcon name="progression" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("limit.upgrade", { plan: next.name })}</b>
                  <span>
                    {t("limit.upgradeText", {
                      jobs: nextJobs ?? 0,
                      seats: limitOf(next, "org.seats") ?? 1,
                      price: next.priceCents === null ? "" : formatUsd(next.priceCents),
                    })}
                  </span>
                </span>
                <TalentIcon name="suivant" />
              </Link>
            </li>
          )}
        </ul>
        <Link
          href={`${OFFERS}?onglet=brouillons&ok=brouillon`}
          className="t-bt t-sec t-pl t-press mt-3 w-full"
        >
          {t("limit.keep")}
        </Link>
      </Sheet>
    </>,
    checks,
  );
}
