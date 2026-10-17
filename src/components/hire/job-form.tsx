import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { pillClass } from "@/components/career/kit";
import { ModerationChanges } from "@/components/hire/moderation-changes";
import { Alert, ButtonLink, Checkbox, Select, TextArea, TextField } from "@/components/ui";
import type { Job } from "@/generated/prisma/client";
import { cx } from "@/lib/cx";
import { saveJobAction } from "@/server/actions/hire";
import { KNOCKOUT_MAX, REQUIRED_SKILLS_MAX, remoteModes } from "@/server/services/hire";
import { contractFilters, parseCriteria } from "@/server/services/jobs";
import { JOB_STEPS } from "./job-steps";
import type { JobBrand } from "./brand-identity";
import { ChipLines, JobWizard } from "./job-wizard";

type EditedJob = Job & { skills: { importance: string; skill: { name: string } }[] };

export type JobFormParams = {
  erreur?: string;
  champ?: string;
  inconnues?: string;
  max?: string;
  ok?: string;
  etape?: string;
};

export type JobFormAi = {
  readiness: "ready" | "consent" | "locked" | "quota";
  credits: number;
  lockText: string;
};

const cents = (value: number | null) => (value === null ? "" : String(Math.round(value / 100)));
const day = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : "");

/** Step of each field, to open the right one after an error (mockup 04-03). */
const fieldStep: Record<string, number> = {
  title: 1,
  contractType: 1,
  remote: 1,
  city: 1,
  country: 1,
  salaryMin: 1,
  salaryMax: 1,
  closesAt: 1,
  experienceMin: 1,
  description: 2,
  responsibilities: 2,
  requirements: 2,
  benefits: 2,
  requiredSkills: 3,
  preferredSkills: 3,
  knockout: 4,
  rejectionTemplate: 5,
  certify: 6,
};

function Step({ at, children }: { at: number; children: ReactNode }) {
  return (
    <section
      data-step={at}
      aria-labelledby={`job-step-${at}`}
      className="flex flex-col gap-5 rounded-[24px] bg-blanc px-[18px] py-5 lg:px-7 lg:py-[26px]"
    >
      {children}
    </section>
  );
}

async function StepHead({
  at,
  title,
  subtitle,
  aside,
}: {
  at: number;
  title: string;
  subtitle?: string;
  aside?: ReactNode;
}) {
  const t = await getTranslations("hire.jobForm");
  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-feuille-fonce uppercase">
          {t("step.text", { current: at, total: JOB_STEPS.length })}
        </p>
        <h2
          id={`job-step-${at}`}
          className="text-[22px] leading-7 font-semibold tracking-[-0.02em]"
        >
          {title}
        </h2>
        {subtitle && <p className="text-[13px] leading-[19px] text-ardoise">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}

/**
 * Job form in six steps (partie 07 § 4, mockup 04-03): one server form, shown one step at a time
 * by `JobWizard`. « Enregistrer le brouillon » or « Publier l'offre » in one submit; publishing
 * asks for the certification that the job is real.
 */
export async function JobForm({
  job,
  params,
  org,
  verified,
  brand,
  ai,
  templates,
}: {
  job?: EditedJob;
  params: JobFormParams;
  org: string;
  verified: boolean;
  brand: JobBrand;
  ai: JobFormAi;
  templates?: ReactNode;
}) {
  const t = await getTranslations("hire.jobForm");
  const tg = await getTranslations();
  const messages = await getMessages();
  const skills = (importance: string) =>
    (job?.skills ?? [])
      .filter((item) => item.importance === importance)
      .map((item) => item.skill.name)
      .join(", ");

  const errorText: Record<string, string> = {
    required: t("error.required"),
    salaryRange: t("salary.error.range"),
    forbidden: t("knockout.forbidden"),
    tooMany: t("skills.max", {
      max: params.champ === "knockout" ? KNOCKOUT_MAX : REQUIRED_SKILLS_MAX,
    }),
    unknownSkills: t("skills.unknown", { skills: params.inconnues ?? "" }),
    minRequired: t("skills.minRequired"),
    limite: t("publish.limitReached", { max: Number(params.max ?? 0) }),
    certify: t("error.certify"),
  };
  const message = params.erreur ? (errorText[params.erreur] ?? t("error.invalid")) : null;
  const fieldError = (field: string) => (message && params.champ === field ? message : undefined);
  const wanted = Number(params.etape);
  const initialStep =
    wanted >= 1 && wanted <= JOB_STEPS.length
      ? wanted
      : params.erreur === "limite"
        ? JOB_STEPS.length
        : (fieldStep[params.champ ?? ""] ?? 1);
  const formId = job ? `job-form-${job.id}` : "job-form-new";
  const pick = {
    hire: { jobForm: messages.hire.jobForm },
    ai: messages.ai,
    a11y: { avatar: messages.a11y.avatar },
  };
  const submitRow = "flex flex-wrap items-center gap-2.5 border-t border-gris-clair pt-4";

  return (
    <NextIntlClientProvider messages={pick}>
      {message && (
        <Alert
          tone={params.erreur === "limite" ? "warning" : "error"}
          title={message}
          action={
            params.erreur === "limite" ? (
              <ButtonLink href="/app/abonnement" variant="tertiary" size="sm">
                {tg("hire.jobs.limit.reached.cta")}
              </ButtonLink>
            ) : undefined
          }
        />
      )}
      {job?.status === "changes_requested" && <ModerationChanges job={job} />}
      {job?.status === "rejected" && job.moderationReason && (
        <Alert
          tone="error"
          title={tg("hire.jobs.rejected.reason", { reason: job.moderationReason })}
        />
      )}
      <JobWizard
        formId={formId}
        initialStep={initialStep}
        org={org}
        verified={verified}
        brand={brand}
        readiness={ai.readiness}
        credits={ai.credits}
        lockText={ai.lockText}
        savedAt={job?.status === "draft" ? job.updatedAt : null}
        templates={templates}
      >
        <form id={formId} action={saveJobAction} className="flex flex-col gap-4">
          {job && <input type="hidden" name="id" value={job.id} />}

          <Step at={1}>
            <StepHead at={1} title={t("step.basics")} />
            <TextField
              id="job-title"
              name="title"
              required
              minLength={3}
              maxLength={120}
              label={t("jobTitle.text")}
              placeholder={t("jobTitle.placeholder")}
              hint={t("jobTitle.neutral")}
              defaultValue={job?.title}
              error={fieldError("title")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                id="job-contractType"
                name="contractType"
                required
                label={t("contract.text")}
                defaultValue={job?.contractType ?? "cdi"}
                options={Object.entries(contractFilters).map(([key, values]) => ({
                  value: values[0],
                  label: tg(`jobs.search.contract.${key as keyof typeof contractFilters}`),
                }))}
              />
              <Select
                id="job-remote"
                name="remote"
                required
                label={t("workMode")}
                defaultValue={job?.remote ?? "onsite"}
                options={remoteModes.map((mode) => ({
                  value: mode,
                  label: tg(`talent.profile.preferences.remote.${mode}`),
                }))}
              />
              <TextField
                id="job-city"
                name="city"
                required
                maxLength={120}
                label={t("location.city")}
                defaultValue={job?.city ?? ""}
                error={fieldError("city")}
              />
              <TextField
                id="job-country"
                name="country"
                required
                maxLength={80}
                label={t("location.country")}
                defaultValue={job?.country ?? ""}
                error={fieldError("country")}
              />
              <TextField
                id="job-salaryMin"
                name="salaryMin"
                type="number"
                inputMode="numeric"
                min={0}
                label={t("salary.min")}
                hint={t("salary.unit")}
                defaultValue={cents(job?.salaryMin ?? null)}
                error={fieldError("salaryMin")}
              />
              <TextField
                id="job-salaryMax"
                name="salaryMax"
                type="number"
                inputMode="numeric"
                min={0}
                label={t("salary.max")}
                hint={t("salary.hint")}
                defaultValue={cents(job?.salaryMax ?? null)}
                error={fieldError("salaryMax")}
              />
              <TextField
                id="job-closesAt"
                name="closesAt"
                type="date"
                label={t("deadline")}
                defaultValue={day(job?.closesAt ?? null)}
                error={fieldError("closesAt")}
              />
              <TextField
                id="job-experienceMin"
                name="experienceMin"
                type="number"
                inputMode="numeric"
                min={0}
                max={40}
                label={t("experience.min")}
                hint={t("experience.noneOk")}
                defaultValue={String(job?.experienceMin ?? 0)}
              />
            </div>
          </Step>

          <Step at={2}>
            <StepHead at={2} title={t("step.description")} />
            <TextArea
              id="job-description-text"
              name="description"
              required
              rows={5}
              maxLength={8000}
              label={t("summary.text")}
              placeholder={t("summary.placeholder")}
              defaultValue={job?.description}
              error={fieldError("description")}
            />
            <TextArea
              id="job-responsibilities"
              name="responsibilities"
              rows={4}
              label={t("missions.text")}
              placeholder={t("missions.placeholder")}
              hint={t("missions.placeholder")}
              defaultValue={job?.responsibilities.join("\n")}
            />
            <TextArea
              id="job-requirements"
              name="requirements"
              rows={3}
              label={t("profile.text")}
              placeholder={t("profile.placeholder")}
              hint={t("profile.placeholder")}
              defaultValue={job?.requirements.join("\n")}
            />
            <ChipLines
              name="benefits"
              initial={job?.benefits ?? []}
              label={t("benefits.text")}
              placeholder={t("benefits.placeholder")}
            />
            <p className="flex gap-2.5 rounded-[16px] bg-down-fond/60 px-4 py-3 text-[12px] leading-[17px] text-sapin">
              <Icon name="alerte" className="mt-px size-4 shrink-0 text-down-texte" />
              {t("description.inclusive")}
            </p>
          </Step>

          <Step at={3}>
            <StepHead at={3} title={t("skills.title")} subtitle={t("skills.subtitle")} />
            <TextArea
              id="job-requiredSkills"
              name="requiredSkills"
              rows={2}
              label={t("skills.required.text")}
              placeholder={t("skills.search.placeholder")}
              hint={[t("skills.required.hint"), t("skills.separator")].join(" ")}
              defaultValue={skills("required")}
              error={fieldError("requiredSkills")}
            />
            <TextArea
              id="job-preferredSkills"
              name="preferredSkills"
              rows={2}
              label={t("skills.preferred.text")}
              placeholder={t("skills.search.placeholder")}
              hint={[t("skills.preferred.hint"), t("skills.separator")].join(" ")}
              defaultValue={skills("preferred")}
            />
          </Step>

          <Step at={4}>
            <StepHead at={4} title={t("knockout.title")} subtitle={t("knockout.subtitle")} />
            <TextArea
              id="job-knockout"
              name="knockout"
              rows={3}
              label={t("knockout.title")}
              placeholder={t("knockout.question.placeholder")}
              hint={[t("lines.hint"), t("knockout.max", { max: KNOCKOUT_MAX })].join(" ")}
              defaultValue={job ? parseCriteria(job.knockoutCriteria).join("\n") : ""}
              error={fieldError("knockout")}
            />
            <p className="flex gap-2.5 rounded-[16px] bg-lime-clair px-4 py-3 text-[12px] leading-[17px]">
              <Icon name="check" className="mt-px size-4 shrink-0 text-feuille-fonce" />
              {t("knockout.behavior")}
            </p>
            <p className="text-[12px] text-ardoise">{t("knockout.public")}</p>
          </Step>

          <Step at={5}>
            <StepHead at={5} title={t("process.title")} subtitle={t("process.subtitle")} />
            <p className="rounded-[16px] bg-creme px-4 py-3 text-[12.5px] leading-[18px]">
              {t("process.default")}
            </p>
            <TextArea
              id="job-rejectionTemplate"
              name="rejectionTemplate"
              rows={5}
              maxLength={3000}
              label={t("rejectionTemplate.text")}
              hint={t("rejectionTemplate.hint")}
              defaultValue={job?.rejectionTemplate ?? ""}
            />
          </Step>

          <Step at={6}>
            <StepHead at={6} title={t("step.preview")} subtitle={t("preview.subtitle")} />
            <p className="flex gap-2.5 rounded-[16px] bg-lime-clair px-4 py-3 text-[12.5px] leading-[18px]">
              <Icon name="check" className="mt-px size-4 shrink-0 text-feuille-fonce" />
              {t("publish.free")}
            </p>
            <Checkbox
              id={`${formId}-certify`}
              name="certify"
              label={t("publish.terms")}
              hint={fieldError("certify")}
            />
            <div className={submitRow}>
              <button
                type="submit"
                name="intent"
                value="draft"
                className={pillClass("outline", "md", "max-lg:flex-1")}
              >
                {t("saveDraft")}
              </button>
              <button
                type="submit"
                name="intent"
                value="publish"
                className={cx(pillClass("lime", "md", "max-lg:flex-1"), "lg:ml-auto")}
              >
                {t("publish.text")}
                <Icon name="chev-r" className="size-4" />
              </button>
            </div>
          </Step>
        </form>
      </JobWizard>
    </NextIntlClientProvider>
  );
}
