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

/**
 * The plan cards of « Formules » (planche talent-4 § 7, `.form`): one to choose, its button in the
 * bar at the bottom. A dearer plan opens the payment; a cheaper one is scheduled for the end of
 * the paid period. Without JavaScript every card keeps its own button.
 */
export function PlanPicker({
  plans,
  initial,
  label,
  applyFree,
}: {
  plans: PlanChoice[];
  initial: string;
  label: string;
  applyFree: string;
}) {
  const [selected, setSelected] = useState(initial);
  const choice = plans.find((plan) => plan.code === selected) ?? plans[0];
  return (
    <>
      <div role="radiogroup" aria-label={label} className="t-formules">
        {plans.map((plan) => (
          <label
            key={plan.code}
            className={cx("t-verre t-form t-press", plan.code === choice.code && "t-on")}
          >
            <input
              type="radio"
              name="formule"
              value={plan.code}
              checked={plan.code === choice.code}
              onChange={() => setSelected(plan.code)}
              className="sr-only"
            />
            {plan.badge && <span className="t-rec">{plan.badge}</span>}
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
        ))}
      </div>
      <p className="t-gar">
        <TalentIcon name="candidature" size="s" />
        <span>{applyFree}</span>
      </p>
      {choice.action.kind === "downgrade" && (
        <p role="status" className="t-aide-c">
          {choice.action.note}
        </p>
      )}
      <div className="t-verre t-fort t-bas-f">
        {choice.action.kind === "pay" ? (
          <Link href={choice.action.href} className="t-bt t-p t-pl t-press">
            {choice.action.label}
          </Link>
        ) : choice.action.kind === "downgrade" ? (
          <form action={downgradeSubscription} className="contents">
            <input type="hidden" name="family" value="talent" />
            <input type="hidden" name="plan" value={choice.code} />
            <input type="hidden" name="back" value="/app/abonnement" />
            <button type="submit" className="t-bt t-p t-pl t-press">
              {choice.action.label}
            </button>
          </form>
        ) : (
          <span aria-disabled className="t-bt t-sec t-pl">
            {choice.action.label}
          </span>
        )}
      </div>
    </>
  );
}
