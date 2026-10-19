"use client";

import { useState } from "react";
import Link from "next/link";
import { cx } from "@/lib/cx";
import { downgradeSubscription } from "@/server/actions/billing";
import { TalentIcon } from "../icon";

export type PlanChoice = {
  code: string;
  name: string;
  price: string;
  per: string;
  /** « Recommandé », « Votre formule » or both. */
  badge: string | null;
  lines: string[];
  current: boolean;
  action:
    | { kind: "pay"; label: string; href: string }
    | { kind: "downgrade"; label: string; note: string }
    | { kind: "none"; label: string };
};

/** The free plan, shown beside the others on a tablet or a computer only (planche web talent-4 § 7). */
export type FreeCard = {
  name: string;
  price: string;
  per: string;
  badge: string | null;
  lines: string[];
  label: string;
};

/** The button of a card, or of the bar at the bottom of a phone. */
function Action({
  choice,
  primary,
  full,
}: {
  choice: PlanChoice;
  primary: boolean;
  full: boolean;
}) {
  const size = full ? "t-pl" : "t-m";
  if (choice.action.kind === "pay") {
    return (
      <Link
        href={choice.action.href}
        className={cx("t-bt t-press", primary ? "t-p" : "t-sec", size)}
      >
        {choice.action.label}
      </Link>
    );
  }
  if (choice.action.kind === "downgrade") {
    return (
      <form action={downgradeSubscription} className="contents">
        <input type="hidden" name="family" value="talent" />
        <input type="hidden" name="plan" value={choice.code} />
        <input type="hidden" name="back" value="/app/abonnement" />
        <button type="submit" className={cx("t-bt t-press", primary ? "t-p" : "t-sec", size)}>
          {choice.action.label}
        </button>
      </form>
    );
  }
  return (
    <span aria-disabled className={cx("t-bt t-sec", size)}>
      {choice.action.label}
    </span>
  );
}

/**
 * The plan cards of « Formules » (planche talent-4 § 7, `.form`): one to choose, its button in the
 * bar at the bottom. A dearer plan opens the payment; a cheaper one is scheduled for the end of
 * the paid period. On a tablet or a computer (planche web talent-4 § 7, `.f4`) the four plans
 * stand side by side, the free one first, each with its own button.
 */
export function PlanPicker({
  plans,
  initial,
  label,
  applyFree,
  free,
}: {
  plans: PlanChoice[];
  initial: string;
  label: string;
  applyFree: string;
  free?: FreeCard;
}) {
  const [selected, setSelected] = useState(initial);
  const choice = plans.find((plan) => plan.code === selected) ?? plans[0];
  return (
    <>
      <div className="t-w4-f4">
        {free && (
          <div className="t-w4-web t-verre t-form t-fr">
            <span className={cx("t-rec", !free.badge && "t-w4-cache")}>
              {free.badge ?? free.name}
            </span>
            <span className="t-h">
              <b>{free.name}</b>
              <span className="t-prix">
                {free.price}
                <small> {free.per}</small>
              </span>
            </span>
            <ul>
              {free.lines.map((line) => (
                <li key={line}>
                  <TalentIcon name="valider" size="xs" />
                  {line}
                </li>
              ))}
            </ul>
            <span aria-disabled className="t-bt t-sec t-m">
              {free.label}
            </span>
          </div>
        )}
        <div role="radiogroup" aria-label={label} className="t-formules">
          {plans.map((plan) => (
            <div
              key={plan.code}
              className={cx("t-verre t-form t-press", plan.code === choice.code && "t-on")}
            >
              <label>
                <input
                  type="radio"
                  name="formule"
                  value={plan.code}
                  checked={plan.code === choice.code}
                  onChange={() => setSelected(plan.code)}
                  className="sr-only"
                />
                <span className={cx("t-rec", !plan.badge && "t-w4-cache")}>
                  {plan.badge ?? plan.name}
                </span>
                <span className="t-h">
                  <b>{plan.name}</b>
                  <span className="t-prix">
                    {plan.price}
                    <small> {plan.per}</small>
                  </span>
                </span>
                <ul>
                  {plan.lines.map((line) => (
                    <li key={line}>
                      <TalentIcon name="valider" size="xs" />
                      {line}
                    </li>
                  ))}
                </ul>
              </label>
              <span className="t-w4-web t-w4-fa">
                <Action choice={plan} primary={plan.code === choice.code} full={false} />
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="t-gar t-w4-tel">
        <TalentIcon name="candidature" size="s" />
        <span>{applyFree}</span>
      </p>
      {choice.action.kind === "downgrade" && (
        <p role="status" className="t-aide-c t-w4-tel">
          {choice.action.note}
        </p>
      )}
      <div className="t-verre t-fort t-bas-f t-w4-tel">
        <Action choice={choice} primary full />
      </div>
    </>
  );
}
