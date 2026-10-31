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
import { labelsFromData, type CvLabelData } from "@/features/cv/render/labels-data";
import {
  fillCvFromProfileAction,
  rewriteCvTextAction,
  saveCvContentAction,
  validateCvInfoAction,
} from "@/server/actions/cv-flow";
import type { CvContent } from "@/server/services/cv";
import { PROFILE_PALETTE } from "@/lib/profile-colors";
import { ACHIEVEMENTS_SUGGESTED } from "@/lib/achievements";
import { AchievementsField } from "../career/experience-fields";
import { PhoneIcon } from "../icon";
import { CvFrame } from "./frame";
import { OrbiSpark } from "./marks";
import { OrbiChanges, OrbiTools, type OrbiHistory, type OrbiState } from "./orbi-field";

/** The blocks of « Mes informations », in the order Ephraïm gave (29/10, then 31/10). */
export const CV_FORM_BLOCKS = [
  "identity",
  "summary",
  "experience",
  "education",
  "skills",
  "languages",
  "achievements",
  "links",
  "references",
] as const;
type Block = (typeof CV_FORM_BLOCKS)[number];

/**
 * The parts of the form (Ephraïm, 31/10): a few boxes per screen so that none is overloaded;
 * « Suivant » and « Précédent » at the bottom, « Valider mes informations » on the last one.
 */
type PartKey =
  "identity" | "summary" | "experience" | "education" | "skills" | "achievements" | "references";
const PARTS: { key: PartKey; blocks: Block[] }[] = [
  { key: "identity", blocks: ["identity"] },
  { key: "summary", blocks: ["summary"] },
  { key: "experience", blocks: ["experience"] },
  { key: "education", blocks: ["education"] },
  { key: "skills", blocks: ["skills", "languages"] },
  { key: "achievements", blocks: ["achievements", "links"] },
  { key: "references", blocks: ["references"] },
];

/** The parts with boxes Orbi can improve. */
const ORBI_PARTS: PartKey[] = ["identity", "summary", "experience", "achievements"];

const COLORS: Record<Block, string> = {
  identity: "var(--nb-lime)",
  summary: "var(--nb-menthe)",
  achievements: "var(--nb-ambre)",
  links: PROFILE_PALETTE.ciel,
  skills: PROFILE_PALETTE.ciel,
  experience: PROFILE_PALETTE.corail,
  education: PROFILE_PALETTE.lilas,
  languages: "var(--nb-menthe)",
  references: "var(--nb-brume)",
};

const LANGUAGE_LEVELS = ["native", "fluent", "professional", "intermediate", "basic"] as const;
const SAVE_DELAY_MS = 1200;
/** About 95 characters per line of text on an A4 page in the templates. */
const A4_LINE = 95;

type Option = { value: string; label: string };
type Status = "saved" | "saving" | "waiting" | "error";
type Extra = CvContent["hiddenExtras"][number];
const EXTRAS: readonly string[] = ["achievements", "references", "links"];
const isExtra = (block: Block): block is Block & Extra => EXTRAS.includes(block);

/** Each block's visibility on the CV: a CV section, or one of the blocks added later. */
function shown(content: CvContent, block: Block) {
  if (block === "identity") return true;
  if (isExtra(block)) return !content.hiddenExtras.includes(block);
  return content.sections.find((section) => section.id === block)?.visible ?? true;
}

function withShown(content: CvContent, block: Block, on: boolean): CvContent {
  if (block === "identity") return content;
  if (isExtra(block)) {
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

/** Lines a text takes on an A4 page, each paragraph starting a new line. */
export function a4Lines(text: string) {
  return text
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((sum, part) => sum + Math.ceil(part.length / A4_LINE), 0);
}

/** A change Orbi proposed for an offer, shown applied with « Annuler » (mode « Adapter »). */
export type CvProposal = {
  target: {
    section: "headline" | "summary" | "bullet";
    experience: number | null;
    bullet: number | null;
  };
  after: string;
};

/** The content with Orbi's changes for an offer applied, and the history to undo each one. */
function withProposals(initial: CvContent, proposals: CvProposal[]) {
  let content = initial;
  const history: Record<string, OrbiHistory> = {};
  for (const proposal of proposals) {
    const { section, experience, bullet } = proposal.target;
    if (section === "headline") {
      history.headline = { stack: [[content.info.headline], [proposal.after]], at: 1 };
      content = { ...content, info: { ...content.info, headline: proposal.after } };
    } else if (section === "summary") {
      history.summary = { stack: [[content.summary], [proposal.after]], at: 1 };
      content = { ...content, summary: proposal.after };
    } else if (experience !== null && bullet !== null && content.experiences[experience]) {
      const key = `bullets-${experience}`;
      const before = history[key]?.stack[0] ?? content.experiences[experience]!.bullets;
      const bullets = content.experiences[experience]!.bullets.map((text, at) =>
        at === bullet ? proposal.after : text,
      );
      history[key] = { stack: [before, bullets], at: 1 };
      content = {
        ...content,
        experiences: content.experiences.map((item, at) =>
          at === experience ? { ...item, bullets } : item,
        ),
      };
    }
  }
  return { content, history };
}

/** Réalisations of one experience on a CV (12 were allowed before, one per line). */
const CV_BULLETS_MAX = 12;

/**
 * Mes informations (Ephraïm, 29/10 then 31/10): the boxes of the CV, part by part, before any
 * layout: identity and contacts, the bio (no limit, 6 to 8 lines advised), experiences with
 * dates and points, education, skills and languages, achievements and links, references.
 * Filled from the profile or by hand, all editable; saved on this CV only while the talent
 * types. With Pro, Orbi improves each box: its changes are highlighted, with arrows to go back
 * and forth. « Valider mes informations » opens the studio.
 */
export function CvFormStep({
  cvId,
  initial,
  proposals,
  labels: labelData,
  languages: languageOptions,
  countries,
  steps,
  orbi,
  isNew,
}: {
  cvId: string;
  initial: CvContent;
  proposals: CvProposal[];
  labels: CvLabelData;
  languages: Option[];
  countries: Option[];
  steps: ComponentProps<typeof CvFrame>["steps"];
  orbi: OrbiState;
  isNew: boolean;
}) {
  const t = useTranslations("phoneCv");
  const router = useRouter();
  const [start] = useState(() => withProposals(initial, proposals));
  const [content, setContent] = useState<CvContent>(start.content);
  const [history, setHistory] = useState<Record<string, OrbiHistory>>(start.history);
  const [part, setPart] = useState(0);
  const [status, setStatus] = useState<Status>("saved");
  const [pending, run] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [skill, setSkill] = useState("");
  const labels = useMemo(() => labelsFromData(labelData), [labelData]);
  const latest = useRef(content);
  const timer = useRef<number | null>(null);
  const dirty = useRef(proposals.length > 0);
  const top = useRef<HTMLDivElement>(null);
  const suffix = isNew ? "&nouveau=1" : "";

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

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const fail = (message = t("error")) => showToast({ message, tone: "error" });

  const go = (to: number) => {
    setPart(to);
    void save();
    top.current?.scrollIntoView({ block: "start" });
    window.scrollTo({ top: 0 });
  };

  const validate = () =>
    run(async () => {
      if (timer.current) window.clearTimeout(timer.current);
      setStatus("saving");
      const result = await validateCvInfoAction(cvId, latest.current);
      if (!result.ok) {
        setStatus("error");
        return fail(t("form.saveError"));
      }
      dirty.current = false;
      setStatus("saved");
      router.push(`/app/career/cv/${cvId}?etape=studio${suffix}`);
    });

  const refill = () =>
    run(async () => {
      if (!(await save())) return fail(t("form.saveError"));
      const result = await fillCvFromProfileAction(cvId);
      if (!result.ok)
        return fail(result.error === "profile" ? t("preview.fillNothing") : t("error"));
      showToast({ message: t("preview.filled") });
      router.refresh();
    });

  // ── Orbi on each box (Pro): the texts proposed replace the box, highlighted, undoable ──
  const remember = (key: string, values: string[]) =>
    setHistory((all) => {
      const entry = all[key];
      if (!entry) return all;
      // Typing after a change of Orbi: this is the current version, « Rétablir » goes away.
      return {
        ...all,
        [key]: { stack: [...entry.stack.slice(0, entry.at), values], at: entry.at },
      };
    });

  /** Where the texts of a box go back: read in the handlers only, never while drawing. */
  const applyTo = (key: string, values: string[]) => {
    if (key === "headline") setInfo({ headline: values[0] ?? "" });
    else if (key === "summary") set("summary", values[0] ?? "");
    else if (key === "achievements") set("achievements", values);
    else if (key.startsWith("bullets-"))
      setAt("experiences", Number(key.slice(8)), { bullets: values });
  };

  const improve = (
    key: string,
    kind: "headline" | "summary" | "bullets" | "achievements",
    values: string[],
  ) => {
    if (orbi.state !== "ready") return;
    setBusy(key);
    run(async () => {
      const result = await rewriteCvTextAction(cvId, {
        kind,
        texts: values,
        context: latest.current,
      });
      setBusy(null);
      if (!result.ok) return fail(t(`orbiField.error.${result.error}`));
      setHistory((all) => {
        const entry = all[key];
        const stack = entry ? [...entry.stack.slice(0, entry.at), values] : [values];
        return { ...all, [key]: { stack: [...stack, result.texts], at: stack.length } };
      });
      applyTo(key, result.texts);
      showToast({ message: t("orbiField.done") });
    });
  };

  const travel = (key: string, step: -1 | 1) => {
    const entry = history[key];
    if (!entry) return;
    const at = entry.at + step;
    if (at < 0 || at >= entry.stack.length) return;
    setHistory({ ...history, [key]: { ...entry, at } });
    applyTo(key, entry.stack[at]!);
  };

  const orbiFor = (
    key: string,
    kind: "headline" | "summary" | "bullets" | "achievements",
    values: string[],
  ) => {
    const entry = history[key];
    const fresh = entry && entry.at > 0 && same(entry.stack[entry.at]!, values);
    return {
      tools: (
        <OrbiTools
          orbi={orbi}
          busy={busy === key}
          disabled={pending || !values.some((value) => value.trim())}
          history={entry ?? null}
          onImprove={() => improve(key, kind, values)}
          onUndo={() => travel(key, -1)}
          onRedo={() => travel(key, 1)}
        />
      ),
      changes:
        fresh && entry ? <OrbiChanges before={entry.stack[entry.at - 1]!} after={values} /> : null,
      glow: fresh ? "" : undefined,
    };
  };

  const set = <K extends keyof CvContent>(key: K, value: CvContent[K]) =>
    change({ ...latest.current, [key]: value });
  const setInfo = (patch: Partial<CvContent["info"]>) =>
    set("info", { ...latest.current.info, ...patch });
  const setAt = <K extends "experiences" | "education" | "references" | "languages" | "links">(
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
  const removeAt = <
    K extends "experiences" | "education" | "references" | "languages" | "skills" | "links",
  >(
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
            {(() => {
              const orbiBox = orbiFor("headline", "headline", [content.info.headline]);
              return (
                <div className="nb-cvf-champ nb-cvf-orbibox" data-large="" data-orbi={orbiBox.glow}>
                  <div className="nb-cvf-label">
                    <label htmlFor="cvf-titre">{t("form.headline")}</label>
                    {orbiBox.tools}
                  </div>
                  <input
                    id="cvf-titre"
                    value={content.info.headline}
                    maxLength={160}
                    placeholder={t("form.headlinePlaceholder")}
                    onChange={(event) => {
                      setInfo({ headline: event.target.value });
                      remember("headline", [event.target.value]);
                    }}
                  />
                  {orbiBox.changes}
                </div>
              );
            })()}
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
      case "summary": {
        const lines = a4Lines(content.summary);
        const gauge = lines === 0 ? "empty" : lines < 4 ? "short" : lines <= 8 ? "good" : "long";
        const orbiBox = orbiFor("summary", "summary", [content.summary]);
        return (
          <div className="nb-cvf-champ nb-cvf-orbibox" data-large="" data-orbi={orbiBox.glow}>
            <div className="nb-cvf-label">
              <label htmlFor="cvf-resume">{t("form.summary")}</label>
              {orbiBox.tools}
            </div>
            <textarea
              id="cvf-resume"
              rows={9}
              value={content.summary}
              placeholder={t("form.summaryPlaceholder")}
              aria-describedby="cvf-resume-lignes"
              onChange={(event) => {
                set("summary", event.target.value);
                remember("summary", [event.target.value]);
              }}
            />
            <p className="nb-cvf-jauge" id="cvf-resume-lignes" data-etat={gauge}>
              <span aria-hidden>
                <i style={{ width: `${Math.min(100, (lines / 8) * 100)}%` }} />
              </span>
              {t(`form.lines.${gauge}`, { count: lines })}
            </p>
            {orbiBox.changes}
          </div>
        );
      }
      case "achievements": {
        const orbiBox = orbiFor("achievements", "achievements", content.achievements);
        return (
          <div className="nb-cvf-orbibox" data-orbi={orbiBox.glow}>
            <div className="nb-cvf-label">
              <p className="nb-cvf-aide">{t("form.achievementsHint")}</p>
              {orbiBox.tools}
            </div>
            <ul className="nb-cvf-lignes">
              {content.achievements.map((line, index) => (
                <li key={index}>
                  <input
                    aria-label={t("form.achievement", { n: index + 1 })}
                    value={line}
                    maxLength={300}
                    placeholder={t("form.achievementPlaceholder")}
                    onChange={(event) => {
                      const next = latest.current.achievements.map((item, at) =>
                        at === index ? event.target.value : item,
                      );
                      set("achievements", next);
                      remember("achievements", next);
                    }}
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
            {orbiBox.changes}
          </div>
        );
      }
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
                  {(() => {
                    const key = `bullets-${index}`;
                    const orbiBox = orbiFor(key, "bullets", item.bullets);
                    return (
                      <div className="nb-cvf-orbibox nb-cvf-points" data-orbi={orbiBox.glow}>
                        <div className="nb-cvf-label" data-droite="">
                          {orbiBox.tools}
                        </div>
                        <AchievementsField
                          inCv
                          max={CV_BULLETS_MAX}
                          points={item.bullets}
                          onChange={(bullets) => {
                            setAt("experiences", index, { bullets });
                            remember(key, bullets);
                          }}
                        />
                        {orbiBox.changes}
                      </div>
                    );
                  })()}
                </div>
              </fieldset>
            ))}
            {content.experiences.length < 20 ? (
              <Add
                label={t("form.addExperience")}
                onClick={() =>
                  set("experiences", [
                    ...latest.current.experiences,
                    {
                      title: "",
                      company: "",
                      location: "",
                      start: "",
                      end: null,
                      // 3 empty réalisations to fill, as in the profile (3 to 4 advised).
                      bullets: Array.from({ length: ACHIEVEMENTS_SUGGESTED }, () => ""),
                    },
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
      case "links":
        return (
          <>
            <p className="nb-cvf-aide">{t("form.linksHint")}</p>
            {content.links.map((item, index) => (
              <div key={index} className="nb-cvf-lien">
                <input
                  aria-label={t("form.linkLabel", { n: index + 1 })}
                  value={item.label}
                  maxLength={60}
                  placeholder={t("form.linkLabelPlaceholder")}
                  onChange={(event) => setAt("links", index, { label: event.target.value })}
                />
                <input
                  aria-label={t("form.linkUrl", { n: index + 1 })}
                  type="url"
                  inputMode="url"
                  value={item.url}
                  maxLength={300}
                  placeholder={t("form.linkUrlPlaceholder")}
                  onChange={(event) => setAt("links", index, { url: event.target.value })}
                />
                <Remove label={t("form.remove")} onClick={() => removeAt("links", index)} />
              </div>
            ))}
            {content.links.length < 8 ? (
              <Add
                label={t("form.addLink")}
                onClick={() => set("links", [...latest.current.links, { label: "", url: "" }])}
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

  const current = PARTS[part]!;
  const last = part === PARTS.length - 1;
  return (
    <CvFrame
      title={t(`form.part.${current.key}.title`)}
      sub={t("form.partOf", { n: part + 1, all: PARTS.length })}
      back={
        part > 0
          ? { href: "#", label: t("back"), onClick: () => go(part - 1) }
          : { href: "/app/career/cv?onglet=cv", label: t("close"), close: true }
      }
      steps={steps}
      className="nb-cvf"
      bottom={
        <div className="nb-cv-deux">
          {part > 0 ? (
            <button
              type="button"
              className="nb-bouton"
              data-contour=""
              data-large=""
              onClick={() => go(part - 1)}
            >
              {t("form.previous")}
            </button>
          ) : null}
          <button
            type="button"
            className="nb-bouton nb-cv-principal"
            data-plein=""
            data-large=""
            disabled={pending}
            aria-busy={pending}
            onClick={last ? validate : () => go(part + 1)}
          >
            {last ? t("form.validate") : t("form.nextPart")}
          </button>
        </div>
      }
    >
      <div ref={top} className="nb-cvf-parties" aria-hidden>
        {PARTS.map((item, index) => (
          <button
            key={item.key}
            type="button"
            tabIndex={-1}
            data-fait={index <= part ? "" : undefined}
            onClick={() => go(index)}
          />
        ))}
      </div>
      <p className="nb-cvf-intro">{t(`form.part.${current.key}.text`)}</p>
      {part === 0 ? (
        <button type="button" className="nb-cvf-reprendre" onClick={refill} disabled={pending}>
          <PhoneIcon name="refaire" size={15} />
          {t("form.refill")}
        </button>
      ) : null}
      {orbi.state === "ready" && ORBI_PARTS.includes(current.key) ? (
        <div className="nb-cv-orbi">
          <span className="nb-cv-orbi-i" aria-hidden>
            <OrbiSpark size={18} />
          </span>
          <p>{t("orbiField.tip")}</p>
        </div>
      ) : null}

      <ul className="nb-cvf-blocs">
        {current.blocks.map((block, index) => {
          const visible = shown(content, block);
          return (
            <li
              key={block}
              className="nb-cvf-bloc"
              data-ouvert=""
              data-cache={visible ? undefined : ""}
              style={{ "--c": COLORS[block], animationDelay: `${0.05 * index}s` } as CSSProperties}
            >
              <div className="nb-cvf-bloc-h">
                <h2 className="nb-cvf-bloc-b">
                  <i className="nb-cv-point" aria-hidden />
                  <span>
                    <b>{t(`form.block.${block}`)}</b>
                  </span>
                </h2>
                {block === "identity" ? null : (
                  <label className="nb-cvf-montrer">
                    <small>{visible ? t("form.onCv") : t("form.offCv")}</small>
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
                  </label>
                )}
              </div>
              <div className="nb-cvf-bloc-c">{body(block)}</div>
            </li>
          );
        })}
      </ul>
      <p className="nb-cv-note" data-centre="" role="status">
        {t(`form.status.${status}`)} · {t("form.profileStays")}
      </p>
      {last ? null : (
        <p className="nb-cvf-suite">
          {t("form.nextIs", { name: t(`form.part.${PARTS[part + 1]!.key}.title`) })}
        </p>
      )}
    </CvFrame>
  );
}

const same = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

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
