"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type Hls from "hls.js";
import { slowConnection, subscribeDataSaver } from "@/lib/connection";
import { speeds } from "./course-bits";

export type VideoPlayerLabels = {
  quality: string;
  auto: string;
  low: string;
  speed: string;
  /** Label of each speed, by value ("0.75", "1"…). */
  speedValues: Record<string, string>;
  error: string;
  retry: string;
  lowBandwidth: string;
};

/** Learn v2, étape 3: where to resume, and where to send the position while the video plays. */
export type VideoResume = {
  lessonId: string;
  /** Second to start at (0: from the beginning). */
  at: number;
  endpoint: string;
  /** « Reprise à 3:12 », already formatted. */
  resumed: string;
  restart: string;
};

type Props = {
  src: string;
  poster?: string;
  lowMp4?: string;
  title: string;
  labels: VideoPlayerLabels;
  resume?: VideoResume;
};

/** Seconds between two saves while the video plays. */
const SAVE_EVERY = 15;

/**
 * Lesson video (partie 02: adaptive HLS, manual quality choice). Native controls stay available
 * for the keyboard and screen readers; hls.js is only loaded when the browser has no HLS support.
 */
export function VideoPlayer({ src, poster, lowMp4, title, labels, resume }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const hls = useRef<Hls | null>(null);
  const slow = useSyncExternalStore(subscribeDataSaver, slowConnection, () => false);
  const [choice, setChoice] = useState<"auto" | "low" | null>(null);
  const quality = choice ?? (slow ? "low" : "auto");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const qualityId = useId();
  const speedId = useId();
  const [resumed, setResumed] = useState(Boolean(resume?.at));
  const applied = useRef(false);
  const lastSent = useRef(resume?.at ?? 0);

  // Learn v2, étape 3: the position goes to the server every few seconds, on pause and when the
  // page is left (beacon), so that the next visit resumes at the same second.
  const sendPosition = (beacon = false) => {
    const element = video.current;
    if (!resume || !element || !Number.isFinite(element.currentTime)) return;
    const position = Math.floor(element.currentTime);
    if (position === lastSent.current) return;
    lastSent.current = position;
    const duration = Number.isFinite(element.duration) ? Math.floor(element.duration) : undefined;
    const body = JSON.stringify({ lessonId: resume.lessonId, position, duration });
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon(resume.endpoint, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(resume.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  };
  const send = useRef(sendPosition);
  useEffect(() => {
    send.current = sendPosition;
  });

  useEffect(() => {
    if (!resume) return;
    const leave = () => {
      if (document.visibilityState === "hidden") send.current(true);
    };
    const hide = () => send.current(true);
    document.addEventListener("visibilitychange", leave);
    window.addEventListener("pagehide", hide);
    return () => {
      document.removeEventListener("visibilitychange", leave);
      window.removeEventListener("pagehide", hide);
      // Leaving the lesson inside the app (client navigation) also keeps the position.
      send.current(true);
    };
  }, [resume]);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let cancelled = false;
    const useLowFile = quality === "low" && lowMp4;
    const isHls = src.includes(".m3u8") && !useLowFile;
    if (!isHls || element.canPlayType("application/vnd.apple.mpegurl")) {
      element.src = useLowFile ? lowMp4 : src;
      return;
    }
    import("hls.js").then(({ default: HlsClass }) => {
      if (cancelled) return;
      if (!HlsClass.isSupported()) {
        element.src = lowMp4 ?? src;
        return;
      }
      const instance = new HlsClass({ capLevelToPlayerSize: true });
      hls.current = instance;
      instance.on(HlsClass.Events.MANIFEST_PARSED, () => {
        instance.currentLevel = quality === "low" ? 0 : -1;
      });
      instance.on(HlsClass.Events.ERROR, (_, data) => {
        if (data.fatal) setFailed(true);
      });
      instance.loadSource(src);
      instance.attachMedia(element);
    });
    return () => {
      cancelled = true;
      hls.current?.destroy();
      hls.current = null;
    };
  }, [src, lowMp4, quality, attempt]);

  return (
    <div className="flex flex-col gap-3">
      {resume && resumed && (
        <p
          role="status"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-blanc/85"
        >
          {resume.resumed}
          <button
            type="button"
            className="min-h-11 font-semibold text-lime underline underline-offset-2"
            onClick={() => {
              if (video.current) video.current.currentTime = 0;
              lastSent.current = -1;
              setResumed(false);
            }}
          >
            {resume.restart}
          </button>
        </p>
      )}
      <div className="overflow-hidden rounded-[18px] bg-nuit ring-1 ring-blanc/10">
        <video
          ref={video}
          controls
          playsInline
          preload="metadata"
          poster={poster}
          aria-label={title}
          className="aspect-video w-full"
          onError={() => setFailed(true)}
          onLoadedMetadata={(event) => {
            if (!resume?.at || applied.current) return;
            applied.current = true;
            const element = event.currentTarget;
            if (!element.duration || resume.at < element.duration) element.currentTime = resume.at;
          }}
          onTimeUpdate={(event) => {
            if (Math.abs(event.currentTarget.currentTime - lastSent.current) >= SAVE_EVERY) {
              sendPosition();
            }
          }}
          onPause={() => sendPosition()}
          onEnded={() => sendPosition()}
        />
      </div>
      {slow && (
        <p className="rounded-xl bg-ambre-fond px-4 py-2.5 text-[13px] text-ambre-texte">
          {labels.lowBandwidth}
        </p>
      )}
      {failed && (
        <p role="alert" className="flex flex-wrap items-center gap-3 text-sm text-blanc">
          {labels.error}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
          >
            {labels.retry}
          </button>
        </p>
      )}
      <div className="flex flex-wrap gap-3 text-[13px] text-blanc/85">
        <label htmlFor={qualityId} className="flex items-center gap-2">
          {labels.quality}
          <select
            id={qualityId}
            value={quality}
            onChange={(event) => {
              setFailed(false);
              setChoice(event.target.value === "low" ? "low" : "auto");
            }}
            className="h-9 rounded-pill border border-blanc/40 bg-sapin px-3 font-semibold text-blanc"
          >
            <option value="auto">{labels.auto}</option>
            <option value="low">{labels.low}</option>
          </select>
        </label>
        <label htmlFor={speedId} className="flex items-center gap-2">
          {labels.speed}
          <select
            id={speedId}
            defaultValue="1"
            onChange={(event) => {
              if (video.current) video.current.playbackRate = Number(event.target.value);
            }}
            className="h-9 rounded-pill border border-blanc/40 bg-sapin px-3 font-semibold text-blanc"
          >
            {speeds.map((speed) => (
              <option key={speed} value={speed}>
                {labels.speedValues[speed]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
