"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PhoneIcon } from "../icon";
import { OrbiSpark } from "./marks";

/** What stops Orbi on « Mes informations », and the plan that includes it when locked. */
export type OrbiState = { state: "ready" | "consent" | "entitlement" | "quota"; plan: string };

/** The versions of one box: before Orbi, Orbi's, and again; `at` is the one shown. */
export type OrbiHistory = { stack: string[][]; at: number };

function Arrow({ back }: { back: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={
          back
            ? "M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"
            : "m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13"
        }
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Orbi on one box (Ephraïm, 31/10/2026): « Améliorer » (Pro), then an arrow back to the text
 * before Orbi and an arrow forward to Orbi's text again, right in the box. Without the plan,
 * the button shows a padlock and says which plan includes it.
 */
export function OrbiTools({
  orbi,
  busy,
  disabled,
  history,
  onImprove,
  onUndo,
  onRedo,
}: {
  orbi: OrbiState;
  busy: boolean;
  disabled: boolean;
  history: OrbiHistory | null;
  onImprove: () => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const t = useTranslations("phoneCv.orbiField");
  const [why, setWhy] = useState(false);
  const ready = orbi.state === "ready";
  return (
    <span className="nb-cvo">
      {history ? (
        <span className="nb-cvo-fleches">
          <button
            type="button"
            onClick={onUndo}
            disabled={history.at === 0}
            aria-label={t("undo")}
            title={t("undo")}
          >
            <Arrow back />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={history.at >= history.stack.length - 1}
            aria-label={t("redo")}
            title={t("redo")}
          >
            <Arrow back={false} />
          </button>
        </span>
      ) : null}
      <button
        type="button"
        className="nb-cvo-b"
        data-verrou={ready ? undefined : ""}
        aria-busy={busy}
        aria-expanded={ready ? undefined : why}
        disabled={ready && (disabled || busy)}
        onClick={() => (ready ? onImprove() : setWhy((open) => !open))}
      >
        {ready ? <OrbiSpark size={13} /> : <PhoneIcon name="cadenas" size={12} stroke={2.4} />}
        {busy
          ? t("busy")
          : orbi.state === "entitlement"
            ? t("locked", { plan: orbi.plan })
            : t("improve")}
      </button>
      {why && !ready ? (
        <span className="nb-cvo-pourquoi" role="status">
          {t(`why.${orbi.state}`, { plan: orbi.plan })}{" "}
          <Link
            href={
              orbi.state === "consent"
                ? "/app/parametres/confidentialite"
                : "/app/abonnement/formules"
            }
          >
            {t(`whyLink.${orbi.state}`)}
          </Link>
        </span>
      ) : null}
    </span>
  );
}

const words = (text: string) => text.split(/(\s+)/).filter(Boolean);

/** Word by word: what Orbi kept, added (`ins`) and took away (`del`). */
export function diffWords(before: string, after: string) {
  const a = words(before);
  const b = words(after);
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      table[i]![j] =
        a[i] === b[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
  const parts: { kind: "same" | "ins" | "del"; text: string }[] = [];
  const push = (kind: "same" | "ins" | "del", text: string) => {
    const previous = parts[parts.length - 1];
    if (previous?.kind === kind) previous.text += text;
    else parts.push({ kind, text });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push("same", a[i]!);
      i++;
      j++;
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) push("del", a[i++]!);
    else push("ins", b[j++]!);
  }
  while (i < a.length) push("del", a[i++]!);
  while (j < b.length) push("ins", b[j++]!);
  return parts;
}

/**
 * « Ce qu'Orbi a changé » under the box: each line changed, the words added highlighted and the
 * words removed struck through, so the talent sees the gain at a glance.
 */
export function OrbiChanges({ before, after }: { before: string[]; after: string[] }) {
  const t = useTranslations("phoneCv.orbiField");
  const lines = after
    .map((text, index) => ({ index, before: before[index] ?? "", after: text }))
    .filter((line) => line.after.trim() && line.after !== line.before);
  if (lines.length === 0) return null;
  return (
    <div className="nb-cvo-changes" aria-live="polite">
      <b>
        <OrbiSpark size={12} />
        {t("changed", { count: lines.length })}
      </b>
      {lines.map((line) => (
        <p key={line.index}>
          {diffWords(line.before, line.after).map((part, index) =>
            part.kind === "same" ? (
              <span key={index}>{part.text}</span>
            ) : part.kind === "ins" ? (
              <ins key={index}>{part.text}</ins>
            ) : (
              <del key={index}>{part.text}</del>
            ),
          )}
        </p>
      ))}
    </div>
  );
}
