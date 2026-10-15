"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type Hls from "hls.js";
import { slowConnection, subscribeDataSaver } from "@/lib/connection";

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

type Props = {
  src: string;
  poster?: string;
  lowMp4?: string;
  title: string;
  labels: VideoPlayerLabels;
};

export const speeds = ["0.75", "1", "1.25", "1.5", "2"];

/**
 * Lesson video (partie 02: adaptive HLS, manual quality choice). Native controls stay available
 * for the keyboard and screen readers; hls.js is only loaded when the browser has no HLS support.
 */
export function VideoPlayer({ src, poster, lowMp4, title, labels }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const hls = useRef<Hls | null>(null);
  const slow = useSyncExternalStore(subscribeDataSaver, slowConnection, () => false);
  const [choice, setChoice] = useState<"auto" | "low" | null>(null);
  const quality = choice ?? (slow ? "low" : "auto");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const qualityId = useId();
  const speedId = useId();

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
