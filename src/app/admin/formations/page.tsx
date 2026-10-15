import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader, adminCard, adminTitle } from "@/components/admin/kit";
import {
  CourseFilterBar,
  CourseListCard,
  filterCourses,
  readCourseFilters,
} from "@/components/admin/formations-list";
import { Icon } from "@/components/brand/icon";
import { Alert, Button, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { createCourseAction } from "@/server/actions/course-admin";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import { listCoursesForAdmin } from "@/server/services/course-admin";

/**
 * Courses of the Learn catalog (partie 07 § 12, mockup 07-06): content editors and administrators.
 * The list with its filters, and the form « Nouvelle formation »; the editor opens on /[id].
 */
export default async function AdminCourses({ searchParams }: PageProps<"/admin/formations">) {
  const params = await searchParams;
  if (!(await requireCourseEditor())) notFound();
  const t = await getTranslations("admin.courses");
  const all = await listCoursesForAdmin(db);
  const filters = readCourseFilters(params);
  const courses = filterCourses(all, filters);

  return (
    <>
      <AdminPageHeader title={t("title")} />
      <CourseFilterBar
        base="/admin/formations"
        courses={all}
        filters={filters}
        shown={courses.length}
      />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <CourseListCard courses={courses} filters={filters} detailed />
        <div className="flex flex-col gap-4">
          <section
            aria-labelledby="admin-courses-new-title"
            className={cx(adminCard, "flex flex-col gap-3.5")}
          >
            <h2 id="admin-courses-new-title" className={adminTitle}>
              {t("new")}
            </h2>
            {params.erreur === "titre" && <Alert tone="error" title={t("create.invalid")} />}
            <form action={createCourseAction} className="flex flex-col gap-3">
              <TextField
                id="course-new-title"
                name="title"
                label={t("create.label")}
                minLength={3}
                maxLength={160}
                required
              />
              <Button type="submit" variant="secondary" icon={<Icon name="plus" />}>
                {t("create.submit")}
              </Button>
            </form>
            <p className="text-[11.5px] leading-4 text-ardoise">{t("editorOnly")}</p>
          </section>
          <p className="flex items-start gap-2.5 rounded-[16px] bg-brume/70 px-4 py-3 text-[11.5px] leading-4 max-lg:hidden">
            <Icon name="info" className="size-4 shrink-0" />
            {t("pick")}
          </p>
        </div>
      </div>
    </>
  );
}
