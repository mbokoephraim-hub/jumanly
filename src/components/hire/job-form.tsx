import { getTranslations } from "next-intl/server";
import { Alert, Button, ButtonLink, Select, TextArea, TextField } from "@/components/ui";
import type { Job } from "@/generated/prisma/client";
import { saveJobAction } from "@/server/actions/hire";
import { KNOCKOUT_MAX, REQUIRED_SKILLS_MAX, remoteModes } from "@/server/services/hire";
import { contractFilters, parseCriteria } from "@/server/services/jobs";

type EditedJob = Job & { skills: { importance: string; skill: { name: string } }[] };

export type JobFormParams = {
  erreur?: string;
  champ?: string;
  inconnues?: string;
  max?: string;
  ok?: string;
};

const cents = (value: number | null) => (value === null ? "" : String(Math.round(value / 100)));
const day = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : "");

/**
 * Job form on one page (partie 07 § 4): the essentials, description, skills, criteria and the
 * rejection message. « Enregistrer le brouillon » or « Publier l'offre » in one submit.
 */
export async function JobForm({ job, params }: { job?: EditedJob; params: JobFormParams }) {
  const t = await getTranslations("hire.jobForm");
  const tg = await getTranslations();
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
  };
  const message = params.erreur ? (errorText[params.erreur] ?? t("error.invalid")) : null;
  const fieldError = (field: string) => (message && params.champ === field ? message : undefined);

  return (
    <form action={saveJobAction} className="flex flex-col gap-6">
      {job && <input type="hidden" name="id" value={job.id} />}
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
      {params.ok === "brouillon" && <Alert tone="success" title={t("draft.ok")} />}
      {job?.status === "rejected" && job.moderationReason && (
        <Alert
          tone="error"
          title={tg("hire.jobs.rejected.reason", { reason: job.moderationReason })}
        />
      )}

      <section
        aria-labelledby="essentiel"
        className="flex flex-col gap-4 rounded-card bg-blanc p-6"
      >
        <h2 id="essentiel" className="text-h2">
          {t("step.basics")}
        </h2>
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
      </section>

      <section
        aria-labelledby="description"
        className="flex flex-col gap-4 rounded-card bg-blanc p-6"
      >
        <h2 id="description" className="text-h2">
          {t("step.description")}
        </h2>
        <p className="text-sm text-ardoise">{t("description.inclusive")}</p>
        <TextArea
          id="job-description-text"
          name="description"
          required
          rows={6}
          maxLength={8000}
          label={t("summary.text")}
          placeholder={t("summary.placeholder")}
          defaultValue={job?.description}
          error={fieldError("description")}
        />
        <TextArea
          id="job-responsibilities"
          name="responsibilities"
          rows={5}
          label={t("missions.text")}
          placeholder={t("missions.placeholder")}
          hint={t("lines.hint")}
          defaultValue={job?.responsibilities.join("\n")}
        />
        <TextArea
          id="job-requirements"
          name="requirements"
          rows={4}
          label={t("profile.text")}
          placeholder={t("profile.placeholder")}
          hint={t("lines.hint")}
          defaultValue={job?.requirements.join("\n")}
        />
        <TextArea
          id="job-benefits"
          name="benefits"
          rows={3}
          label={t("benefits.text")}
          placeholder={t("benefits.placeholder")}
          hint={t("lines.hint")}
          defaultValue={job?.benefits.join("\n")}
        />
      </section>

      <section
        aria-labelledby="competences"
        className="flex flex-col gap-4 rounded-card bg-blanc p-6"
      >
        <div className="flex flex-col gap-1">
          <h2 id="competences" className="text-h2">
            {t("skills.title")}
          </h2>
          <p className="text-ardoise">{t("skills.subtitle")}</p>
        </div>
        <TextArea
          id="job-requiredSkills"
          name="requiredSkills"
          rows={2}
          required
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
      </section>

      <section aria-labelledby="criteres" className="flex flex-col gap-4 rounded-card bg-blanc p-6">
        <div className="flex flex-col gap-1">
          <h2 id="criteres" className="text-h2">
            {t("knockout.title")}
          </h2>
          <p className="text-ardoise">{t("knockout.subtitle")}</p>
        </div>
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
        <p className="text-sm text-ardoise">{t("knockout.behavior")}</p>
        <p className="text-sm text-ardoise">{t("knockout.public")}</p>
      </section>

      <section
        aria-labelledby="processus"
        className="flex flex-col gap-4 rounded-card bg-blanc p-6"
      >
        <div className="flex flex-col gap-1">
          <h2 id="processus" className="text-h2">
            {t("process.title")}
          </h2>
          <p className="text-ardoise">{t("process.subtitle")}</p>
          <p className="text-sm text-ardoise">{t("process.default")}</p>
        </div>
        <TextArea
          id="job-rejectionTemplate"
          name="rejectionTemplate"
          rows={5}
          maxLength={3000}
          label={t("rejectionTemplate.text")}
          hint={t("rejectionTemplate.hint")}
          defaultValue={job?.rejectionTemplate ?? ""}
        />
      </section>

      <section aria-labelledby="publier" className="flex flex-col gap-4 rounded-card bg-blanc p-6">
        <h2 id="publier" className="text-h2">
          {t("preview.checklist")}
        </h2>
        <p className="text-sm text-ardoise">{t("publish.free")}</p>
        <p className="text-sm text-ardoise">{t("publish.terms")}</p>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" name="intent" value="publish">
            {t("publish.text")}
          </Button>
          <Button type="submit" name="intent" value="draft" variant="tertiary">
            {t("saveDraft")}
          </Button>
        </div>
      </section>
    </form>
  );
}
