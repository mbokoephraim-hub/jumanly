"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { voiceAdapter } from "@/lib/voice";
import { cx } from "@/lib/cx";
import { TalentIcon } from "./icon";

const subscribeNothing = () => () => undefined;
/** Two minutes per answer (planche talent-4 § 5 bis). */
const MAX_SECONDS = 120;
const BARS = [10, 18, 28, 40, 26, 48, 34, 20, 44, 30, 16, 38, 24, 12, 30, 46, 22, 14];

type Labels = {
  transcript: string;
  placeholder: string;
  listen: string;
  record: string;
  stop: string;
  clear: string;
  send: string;
  time: string;
  unsupported: string;
  micDenied: string;
};

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * Spoken answer of a voice simulation (planche talent-4 § 5 bis): the question is read aloud, the
 * microphone transcribes in the browser (no audio is sent nor kept), the talent reads and corrects
 * the transcript, then sends it. Two minutes at most; its duration goes with the form for the pace
 * criterion. Without dictation in the browser, the talent types: the form stays the same.
 */
export function VoiceAnswer({
  id,
  question,
  labels,
}: {
  id: string;
  question: string;
  labels: Labels;
}) {
  const voice = useMemo(() => voiceAdapter(), []);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [measured, setMeasured] = useState(false);
  const [error, setError] = useState<"denied" | "other" | null>(null);
  const canSpeak = useSyncExternalStore(
    subscribeNothing,
    () => voice.canSpeak,
    () => false,
  );
  const canListen = useSyncExternalStore(
    subscribeNothing,
    () => voice.canListen,
    () => false,
  );
  const stopRef = useRef<() => void>(() => undefined);
  const startedAt = useRef(0);

  useEffect(() => {
    voice.speak(question);
    return () => voice.stopSpeaking();
  }, [voice, question]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
      setSeconds(Math.min(elapsed, MAX_SECONDS));
      if (elapsed >= MAX_SECONDS) stopRef.current();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  function start() {
    voice.stopSpeaking();
    setError(null);
    setText("");
    startedAt.current = Date.now();
    setSeconds(0);
    setRecording(true);
    stopRef.current = voice.listen({
      onText: setText,
      onEnd: () => {
        setRecording(false);
        setMeasured(true);
        setSeconds(Math.min(MAX_SECONDS, Math.round((Date.now() - startedAt.current) / 1000)));
      },
      onError: (reason) => {
        setRecording(false);
        setError(reason);
      },
    });
  }

  function clear() {
    if (recording) stopRef.current();
    setText("");
    setSeconds(0);
    setMeasured(false);
  }

  return (
    <>
      <div className="t-voc">
        <div className={cx("t-onde", recording && "t-actif")} aria-hidden>
          {BARS.map((height, index) => (
            <i key={index} style={{ height }} />
          ))}
        </div>
        <span className="t-tps" role="timer" aria-live="off">
          {labels.time.replace("{time}", clock(seconds))}
        </span>
        <label htmlFor={id} className="sr-only">
          {labels.transcript}
        </label>
        <textarea
          id={id}
          name="answer"
          required
          maxLength={4000}
          rows={3}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={labels.placeholder}
          className="t-voc-t"
        />
      </div>
      <div className="t-voc-b">
        <button
          type="button"
          className="t-bi t-press"
          onClick={clear}
          disabled={!text && !recording}
          aria-label={labels.clear}
        >
          <TalentIcon name="fermer" size="s" />
        </button>
        {canListen ? (
          <button
            type="button"
            className="t-mic t-press"
            aria-pressed={recording}
            aria-label={recording ? labels.stop : labels.record}
            onClick={() => (recording ? stopRef.current() : start())}
          >
            <TalentIcon name="micro" />
          </button>
        ) : null}
        <button
          type="submit"
          className="t-bi t-press"
          disabled={recording || !text.trim()}
          aria-label={labels.send}
        >
          <TalentIcon name="valider" size="s" />
        </button>
      </div>
      {canSpeak && (
        <button type="button" className="t-pq t-press" onClick={() => voice.speak(question)}>
          <TalentIcon name="lecon" />
          {labels.listen}
        </button>
      )}
      {!canListen && <p className="t-gar">{labels.unsupported}</p>}
      {error === "denied" && <p className="t-gar t-err">{labels.micDenied}</p>}
      {measured && <input type="hidden" name="durationSec" value={seconds} />}
    </>
  );
}
