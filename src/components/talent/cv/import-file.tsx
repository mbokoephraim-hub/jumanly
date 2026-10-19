"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cx } from "@/lib/cx";
import { TalentIcon } from "../icon";

/** A file field that sends its form as soon as a file is chosen (« Choisir un fichier »). */
function Field({
  id,
  className,
  children,
}: {
  id: string;
  className: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <label htmlFor={id} className={cx(className, "t-press cursor-pointer")} aria-busy={pending}>
      {children}
      <input
        id={id}
        type="file"
        name="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        disabled={pending}
        onChange={(event) => {
          if (event.currentTarget.files?.length) event.currentTarget.form?.requestSubmit();
        }}
      />
    </label>
  );
}

/** The drop zone of the planche (`.depot`): an icon, « Choisir un fichier », the limits. */
export function ImportDrop({
  id,
  label,
  hint,
  reading,
}: {
  id: string;
  label: string;
  hint: string;
  reading: string;
}) {
  return (
    <Field id={id} className="t-depot">
      <Status label={label} hint={hint} reading={reading} />
    </Field>
  );
}

function Status({ label, hint, reading }: { label: string; hint: string; reading: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      <span className="t-cases" aria-hidden>
        {pending ? <span className="t-roue" /> : <TalentIcon name="telecharger" size="s" />}
      </span>
      <b>{pending ? reading : label}</b>
      <span aria-live="polite">{hint}</span>
    </>
  );
}

/** « Depuis LinkedIn » (`.pj`): the PDF LinkedIn makes of a profile, read like any CV. */
export function ImportRow({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Field id={id} className="t-verre t-pj">
      {children}
    </Field>
  );
}
