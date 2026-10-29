"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { showToast } from "@/components/motion/toaster";
import { documentFromCv } from "@/features/cv/render/build";
import { CvPaginationProvider, CvPreview } from "@/features/cv/render/CvPreview";
import { labelsFromData, type CvLabelData } from "@/features/cv/render/labels-data";
import type { CvStyle } from "@/features/cv/style";
import type { CvTemplate } from "@/features/cv/templates/registry";
import {
  decideCvSummaryAction,
  fillCvFromProfileAction,
  rewriteCvSummaryAction,
  saveCvContentAction,
} from "@/server/actions/cv-flow";
import type { CvContent } from "@/server/services/cv";
import { PROFILE_PALETTE } from "@/lib/profile-colors";
import { PhoneIcon } from "../icon";
import { CvFrame } from "./frame";
import { OrbiSpark } from "./marks";

/** The blocks of « Mes informations », in the order Ephraïm gave (29/10). */
const BLOCKS = [
  "identity",
  "summary",
  "achievements",
  "skills",
  "experience",
  "education",
  "languages",
  "references",
] as const;
type Block = (typeof BLOCKS)[number];

const COLORS: Record<Block, string> = {
  identity: "var(--nb-lime)",
  summary: "var(--nb-menthe)",
  achievements: "var(--nb-ambre)",
  skills: PROFILE_PALETTE.ciel,
  experience: PROFILE_PALETTE.corail,
  education: PROFILE_PALETTE.lilas,
  languages: "var(--nb-menthe)",
  references: "var(--nb-brume)",
};

const LANGUAGE_LEVELS = ["native", "fluent", "professional", "intermediate", "basic"] as const;
const SAVE_DELAY_MS = 1200;

type Option = { value: string; label: string };
type Status = "saved" | "saving" | "waiting" | "error";

/** Each block's visibility on the CV: a CV section, or one of the blocks added on 29/10. */
function shown(content: CvContent, block: Block) {
  if (block === "identity") return true;
  if (block === "achievements" || block === "references")
    return !content.hiddenExtras.includes(block);
  return content.sections.find((section) => section.id === block)?.visible ?? true;
}

function withShown(content: CvContent, block: Block, on: boolean): CvContent {
  if (block === "identity") return content;
  if (block === "achievements" || block === "references") {
    const hidden = new Set(content.hiddenExtras);
    if (on) hidden.delete(block);
    else hidden.add(block);
    return { ...content, hiddenExtras: [...hidden] };
  }
  return {
    ...content,
    sections: content.sections.map((section) =>
      section.id === block ? { ...section, visible: on } : section,
    ),
  };
}

/**
 * Mes informations (Ephraïm, 29/10): after the template, everything the CV prints in blocks —
 * identity and contacts, professional profile, achievements, skills, experiences, education,
 * languages, references — already filled from the profile and editable on the spot. The CV
 * fills in above while the talent types; changes are saved on this CV only (the profile stays
 * as it is), then « Continuer » opens the preview.
 */
export function CvFormStep({
  cvId,
  initial,
  fromProfile,
  labels: labelData,
  template,
  style,
  photoUrl,
  languages: languageOptions,
  countries,
  steps,
}: {
  cvId: string;
  initial: CvContent;
  /** Achievements taken from the portfolio, offered while the CV has none. */
  fromProfile: { achievements: string[] };
  labels: CvLabelData;
  template: CvTemplate;
  style: CvStyle;
  photoUrl: string | null;
  languages: Option[];
  countries: Option[];
  steps: ComponentProps<typeof CvFrame>["steps"];
}) {
  const t = useTranslations("phoneCv");
  const router = useRouter();
  const [content, setContent] = useState<CvContent>(() =>
    initial.achievements.length === 0 && fromProfile.achievements.length > 0
      ? { ...initial, achievements: fromProfile.achievements }
      : initial,
  );
  const [open, setOpen] = useState<Block | null>("identity");
  const [status, setStatus] = useState<Status>("saved");
  const [large, setLarge] = useState(false);
  const [pending, start] = useTransition();
  const [suggestion, setSuggestion] = useState<{ id: string; text: string } | null>(null);
  const [skill, setSkill] = useState("");
  const latest = useRef(content);
  const timer = useRef<number | null>(null);
  const dirty = useRef(false);

  const labels = useMemo(() => labelsFromData(labelData), [labelData]);
  const data = useMemo(
    () => documentFromCv(content, labels, photoUrl),
    [content, labels, photoUrl],
  );

  const save = async () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    if (!dirty.current) return true;
    dirty.current = false;
    setStatus("saving");
    const result = await saveCvContentAction(cvId, latest.current);
    if (!result.ok) {
      dirty.current = true;
      setStatus("error");
      return false;
    }
    setStatus(dirty.current ? "waiting" : "saved");
    return true;
  };

  const change = (next: CvContent) => {
    latest.current = next;
    dirty.current = true;
    setContent(next);
    setStatus("waiting");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void save(), SAVE_DELAY_MS);
  };

  // Achievements taken from the portfolio are saved with the first change, or on Continuer.
  useEffect(() => {
    if (latest.current !== initial) dirty.current = true;
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [initial]);

  const fail = (message = t("error")) => showToast({ message, tone: "error" });

  const next = () =>
    start(async () => {
      if (await save()) router.push(`/app/career/cv/${cvId}?etape=apercu`);
      else fail(t("form.saveError"));
    });

  const refill = () =>
    start(async () => {
      if (!(await save())) return fail(t("form.saveError"));
      const result = await fillCvFromProfileAction(cvId);
      if (!result.ok)
        return fail(result.error === "profile" ? t("preview.fillNothing") : t("error"));
      showToast({ message: t("preview.filled") });
      router.refresh();
    });

  const rewrite = () =>
    start(async () => {
      if (!(await save())) return fail(t("form.saveError"));
      const result = await rewriteCvSummaryAction(cvId);
      if (result.ok) setSuggestion(result.suggestion);
      else
        fail(
          t.has(`content.orbiError.${result.error}` as "content.orbiError.same")
            ? t(`content.orbiError.${result.error}` as "content.orbiError.same")
            : t("error"),
        );
    });

  const decide = (decision: "applied" | "ignored") => {
    if (!suggestion) return;
    const text = suggestion.text;
    setSuggestion(null);
    start(async () => {
      const result = await decideCvSummaryAction({ suggestion: suggestion.id, decision });
      if (!result.ok) return fail();
      if (decision === "applied") {
        latest.current = { ...latest.current, summary: text };
        setContent(latest.current);
      }
      showToast({ message: decision === "applied" ? t("content.kept") : t("content.refused") });
    });
  };

  const set = <K extends keyof CvContent>(key: K, value: CvContent[K]) =>
    change({ ...latest.current, [key]: value });
  const setInfo = (patch: Partial<CvContent["info"]>) =>
    set("info", { ...latest.current.info, ...patch });
  const setAt = <K extends "experiences" | "education" | "references" | "languages">(
    key: K,
    index: number,
    patch: Partial<CvContent[K][number]>,
  ) =>
    set(
      key,
      latest.current[key].map((item, at) =>
        at === index ? { ...item, ...patch } : item,
      ) as CvContent[K],
    );
  const removeAt = <K extends "experiences" | "education" | "references" | "languages" | "skills">(
    key: K,
    index: number,
  ) => set(key, latest.current[key].filter((_, at) => at !== index) as CvContent[K]);

  const addSkill = () => {
    const name = skill.trim();
    if (!name) return;
    if (!latest.current.skills.some((item) => item.name.toLowerCase() === name.toLowerCase()))
      set("skills", [...latest.current.skills, { name, level: 2 }]);
    setSkill("");
  };

  const count: Record<Block, string> = {
    identity: [content.info.headline, content.info.city].filter(Boolean).join(" · "),
    summary: content.summary ? t("form.written") : t("form.toWrite"),
    achievements: t("form.count", { count: content.achievements.filter(Boolean).length }),
    skills: t("form.count", { count: content.skills.length }),
    experience: t("form.count", { count: content.experiences.length }),
    education: t("form.count", { count: content.education.length }),
    languages: t("form.count", { count: content.languages.length }),
    references: t("form.count", { count: content.references.length }),
  };

  const field = (id: string, label: string, input: ReactNode, hint?: string, wide = true) => (
    <div className="nb-cvf-champ" data-large={wide ? "" : undefined}>
      <label htmlFor={id}>{label}</label>
      {input}
      {hint ? <small>{hint}</small> : null}
    </div>
  );

  const body = (block: Block): ReactNode => {
    switch (block) {
      case "identity":
        return (
          <div className="nb-cvf-grille">
            {field(
              "cvf-nom",
              t("form.name"),
              <input
                id="cvf-nom"
                value={content.info.name}
                maxLength={120}
                autoComplete="name"
                onChange={(event) => setInfo({ name: event.target.value })}
              />,
            )}
            {field(
              "cvf-titre",
              t("form.headline"),
              <input
                id="cvf-titre"
                value={content.info.headline}
                maxLength={160}
                placeholder={t("form.headlinePlaceholder")}
                onChange={(event) => setInfo({ headline: event.target.value })}
              />,
            )}
            {field(
              "cvf-email",
              t("form.email"),
              <input
                id="cvf-email"
                type="email"
                value={content.info.email}
                maxLength={200}
                autoComplete="email"
                onChange={(event) => setInfo({ email: event.target.value })}
              />,
            )}
            <label className="nb-cvf-case">
              <input
                type="checkbox"
                checked={content.info.showEmail}
                onChange={(event) => setInfo({ showEmail: event.target.checked })}
              />
              {t("form.showEmail")}
            </label>
            {field(
              "cvf-tel",
              t("form.phone"),
              <input
                id="cvf-tel"
                type="tel"
                value={content.info.phone}
                maxLength={40}
                autoComplete="tel"
                onChange={(event) => setInfo({ phone: event.target.value })}
              />,
              t("form.phoneHint"),
            )}
            {field(
              "cvf-ville",
              t("form.city"),
              <input
                id="cvf-ville"
                value={content.info.city}
                maxLength={120}
                onChange={(event) => setInfo({ city: event.target.value })}
              />,
              undefined,
              false,
            )}
            {field(
              "cvf-pays",
              t("form.country"),
              <select
                id="cvf-pays"
                value={content.info.country}
                onChange={(event) => setInfo({ country: event.target.value })}
              >
                <option value="">{t("form.none")}</option>
                {countries.some((option) => option.value === content.info.country) ||
                !content.info.country ? null : (
                  <option value={content.info.country}>{content.info.country}</option>
                )}
                {countries.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>,
              undefined,
              false,
            )}
          </div>
        );
      case "summary":
        return (
          <>
            {suggestion ? (
              <div
                className="nb-cv-resume"
                data-orbi=""
                role="group"
                aria-label={t("content.proposal")}
              >
                <small>{t("content.proposal")}</small>
                <p>{suggestion.text}</p>
                <div className="nb-cv-deux">
                  <button
                    type="button"
                    className="nb-bouton"
                    data-contour=""
                    onClick={() => decide("ignored")}
                    disabled={pending}
                  >
                    {t("content.refuse")}
                  </button>
                  <button
                    type="button"
                    className="nb-bouton"
                    data-plein=""
                    onClick={() => decide("applied")}
                    disabled={pending}
                  >
                    {t("content.keep")}
                  </button>
                </div>
              </div>
            ) : null}
            {field(
              "cvf-resume",
              t("form.summary"),
              <textarea
                id="cvf-resume"
                rows={5}
                maxLength={1500}
                value={content.summary}
                placeholder={t("content.summaryEmpty")}
                onChange={(event) => set("summary", event.target.value)}
              />,
              t("content.summaryHint"),
            )}
            <button type="button" className="nb-cvf-orbi" onClick={rewrite} disabled={pending}>
              <OrbiSpark size={14} />
              {t("content.rewrite")}
            </button>
          </>
        );
      case "achievements":
        return (
          <>
            <p className="nb-cvf-aide">{t("form.achievementsHint")}</p>
            <ul className="nb-cvf-lignes">
              {content.achievements.map((line, index) => (
                <li key={index}>
                  <input
                    aria-label={t("form.achievement", { n: index + 1 })}
                    value={line}
                    maxLength={300}
                    placeholder={t("form.achievementPlaceholder")}
                    onChange={(event) =>
                      set(
                        "achievements",
                        latest.current.achievements.map((item, at) =>
                          at === index ? event.target.value : item,
                        ),
                      )
                    }
                  />
                  <Remove
                    label={t("form.remove")}
                    onClick={() =>
                      set(
                        "achievements",
                        latest.current.achievements.filter((_, at) => at !== index),
                      )
                    }
                  />
                </li>
              ))}
            </ul>
            {content.achievements.length < 12 ? (
              <Add
                label={t("form.addAchievement")}
                onClick={() => set("achievements", [...latest.current.achievements, ""])}
              />
            ) : null}
          </>
        );
      case "skills":
        return (
          <>
            <ul className="nb-cvf-competences">
              {content.skills.map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  <b>{item.name}</b>
                  <select
                    aria-label={t("form.skillLevel", { name: item.name })}
                    value={item.level}
                    onChange={(event) =>
                      set(
                        "skills",
                        latest.current.skills.map((entry, at) =>
                          at === index ? { ...entry, level: Number(event.target.value) } : entry,
                        ),
                      )
                    }
                  >
                    {[1, 2, 3, 4].map((value) => (
                      <option key={value} value={value}>
                        {labelData.levels[value as 1 | 2 | 3 | 4]}
                      </option>
                    ))}
                  </select>
                  <Remove
                    label={t("form.removeNamed", { name: item.name })}
                    onClick={() => removeAt("skills", index)}
                  />
                </li>
              ))}
            </ul>
            <form
              className="nb-cvf-ajout"
              onSubmit={(event) => {
                event.preventDefault();
                addSkill();
              }}
            >
              <input
                aria-label={t("form.skillNew")}
                placeholder={t("form.skillNew")}
                value={skill}
                maxLength={80}
                onChange={(event) => setSkill(event.target.value)}
              />
              <button type="submit" className="nb-bouton" data-contour="" disabled={!skill.trim()}>
                {t("form.add")}
              </button>
            </form>
          </>
        );
      case "experience":
        return (
          <>
            {content.experiences.map((item, index) => (
              <fieldset key={index} className="nb-cvf-fiche">
                <legend>
                  {item.title || t("form.experienceNew")}
                  <Remove label={t("form.remove")} onClick={() => removeAt("experiences", index)} />
                </legend>
                <div className="nb-cvf-grille">
                  {field(
                    `cvf-xp-${index}-titre`,
                    t("form.jobTitle"),
                    <input
                      id={`cvf-xp-${index}-titre`}
                      value={item.title}
                      maxLength={160}
                      onChange={(event) =>
                        setAt("experiences", index, { title: event.target.value })
                      }
                    />,
                  )}
                  {field(
                    `cvf-xp-${index}-org`,
                    t("form.company"),
                    <input
                      id={`cvf-xp-${index}-org`}
                      value={item.company}
                      maxLength={160}
                      onChange={(event) =>
                        setAt("experiences", index, { company: event.target.value })
                      }
                    />,
                    undefined,
                    false,
                  )}
                  {field(
                    `cvf-xp-${index}-lieu`,
                    t("form.place"),
                    <input
                      id={`cvf-xp-${index}-lieu`}
                      value={item.location}
                      maxLength={120}
                      onChange={(event) =>
                        setAt("experiences", index, { location: event.target.value })
                      }
                    />,
                    undefined,
                    false,
                  )}
                  {field(
                    `cvf-xp-${index}-debut`,
                    t("form.start"),
                    <input
                      id={`cvf-xp-${index}-debut`}
                      type="month"
                      value={item.start}
                      onChange={(event) =>
                        setAt("experiences", index, { start: event.target.value })
                      }
                    />,
                    undefined,
                    false,
                  )}
                  {field(
                    `cvf-xp-${index}-fin`,
                    t("form.end"),
                    <input
                      id={`cvf-xp-${index}-fin`}
                      type="month"
                      value={item.end ?? ""}
                      disabled={item.end === null}
                      onChange={(event) =>
                        setAt("experiences", index, { end: event.target.value || null })
                      }
                    />,
                    undefined,
                    false,
                  )}
                  <label className="nb-cvf-case">
                    <input
                      type="checkbox"
                      checked={item.end === null}
                      onChange={(event) =>
                        setAt("experiences", index, {
                          end: event.target.checked ? null : new Date().toISOString().slice(0, 7),
                        })
                      }
                    />
                    {t("form.current")}
                  </label>
                  {field(
                    `cvf-xp-${index}-puces`,
                    t("form.bullets"),
                    <textarea
                      id={`cvf-xp-${index}-puces`}
                      rows={4}
                      value={item.bullets.join("\n")}
                      onChange={(event) =>
                        setAt("experiences", index, {
                          bullets: event.target.value.split("\n").slice(0, 12),
                        })
                      }
                    />,
                    t("form.bulletsHint"),
                  )}
                </div>
              </fieldset>
            ))}
            {content.experiences.length < 20 ? (
              <Add
                label={t("form.addExperience")}
                onClick={() =>
                  set("experiences", [
                    ...latest.current.experiences,
                    { title: "", company: "", location: "", start: "", end: null, bullets: [] },
                  ])
                }
              />
            ) : null}
          </>
        );
      case "education":
        return (
          <>
            {content.education.map((item, index) => (
              <fieldset key={index} className="nb-cvf-fiche">
                <legend>
                  {item.degree || t("form.educationNew")}
                  <Remove label={t("form.remove")} onClick={() => removeAt("education", index)} />
                </legend>
                <div className="nb-cvf-grille">
                  {field(
                    `cvf-fo-${index}-diplome`,
                    t("form.degree"),
                    <input
                      id={`cvf-fo-${index}-diplome`}
                      value={item.degree}
                      maxLength={160}
                      onChange={(event) =>
                        setAt("education", index, { degree: event.target.value })
                      }
                    />,
                  )}
                  {field(
                    `cvf-fo-${index}-ecole`,
                    t("form.school"),
                    <input
                      id={`cvf-fo-${index}-ecole`}
                      value={item.school}
                      maxLength={160}
                      onChange={(event) =>
                        setAt("education", index, { school: event.target.value })
                      }
                    />,
                  )}
                  {field(
                    `cvf-fo-${index}-debut`,
                    t("form.startYear"),
                    <Year
                      id={`cvf-fo-${index}-debut`}
                      value={item.startYear}
                      onChange={(value) => setAt("education", index, { startYear: value })}
                    />,
                    undefined,
                    false,
                  )}
                  {field(
                    `cvf-fo-${index}-fin`,
                    t("form.endYear"),
                    <Year
                      id={`cvf-fo-${index}-fin`}
                      value={item.endYear}
                      onChange={(value) => setAt("education", index, { endYear: value })}
                    />,
                    undefined,
                    false,
                  )}
                </div>
              </fieldset>
            ))}
            {content.education.length < 15 ? (
              <Add
                label={t("form.addEducation")}
                onClick={() =>
                  set("education", [
                    ...latest.current.education,
                    { degree: "", school: "", field: "", startYear: null, endYear: null },
                  ])
                }
              />
            ) : null}
          </>
        );
      case "languages":
        return (
          <>
            <ul className="nb-cvf-lignes">
              {content.languages.map((item, index) => (
                <li key={index}>
                  <select
                    aria-label={t("form.language", { n: index + 1 })}
                    value={item.code}
                    onChange={(event) => setAt("languages", index, { code: event.target.value })}
                  >
                    {languageOptions.some((option) => option.value === item.code) ? null : (
                      <option value={item.code}>{labels.languageName(item.code)}</option>
                    )}
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={t("form.languageLevel", { n: index + 1 })}
                    value={item.level}
                    onChange={(event) =>
                      setAt("languages", index, { level: event.target.value, cefr: undefined })
                    }
                  >
                    {LANGUAGE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {labelData.languageLevels[level]}
                      </option>
                    ))}
                  </select>
                  <Remove label={t("form.remove")} onClick={() => removeAt("languages", index)} />
                </li>
              ))}
            </ul>
            {content.languages.length < 12 ? (
              <Add
                label={t("form.addLanguage")}
                onClick={() => {
                  const used = new Set(latest.current.languages.map((item) => item.code));
                  const code =
                    languageOptions.find((option) => !used.has(option.value))?.value ?? "fr";
                  set("languages", [...latest.current.languages, { code, level: "intermediate" }]);
                }}
              />
            ) : null}
          </>
        );
      case "references":
        return (
          <>
            <p className="nb-cvf-aide">{t("form.referencesHint")}</p>
            {content.references.map((item, index) => (
              <fieldset key={index} className="nb-cvf-fiche">
                <legend>
                  {item.name || t("form.referenceNew")}
                  <Remove label={t("form.remove")} onClick={() => removeAt("references", index)} />
                </legend>
                <div className="nb-cvf-grille">
                  {field(
                    `cvf-ref-${index}-nom`,
                    t("form.referenceName"),
                    <input
                      id={`cvf-ref-${index}-nom`}
                      value={item.name}
                      maxLength={120}
                      onChange={(event) => setAt("references", index, { name: event.target.value })}
                    />,
                  )}
                  {field(
                    `cvf-ref-${index}-role`,
                    t("form.referenceRole"),
                    <input
                      id={`cvf-ref-${index}-role`}
                      value={item.role}
                      maxLength={160}
                      placeholder={t("form.referenceRolePlaceholder")}
                      onChange={(event) => setAt("references", index, { role: event.target.value })}
                    />,
                  )}
                  {field(
                    `cvf-ref-${index}-contact`,
                    t("form.referenceContact"),
                    <input
                      id={`cvf-ref-${index}-contact`}
                      value={item.contact}
                      maxLength={160}
                      onChange={(event) =>
                        setAt("references", index, { contact: event.target.value })
                      }
                    />,
                    t("form.referenceContactHint"),
                  )}
                </div>
              </fieldset>
            ))}
            {content.references.length < 6 ? (
              <Add
                label={t("form.addReference")}
                onClick={() =>
                  set("references", [
                    ...latest.current.references,
                    { name: "", role: "", contact: "" },
                  ])
                }
              />
            ) : null}
          </>
        );
    }
  };

  return (
    <CvFrame
      title={t("form.title")}
      sub={t("form.sub")}
      back={{ href: steps?.hrefs.modele ?? "/app/career/cv", label: t("back") }}
      steps={steps}
      className="nb-cvf"
      bottom={
        <button
          type="button"
          className="nb-bouton nb-cv-principal"
          data-plein=""
          data-large=""
          disabled={pending}
          aria-busy={pending}
          onClick={next}
        >
          {t("form.next")}
        </button>
      }
    >
      <div className="nb-cv-orbi">
        <span className="nb-cv-orbi-i" aria-hidden>
          <OrbiSpark size={18} />
        </span>
        <p>
          <b>{t("form.orbiTitle")}</b> {t("form.orbiText")}
        </p>
      </div>
      <button type="button" className="nb-cvf-reprendre" onClick={refill} disabled={pending}>
        <PhoneIcon name="refaire" size={15} />
        {t("form.refill")}
      </button>

      <section
        className="nb-cvf-apercu"
        data-grand={large ? "" : undefined}
        aria-label={t("form.live")}
      >
        <header>
          <b>
            <i aria-hidden />
            {t("form.live")}
          </b>
          <small role="status">{t(`form.status.${status}`)}</small>
          <button type="button" onClick={() => setLarge((value) => !value)} aria-expanded={large}>
            {large ? t("form.smaller") : t("form.larger")}
          </button>
        </header>
        <div className="nb-cvf-page">
          <CvPaginationProvider>
            <CvPreview data={data} template={template} style={style} />
          </CvPaginationProvider>
        </div>
      </section>

      <ul className="nb-cvf-blocs">
        {BLOCKS.map((block, index) => {
          const isOpen = open === block;
          const visible = shown(content, block);
          return (
            <li
              key={block}
              className="nb-cvf-bloc"
              data-ouvert={isOpen ? "" : undefined}
              data-cache={visible ? undefined : ""}
              style={{ "--c": COLORS[block], animationDelay: `${0.04 * index}s` } as CSSProperties}
            >
              <div className="nb-cvf-bloc-h">
                <button
                  type="button"
                  className="nb-cvf-bloc-b"
                  aria-expanded={isOpen}
                  aria-controls={`cvf-bloc-${block}`}
                  onClick={() => setOpen(isOpen ? null : block)}
                >
                  <i className="nb-cv-point" aria-hidden />
                  <span>
                    <b>{t(`form.block.${block}`)}</b>
                    <small>{count[block] || t("form.toWrite")}</small>
                  </span>
                  <em>
                    <PhoneIcon name={isOpen ? "haut" : "modifier"} size={15} />
                    {isOpen ? t("form.close") : t("form.edit")}
                  </em>
                </button>
                {block === "identity" ? null : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={visible}
                    aria-label={t("content.show", { name: t(`form.block.${block}`) })}
                    className="nb-switch"
                    onClick={() => change(withShown(latest.current, block, !visible))}
                  >
                    <span />
                  </button>
                )}
              </div>
              {isOpen ? (
                <div id={`cvf-bloc-${block}`} className="nb-cvf-bloc-c">
                  {body(block)}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="nb-cv-note" data-centre="">
        {t("form.profileStays")}
      </p>
    </CvFrame>
  );
}

function Remove({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="nb-cvf-retirer" aria-label={label} onClick={onClick}>
      <PhoneIcon name="fermer" size={14} stroke={2.2} />
    </button>
  );
}

function Add({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="nb-cvf-plus" onClick={onClick}>
      <PhoneIcon name="plus" size={15} stroke={2.2} />
      {label}
    </button>
  );
}

function Year({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const [text, setText] = useState(value ? String(value) : "");
  return (
    <input
      id={id}
      inputMode="numeric"
      maxLength={4}
      value={text}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
        setText(digits);
        const year = Number(digits);
        onChange(digits.length === 4 && year >= 1950 && year <= 2100 ? year : null);
      }}
    />
  );
}
