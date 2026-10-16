import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader, adminCard, adminLabel, adminTitle } from "@/components/admin/kit";
import { Icon } from "@/components/brand/icon";
import { Character } from "@/components/brand/character";
import { Alert, Button, Checkbox, Select, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import {
  createCourseFromTemplateAction,
  duplicateCourseAction,
} from "@/server/actions/course-admin";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  catalogLevelOptions,
  courseTemplateStructure,
  courseTemplates,
  listCoursesForAdmin,
  type CourseTemplate,
} from "@/server/services/course-admin";

/**
 * « Nouvelle formation » of the Studio (Admin v3, étape 3): the first fields and a starting
 * template drawn as a small program; or a copy of an existing course. Content editors and
 * administrators. Plain forms: works without JavaScript.
 */
export default async function NewCourse({ searchParams }: PageProps<"/admin/formations/nouvelle">) {
  const params = await searchParams;
  if (!(await requireCourseEditor())) notFound();
  const [t, levels, courses] = await Promise.all([
    getTranslations("admin.courses"),
    getTranslations("trainings.filters.level"),
    listCoursesForAdmin(db),
  ]);
  const themes = [...new Set(courses.map((course) => course.category).filter(Boolean))].sort();

  return (
    <>
      <AdminPageHeader
        title={t("v3.create.title")}
        eyebrow={t("v3.eyebrow")}
        subtitle={t("v3.create.subtitle")}
      />
      <Link
        href="/admin/formations"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold underline underline-offset-2"
      >
        <Icon name="chev-l" className="size-3.5" />
        {t("back")}
      </Link>
      {params.erreur === "champs" && <Alert tone="error" title={t("v3.create.invalid")} />}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form
          action={createCourseFromTemplateAction}
          className={cx(adminCard, "flex flex-col gap-5")}
        >
          <section aria-labelledby="course-new-basics" className="flex flex-col gap-3.5">
            <h2 id="course-new-basics" className={adminTitle}>
              {t("v3.create.basics")}
            </h2>
            <TextField
              id="course-new-title"
              name="title"
              label={t("create.label")}
              minLength={3}
              maxLength={160}
              required
            />
            <div className="grid gap-3.5 sm:grid-cols-3">
              <TextField
                id="course-new-theme"
                name="category"
                label={t("field.theme")}
                maxLength={80}
                list="course-new-themes"
                hint={t("v3.create.themeHint")}
              />
              <datalist id="course-new-themes">
                {themes.map((theme) => (
                  <option key={theme} value={theme} />
                ))}
              </datalist>
              <Select
                id="course-new-level"
                name="level"
                label={t("field.level")}
                defaultValue="beginner"
                options={(["beginner", "intermediate", "advanced"] as const).map((level) => ({
                  value: level,
                  label: levels(level),
                }))}
              />
              <TextField
                id="course-new-language"
                name="language"
                label={t("field.language")}
                hint={t("field.languageHint")}
                defaultValue="fr"
                minLength={2}
                maxLength={8}
                required
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
                    id={`course-new-required-${level}`}
                    type="radio"
                    name="requiredLevel"
                    value={level}
                    required
                    label={t(`field.catalogLevel.${level}`)}
                    defaultChecked={level === "free"}
                    className="[&_label]:text-[13px]"
                  />
                ))}
              </div>
            </fieldset>
          </section>

          <fieldset className="flex flex-col gap-3">
            <legend className={cx(adminTitle, "mb-1")}>{t("v3.create.template")}</legend>
            <p className="-mt-1 text-[12.5px] leading-[18px] text-ardoise">
              {t("v3.create.templateHint")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {courseTemplates.map((template) => (
                <TemplateCard key={template} template={template} />
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" icon={<Icon name="plus" />}>
              {t("v3.create.submit")}
            </Button>
            <p className="text-[11.5px] leading-4 text-ardoise">{t("v3.create.draftNote")}</p>
          </div>
        </form>

        <div className="flex flex-col gap-4">
          {courses.length > 0 && (
            <form
              action={duplicateCourseAction}
              className={cx(adminCard, "flex flex-col gap-3.5")}
              aria-labelledby="course-new-copy-title"
            >
              <h2 id="course-new-copy-title" className={adminTitle}>
                {t("v3.create.copyTitle")}
              </h2>
              <p className="text-[12.5px] leading-[18px] text-ardoise">{t("v3.create.copyText")}</p>
              <Select
                id="course-new-copy-source"
                name="course"
                label={t("v3.create.copySource")}
                options={courses.map((course) => ({ value: course.id, label: course.title }))}
              />
              <TextField
                id="course-new-copy-name"
                name="title"
                label={t("v3.create.copyName")}
                maxLength={160}
              />
              <Button type="submit" variant="secondary" icon={<Icon name="doc" />}>
                {t("v3.create.copySubmit")}
              </Button>
            </form>
          )}
          <aside
            aria-label={t("v3.create.tipsTitle")}
            className="jm-admin-card flex items-end gap-3 overflow-hidden rounded-[24px] bg-sapin px-5 pt-5 text-blanc"
          >
            <div className="flex flex-1 flex-col gap-2 pb-5">
              <p className={cx(adminLabel, "text-neon")}>{t("v3.create.tipsTitle")}</p>
              <ul className="flex flex-col gap-1.5 text-[12.5px] leading-[18px] text-blanc/85">
                {(["one", "two", "three"] as const).map((key) => (
                  <li key={key} className="flex gap-2">
                    <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-lime" />
                    {t(`v3.create.tips.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
            <span className="shrink-0 max-sm:hidden">
              <Character name="fatou" pose="montre" height={150} />
            </span>
          </aside>
        </div>
      </div>
    </>
  );
}

/** One starting template: its name, what it is for, and its program drawn as blocks. */
async function TemplateCard({ template }: { template: CourseTemplate }) {
  const t = await getTranslations("admin.courses.v3.template");
  const structure = courseTemplateStructure[template];
  const lessons = structure.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const id = `course-new-template-${template}`;
  return (
    <label
      htmlFor={id}
      className="group relative flex cursor-pointer flex-col gap-3 rounded-[20px] bg-creme/70 p-4 ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40 has-[:checked]:bg-lime-clair has-[:checked]:ring-2 has-[:checked]:ring-sapin has-[:focus-visible]:shadow-[0_0_0_4px_rgb(166_242_107/0.55)]"
    >
      <input
        id={id}
        type="radio"
        name="template"
        value={template}
        defaultChecked={template === "short"}
        required
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="absolute top-3.5 right-3.5 grid size-6 place-items-center rounded-full bg-blanc ring-[1.5px] ring-brume group-has-[:checked]:bg-sapin group-has-[:checked]:text-lime group-has-[:checked]:ring-sapin"
      >
        <Icon name="check" className="size-3.5 opacity-0 group-has-[:checked]:opacity-100" />
      </span>
      {/* The program, drawn: one row per module, one block per lesson. */}
      <span aria-hidden className="flex min-h-[64px] flex-col justify-center gap-1.5 pr-8">
        {structure.modules.length === 0 ? (
          <span className="h-5 w-32 rounded-[6px] border-[1.5px] border-dashed border-ardoise/40" />
        ) : (
          structure.modules.map((module, index) => (
            <span key={index} className="flex items-center gap-1">
              <span
                className={cx("h-3.5 w-2 rounded-[3px]", module.final ? "bg-ambre" : "bg-sapin")}
              />
              {module.lessons.map((lesson, position) => (
                <span
                  key={position}
                  className={cx(
                    "h-3.5 rounded-[4px]",
                    lesson.kind === "quiz"
                      ? "w-5 bg-menthe"
                      : lesson.kind === "video"
                        ? "w-8 bg-lime"
                        : lesson.kind === "exercise"
                          ? "w-8 bg-neon"
                          : "w-8 bg-brume",
                  )}
                />
              ))}
            </span>
          ))
        )}
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-[15px] leading-5 font-semibold">{t(`${template}.name`)}</span>
        <span className="text-[12.5px] leading-[18px] text-ardoise">{t(`${template}.text`)}</span>
      </span>
      <span className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
        <span className="rounded-pill bg-blanc px-2.5 py-1">
          {t("summary", { modules: structure.modules.length, lessons })}
        </span>
        <span className="rounded-pill bg-blanc px-2.5 py-1">
          {t(structure.certificate ? "withCertificate" : "withoutCertificate")}
        </span>
      </span>
    </label>
  );
}
