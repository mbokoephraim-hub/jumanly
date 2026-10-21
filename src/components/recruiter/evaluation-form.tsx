"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { showToast } from "@/components/motion/toaster";
import { TalentIcon } from "@/components/talent/icon";
import { cx } from "@/lib/cx";

type Draft = { ratings: Record<string, string>; comment: string; suite: string };

/**
 * « Évaluer » (planche r2plus EVAL): each criterion of the offer rated from 1 to 4, the opinion,
 * the next step suggested. « Brouillon » keeps the unsent answers in this browser only (a
 * convenience: nothing reaches the team before « Enregistrer »).
 */
export function EvaluationForm({
  action,
  applicationId,
  back,
  criteria,
  initial,
  max,
  draftKey,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  applicationId: string;
  back: string;
  criteria: { name: string; description: string }[];
  initial: Draft;
  max: number;
  draftKey: string;
  /** Orbi's line, between the next step and the buttons. */
  children?: ReactNode;
}) {
  const t = useTranslations("hireInterviews.evaluation");
  const [draft, setDraft] = useState<Draft>(initial);
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const saved = window.localStorage.getItem(draftKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restored from this device
      if (saved) setDraft({ ...initial, ...(JSON.parse(saved) as Draft) });
    } catch {
      // No storage (private window): the form starts from the saved evaluation.
    }
  }, [draftKey, initial]);

  const keep = () => {
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
      showToast({ message: t("draftSaved"), tone: "success" });
    } catch {
      showToast({ message: t("draftFailed"), tone: "error" });
    }
  };

  return (
    <form
      action={action}
      className="t-ri-eval"
      onSubmit={() => {
        try {
          window.localStorage.removeItem(draftKey);
        } catch {
          // Nothing kept.
        }
      }}
    >
      <input type="hidden" name="application" value={applicationId} />
      <input type="hidden" name="back" value={back} />
      {/* Web: the criteria on the left, the opinion and what comes next on the right. */}
      <div className="t-rw-evf">
        <div>
          <h2 className="t-lab-c">{t("criteria")}</h2>
          {criteria.map((criterion, index) => (
            <fieldset key={criterion.name} className="t-verre t-ri-crit">
              <input type="hidden" name="criterion" value={criterion.name} />
              <legend>
                <b>{criterion.name}</b>
                {criterion.description && <span>{criterion.description}</span>}
              </legend>
              <div className="t-ri-notes" role="radiogroup" aria-label={criterion.name}>
                {Array.from({ length: max }, (_, step) => String(step + 1)).map((value) => (
                  <label key={value} className="t-press">
                    <input
                      type="radio"
                      name={`rating-${index}`}
                      value={value}
                      required
                      checked={draft.ratings[criterion.name] === value}
                      onChange={() =>
                        setDraft((current) => ({
                          ...current,
                          ratings: { ...current.ratings, [criterion.name]: value },
                        }))
                      }
                    />
                    <b>{value}</b>
                    <span className="sr-only">{t(`rating.${value as "1"}`)}</span>
                  </label>
                ))}
              </div>
              <span className="t-ri-echelle" aria-hidden>
                <span>{t("rating.1")}</span>
                <span>{t(`rating.${String(max) as "4"}`)}</span>
              </span>
            </fieldset>
          ))}
        </div>
        <div>
          <div className="t-champ">
            <label htmlFor="ri-avis">{t("opinion")}</label>
            <div className="t-verre t-saisie">
              <textarea
                id="ri-avis"
                name="comment"
                rows={4}
                maxLength={2000}
                placeholder={t("opinionPlaceholder")}
                value={draft.comment}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, comment: event.target.value }))
                }
              />
            </div>
          </div>

          <fieldset className="t-ri-suite-f">
            <legend className="t-lab-c">{t("next")}</legend>
            <div className="t-ri-suites">
              {(["no", "yes", "maybe"] as const).map((value) => (
                <label key={value} className={cx("t-press", `t-${value}`)}>
                  <input
                    type="radio"
                    name="suite"
                    value={value}
                    required
                    checked={draft.suite === value}
                    onChange={() => setDraft((current) => ({ ...current, suite: value }))}
                  />
                  <span className="t-cases" aria-hidden>
                    <TalentIcon
                      name={value === "yes" ? "valider" : value === "no" ? "fermer" : "pourquoi"}
                      size="s"
                    />
                  </span>
                  {t(`suite.${value}`)}
                </label>
              ))}
            </div>
          </fieldset>

          {children}

          <div className="t-verre t-fort t-bas-f t-ri-bas t-rw-st">
            <button type="button" onClick={keep} className="t-bt t-sec t-m t-press">
              {t("draft")}
            </button>
            <button type="submit" className="t-bt t-p t-m t-pl t-press">
              {t("save")}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
