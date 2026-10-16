import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader, adminCard } from "@/components/admin/kit";
import { Icon } from "@/components/brand/icon";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  IconButton,
  Select,
  TextArea,
  TextField,
} from "@/components/ui";
import {
  addPathCourseAction,
  movePathCourseAction,
  removePathCourseAction,
  setPathStatusAction,
  updatePathAction,
} from "@/server/actions/learn-paths";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import { editorialLines, listDomains } from "@/server/services/learn-domains";
import {
  PATH_MIN_COURSES,
  getPathForAdmin,
  pathPublishProblems,
} from "@/server/services/learn-paths";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.courses.paths");
  return { title: t("title"), robots: { index: false } };
}

const okKeys = ["created", "saved", "course", "published", "draft", "archived"] as const;
const errorKeys = ["infos", "already", "full", "notFound", "publication"] as const;

/**
 * One learning path in the admin (Learn v2, étape 2): its information, its courses in order (add,
 * move, remove) and its publication. Publishing needs a summary and two published courses.
 */
export default async function AdminPath({
  params,
  searchParams,
}: PageProps<"/admin/formations/parcours/[id]">) {
  if (!(await requireCourseEditor())) notFound();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const path = await getPathForAdmin(db, id);
  if (!path) notFound();
  const t = await getTranslations();
  const [domains, candidates] = await Promise.all([
    listDomains(db),
    db.course.findMany({
      where: {
        status: { not: "archived" },
        id: { notIn: path.courses.map((item) => item.course.id) },
      },
      orderBy: { title: "asc" },
      select: { id: true, title: true, status: true },
    }),
  ]);
  const problems = pathPublishProblems(path);
  const ok = okKeys.find((key) => key === query.ok);
  const error = errorKeys.find((key) => key === query.erreur);
  const hidden = <input type="hidden" name="id" value={path.id} />;

  return (
    <>
      <AdminPageHeader
        title={path.title}
        eyebrow={t("admin.courses.paths.eyebrow")}
        action={
          <ButtonLink
            href="/admin/formations/parcours"
            variant="secondary"
            icon={<Icon name="chev-l" />}
            size="sm"
          >
            {t("admin.courses.paths.all")}
          </ButtonLink>
        }
      />
      {ok && <Alert tone="success" title={t(`admin.courses.paths.ok.${ok}`)} />}
      {error && <Alert tone="error" title={t(`admin.courses.paths.error.${error}`)} />}

      <section id="infos" aria-labelledby="path-info" className={`${adminCard} scroll-mt-24`}>
        <h2 id="path-info" className="mb-4 text-[18px] font-semibold">
          {t("admin.courses.paths.info.title")}
        </h2>
        <form action={updatePathAction} className="flex flex-col gap-3">
          {hidden}
          <TextField
            id="path-title"
            name="title"
            label={t("admin.courses.paths.field.title")}
            defaultValue={path.title}
            required
            minLength={3}
            maxLength={120}
          />
          <TextArea
            id="path-summary"
            name="summary"
            label={t("admin.courses.paths.field.summary")}
            hint={t("admin.courses.paths.field.summaryHint")}
            defaultValue={path.summary}
            maxLength={600}
            rows={3}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              id="path-domain"
              name="domainId"
              label={t("admin.courses.field.domain")}
              defaultValue={path.domainId ?? ""}
              placeholder={t("admin.courses.field.domainNone")}
              options={domains.map((domain) => ({ value: domain.id, label: domain.name }))}
            />
            <Select
              id="path-editorial"
              name="editorialLine"
              label={t("admin.courses.field.editorial")}
              defaultValue={path.editorialLine}
              options={editorialLines.map((line) => ({
                value: line,
                label: t(`learn.editorial.${line}`),
              }))}
            />
          </div>
          <Button type="submit" variant="secondary" className="w-full sm:w-fit">
            {t("admin.courses.paths.save")}
          </Button>
        </form>
      </section>

      <section
        id="formations"
        aria-labelledby="path-courses"
        className={`${adminCard} scroll-mt-24`}
      >
        <h2 id="path-courses" className="text-[18px] font-semibold">
          {t("admin.courses.paths.list.title")}
        </h2>
        <p className="mb-4 text-[13px] text-ardoise">{t("admin.courses.paths.list.hint")}</p>
        {path.courses.length === 0 ? (
          <p className="mb-4 text-[14px]">{t("admin.courses.paths.list.empty")}</p>
        ) : (
          <ol className="mb-4 flex flex-col divide-y divide-brume">
            {path.courses.map(({ course }, index) => (
              <li key={course.id} className="flex flex-wrap items-center gap-3 py-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime text-[14px] font-bold"
                >
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Link
                    href={`/admin/formations/${course.id}`}
                    className="text-[14.5px] font-semibold hover:underline"
                  >
                    {course.title}
                  </Link>
                  {course.status !== "published" && (
                    <span className="text-[12.5px] text-ambre-texte">
                      {t("admin.courses.paths.list.notPublished", {
                        status: t(`admin.courses.status.${course.status}`).toLowerCase(),
                      })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <form action={movePathCourseAction}>
                    {hidden}
                    <input type="hidden" name="course" value={course.id} />
                    <input type="hidden" name="direction" value="up" />
                    <IconButton
                      type="submit"
                      variant="outline"
                      disabled={index === 0}
                      label={t("admin.courses.paths.list.up", { title: course.title })}
                    >
                      <Icon name="chev-d" className="rotate-180" />
                    </IconButton>
                  </form>
                  <form action={movePathCourseAction}>
                    {hidden}
                    <input type="hidden" name="course" value={course.id} />
                    <input type="hidden" name="direction" value="down" />
                    <IconButton
                      type="submit"
                      variant="outline"
                      disabled={index === path.courses.length - 1}
                      label={t("admin.courses.paths.list.down", { title: course.title })}
                    >
                      <Icon name="chev-d" />
                    </IconButton>
                  </form>
                  <form action={removePathCourseAction}>
                    {hidden}
                    <input type="hidden" name="course" value={course.id} />
                    <IconButton
                      type="submit"
                      variant="outline"
                      label={t("admin.courses.paths.list.remove", { title: course.title })}
                    >
                      <Icon name="fermer" />
                    </IconButton>
                  </form>
                </div>
              </li>
            ))}
          </ol>
        )}
        {candidates.length > 0 && (
          <form
            action={addPathCourseAction}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            {hidden}
            <div className="min-w-0 flex-1">
              <Select
                id="path-add-course"
                name="course"
                label={t("admin.courses.paths.list.add")}
                placeholder={t("admin.courses.paths.list.choose")}
                required
                options={candidates.map((course) => ({
                  value: course.id,
                  label:
                    course.status === "published"
                      ? course.title
                      : `${course.title} (${t(`admin.courses.status.${course.status}`).toLowerCase()})`,
                }))}
              />
            </div>
            <Button type="submit" icon={<Icon name="plus" />} className="w-full sm:w-fit">
              {t("admin.courses.paths.list.addSubmit")}
            </Button>
          </form>
        )}
      </section>

      <section
        id="publication"
        aria-labelledby="path-status"
        className={`${adminCard} scroll-mt-24`}
      >
        <h2 id="path-status" className="mb-3 text-[18px] font-semibold">
          {t("admin.courses.paths.publication.title")}
        </h2>
        <p className="mb-3 flex items-center gap-2 text-[14px]">
          {t("admin.courses.paths.publication.current")}
          <Badge tone={path.status === "published" ? "success" : "neutral"}>
            {t(`admin.courses.paths.status.${path.status}`)}
          </Badge>
        </p>
        {path.status !== "published" && problems.length > 0 && (
          <div className="mb-3 text-[13.5px]">
            <p className="font-semibold">{t("admin.courses.paths.publication.problems")}</p>
            <ul className="list-disc pl-5 text-ardoise">
              {problems.map((problem) => (
                <li key={problem}>
                  {t(`admin.courses.paths.problem.${problem}`, { count: PATH_MIN_COURSES })}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {path.status !== "published" && (
            <form action={setPathStatusAction}>
              {hidden}
              <input type="hidden" name="status" value="published" />
              <Button
                type="submit"
                icon={<Icon name="valider" />}
                disabled={problems.length > 0}
                className="w-full sm:w-fit"
              >
                {t("admin.courses.paths.publication.publish")}
              </Button>
            </form>
          )}
          {path.status === "published" && (
            <>
              <ButtonLink
                href={`/app/learn/parcours/${path.slug}`}
                variant="secondary"
                icon={<Icon name="eye" />}
              >
                {t("admin.courses.paths.publication.view")}
              </ButtonLink>
              <form action={setPathStatusAction}>
                {hidden}
                <input type="hidden" name="status" value="draft" />
                <Button type="submit" variant="tertiary" className="w-full sm:w-fit">
                  {t("admin.courses.paths.publication.draft")}
                </Button>
              </form>
            </>
          )}
          {path.status !== "archived" && (
            <form action={setPathStatusAction}>
              {hidden}
              <input type="hidden" name="status" value="archived" />
              <Button type="submit" variant="tertiary" className="w-full sm:w-fit">
                {t("admin.courses.paths.publication.archive")}
              </Button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
