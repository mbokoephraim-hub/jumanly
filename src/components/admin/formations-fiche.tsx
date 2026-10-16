import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Tag, adminCard } from "@/components/admin/kit";
import { courseStatusTone } from "@/components/admin/formations-list";
import { Icon } from "@/components/brand/icon";
import { Button, Checkbox, Select, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { updateCourseAction } from "@/server/actions/course-admin";
import { catalogLevelOptions, type AdminCourse } from "@/server/services/course-admin";
import { coverAt } from "@/server/services/course-media";

/** Id of the course form: the attestation switch, in its own card, belongs to it. */
export const courseFormId = "admin-course-fiche";

/** Read-only switch (44 × 26, Sapin with a Lime knob when on), for a value computed elsewhere. */
export function SwitchMark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        "relative inline-block h-[26px] w-11 shrink-0 rounded-pill",
        on ? "bg-sapin" : "bg-brume",
      )}
    >
      <span
        className={cx(
          "absolute top-[3px] size-5 rounded-full",
          on ? "right-[3px] bg-lime" : "left-[3px] bg-blanc",
        )}
      />
    </span>
  );
}

/** The fields of the course form, by editor step; the others travel as hidden fields. */
const fieldsOf = {
  informations: [
    "title",
    "slug",
    "summary",
    "category",
    "level",
    "language",
    "instructor",
    "requiredLevel",
  ],
  public: [
    "description",
    "objectives",
    "audience",
    "durationMinutes",
    "jobFamilies",
    "prerequisites",
    "skills",
  ],
  attestation: [],
} as const;
export type FicheStep = keyof typeof fieldsOf;

/** The saved value of every field of the course form, as the form sends it. */
function savedValues(course: AdminCourse): Record<string, string> {
  return {
    title: course.title,
    slug: course.slug,
    summary: course.summary,
    category: course.category,
    level: course.level,
    language: course.language,
    instructor: course.instructor ?? "",
    requiredLevel: course.requiredLevel,
    description: course.description,
    objectives: course.objectives.join("\n"),
    audience: course.audience,
    durationMinutes: String(course.durationMinutes),
    jobFamilies: course.jobFamilies.join(", "),
    prerequisites: course.prerequisites ?? "",
    skills: course.skills.map((item) => item.skill.name).join(", "),
  };
}

/**
 * The fields the current step does not show, saved as they are (Admin v3, étape 4): the course
 * form is split across the editor steps, and each step sends the whole course.
 */
function HiddenFields({ course, step }: { course: AdminCourse; step: FicheStep }) {
  const shown: readonly string[] = fieldsOf[step];
  return (
    <>
      <input type="hidden" name="course" value={course.id} />
      <input type="hidden" name="etape" value={step} />
      <input type="hidden" name="coverUrl" value={course.coverUrl ?? ""} />
      {Object.entries(savedValues(course))
        .filter(([name]) => !shown.includes(name))
        .map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      {step !== "attestation" && course.certificateEnabled && (
        <input type="hidden" name="certificateEnabled" value="on" />
      )}
    </>
  );
}

/**
 * The course form of the « Attestation » step: no visible field, the switch of the attestation
 * card belongs to it (`form` attribute).
 */
export function CourseAttestationForm({ course }: { course: AdminCourse }) {
  return (
    <form id={courseFormId} action={updateCourseAction} hidden>
      <HiddenFields course={course} step="attestation" />
    </form>
  );
}

/**
 * The course card (mockup 07-06), split across two editor steps (Admin v3, étape 4).
 * « Informations »: title, status, the first fields, the catalog level, the indicators and the
 * cover. « Public et objectifs »: description, outcomes, audience, duration, job families,
 * prerequisites and the skills validated by the attestation. Saved by « Enregistrer la fiche ».
 */
export async function CourseFicheCard({
  course,
  step,
}: {
  course: AdminCourse;
  step: "informations" | "public";
}) {
  const t = await getTranslations("admin.courses");
  const levels = await getTranslations("trainings.filters.level");
  const lessons = course.modules.flatMap((module) => module.lessons);
  const indicators = [
    {
      key: "specialized",
      label: t("field.specialized"),
      on: course.requiredLevel === "specialized",
    },
    { key: "jobSpecific", label: t("field.jobSpecific"), on: lessons.some((l) => l.jobSpecific) },
    { key: "preview", label: t("field.previewLesson"), on: lessons[0]?.isPreview ?? false },
  ];
  return (
    <section
      id="fiche"
      aria-labelledby="fiche-title"
      className={cx(adminCard, "jm-admin-fiche flex scroll-mt-6 flex-col gap-3.5")}
    >
      <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2
            id="fiche-title"
            className="text-[18px] leading-6 font-semibold tracking-[-0.015em] lg:text-[20px] lg:leading-[26px]"
          >
            {course.title}
          </h2>
          <Tag tone={courseStatusTone[course.status]}>{t(`status.${course.status}`)}</Tag>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] leading-[15px] text-ardoise">
          <span>{t("updatedAt", { date: formatDate(course.updatedAt) })}</span>
          {course.status === "published" && (
            <Link
              href={`/formations/${course.slug}`}
              className="inline-flex items-center gap-1 font-semibold text-sapin underline underline-offset-4"
            >
              {t("viewPublic")}
              <Icon name="suivant" className="size-3.5" />
            </Link>
          )}
        </div>
      </div>
      <form id={courseFormId} action={updateCourseAction} className="flex flex-col gap-3.5">
        <HiddenFields course={course} step={step} />
        {step === "informations" ? (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <TextField
                id="course-title"
                name="title"
                label={t("field.title")}
                defaultValue={course.title}
                required
                minLength={3}
                maxLength={160}
              />
              <TextField
                id="course-slug"
                name="slug"
                icon="lien"
                label={t("field.slug")}
                hint={t("field.slugHint")}
                defaultValue={course.slug}
                maxLength={80}
              />
            </div>
            <TextField
              id="course-summary"
              name="summary"
              label={t("field.summary")}
              defaultValue={course.summary}
              maxLength={300}
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_0.85fr_0.85fr]">
              <TextField
                id="course-category"
                name="category"
                label={t("field.theme")}
                defaultValue={course.category}
                maxLength={80}
              />
              <Select
                id="course-level"
                name="level"
                label={t("field.level")}
                defaultValue={course.level}
                options={(["beginner", "intermediate", "advanced"] as const).map((level) => ({
                  value: level,
                  label: levels(level),
                }))}
              />
              <TextField
                id="course-language"
                name="language"
                label={t("field.language")}
                hint={t("field.languageHint")}
                defaultValue={course.language}
                required
                maxLength={8}
              />
              <TextField
                id="course-instructor"
                name="instructor"
                icon="profil"
                label={t("field.instructor")}
                defaultValue={course.instructor ?? ""}
                maxLength={120}
              />
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[13px] leading-[18px] font-semibold">
                {t("field.catalogLevel.text")}
              </legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {catalogLevelOptions.map((level) => (
                  <Checkbox
                    key={level}
                    id={`course-required-level-${level}`}
                    type="radio"
                    name="requiredLevel"
                    value={level}
                    required
                    label={t(`field.catalogLevel.${level}`)}
                    defaultChecked={course.requiredLevel === level}
                    className="[&_label]:text-[13px]"
                  />
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <ul className="flex flex-col gap-2.5 lg:flex-row lg:flex-wrap lg:gap-5">
                {indicators.map((item) => (
                  <li key={item.key} className="flex items-center gap-2.5 text-[13px] font-medium">
                    <SwitchMark on={item.on} />
                    {item.label}
                    <span className="sr-only">
                      {item.on ? t("indicator.on") : t("indicator.off")}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] leading-[15px] text-ardoise">{t("indicators")}</p>
            </div>
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2 text-[13px] leading-[18px] font-semibold">
                {t("field.cover")}
              </legend>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                {course.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- already resized WebP
                  <img
                    src={
                      course.coverUrl.startsWith("/medias/")
                        ? coverAt(course.coverUrl, 480)
                        : course.coverUrl
                    }
                    alt={t("v2.cover.current")}
                    width={240}
                    height={135}
                    className="aspect-video w-full max-w-[240px] rounded-[14px] bg-creme object-cover"
                  />
                ) : (
                  <p className="grid aspect-video w-full max-w-[240px] place-items-center rounded-[14px] bg-creme px-4 text-center text-[12px] text-ardoise">
                    {t("v2.cover.none")}
                  </p>
                )}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="course-cover-file" className="text-[13px] font-semibold">
                    {t("v2.cover.file")}
                  </label>
                  <input
                    id="course-cover-file"
                    name="cover"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    aria-describedby="course-cover-file-hint"
                    className="text-[13px] file:mr-3 file:h-9 file:rounded-pill file:border-0 file:bg-creme file:px-4 file:font-semibold"
                  />
                  <p id="course-cover-file-hint" className="text-[11.5px] leading-4 text-ardoise">
                    {t("v2.cover.hint")}
                  </p>
                </div>
              </div>
            </fieldset>
          </>
        ) : (
          <>
            <div className="grid items-start gap-3 md:grid-cols-2">
              <TextArea
                id="course-description"
                name="description"
                label={t("field.description")}
                defaultValue={course.description}
                maxLength={5000}
                rows={3}
              />
              <TextArea
                id="course-objectives"
                name="objectives"
                label={t("field.outcomes")}
                hint={t("field.outcomesHint")}
                defaultValue={course.objectives.join("\n")}
                maxLength={3000}
                rows={3}
              />
              <TextField
                id="course-audience"
                name="audience"
                label={t("field.audience")}
                defaultValue={course.audience}
                maxLength={500}
              />
              <TextField
                id="course-duration"
                name="durationMinutes"
                type="number"
                min={1}
                label={t("field.duration")}
                defaultValue={String(course.durationMinutes)}
                required
              />
              <TextField
                id="course-job-families"
                name="jobFamilies"
                label={t("field.jobFamilies.text")}
                hint={t("field.jobFamilies.hint")}
                defaultValue={course.jobFamilies.join(", ")}
                maxLength={500}
              />
              <TextArea
                id="course-prerequisites"
                name="prerequisites"
                label={t("field.prerequisites")}
                defaultValue={course.prerequisites ?? ""}
                maxLength={1000}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-2">
              {course.skills.length > 0 && (
                <ul className="flex flex-wrap gap-1.5" aria-label={t("field.skills.text")}>
                  {course.skills.map((item) => (
                    <li
                      key={item.skillId}
                      className="inline-flex h-[30px] items-center rounded-pill bg-blanc px-3.5 text-[12.5px] font-medium ring-[1.5px] ring-brume ring-inset"
                    >
                      {item.skill.name}
                    </li>
                  ))}
                </ul>
              )}
              <TextField
                id="course-skills"
                name="skills"
                label={t("field.skills.text")}
                hint={[t("field.skills.hint"), t("field.skillsFormat")].join(" ")}
                defaultValue={course.skills.map((item) => item.skill.name).join(", ")}
                maxLength={500}
              />
            </div>
          </>
        )}
        <Button type="submit" variant="secondary" className="self-start">
          {t("save")}
        </Button>
      </form>
    </section>
  );
}
