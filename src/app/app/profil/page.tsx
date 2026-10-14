import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Checkbox,
  ProgressBar,
  RadioGroup,
  Select,
  TextArea,
  TextField,
} from "@/components/ui";
import { countryOptions } from "@/config/countries";
import { dynamic } from "@/i18n/dynamic";
import { languageName } from "@/lib/dates";
import {
  addLanguage,
  addSkill,
  deleteEducation,
  deleteExperience,
  removeLanguage,
  removeSkill,
  saveEducation,
  saveExperience,
  saveIdentity,
  savePreferences,
  saveSummary,
  saveVisibility,
} from "@/server/actions/profile";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  cefrLevels,
  completeness,
  contractPreferences,
  dateToMonth,
  getFullProfile,
  languageLevels,
  parseProfileLanguages,
  PROFILE_SUMMARY_MAX,
  skillLevelKeys,
  skillProofs,
  type FullProfile,
} from "@/server/services/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.profile");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** Languages offered in the form: the most useful on the continent first. */
const languageCodes = [
  "fr",
  "en",
  "ln",
  "sw",
  "pt",
  "ar",
  "es",
  "de",
  "zh",
  "wo",
  "yo",
  "ha",
  "am",
  "kg",
  "lu",
  "rw",
];

const experienceTypes = ["job", "internship", "freelance", "volunteer", "entrepreneur"] as const;
const educationLevels = [
  "none",
  "secondary",
  "vocational",
  "bachelor",
  "master",
  "doctorate",
] as const;

/** « Mon profil professionnel » (partie 07 § 3): every section, saved one at a time. */
export default async function ProfilePage({ searchParams }: PageProps<"/app/profil">) {
  const params = await searchParams;
  const user = await requireUser("/app/profil");
  const t = await getTranslations();
  const profile = await getFullProfile(db, user.id);
  const { percent, missing } = completeness(profile);
  const sectionNames: Record<string, string> = {
    identity: t("talent.profile.identity.title"),
    summary: t("talent.profile.summary.title"),
    experience: t("talent.profile.experience.title"),
    education: t("talent.profile.education.title"),
    skills: t("talent.profile.skills.title"),
    languages: t("talent.profile.languages.title"),
    preferences: t("talent.profile.preferences.title"),
  };
  const notice = { section: one(params.section), ok: one(params.ok), error: one(params.erreur) };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-h1">{t("talent.profile.title")}</h1>
        <p className="text-ardoise">{t("talent.profile.subtitle")}</p>
        <div className="flex max-w-xl flex-col gap-2 rounded-card bg-blanc p-5">
          <p className="font-semibold">{t("talent.profile.completion.text", { percent })}</p>
          <ProgressBar value={percent} label={t("talent.profile.completion.text", { percent })} />
          <p className="text-sm text-ardoise">
            {missing.length > 0
              ? t("talent.profile.completion.missing", {
                  sections: missing.map((key) => sectionNames[key]).join(", "),
                })
              : t("talent.profile.completion.hint")}
          </p>
        </div>
        {one(params.import) !== undefined && (
          <Alert
            tone="success"
            title={t("ai.cvImport.done", { count: Number(one(params.import)) || 0 })}
          />
        )}
        <div className="flex max-w-xl flex-col items-start gap-2">
          <ButtonLink href="/app/profil/import" variant="secondary" size="sm">
            {t("talent.profile.importCv.text")}
          </ButtonLink>
          <p className="text-sm text-ardoise">{t("talent.profile.importCv.hint")}</p>
        </div>
      </header>
      <Identity profile={profile} notice={notice} />
      <Summary profile={profile} notice={notice} />
      <Experiences profile={profile} notice={notice} />
      <Educations profile={profile} notice={notice} />
      <Skills profile={profile} notice={notice} />
      <Languages profile={profile} notice={notice} />
      <Preferences profile={profile} notice={notice} />
      <Visibility profile={profile} notice={notice} />
    </div>
  );
}

type Notice = { section?: string; ok?: string; error?: string };
type SectionProps = { profile: FullProfile; notice: Notice };

async function Section({
  id,
  title,
  subtitle,
  notice,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  notice: Notice;
  children: ReactNode;
}) {
  const t = await getTranslations("talent.profile");
  const td = dynamic(t);
  const mine = notice.section === id;
  const errorText =
    notice.error === "endBeforeStart"
      ? t("experience.error.endBeforeStart")
      : notice.error && td.has(`skills.${notice.error}`)
        ? td(`skills.${notice.error}`, { max: 40 })
        : t("error");
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex scroll-mt-24 flex-col gap-4 rounded-card bg-blanc p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="text-h2">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-ardoise">{subtitle}</p>}
      </div>
      {mine && notice.ok && <Alert tone="success" title={t("saved")} />}
      {mine && notice.error && <Alert tone="error" title={errorText} />}
      {children}
    </section>
  );
}

/** A native disclosure holding a form: no JavaScript needed. */
function Disclosure({
  label,
  children,
  open = false,
}: {
  label: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="rounded-md bg-creme p-4" open={open}>
      <summary className="cursor-pointer font-medium">{label}</summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

async function Identity({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  return (
    <Section id="identite" title={t("identity.title")} notice={notice}>
      <form action={saveIdentity} className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="firstName"
          name="firstName"
          label={t("identity.firstName")}
          defaultValue={profile.user.firstName ?? ""}
          required
          autoComplete="given-name"
        />
        <TextField
          id="lastName"
          name="lastName"
          label={t("identity.lastName")}
          defaultValue={profile.user.lastName ?? ""}
          required
          autoComplete="family-name"
        />
        <TextField
          id="headline"
          name="headline"
          label={t("identity.headline.text")}
          placeholder={t("identity.headline.placeholder")}
          hint={t("identity.headline.hint")}
          defaultValue={profile.headline ?? ""}
          maxLength={120}
          className="sm:col-span-2"
        />
        <Select
          id="country"
          name="country"
          label={t("identity.country")}
          defaultValue={profile.user.country ?? ""}
          required
          options={countryOptions("code")}
          placeholder={t("identity.country")}
        />
        <TextField
          id="city"
          name="city"
          label={t("identity.city.text")}
          placeholder={t("identity.city.placeholder")}
          defaultValue={profile.user.city ?? ""}
          required
          autoComplete="address-level2"
        />
        <TextField
          id="email"
          name="email"
          label={t("identity.email.text")}
          hint={t("identity.email.hint")}
          defaultValue={profile.user.email}
          readOnly
          className="sm:col-span-2"
        />
        <p className="text-sm text-ardoise sm:col-span-2">{t("identity.photo.hint")}</p>
        <div className="sm:col-span-2">
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Section>
  );
}

async function Summary({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  return (
    <Section id="resume" title={t("summary.title")} notice={notice}>
      <form action={saveSummary} className="flex flex-col gap-4">
        <TextArea
          id="summary"
          name="summary"
          label={t("summary.label")}
          placeholder={t("summary.placeholder")}
          hint={t("summary.counter", {
            count: profile.summary?.length ?? 0,
            max: PROFILE_SUMMARY_MAX,
          })}
          defaultValue={profile.summary ?? ""}
          maxLength={PROFILE_SUMMARY_MAX}
          rows={5}
        />
        <div>
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Section>
  );
}

async function ExperienceForm({ experience }: { experience?: FullProfile["experiences"][number] }) {
  const t = await getTranslations("talent.profile");
  const key = experience?.id ?? "new";
  return (
    <form action={saveExperience} className="grid gap-4 sm:grid-cols-2">
      {experience && <input type="hidden" name="id" value={experience.id} />}
      <TextField
        id={`exp-title-${key}`}
        name="title"
        label={t("experience.role.text")}
        placeholder={t("experience.role.placeholder")}
        defaultValue={experience?.title}
        required
      />
      <TextField
        id={`exp-company-${key}`}
        name="company"
        label={t("experience.company.text")}
        placeholder={t("experience.company.placeholder")}
        defaultValue={experience?.company}
        required
      />
      <Select
        id={`exp-type-${key}`}
        name="type"
        label={t("experience.type.text")}
        defaultValue={experience?.type ?? "job"}
        required
        options={experienceTypes.map((type) => ({
          value: type,
          label: t(`experience.type.${type}`),
        }))}
      />
      <TextField
        id={`exp-location-${key}`}
        name="location"
        label={t("experience.location")}
        defaultValue={experience?.location ?? ""}
      />
      <TextField
        id={`exp-start-${key}`}
        name="start"
        type="month"
        label={t("experience.start")}
        defaultValue={dateToMonth(experience?.startDate)}
        required
      />
      <TextField
        id={`exp-end-${key}`}
        name="end"
        type="month"
        label={t("experience.end")}
        defaultValue={dateToMonth(experience?.endDate)}
      />
      <Checkbox
        id={`exp-current-${key}`}
        name="current"
        value="on"
        defaultChecked={experience ? experience.endDate === null : false}
        label={t("experience.current")}
        className="sm:col-span-2"
      />
      <TextArea
        id={`exp-description-${key}`}
        name="description"
        label={t("experience.description.text")}
        placeholder={t("experience.description.placeholder")}
        defaultValue={experience?.description}
        rows={4}
        className="sm:col-span-2"
      />
      <div className="sm:col-span-2">
        <Button type="submit">{t("save")}</Button>
      </div>
    </form>
  );
}

async function Experiences({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  const period = (start: Date, end: Date | null) => {
    const format = (date: Date) =>
      new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
        date,
      );
    return end
      ? t("experience.period.text", { start: format(start), end: format(end) })
      : t("experience.period.current", { start: format(start) });
  };
  return (
    <Section id="experiences" title={t("experience.title")} notice={notice}>
      {profile.experiences.length === 0 ? (
        <p className="text-sm text-ardoise">{t("experience.empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-brume">
          {profile.experiences.map((experience) => (
            <li key={experience.id} className="flex flex-col gap-2 py-4">
              <p className="font-semibold">
                {experience.title}
                {" · "}
                {experience.company}
              </p>
              <p className="text-sm text-ardoise">
                {period(experience.startDate, experience.endDate)}
                {experience.location && ` · ${experience.location}`}
              </p>
              {experience.description && (
                <p className="text-sm whitespace-pre-line">{experience.description}</p>
              )}
              <div className="flex flex-wrap gap-3">
                <Disclosure label={t("edit")}>
                  <ExperienceForm experience={experience} />
                </Disclosure>
                <form action={deleteExperience}>
                  <input type="hidden" name="id" value={experience.id} />
                  <Button type="submit" variant="tertiary" size="sm">
                    {t("delete")}
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Disclosure
        label={t("experience.add")}
        open={profile.experiences.length === 0 && notice.section === "experiences"}
      >
        <ExperienceForm />
      </Disclosure>
    </Section>
  );
}

async function EducationForm({ education }: { education?: FullProfile["educations"][number] }) {
  const t = await getTranslations("talent.profile");
  const key = education?.id ?? "new";
  return (
    <form action={saveEducation} className="grid gap-4 sm:grid-cols-2">
      {education && <input type="hidden" name="id" value={education.id} />}
      <TextField
        id={`edu-degree-${key}`}
        name="degree"
        label={t("education.degree.text")}
        placeholder={t("education.degree.placeholder")}
        defaultValue={education?.degree}
        required
        className="sm:col-span-2"
      />
      <Select
        id={`edu-level-${key}`}
        name="level"
        label={t("education.level.text")}
        defaultValue={education?.level ?? "bachelor"}
        required
        options={educationLevels.map((level) => ({
          value: level,
          label: t(`education.level.${level}`),
        }))}
      />
      <TextField
        id={`edu-field-${key}`}
        name="field"
        label={t("education.field")}
        defaultValue={education?.field ?? ""}
      />
      <TextField
        id={`edu-school-${key}`}
        name="school"
        label={t("education.school")}
        defaultValue={education?.school}
        required
        className="sm:col-span-2"
      />
      <TextField
        id={`edu-start-${key}`}
        name="startYear"
        type="number"
        inputMode="numeric"
        min={1950}
        max={2100}
        label={t("education.start")}
        defaultValue={education?.startYear?.toString() ?? ""}
      />
      <TextField
        id={`edu-end-${key}`}
        name="endYear"
        type="number"
        inputMode="numeric"
        min={1950}
        max={2100}
        label={t("education.end")}
        defaultValue={education?.endYear?.toString() ?? ""}
      />
      <Checkbox
        id={`edu-progress-${key}`}
        name="inProgress"
        value="on"
        defaultChecked={education ? education.endYear === null : false}
        label={t("education.inProgress")}
        className="sm:col-span-2"
      />
      <div className="sm:col-span-2">
        <Button type="submit">{t("save")}</Button>
      </div>
    </form>
  );
}

async function Educations({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  return (
    <Section id="formations" title={t("education.title")} notice={notice}>
      {profile.educations.length === 0 ? (
        <p className="text-sm text-ardoise">{t("sectionEmpty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-brume">
          {profile.educations.map((education) => (
            <li key={education.id} className="flex flex-col gap-2 py-4">
              <p className="font-semibold">{education.degree}</p>
              <p className="text-sm text-ardoise">
                {[
                  education.school,
                  t(`education.level.${education.level}`),
                  education.endYear === null
                    ? t("education.inProgress")
                    : String(education.endYear),
                ].join(" · ")}
              </p>
              <div className="flex flex-wrap gap-3">
                <Disclosure label={t("edit")}>
                  <EducationForm education={education} />
                </Disclosure>
                <form action={deleteEducation}>
                  <input type="hidden" name="id" value={education.id} />
                  <Button type="submit" variant="tertiary" size="sm">
                    {t("delete")}
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Disclosure label={t("education.add")}>
        <EducationForm />
      </Disclosure>
    </Section>
  );
}

async function Skills({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  const reference = await db.skill.findMany({ select: { name: true }, orderBy: { name: "asc" } });
  const levelOptions = ([1, 2, 3, 4] as const).map((level) => ({
    value: String(level),
    label: t(`skills.level.${skillLevelKeys[level]}`),
  }));
  return (
    <Section
      id="competences"
      title={t("skills.title")}
      subtitle={t("skills.subtitle")}
      notice={notice}
    >
      {profile.skills.length < 3 && <p className="text-sm text-ardoise">{t("skills.empty")}</p>}
      {profile.skills.length > 0 && (
        <ul className="flex flex-col divide-y divide-brume">
          {profile.skills.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{entry.skill.name}</span>
                <span className="text-sm text-ardoise">
                  {t(
                    `skills.level.${skillLevelKeys[entry.level as 1 | 2 | 3 | 4] ?? "intermediate"}`,
                  )}
                </span>
                <Badge tone={entry.verified ? "success" : "neutral"}>
                  {entry.verified ? t("skills.badge.verified") : t("skills.badge.declared")}
                </Badge>
              </span>
              <form action={removeSkill}>
                <input type="hidden" name="id" value={entry.id} />
                <Button type="submit" variant="tertiary" size="sm">
                  {t("delete")}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <Disclosure label={t("skills.add")} open={profile.skills.length < 3}>
        <form action={addSkill} className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="skill-name"
            name="skill"
            label={t("skills.title")}
            placeholder={t("skills.search.placeholder")}
            list="skills-reference"
            autoComplete="off"
            required
          />
          <datalist id="skills-reference">
            {reference.map((skill) => (
              <option key={skill.name} value={skill.name} />
            ))}
          </datalist>
          <Select
            id="skill-level"
            name="level"
            label={t("skills.level.text")}
            defaultValue="2"
            required
            options={levelOptions}
          />
          <Select
            id="skill-proof"
            name="proof"
            label={t("skills.proof.text")}
            hint={t("skills.proof.hint")}
            defaultValue=""
            options={[
              { value: "", label: t("skills.proof.none") },
              ...skillProofs.map((proof) => ({ value: proof, label: t(`skills.proof.${proof}`) })),
            ]}
          />
          <TextField
            id="skill-proof-url"
            name="proofUrl"
            type="url"
            label={t("skills.proofUrl")}
            placeholder="https://"
          />
          <div className="sm:col-span-2">
            <Button type="submit">{t("add")}</Button>
          </div>
        </form>
      </Disclosure>
    </Section>
  );
}

async function Languages({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  const languages = parseProfileLanguages(profile.languages);
  return (
    <Section id="langues" title={t("languages.title")} notice={notice}>
      {languages.length === 0 ? (
        <p className="text-sm text-ardoise">{t("languages.empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-brume">
          {languages.map((language) => (
            <li
              key={language.code}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <span>
                <span className="font-semibold">{languageName(language.code)}</span>
                {" · "}
                {t(`languages.level.${language.level}`)}
                {language.cefr && ` · ${language.cefr}`}
              </span>
              <form action={removeLanguage}>
                <input type="hidden" name="code" value={language.code} />
                <Button type="submit" variant="tertiary" size="sm">
                  {t("delete")}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <Disclosure label={t("languages.add")}>
        <form action={addLanguage} className="grid gap-4 sm:grid-cols-3">
          <Select
            id="language-code"
            name="code"
            label={t("languages.language")}
            required
            placeholder={t("languages.language")}
            options={languageCodes
              .map((code) => ({ value: code, label: languageName(code) }))
              .sort((a, b) => a.label.localeCompare(b.label, "fr"))}
          />
          <Select
            id="language-level"
            name="level"
            label={t("languages.level.text")}
            defaultValue="professional"
            required
            options={languageLevels.map((level) => ({
              value: level,
              label: t(`languages.level.${level}`),
            }))}
          />
          <Select
            id="language-cefr"
            name="cefr"
            label={t("languages.cefr.text")}
            defaultValue=""
            options={[
              { value: "", label: "–" },
              ...cefrLevels.map((level) => ({ value: level, label: level })),
            ]}
          />
          <div className="sm:col-span-3">
            <Button type="submit">{t("add")}</Button>
          </div>
        </form>
      </Disclosure>
    </Section>
  );
}

async function Preferences({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  return (
    <Section
      id="preferences"
      title={t("preferences.title")}
      subtitle={t("preferences.subtitle")}
      notice={notice}
    >
      <form action={savePreferences} className="grid gap-5 sm:grid-cols-2">
        <Select
          id="availability"
          name="availability"
          label={t("availability.status.text")}
          defaultValue={profile.availability}
          required
          options={[
            { value: "open", label: t("availability.status.open") },
            { value: "listening", label: t("availability.status.listening") },
            { value: "not_looking", label: t("availability.status.notLooking") },
          ]}
        />
        <TextField
          id="availableFrom"
          name="availableFrom"
          type="date"
          label={t("availability.from")}
          hint={t("availability.immediate")}
          defaultValue={profile.availableFrom?.toISOString().slice(0, 10) ?? ""}
        />
        <TextField
          id="notice"
          name="notice"
          label={t("availability.notice.text")}
          placeholder={t("availability.notice.placeholder")}
          defaultValue={profile.notice ?? ""}
        />
        <TextField
          id="desiredJobTitles"
          name="desiredJobTitles"
          label={t("preferences.jobTitles.text")}
          placeholder={t("preferences.jobTitles.placeholder")}
          defaultValue={profile.desiredJobTitles.join(", ")}
        />
        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="mb-2 text-label">{t("preferences.contract.text")}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {contractPreferences.map((contract) => (
              <Checkbox
                key={contract}
                id={`contract-${contract}`}
                name="contracts"
                value={contract}
                defaultChecked={profile.desiredContracts.includes(contract)}
                label={t(`preferences.contract.${contract}`)}
              />
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="mb-2 text-label">{t("preferences.remote.text")}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(["onsite", "hybrid", "remote"] as const).map((mode) => (
              <Checkbox
                key={mode}
                id={`remote-${mode}`}
                name="remote"
                value={mode}
                defaultChecked={profile.remotePreferences.includes(mode)}
                label={t(`preferences.remote.${mode}`)}
              />
            ))}
          </div>
        </fieldset>
        <TextField
          id="desiredLocations"
          name="desiredLocations"
          label={t("preferences.location.text")}
          placeholder={t("preferences.location.placeholder")}
          defaultValue={profile.desiredLocations.join(", ")}
        />
        <Checkbox
          id="relocation"
          name="relocation"
          value="on"
          defaultChecked={profile.relocation}
          label={t("preferences.relocation")}
          className="self-end"
        />
        <TextField
          id="salaryMin"
          name="salaryMin"
          type="number"
          inputMode="numeric"
          min={0}
          label={t("preferences.salary.text")}
          hint={t("preferences.salary.hint")}
          defaultValue={profile.salaryMin?.toString() ?? ""}
        />
        <Select
          id="salaryPeriod"
          name="salaryPeriod"
          label={t("preferences.salary.period.text")}
          defaultValue={profile.salaryPeriod}
          options={[
            { value: "month", label: t("preferences.salary.period.month") },
            { value: "year", label: t("preferences.salary.period.year") },
          ]}
        />
        <div className="sm:col-span-2">
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Section>
  );
}

async function Visibility({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  return (
    <Section
      id="visibilite"
      title={t("visibility.title")}
      subtitle={t("visibility.subtitle")}
      notice={notice}
    >
      <form action={saveVisibility} className="flex flex-col gap-4">
        <RadioGroup
          legend={t("visibility.title")}
          name="visibility"
          defaultValue={profile.visibility}
          options={(["private", "recruiters", "anonymous"] as const).map((value) => ({
            value,
            label: t(`visibility.${value}.text`),
            hint: t(`visibility.${value}.desc`),
          }))}
        />
        <p className="text-sm text-ardoise">{t("visibility.always")}</p>
        <div>
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Section>
  );
}
