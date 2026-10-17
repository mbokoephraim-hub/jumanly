"use client";

import { useEffect, useId, useState } from "react";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { foldPlace } from "@/lib/places";

type Cue = { at: number | null; text: string };

const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

/** The lesson's video, rendered by VideoPlayer inside `[data-lesson-video]`. */
const lessonVideo = () =>
  document.querySelector<HTMLVideoElement>("[data-lesson-video] video") ?? null;

/**
 * Transcript of a lesson (screen 68): searchable, and when its lines carry a time, it follows
 * the video (the line being said is highlighted) and a line seeks the video to that moment.
 */
export function LessonTranscript({
  cues,
  video: hasVideo,
  labels,
}: {
  cues: Cue[];
  /** A video plays above (`[data-lesson-video]`): the timed lines follow it and seek it. */
  video: boolean;
  labels: {
    title: string;
    search: string;
    follows: string;
    none: string;
    seekHint: string;
    seek: string;
  };
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [now, setNow] = useState<number | null>(null);
  const timed = cues.length > 0 && cues.every((cue) => cue.at !== null);

  useEffect(() => {
    const video = lessonVideo();
    if (!video || !timed || !hasVideo) return;
    const update = () => setNow(video.currentTime);
    video.addEventListener("timeupdate", update);
    video.addEventListener("seeked", update);
    return () => {
      video.removeEventListener("timeupdate", update);
      video.removeEventListener("seeked", update);
    };
  }, [timed, hasVideo]);

  // The line being said: the last one whose time has passed.
  const current =
    timed && now !== null
      ? cues.reduce<number>((found, cue, index) => ((cue.at ?? 0) <= now ? index : found), -1)
      : -1;
  const search = foldPlace(query.trim());
  const shown = cues
    .map((cue, index) => ({ ...cue, index }))
    .filter((cue) => !search || foldPlace(cue.text).includes(search));

  const seek = (at: number) => {
    const video = lessonVideo();
    if (!video) return;
    video.currentTime = at;
    void video.play().catch(() => undefined);
    video.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  return (
    <>
      <div className="relative">
        <label htmlFor={`${id}-search`} className="sr-only">
          {labels.search}
        </label>
        <Icon
          name="recherche"
          className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ardoise"
        />
        <input
          id={`${id}-search`}
          type="search"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.search}
          className="h-[52px] w-full rounded-[18px] bg-blanc pr-4 pl-11 text-[14px] text-sapin shadow-douce placeholder:text-ardoise focus:ring-2 focus:ring-sapin focus:outline-none"
        />
      </div>
      <section
        aria-labelledby={`${id}-title`}
        className="overflow-hidden rounded-[22px] bg-blanc shadow-douce"
      >
        <h2
          id={`${id}-title`}
          className="flex items-center gap-2.5 bg-[linear-gradient(90deg,var(--color-neon),#F1FAB9)] px-3.5 py-[11px] text-[14.5px] font-bold"
        >
          <span
            aria-hidden
            className="grid size-[30px] place-items-center rounded-[10px] bg-blanc/65"
          >
            <Icon name="message" className="size-4" />
          </span>
          {labels.title}
          {timed && hasVideo && (
            <span className="ml-auto text-[11px] font-semibold opacity-65">{labels.follows}</span>
          )}
        </h2>
        {shown.length === 0 ? (
          <p role="status" className="px-3.5 py-4 text-[13.5px] text-ardoise">
            {labels.none}
          </p>
        ) : (
          <ol className="flex flex-col gap-0.5 px-2 pt-1.5 pb-2.5">
            {shown.map((cue) => {
              const on = cue.index === current;
              const body = (
                <>
                  {cue.at !== null && (
                    <span
                      className={cx(
                        "h-fit shrink-0 rounded-[8px] px-[7px] py-0.5 text-[11.5px] font-bold tabular-nums",
                        on ? "bg-sapin text-lime" : "bg-lime-clair text-feuille-fonce",
                      )}
                    >
                      {clock(cue.at)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">{cue.text}</span>
                </>
              );
              const line = cx(
                "flex w-full gap-2.5 rounded-[12px] p-2 text-left text-[13px] leading-[1.45]",
                on && "bg-neon",
              );
              return (
                <li key={cue.index} aria-current={on ? "time" : undefined}>
                  {cue.at !== null && hasVideo ? (
                    <button
                      type="button"
                      onClick={() => seek(cue.at!)}
                      aria-label={`${labels.seek} ${clock(cue.at)} : ${cue.text}`}
                      className={cx(
                        line,
                        "hover:bg-creme focus-visible:shadow-[inset_0_0_0_2px_var(--color-sapin)] focus-visible:outline-none",
                        on && "hover:bg-neon",
                      )}
                    >
                      {body}
                    </button>
                  ) : (
                    <p className={line}>{body}</p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
      {timed && hasVideo && (
        <p className="flex items-center gap-2 px-1 text-[12px] text-ardoise">
          <Icon name="info" className="size-3.5 shrink-0" />
          {labels.seekHint}
        </p>
      )}
    </>
  );
}
