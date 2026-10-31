"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { dynamic } from "@/i18n/dynamic";
import { motionReduced } from "@/lib/motion";
import {
  diagnosticFollowUpsAction,
  diagnosticSkillsAction,
  readDiagnosticProfileAction,
  runDiagnosticAction,
  saveDiagnosticDraftAction,
  submitDiagnostic,
} from "@/server/actions/diagnostic";
import {
  answersSchema,
  choiceAnswers,
  confidenceAnswers,
  dimensions,
  optionalQuestions,
  readyItems,
  screensFor,
  shownAnswers,
  SKILL_PICKS,
  SKILLS_ASSESSED,
  skillPickOf,
  type Draft,
  type ReadyItem,
  type Screen,
} from "@/server/services/diagnostic-scoring";
import { MenuArt, type MenuArtName } from "@/components/site/menu-art";
import { OrbiSpark } from "@/components/phone/cv/marks";
import "@/styles/diagnostic-questions.css";
import { TalentIcon } from "./icon";
import { OrbiMark } from "./orbi-mark";

export type SkillSource = {
  names: string[];
  offers: number;
  /** ai: prepared by Orbi for a job Jumanly does not know yet (31/10/2026). */
  scope: "field" | "role" | "all" | "own" | "ai";
};
type Option = { value: string; label: string; hint?: string; art?: MenuArtName };

const split = (value: string | undefined) =>
  (value ?? "")
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

/** The drawings of the site menu, on the questions (Ephraïm, 31/10/2026). */
const questionArt: Partial<Record<string, MenuArtName>> = {
  targetRole: "jobs",
  familiarity: "career",
  skills: "trainings",
  experience: "companies",
  ready: "cv",
  confidence: "recruiters",
  interviews: "talents",
  applications: "jobs",
  contacts: "connect",
  obstacle: "why",
};
const readyArt: Record<ReadyItem, MenuArtName> = {
  cv: "cv",
  letter: "letter",
  profile: "talents",
  portfolio: "portfolio",
};
const obstacleArt: Record<string, MenuArtName> = {
  a1: "career",
  a2: "trainings",
  a3: "cv",
  a6: "connect",
};

/**
 * The career diagnostic, one question per screen, in the talent design (planche talent-4 § 5):
 * the six dimensions as steps on top, each answer saved so the talent can come back, « Précédent »
 * and « Suivant » at the bottom. Then the analysis, whose lines are checked as the real work ends.
 * Without JavaScript, every question is on one page and the form goes to the same rules.
 */
export function DiagnosticFlow({
  initial,
  initialIndex,
  skills: initialSkills,
  personalized,
  prefilled,
  cvScore,
}: {
  initial: Draft;
  initialIndex: number;
  skills: SkillSource;
  personalized: boolean;
  prefilled: string[];
  cvScore: number | null;
}) {
  const t = useTranslations("career.diagnostic");
  const d = dynamic(t);
  const [answers, setAnswers] = useState<Draft>(initial);
  const [skills, setSkills] = useState<SkillSource>(initialSkills);
  const [index, setIndex] = useState(initialIndex);
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(0);
  const [phase, setPhase] = useState<"questions" | "scan">("questions");
  const fetchedRole = useRef(initial.targetRole?.trim() ?? "");
  const moved = useRef(false);

  // A job no one knows yet, without Orbi: the talent names their key skills on the skills screen.
  const own = skills.names.length === 0;
  const named = own ? split(answers.topSkills).slice(0, SKILLS_ASSESSED) : skills.names;
  const screens = screensFor(answers, named, personalized);
  // The follow-up questions are asked once, after the last question of the personalized level.
  const askFollowUps = personalized && answers.followUps === undefined;
  const at = Math.max(0, Math.min(index, screens.length - 1));
  const screen = screens[at]!;
  // Every screen that may be asked, so that the page works as one long form without JavaScript.
  const all = screensFor({ targetRole: "-", experience: "a2" }, named, personalized);
  const step =
    screen.dimension === "more" ? dimensions.length - 1 : dimensions.indexOf(screen.dimension);

  useEffect(() => {
    if (!moved.current) return;
    document.getElementById(`diag-q-${screen.id}`)?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: motionReduced() ? "auto" : "smooth" });
  }, [screen.id]);

  const set = (key: keyof Draft, value: unknown) =>
    setAnswers((current) => ({ ...current, [key]: value }));
  const check = (skill: string) => answers.skillChecks?.find((item) => item.skill === skill);
  /** One tap gives the level and the proof (« Je peux le prouver »: an attestation or a project). */
  const setPick = (skill: string, pick: number) =>
    setAnswers((current) => ({
      ...current,
      skillChecks: [
        ...(current.skillChecks ?? []).filter((item) => item.skill !== skill),
        { skill, ...SKILL_PICKS[pick]! },
      ],
    }));

  const valid = (item: Screen) => {
    if ("followUp" in item) return true;
    if ("skills" in item) return item.skills.every((skill) => check(skill) !== undefined);
    if (optionalQuestions.includes(item.id)) return true;
    const value = answers[item.id];
    return value !== undefined && value !== "";
  };

  /** Keeps the assessed skills in step with the target job (real offers) or the named skills. */
  async function refreshSkills(current: Draft) {
    let next = skills;
    const role = current.targetRole?.trim() ?? "";
    if (screen.id === "targetRole" && role !== fetchedRole.current) {
      const found = await diagnosticSkillsAction(role);
      fetchedRole.current = role;
      next =
        found.skills.length > 0
          ? {
              names: found.skills,
              offers: found.offers,
              scope: found.ai ? "ai" : found.field ? "field" : found.scope,
            }
          : { names: [], offers: 0, scope: "own" };
    }
    if (next !== skills) {
      setSkills(next);
      setAnswers((value) => ({
        ...value,
        skillChecks: (value.skillChecks ?? []).filter((item) => next.names.includes(item.skill)),
      }));
    }
  }

  async function forward() {
    if (busy) return;
    if (!valid(screen)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (at === screens.length - 1 && askFollowUps) {
      // Orbi reads the answers, then asks its two follow-up questions.
      setBusy(true);
      let questions: string[] = [];
      try {
        questions = await diagnosticFollowUpsAction(answers);
      } catch {
        questions = [];
      } finally {
        setBusy(false);
      }
      const next = {
        ...answers,
        followUps: questions.map((question) => ({ question, answer: "" })),
      };
      setAnswers(next);
      if (questions.length === 0) {
        setPhase("scan");
        return;
      }
      moved.current = true;
      setIndex(at + 1);
      void saveDiagnosticDraftAction(next, at + 1).then((ok) => ok && setSaved((n) => n + 1));
      return;
    }
    if (at === screens.length - 1) {
      setPhase("scan");
      return;
    }
    setBusy(true);
    try {
      await refreshSkills(answers);
    } finally {
      setBusy(false);
    }
    moved.current = true;
    setIndex(at + 1);
    void saveDiagnosticDraftAction(answers, at + 1).then((ok) => ok && setSaved((n) => n + 1));
  }

  function back() {
    if (at === 0) return;
    moved.current = true;
    setInvalid(false);
    setIndex(at - 1);
  }

  if (phase === "scan")
    return (
      <DiagnosticScan
        answers={answers}
        personalized={personalized}
        onBack={() => setPhase("questions")}
      />
    );

  const body = (item: Screen): ReactNode => {
    if ("followUp" in item) {
      const value = answers.followUps?.[item.index]?.answer ?? "";
      return (
        <>
          <span className="t-badge-o">
            <OrbiMark size={16} />
            {t("followUp.badge", {
              current: item.index + 1,
              total: answers.followUps?.length ?? 0,
            })}
          </span>
          <label
            id={`diag-q-${item.id}`}
            tabIndex={-1}
            htmlFor={`diag-${item.id}`}
            className="t-lgd"
          >
            {item.followUp}
          </label>
          <p id={`diag-${item.id}-hint`} className="t-aide">
            {t("followUp.hint")}
          </p>
          <textarea
            id={`diag-${item.id}`}
            rows={5}
            maxLength={500}
            value={value}
            aria-describedby={`diag-${item.id}-hint`}
            onChange={(event) =>
              setAnswers((current) => ({
                ...current,
                followUps: (current.followUps ?? []).map((entry, index) =>
                  index === item.index ? { ...entry, answer: event.target.value } : entry,
                ),
              }))
            }
            className="t-verre t-rep"
          />
        </>
      );
    }
    if ("skills" in item) {
      const hint =
        skills.scope === "own"
          ? t("q.skills.ownHint")
          : skills.scope === "ai"
            ? t("q.skills.aiHint")
            : skills.scope === "field"
              ? t("q.skillLevel.source.field")
              : skills.scope === "all"
                ? t("q.skillLevel.source.all", { count: skills.offers })
                : t("q.skillLevel.source.role", { count: skills.offers });
      return (
        <>
          <QuestionHead
            id={`diag-q-${item.id}`}
            art="trainings"
            text={own ? t("q.skills.ownText") : t("q.skills.text")}
            hint={hint}
          />
          {skills.scope === "ai" && (
            <span className="t-badge-o t-dq-orbi">
              <OrbiSpark size={14} />
              {t("q.skills.aiBadge")}
            </span>
          )}
          {own && (
            <span className="t-verre t-saisie">
              <input
                id="diag-topSkills"
                name="topSkills"
                type="text"
                maxLength={200}
                aria-label={t("q.skills.ownText")}
                placeholder={t("q.topSkillsPlaceholder")}
                value={answers.topSkills ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  const kept = split(value).slice(0, SKILLS_ASSESSED);
                  setAnswers((current) => ({
                    ...current,
                    topSkills: value,
                    skillChecks: (current.skillChecks ?? []).filter((check) =>
                      kept.includes(check.skill),
                    ),
                  }));
                }}
              />
            </span>
          )}
          <ul className="t-dq-sk">
            {item.skills.map((skill, index) => {
              const chosen = skillPickOf(check(skill));
              return (
                <li key={skill} className="t-verre">
                  <input type="hidden" name={`skill-${index}`} value={skill} />
                  <b id={`diag-sk-${index}`}>{skill}</b>
                  <div role="radiogroup" aria-labelledby={`diag-sk-${index}`} className="t-dq-pil">
                    {SKILL_PICKS.map((_, pick) => (
                      <label key={pick} className="t-press">
                        <input
                          type="radio"
                          name={`skillPick-${index}`}
                          value={pick}
                          checked={chosen === pick}
                          onChange={() => setPick(skill, pick)}
                        />
                        {d(`q.skills.p${pick}`)}
                      </label>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      );
    }
    const id = item.id;
    const legendId = `diag-q-${id}`;
    const note = prefilled.includes(id) ? t("prefilled") : undefined;
    const art = questionArt[id];
    switch (id) {
      case "targetRole": {
        const hint = note ?? t("q.targetRole.hint");
        return (
          <>
            <QuestionHead
              id={legendId}
              art="jobs"
              text={t("q.targetRole.text")}
              hint={hint}
              htmlFor={`diag-${id}`}
            />
            <span className="t-verre t-saisie">
              <input
                id={`diag-${id}`}
                name={id}
                type="text"
                maxLength={120}
                placeholder={t("q.targetRole.placeholder")}
                value={answers.targetRole ?? ""}
                onChange={(event) => set(id, event.target.value)}
              />
            </span>
          </>
        );
      }
      case "ready": {
        const chosen = answers.ready ?? [];
        return (
          <fieldset className="t-fs">
            <legend className="t-dq-lg">
              <span id={legendId} tabIndex={-1}>
                {t("q.ready.text")}
              </span>
            </legend>
            <p className="t-aide">
              {cvScore === null ? t("q.ready.hint") : t("cvScore", { score: cvScore })}
            </p>
            <div className="t-choix t-dq-art">
              {readyItems.map((code) => {
                const on = chosen.includes(code);
                return (
                  <label key={code} className="t-verre t-ch t-press">
                    <input
                      type="checkbox"
                      name="ready"
                      value={code}
                      checked={on}
                      onChange={() =>
                        set(
                          "ready",
                          on ? chosen.filter((value) => value !== code) : [...chosen, code],
                        )
                      }
                    />
                    <MenuArt name={readyArt[code]} size="sm" />
                    <span className="t-t">
                      <b>{d(`q.ready.${code}`)}</b>
                    </span>
                    <span className="t-case" aria-hidden>
                      <TalentIcon name="valider" size="xs" />
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      }
      case "confidence":
        return (
          <Choices
            legend={t("q.confidence.short")}
            legendId={legendId}
            art={art}
            name={id}
            value={answers.confidence === undefined ? undefined : String(answers.confidence)}
            onChange={(value) => set(id, Number(value))}
            options={confidenceAnswers.map((value) => ({
              value: String(value),
              label: d(`q.confidence.c${value}`),
            }))}
          />
        );
      default: {
        const key = id as keyof typeof choiceAnswers;
        const codes = shownAnswers[key] ?? choiceAnswers[key];
        return (
          <Choices
            legend={d(`q.${key}.text`)}
            legendId={legendId}
            art={key === "obstacle" ? undefined : art}
            hint={note}
            name={id}
            value={answers[id] === undefined ? undefined : String(answers[id])}
            onChange={(value) => set(id, value)}
            options={codes.map((code) => ({
              value: code,
              label: d(`q.${key}.${code}`),
              art: key === "obstacle" ? obstacleArt[code] : undefined,
            }))}
          />
        );
      }
    }
  };

  const last = at === screens.length - 1 && !askFollowUps;

  return (
    <form
      id="diagnostic-flow"
      action={submitDiagnostic}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void forward();
      }}
      className="t-flux"
    >
      <noscript
        dangerouslySetInnerHTML={{
          __html:
            "<style>#diagnostic-flow [data-screen]{display:flex!important}#diagnostic-flow [data-js]{display:none!important}#diagnostic-flow [data-nojs]{display:flex!important}</style>",
        }}
      />
      {personalized && <input type="hidden" name="personalized" value="1" />}
      {answers.useProfile && <input type="hidden" name="useProfile" value="on" />}
      <div data-js className="t-flux t-serre">
        <div className="t-pas" aria-hidden>
          {dimensions.map((key, position) => (
            <i key={key} className={position <= step ? "t-ok" : undefined} />
          ))}
        </div>
        <p className="t-diag-et">
          <b>
            {t("step.label", {
              current: step + 1,
              total: dimensions.length,
              name:
                screen.dimension === "more"
                  ? t("part.more")
                  : d(`dimension.${screen.dimension}.name`),
            })}
          </b>
          <span>{t("progress", { current: at + 1, total: screens.length })}</span>
        </p>
      </div>

      {[...all, ...screens.filter((item) => "followUp" in item)].map((item) => {
        const shown = item.id === screen.id;
        return (
          <section
            key={item.id}
            data-screen
            hidden={!shown}
            className="t-diag-q"
            style={{ display: shown ? "flex" : undefined }}
          >
            {body(item)}
          </section>
        );
      })}

      <p role="alert" className={invalid ? "t-gar t-err" : "sr-only"}>
        {invalid ? t("required") : ""}
      </p>
      <p aria-live="polite" className="t-vide-t">
        {busy && at === screens.length - 1 && askFollowUps
          ? t("followUp.loading")
          : saved > 0
            ? t("savedAt")
            : ""}
      </p>
      <div data-js className="t-verre t-fort t-bas-f">
        {at > 0 && (
          <button type="button" onClick={back} className="t-bt t-sec t-m t-press">
            {t("previous")}
          </button>
        )}
        <button
          type="submit"
          aria-busy={busy || undefined}
          className={last ? "t-bt t-a t-pl t-press" : "t-bt t-p t-pl t-press"}
        >
          {last ? t("analyze") : t("next")}
        </button>
      </div>
      <div data-nojs hidden className="t-flux">
        <p className="t-vide-t">{t("welcome.noscript")}</p>
        <button type="submit" className="t-bt t-p t-pl">
          {t("finish")}
        </button>
      </div>
    </form>
  );
}

/** One question with its answers as glass cards (a real radio button in each). */
/** A question's title with its drawing, for the screens that are not a list of answers. */
function QuestionHead({
  id,
  art,
  text,
  hint,
  htmlFor,
}: {
  id: string;
  art: MenuArtName;
  text: string;
  hint?: string;
  htmlFor?: string;
}) {
  return (
    <>
      <div className="t-dq-lg">
        <MenuArt name={art} size="md" />
        {htmlFor ? (
          <label id={id} tabIndex={-1} htmlFor={htmlFor} className="t-lgd">
            {text}
          </label>
        ) : (
          <p id={id} tabIndex={-1} className="t-lgd">
            {text}
          </p>
        )}
      </div>
      {hint && <p className="t-aide">{hint}</p>}
    </>
  );
}

function Choices({
  legend,
  legendId,
  art,
  hint,
  name,
  value,
  onChange,
  options,
}: {
  legend: string;
  legendId?: string;
  art?: MenuArtName;
  hint?: string;
  name: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: Option[];
}) {
  return (
    <fieldset className="t-fs">
      <legend className={art ? "t-dq-lg" : undefined}>
        {art && <MenuArt name={art} size="md" />}
        <span id={legendId} tabIndex={legendId ? -1 : undefined}>
          {legend}
        </span>
      </legend>
      {hint && <p className="t-aide">{hint}</p>}
      <div className={options.some((option) => option.art) ? "t-choix t-dq-art" : "t-choix"}>
        {options.map((option) => (
          <label key={option.value} className="t-verre t-ch t-press">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.art && <MenuArt name={option.art} size="sm" />}
            <span className="t-t">
              <b>{option.label}</b>
              {option.hint && <span>{option.hint}</span>}
            </span>
            <span className="t-radio" aria-hidden />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type ScanStep = "answers" | "profile" | "offers" | "dimensions" | "priorities";
const hold = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The analysis: each line is checked when its work is really done (answers checked here, profile
 * read, offers counted on the server, the six dimensions, then the diagnostic saved, and for the
 * personalized level written by Orbi, which falls back on the rules after 25 s). Then the result.
 */
function DiagnosticScan({
  answers,
  personalized,
  onBack,
}: {
  answers: Draft;
  personalized: boolean;
  onBack: () => void;
}) {
  const t = useTranslations("career.diagnostic");
  const d = dynamic(t);
  const steps: ScanStep[] = [
    "answers",
    ...(answers.useProfile ? (["profile"] as const) : []),
    "offers",
    "dimensions",
    "priorities",
  ];
  const [state, setState] = useState<Partial<Record<ScanStep, "run" | "done">>>({});
  const [offers, setOffers] = useState<{ count: number; scope: "role" | "all" } | null>(null);
  const [result, setResult] = useState<{ href: string; fallback: boolean } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(-1);
  const router = useRouter();

  useEffect(() => {
    if (started.current === attempt) return;
    started.current = attempt;
    const pause = motionReduced() ? 0 : 500;
    const mark = (key: ScanStep, value: "run" | "done") =>
      setState((current) => ({ ...current, [key]: value }));
    async function step<T>(key: ScanStep, work: () => Promise<T>) {
      mark(key, "run");
      const [value] = await Promise.all([work(), hold(pause)]);
      mark(key, "done");
      return value;
    }
    (async () => {
      const parsed = await step("answers", async () => answersSchema.safeParse(answers));
      if (!parsed.success) throw new Error("invalid");
      if (parsed.data.useProfile) await step("profile", () => readDiagnosticProfileAction());
      const found = await step("offers", () => diagnosticSkillsAction(parsed.data.targetRole));
      setOffers({ count: found.offers, scope: found.scope });
      await step("dimensions", async () => undefined);
      const saved = await step("priorities", () =>
        runDiagnosticAction({ answers: parsed.data, personalized }),
      );
      if (!saved.ok) throw new Error("not saved");
      const href = `/app/career/diagnostic?bilan=${saved.id}${saved.error ? `&ia=${saved.error}` : ""}`;
      const fallback = personalized && saved.level === "simple";
      setResult({ href, fallback });
      // The result opens by itself; with Orbi's fallback, the talent reads the notice first.
      if (!fallback) router.push(href);
    })().catch(() => setFailed(true));
  }, [attempt, answers, personalized, router]);

  const label = (key: ScanStep) => {
    if (key === "offers" && offers)
      return offers.scope === "role"
        ? t("scan.offersRole", { count: offers.count })
        : t("scan.offersAll", { count: offers.count });
    if (key === "priorities" && personalized) return `${t("scan.priorities")} · ${t("scan.ai")}`;
    return d(`scan.${key}`);
  };

  return (
    <div className="t-flux">
      <div className="t-bulle-o">
        <OrbiMark size={32} state={result || failed ? "repos" : "reflechit"} />
        <div className="t-verre t-corps">
          <span>{t("scan.title")}</span>
        </div>
      </div>
      <ol aria-live="polite" className="t-verre t-carte t-scan">
        {steps.map((key) => {
          const value = state[key];
          return (
            <li key={key} className={value === "done" ? "t-ok" : value ? "t-en" : undefined}>
              <span className={value === "done" ? "t-num t-ok" : "t-num"} aria-hidden>
                {value === "done" && <TalentIcon name="valider" size="xs" />}
              </span>
              <span>
                {label(key)}
                {value && (
                  <span className="sr-only">
                    {" · "}
                    {value === "done" ? t("scan.done") : t("scan.running")}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      {result?.fallback && <p className="t-gar">{t("scan.fallback")}</p>}
      {result && (
        <Link href={result.href} className="t-bt t-a t-pl t-press">
          {t("scan.cta")}
        </Link>
      )}
      {failed && (
        <div role="alert" className="t-verre t-carte">
          <p>{t("scan.error")}</p>
          <div className="t-bts">
            <button
              type="button"
              className="t-bt t-p t-s t-press"
              onClick={() => {
                setFailed(false);
                setState({});
                setAttempt((n) => n + 1);
              }}
            >
              {t("scan.retry")}
            </button>
            <button type="button" className="t-bt t-sec t-s t-press" onClick={onBack}>
              {t("previous")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
