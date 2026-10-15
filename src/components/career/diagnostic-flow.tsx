"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/brand/icon";
import { card, pillClass } from "@/components/career/kit";
import { LiveRadar } from "@/components/motion/radar-live";
import { ScanScene, type ScanCard } from "@/components/motion/scan";
import { StepTrail } from "@/components/motion/step-trail";
import { showToast } from "@/components/motion/toaster";
import { inputClasses } from "@/components/ui/field";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { motionReduced } from "@/lib/motion";
import {
  diagnosticSkillsAction,
  readDiagnosticProfileAction,
  runDiagnosticAction,
  saveDiagnosticDraftAction,
  submitDiagnostic,
} from "@/server/actions/diagnostic";
import {
  answersSchema,
  bandFor,
  choiceAnswers,
  dimensions,
  optionalQuestions,
  scoreDimensions,
  screensFor,
  SKILLS_ASSESSED,
  type Dimension,
  type Draft,
  type Screen,
} from "@/server/services/diagnostic-scoring";

export type SkillSource = { names: string[]; offers: number; scope: "role" | "all" | "own" };
type Option = { value: string; label: string; hint?: string };

const split = (value: string | undefined) =>
  (value ?? "")
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * The career diagnostic, one question per screen (docs/experience-animee § 5.2): the trajectory
 * of the six dimensions on top, the radar drawing itself as the talent answers, each answer saved
 * so the talent can come back. Then the scan (§ 5.4), whose steps are checked as the real work
 * ends. Without JavaScript, every question is on one page and the form goes to the same rules.
 */
export function DiagnosticFlow({
  initial,
  initialIndex,
  skills: initialSkills,
  personalized,
  prefilled,
  cvScore,
  education,
  badge,
}: {
  initial: Draft;
  initialIndex: number;
  skills: SkillSource;
  personalized: boolean;
  prefilled: string[];
  cvScore: number | null;
  education: Option[];
  badge: ScanCard;
}) {
  const t = useTranslations("career.diagnostic");
  const d = dynamic(t);
  const [answers, setAnswers] = useState<Draft>(initial);
  const [skills, setSkills] = useState<SkillSource>(initialSkills);
  const [index, setIndex] = useState(initialIndex);
  const [dir, setDir] = useState<"next" | "prev" | undefined>(undefined);
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(0);
  const [phase, setPhase] = useState<"questions" | "scan">("questions");
  const fetchedRole = useRef(initial.targetRole?.trim() ?? "");
  const moved = useRef(false);

  const screens = screensFor(answers, skills.names, personalized);
  const at = Math.max(0, Math.min(index, screens.length - 1));
  const screen = screens[at]!;
  // Every screen that may be asked, so that the page works as one long form without JavaScript.
  const all = useMemo(
    () => screensFor({ targetRole: "-", experience: "a2" }, skills.names, personalized),
    [skills.names, personalized],
  );
  const step =
    screen.dimension === "more" ? dimensions.length - 1 : dimensions.indexOf(screen.dimension);
  const scores = scoreDimensions(answers);

  useEffect(() => {
    if (!moved.current) return;
    document.getElementById(`diag-q-${screen.id}`)?.focus({ preventScroll: true });
    document.getElementById("diagnostic-flow")?.scrollIntoView({ block: "nearest" });
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
    setDir("next");
    setIndex(at + 1);
    void saveDiagnosticDraftAction(answers, at + 1).then((ok) => ok && setSaved((n) => n + 1));
  }

  function back() {
    if (at === 0) return;
    moved.current = true;
    setInvalid(false);
    setDir("prev");
    setIndex(at - 1);
  }

  if (phase === "scan")
    return (
      <DiagnosticScan
        answers={answers}
        personalized={personalized}
        badge={badge}
        onBack={() => {
          setPhase("questions");
          setDir(undefined);
        }}
      />
    );

  const choices = (id: keyof typeof choiceAnswers): Option[] =>
    choiceAnswers[id].map((code) => ({ value: code, label: d(`q.${id}.${code}`) }));

  const body = (item: Screen): ReactNode => {
    if ("skill" in item) {
      const value = check(item.skill);
      return (
        <div className="flex flex-col gap-6">
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
            small
            name={`skillProof-${item.index}`}
            value={value?.proof || undefined}
            onChange={(proof) => setCheck(item.skill, { proof })}
            options={choices("skillProof")}
          />
        </div>
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
        <div className="flex flex-col gap-2.5">
          <label
            id={legendId}
            tabIndex={-1}
            htmlFor={`diag-${id}`}
            className="text-[19px] leading-snug font-semibold outline-none lg:text-[21px]"
          >
            {label}
          </label>
          {hint && (
            <p id={`diag-${id}-hint`} className="text-[13px] text-ardoise">
              {hint}
            </p>
          )}
          {options.area ? (
            <textarea
              {...field}
              rows={5}
              onChange={(event) => set(id, event.target.value)}
              className={cx(inputClasses, "py-3 text-[15px]")}
            />
          ) : (
            <input
              {...field}
              type="text"
              onChange={(event) => set(id, event.target.value)}
              className={cx(inputClasses, "h-12 text-[15px]")}
            />
          )}
        </div>
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
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-3 text-[19px] leading-snug font-semibold lg:text-[21px]">
              <span id={legendId} tabIndex={-1} className="outline-none">
                {t("q.values.text")}
              </span>
            </legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {choiceAnswers.values.map((code) => {
                const on = chosen.includes(code);
                return (
                  <label
                    key={code}
                    className="jm-choice flex min-h-12 cursor-pointer items-center gap-3 rounded-[16px] border border-brume bg-blanc px-4 py-3 text-sm hover:bg-creme has-checked:border-sapin has-checked:bg-lime-clair has-disabled:cursor-not-allowed has-disabled:opacity-60"
                  >
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
                      className="size-5 shrink-0 accent-sapin"
                    />
                    {d(`q.values.${code}`)}
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

  const radarAxes = scores.map((item) => ({
    key: item.key,
    label: d(`dimension.${item.key}.short`),
    value: item.score,
  }));
  const radarText = radarAxes.map((axis) => `${axis.label} ${Math.round(axis.value)}`).join(", ");
  const last = at === screens.length - 1;

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <noscript
        dangerouslySetInnerHTML={{
          __html:
            "<style>#diagnostic-flow [data-screen]{display:flex!important}#diagnostic-flow [data-js]{display:none!important}#diagnostic-flow [data-nojs]{display:flex!important}</style>",
        }}
      />
      <form
        id="diagnostic-flow"
        action={submitDiagnostic}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void forward();
        }}
        className={cx(card, "flex min-w-0 scroll-mt-24 flex-col gap-5 overflow-hidden")}
      >
        {personalized && <input type="hidden" name="personalized" value="1" />}
        {answers.useProfile && <input type="hidden" name="useProfile" value="on" />}
        <div data-js className="flex flex-col gap-2">
          <StepTrail
            steps={dimensions.map((key) => ({ key, label: d(`dimension.${key}.name`) }))}
            current={step}
            label={t("step.trail")}
            doneLabel={t("step.done")}
            currentLabel={t("step.current")}
          />
          <p className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-up-texte">
              {t("step.label", {
                current: step + 1,
                total: dimensions.length,
                name:
                  screen.dimension === "more"
                    ? t("part.more")
                    : d(`dimension.${screen.dimension}.name`),
              })}
            </span>
            <span className="text-ardoise">
              {t("progress", { current: at + 1, total: screens.length })}
            </span>
          </p>
        </div>

        {all.map((item) => {
          const shown = item.id === screen.id;
          return (
            <section
              key={item.id}
              data-screen
              hidden={!shown}
              data-dir={shown ? dir : undefined}
              className="jm-q flex-col gap-4"
              style={{ display: shown ? "flex" : undefined }}
            >
              {body(item)}
            </section>
          );
        })}

        <p
          role="alert"
          className={cx("text-sm font-medium text-corail-fonce", !invalid && "sr-only")}
        >
          {invalid ? t("required") : ""}
        </p>
        <div
          data-js
          className="flex flex-wrap items-center justify-between gap-3 border-t border-brume pt-4"
        >
          <button
            type="button"
            onClick={back}
            disabled={at === 0}
            className={pillClass("outline", "md", "disabled:invisible")}
          >
            <Icon name="chev-l" className="size-4" />
            {t("previous")}
          </button>
          <span aria-live="polite" className="text-xs text-ardoise max-sm:order-last max-sm:w-full">
            {saved > 0 ? (
              <span key={saved} className="flex items-center gap-1.5">
                <Icon name="check" className="size-3.5 text-feuille" />
                {t("savedAt")}
              </span>
            ) : null}
          </span>
          <button
            type="submit"
            aria-busy={busy || undefined}
            className={pillClass(last ? "lime" : "dark")}
          >
            {last ? t("analyze") : t("next")}
            <Icon name="chev-r" className="size-4" />
          </button>
        </div>
        <div data-nojs className="hidden flex-col gap-3 border-t border-brume pt-4">
          <p className="text-sm text-ardoise">{t("welcome.noscript")}</p>
          <button type="submit" className={pillClass("dark", "md", "self-start")}>
            {t("finish")}
          </button>
        </div>
      </form>

      <aside data-js className="flex flex-col gap-4 self-start xl:sticky xl:top-6">
        <section aria-labelledby="live-radar" className={cx(card, "flex flex-col gap-3")}>
          <h2 id="live-radar" className="text-base font-semibold">
            {t("radar.live")}
          </h2>
          <div className="mx-auto w-full max-w-[300px]">
            <LiveRadar
              id="live"
              axes={radarAxes}
              title={t("radar.live")}
              description={radarText}
              size={200}
            />
          </div>
          <p className="text-xs leading-[17px] text-ardoise">{t("radar.liveHint")}</p>
        </section>
        <p className="flex gap-2 px-1 text-xs leading-[17px] text-ardoise">
          <Icon name="lock" className="mt-px size-4 shrink-0" />
          {t("privacy")}
        </p>
      </aside>
    </div>
  );
}

/** One question with its answers as large cards (a radio button in each, a check that draws). */
function Choices({
  legend,
  legendId,
  hint,
  name,
  value,
  onChange,
  options,
  small = false,
}: {
  legend: string;
  legendId?: string;
  hint?: string;
  name: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: Option[];
  small?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend
        className={cx(
          "mb-1 leading-snug font-semibold",
          small ? "text-base" : "text-[19px] lg:text-[21px]",
        )}
      >
        <span id={legendId} tabIndex={legendId ? -1 : undefined} className="outline-none">
          {legend}
        </span>
      </legend>
      {hint && <p className="mb-1 text-[13px] text-ardoise">{hint}</p>}
      <div className={cx("grid gap-2.5", options.length > 3 && "sm:grid-cols-2")}>
        {options.map((option) => (
          <label
            key={option.value}
            className="jm-choice flex min-h-13 cursor-pointer items-center gap-3 rounded-[16px] border border-brume bg-blanc px-4 py-3 text-[15px] hover:bg-creme has-checked:border-sapin has-checked:bg-lime-clair has-focus-visible:outline-3 has-focus-visible:outline-lime"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-brume bg-blanc peer-checked:border-sapin peer-checked:bg-sapin"
            >
              <svg viewBox="0 0 24 24" className="jm-choice-check size-4">
                <path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  pathLength={1}
                  fill="none"
                  stroke="var(--color-lime)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">{option.label}</span>
              {option.hint && <span className="text-[13px] text-ardoise">{option.hint}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type ScanStep = "answers" | "profile" | "offers" | "dimensions" | "priorities";
const hold = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The analysis (docs/experience-animee § 5.4). Each line is checked when its work is really
 * done: answers checked here, profile read, offers counted on the server, the six dimensions
 * computed with the same rules as the server, then the diagnostic saved (and, for the
 * personalized level, written by Jumanly Intelligence, which falls back on the rules after 25 s).
 */
function DiagnosticScan({
  answers,
  personalized,
  badge,
  onBack,
}: {
  answers: Draft;
  personalized: boolean;
  badge: ScanCard;
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
  const [lit, setLit] = useState<Partial<Record<Dimension, "low" | "mid" | "high">>>({});
  const [result, setResult] = useState<{
    href: string;
    stage: string;
    score: number;
    fallback: boolean;
  } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(-1);

  useEffect(() => {
    if (started.current === attempt) return;
    started.current = attempt;
    const reduced = motionReduced();
    const pause = reduced ? 0 : 650;
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
      await step("dimensions", async () => {
        for (const item of scoreDimensions(parsed.data)) {
          setLit((current) => ({ ...current, [item.key]: bandFor(item.score) }));
          await hold(reduced ? 0 : 140);
        }
      });
      const saved = await step("priorities", () =>
        runDiagnosticAction({ answers: parsed.data, personalized }),
      );
      if (!saved.ok) throw new Error("not saved");
      const href = `/app/career/diagnostic?bilan=${saved.id}${saved.error ? `&ia=${saved.error}` : ""}`;
      setResult({
        href,
        stage: d(`stage.${saved.stage}`),
        score: saved.score,
        fallback: personalized && saved.level === "simple",
      });
      showToast({ message: t("toast.ready"), tone: "success", href });
      if (reduced) setFlipped(true);
      else setTimeout(() => setFlipped(true), 250);
    })().catch(() => setFailed(true));
  }, [attempt, answers, personalized, d, t]);

  const label = (key: ScanStep) => {
    if (key === "offers" && offers)
      return offers.scope === "role"
        ? t("scan.offersRole", { count: offers.count })
        : t("scan.offersAll", { count: offers.count });
    if (key === "priorities" && personalized) return `${t("scan.priorities")} · ${t("scan.ai")}`;
    return d(`scan.${key}`);
  };
  const pills = [
    ...split(answers.topSkills),
    ...(answers.skillChecks ?? []).map((item) => item.skill),
  ].filter((value, index, list) => list.indexOf(value) === index);

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <ScanScene
        card={badge}
        nodesLabel={t("welcome.constellation")}
        nodes={dimensions.map((key) => ({
          key,
          label: d(`dimension.${key}.short`),
          band: lit[key] ?? null,
        }))}
        pills={pills}
        scanning={!result && !failed}
        flipped={flipped}
        back={
          result ? (
            <>
              <p className="text-[11px] font-semibold tracking-[0.1em] text-neon uppercase">
                {t("scan.ready")}
              </p>
              <p className="text-lg leading-tight font-semibold">
                {t("scan.level", { stage: result.stage })}
              </p>
              <p className="text-sm text-blanc/80">{t("result.score", { score: result.score })}</p>
              <Link
                href={result.href}
                className={pillClass(
                  "lime",
                  "sm",
                  "jm-ready-cta mt-1 self-start whitespace-nowrap max-sm:h-8 max-sm:px-3 max-sm:text-xs",
                )}
              >
                {t("scan.cta")}
                <Icon name="chev-r" className="size-4" />
              </Link>
            </>
          ) : undefined
        }
      />
      <section aria-labelledby="scan-title" className={cx(card, "flex flex-col gap-4")}>
        <h2 id="scan-title" className="text-lg font-semibold">
          {t("scan.title")}
        </h2>
        <ol aria-live="polite" className="flex flex-col gap-3">
          {steps.map((key) => {
            const value = state[key];
            const spoken = value
              ? ` (${value === "done" ? t("scan.done") : t("scan.running")})`
              : "";
            return (
              <li
                key={key}
                className={cx("flex items-center gap-3 text-[15px]", !value && "text-ardoise")}
              >
                <span
                  aria-hidden
                  className={cx(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    value === "done" ? "bg-lime" : "bg-gris-clair",
                  )}
                >
                  {value === "done" ? (
                    <svg viewBox="0 0 24 24" className="jm-scan-check size-4">
                      <path
                        d="M5 12.5l4.5 4.5L19 7.5"
                        pathLength={1}
                        strokeDasharray="1"
                        fill="none"
                        stroke="var(--color-sapin)"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : value === "run" ? (
                    <span className="jm-orb size-3 rounded-full" />
                  ) : null}
                </span>
                <span>
                  {label(key)}
                  {value && <span className="sr-only">{spoken}</span>}
                </span>
              </li>
            );
          })}
        </ol>
        {result?.fallback && (
          <p className="rounded-[16px] bg-creme p-3 text-sm">{t("scan.fallback")}</p>
        )}
        {result && (
          <p role="status" className="text-sm font-semibold text-feuille-fonce">
            {t("scan.ready")}
          </p>
        )}
        {failed && (
          <div role="alert" className="flex flex-col gap-3 rounded-[16px] bg-creme p-3 text-sm">
            <p>{t("scan.error")}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={pillClass("dark", "sm")}
                onClick={() => {
                  setFailed(false);
                  setState({});
                  setLit({});
                  setAttempt((n) => n + 1);
                }}
              >
                {t("scan.retry")}
              </button>
              <button type="button" className={pillClass("outline", "sm")} onClick={onBack}>
                {t("previous")}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
