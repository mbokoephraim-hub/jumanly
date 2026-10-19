"use client";

import { useSyncExternalStore } from "react";
import {
  dataSaverOn,
  setDataSaver,
  setTextOnly,
  subscribeDataSaver,
  textOnlyOn,
} from "@/lib/connection";
import { TalentIcon } from "../icon";

export type LessonSettingsLabels = {
  quality: string;
  qualityAuto: string;
  qualityLow: string;
  valueAuto: string;
  valueLow: string;
  saver: string;
  saverText: string;
  textOnly: string;
  textOnlyText: string;
};

/**
 * « Réglages de la leçon » (planche talent-3 § 9): the quality follows the connection, the data
 * saver loads the lightest video, « Lire sans vidéo » keeps the text and the images. Both choices
 * stay on this device (shared with the offline page) and apply at once, without reloading.
 */
export function LessonSettings({ labels }: { labels: LessonSettingsLabels }) {
  const saver = useSyncExternalStore(subscribeDataSaver, dataSaverOn, () => false);
  const textOnly = useSyncExternalStore(subscribeDataSaver, textOnlyOn, () => false);
  return (
    <div className="t-verre t-liste">
      <div className="t-li">
        <span className="t-cases t-c2">
          <TalentIcon name="lecon" size="s" />
        </span>
        <span className="t-t">
          <b>{labels.quality}</b>
          <span>{saver ? labels.qualityLow : labels.qualityAuto}</span>
        </span>
        <span className="t-v">{saver ? labels.valueLow : labels.valueAuto}</span>
      </div>
      <label className="t-li cursor-pointer">
        <span className="t-cases t-c1">
          <TalentIcon name="progression" size="s" />
        </span>
        <span className="t-t">
          <b>{labels.saver}</b>
          <span>{labels.saverText}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={saver}
          onChange={(event) => setDataSaver(event.target.checked)}
          className="sr-only"
        />
        <span aria-hidden className="t-sw" />
      </label>
      <label className="t-li cursor-pointer">
        <span className="t-cases t-c3">
          <TalentIcon name="document" size="s" />
        </span>
        <span className="t-t">
          <b>{labels.textOnly}</b>
          <span>{labels.textOnlyText}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={textOnly}
          onChange={(event) => setTextOnly(event.target.checked)}
          className="sr-only"
        />
        <span aria-hidden className="t-sw" />
      </label>
    </div>
  );
}

/** The chip over the video (« Auto · 360p »): it names the quality and opens the settings. */
export function QualityChip({
  target,
  label,
  auto,
  low,
}: {
  target: string;
  label: string;
  auto: string;
  low: string;
}) {
  const saver = useSyncExternalStore(subscribeDataSaver, dataSaverOn, () => false);
  return (
    <button
      type="button"
      className="t-q-v t-press"
      aria-haspopup="dialog"
      aria-controls={target}
      aria-label={label}
      onClick={() => (document.getElementById(target) as HTMLDialogElement | null)?.showModal()}
    >
      {saver ? low : auto}
    </button>
  );
}
