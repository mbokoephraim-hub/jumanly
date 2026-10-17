import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { pillClass, ScoreRing } from "@/components/career/kit";
import { Button } from "@/components/ui";
import { cx } from "@/lib/cx";
import {
  changeCvSection,
  createCv,
  deleteCv,
  duplicateCv,
  refreshCvFromProfile,
  setPrimaryCv,
} from "@/server/actions/cv";
import { MAX_CVS, type CvSectionId } from "@/server/services/cv";

/** The CV editor v2 (docs/refonte-career/BRIEF-CV-V2.md § 2). */

type CvLink = { id: string; title: string; isPrimary: boolean };

const menuItem =
  "flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium hover:bg-creme lg:min-h-10";

/** § 2.1: the sticky workshop bar (CV selector, save state, actions, download). */
export async function WorkshopBar({
  cv,
  cvs,
  className,
}: {
  cv: CvLink;
  cvs: CvLink[];
  className?: string;
}) {
  const t = await getTranslations("career.cv");
  const count = cvs.length;
  return (
    <div
      role="toolbar"
      aria-label={t("toolbar.label")}
      id="cv-atelier"
      className={cx(
        "sticky top-[calc(10px+env(safe-area-inset-top))] z-30 flex items-center gap-2 rounded-[24px] bg-blanc/86 p-2 shadow-[0_18px_40px_-26px_rgb(15_63_55/0.45)] ring-1 ring-sapin/6 backdrop-blur-[14px] sm:gap-3",
        className,
      )}
    >
      <details className="group relative min-w-0 flex-1 lg:max-w-[340px]">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-[18px] bg-creme py-2 pr-3 pl-2 hover:bg-lime-clair/60 [&::-webkit-details-marker]:hidden">
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[image:var(--jm-degrade-signature)] text-sapin"
          >
            <Icon name="cv" className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] font-semibold">{cv.title}</span>
            <span className="truncate text-xs text-ardoise">
              {[cv.isPrimary ? t("default") : null, t("toolbar.count", { count })]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          <Icon name="chev-d" className="size-4 shrink-0 transition group-open:rotate-180" />
        </summary>
        <ul className="absolute top-full left-0 z-40 mt-2 flex w-full min-w-[260px] flex-col gap-1 rounded-[18px] bg-blanc p-2 shadow-[0_24px_50px_-20px_rgb(11_26_31/0.45)] ring-1 ring-brume">
          {cvs.map((item) => (
            <li key={item.id}>
              <Link
                href={`/app/career/cv/${item.id}`}
                aria-current={item.id === cv.id ? "page" : undefined}
                className="flex min-h-11 flex-col justify-center rounded-xl px-3 py-2 text-sm hover:bg-lime-clair aria-[current=page]:bg-lime-clair"
              >
                <span className="font-semibold">{item.title}</span>
                {item.isPrimary && <span className="text-xs text-ardoise">{t("default")}</span>}
              </Link>
            </li>
          ))}
          <li className="border-t border-brume pt-1">
            <Link href="/app/career/cv" className={menuItem}>
              <Icon name="grid" className="size-4" />
              {t("back")}
            </Link>
          </li>
        </ul>
      </details>
      <SavedPill className="hidden lg:inline-flex" />
      <div className="ml-auto flex items-center gap-2">
        <form action={createCv} className="hidden lg:block">
          <button
            type="submit"
            disabled={count >= MAX_CVS}
            className={pillClass("outline", "sm", "h-10")}
          >
            <Icon name="plus" className="size-4" />
            {t("new")}
          </button>
        </form>
        <form action={duplicateCv} className="hidden lg:block">
          <input type="hidden" name="id" value={cv.id} />
          <button
            type="submit"
            disabled={count >= MAX_CVS}
            className={pillClass("outline", "sm", "h-10")}
          >
            {t("duplicate")}
          </button>
        </form>
        <details className="relative">
          <summary
            aria-label={t("list.more")}
            className="grid size-11 cursor-pointer list-none place-items-center rounded-full bg-blanc ring-1 ring-brume ring-inset hover:bg-creme lg:size-10 [&::-webkit-details-marker]:hidden"
          >
            <Icon name="more" className="size-4" />
          </summary>
          <div className="absolute top-full right-0 z-40 mt-2 flex w-64 flex-col gap-0.5 rounded-[18px] bg-blanc p-2 shadow-[0_24px_50px_-20px_rgb(11_26_31/0.45)] ring-1 ring-brume">
            <form action={createCv} className="lg:hidden">
              <button
                type="submit"
                disabled={count >= MAX_CVS}
                className={cx(menuItem, "disabled:opacity-50")}
              >
                <Icon name="plus" className="size-4" />
                {t("new")}
              </button>
            </form>
            <form action={duplicateCv} className="lg:hidden">
              <input type="hidden" name="id" value={cv.id} />
              <button
                type="submit"
                disabled={count >= MAX_CVS}
                className={cx(menuItem, "disabled:opacity-50")}
              >
                <Icon name="doc" className="size-4" />
                {t("duplicate")}
              </button>
            </form>
            {!cv.isPrimary && (
              <form action={setPrimaryCv}>
                <input type="hidden" name="id" value={cv.id} />
                <button type="submit" className={menuItem}>
                  <Icon name="etoile" className="size-4" />
                  {t("setDefault")}
                </button>
              </form>
            )}
            <details>
              <summary
                className={cx(
                  menuItem,
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
        <a
          href={`/app/career/cv/${cv.id}/pdf`}
          className={pillClass("dark", "sm", "h-10 max-lg:hidden")}
          download
        >
          <Icon name="telecharger" className="size-4" />
          {t("toolbar.download")}
        </a>
      </div>
    </div>
  );
}

/** « Enregistré » in a light Lime pill. */
export async function SavedPill({ className }: { className?: string }) {
  const t = await getTranslations("career.cv");
  return (
    <span
      className={cx(
        "items-center gap-1.5 rounded-pill bg-lime-clair px-3 py-1.5 text-xs font-semibold text-up-texte",
        className,
      )}
    >
      <Icon name="check" className="size-3.5" />
      {t("saved")}
    </span>
  );
}

/** § 2.1 on a phone: « Enregistré » and the download, fixed above the bottom menu. */
export async function MobileActionBar({ id, className }: { id: string; className?: string }) {
  const t = await getTranslations("career.cv");
  return (
    <div className={className}>
      <div
        id="cv-barre-mobile"
        className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 rounded-[22px] bg-blanc/92 p-2.5 shadow-float ring-1 ring-sapin/6 backdrop-blur-[14px] lg:hidden"
      >
        <SavedPill className="inline-flex" />
        <a href={`/app/career/cv/${id}/pdf`} className={pillClass("dark", "md")} download>
          <Icon name="telecharger" className="size-4" />
          {t("toolbar.download")}
        </a>
      </div>
      <div aria-hidden className="h-16 lg:hidden" />
    </div>
  );
}

/** A success notice: light Lime band with a ✓ disc, under the bar. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="flex items-center gap-3 rounded-[20px] bg-lime-clair/70 px-4 py-3 text-sm font-medium ring-1 ring-lime/50"
    >
      <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-lime">
        <Icon name="check" className="size-4" />
      </span>
      {children}
    </p>
  );
}

/** § 2.3: the pill switch « Contenu / Mise en forme » (two links; the pill is placed on the server). */
export async function ModeSwitch({ id, view }: { id: string; view: "content" | "style" }) {
  const t = await getTranslations("career.cv");
  return (
    <nav
      aria-label={t("tab.style")}
      data-view={view}
      className="jm-cv-switch relative grid grid-cols-2 rounded-pill bg-creme p-1"
    >
      <span
        aria-hidden
        className="jm-cv-switch-pill absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-pill bg-sapin shadow-[0_8px_18px_-10px_rgb(15_63_55/0.8)]"
      />
      {(
        [
          ["content", t("tab.content"), `/app/career/cv/${id}`],
          ["style", t("tab.style"), `/app/career/cv/${id}?vue=style`],
        ] as const
      ).map(([key, label, href]) => (
        <Link
          key={key}
          href={href}
          aria-current={view === key ? "page" : undefined}
          className="relative z-[1] flex h-11 items-center justify-center rounded-pill text-sm font-semibold text-sapin aria-[current=page]:text-blanc"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export const sectionIcons: Record<CvSectionId, IconName> = {
  summary: "profil",
  experience: "career",
  education: "diplome",
  skills: "competence",
  languages: "langue",
};

/** Where each section is edited in the profile. */
const profileAnchors: Record<CvSectionId, string> = {
  summary: "resume",
  experience: "experiences",
  education: "formations",
  skills: "competences",
  languages: "langues",
};

export type EditorSection = {
  id: CvSectionId;
  visible: boolean;
  filled: boolean;
  /** Real count of items (postes, diplômes…), none for the profile. */
  count: number | null;
};

/** § 2.3 « Contenu »: progress, then the sections; the profile one holds the « Informations » form. */
export async function SectionsPanel({
  id,
  sections,
  profileForm,
}: {
  id: string;
  sections: EditorSection[];
  profileForm: ReactNode;
}) {
  const t = await getTranslations("career.cv");
  const filled = sections.filter((section) => section.filled).length;
  const total = sections.length;
  const sub = (section: EditorSection) =>
    section.id === "summary"
      ? t("section.count.summary")
      : t(`section.count.${section.id}`, { count: section.count ?? 0 });
  const orderButtons = (section: EditorSection, index: number, compact: boolean) => {
    const name = t(`section.${section.id}`);
    return (
      [
        ["up", t("section.moveUp"), index === 0, "up"],
        ["down", t("section.moveDown"), index === sections.length - 1, "down"],
        [
          "toggle",
          section.visible ? t("section.hide") : t("section.show"),
          false,
          section.visible ? "eye-off" : "eye",
        ],
      ] as const
    ).map(([move, label, disabled, icon]) => (
      <form key={move} action={changeCvSection}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="section" value={section.id} />
        <input type="hidden" name="move" value={move} />
        <button
          type="submit"
          disabled={disabled}
          aria-label={[label, name].join(" · ")}
          className={cx(
            "flex items-center justify-center gap-1 rounded-pill bg-blanc text-xs font-semibold ring-1 ring-brume ring-inset hover:bg-lime-clair disabled:opacity-40",
            compact ? "size-8" : "h-9 px-3",
          )}
        >
          <Icon name={icon} className="size-3.5" />
          {!compact && label}
        </button>
      </form>
    ));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3.5 rounded-[20px] bg-lime-clair/40 p-3.5 ring-1 ring-lime/40">
        <ScoreRing value={filled} max={total} label={`${filled}/${total}`} size={52} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-sm leading-[1.35] font-semibold">
            {filled === total ? t("progress.done") : t("progress.todo", { count: total - filled })}
          </p>
          <p className="text-xs text-ardoise">{t("progress.hint")}</p>
        </div>
      </div>

      <h2 id="cv-sections" className="sr-only">
        {t("sections")}
      </h2>
      <ul aria-labelledby="cv-sections" className="flex flex-col gap-1.5">
        {sections.map((section, index) => {
          const name = t(`section.${section.id}`);
          return (
            <li key={section.id} className="jm-cv-row relative">
              <details
                name="cv-section"
                data-section={section.id}
                open={section.id === "summary" ? true : undefined}
                className="group rounded-[20px] open:bg-blanc open:shadow-[0_18px_40px_-22px_rgb(15_63_55/0.45)] open:ring-1 open:ring-sapin/8"
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-[20px] p-2.5 hover:bg-creme group-open:hover:bg-transparent [&::-webkit-details-marker]:hidden">
                  <span
                    aria-hidden
                    className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-lime-clair text-sapin group-open:bg-sapin group-open:text-lime"
                  >
                    <Icon
                      name={section.visible ? sectionIcons[section.id] : "eye-off"}
                      className="size-4"
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={cx(
                        "text-sm font-semibold",
                        !section.visible && "text-ardoise line-through",
                      )}
                    >
                      {name}
                    </span>
                    <span className="truncate text-xs text-ardoise">{sub(section)}</span>
                  </span>
                  {section.filled ? (
                    <span className="jm-cv-row-badge grid size-6 shrink-0 place-items-center rounded-full bg-lime">
                      <Icon name="check" label={t("saved")} className="size-3.5" />
                    </span>
                  ) : (
                    <span className="jm-cv-row-badge shrink-0 rounded-pill bg-ambre-fond px-2.5 py-1 text-[11px] font-semibold text-ambre-texte">
                      {t("section.toComplete")}
                    </span>
                  )}
                </summary>
                <div className="flex flex-col gap-3 px-3 pb-3.5">
                  <div className="flex flex-wrap gap-1.5">
                    {orderButtons(section, index, false)}
                  </div>
                  {section.id === "summary" ? (
                    profileForm
                  ) : (
                    <Link
                      href={`/app/profil#${profileAnchors[section.id]}`}
                      className="inline-flex min-h-11 items-center gap-1.5 self-start text-[13px] font-semibold text-up-texte hover:underline lg:min-h-0"
                    >
                      <Icon name="edit" className="size-4" />
                      {t("section.editInProfile")}
                    </Link>
                  )}
                </div>
              </details>
              {/* Pointer only: on hover, the order buttons of a closed section (keyboard: inside). */}
              <div className="jm-cv-row-tools absolute top-1/2 right-2.5 -translate-y-1/2 gap-1">
                {orderButtons(section, index, true)}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="relative isolate flex flex-wrap items-center gap-3 overflow-hidden rounded-[20px] bg-[image:var(--jm-degrade-profondeur)] p-4 text-blanc">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm font-semibold">{t("profileCard.title")}</p>
          <p className="text-xs leading-[1.45] text-blanc/80">{t("profileCard.body")}</p>
        </div>
        <form action={refreshCvFromProfile}>
          <input type="hidden" name="id" value={id} />
          <button type="submit" className={pillClass("lime", "sm", "h-11 lg:h-9")}>
            <Icon name="profil" className="size-4" />
            {t("profileCard.cta")}
          </button>
        </form>
      </div>
    </div>
  );
}
