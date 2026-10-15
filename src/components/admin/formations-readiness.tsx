import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SensitivePanel, adminCard, adminTitle } from "@/components/admin/kit";
import { Icon } from "@/components/brand/icon";
import { Button, ButtonLink, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { duplicateCourseAction } from "@/server/actions/course-admin";
import {
  courseReadiness,
  type AdminCourse,
  type ReadinessStep,
} from "@/server/services/course-admin";

/** Where each step of the guided path is edited, in the editor page. */
const anchors: Record<ReadinessStep, string> = {
  info: "#fiche",
  audience: "#fiche",
  program: "#programme",
  quiz: "#programme",
  certificate: "#publication",
  publish: "#publication",
};

/**
 * « Prête à publier ? » (Admin v2, étape 6): a gauge of the checks already met and the six steps
 * of the guided path, each done or with what it misses, linked to where it is filled in. Then
 * the preview « comme un talent » and « Dupliquer ».
 */
export async function CourseReadinessCard({ course }: { course: AdminCourse }) {
  const t = await getTranslations("admin.courses");
  const readiness = courseReadiness(course);
  const base = `/admin/formations/${course.id}`;
  const link =
    "inline-flex h-9 items-center gap-1.5 rounded-pill bg-blanc px-3.5 text-[12.5px] font-semibold ring-[1.5px] ring-brume ring-inset hover:bg-creme";
  return (
    <section
      id="preparation"
      aria-labelledby="preparation-title"
      className={cx(adminCard, "flex scroll-mt-6 flex-col gap-4")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span
            role="img"
            aria-label={t("v2.readiness.label", { percent: readiness.percent })}
            className="grid size-14 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--color-sapin) ${readiness.percent * 3.6}deg, var(--color-brume) 0deg)`,
            }}
          >
            <span className="grid size-[42px] place-items-center rounded-full bg-blanc text-[13px] font-semibold">
              {t("v2.readiness.percent", { percent: readiness.percent })}
            </span>
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 id="preparation-title" className={cx(adminTitle, "!text-[16px] !leading-[22px]")}>
              {t("v2.readiness.title")}
            </h2>
            <p className="text-[12.5px] leading-[18px] text-ardoise">
              {course.status === "published"
                ? t("v2.readiness.published")
                : readiness.ready
                  ? t("v2.readiness.ready")
                  : t("v2.readiness.missing", { count: readiness.problems.length })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`${base}/apercu`} className={link}>
            <Icon name="eye" aria-hidden className="size-3.5" />
            {t("v2.preview")}
          </Link>
          <Link href={`${base}?action=dupliquer#preparation`} scroll={false} className={link}>
            <Icon name="doc" aria-hidden className="size-3.5" />
            {t("v2.duplicate.text")}
          </Link>
        </div>
      </div>

      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {readiness.steps.map((item, index) => (
          <li key={item.step}>
            <a
              href={anchors[item.step]}
              className={cx(
                "flex h-full items-start gap-2.5 rounded-[14px] p-3 ring-[1.5px] ring-inset",
                item.done ? "bg-lime-clair ring-transparent" : "bg-blanc ring-brume hover:bg-creme",
              )}
            >
              <span
                aria-hidden
                className={cx(
                  "grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold",
                  item.done ? "bg-sapin text-blanc" : "bg-creme",
                )}
              >
                {item.done ? <Icon name="check" className="size-3.5" /> : index + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[13px] leading-[18px] font-semibold">
                  {t(`v2.step.${item.step}`)}
                  <span className="sr-only">
                    {" "}
                    {item.done ? t("v2.readiness.done") : t("v2.readiness.todo")}
                  </span>
                </span>
                {item.missing.map((problem) => (
                  <span key={problem} className="text-[11.5px] leading-4 text-ardoise">
                    {t(`publish.problem.${problem}`)}
                  </span>
                ))}
                {item.step === "audience" && !item.done && (
                  <span className="text-[11.5px] leading-4 text-ardoise">
                    {t("v2.readiness.advice")}
                  </span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** « Dupliquer la formation » (`?action=dupliquer`): the title of the copy, then a draft. */
export async function DuplicateCoursePanel({ course }: { course: AdminCourse }) {
  const [t, tc] = await Promise.all([getTranslations("admin.courses"), getTranslations("common")]);
  const base = `/admin/formations/${course.id}`;
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
