"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showToast } from "@/components/motion/toaster";
import { voiceAdapter } from "@/lib/voice";
import {
  answerPhoneInterviewAction,
  finishPhoneInterviewAction,
} from "@/server/actions/interview-phone";
import { PhoneBack } from "../back";
import { OrbiDisc, PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import type { RunView } from "./types";

type Screen = "micro" | "run" | "analysis";
type Stage = "orbi" | "you";
type Sheet = "hint" | "stop" | null;
type Mic = "unknown" | "ok" | "denied";

const words = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);
const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
/** The three lines of « Orbi analyse vos réponses », one every 0.9 s. */
const ANALYSIS_MS = 900;

/**
 * A practice session (planches Entretien-micro, -orbi-parle, -a-vous, -relance, -indice, -pause,
 * -arreter, -ecrit-question, -analyse). Spoken: Orbi reads the question aloud (« Son » mutes it),
 * the answer is transcribed in the browser and only its text is kept; once in a session, an
 * answer without a figure gets Orbi's follow-up. Written: one question at a time. The timer stops
 * on « Pause »; nothing is sent to a recruiter.
 */
export function PhoneInterviewRun({ view }: { view: RunView }) {
  const t = useTranslations("phoneInterview");
  const router = useRouter();
  const voice = useMemo(() => voiceAdapter(view.english ? "en-US" : "fr-FR"), [view.english]);
  const spoken = view.mode === "voice";
  const count = view.questions.length;
  const [screen, setScreen] = useState<Screen>(spoken ? "micro" : "run");
  const [written, setWritten] = useState(!spoken);
  const [mic, setMic] = useState<Mic>("unknown");
  const [captions, setCaptions] = useState(true);
  const [index, setIndex] = useState(view.start);
  const [answered, setAnswered] = useState(view.start);
  const [stage, setStage] = useState<Stage>(spoken ? "orbi" : "you");
  const [followUp, setFollowUp] = useState(false);
  const [followUpDone, setFollowUpDone] = useState(false);
  const [first, setFirst] = useState("");
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [typing, setTyping] = useState(!voice.canListen);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [sending, setSending] = useState(false);
  const [left, setLeft] = useState(() =>
    Math.max(60, Math.round((view.minutes * 60 * (count - view.start)) / count)),
  );
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const stopListening = useRef<(() => void) | null>(null);
  const startedAt = useRef(0);
  const stream = useRef<MediaStream | null>(null);

  const question = followUp
    ? { question: t("run.followUpQuestion"), hint: t("run.followUpHint") }
    : view.questions[index]!;

  const speak = useCallback(
    (line: string) => {
      if (!muted && !written) voice.speak(line);
    },
    [muted, written, voice],
  );
  const hush = useCallback(() => {
    voice.stopSpeaking();
    stopListening.current?.();
    stopListening.current = null;
    setListening(false);
  }, [voice]);

  useEffect(
    () => () => {
      voice.stopSpeaking();
      stopListening.current?.();
      stream.current?.getTracks().forEach((track) => track.stop());
    },
    [voice],
  );

  // The timer: it runs during the session, stops on pause and on « Arrêter ? ».
  const running = screen === "run" && !paused && sheet !== "stop";
  const remaining = useRef(left);
  const timeUp = useRef<() => void>(() => undefined);

  const finish = useCallback(() => {
    hush();
    setSheet(null);
    setPaused(false);
    setScreen("analysis");
    setStep(0);
    void finishPhoneInterviewAction(view.id)
      .catch(() => null)
      .then(() => setFinished(true));
  }, [hush, view.id]);

  useEffect(() => {
    timeUp.current = finish;
  }, [finish]);
  // At zero the session ends and Orbi writes the report on the answers given.
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      remaining.current = Math.max(0, remaining.current - 1);
      setLeft(remaining.current);
      if (remaining.current === 0) timeUp.current();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  // « Orbi analyse vos réponses »: the lines tick, the last one waits for the feedback.
  useEffect(() => {
    if (screen !== "analysis") return;
    if (step >= 3) {
      if (finished) {
        const query = [view.origin.query, "bilan=1"].filter(Boolean).join("&");
        router.replace(`/app/career/entretiens/${view.id}?${query}`);
      }
      return;
    }
    if (step === 2 && !finished) return;
    const timer = window.setTimeout(() => setStep((value) => value + 1), ANALYSIS_MS);
    return () => window.clearTimeout(timer);
  }, [screen, step, finished, router, view.id, view.origin.query]);

  const askMic = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      setMic("ok");
    } catch {
      setMic("denied");
    }
  };

  const go = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setScreen("run");
    setStage("orbi");
    speak(view.questions[index]!.question);
  };

  const listen = () => {
    hush();
    setStage("you");
    setText("");
    startedAt.current = Date.now();
    if (typing || written) return;
    setListening(true);
    stopListening.current = voice.listen({
      onText: (value) => setText(value),
      onEnd: () => setListening(false),
      onError: () => {
        setListening(false);
        setTyping(true);
      },
    });
  };

  const next = (done: boolean) => {
    setFollowUp(false);
    setFirst("");
    setText("");
    if (done || index + 1 >= count) {
      finish();
      return;
    }
    const position = index + 1;
    setIndex(position);
    setAnswered((value) => Math.max(value, position));
    if (written) setStage("you");
    else {
      setStage("orbi");
      speak(view.questions[position]!.question);
    }
  };

  const send = async () => {
    const said = text.trim();
    if (!said) {
      showToast({ message: t("run.empty") });
      return;
    }
    hush();
    // Once in a spoken session, an answer without any figure gets « Orbi relance ».
    if (!written && !followUp && !followUpDone && !/\d/.test(said)) {
      setFirst(said);
      setFollowUp(true);
      setFollowUpDone(true);
      setStage("orbi");
      setText("");
      speak(t("run.followUpQuestion"));
      return;
    }
    const answer = followUp ? [first, said].filter(Boolean).join("\n") : said;
    setSending(true);
    const result = await answerPhoneInterviewAction({
      id: view.id,
      answer,
      durationSec: written ? undefined : Math.round((Date.now() - startedAt.current) / 1000),
      followUp: followUp ? t("run.followUpQuestion") : undefined,
    }).catch(() => null);
    setSending(false);
    if (!result?.ok) {
      showToast({ message: t("run.error"), tone: "error" });
      return;
    }
    setAnswered(index + 1);
    next(result.done);
  };

  const restartQuestion = () => {
    hush();
    setPaused(false);
    setText("");
    if (written) setStage("you");
    else {
      setStage("orbi");
      speak(question.question);
    }
  };

  const quit = () => {
    hush();
    showToast({ message: t("stop.quitted") });
    router.replace(view.origin.backHref);
  };

  if (screen === "analysis")
    return (
      <div className="nb-page nb-iv nb-iv-analyse" data-ecran="">
        <span className="nb-iv-orbi" data-actif="">
          <i aria-hidden />
          <i aria-hidden />
          <OrbiDisc size={96} />
        </span>
        <h1 className="nb-h1">{t("an.title")}</h1>
        <ol className="nb-iv-etapes" aria-live="polite">
          {[
            t("an.transcript"),
            spoken && !written ? t("an.pace") : t("an.length"),
            view.company ? t("an.offer", { company: view.company }) : t("an.job"),
          ].map((line, position) => (
            <li
              key={line}
              data-etat={position < step ? "fait" : position === step ? "encours" : "attente"}
            >
              <span aria-hidden>
                {position < step ? <PhoneIcon name="coche" size={14} stroke={3} /> : null}
              </span>
              {line}
            </li>
          ))}
        </ol>
      </div>
    );

  if (screen === "micro")
    return (
      <div className="nb-page nb-iv nb-iv-micro" data-ecran="">
        <div className="nb-iv-barre">
          <PhoneBack fallback={view.settings} label={t("mic.back")} text={t("mic.back")} />
        </div>
        <div className="nb-iv-corps">
          <h1 className="nb-h1">{t("mic.title")}</h1>
          <p className="nb-iv-sous">{t("mic.text")}</p>
          <div className="nb-iv-test">
            {mic === "ok" ? (
              <>
                <span className="nb-iv-onde" aria-hidden>
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <b data-lime="">{t("mic.ok")}</b>
                <p className="nb-meta">{t("mic.say")}</p>
              </>
            ) : (
              <>
                <span className="nb-iv-test-ic" aria-hidden>
                  <PhoneIcon name="micro" size={26} />
                </span>
                <b>{t("mic.need")}</b>
                <p className="nb-meta">{mic === "denied" ? t("mic.denied") : t("mic.kept")}</p>
                <button
                  type="button"
                  className="nb-bouton"
                  data-contour=""
                  data-large=""
                  onClick={askMic}
                >
                  {t("mic.allow")}
                </button>
              </>
            )}
          </div>
          <p className="nb-iv-gr">{t("mic.tips")}</p>
          <ul className="nb-iv-conseils">
            <li>{t("mic.tip1")}</li>
            <li>{t("mic.tip2")}</li>
            <li>{t("mic.tip3")}</li>
          </ul>
          <div className="nb-bascule">
            <span>
              <b id="iv-st">{t("mic.captions")}</b>
              <small className="nb-meta">{t("mic.captionsText")}</small>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={captions}
              aria-labelledby="iv-st"
              className="nb-switch"
              onClick={() => setCaptions((value) => !value)}
            >
              <span />
            </button>
          </div>
          <button
            type="button"
            className="nb-iv-discret"
            data-gauche=""
            onClick={() => {
              setWritten(true);
              setStage("you");
              setScreen("run");
            }}
          >
            {t("mic.write")}
          </button>
        </div>
        <div className="nb-iv-bas">
          <button
            type="button"
            className="nb-bouton"
            data-plein=""
            data-large=""
            aria-disabled={mic !== "ok"}
            onClick={() => (mic === "ok" ? go() : askMic())}
          >
            {t("mic.go")}
          </button>
        </div>
      </div>
    );

  const bars = view.questions.map((_, position) => (
    <span
      key={position}
      data-etat={position < index ? "fait" : position === index ? "encours" : undefined}
    />
  ));
  const head = (
    <div className="nb-iv-tete">
      <div className="nb-iv-progression" aria-hidden>
        {bars}
      </div>
      <div className="nb-iv-tete-l">
        <button
          type="button"
          className="nb-iv-rond-p"
          aria-label={t("run.pause")}
          onClick={() => {
            hush();
            setPaused(true);
          }}
        >
          <PhoneIcon name="pause" size={18} />
        </button>
        <span>
          <b>{t("run.question", { n: index + 1, count })}</b>
          <small className="nb-meta">
            {written
              ? t("run.leftWrite", { time: clock(left) })
              : t("run.left", { time: clock(left) })}
          </small>
        </span>
        <button
          type="button"
          className="nb-iv-terminer"
          onClick={() => {
            hush();
            setSheet("stop");
          }}
        >
          {t("run.end")}
        </button>
      </div>
    </div>
  );

  const last = index + 1 >= count && (followUp || followUpDone || written);

  return (
    <div className="nb-page nb-iv nb-iv-run" data-ecrit={written ? "" : undefined}>
      {head}
      {written ? (
        <div className="nb-iv-ecrit">
          <div className="nb-iv-bulle">
            <OrbiDisc size={30} />
            <p>{question.question}</p>
          </div>
          <button type="button" className="nb-iv-indice" onClick={() => setSheet("hint")}>
            {t("run.writeHint")}
          </button>
          <textarea
            className="nb-iv-reponse"
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-label={t("run.answerLabel")}
            placeholder={t("run.placeholder")}
            maxLength={4000}
          />
          <div className="nb-iv-envoi">
            <span className="nb-meta">{t("run.words", { count: words(text) })}</span>
            <button
              type="button"
              className="nb-bouton"
              data-plein=""
              disabled={sending}
              onClick={send}
            >
              {t("run.send")}
            </button>
          </div>
        </div>
      ) : (
        <div className="nb-iv-oral">
          <div className="nb-iv-scene">
            <span className="nb-iv-orbi" data-actif={stage === "orbi" ? "" : undefined}>
              <i aria-hidden />
              <i aria-hidden />
              <OrbiDisc size={132} />
            </span>
            <p className="nb-iv-etat">
              {stage === "you" ? t("run.listens") : followUp ? t("run.followUp") : t("run.asks")}
            </p>
          </div>
          <div className="nb-iv-question">
            {followUp && stage === "orbi" ? (
              <span className="nb-iv-relance">{t("run.followUpTag")}</span>
            ) : null}
            {captions ? (
              <p className="nb-iv-q">{t("quoted", { text: question.question })}</p>
            ) : null}
            {stage === "you" ? (
              typing ? (
                <textarea
                  className="nb-iv-reponse"
                  data-court=""
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  aria-label={t("run.answerLabel")}
                  placeholder={t("run.typed")}
                  maxLength={4000}
                />
              ) : (
                <>
                  <span className="nb-iv-onde" data-calme={listening ? undefined : ""} aria-hidden>
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  <p className="nb-iv-transcrit" aria-live="polite">
                    {text}
                    <span className="nb-iv-curseur" aria-hidden />
                  </p>
                </>
              )
            ) : null}
          </div>
          <div className="nb-iv-actions">
            <div className="nb-iv-ronds">
              <button
                type="button"
                className="nb-iv-rond"
                onClick={() => {
                  hush();
                  setStage("orbi");
                  setText("");
                  speak(question.question);
                  showToast({ message: t("run.repeated") });
                }}
              >
                <span>
                  <PhoneIcon name="refaire" size={20} />
                </span>
                {t("run.repeat")}
              </button>
              <button type="button" className="nb-iv-rond" onClick={() => setSheet("hint")}>
                <span>
                  <PhoneIcon name="idee" size={20} />
                </span>
                {t("run.hint")}
              </button>
              <button
                type="button"
                className="nb-iv-rond"
                aria-pressed={muted}
                onClick={() => {
                  voice.stopSpeaking();
                  setMuted((value) => !value);
                }}
              >
                <span>
                  <PhoneIcon name={muted ? "muet" : "son"} size={20} />
                </span>
                {muted ? t("run.muted") : t("run.sound")}
              </button>
            </div>
            {stage === "orbi" ? (
              <button
                type="button"
                className="nb-bouton"
                data-contour=""
                data-large=""
                onClick={listen}
              >
                {t("run.answerNow")}
              </button>
            ) : (
              <button
                type="button"
                className="nb-bouton"
                data-plein=""
                data-large=""
                disabled={sending}
                onClick={send}
              >
                {last ? t("run.finish") : t("run.done")}
              </button>
            )}
          </div>
        </div>
      )}

      {paused ? (
        <div className="nb-iv-pause" role="dialog" aria-modal="true" aria-labelledby="iv-pause">
          <span className="nb-iv-voile" aria-hidden />
          <div className="nb-iv-pause-c">
            <b id="iv-pause">{t("pause.title")}</b>
            <p className="nb-meta">{t("pause.text")}</p>
            <button
              type="button"
              className="nb-bouton"
              data-plein=""
              data-large=""
              onClick={() => setPaused(false)}
            >
              {t("pause.resume")}
            </button>
            <button
              type="button"
              className="nb-bouton"
              data-contour=""
              data-large=""
              onClick={restartQuestion}
            >
              {t("pause.restart")}
            </button>
            <button type="button" className="nb-iv-rouge" onClick={() => setSheet("stop")}>
              {t("pause.stop")}
            </button>
          </div>
        </div>
      ) : null}

      <PhoneSheet
        open={sheet === "hint"}
        onClose={() => setSheet(null)}
        label={t("hint.title")}
        closeLabel={t("sheet.close")}
      >
        <div className="nb-iv-feuille">
          <div className="nb-iv-feuille-t">
            <OrbiDisc size={40} />
            <span>
              <b>{t("hint.title")}</b>
              <small className="nb-meta">{t("hint.text")}</small>
            </span>
          </div>
          <p className="nb-iv-aide">{question.hint}</p>
          <p className="nb-iv-gr">{t("hint.star")}</p>
          <div className="nb-iv-star">
            {(["s", "t", "a", "r"] as const).map((key) => (
              <span key={key}>{t.rich(`hint.${key}`, { b: (chunk) => <b>{chunk}</b> })}</span>
            ))}
          </div>
          <button
            type="button"
            className="nb-bouton"
            data-plein=""
            data-large=""
            onClick={() => setSheet(null)}
          >
            {t("hint.go")}
          </button>
        </div>
      </PhoneSheet>

      <PhoneSheet
        open={sheet === "stop"}
        onClose={() => {
          setSheet(null);
          setPaused(false);
        }}
        label={t("stop.title")}
        closeLabel={t("sheet.close")}
      >
        <div className="nb-iv-feuille">
          <b className="nb-iv-feuille-h">{t("stop.title")}</b>
          <p className="nb-iv-feuille-p">{t("stop.text", { answered, count })}</p>
          <button type="button" className="nb-bouton" data-plein="" data-large="" onClick={finish}>
            {t("stop.report")}
          </button>
          <button type="button" className="nb-iv-annuler" data-rouge="" onClick={quit}>
            {t("stop.quit")}
          </button>
          <button
            type="button"
            className="nb-iv-annuler"
            data-nu=""
            onClick={() => {
              setSheet(null);
              setPaused(false);
            }}
          >
            {t("stop.continue")}
          </button>
        </div>
      </PhoneSheet>
    </div>
  );
}
