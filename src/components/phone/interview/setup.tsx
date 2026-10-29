"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  discardPhoneInterviewAction,
  preparePhoneInterviewAction,
} from "@/server/actions/interview-phone";
import {
  advancedFocuses,
  phoneDurations,
  phoneFocuses,
  phoneQuestionCount,
} from "@/lib/interview-options";
import { PhoneBack } from "../back";
import { OrbiDisc, PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import type { SetupView } from "./types";

type Mode = "text" | "voice";
type Focus = SetupView["initial"]["focus"];
type Tone = "easy" | "hard";
type Want = { kind: "minutes"; count: number } | { kind: "focus"; focus: Focus } | { kind: "new" };
type Ready = { id: string; questions: string[] };
type Problem = { code: string; resetsAt?: string };

/** Questions per duration (planche Entretien: 5, 10 or 15 minutes). */
const isAdvanced = (focus: Focus) => (advancedFocuses as readonly string[]).includes(focus);

/** The four lines of « Orbi prépare votre entretien », one every 0.7 s. */
const STEP_MS = 700;

/**
 * « S'entraîner pour l'entretien » (planches Entretien, -ecrit, -oral-orbi, -formation, -pro,
 * -formule, -telechargement, -pret): written or spoken, 5, 10 or 15 minutes, seven focuses and the
 * recruiter's tone. What the plan does not include shows its padlock and the plan that opens it;
 * the 5-minute trial is offered once a month. Then Orbi prepares the questions.
 */
export function PhonePracticeSetup({ view }: { view: SetupView }) {
  if (view.reserved) return <PhonePracticeReserved view={view} reserved={view.reserved} />;
  return <PhonePracticeSettings view={view} />;
}

/**
 * The simulation is kept for people who applied to an offer with a plan that includes it
 * (demande d'Ephraïm du 29/10/2026): what is done, what is missing, and that applying stays free.
 */
function PhonePracticeReserved({
  view,
  reserved,
}: {
  view: SetupView;
  reserved: NonNullable<SetupView["reserved"]>;
}) {
  const t = useTranslations("phoneInterview");
  return (
    <div className="nb-page nb-iv nb-iv-reglages" data-ecran="">
      <div className="nb-iv-barre" data-entre="">
        <PhoneBack
          fallback={view.origin.backHref}
          label={view.origin.backLabel}
          text={view.origin.backLabel}
        />
      </div>
      <div className="nb-iv-corps nb-cr">
        <h1 className="nb-h1">{t("reserved.title")}</h1>
        <div className="nb-cr-carte nb-cr-sim nb-iv-reserve">
          <span className="nb-cr-sim-i" aria-hidden>
            <PhoneIcon name="cadenas" size={20} />
          </span>
          <div className="nb-cr-sim-t">
            <small>{t("reserved.text")}</small>
          </div>
          <ul className="nb-cr-sim-c">
            <li data-fait={reserved.applied ? "" : undefined}>
              <span aria-hidden>
                {reserved.applied ? <PhoneIcon name="coche" size={14} /> : null}
              </span>
              <span>{t("reserved.applied")}</span>
              {reserved.applied ? (
                <em>{t("reserved.done")}</em>
              ) : (
                <Link href="/app/jobs">{t("reserved.appliedCta")}</Link>
              )}
            </li>
            <li data-fait={reserved.plan ? "" : undefined}>
              <span aria-hidden>{reserved.plan ? <PhoneIcon name="coche" size={14} /> : null}</span>
              <span>{t("reserved.plan", { plan: reserved.planName ?? "none" })}</span>
              {reserved.plan ? (
                <em>{t("reserved.done")}</em>
              ) : (
                <Link href="/app/abonnement/formules">{t("reserved.planCta")}</Link>
              )}
            </li>
            <li className="nb-cr-sim-gratuit">{t("reserved.free")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function PhonePracticeSettings({ view }: { view: SetupView }) {
  const t = useTranslations("phoneInterview");
  const format = useFormatter();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(view.initial.mode);
  const [minutes, setMinutes] = useState(view.initial.minutes);
  const [focus, setFocus] = useState<Focus>(view.initial.focus);
  const [tone, setTone] = useState<Tone>(view.initial.tone);
  const [jobTitle, setJobTitle] = useState(view.jobTitle);
  const [want, setWant] = useState<Want | null>(null);
  const [screen, setScreen] = useState<"settings" | "download">("settings");
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState<Ready | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [, start] = useTransition();
  const cancelled = useRef(false);

  const access = view.modes[mode];
  const included = access.included;
  const needed = access.plan;
  const durationOk = (value: number) => included || value === 5;
  const focusOk = (value: Focus) => included || !isAdvanced(value);
  const duration = durationOk(minutes) ? minutes : 5;
  const subject = focusOk(focus) ? focus : "experiences";
  const count = phoneQuestionCount(duration);
  const canStart = included || access.trialLeft;

  // The lines tick on their own; the third waits for Orbi's questions.
  useEffect(() => {
    if (screen !== "download" || step >= 4) return;
    if (step >= 2 && !ready) return;
    const timer = window.setTimeout(() => setStep((value) => value + 1), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [screen, step, ready]);

  const pickMode = (value: Mode) => {
    setMode(value);
    if (!view.modes[value].included) setMinutes(5);
  };

  const prepare = () => {
    if (!canStart) {
      setWant({ kind: "new" });
      return;
    }
    if (jobTitle.trim().length < 2) {
      setProblem({ code: "invalid" });
      return;
    }
    setProblem(null);
    setReady(null);
    setStep(0);
    setShowQuestions(false);
    cancelled.current = false;
    setScreen("download");
    start(async () => {
      const result = await preparePhoneInterviewAction({
        mode,
        focus: subject,
        minutes: duration,
        tone,
        jobTitle: jobTitle.trim(),
        jobId: view.job?.id,
      }).catch(() => ({ ok: false as const, error: "network" as const, resetsAt: undefined }));
      if (cancelled.current) {
        if (result.ok) void discardPhoneInterviewAction(result.id);
        return;
      }
      if (!result.ok) {
        setScreen("settings");
        if (result.error === "entitlement") setWant({ kind: "new" });
        else setProblem({ code: result.error, resetsAt: result.resetsAt });
        return;
      }
      setReady({ id: result.id, questions: result.questions });
    });
  };

  const backToSettings = () => {
    cancelled.current = true;
    if (ready) void discardPhoneInterviewAction(ready.id);
    setReady(null);
    setScreen("settings");
  };

  const begin = () => {
    if (!ready) return;
    const query = view.origin.query;
    router.push(`/app/career/entretiens/${ready.id}${query ? `?${query}` : ""}`);
  };

  const focusTitle = (value: Focus) => t(`focus.${value}.title`);
  const modeWord = t(`modeWord.${mode}`);
  const steps = [
    view.company ? t("dl.offer", { company: view.company }) : t("dl.job", { title: jobTitle }),
    view.cv ? t("dl.cv", { cv: view.cv }) : t("dl.profile"),
    t("dl.chosen", { count, focus: focusTitle(subject).toLocaleLowerCase("fr") }),
    mode === "voice"
      ? t("dl.voice", { tone: t(`toneWord.${tone}`) })
      : t("dl.timer", { minutes: duration }),
  ];
  const done = step >= 4 && ready !== null;

  if (screen === "download")
    return (
      <div className="nb-page nb-iv nb-iv-dl" data-ecran="">
        <div className="nb-iv-barre">
          <button type="button" className="nb-retour" onClick={backToSettings}>
            <PhoneIcon name="retour" size={22} stroke={2} />
            <span>{t("dl.back")}</span>
          </button>
        </div>
        <div className="nb-iv-centre">
          <span className="nb-iv-orbi" data-actif={done ? undefined : ""}>
            <i aria-hidden />
            <i aria-hidden />
            <OrbiDisc size={96} />
          </span>
          <h1 className="nb-h1">{done ? t("dl.ready") : t("dl.title")}</h1>
          <p className="nb-iv-sous">
            {t("dl.summary", { count, minutes: duration, mode: modeWord })}
          </p>
        </div>
        <ol className="nb-iv-etapes" aria-live="polite">
          {steps.map((text, index) => (
            <li
              key={text}
              data-etat={index < step ? "fait" : index === step && !done ? "encours" : "attente"}
            >
              <span aria-hidden>
                {index < step ? <PhoneIcon name="coche" size={14} stroke={3} /> : null}
              </span>
              {text}
            </li>
          ))}
        </ol>
        {done ? (
          <div className="nb-iv-pret">
            <p className="nb-meta">{t("dl.note")}</p>
            <button
              type="button"
              className="nb-iv-lien"
              aria-expanded={showQuestions}
              onClick={() => setShowQuestions((value) => !value)}
            >
              {showQuestions ? t("dl.hide") : t("dl.see")}
            </button>
            {showQuestions ? (
              <ol className="nb-iv-apercu">
                {ready.questions.map((question, index) => (
                  <li key={index}>
                    <span className="nb-meta">{index + 1}</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ) : null}
        <div className="nb-iv-bas">
          {done ? (
            <>
              <button
                type="button"
                className="nb-bouton"
                data-plein=""
                data-large=""
                onClick={begin}
              >
                {t("dl.start")}
              </button>
              <button type="button" className="nb-iv-discret" onClick={backToSettings}>
                {t("dl.edit")}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="nb-bouton"
              data-contour=""
              data-large=""
              onClick={backToSettings}
            >
              {t("dl.cancel")}
            </button>
          )}
        </div>
      </div>
    );

  const banner = included
    ? view.plan
      ? t("included", { plan: view.plan })
      : t("includedNoPlan")
    : access.trial
      ? access.trialLeft
        ? t("trial", { plan: needed ?? "" })
        : t("trialUsed", { plan: needed ?? "" })
      : t("notIncluded", { plan: needed ?? "" });
  const cta = included
    ? t("ctaStart", { count: duration })
    : access.trialLeft
      ? t("ctaTrial")
      : needed
        ? t("ctaUpgrade", { plan: needed })
        : t("ctaPlans");
  const wanted =
    want?.kind === "minutes"
      ? t("sheet.what.minutes", { count: want.count })
      : want?.kind === "focus"
        ? t("sheet.what.focus", { focus: focusTitle(want.focus) })
        : t("sheet.what.new");

  return (
    <div className="nb-page nb-iv nb-iv-reglages" data-ecran="">
      <div className="nb-iv-barre" data-entre="">
        <PhoneBack
          fallback={view.origin.backHref}
          label={view.origin.backLabel}
          text={view.origin.backLabel}
        />
        <Link href="/app/career/entretiens" className="nb-iv-hist">
          {t("history")}
        </Link>
      </div>
      <div className="nb-iv-corps">
        <h1 className="nb-h1">{t("title")}</h1>
        {view.job ? (
          <div className="nb-iv-offre">
            <span aria-hidden>{view.job.initials}</span>
            <span>
              <b>{view.job.title}</b>
              <small className="nb-meta">{view.job.line}</small>
            </span>
          </div>
        ) : (
          <label className="nb-iv-poste">
            <span className="nb-iv-gr">{t("jobTitle")}</span>
            <input
              className="nb-ca-in"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder={t("jobTitlePlaceholder")}
              maxLength={120}
            />
          </label>
        )}
        <div className="nb-iv-note">
          <OrbiDisc size={26} />
          <span>
            {view.company
              ? view.cv
                ? t("prepares", { company: view.company, cv: view.cv })
                : t("preparesProfile", { company: view.company })
              : t("preparesNoJob")}
          </span>
        </div>

        {problem ? (
          <p role="alert" className="nb-iv-erreur">
            {problem.code === "quota" && problem.resetsAt
              ? t("error.quota", {
                  date: format.dateTime(new Date(problem.resetsAt), {
                    day: "numeric",
                    month: "long",
                  }),
                })
              : t(
                  `error.${(["consent", "invalid", "quota", "reserved"].includes(problem.code) ? problem.code : "network") as "network"}`,
                )}
            {problem.code === "consent" ? (
              <>
                {" "}
                <Link href="/app/parametres/confidentialite">{t("error.consentCta")}</Link>
              </>
            ) : null}
          </p>
        ) : null}

        <p className="nb-iv-gr" id="iv-comment">
          {t("how")}
        </p>
        <div className="nb-iv-modes" role="radiogroup" aria-labelledby="iv-comment">
          {(["text", "voice"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => pickMode(value)}
            >
              <b>{t(`mode.${value}`)}</b>
              {view.modes[value].plan ? (
                <small>{t("from", { plan: view.modes[value].plan! })}</small>
              ) : null}
            </button>
          ))}
        </div>
        <p className="nb-iv-bandeau" data-inclus={included ? "" : undefined}>
          {banner}
        </p>

        <p className="nb-iv-gr" id="iv-duree">
          {t("duration")}
        </p>
        <div className="nb-iv-durees" role="radiogroup" aria-labelledby="iv-duree">
          {phoneDurations.map((value) => {
            const ok = durationOk(value);
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={duration === value}
                data-verrou={ok ? undefined : ""}
                onClick={() =>
                  ok ? setMinutes(value) : setWant({ kind: "minutes", count: value })
                }
              >
                <b>{t("minutes", { count: value })}</b>
                <small className="nb-meta">
                  {t("questions", { count: phoneQuestionCount(value) })}
                </small>
                {!ok && needed ? (
                  <span className="nb-iv-cad" aria-label={t("locked", { plan: needed })}>
                    <PhoneIcon name="cadenas" size={11} stroke={2.4} />
                    {needed}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="nb-iv-gr" id="iv-sujet">
          {t("focusTitle")}
        </p>
        <div className="nb-iv-sujets" role="radiogroup" aria-labelledby="iv-sujet">
          {phoneFocuses.map((value) => {
            const ok = focusOk(value);
            const on = subject === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={on}
                data-verrou={ok ? undefined : ""}
                onClick={() => (ok ? setFocus(value) : setWant({ kind: "focus", focus: value }))}
              >
                <span>
                  <b>{t(`focus.${value}.title`)}</b>
                  <small className="nb-meta">{t(`focus.${value}.text`)}</small>
                </span>
                {!ok && needed ? (
                  <span className="nb-iv-cad" aria-label={t("locked", { plan: needed })}>
                    <PhoneIcon name="cadenas" size={11} stroke={2.4} />
                    {needed}
                  </span>
                ) : null}
                <i aria-hidden>{on ? <PhoneIcon name="coche" size={13} stroke={3} /> : null}</i>
              </button>
            );
          })}
        </div>

        <p className="nb-iv-gr" id="iv-ton">
          {t("tone")}
        </p>
        <div className="nb-iv-tons" role="radiogroup" aria-labelledby="iv-ton">
          {(["easy", "hard"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={tone === value}
              className="nb-chip"
              onClick={() => setTone(value)}
            >
              {t(`toneName.${value}`)}
            </button>
          ))}
        </div>
        <p className="nb-meta nb-iv-prive">{t("private")}</p>
      </div>
      <div className="nb-iv-bas">
        <button type="button" className="nb-bouton" data-plein="" data-large="" onClick={prepare}>
          {cta}
        </button>
      </div>

      <PhoneSheet
        open={want !== null}
        onClose={() => setWant(null)}
        label={t(`sheet.title.${mode}`, { plan: needed ?? "" })}
        closeLabel={t("sheet.close")}
      >
        <div className="nb-iv-formule">
          <span className="nb-iv-formule-ic" aria-hidden>
            <PhoneIcon name={mode === "voice" ? "micro" : "modifier"} size={26} />
          </span>
          <b>{t(`sheet.title.${mode}`, { plan: needed ?? "" })}</b>
          <p>{t("sheet.text", { what: wanted, plan: needed ?? "" })}</p>
          <Link href="/app/abonnement" className="nb-bouton" data-plein="" data-large="">
            {t("sheet.plans")}
          </Link>
          {access.trialLeft ? (
            <button
              type="button"
              className="nb-iv-annuler"
              onClick={() => {
                setMinutes(5);
                if (isAdvanced(focus)) setFocus("experiences");
                setWant(null);
              }}
            >
              {t("sheet.keepTrial")}
            </button>
          ) : null}
          <button type="button" className="nb-iv-annuler" data-nu="" onClick={() => setWant(null)}>
            {t("sheet.later")}
          </button>
        </div>
      </PhoneSheet>
    </div>
  );
}
