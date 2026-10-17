import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Character } from "@/components/brand/character";
import { Icon } from "@/components/brand/icon";
import { cardShadow } from "@/components/career/home/tool-card";
import { pillClass, ScoreRing } from "@/components/career/kit";
import { Button } from "@/components/ui";
import { templateKey } from "@/features/cv/examples";
import type { CvTemplate } from "@/features/cv/templates/registry";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { createCv, deleteCv, duplicateCv, setPrimaryCv } from "@/server/actions/cv";
import type { CvScore } from "@/server/services/cv-coach";
import { CriteriaBars, CvSheet, Dots } from "./parts";

/** « Mes CV » v2 (docs/refonte-career/BRIEF-CV-V2.md § 1). */

export type CvRow = {
  id: string;
  title: string;
  isPrimary: boolean;
  updatedAt: Date;
  template: CvTemplate;
  score: CvScore;
};

/** Entrance of a block: rises 14 px and fades in, 80 ms after the previous one (§ 3). */
export const enter = (index: number) => ({ style: { "--i": index } as CSSProperties });

export async function templateNamer() {
  const d = dynamic(await getTranslations("career.cv"));
  return (template: CvTemplate) => d(`template.name.${templateKey(template.id)}`);
}

/** The « Nouveau CV » button, disabled at the limit. */
export async function NewCvButton({
  disabled,
  tone = "lime",
}: {
  disabled: boolean;
  tone?: "lime" | "dark";
}) {
  const t = await getTranslations("career.cv");
  return (
    <form action={createCv}>
      <button type="submit" disabled={disabled} className={pillClass(tone, "md")}>
        <Icon name="plus" className="size-4" />
        {t("new")}
      </button>
    </form>
  );
}

/** A figure of the « Mes CV » head, with its Signature bar. */
function HeroStat({
  label,
  children,
  ratio,
}: {
  label: string;
  children: ReactNode;
  ratio: number;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-[14px] bg-creme px-3.5 py-2.5 sm:max-w-[200px]">
      <dt className="text-xs text-ardoise">{label}</dt>
      <dd className="flex flex-col gap-1.5">
        <span className="text-sm text-ardoise">{children}</span>
        <span aria-hidden className="block h-1.5 overflow-hidden rounded-md bg-gris-clair">
          <span
            className="jm-gauge block h-full origin-left rounded-md bg-[image:var(--jm-degrade-signature)]"
            style={{ transform: `scaleX(${Math.max(0, Math.min(1, ratio))})` }}
          />
        </span>
      </dd>
    </div>
  );
}

/**
 * § 1.1, lightened in Admin v4 étape 5: one white card with the lead, the two real figures and the
 * buttons (the page title sits above, in the page header).
 */
export async function CvListHero({
  count,
  max,
  primary,
}: {
  count: number;
  max: number;
  primary: CvRow | null;
}) {
  const t = await getTranslations("career.cv");
  const tHome = await getTranslations("career.home");
  const tAi = await getTranslations("ai.cvCoach.score");
  // « {count} sur {max} »: the count is written large, the rest of the sentence after it.
  const countValue = t("list.countValue", { count, max });
  const countRest = countValue.startsWith(String(count))
    ? countValue.slice(String(count).length).trim()
    : countValue;
  return (
    <section
      aria-labelledby="cv-hero-title"
      {...enter(0)}
      className="jm-ch-in grid gap-4 rounded-[22px] border border-sapin/8 bg-blanc p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center xl:gap-8"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id="cv-hero-title" className="text-[15px] font-semibold text-sapin">
          {t("myCvs")}
        </h2>
        <p className="max-w-[60ch] text-sm leading-5 text-ardoise">{t("list.lead")}</p>
        {count >= max && <p className="text-xs text-ardoise">{t("limit", { max })}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <dl className="flex flex-wrap gap-2">
          <HeroStat label={t("list.count")} ratio={count / max}>
            <b className="text-[18px] font-semibold text-sapin">{count}</b> {countRest}
          </HeroStat>
          {primary && (
            <HeroStat label={t("list.primaryScore")} ratio={primary.score.total / 100}>
              <b className="text-[18px] font-semibold text-sapin">{primary.score.total}</b>{" "}
              {[tHome("stats.cvUnit"), tAi(`level.${primary.score.level}`).toLowerCase()].join(
                " · ",
              )}
            </HeroStat>
          )}
        </dl>
        {/* Without any CV, the large empty card below carries the button. */}
        {count > 0 && (
          <div className="flex flex-wrap gap-2">
            <NewCvButton disabled={count >= max} />
            {primary && (
              <Link
                href={`/app/career/cv/modeles?cv=${primary.id}`}
                className={pillClass("outline")}
              >
                {t("list.chooseTemplate")}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** The « … » menu of a CV (a `<details>`, without JavaScript, like the Jobs filters). */
export async function CvMoreMenu({
  cv,
  withPdf = false,
  align = "right",
}: {
  cv: CvRow;
  /** On a phone, the other cards keep « Ouvrir » only: « PDF » moves here. */
  withPdf?: boolean;
  align?: "right" | "left";
}) {
  const t = await getTranslations("career.cv");
  const item =
    "flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium hover:bg-creme lg:min-h-10";
  return (
    <details className="group/menu relative">
      <summary
        aria-label={[t("list.more"), cv.title].join(" · ")}
        className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full bg-blanc ring-1 ring-brume ring-inset hover:bg-creme lg:size-10 [&::-webkit-details-marker]:hidden"
      >
        <Icon name="more" className="size-4" />
      </summary>
      <div
        className={cx(
          "absolute bottom-full z-30 mb-2 flex w-64 flex-col gap-0.5 rounded-[18px] bg-blanc p-2 shadow-[0_24px_50px_-20px_rgb(11_26_31/0.45)] ring-1 ring-brume",
          align === "right" ? "right-0" : "left-0",
        )}
      >
        {withPdf && (
          <a href={`/app/career/cv/${cv.id}/pdf`} className={cx(item, "sm:hidden")} download>
            <Icon name="telecharger" className="size-4" />
            {t("export.text")}
          </a>
        )}
        {!cv.isPrimary && (
          <form action={setPrimaryCv}>
            <input type="hidden" name="id" value={cv.id} />
            <input type="hidden" name="retour" value="liste" />
            <button type="submit" className={item}>
              <Icon name="etoile" className="size-4" />
              {t("setDefault")}
            </button>
          </form>
        )}
        <form action={duplicateCv}>
          <input type="hidden" name="id" value={cv.id} />
          <button type="submit" className={item}>
            <Icon name="doc" className="size-4" />
            {t("duplicate")}
          </button>
        </form>
        <details className="group/delete">
          <summary
            className={cx(
              item,
              "cursor-pointer list-none text-down-texte [&::-webkit-details-marker]:hidden",
            )}
          >
            <Icon name="fermer" className="size-4" />
            {t("delete.text")}
          </summary>
          <form
            action={deleteCv}
            className="mt-1 flex flex-col items-start gap-2 rounded-[14px] bg-creme p-3"
          >
            <input type="hidden" name="id" value={cv.id} />
            <p className="text-sm font-semibold">
              {t("delete.confirm.title", { cvName: cv.title })}
            </p>
            <p className="text-xs">{t("delete.confirm.body")}</p>
            <Button type="submit" variant="danger" size="sm">
              {t("delete.confirm.cta")}
            </Button>
          </form>
        </details>
      </div>
    </details>
  );
}

/** § 1.2: the CV sent with the applications, in a large two-column card. */
export async function PrimaryCvCard({ cv }: { cv: CvRow }) {
  const t = await getTranslations("career.cv");
  const tAi = await getTranslations("ai.cvCoach.score");
  const name = await templateNamer();
  const chip =
    "inline-flex items-center gap-1.5 rounded-pill bg-creme px-3 py-1.5 text-xs font-medium";
  return (
    <section
      aria-labelledby="cv-primary-title"
      {...enter(1)}
      className="jm-ch-in flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="cv-primary-title" className="text-[22px] font-semibold tracking-[-0.02em]">
          {t("list.primaryTitle")}
        </h2>
        <p className="text-sm text-ardoise">{t("list.primaryLead")}</p>
      </div>
      <article
        id="cv-principal"
        className={cx(
          "grid rounded-[28px] bg-blanc md:grid-cols-[330px_minmax(0,1fr)]",
          cardShadow,
        )}
      >
        <div className="relative isolate flex min-h-[230px] items-center justify-center overflow-hidden rounded-t-[28px] bg-[linear-gradient(160deg,#F4FDE6,#B9EE8C)] md:rounded-l-[28px] md:rounded-tr-none">
          <Dots />
          <CvSheet
            template={cv.template}
            width={150}
            className="absolute translate-x-9 translate-y-3 rotate-3 opacity-80 grayscale"
          />
          <span className="jm-float relative block" style={{ animationDelay: "-2s" }}>
            <CvSheet template={cv.template} width={178} className="-rotate-4" />
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-4 p-5 lg:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-[22px] leading-tight font-semibold tracking-[-0.02em] lg:text-[24px]">
              <Link href={`/app/career/cv/${cv.id}`} className="hover:underline">
                {cv.title}
              </Link>
            </h3>
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-lime px-3 py-1 text-xs font-semibold">
              <Icon name="etoile" className="size-3.5" />
              {t("default")}
            </span>
          </div>
          <ul className="flex flex-wrap gap-2">
            <li className={chip}>
              <Icon name="doc" className="size-3.5" />
              {[t("template.text"), name(cv.template)].join(" ")}
            </li>
            <li className={chip}>
              <Icon name="check" className="size-3.5" />
              {t(`template.ats.${cv.template.ats}`)}
            </li>
            <li className={chip}>
              <Icon name="horloge" className="size-3.5" />
              {t("updated", { date: formatDate(cv.updatedAt) })}
            </li>
          </ul>
          <div className="flex flex-col gap-4 rounded-[20px] bg-lime-clair/45 p-4 ring-1 ring-lime/40 sm:flex-row sm:items-center">
            <span className="flex flex-col items-center self-start">
              <ScoreRing value={cv.score.total} label={String(cv.score.total)} size={86} />
              <span className="sr-only">
                {tAi("label", { level: tAi(`level.${cv.score.level}`) })}
              </span>
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <CriteriaBars score={cv.score} layout="columns" />
              <Link
                href={`/app/career/cv/${cv.id}#coach`}
                className="inline-flex min-h-11 items-center gap-1.5 self-start text-[13px] font-semibold text-up-texte hover:underline lg:min-h-0"
              >
                <Icon name="eye" className="size-4" />
                {t("list.why")}
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/app/career/cv/${cv.id}`} className={pillClass("dark")}>
              {t("list.openEditor")}
              <Icon name="chev-r" className="size-4" />
            </Link>
            <a href={`/app/career/cv/${cv.id}/pdf`} className={pillClass("outline")} download>
              <Icon name="telecharger" className="size-4" />
              {t("export.text")}
            </a>
            <form action={duplicateCv}>
              <input type="hidden" name="id" value={cv.id} />
              <button type="submit" className={pillClass("outline")}>
                {t("duplicate")}
              </button>
            </form>
            <span className="ml-auto">
              <CvMoreMenu cv={cv} />
            </span>
          </div>
        </div>
      </article>
    </section>
  );
}

const backgrounds = [
  "bg-[linear-gradient(160deg,#E4FBF3,#BDEEDD)]",
  "bg-[linear-gradient(160deg,#FBF8F2,#EFE7DA)]",
  "bg-[linear-gradient(160deg,#FAFDE4,#E3F6A8)]",
];

/** § 1.3: another CV, with its template's preview and its score. */
export async function OtherCvCard({ cv, index }: { cv: CvRow; index: number }) {
  const t = await getTranslations("career.cv");
  const name = await templateNamer();
  return (
    <li className={cx("jm-cv-card flex flex-col rounded-[24px] bg-blanc", cardShadow)}>
      <div
        className={cx(
          "relative isolate flex h-[170px] items-end justify-center overflow-hidden rounded-t-[24px] sm:h-[200px]",
          backgrounds[index % backgrounds.length],
        )}
      >
        <Dots />
        <CvSheet
          template={cv.template}
          width={118}
          className="jm-cv-thumb translate-y-6 sm:w-[132px]!"
        />
        <span className="absolute right-3 bottom-3 rounded-full bg-blanc p-1 shadow-[0_8px_18px_-8px_rgb(11_26_31/0.4)]">
          <ScoreRing value={cv.score.total} label={String(cv.score.total)} size={44} />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-base leading-tight font-semibold">
          <Link href={`/app/career/cv/${cv.id}`} className="hover:underline">
            {cv.title}
          </Link>
        </h3>
        <p className="text-xs leading-[1.45] text-ardoise">
          {[name(cv.template), t("updated", { date: formatDate(cv.updatedAt) })].join(" · ")}
        </p>
        <div className="mt-auto flex items-center gap-2 border-t border-brume pt-3">
          <Link
            href={`/app/career/cv/${cv.id}`}
            className={pillClass("dark", "sm", "h-11 flex-1 sm:h-9 sm:flex-none")}
          >
            {t("open")}
          </Link>
          <a
            href={`/app/career/cv/${cv.id}/pdf`}
            className={pillClass("outline", "sm", "max-sm:hidden")}
            download
          >
            <Icon name="telecharger" className="size-4" />
            {t("export.text")}
          </a>
          <span className="sm:ml-auto">
            <CvMoreMenu cv={cv} withPdf />
          </span>
        </div>
      </div>
    </li>
  );
}

/** § 1.3: the last card, hidden at the limit. */
export async function NewCvCard({ left }: { left: number }) {
  const t = await getTranslations("career.cv");
  return (
    <li className="flex">
      <form action={createCv} className="flex flex-1">
        <button
          type="submit"
          className="group flex min-h-[260px] flex-1 flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-sapin/20 bg-blanc/45 p-5 text-center hover:border-sapin/40 hover:bg-blanc"
        >
          <span
            aria-hidden
            className="grid size-16 place-items-center rounded-[20px] bg-lime shadow-[0_14px_30px_-14px_rgb(30_154_100/0.8)] transition-transform group-hover:scale-105"
          >
            <Icon name="plus" className="size-6" />
          </span>
          <span className="text-base font-semibold">{t("new")}</span>
          <span className="max-w-[26ch] text-xs leading-[1.5] text-ardoise">
            {t("list.newHint", { count: left })}
          </span>
        </button>
      </form>
    </li>
  );
}

/** Without any CV: the existing empty state, dressed like a large « Nouveau CV » card. */
export async function CvEmptyCard() {
  const t = await getTranslations("career.cv");
  return (
    <section
      aria-labelledby="cv-empty"
      {...enter(1)}
      className="jm-ch-in flex flex-col items-center gap-4 rounded-[28px] border-2 border-dashed border-sapin/20 bg-blanc/60 px-5 py-10 text-center sm:flex-row sm:justify-center sm:gap-8 sm:text-left"
    >
      <span className="jm-float block" aria-hidden>
        <Character name="amani" pose="salut" height={170} />
      </span>
      <div className="flex max-w-[44ch] flex-col items-center gap-3 sm:items-start">
        <h2 id="cv-empty" className="text-[20px] font-semibold">
          {t("empty")}
        </h2>
        <p className="text-sm text-ardoise">{t("fromProfileHint")}</p>
        <NewCvButton disabled={false} tone="dark" />
      </div>
    </section>
  );
}

/** § 1.4: the templates band (figures from the catalogue and the rights). */
export async function TemplatesBand({
  total,
  included,
  fonts,
  fan,
  locked,
  href,
}: {
  total: number;
  included: number;
  fonts: number;
  fan: CvTemplate[];
  /** The reserved template of the fan and the plan that includes it, if any. */
  locked: { template: CvTemplate; plan: string } | null;
  href: string | null;
}) {
  const t = await getTranslations("career.cv");
  const tags = [
    t("list.templatesColumns"),
    t("list.templatesPhoto"),
    t("list.templatesFonts", { count: fonts }),
  ];
  const sheets = locked ? [...fan.slice(0, 2), locked.template] : fan.slice(0, 3);
  return (
    <section
      aria-labelledby="cv-templates-band"
      {...enter(3)}
      className="jm-ch-in relative isolate grid overflow-hidden rounded-[32px] bg-[image:var(--jm-degrade-ia)] text-blanc lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
    >
      <Dots light />
      <div className="flex min-w-0 flex-col gap-4 px-[22px] py-7 lg:px-9 lg:py-9">
        <p className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.16em] text-neon uppercase before:h-0.5 before:w-[22px] before:rounded-sm before:bg-neon">
          {t("list.templatesEyebrow")}
        </p>
        <h2
          id="cv-templates-band"
          className="max-w-[24ch] text-[26px] leading-[1.15] font-semibold tracking-[-0.02em] lg:text-[30px]"
        >
          {t("list.templatesTitle", { total })}
        </h2>
        <p className="max-w-[52ch] text-sm leading-[1.6] text-blanc/85">
          {t("list.templatesBody", { included })}
        </p>
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-pill px-3 py-1.5 text-xs font-medium ring-1 ring-blanc/35 ring-inset"
            >
              {tag}
            </li>
          ))}
        </ul>
        {href && (
          <Link href={href} className={pillClass("lime", "md", "self-start")}>
            {t("list.templatesCta")}
            <Icon name="chev-r" className="size-4" />
          </Link>
        )}
      </div>
      <div aria-hidden className="relative hidden min-h-[260px] lg:block">
        {sheets.map((template, index) => (
          <span
            key={`${template.id}-band`}
            className="absolute top-1/2 left-1/2"
            style={{
              transform: `translate(calc(-50% + ${(index - 1) * 118}px), -50%) rotate(${[-6, -1, 5][index]}deg)`,
              zIndex: index === 1 ? 2 : 1,
            }}
          >
            <span className="jm-float relative block" style={{ animationDelay: `${-index * 2}s` }}>
              <CvSheet template={template} width={index === 1 ? 128 : 118} />
              {locked && index === 2 && (
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-pill bg-sapin px-2.5 py-1 text-[11px] font-semibold text-lime">
                  <Icon name="lock" className="size-3" />
                  {locked.plan}
                </span>
              )}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
