import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader, adminCard, adminLabel } from "@/components/admin/kit";
import { Icon, type IconName } from "@/components/brand/icon";
import { Alert, Button, Checkbox, Select, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { createVideoCourseAction } from "@/server/actions/course-admin";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import { catalogLevelOptions, listCoursesForAdmin } from "@/server/services/course-admin";

/** The fields of the quick form an error can point to, in the order of the form. */
const errorFields = ["video", "title", "summary", "instructor", "durationMinutes"] as const;

/** Writing fields: bigger text and line spacing, growing with what is written. */
const roomy = "text-[15px] leading-[1.65] [field-sizing:content]";

/**
 * « Publier une vidéo » (28/10/2026): the short path of the Studio for one video. The YouTube
 * link, a title and a few words in one form; the course is created and published at once (or
 * kept as a draft), with the video's picture as its cover. Everything else stays editable in the
 * course editor. Plain form: works without JavaScript.
 */
export default async function QuickVideo({ searchParams }: PageProps<"/admin/formations/video">) {
  const params = await searchParams;
  const user = await requireCourseEditor();
  if (!user) notFound();
  const [t, courses] = await Promise.all([
    getTranslations("admin.courses"),
    listCoursesForAdmin(db),
  ]);
  const themes = [...new Set(courses.map((course) => course.category).filter(Boolean))].sort();
  const errors = typeof params.erreur === "string" ? params.erreur.split(",") : [];
  const wrong = errorFields.filter((field) => errors.includes(field));
  const steps: { icon: IconName; key: "link" | "words" | "publish" }[] = [
    { icon: "lien", key: "link" },
    { icon: "edit", key: "words" },
    { icon: "partager", key: "publish" },
  ];

  return (
    <>
      <AdminPageHeader
        title={t("quick.title")}
        eyebrow={t("v3.eyebrow")}
        subtitle={t("quick.subtitle")}
      />
      <Link
        href="/admin/formations"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold underline underline-offset-2"
      >
        <Icon name="chev-l" className="size-3.5" />
        {t("back")}
      </Link>
      {wrong.length > 0 && (
        <Alert tone="error" title={t("quick.invalid")}>
          <ul className="list-disc pl-5">
            {wrong.map((field) => (
              <li key={field}>{t(`quick.error.${field}`)}</li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form
          action={createVideoCourseAction}
          className={cx(adminCard, "flex flex-col gap-5 lg:p-7")}
        >
          <TextField
            id="video-link"
            name="video"
            inputMode="url"
            icon="video"
            label={t("quick.link")}
            hint={t("quick.linkHint")}
            placeholder="https://www.youtube.com/watch?v=…"
            maxLength={300}
            required
            className="text-[15px]"
          />
          <TextField
            id="video-title"
            name="title"
            label={t("quick.name")}
            minLength={3}
            maxLength={160}
            required
            className="text-[15px]"
          />
          <TextArea
            id="video-summary"
            name="summary"
            label={t("quick.summary")}
            hint={t("quick.summaryHint")}
            minLength={10}
            maxLength={300}
            rows={3}
            required
            className={roomy}
          />
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-[1.3fr_0.7fr_1fr]">
            <TextField
              id="video-instructor"
              name="instructor"
              icon="profil"
              label={t("field.instructor")}
              defaultValue={user.name}
              minLength={2}
              maxLength={120}
              required
            />
            <TextField
              id="video-duration"
              name="durationMinutes"
              type="number"
              min={1}
              max={600}
              icon="horloge"
              label={t("quick.duration")}
              defaultValue="10"
              required
            />
            <TextField
              id="video-theme"
              name="category"
              label={t("field.theme")}
              list="video-themes"
              maxLength={80}
            />
            <datalist id="video-themes">
              {themes.map((theme) => (
                <option key={theme} value={theme} />
              ))}
            </datalist>
          </div>
          <Select
            id="video-access"
            name="requiredLevel"
            label={t("field.catalogLevel.text")}
            defaultValue="free"
            options={catalogLevelOptions.map((level) => ({
              value: level,
              label: t(`field.catalogLevel.${level}`),
            }))}
          />

          <details className="group rounded-[18px] bg-creme/60 ring-1 ring-brume/60 ring-inset">
            <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3.5 text-[13.5px] font-semibold [&::-webkit-details-marker]:hidden">
              <Icon name="plus" className="size-4 group-open:hidden" />
              <Icon name="chev-d" className="hidden size-4 group-open:block" />
              {t("quick.more")}
            </summary>
            <div className="flex flex-col gap-4 px-4 pb-4">
              <TextArea
                id="video-description"
                name="description"
                label={t("field.description")}
                hint={t("quick.descriptionHint")}
                maxLength={5000}
                rows={8}
                className={cx(roomy, "min-h-48")}
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="video-cover" className="text-[13px] font-semibold">
                  {t("v2.cover.file")}
                </label>
                <input
                  id="video-cover"
                  name="cover"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  aria-describedby="video-cover-hint"
                  className="text-[13px] file:mr-3 file:h-9 file:rounded-pill file:border-0 file:bg-blanc file:px-4 file:font-semibold"
                />
                <p id="video-cover-hint" className="text-[11.5px] leading-4 text-ardoise">
                  {t("quick.coverHint")}
                </p>
              </div>
            </div>
          </details>

          <div className="flex flex-col gap-3 border-t border-brume/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Checkbox
              id="video-publish"
              name="publish"
              defaultChecked
              label={t("quick.publishNow")}
              hint={t("quick.publishNowHint")}
            />
            <Button type="submit" icon={<Icon name="play" />} className="w-full sm:w-fit">
              {t("quick.submit")}
            </Button>
          </div>
        </form>

        <aside aria-label={t("quick.howTitle")} className={cx(adminCard, "flex flex-col gap-4")}>
          <p className={adminLabel}>{t("quick.howTitle")}</p>
          <ol className="flex flex-col gap-3.5">
            {steps.map((step) => (
              <li key={step.key} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-lime-clair text-sapin"
                >
                  <Icon name={step.icon} className="size-[18px]" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13.5px] leading-[18px] font-semibold">
                    {t(`quick.how.${step.key}.title`)}
                  </span>
                  <span className="text-[12px] leading-[17px] text-ardoise">
                    {t(`quick.how.${step.key}.text`)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <Link
            href="/admin/formations/nouvelle"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold underline underline-offset-4"
          >
            {t("quick.fullCourse")}
            <Icon name="chev-r" className="size-3.5" />
          </Link>
        </aside>
      </div>
    </>
  );
}
