"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { voiceAdapter } from "@/lib/voice";

const subscribeNothing = () => () => undefined;

type Labels = {
  answer: string;
  placeholder: string;
  listen: string;
  record: string;
  stop: string;
  retry: string;
  recording: string;
  speaking: string;
  unsupported: string;
  micDenied: string;
  noRecording: string;
};

/**
 * Oral answer of a voice simulation: the question is read aloud, the answer is dictated into an
 * editable text area, and its duration (for the pace criterion) goes with the form. Without
 * dictation in the browser, the talent types: the form stays the same.
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
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState<number | null>(null);
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

  const speakEvents = useMemo(
    () => ({ onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) }),
    [],
  );

  useEffect(() => {
    voice.speak(question, speakEvents);
    return () => voice.stopSpeaking();
  }, [voice, question, speakEvents]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(
      () => setSeconds(Math.round((Date.now() - startedAt.current) / 1000)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [recording]);

  function replay() {
    voice.speak(question, speakEvents);
  }

  function start() {
    voice.stopSpeaking();
    setSpeaking(false);
    setError(null);
    setText("");
    startedAt.current = Date.now();
    setSeconds(0);
    setRecording(true);
    stopRef.current = voice.listen({
      onText: setText,
      onEnd: () => {
        setRecording(false);
        setSeconds(Math.round((Date.now() - startedAt.current) / 1000));
      },
      onError: (reason) => {
        setRecording(false);
        setError(reason);
      },
    });
  }

  const clock =
    seconds === null ? "" : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {canSpeak && (
          <Button type="button" size="sm" variant="tertiary" onClick={replay}>
            {labels.listen}
          </Button>
        )}
        {canListen &&
          (recording ? (
            <Button type="button" size="sm" onClick={() => stopRef.current()}>
              {labels.stop}
            </Button>
          ) : (
            <Button type="button" size="sm" variant="secondary" onClick={start}>
              {text ? labels.retry : labels.record}
            </Button>
          ))}
      </div>
      <p role="status" className="text-sm text-ardoise">
        {recording ? labels.recording.replace("{time}", clock) : speaking ? labels.speaking : ""}
      </p>
      {!canListen && <p className="text-sm text-ardoise">{labels.unsupported}</p>}
      {error === "denied" && <p className="text-sm text-corail-fonce">{labels.micDenied}</p>}
      <label htmlFor={id} className="text-label">
        {labels.answer}
      </label>
      <textarea
        id={id}
        name="answer"
        required
        maxLength={4000}
        rows={7}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={labels.placeholder}
        className="rounded-sm border border-brume bg-blanc p-3 text-[15px] leading-6"
      />
      {seconds !== null && !recording && <input type="hidden" name="durationSec" value={seconds} />}
      <p className="text-sm text-ardoise">{labels.noRecording}</p>
    </div>
  );
}
