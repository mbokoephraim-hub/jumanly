import { getTranslations } from "next-intl/server";
import { SensitivePanel } from "@/components/admin/kit";
import { Button, ButtonLink, TextField } from "@/components/ui";
import { duplicateCourseAction } from "@/server/actions/course-admin";
import type { AdminCourse, EditorStep } from "@/server/services/course-admin";

/** « Dupliquer la formation » (`?action=dupliquer`): the title of the copy, then a draft. */
export async function DuplicateCoursePanel({
  course,
  step,
}: {
  course: AdminCourse;
  step: EditorStep;
}) {
  const [t, tc] = await Promise.all([getTranslations("admin.courses"), getTranslations("common")]);
  const base = `/admin/formations/${course.id}?etape=${step}`;
  return (
    <SensitivePanel
      title={t("v2.duplicate.title")}
      text={t("v2.duplicate.confirm", { title: course.title })}
      closeHref={`${base}#preparation`}
      icon="doc"
      tone="neutral"
    >
      <form action={duplicateCourseAction} className="flex flex-col gap-3.5">
        <input type="hidden" name="course" value={course.id} />
        <TextField
          id="course-copy-title"
          name="title"
          required
          minLength={3}
          maxLength={160}
          label={t("v2.duplicate.name")}
          defaultValue={t("v2.duplicate.defaultName", { title: course.title }).slice(0, 160)}
        />
        <div className="flex flex-wrap justify-end gap-2">
          <ButtonLink href={`${base}#preparation`} scroll={false} variant="tertiary">
            {tc("cancel")}
          </ButtonLink>
          <Button type="submit">{t("v2.duplicate.submit")}</Button>
        </div>
      </form>
    </SensitivePanel>
  );
}
