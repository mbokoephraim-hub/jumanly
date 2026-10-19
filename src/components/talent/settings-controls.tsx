"use client";

import { useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { dataSaverOn, setDataSaver, subscribeDataSaver } from "@/lib/connection";
import { updateAppearance } from "@/server/actions/settings";

/**
 * A row with a switch that saves at once (planche talent-4 § 8): the switch is a real checkbox of
 * its form, sent when it changes. Without JavaScript the « Enregistrer » button sends the form.
 */
export function SwitchRow({
  name,
  value = "on",
  defaultChecked,
  title,
  text,
  icon,
  disabled,
}: {
  name: string;
  value?: string;
  defaultChecked?: boolean;
  title: string;
  text?: string;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="t-li t-press">
      {icon}
      <span className="t-t">
        <b>{title}</b>
        {text && <span>{text}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      />
      <span aria-hidden className="t-sw" />
    </label>
  );
}

/** A segment of two or three choices that saves its form as soon as one is picked. */
export function SegmentRadios({
  name,
  labelledBy,
  current,
  options,
}: {
  name: string;
  labelledBy: string;
  current: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="t-seg t-seg-r">
      {options.map((option) => (
        <label key={option.value} className="t-press">
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={option.value === current}
            className="sr-only"
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

/** « Économiser les données »: kept on this phone (images and video lighter), never on the account. */
export function DataSaverRow({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: ReactNode;
}) {
  const on = useSyncExternalStore(subscribeDataSaver, dataSaverOn, () => false);
  return (
    <label className="t-li t-press">
      {icon}
      <span className="t-t">
        <b>{title}</b>
        <span>{text}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        onChange={(event) => setDataSaver(event.target.checked)}
        className="sr-only"
      />
      <span aria-hidden className="t-sw" />
    </label>
  );
}

type Appearance = "auto" | "light" | "dark";

/**
 * « Apparence » choices of the sheet: Auto (like the phone), Clair, Sombre. The choice is kept in
 * the background and the page follows it at once; without JavaScript the form posts.
 */
export function AppearanceChoices({
  current,
  labels,
}: {
  current: Appearance;
  labels: Record<Appearance, { title: string; text: string }> & { group: string; saved: string };
}) {
  const [appearance, setAppearance] = useState<Appearance>(current);
  const [, startTransition] = useTransition();
  return (
    <form action={updateAppearance} className="t-choix" aria-label={labels.group}>
      {(["auto", "light", "dark"] as const).map((value) => (
        <label key={value} className="t-verre t-ch t-press">
          <input
            type="radio"
            name="appearance"
            value={value}
            checked={appearance === value}
            onChange={() => {
              setAppearance(value);
              const data = new FormData();
              data.set("appearance", value);
              startTransition(async () => {
                await updateAppearance(data);
                showToast({ message: labels.saved, tone: "success" });
              });
            }}
          />
          <span className="t-t">
            <b>{labels[value].title}</b>
            <span>{labels[value].text}</span>
          </span>
          <span aria-hidden className="t-radio" />
        </label>
      ))}
      <noscript>
        <button type="submit" className="t-bt t-p t-pl">
          {labels.saved}
        </button>
      </noscript>
    </form>
  );
}

/**
 * Account deletion (planche talent-4 § 8, « Supprimer mon compte ? »): the button wakes up once
 * SUPPRIMER is typed; with « Télécharger mes données d'abord », the file is fetched before sending.
 */
export function DeleteAccountFields({
  word,
  labels,
  exportHref,
  needsPassword,
}: {
  word: string;
  labels: {
    export: string;
    exportHint: string;
    type: string;
    password: string;
    confirm: string;
    cancel: string;
  };
  exportHref: string;
  needsPassword: boolean;
}) {
  const [typed, setTyped] = useState("");
  const [exportFirst, setExportFirst] = useState(true);
  const exported = useRef(false);
  const ready = typed.trim().toUpperCase() === word;
  return (
    <>
      <label className="t-li t-press t-li-nu">
        <span className="t-t">
          <b>{labels.export}</b>
          <span>{labels.exportHint}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={exportFirst}
          onChange={(event) => setExportFirst(event.target.checked)}
          className="sr-only"
        />
        <span aria-hidden className="t-sw" />
      </label>
      <div className="t-champ">
        <label className="t-lab-c" htmlFor="supprimer-mot">
          {labels.type}
        </label>
        <span className="t-verre t-saisie">
          <input
            id="supprimer-mot"
            name="confirm"
            autoComplete="off"
            autoCapitalize="characters"
            required
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
          />
        </span>
      </div>
      {needsPassword && (
        <div className="t-champ">
          <label className="t-lab-c" htmlFor="supprimer-mdp">
            {labels.password}
          </label>
          <span className="t-verre t-saisie">
            <input
              id="supprimer-mdp"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </span>
        </div>
      )}
      <div className="t-bts">
        <button
          type="button"
          className="t-bt t-sec t-m t-press"
          onClick={(event) => event.currentTarget.closest("dialog")?.close()}
        >
          {labels.cancel}
        </button>
        <button
          type="submit"
          aria-disabled={!ready}
          className="t-bt t-dg t-m t-pl t-press"
          onClick={(event) => {
            if (!ready) {
              event.preventDefault();
              return;
            }
            if (exportFirst && !exported.current) {
              // The file first, then the request: the deletion closes the session.
              event.preventDefault();
              exported.current = true;
              const form = event.currentTarget.form;
              const link = document.createElement("a");
              link.href = exportHref;
              link.download = "";
              document.body.append(link);
              link.click();
              link.remove();
              window.setTimeout(() => form?.requestSubmit(), 1500);
            }
          }}
        >
          {labels.confirm}
        </button>
      </div>
    </>
  );
}
