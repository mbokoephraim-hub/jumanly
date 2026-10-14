import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Alert, Badge, Button, TextField } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { createCourseAction } from "@/server/actions/course-admin";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import { listCoursesForAdmin } from "@/server/services/course-admin";

const statusTones = {
  draft: "neutral",
  review: "warning",
  published: "success",
  archived: "neutral",
} as const;

/** Courses of the Learn catalog (partie 07 § 12): content editors and administrators. */
export default async function AdminCourses({ searchParams }: PageProps<"/admin/formations">) {
  const params = await searchParams;
  if (!(await requireCourseEditor())) notFound();
  const t = await getTranslations("admin.courses");
  const learn = await getTranslations("learn.card");
  const courses = await listCoursesForAdmin(db);

  return (
    <>
      <h1 className="text-h1">{t("title")}</h1>
      <p className="text-[15px] text-ardoise">{t("editorOnly")}</p>
      {params.erreur === "titre" && <Alert tone="error" title={t("create.invalid")} />}
      <form
        action={createCourseAction}
        className="flex flex-col gap-3 rounded-card bg-blanc p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <TextField
            id="course-new-title"
            name="title"
            label={t("create.label")}
            minLength={3}
            maxLength={160}
            required
          />
        </div>
        <Button type="submit">{t("create.submit")}</Button>
      </form>
      {courses.length === 0 ? (
        <p className="rounded-card bg-blanc p-5">{t("list.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-card bg-blanc">
          <table className="w-full min-w-[640px] text-left text-[15px]">
            <thead className="border-b border-brume text-sm text-ardoise">
              <tr>
                <th scope="col" className="p-4">
                  {t("col.title")}
                </th>
                <th scope="col" className="p-4">
                  {t("col.status")}
                </th>
                <th scope="col" className="p-4">
                  {t("col.access")}
                </th>
                <th scope="col" className="p-4">
                  {t("col.lessons")}
                </th>
                <th scope="col" className="p-4">
                  {t("col.learners")}
                </th>
                <th scope="col" className="p-4">
                  {t("col.updated")}
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b border-brume last:border-0">
                  <td className="p-4 font-semibold">
                    <Link
                      href={`/admin/formations/${course.id}`}
                      className="underline underline-offset-4"
                    >
                      {course.title}
                    </Link>
                  </td>
                  <td className="p-4">
                    <Badge tone={statusTones[course.status]}>{t(`status.${course.status}`)}</Badge>
                  </td>
                  <td className="p-4">
                    {course.requiredLevel === "specialized"
                      ? t("field.specialized")
                      : t(`field.catalogLevel.${course.requiredLevel}`)}
                  </td>
                  <td className="p-4">
                    {learn("lessons", {
                      count: course.modules.reduce((sum, module) => sum + module._count.lessons, 0),
                    })}
                  </td>
                  <td className="p-4">{course.enrollmentCount}</td>
                  <td className="p-4">{formatDate(course.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
