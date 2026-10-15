"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

export type TrackedField = {
  /** Form field name (`name`, `price`, `e:ai.credits.monthly`…). */
  name: string;
  /** What the impact list shows (the entitlement key or the field label). */
  label: string;
  /** Saved value; a checkbox is "true" or "false". */
  from: string;
  checkbox?: boolean;
  provisional?: boolean;
};

/** Separators of « 150 → 120 » (the arrow is read as a comma). */
const arrow = "→";
const comma = ", ";

type Change = { field: TrackedField; to: string };

function readChanges(form: HTMLFormElement, fields: TrackedField[]): Change[] {
  const changes: Change[] = [];
  for (const field of fields) {
    const element = form.elements.namedItem(field.name);
    if (!(element instanceof HTMLInputElement)) continue;
    const to = field.checkbox ? String(element.checked) : element.value.trim();
    if (to !== field.from) changes.push({ field, to });
  }
  return changes;
}

/**
 * « Aperçu de l'impact » (mockup 07-04): the values changed in the plan form, before → after, the
 * subscribers concerned, and the apply button (disabled while nothing has changed). Without
 * JavaScript, the list stays empty and the button stays enabled.
 */
export function PlanImpact({
  formId,
  fields,
  labels,
  writable,
}: {
  formId: string;
  fields: TrackedField[];
  labels: {
    title: string;
    impact: string;
    none: string;
    confirm: string;
    provisional: string;
    on: string;
    off: string;
    readOnly: string;
  };
  writable: boolean;
}) {
  const [changes, setChanges] = useState<Change[] | null>(null);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    const update = () => setChanges(readChanges(form, fields));
    update();
    const onReset = () => setTimeout(update);
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("reset", onReset);
    return () => {
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
      form.removeEventListener("reset", onReset);
    };
  }, [formId, fields]);

  const show = (field: TrackedField, value: string) =>
    field.checkbox ? (value === "true" ? labels.on : labels.off) : value || "·";

  return (
    <section
      aria-labelledby={`${formId}-impact`}
      className="relative isolate flex flex-col gap-3.5 overflow-hidden rounded-[24px] bg-sapin p-5 text-blanc lg:p-[22px]"
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[url(/marque/motifs/motif-trajectoires-sombre.svg)] bg-[length:360px] opacity-20"
      />
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-[38px] shrink-0 place-items-center rounded-[12px] bg-lime text-sapin"
        >
          <Icon name="eye" className="size-[18px]" />
        </span>
        <h2 id={`${formId}-impact`} className="text-[16px] leading-[22px] font-semibold">
          {labels.title}
        </h2>
      </div>
      <div aria-live="polite" className="flex flex-col gap-2 rounded-[16px] bg-blanc/7 p-3.5">
        {changes && changes.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {changes.map(({ field, to }) => (
              <li
                key={field.name}
                className="flex items-center justify-between gap-3 text-[12px] leading-[17px]"
              >
                <span className="min-w-0 break-all text-blanc/75">{field.label}</span>
                <span className="flex shrink-0 items-center gap-1 font-semibold">
                  {show(field, field.from)} <span aria-hidden>{arrow}</span>
                  <span className="sr-only">{comma}</span> {show(field, to)}
                  {field.provisional && (
                    <span className="ml-1 inline-flex h-5 items-center rounded-pill bg-ambre-fond px-2 text-[11px] text-ambre-texte">
                      {labels.provisional}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12px] leading-[17px] text-blanc/75">{labels.none}</p>
        )}
      </div>
      <p className="text-[13px] leading-[19px]">{labels.impact}</p>
      {writable ? (
        <button
          type="submit"
          form={formId}
          disabled={changes !== null && changes.length === 0}
          className={cx(
            "inline-flex h-10 items-center justify-center gap-2 rounded-pill bg-lime px-[18px] text-[13px] font-semibold text-sapin",
            "hover:bg-[#b5f585] focus-visible:shadow-[0_0_0_4px_rgb(227_246_124/0.6)] focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-55",
          )}
        >
          {labels.confirm}
        </button>
      ) : (
        <p className="flex items-start gap-2 text-[12px] leading-[17px] text-blanc/75">
          <Icon name="lock" className="mt-px size-3.5 shrink-0" />
          {labels.readOnly}
        </p>
      )}
    </section>
  );
}
