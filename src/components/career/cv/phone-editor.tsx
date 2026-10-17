import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { languageName } from "@/lib/dates";
import { changeCvSection, refreshCvFromProfile } from "@/server/actions/cv";
import type { CvContent, CvPhonePart, CvSectionId } from "@/server/services/cv";
import { sectionIcons } from "./editor";
import { phoneCta } from "./phone-list";
import { PdfButton } from "./pdf-button";

export type CvPhoneView = "content" | "style" | "preview";

/** Where each part is written in the profile (the CV content comes from it). */
const profileParts: Record<CvSectionId, string> = {
  summary: "resume",
  experience: "experiences",
  education: "formations",
  skills: "competences",
  languages: "langues",
};

/** « Contenu · Mise en forme · Aperçu » (screens 28, 29): three links, the current one raised. */
export async function PhoneEditorTabs({ id, view }: { id: string; view: CvPhoneView }) {
  const t = await getTranslations("career.cv.phone");
  const tabs = [
    ["content", `/app/career/cv/${id}`],
    ["style", `/app/career/cv/${id}?vue=style`],
    ["preview", `/app/career/cv/${id}?vue=apercu`],
  ] as const;
  return (
    <nav
      aria-label={t("tabs")}
      className="grid grid-cols-3 gap-1 rounded-pill bg-[#E7E2D8] p-1 md:hidden"
    >
      {tabs.map(([key, href]) => (
        <Link
          key={key}
          href={href}
          aria-current={view === key ? "page" : undefined}
          className="flex h-12 items-center justify-center rounded-pill text-[16px] font-medium text-sapin/80 aria-[current=page]:bg-blanc aria-[current=page]:font-semibold aria-[current=page]:text-sapin aria-[current=page]:shadow-douce"
        >
          {t(`tab.${key}`)}
        </Link>
      ))}
    </nav>
  );
}

export type PhonePartChip = { key: CvPhonePart; label: string; filled: boolean };

/** The parts as chips: a ✓ once filled, the open one in Sapin. */
export async function PhonePartChips({
  id,
  part,
  parts,
}: {
  id: string;
  part: CvPhonePart;
  parts: PhonePartChip[];
}) {
  const t = await getTranslations("career.cv.phone");
  return (
    <nav aria-label={t("parts")} className="-mx-4 overflow-x-auto px-4 md:hidden">
      <ul className="flex w-max gap-2">
        {parts.map((chip) => (
          <li key={chip.key}>
            <Link
              href={`/app/career/cv/${id}?partie=${chip.key}`}
              aria-current={chip.key === part ? "page" : undefined}
              className="flex h-12 items-center gap-2 rounded-pill bg-blanc px-5 text-[16px] font-medium shadow-douce aria-[current=page]:bg-sapin aria-[current=page]:text-blanc"
            >
              {chip.filled && chip.key !== part && <Icon name="check" className="size-4" />}
              {chip.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const years = (start: string, end: string | null, present: string) =>
  [start.slice(0, 4), end ? end.slice(0, 4) : present]
    .filter((value, index, all) => index === 0 || value !== all[0])
    .join(" – ");

/**
 * One section of the CV, read from the profile: its items, « Modifier dans mon profil », its place
 * and visibility on the document, and « Mettre à jour depuis mon profil ».
 */
export async function PhoneSection({
  id,
  section,
  content,
  visible,
  first,
  last,
}: {
  id: string;
  section: Exclude<CvSectionId, "summary">;
  content: CvContent;
  visible: boolean;
  first: boolean;
  last: boolean;
}) {
  const t = await getTranslations("career.cv");
  const tProfile = await getTranslations("talent.profile");
  const name = t(`section.${section}`);
  const items: { key: string; title: string; detail: string; body?: ReactNode }[] =
    section === "experience"
      ? content.experiences.map((item, index) => ({
          key: `${index}`,
          title: item.title,
          detail: [item.company, years(item.start, item.end, t("phone.present"))]
            .filter(Boolean)
            .join(" · "),
          body:
            item.bullets.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-[15px] font-semibold">{t("phone.missions")}</p>
                <ul className="flex list-disc flex-col gap-1 rounded-[18px] bg-creme py-3 pr-4 pl-8 text-[15px] leading-6">
                  {item.bullets.map((bullet, line) => (
                    <li key={line}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ) : undefined,
        }))
      : section === "education"
        ? content.education.map((item, index) => ({
            key: `${index}`,
            title: item.degree,
            detail: [item.school, item.endYear ?? item.startYear].filter(Boolean).join(" · "),
          }))
        : section === "skills"
          ? content.skills.map((item) => ({ key: item.name, title: item.name, detail: "" }))
          : content.languages.map((item) => ({
              key: item.code,
              title: languageName(item.code),
              detail: [dynamic(tProfile)(`languages.level.${item.level}`), item.cefr]
                .filter(Boolean)
                .join(" · "),
            }));
  const tools = (
    [
      ["up", t("section.moveUp"), first, "chev-d"],
      ["down", t("section.moveDown"), last, "chev-d"],
      [
        "toggle",
        visible ? t("section.hide") : t("section.show"),
        false,
        visible ? "eye-off" : "eye",
      ],
    ] as const
  ).map(([move, label, disabled, icon]) => (
    <form key={move} action={changeCvSection}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="section" value={section} />
      <input type="hidden" name="move" value={move} />
      <input type="hidden" name="partie" value={section} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={[label, name].join(" · ")}
        className="grid size-11 place-items-center rounded-full bg-blanc shadow-douce disabled:opacity-40"
      >
        <Icon name={icon} className={cx("size-4", move === "up" && "rotate-180")} />
      </button>
    </form>
  ));

  return (
    <section aria-labelledby="cv-phone-part" className="flex flex-col gap-3 md:hidden">
      <div className="flex items-center gap-3">
        <h2
          id="cv-phone-part"
          className="flex min-w-0 flex-1 items-center gap-2 text-[18px] font-bold"
        >
          <Icon name={sectionIcons[section]} className="size-5 shrink-0" />
          <span className={cx("truncate", !visible && "text-ardoise line-through")}>{name}</span>
        </h2>
        <div className="flex gap-1.5">{tools}</div>
      </div>
      {!visible && <p className="text-[14px] text-ardoise">{t("phone.hidden")}</p>}
      {items.length === 0 ? (
        <p className="rounded-[20px] bg-blanc px-5 py-4 text-[15px] text-ardoise shadow-douce">
          {t("phone.empty")}
        </p>
      ) : section === "skills" ? (
        <ul className="flex flex-wrap gap-2 rounded-[22px] bg-blanc p-4 shadow-douce">
          {items.map((item) => (
            <li key={item.key} className="rounded-pill bg-creme px-3.5 py-1.5 text-[15px]">
              {item.title}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li key={item.key}>
              <details
                open={index === 0 && Boolean(item.body)}
                className="group rounded-[22px] bg-blanc shadow-douce"
              >
                <summary className="flex min-h-[72px] cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[17px] font-semibold">{item.title}</span>
                    {item.detail && (
                      <span className="truncate text-[15px] text-ardoise">{item.detail}</span>
                    )}
                  </span>
                  {item.body && (
                    <Icon
                      name="chev-d"
                      className="size-5 shrink-0 transition group-open:rotate-180"
                    />
                  )}
                </summary>
                {item.body && <div className="px-5 pb-5">{item.body}</div>}
              </details>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={`/app/profil?partie=${profileParts[section]}`}
        className="flex h-14 items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-brume text-[16px] font-semibold"
      >
        <Icon name="edit" className="size-4" />
        {t("section.editInProfile")}
      </Link>
      <form action={refreshCvFromProfile}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="partie" value={section} />
        <button
          type="submit"
          className="flex min-h-11 items-center gap-2 text-[15px] font-semibold text-feuille-fonce"
        >
          <Icon name="profil" className="size-4" />
          {t("phone.refresh")}
        </button>
      </form>
    </section>
  );
}

/**
 * The fixed bar of the phone editor: « Enregistré » and « Section suivante » while writing, the
 * share sheet and the PDF on the layout and the preview.
 */
export async function PhoneEditorBar({
  id,
  view,
  next,
  fileName,
  locked,
}: {
  id: string;
  view: CvPhoneView;
  next: string;
  fileName: string;
  locked: boolean;
}) {
  const t = await getTranslations("career.cv.phone");
  const labels = {
    preparing: t("preparing"),
    preparingLabel: t("preparingLabel"),
    done: t("downloaded"),
    error: t("pdfError"),
  };
  return (
    <>
      <div aria-hidden className="h-20 md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-brume bg-creme/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        {view === "content" ? (
          <>
            <p className="flex shrink-0 items-center gap-1.5 text-[15px] font-semibold text-feuille-fonce">
              <Icon name="check" className="size-4" />
              {t("saved")}
            </p>
            <Link href={next} className={cx(phoneCta, "h-14 min-w-0 flex-1 text-[17px]")}>
              {t("next")}
              <Icon name="chev-r" className="size-5" />
            </Link>
          </>
        ) : locked ? (
          <Link
            href={`/app/career/cv/${id}/pdf`}
            className={cx(phoneCta, "h-14 flex-1 text-[17px]")}
          >
            {t("download")}
          </Link>
        ) : (
          <>
            <PdfButton
              documentId={id}
              fileName={fileName}
              mode="share"
              raised
              labels={{ ...labels, done: t("shared") }}
              className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-pill bg-blanc px-5 text-[17px] font-semibold shadow-douce"
            >
              <Icon name="partager" className="size-5" />
              {t("share")}
            </PdfButton>
            <PdfButton
              documentId={id}
              fileName={fileName}
              raised
              labels={labels}
              className={cx(phoneCta, "h-14 min-w-0 flex-1 px-4 text-[17px]")}
            >
              <Icon name="telecharger" className="size-5 shrink-0" />
              <span className="truncate">{t("download")}</span>
            </PdfButton>
          </>
        )}
      </div>
    </>
  );
}
