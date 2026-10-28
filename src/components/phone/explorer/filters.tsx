"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { exploreFilterAction } from "@/server/actions/explore";
import {
  FILTER_CONTRACTS,
  FILTER_RESIDENCES,
  FILTER_SALARIES,
  FILTER_SCOPES,
  FILTER_SECTORS,
  type ExploreFilters,
  type FilterSalary,
  activeFilters,
  showsSection,
} from "@/server/services/explore-filters";
import { PhoneSheet } from "../sheet";
import type { ExplorerHomeView } from "./data";

/** Where the bar under the salaries shows the range chosen (planche Explorer-filtres). */
const SALARY_BAR: Record<FilterSalary, [number, number]> = {
  lt300: [0, 20],
  from300: [20, 33],
  from800: [53, 27],
  gt1500: [80, 20],
};

/** « Filtres » next to the search: Lime, with the number of filters on. */
export function FiltersButton({ count, onOpen }: { count: number; onOpen: () => void }) {
  const t = useTranslations("phoneExplorer.filters");
  return (
    <button
      type="button"
      className="nb-ex-fbtn"
      aria-label={t("buttonCount", { count })}
      aria-haspopup="dialog"
      onClick={onOpen}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 7h10M18 7h2M4 17h4M12 17h8"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="7" r="2.2" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="10" cy="17" r="2.2" stroke="currentColor" strokeWidth="2.2" />
      </svg>
      {t("button")}
      {count > 0 ? <span className="nb-ex-fbtn-n">{count}</span> : null}
    </button>
  );
}

/**
 * The sheet of filters of Explorer (docs/fil-menu-publication § 3, planche Explorer-filtres): it
 * rises from the bottom over a dark veil; « Effacer » at the top, « Voir N résultats » at the
 * bottom. The groups that do not concern the scope fold away and come back the same way. The
 * number is read on the server while the choices change; « Voir » brings the lists.
 */
export function FiltersSheet({
  open,
  applied,
  onClose,
  onApply,
}: {
  open: boolean;
  applied: ExploreFilters;
  onClose: () => void;
  onApply: (filters: ExploreFilters, lists: ExplorerHomeView | null) => void;
}) {
  const t = useTranslations("phoneExplorer.filters");
  const [draft, setDraft] = useState(applied);
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  // Opening starts from the filters in use.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the sheet opens on them
    setDraft(applied);
    setFailed(false);
  }, [open, applied]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    const timer = setTimeout(() => {
      void exploreFilterAction(draft, false).then((result) => {
        if (live && result.ok) setCount(result.value.count);
      });
    }, 180);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [open, draft]);

  const toggle = <K extends "contracts" | "sectors">(key: K, value: ExploreFilters[K][number]) =>
    setDraft((current) => {
      const list = current[key] as string[];
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      };
    });

  const apply = () => {
    if (busy) return;
    if (activeFilters(draft) === 0) {
      onApply(draft, null);
      return;
    }
    setBusy(true);
    setFailed(false);
    void exploreFilterAction(draft, true).then((result) => {
      setBusy(false);
      if (!result.ok || !result.value.home) {
        setFailed(true);
        return;
      }
      onApply(draft, result.value.home);
    });
  };

  const shown = {
    contract: showsSection(draft.scope, "offres"),
    salary: showsSection(draft.scope, "offres"),
    sector: showsSection(draft.scope, "entreprises"),
    residence: showsSection(draft.scope, "personnes"),
  };
  const bar = draft.salary ? SALARY_BAR[draft.salary] : [0, 100];

  return (
    <PhoneSheet
      open={open}
      onClose={onClose}
      label={t("title")}
      closeLabel={t("close")}
      className="nb-ex-feuille"
    >
      <div className="nb-ex-f-tete">
        <h2>{t("title")}</h2>
        <button
          type="button"
          onClick={() =>
            setDraft((current) => ({
              ...current,
              contracts: [],
              salary: null,
              sectors: [],
              residence: null,
            }))
          }
        >
          {t("clear")}
        </button>
      </div>
      <div className="nb-ex-f-corps">
        <Group id="ex-f-portee" label={t("scope")} shown>
          {FILTER_SCOPES.map((key) => (
            <Option
              key={key}
              on={draft.scope === key}
              onPick={() => setDraft((current) => ({ ...current, scope: key }))}
            >
              {t(`scopes.${key}`)}
            </Option>
          ))}
        </Group>
        <Group id="ex-f-contrat" label={t("contract")} shown={shown.contract}>
          {FILTER_CONTRACTS.map((key) => (
            <Option
              key={key}
              on={draft.contracts.includes(key)}
              onPick={() => toggle("contracts", key)}
            >
              {t(`contracts.${key}`)}
            </Option>
          ))}
        </Group>
        <Group
          id="ex-f-salaire"
          label={t("salary")}
          shown={shown.salary}
          after={
            <>
              <div className="nb-ex-f-barre" aria-hidden>
                <span style={{ left: `${bar[0]}%`, width: `${bar[1]}%` }} />
              </div>
              <div className="nb-ex-f-echelle" aria-hidden>
                <span>{t("scaleLow")}</span>
                <span>{t("scaleMid")}</span>
                <span>{t("scaleHigh")}</span>
              </div>
            </>
          }
        >
          {FILTER_SALARIES.map((key) => (
            <Option
              key={key}
              on={draft.salary === key}
              onPick={() =>
                setDraft((current) => ({
                  ...current,
                  salary: current.salary === key ? null : key,
                }))
              }
            >
              {t(`salaries.${key}`)}
            </Option>
          ))}
        </Group>
        <Group id="ex-f-secteur" label={t("sector")} shown={shown.sector}>
          {FILTER_SECTORS.map((key) => (
            <Option
              key={key}
              on={draft.sectors.includes(key)}
              onPick={() => toggle("sectors", key)}
            >
              {t(`sectors.${key}`)}
            </Option>
          ))}
        </Group>
        <Group id="ex-f-residence" label={t("residence")} shown={shown.residence}>
          {FILTER_RESIDENCES.map((key) => (
            <Option
              key={key}
              on={draft.residence === key}
              onPick={() =>
                setDraft((current) => ({
                  ...current,
                  residence: current.residence === key ? null : key,
                }))
              }
            >
              {t(`residences.${key}`)}
            </Option>
          ))}
        </Group>
      </div>
      <div className="nb-ex-f-bas">
        {failed ? (
          <p className="nb-erreur" role="alert">
            {t("failed")}
          </p>
        ) : null}
        <button
          type="button"
          className="nb-ex-f-voir"
          aria-busy={busy || undefined}
          aria-live="polite"
          onClick={apply}
        >
          {count === null ? t("counting") : t("see", { count })}
        </button>
      </div>
    </PhoneSheet>
  );
}

function Group({
  id,
  label,
  shown,
  after,
  children,
}: {
  id: string;
  label: string;
  shown: boolean;
  after?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="nb-ex-f-grp"
      data-replie={shown ? undefined : ""}
      inert={!shown}
      aria-hidden={!shown || undefined}
    >
      <span className="nb-ex-f-gl" id={id}>
        {label}
      </span>
      <div className="nb-ex-f-opts" role="group" aria-labelledby={id}>
        {children}
      </div>
      {after}
    </div>
  );
}

function Option({
  on,
  onPick,
  children,
}: {
  on: boolean;
  onPick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className="nb-ex-f-opt" aria-pressed={on} onClick={onPick}>
      {children}
    </button>
  );
}
