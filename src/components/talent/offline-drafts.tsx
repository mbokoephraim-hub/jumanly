"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { showToast } from "@/components/motion/toaster";
import { readDraft, removeDraft, writeDraft, type Draft, type DraftField } from "@/lib/drafts";

/** Fields never kept on the phone: secrets, files, one-time codes. */
const SKIPPED_TYPES = new Set(["password", "file", "hidden", "submit", "button", "image", "reset"]);

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function visible(element: Element) {
  return (element as HTMLElement).offsetParent !== null;
}

/** Forms of the page that keep a draft: posted forms of the main column, unless opted out. */
function draftForms() {
  return [...document.querySelectorAll<HTMLFormElement>("#content form")].filter(
    (form) => form.method === "post" && !form.hasAttribute("data-no-draft") && visible(form),
  );
}

function fieldsOf(form: HTMLFormElement): Field[] {
  return [...form.elements].filter((element): element is Field => {
    if (
      !(element instanceof HTMLInputElement) &&
      !(element instanceof HTMLTextAreaElement) &&
      !(element instanceof HTMLSelectElement)
    )
      return false;
    if (!element.name || element.disabled || element.hasAttribute("data-no-draft")) return false;
    if (element.autocomplete === "one-time-code") return false;
    return !(element instanceof HTMLInputElement && SKIPPED_TYPES.has(element.type));
  });
}

function keyOf(scope: string, form: HTMLFormElement) {
  const index = draftForms().indexOf(form);
  return `${scope}:${window.location.pathname}:${form.id || `n${index}`}`;
}

function snapshot(form: HTMLFormElement): DraftField[] {
  return fieldsOf(form).map((field) =>
    field instanceof HTMLInputElement && (field.type === "checkbox" || field.type === "radio")
      ? { name: field.name, value: field.value, checked: field.checked }
      : field instanceof HTMLSelectElement && field.multiple
        ? { name: field.name, values: [...field.selectedOptions].map((option) => option.value) }
        : { name: field.name, value: field.value },
  );
}

/** Sets a value the way typing does, so React state follows (controlled fields). */
function setValue(field: Field, value: string) {
  const proto = Object.getPrototypeOf(field) as object;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(field, value);
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

function restore(form: HTMLFormElement, draft: Draft) {
  let changed = false;
  const fields = fieldsOf(form);
  for (const saved of draft.fields) {
    const field = fields.find(
      (candidate) =>
        candidate.name === saved.name &&
        (saved.checked === undefined || (candidate as HTMLInputElement).value === saved.value),
    );
    if (!field) continue;
    if (saved.checked !== undefined && field instanceof HTMLInputElement) {
      if (field.checked !== saved.checked) {
        field.click();
        changed = true;
      }
    } else if (saved.values && field instanceof HTMLSelectElement) {
      for (const option of field.options) option.selected = saved.values.includes(option.value);
      field.dispatchEvent(new Event("change", { bubbles: true }));
      changed = true;
    } else if (saved.value !== undefined && field.value !== saved.value) {
      setValue(field, saved.value);
      changed = true;
    }
  }
  return changed;
}

/**
 * Offline saving of what a person types in the talent space (owner's request, 19/10/2026): every
 * posted form of the page keeps a draft on this phone as it is typed. Sent while offline, it stays
 * on the phone and leaves as soon as the network is back if the page is still open; otherwise it is
 * put back in the form the next time the page opens. A draft is erased once its form is sent online.
 * Passwords, files and codes are never kept; drafts belong to one account and expire after 7 days.
 */
export function OfflineDrafts({
  scope,
  labels,
}: {
  /** The account: another account on the same phone never sees these drafts. */
  scope: string;
  labels: { kept: string; sending: string; restored: string };
}) {
  const pathname = usePathname();
  const { kept, sending, restored: restoredLabel } = labels;

  // Keep a draft while typing; hold a form sent offline.
  useEffect(() => {
    const timers = new WeakMap<HTMLFormElement, number>();
    const save = (form: HTMLFormElement, queued = false) =>
      writeDraft(keyOf(scope, form), { fields: snapshot(form), queued });
    const onInput = (event: Event) => {
      const form = (event.target as Field).form;
      if (!form || !draftForms().includes(form) || !event.isTrusted) return;
      window.clearTimeout(timers.get(form));
      timers.set(
        form,
        window.setTimeout(() => save(form), 300),
      );
    };
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      if (!draftForms().includes(form)) return;
      window.clearTimeout(timers.get(form));
      if (navigator.onLine) {
        removeDraft(keyOf(scope, form));
        return;
      }
      // Offline: the form is not sent (it would fail); it waits on the phone.
      event.preventDefault();
      event.stopImmediatePropagation();
      save(form, true);
      showToast({ message: kept, tone: "info" });
    };
    const onOnline = () => {
      for (const form of draftForms()) {
        if (!readDraft(keyOf(scope, form))?.queued) continue;
        showToast({ message: sending, tone: "success" });
        form.requestSubmit();
      }
    };
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    // Capture on window: before React's own submit handling of server actions.
    window.addEventListener("submit", onSubmit, true);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
      window.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("online", onOnline);
    };
  }, [scope, kept, sending]);

  // A page that opens puts back what was typed and not sent.
  useEffect(() => {
    const done = new WeakSet<HTMLFormElement>();
    const run = () => {
      let restored = false;
      for (const form of draftForms()) {
        if (done.has(form)) continue;
        done.add(form);
        const draft = readDraft(keyOf(scope, form));
        if (draft && restore(form, draft)) restored = true;
      }
      if (restored) showToast({ message: restoredLabel, tone: "info" });
    };
    // The page may stream in: once now, once when its last blocks have arrived.
    const first = window.setTimeout(run, 50);
    const late = window.setTimeout(run, 900);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(late);
    };
  }, [pathname, scope, restoredLabel]);

  return null;
}
