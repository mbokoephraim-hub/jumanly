import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { Avatar, Button } from "@/components/ui";
import { cx } from "@/lib/cx";
import { saveApplicationStepAction } from "@/server/actions/jobs";
import { applySteps, type ApplyStep } from "@/server/services/application-draft";
import { SendApplication } from "./send-application";

type Cv = { id: string; title: string; isPrimary: boolean; updatedAt: Date };

/** Fixed action bar of a step; on a computer it sits under the form. */
const bar =
  "fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 flex items-center gap-3 rounded-[22px] bg-blanc p-3 shadow-float md:static md:justify-end md:bg-transparent md:p-0 md:shadow-none";

function Block({
  index,
  title,
  checked,
  children,
}: {
  index: number;
  title: string;
  checked: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-blanc p-4 shadow-douce">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-7 shrink-0 place-items-center rounded-full bg-sapin text-[13px] font-bold text-lime"
        >
          {index}
        </span>
        <h2 className="flex-1 text-[16px] font-semibold">{title}</h2>
        <span className="flex items-center gap-1 rounded-pill bg-lime-clair px-2.5 py-1 text-[12px] font-semibold text-feuille-fonce">
          <Icon name="check" className="size-3.5" />
          {checked}
        </span>
      </div>
      {children}
    </section>
  );
}

function EditLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="jm-press flex min-h-11 items-center gap-1.5 self-start rounded-pill bg-creme px-4 text-[14px] font-semibold ring-[1.5px] ring-brume ring-inset"
    >
      <Icon name="edit" className="size-4" />
      {label}
    </Link>
  );
}

/**
 * The staged application (docs/ux-mobile-talent, prompt 4, screens 09-12) on
 * `/app/jobs/[slug]?postuler=1&etape=…`: CV, letter, review, then sending. Each step saves the
 * draft on the server. There is no « Questions » step: offers carry no questions yet.
 */
export async function ApplyFlow({
  job,
  company,
  step,
  draft,
  cvs,
  person,
}: {
  job: { slug: string; title: string };
  company: string;
  step: ApplyStep;
  draft: {
    cvDocumentId: string | null;
    profileOnly: boolean;
    coverLetter: string;
    updatedAt: Date;
  } | null;
  cvs: Cv[];
  person: {
    name: string;
    image?: string;
    email: string;
    headline: string | null;
    city: string | null;
    skills: string[];
  };
}) {
  const t = await getTranslations("talent.jobs.apply.flow");
  const base = `/app/jobs/${job.slug}`;
  const stepHref = (to: ApplyStep) => `${base}?postuler=1&etape=${to}`;
  // The chosen CV: the draft's, else the main CV, else the profile alone.
  const chosenCv = draft?.profileOnly
    ? null
    : (cvs.find((cv) => cv.id === draft?.cvDocumentId) ?? cvs[0] ?? null);
  const choice = chosenCv ? chosenCv.id : "profil";
  const current = applySteps.indexOf(step);
  const savedLine = draft ? t("saved", { time: draft.updatedAt }) : null;
  const letter = draft?.coverLetter ?? "";
  const words = letter.split(/\s+/).filter(Boolean).length;
  const cvLine = (cv: Cv) => {
    const line = t("cv.updated", { date: cv.updatedAt });
    return cv.isPrimary ? t("cv.primary", { line }) : line;
  };

  const header = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link
          href={base}
          aria-label={t("quit")}
          className="-ml-2 grid size-11 shrink-0 place-items-center rounded-full hover:bg-blanc"
        >
          <Icon name="chev-l" className="size-5" />
        </Link>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{t("title")}</h1>
      </div>
      <p className="text-[14px] text-ardoise">{t("job", { job: job.title, company })}</p>
      <ol aria-label={t("steps")} className="grid grid-cols-3 gap-2">
        {applySteps.map((key, index) => (
          <li
            key={key}
            aria-current={index === current ? "step" : undefined}
            className="flex flex-col gap-1.5"
          >
            <span
              aria-hidden
              className={cx(
                "h-1.5 rounded-pill",
                index < current ? "bg-feuille" : index === current ? "bg-sapin" : "bg-brume",
              )}
            />
            <span
              className={cx(
                "text-[13px]",
                index === current ? "font-semibold text-sapin" : "text-ardoise",
              )}
            >
              {t(`step.${key}`)}
              {index !== current && index < current && (
                <span className="sr-only">{t("stepState.done")}</span>
              )}
              {index === current && <span className="sr-only">{t("stepState.current")}</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
  const saved = savedLine && (
    <p className="flex items-center gap-1.5 text-[13.5px] font-medium text-feuille-fonce">
      <Icon name="check" className="size-4" />
      {savedLine}
    </p>
  );
  const hidden = (
    <>
      <input type="hidden" name="job" value={job.slug} />
      <input type="hidden" name="step" value={step} />
    </>
  );

  if (step === "cv") {
    const options: { value: string; icon: IconName; title: string; line: string }[] = [
      ...cvs.map((cv) => ({
        value: cv.id,
        icon: "doc" as IconName,
        title: cv.title,
        line: cvLine(cv),
      })),
      { value: "profil", icon: "profil", title: t("cv.profile"), line: t("cv.profileLine") },
    ];
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 pb-28 md:pb-0">
        {header}
        <form action={saveApplicationStepAction} className="flex flex-col gap-4">
          {hidden}
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-[24px] leading-tight font-bold tracking-tight">
              {t("cv.title")}
            </legend>
            {options.map((option) => (
              <label
                key={option.value}
                className="group jm-pressable flex min-h-[72px] cursor-pointer items-center gap-3 rounded-[22px] px-4 py-3 has-checked:ring-2 has-checked:ring-sapin has-focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)]"
              >
                <input
                  type="radio"
                  name="cv"
                  value={option.value}
                  defaultChecked={option.value === choice}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-creme group-has-checked:bg-lime"
                >
                  <Icon name={option.icon} className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] leading-snug font-semibold">{option.title}</span>
                  <span className="text-[13px] text-ardoise">{option.line}</span>
                </span>
                <span
                  aria-hidden
                  className="grid size-6 shrink-0 place-items-center rounded-full ring-2 ring-brume group-has-checked:bg-sapin group-has-checked:ring-sapin"
                >
                  <span className="size-2.5 rounded-full bg-blanc opacity-0 group-has-checked:opacity-100" />
                </span>
              </label>
            ))}
          </fieldset>
          {chosenCv && (
            <Link
              href={`/app/career/cv/${chosenCv.id}#adapter`}
              className="jm-pressable flex min-h-14 items-center gap-3 rounded-[22px] px-4 py-3"
            >
              <Icon name="edit" className="size-5 shrink-0" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-semibold">{t("cv.tailor")}</span>
                <span className="text-[13px] text-ardoise">{t("cv.tailorLine")}</span>
              </span>
              <Icon name="chev-r" className="size-4 shrink-0 text-ardoise" />
            </Link>
          )}
          {saved}
          <div className={bar}>
            <Button type="submit" name="next" value="quitter" variant="soft" size="L">
              {t("quit")}
            </Button>
            <Button
              type="submit"
              name="next"
              value="lettre"
              variant="principal"
              size="L"
              arrow
              className="flex-1 md:flex-none"
            >
              {t("continue")}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (step === "lettre") {
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 pb-28 md:pb-0">
        {header}
        <form action={saveApplicationStepAction} className="flex flex-col gap-4">
          {hidden}
          <h2 className="text-[24px] leading-tight font-bold tracking-tight">
            {t("letter.title")}
          </h2>
          <label htmlFor="apply-letter" className="text-[14px] font-semibold">
            {t("letter.label")}
          </label>
          <textarea
            id="apply-letter"
            name="coverLetter"
            rows={10}
            maxLength={5000}
            defaultValue={letter}
            className="rounded-[20px] bg-blanc px-4 py-3 text-[15px] leading-relaxed ring-[1.5px] ring-brume outline-none ring-inset focus:ring-2 focus:ring-sapin"
          />
          {saved}
          <div className={bar}>
            <Button
              type="submit"
              name="next"
              value="cv"
              variant="soft"
              size="L"
              aria-label={t("previous")}
              className="w-12 px-0!"
            >
              <Icon name="chev-l" className="size-5" />
            </Button>
            <Button
              type="submit"
              name="next"
              value="verification"
              variant="principal"
              size="L"
              arrow
              className="flex-1 md:flex-none"
            >
              {t("continue")}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  const tr = await getTranslations("talent.jobs.apply");
  const skillsShown = person.skills.slice(0, 3);
  const lastSave = draft?.updatedAt ?? new Date();
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 pb-28 md:pb-0">
      {header}
      <SendApplication
        hidden={{
          job: job.slug,
          cv: chosenCv?.id ?? "",
          coverLetter: letter,
          staged: "1",
        }}
        previousHref={stepHref("lettre")}
        laterHref={`${base}?brouillon=1`}
        savedAt={t("error.lastSaveValue", { date: lastSave })}
        labels={{
          submit: tr("submit"),
          sending: tr("submitting"),
          previous: t("previous"),
          errorTitle: t("error.title"),
          errorBody: t("error.body"),
          state: t("error.state"),
          draft: t("error.draft"),
          lastSave: t("error.lastSave"),
          later: t("error.later"),
          retry: t("error.retry"),
        }}
      >
        <div className="flex items-center gap-3 rounded-[22px] bg-lime-clair p-4">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-full bg-lime text-sapin"
          >
            <Icon name="check" className="size-5" />
          </span>
          <span className="flex flex-col">
            <span className="text-[16px] font-semibold">{t("review.ready")}</span>
            <span className="text-[13.5px] text-ardoise">{t("review.readyLine")}</span>
          </span>
        </div>

        <Block index={1} title={t("review.cv")} checked={t("review.checked")}>
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-creme"
            >
              <Icon name={chosenCv ? "doc" : "profil"} className="size-5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[15px] font-semibold">
                {chosenCv ? chosenCv.title : t("cv.profile")}
              </span>
              <span className="text-[13px] text-ardoise">
                {chosenCv ? cvLine(chosenCv) : t("cv.profileLine")}
              </span>
            </span>
          </div>
          <EditLink href={stepHref("cv")} label={t("review.change")} />
        </Block>

        <Block index={2} title={t("review.letter")} checked={t("review.checked")}>
          {letter ? (
            <p className="line-clamp-3 text-[14px] leading-relaxed whitespace-pre-line">{letter}</p>
          ) : (
            <p className="text-[14px] text-ardoise">{t("review.noLetter")}</p>
          )}
          <div className="flex items-center justify-between gap-3">
            <EditLink href={stepHref("lettre")} label={t("review.editLetter")} />
            {letter && (
              <span className="text-[13px] text-ardoise">
                {t("review.words", { count: words })}
              </span>
            )}
          </div>
        </Block>

        <Block index={3} title={t("review.profile")} checked={t("review.checked")}>
          <div className="flex items-center gap-3">
            <Avatar name={person.name} image={person.image} size="md" />
            <span className="flex min-w-0 flex-col">
              <span className="text-[15px] font-semibold">{person.name}</span>
              {(person.headline || person.city) && (
                <span className="truncate text-[13px] text-ardoise">
                  {[person.headline, person.city].filter(Boolean).join(" · ")}
                </span>
              )}
            </span>
          </div>
          {skillsShown.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {skillsShown.map((skill) => (
                <li key={skill} className="rounded-pill bg-creme px-3 py-1 text-[13px]">
                  {skill}
                </li>
              ))}
              {person.skills.length > skillsShown.length && (
                <li className="rounded-pill bg-creme px-3 py-1 text-[13px]">
                  {t("review.moreSkills", { count: person.skills.length - skillsShown.length })}
                </li>
              )}
            </ul>
          )}
          <EditLink href="/app/profil" label={t("review.editProfile")} />
          <p className="flex items-center gap-1.5 self-end text-[12.5px] text-ardoise">
            <Icon name="eye" className="size-4" />
            {t("review.seenBy")}
          </p>
        </Block>

        <Block index={4} title={t("review.contact")} checked={t("review.checked")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="min-w-0 truncate text-[14.5px]">{person.email}</span>
            <EditLink href="/app/parametres?onglet=compte" label={t("review.edit")} />
          </div>
        </Block>

        <label className="flex cursor-pointer items-start gap-3 rounded-[22px] bg-blanc p-4 shadow-douce">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-0.5 size-5 shrink-0 accent-sapin"
          />
          <span className="text-[14.5px]">{t("review.consent", { company })}</span>
        </label>
        <p className="text-[13px] text-ardoise">{tr("free")}</p>
        {saved}
      </SendApplication>
    </div>
  );
}
