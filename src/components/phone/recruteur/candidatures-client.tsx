"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { rhGroupAction } from "@/server/actions/phone-rh-candidatures";
import type { RhGroupTemplate } from "@/server/services/hire-phone-candidatures";
import { OrbiDisc, PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";

const TEMPLATES: RhGroupTemplate[] = ["entretien", "document", "recue", "nonretenu"];

export type RhGroupData = {
  back: string;
  template: RhGroupTemplate;
  people: { id: string; firstName: string; job: string }[];
  company: string;
  signer: string;
};

/**
 * « Message à N candidats » (planche Recruteur-cand-groupe): a template, the preview for the first
 * person, then « Envoyer à chacun ». Each person receives it with their first name; « Réponse non
 * retenue » records the member's decision with it.
 */
export function RhGroupSheet({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: RhGroupData;
}) {
  const t = useTranslations("phoneRhCandidatures.group");
  const tc = useTranslations("phone");
  const [template, setTemplate] = useState<RhGroupTemplate>(data.template);
  const first = data.people[0];
  const body = (values: { prenom: string; poste: string; entreprise: string }) =>
    t(`body.${template}`, { ...values, signer: data.signer });
  return (
    <PhoneSheet
      open={open}
      onClose={onClose}
      label={t("title", { count: data.people.length })}
      closeLabel={tc("close")}
    >
      <form action={rhGroupAction} className="nb-rh-groupe-f">
        <h2 className="nb-rh-feuille-t">{t("title", { count: data.people.length })}</h2>
        <input type="hidden" name="ids" value={data.people.map((person) => person.id).join(",")} />
        <input type="hidden" name="back" value={data.back} />
        <input
          type="hidden"
          name="body"
          value={body({ prenom: "{prenom}", poste: "{poste}", entreprise: "{entreprise}" })}
        />
        <fieldset className="nb-rh-modeles">
          <legend className="nb-meta">{t("template")}</legend>
          {TEMPLATES.map((key) => (
            <label key={key} className="nb-rh-modele">
              <input
                type="radio"
                name="template"
                value={key}
                checked={template === key}
                onChange={() => setTemplate(key)}
              />
              <span>{t(`templates.${key}`)}</span>
            </label>
          ))}
        </fieldset>
        {first ? (
          <>
            <p className="nb-meta">{t("preview")}</p>
            <p className="nb-rh-apercu-m">
              {body({ prenom: first.firstName, poste: first.job, entreprise: data.company })}
            </p>
          </>
        ) : null}
        <button type="submit" className="nb-bp" disabled={data.people.length === 0}>
          {t("send")}
        </button>
        <button type="button" className="nb-annuler" onClick={onClose}>
          {tc("cancel")}
        </button>
      </form>
    </PhoneSheet>
  );
}

/** « Répondre aux 52 sans réponse » (planche Recruteur-cand-nonretenus): opens the sheet. */
export function RhGroupButton({
  data,
  label,
  hint,
}: {
  data: RhGroupData;
  label: string;
  hint: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="nb-rh-orbi-l" data-ambre="" onClick={() => setOpen(true)}>
        <OrbiDisc size={44} />
        <span>
          <b>{label}</b>
          <span>{hint}</span>
        </span>
        <PhoneIcon name="chevron" size={18} />
      </button>
      <RhGroupSheet open={open} onClose={() => setOpen(false)} data={data} />
    </>
  );
}

/**
 * The list of a stage with « Sélectionner » (planche Recruteur-cand-toutes): in selection, each
 * row gets its box and the bottom bar writes to the people chosen.
 */
export function RhSelectable({
  rows,
  manage,
  group,
  sort,
  children,
}: {
  rows: { id: string; name: string; line: string }[];
  manage: boolean;
  group: RhGroupData;
  sort: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("phoneRhCandidatures.select");
  const [selecting, setSelecting] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const [sheet, setSheet] = useState(false);
  const people = group.people.filter((person) => chosen.includes(person.id));
  return (
    <>
      <div className="nb-rh-outils">
        {sort}
        {manage && rows.length > 0 ? (
          <button
            type="button"
            className="nb-rh-choisir"
            onClick={() => {
              setSelecting(!selecting);
              setChosen([]);
            }}
          >
            {selecting ? t("cancel") : t("start")}
          </button>
        ) : null}
      </div>
      {selecting ? (
        <ul className="nb-rh-choix">
          {rows.map((row) => (
            <li key={row.id}>
              <label className="nb-rh-cl">
                <input
                  type="checkbox"
                  className="nb-rh-case"
                  checked={chosen.includes(row.id)}
                  onChange={(event) =>
                    setChosen(
                      event.target.checked
                        ? [...chosen, row.id]
                        : chosen.filter((value) => value !== row.id),
                    )
                  }
                />
                <span className="nb-rh-res-t">
                  <b>{row.name}</b>
                  <span className="nb-meta">{row.line}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <div>{children}</div>
      )}
      {selecting ? (
        <div className="nb-rh-selection">
          <button
            type="button"
            className="nb-bp"
            disabled={chosen.length === 0}
            onClick={() => setSheet(true)}
          >
            {t("write", { count: chosen.length })}
          </button>
        </div>
      ) : null}
      <RhGroupSheet
        key={chosen.join(",")}
        open={sheet}
        onClose={() => setSheet(false)}
        data={{ ...group, people }}
      />
    </>
  );
}
