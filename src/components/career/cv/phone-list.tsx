import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { BodyPortal } from "@/components/layout/body-portal";
import { cx } from "@/lib/cx";
import { createCv } from "@/server/actions/cv";
import { CvMoreMenu, templateNamer, type CvRow } from "./list";
import { CvSheet } from "./parts";
import { PdfButton } from "./pdf-button";

/** The gradient pill of the phone screens (« PDF », « Créer et ouvrir »). */
export const phoneCta =
  "flex items-center justify-center gap-2 rounded-pill bg-gradient-principal font-semibold text-blanc shadow-[var(--jm-ombre-principal)] hover:brightness-110";

/**
 * « Mes CV » on a phone (screen 56): « Créer un CV », then a grid of the CVs with their thumbnail,
 * template and date, the PDF and the menu. The PDF confirms with a toast.
 */
export async function PhoneCvList({
  cvs,
  fileNames,
  atLimit,
}: {
  cvs: CvRow[];
  fileNames: Record<string, string>;
  atLimit: boolean;
}) {
  const t = await getTranslations("career.cv");
  const format = await getFormatter();
  const name = await templateNamer();
  const labels = {
    preparing: t("phone.preparing"),
    preparingLabel: t("phone.preparingLabel"),
    done: t("phone.downloaded"),
    error: t("phone.pdfError"),
  };
  return (
    <div className="flex flex-col gap-4 md:hidden">
      <h1 className="sr-only">{t("phone.listTitle")}</h1>
      {atLimit ? (
        <p className="rounded-[20px] bg-blanc px-5 py-4 text-[15px] text-ardoise">
          {t("phone.sheet.limit", { max: cvs.length })}
        </p>
      ) : (
        <Link
          href="/app/career/cv?creer=1"
          className="flex h-[88px] items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-brume text-[18px] font-semibold hover:border-sapin/40"
        >
          <Icon name="plus" className="size-5" />
          {t("phone.create")}
        </Link>
      )}
      <ul className="grid grid-cols-2 gap-3">
        {cvs.map((cv) => (
          <li
            key={cv.id}
            className="flex min-w-0 flex-col gap-2 rounded-[24px] bg-blanc p-3 shadow-douce"
          >
            <Link
              href={`/app/career/cv/${cv.id}`}
              className="relative flex h-[132px] items-start justify-center overflow-hidden rounded-[16px] bg-[linear-gradient(160deg,var(--color-creme),#ECE6DA)] pt-4"
            >
              <CvSheet template={cv.template} width={96} />
              {cv.isPrimary && (
                <span className="absolute top-2 left-2 rounded-pill bg-lime px-2.5 py-0.5 text-[12px] font-semibold text-sapin">
                  {t("list.primaryTitle")}
                </span>
              )}
            </Link>
            <h2 className="truncate px-1 text-[16px] leading-6 font-semibold">
              <Link href={`/app/career/cv/${cv.id}`}>{cv.title}</Link>
            </h2>
            <p className="truncate px-1 text-[14px] text-ardoise">
              {[
                name(cv.template),
                format.dateTime(cv.updatedAt, { day: "numeric", month: "short" }),
              ].join(" · ")}
            </p>
            <div className="flex items-center gap-2">
              <PdfButton
                documentId={cv.id}
                fileName={fileNames[cv.id]!}
                labels={labels}
                className={cx(phoneCta, "h-12 min-w-0 flex-1 px-3 text-[15px]")}
              >
                <Icon name="telecharger" className="size-5 shrink-0" />
                {t("phone.pdf")}
              </PdfButton>
              <CvMoreMenu cv={cv} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const sources: { value: "profile" | "import" | "blank"; icon: IconName; tile: string }[] = [
  { value: "profile", icon: "profil", tile: "bg-lime" },
  { value: "import", icon: "telecharger", tile: "bg-[#E4F57A]" },
  { value: "blank", icon: "doc", tile: "bg-creme" },
];

/** « Créer un CV » (screen 27): where it starts from and its name, then « Créer et ouvrir ». */
export async function CreateCvSheet({ suggested }: { suggested: string }) {
  const t = await getTranslations("career.cv.phone.sheet");
  return (
    <BodyPortal>
      <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6">
        <Link
          href="/app/career/cv"
          aria-hidden
          tabIndex={-1}
          className="absolute inset-0 bg-sapin/55"
        />
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="cv-create-title"
          className="relative flex max-h-[94dvh] w-full flex-col gap-4 overflow-y-auto rounded-t-[28px] bg-creme px-5 pt-3 md:max-w-[440px] md:rounded-[28px]"
        >
          <span aria-hidden className="mx-auto block h-1.5 w-10 rounded-full bg-brume md:hidden" />
          <div className="flex items-center justify-between gap-3">
            <h2 id="cv-create-title" className="text-[26px] font-bold tracking-[-0.02em]">
              {t("title")}
            </h2>
            <Link
              href="/app/career/cv"
              aria-label={t("close")}
              className="grid size-12 shrink-0 place-items-center rounded-full bg-blanc shadow-douce"
            >
              <Icon name="fermer" className="size-5" />
            </Link>
          </div>
          <form action={createCv} className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-3">
              <legend className="sr-only">{t("legend")}</legend>
              {sources.map((source) => (
                <label
                  key={source.value}
                  className="flex min-h-[84px] cursor-pointer items-center gap-4 rounded-[22px] bg-blanc px-4 py-3 ring-2 shadow-douce ring-transparent has-checked:ring-sapin has-focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)]"
                >
                  <span
                    aria-hidden
                    className={cx(
                      "grid size-12 shrink-0 place-items-center rounded-[16px]",
                      source.tile,
                    )}
                  >
                    <Icon name={source.icon} className="size-5" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[17px] font-semibold">{t(source.value)}</span>
                    <span className="text-[15px] text-ardoise">{t(`${source.value}Hint`)}</span>
                  </span>
                  <input
                    type="radio"
                    name="source"
                    value={source.value}
                    defaultChecked={source.value === "profile"}
                    className="size-6 shrink-0 accent-sapin"
                  />
                </label>
              ))}
            </fieldset>
            <div className="flex flex-col gap-2">
              <label htmlFor="cv-create-name" className="text-[16px] font-semibold">
                {t("name")}
              </label>
              <input
                id="cv-create-name"
                name="title"
                defaultValue={suggested}
                maxLength={80}
                className="h-14 rounded-[18px] bg-blanc px-5 text-[17px] ring-2 shadow-douce ring-transparent outline-none focus-visible:ring-sapin"
              />
            </div>
            <div className="sticky bottom-0 -mx-5 mt-2 border-t border-brume bg-creme px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button type="submit" className={cx(phoneCta, "h-14 w-full text-[17px]")}>
                {t("submit")}
                <Icon name="chev-r" className="size-5" />
              </button>
            </div>
          </form>
        </section>
      </div>
    </BodyPortal>
  );
}
