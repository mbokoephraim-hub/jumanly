"use client";

import { useCallback, useId, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";
import {
  addCriterionAction,
  removeCriterionAction,
  saveTemplateAction,
  setStageAction,
  type SettingsActionResult,
} from "@/server/actions/org-settings";
import { Toast } from "./team";

type Kind = "convocation" | "document" | "relance" | "refus" | "acceptation";

export type SettingsData = {
  stages: { key: string; name: string; fixed: boolean; on: boolean }[];
  templates: { kind: Kind; body: string | null }[];
  criteria: string[];
  scorecards: boolean;
};

type Tab = "etapes" | "modeles" | "grille";
type Act = (work: () => Promise<SettingsActionResult>, after?: () => void) => void;

const Plus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/**
 * Réglages du recrutement (étape 3, A5, captures 085 à 087): the stages of new offers, the message
 * templates and the interview grid of the company. Every gesture answers with a toast.
 */
export function SettingsScreen({ data, initialTab }: { data: SettingsData; initialTab: Tab }) {
  const t = useTranslations("orgSettings");
  const [tab, setTab] = useState<Tab>(initialTab);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const closeToast = useCallback(() => setToast(null), []);
  const tabsId = useId();
  const act: Act = (work, after) =>
    start(async () => {
      const result = await work();
      setToast(result.text);
      if (result.ok) after?.();
    });
  const tabs: { key: Tab; label: string }[] = [
    { key: "etapes", label: t("tabs.etapes") },
    { key: "modeles", label: t("tabs.modeles") },
    { key: "grille", label: t("tabs.grille") },
  ];

  return (
    <div className="ae-app ae-page" aria-busy={pending}>
      <h1 className="ae-h1">{t("title")}</h1>
      <div role="tablist" aria-label={t("tabs.aria")} className="ae-seg">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            id={`${tabsId}-${item.key}`}
            aria-selected={tab === item.key}
            aria-controls={`${tabsId}-${item.key}-panel`}
            onClick={() => setTab(item.key)}
            className={tab === item.key ? "ae-seg-on" : undefined}
          >
            {item.label}
            {tab === item.key && <i aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${tabsId}-${tab}-panel`}
        aria-labelledby={`${tabsId}-${tab}`}
        className="ae-panneau"
      >
        {tab === "etapes" && <Stages data={data} act={act} pending={pending} />}
        {tab === "modeles" && <Templates data={data} act={act} pending={pending} />}
        {tab === "grille" && <Grid data={data} act={act} pending={pending} />}
      </div>
      {toast && <Toast text={toast} onClose={closeToast} label={t("close")} />}
    </div>
  );
}

function Stages({ data, act, pending }: { data: SettingsData; act: Act; pending: boolean }) {
  const t = useTranslations("orgSettings");
  const on = data.stages.filter((stage) => stage.on);
  const off = data.stages.filter((stage) => !stage.on && !stage.fixed);
  return (
    <section className="ae-carte ae-rg-carte" aria-label={t("stages.list")}>
      <ol className="ae-rg-liste">
        {on.map((stage, index) => (
          <li key={stage.key} className="ae-rg-ligne">
            <span className="ae-rg-num" aria-hidden="true">
              {index + 1}
            </span>
            <b className="ae-grandit">{stage.name}</b>
            {stage.fixed ? (
              <span className="ae-tag">{t("stages.fixed")}</span>
            ) : (
              <button
                type="button"
                className="ae-btn2 ae-btn-s"
                disabled={pending}
                aria-label={t("stages.removeAria", { name: stage.name })}
                onClick={() => act(() => setStageAction({ key: stage.key, on: false }))}
              >
                {t("stages.remove")}
              </button>
            )}
          </li>
        ))}
      </ol>
      {off.length > 0 && (
        <div className="ae-pills ae-rg-ajouts">
          {off.map((stage) => (
            <button
              key={stage.key}
              type="button"
              className="ae-btn2 ae-btn-m"
              disabled={pending}
              onClick={() => act(() => setStageAction({ key: stage.key, on: true }))}
            >
              <Plus />
              {t("stages.add", { name: stage.name })}
            </button>
          ))}
        </div>
      )}
      <p className="ae-meta ae-rg-note">{t("stages.note")}</p>
    </section>
  );
}

function Templates({ data, act, pending }: { data: SettingsData; act: Act; pending: boolean }) {
  const t = useTranslations("orgSettings");
  const [kind, setKind] = useState<Kind>(data.templates[0]?.kind ?? "convocation");
  const template = data.templates.find((item) => item.kind === kind);
  const [drafts, setDrafts] = useState<Partial<Record<Kind, string>>>({});
  const body = drafts[kind] ?? template?.body ?? t(`templates.default.${kind}`);
  const name = t(`templates.kind.${kind}`);
  const titleId = useId();
  const save = (event: FormEvent) => {
    event.preventDefault();
    act(() => saveTemplateAction({ kind, body }));
  };
  return (
    <div className="ae-rg-modeles">
      <ul className="ae-rg-types" aria-label={t("templates.aria")}>
        {data.templates.map((item) => (
          <li key={item.kind}>
            <button
              type="button"
              aria-pressed={item.kind === kind}
              className={cx("ae-rg-type", item.kind === kind && "ae-rg-type-on")}
              onClick={() => setKind(item.kind)}
            >
              {t(`templates.kind.${item.kind}`)}
            </button>
          </li>
        ))}
      </ul>
      <form className="ae-carte ae-rg-modele" aria-labelledby={titleId} onSubmit={save}>
        <h2 id={titleId} className="ae-h2">
          {name}
        </h2>
        <label className="sr-only" htmlFor={`${titleId}-texte`}>
          {t("templates.label", { name })}
        </label>
        <textarea
          id={`${titleId}-texte`}
          className="ae-in ae-rg-texte"
          rows={6}
          maxLength={4000}
          value={body}
          onChange={(event) => setDrafts((all) => ({ ...all, [kind]: event.target.value }))}
        />
        <p className="ae-meta ae-rg-aide">{t("templates.help")}</p>
        <button type="submit" className="ae-btn ae-btn-m" disabled={pending}>
          {t("templates.save")}
        </button>
      </form>
    </div>
  );
}

function Grid({ data, act, pending }: { data: SettingsData; act: Act; pending: boolean }) {
  const t = useTranslations("orgSettings");
  const [name, setName] = useState("");
  const inputId = useId();
  if (!data.scorecards) {
    return (
      <section className="ae-carte ae-rg-carte">
        <p>{t("grid.locked")}</p>
        <Link href="/app/organisation/facturation" className="ae-btn2 ae-btn-m ae-rg-lien">
          {t("grid.lockedLink")}
        </Link>
      </section>
    );
  }
  const add = (event: FormEvent) => {
    event.preventDefault();
    act(
      () => addCriterionAction(name),
      () => setName(""),
    );
  };
  return (
    <section className="ae-carte ae-rg-carte" aria-label={t("grid.list")}>
      {data.criteria.length === 0 ? (
        <p className="ae-meta ae-rg-vide">{t("grid.empty")}</p>
      ) : (
        <ol className="ae-rg-liste">
          {data.criteria.map((criterion, index) => (
            <li key={criterion} className="ae-rg-ligne">
              <span className="ae-rg-num" aria-hidden="true">
                {index + 1}
              </span>
              <b className="ae-grandit">{criterion}</b>
              <button
                type="button"
                className="ae-btn2 ae-btn-s"
                disabled={pending}
                aria-label={t("grid.removeAria", { name: criterion })}
                onClick={() => act(() => removeCriterionAction(criterion))}
              >
                {t("grid.remove")}
              </button>
            </li>
          ))}
        </ol>
      )}
      <form className="ae-rg-ajout" onSubmit={add} noValidate>
        <label className="sr-only" htmlFor={inputId}>
          {t("grid.addLabel")}
        </label>
        <input
          id={inputId}
          className="ae-in ae-grandit"
          placeholder={t("grid.addLabel")}
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button type="submit" className="ae-btn2 ae-btn-m" disabled={pending}>
          {t("grid.add")}
        </button>
      </form>
      <p className="ae-meta ae-rg-note">{t("grid.note")}</p>
    </section>
  );
}
