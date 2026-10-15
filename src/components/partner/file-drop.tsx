"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/brand/icon";

/**
 * Dashed CSV zone of the e-mail import (mockup 06-02): the name of the chosen file, the format,
 * then « Importer le fichier » (the label of the file input) and the other actions (`children`).
 */
export function FileDrop({
  id,
  name,
  chooseLabel,
  emptyLabel,
  format,
  children,
}: {
  id: string;
  name: string;
  chooseLabel: string;
  emptyLabel: string;
  format: string;
  children?: ReactNode;
}) {
  const [file, setFile] = useState("");
  return (
    <div className="flex flex-col items-center gap-2 rounded-[18px] border-[1.5px] border-dashed border-brume bg-creme/40 px-4 py-5 text-center">
      <Icon name="doc" className="size-6" />
      <p className="text-[13.5px] font-semibold break-all" aria-live="polite">
        {file || emptyLabel}
      </p>
      <p className="text-[12px] leading-[17px] text-ardoise">{format}</p>
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        <input
          id={id}
          name={name}
          type="file"
          accept=".csv,text/csv"
          className="peer sr-only"
          onChange={(event) => setFile(event.currentTarget.files?.[0]?.name ?? "")}
        />
        <label
          htmlFor={id}
          className="inline-flex h-11 cursor-pointer items-center rounded-pill bg-blanc px-4 text-[13px] font-semibold ring-1 ring-brume ring-inset peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sapin hover:bg-creme lg:h-9"
        >
          {chooseLabel}
        </label>
        {children}
      </div>
    </div>
  );
}
