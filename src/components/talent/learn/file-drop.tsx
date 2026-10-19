"use client";

import { useState } from "react";
import { cx } from "@/lib/cx";
import { TalentIcon } from "../icon";

/** « Déposer mon fichier » (planche talent-3, exercice): the chosen file's name replaces the hint. */
export function FileDrop({
  name,
  accept,
  label,
  hint,
}: {
  name: string;
  accept: string;
  label: string;
  hint: string;
}) {
  const [file, setFile] = useState<string | null>(null);
  return (
    <label className={cx("t-depot t-press cursor-pointer", file && "t-on")}>
      <span className="t-cases" aria-hidden>
        <TalentIcon name={file ? "valider" : "telecharger"} size="s" />
      </span>
      <b>{label}</b>
      <span aria-live="polite">{file ?? hint}</span>
      <input
        type="file"
        name={name}
        accept={accept}
        className="sr-only"
        onChange={(event) => setFile(event.target.files?.[0]?.name ?? null)}
      />
    </label>
  );
}
