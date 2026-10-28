"use client";

import { useState } from "react";
import type { CareerView } from "../career/data";
import { LanguagesSheet } from "../career/sheets";

/** « Modifier » of « Langues » on a recruiter's own profile: the sheet of Carrière. */
export function OwnLanguages({ label, choices }: { label: string; choices: CareerView["sheets"] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open ? <LanguagesSheet open onClose={() => setOpen(false)} choices={choices} /> : null}
    </>
  );
}
