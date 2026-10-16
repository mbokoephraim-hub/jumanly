import { getTranslations } from "next-intl/server";
import { IconTile, adminCard, adminLabel, adminTitle } from "@/components/admin/kit";
import type { IconName } from "@/components/brand/icon";
import { Icon } from "@/components/brand/icon";
import { Button, Select } from "@/components/ui";
import { cx } from "@/lib/cx";
import type { AdminCourse } from "@/server/services/course-admin";
import { reportPeriods, type CoursePdfKind } from "@/server/services/course-pdf";

const pdfHref = (courseId: string, kind: CoursePdfKind) =>
  `/admin/formations/${courseId}/pdf/${kind}`;

const items = [
  { kind: "programme", icon: "cours-video", tone: "jm-admin-tile" },
  { kind: "support", icon: "learn", tone: "jm-admin-tile" },
  { kind: "quiz", icon: "quiz", tone: "jm-admin-tile" },
  { kind: "attestation", icon: "certificat", tone: "jm-admin-tile" },
] as const satisfies readonly { kind: CoursePdfKind; icon: IconName; tone: string }[];

/**
 * « PDF de la formation » (Admin v3, étape 6): the PDFs Jumanly makes from the course, made on
 * demand from its current content. Compact in the right column; with the report period on the
 * Publication step. Each download is logged by the route.
 */
export async function CoursePdfCard({
  course,
  full = false,
}: {
  course: Pick<AdminCourse, "id">;
  /** With the hints and the report form (Publication step). */
  full?: boolean;
}) {
  const t = await getTranslations("admin.courses.v3.pdf");
  const id = full ? "course-pdf" : "course-pdf-side";
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cx(adminCard, "flex flex-col gap-3")}
    >
      <h2 id={`${id}-title`} className={full ? adminTitle : adminLabel}>
        {t("title")}
      </h2>
      {full && <p className="text-[13px] leading-5 text-ardoise">{t("intro")}</p>}
      <ul className={cx("grid gap-2", full && "sm:grid-cols-2")}>
        {items.map((item) => (
          <li key={item.kind}>
            <a
              href={pdfHref(course.id, item.kind)}
              aria-label={t("download", { name: t(item.kind) })}
              className={cx(
                "group flex items-center gap-3 rounded-[16px] border border-brume bg-blanc p-2.5 transition-colors hover:border-sapin/30 hover:bg-creme",
                full && "p-3",
              )}
            >
              <IconTile icon={item.icon} tone={item.tone} size={full ? 38 : 32} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[13px] leading-5 font-semibold">{t(item.kind)}</span>
                {full && (
                  <span className="text-[12px] leading-4 text-ardoise">
                    {t(`${item.kind}Hint`)}
                  </span>
                )}
              </span>
              <Icon
                name="telecharger"
                className="size-4 shrink-0 text-ardoise group-hover:text-sapin"
              />
            </a>
          </li>
        ))}
        {!full && (
          <li>
            <a
              href={pdfHref(course.id, "bilan")}
              aria-label={t("download", { name: t("report") })}
              className="group flex items-center gap-3 rounded-[16px] border border-brume bg-blanc p-2.5 transition-colors hover:border-sapin/30 hover:bg-creme"
            >
              <IconTile icon="statistiques" size={32} />
              <span className="flex-1 text-[13px] leading-5 font-semibold">{t("report")}</span>
              <Icon
                name="telecharger"
                className="size-4 shrink-0 text-ardoise group-hover:text-sapin"
              />
            </a>
          </li>
        )}
      </ul>
      {full && (
        <form
          method="get"
          action={pdfHref(course.id, "bilan")}
          className="flex flex-col gap-3 rounded-[18px] bg-creme p-4 sm:flex-row sm:items-end"
        >
          <div className="flex items-center gap-3 sm:flex-1">
            <IconTile icon="statistiques" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="flex flex-col">
                <span className="text-[13px] leading-5 font-semibold">{t("report")}</span>
                <span className="text-[12px] leading-4 text-ardoise">{t("reportHint")}</span>
              </span>
              <Select
                id="course-pdf-period"
                name="periode"
                label={t("periodLabel")}
                defaultValue="all"
                options={[
                  ...reportPeriods.map((days) => ({
                    value: String(days),
                    label: t(`period.${days}`),
                  })),
                  { value: "all", label: t("period.all") },
                ]}
              />
            </div>
          </div>
          <Button type="submit" variant="secondary" icon={<Icon name="telecharger" />}>
            {t("reportSubmit")}
          </Button>
        </form>
      )}
      <p className="text-[11.5px] leading-4 text-ardoise">{t("logged")}</p>
    </section>
  );
}
