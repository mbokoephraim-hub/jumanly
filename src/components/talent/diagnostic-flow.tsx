"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  dimensions,
  optionalQuestions,
  screensFor,
  SKILLS_ASSESSED,
  type Draft,
  type Screen,
} from "@/server/services/diagnostic-scoring";
import { TalentIcon } from "./icon";
import { OrbiMark } from "./orbi-mark";

export type SkillSource = { names: string[]; offers: number; scope: "role" | "all" | "own" };
type Option = { value: string; label: string; hint?: string };

const split = (value: string | undefined) =>
  (value ?? "")
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

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
  education,
}: {
  initial: Draft;
  initialIndex: number;
  skills: SkillSource;
  personalized: boolean;
  prefilled: string[];
  cvScore: number | null;
  education: Option[];
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

  const screens = screensFor(answers, skills.names, personalized);
  // The follow-up questions are asked once, after the last question of the personalized level.
  const askFollowUps = personalized && answers.followUps === undefined;
  const at = Math.max(0, Math.min(index, screens.length - 1));
  const screen = screens[at]!;
  // Every screen that may be asked, so that the page works as one long form without JavaScript.
  const all = useMemo(
    () => screensFor({ targetRole: "-", experience: "a2" }, skills.names, personalized),
    [skills.names, personalized],
  );
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
  const setCheck = (skill: string, patch: { level?: number; proof?: string }) =>
    setAnswers((current) => {
      const checks = current.skillChecks ?? [];
      const before = checks.find((item) => item.skill === skill);
      const next = { skill, level: 0, proof: "", ...before, ...patch } as {
        skill: string;
        level: number;
        proof: string;
      };
      return {
        ...current,
        skillChecks: [
          ...checks.filter((item) => item.skill !== skill),
          next,
        ] as Draft["skillChecks"],
      };
    });

  const valid = (item: Screen) => {
    if ("followUp" in item) return true;
    if ("skill" in item) {
      const value = check(item.skill);
      return Boolean(value?.level && value.proof);
    }
    if (optionalQuestions.includes(item.id) || item.id === "values") return true;
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
          ? { names: found.skills, offers: found.offers, scope: found.scope }
          : { names: [], offers: 0, scope: "own" };
    }
    if (screen.id === "topSkills" && next.names.length === 0) {
      next = { names: split(current.topSkills).slice(0, SKILLS_ASSESSED), offers: 0, scope: "own" };
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

  const choices = (id: keyof typeof choiceAnswers): Option[] =>
    choiceAnswers[id].map((code) => ({ value: code, label: d(`q.${id}.${code}`) }));

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
    if ("skill" in item) {
      const value = check(item.skill);
      return (
        <>
          <input type="hidden" name={`skill-${item.index}`} value={item.skill} />
          <Choices
            legend={t("q.skillLevel.text", { skill: item.skill })}
            legendId={`diag-q-${item.id}`}
            hint={
              skills.scope === "own"
                ? t("q.skillLevel.source.own")
                : skills.scope === "all"
                  ? t("q.skillLevel.source.all", { count: skills.offers })
                  : t("q.skillLevel.source.role", { count: skills.offers })
            }
            name={`skillLevel-${item.index}`}
            value={value?.level ? String(value.level) : undefined}
            onChange={(level) => setCheck(item.skill, { level: Number(level) })}
            options={[1, 2, 3, 4].map((level) => ({
              value: String(level),
              label: d(`q.skillLevel.l${level}`),
              hint: d(`q.skillLevel.l${level}Hint`),
            }))}
          />
          <Choices
            legend={t("q.skillProof.text")}
            name={`skillProof-${item.index}`}
            value={value?.proof || undefined}
            onChange={(proof) => setCheck(item.skill, { proof })}
            options={choices("skillProof")}
          />
        </>
      );
    }
    const id = item.id;
    const legendId = `diag-q-${id}`;
    const note = prefilled.includes(id) ? t("prefilled") : undefined;
    const radio = (options: Option[], legend: string, hint?: string) => (
      <Choices
        legend={legend}
        legendId={legendId}
        hint={hint ?? note}
        name={id}
        value={answers[id] === undefined ? undefined : String(answers[id])}
        onChange={(value) => set(id, id === "confidence" ? Number(value) : value)}
        options={options}
      />
    );
    const text = (
      label: string,
      options: { placeholder?: string; hint?: string; area?: boolean; max: number },
    ) => {
      const hint = options.hint ?? note;
      const field = {
        id: `diag-${id}`,
        name: id,
        placeholder: options.placeholder,
        maxLength: options.max,
        value: String(answers[id] ?? ""),
        "aria-describedby": hint ? `diag-${id}-hint` : undefined,
      };
      return (
        <>
          <label id={legendId} tabIndex={-1} htmlFor={`diag-${id}`} className="t-lgd">
            {label}
          </label>
          {hint && (
            <p id={`diag-${id}-hint`} className="t-aide">
              {hint}
            </p>
          )}
          {options.area ? (
            <textarea
              {...field}
              rows={5}
              onChange={(event) => set(id, event.target.value)}
              className="t-verre t-rep"
            />
          ) : (
            <span className="t-verre t-saisie">
              <input {...field} type="text" onChange={(event) => set(id, event.target.value)} />
            </span>
          )}
        </>
      );
    };
    switch (id) {
      case "education":
        return radio(education, t("q.education"));
      case "confidence":
        return radio(
          [1, 2, 3, 4, 5].map((value) => ({
            value: String(value),
            label:
              value === 1
                ? `1 · ${t("q.confidence.min")}`
                : value === 5
                  ? `5 · ${t("q.confidence.max")}`
                  : String(value),
          })),
          t("q.confidence.text"),
        );
      case "cvStatus":
        return radio(
          choices("cvStatus"),
          t("q.cvStatus.text"),
          cvScore === null ? note : t("cvScore", { score: cvScore }),
        );
      case "targetRole":
        return text(t("q.targetRole.text"), {
          placeholder: t("q.targetRole.placeholder"),
          hint: note ?? t("q.targetRole.hint"),
          max: 120,
        });
      case "sectors":
        return text(t("q.sectors.text"), {
          placeholder: t("q.sectors.placeholder"),
          hint: note ?? t("q.topSkillsHint"),
          max: 200,
        });
      case "topSkills":
        return text(t("q.topSkills"), {
          placeholder: t("q.topSkillsPlaceholder"),
          hint: note ?? t("q.topSkillsHint"),
          max: 200,
        });
      case "skillsToBuild":
        return text(t("q.skillsToBuild"), {
          placeholder: t("q.skillsToBuildPlaceholder"),
          hint: t("q.topSkillsHint"),
          max: 200,
        });
      case "languages":
        return text(t("q.languages"), {
          placeholder: t("q.languagesPlaceholder"),
          hint: note ?? t("q.topSkillsHint"),
          max: 200,
        });
      case "digital":
        return text(t("q.digital"), {
          placeholder: t("q.digitalPlaceholder"),
          hint: t("q.topSkillsHint"),
          max: 200,
        });
      case "achievement":
        return text(t("q.achievement.text"), {
          placeholder: t("q.achievement.placeholder"),
          area: true,
          max: 1000,
        });
      case "feedback":
        return text(t("q.feedback"), { max: 300 });
      case "horizon":
        return text(t("q.horizon"), { area: true, max: 300 });
      case "values": {
        const chosen = answers.values ?? [];
        return (
          <fieldset className="t-fs">
            <legend>
              <span id={legendId} tabIndex={-1}>
                {t("q.values.text")}
              </span>
            </legend>
            <div className="t-choix">
              {choiceAnswers.values.map((code) => {
                const on = chosen.includes(code);
                return (
                  <label key={code} className="t-verre t-ch t-press">
                    <input
                      type="checkbox"
                      name="values"
                      value={code}
                      checked={on}
                      disabled={!on && chosen.length >= 3}
                      onChange={() =>
                        set(
                          "values",
                          on ? chosen.filter((item) => item !== code) : [...chosen, code],
                        )
                      }
                    />
                    <span className="t-t">
                      <b>{d(`q.values.${code}`)}</b>
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
      default: {
        const key = id as keyof typeof choiceAnswers;
        return radio(choices(key), d(`q.${key}.text`));
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
function Choices({
  legend,
  legendId,
  hint,
  name,
  value,
  onChange,
  options,
}: {
  legend: string;
  legendId?: string;
  hint?: string;
  name: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: Option[];
}) {
  return (
    <fieldset className="t-fs">
      <legend>
        <span id={legendId} tabIndex={legendId ? -1 : undefined}>
          {legend}
        </span>
      </legend>
      {hint && <p className="t-aide">{hint}</p>}
      <div className="t-choix">
        {options.map((option) => (
          <label key={option.value} className="t-verre t-ch t-press">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
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
