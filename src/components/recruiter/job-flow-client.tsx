"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { cx } from "@/lib/cx";
import { jobWriterAction } from "@/server/actions/hire";
import { addResponsibilitiesAction, sheetProposalAction } from "@/server/actions/hire-offers";
import type { JobSuggestion, JobWriterResult } from "@/server/services/job-writer";

/** Events between Orbi's sheet and the list of responsibilities of the same form. */
const RESP_SET = "rx-resp-set";
const RESP_SWAP = "rx-resp-swap";

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

/** « Nombre de postes » (planche CR1 `.stepper`): − 1 +, kept in a hidden field. */
export function OpeningsStepper({
  name,
  defaultValue,
  max,
  labelId,
}: {
  name: string;
  defaultValue: number;
  max: number;
  labelId: string;
}) {
  const t = useTranslations("hireOffers.form");
  const [value, setValue] = useState(defaultValue);
  return (
    <span className="t-rx-stepper" role="group" aria-labelledby={labelId}>
      <button
        type="button"
        className="t-press"
        aria-label={t("openingsLess")}
        disabled={value <= 1}
        onClick={() => setValue((current) => Math.max(1, current - 1))}
      >
        <span aria-hidden>{t("openingsMinusSign")}</span>
      </button>
      <output aria-live="polite" aria-labelledby={labelId}>
        {value}
      </output>
      <button
        type="button"
        className="t-press"
        aria-label={t("openingsMore")}
        disabled={value >= max}
        onClick={() => setValue((current) => Math.min(max, current + 1))}
      >
        <span aria-hidden>{t("openingsPlusSign")}</span>
      </button>
      <input type="hidden" name={name} value={value} />
    </span>
  );
}

/**
 * Responsibilities (planche CR2 `.lst`): one line each, added, moved up or removed; kept as lines in
 * a hidden field. Orbi's proposals land here only after « Appliquer ».
 */
export function ResponsibilitiesEditor({
  name,
  defaultItems,
  max,
}: {
  name: string;
  defaultItems: string[];
  max: number;
}) {
  const t = useTranslations("hireOffers.form");
  const [items, setItems] = useState(defaultItems);
  const [draft, setDraft] = useState("");
  const inputId = useId();
  useEffect(() => {
    const set = (event: Event) => setItems((event as CustomEvent<string[]>).detail.slice(0, max));
    const swap = (event: Event) => {
      const { before, after } = (event as CustomEvent<{ before: string; after: string }>).detail;
      setItems((current) => current.map((item) => (item === before ? after : item)));
    };
    window.addEventListener(RESP_SET, set);
    window.addEventListener(RESP_SWAP, swap);
    return () => {
      window.removeEventListener(RESP_SET, set);
      window.removeEventListener(RESP_SWAP, swap);
    };
  }, [max]);
  const add = () => {
    const value = clean(draft).slice(0, 300);
    if (value.length < 3 || items.includes(value) || items.length >= max) return;
    setItems([...items, value]);
    setDraft("");
  };
  return (
    <div className="t-rx-lst">
      {items.length > 0 && (
        <ol className="t-rx-lst">
          {items.map((item, index) => (
            <li key={item} className="t-rx-lst-i">
              <span>{item}</span>
              {index > 0 && (
                <button
                  type="button"
                  className="t-bi t-press"
                  aria-label={t("responsibilityUp", { item })}
                  onClick={() => {
                    const next = [...items];
                    [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
                    setItems(next);
                  }}
                >
                  <TalentIcon name="retour" size="xs" className="rotate-90" />
                </button>
              )}
              <button
                type="button"
                className="t-bi t-press"
                aria-label={t("responsibilityRemove", { item })}
                onClick={() => setItems(items.filter((_, at) => at !== index))}
              >
                <TalentIcon name="fermer" size="xs" />
              </button>
            </li>
          ))}
        </ol>
      )}
      {items.length < max && (
        <div className="t-rx-ligne">
          <label htmlFor={inputId} className="sr-only">
            {t("responsibilityNew")}
          </label>
          <div className="t-verre t-saisie">
            <input
              id={inputId}
              value={draft}
              maxLength={300}
              placeholder={t("responsibilityNew")}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  add();
                }
              }}
            />
          </div>
          <button type="button" className="t-bt t-sec t-press" onClick={add}>
            <TalentIcon name="plus" size="s" />
            {t("responsibilityAdd")}
          </button>
        </div>
      )}
      <input type="hidden" name={name} value={items.join("\n")} />
    </div>
  );
}

type Skill = { name: string; required: boolean };

/**
 * Skills (planche CR2 `.comp`): a tap switches « indispensable » and « souhaitée »; new ones come
 * from the skills of Jumanly (the list proposed while typing).
 */
export function SkillsEditor({
  defaultSkills,
  options,
  maxRequired,
  invalid,
}: {
  defaultSkills: Skill[];
  options: string[];
  maxRequired: number;
  invalid?: boolean;
}) {
  const t = useTranslations("hireOffers.form");
  const [skills, setSkills] = useState(defaultSkills);
  const [draft, setDraft] = useState("");
  const inputId = useId();
  const listId = useId();
  const add = () => {
    const value = clean(draft).slice(0, 80);
    if (!value) return;
    const known = options.find(
      (option) => option.toLocaleLowerCase("fr") === value.toLocaleLowerCase("fr"),
    );
    const name = known ?? value;
    if (skills.some((skill) => skill.name.toLocaleLowerCase("fr") === name.toLocaleLowerCase("fr")))
      return;
    const requiredCount = skills.filter((skill) => skill.required).length;
    setSkills([...skills, { name, required: requiredCount < maxRequired }]);
    setDraft("");
  };
  const importance = (skill: Skill) => (skill.required ? t("skillRequired") : t("skillPreferred"));
  return (
    <div className="t-flux t-serre">
      {skills.length > 0 && (
        <ul className="t-rx-comp">
          {skills.map((skill, index) => (
            <li key={skill.name} className="contents">
              <span className={cx(skill.required && "t-v")}>
                <button
                  type="button"
                  aria-label={t("skillToggle", {
                    skill: skill.name,
                    importance: importance(skill),
                  })}
                  onClick={() =>
                    setSkills(
                      skills.map((item, at) =>
                        at === index ? { ...item, required: !item.required } : item,
                      ),
                    )
                  }
                >
                  {t("skillChip", { skill: skill.name, importance: importance(skill) })}
                </button>
                <button
                  type="button"
                  aria-label={t("skillRemove", { skill: skill.name })}
                  onClick={() => setSkills(skills.filter((_, at) => at !== index))}
                >
                  <TalentIcon name="fermer" size="xs" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="t-rx-ligne">
        <label htmlFor={inputId} className="sr-only">
          {t("skillNew")}
        </label>
        <div className={cx("t-verre t-saisie", invalid && "t-err")}>
          <input
            id={inputId}
            list={listId}
            value={draft}
            maxLength={80}
            placeholder={t("skillNew")}
            aria-invalid={invalid || undefined}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
            }}
          />
        </div>
        <button type="button" className="t-bt t-sec t-press" onClick={add}>
          <TalentIcon name="plus" size="s" />
          {t("skillAdd")}
        </button>
        <datalist id={listId}>
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>
      <p className="t-aide">{t("skillHint")}</p>
      <input
        type="hidden"
        name="requiredSkills"
        value={skills
          .filter((skill) => skill.required)
          .map((skill) => skill.name)
          .join(", ")}
      />
      <input
        type="hidden"
        name="preferredSkills"
        value={skills
          .filter((skill) => !skill.required)
          .map((skill) => skill.name)
          .join(", ")}
      />
    </div>
  );
}

type Question = { id: string; text: string; kind: "yesno" | "text" };

/**
 * Screening questions (planche CR3 `.qs`): yes / no or a free answer, never a condition to apply.
 * Orbi may propose one from a required skill; it is added only on « Ajouter ».
 */
export function QuestionsEditor({
  name,
  defaultQuestions,
  max,
  suggestion,
  invalid,
}: {
  name: string;
  defaultQuestions: Question[];
  max: number;
  suggestion: string | null;
  invalid?: boolean;
}) {
  const t = useTranslations("hireOffers.form");
  const [questions, setQuestions] = useState(defaultQuestions);
  const [editing, setEditing] = useState<{
    id: string | null;
    text: string;
    kind: Question["kind"];
  } | null>(null);
  const [error, setError] = useState(false);
  const [offered, setOffered] = useState(suggestion);
  const textId = useId();
  const kindName = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (editing) textRef.current?.focus();
  }, [editing]);
  const save = () => {
    if (!editing) return;
    const text = clean(editing.text).slice(0, 200);
    if (text.length < 5) {
      setError(true);
      return;
    }
    setError(false);
    setQuestions(
      editing.id
        ? questions.map((item) =>
            item.id === editing.id ? { ...item, text, kind: editing.kind } : item,
          )
        : [...questions, { id: `q${Date.now().toString(36)}`, text, kind: editing.kind }],
    );
    setEditing(null);
  };
  return (
    <div className="t-rx-qs">
      {questions.map((question) => (
        <div key={question.id} className="t-rx-q">
          <div className="t-t">
            {question.text}
            <small>{t("questionLine", { kind: t(`questionKind.${question.kind}`) })}</small>
          </div>
          <button
            type="button"
            className="t-bi t-press"
            aria-label={t("questionEdit", { question: question.text })}
            onClick={() => setEditing({ ...question })}
          >
            <TalentIcon name="modifier" size="s" />
          </button>
        </div>
      ))}
      {editing ? (
        <div className="t-verre t-rx-depot">
          <div className="t-champ">
            <label htmlFor={textId}>{t("questionText")}</label>
            <textarea
              id={textId}
              ref={textRef}
              className="t-verre t-zone"
              rows={2}
              maxLength={200}
              value={editing.text}
              placeholder={t("questionTextPlaceholder")}
              aria-invalid={error || undefined}
              aria-describedby={error ? `${textId}-e` : undefined}
              onChange={(event) => setEditing({ ...editing, text: event.target.value })}
            />
            {error && (
              <p id={`${textId}-e`} className="t-aide t-err">
                {t("questionShort")}
              </p>
            )}
          </div>
          <fieldset className="t-flux t-serre">
            <legend className="t-lab-c">{t("questionKindLabel")}</legend>
            <div className="t-puces">
              {(["yesno", "text"] as const).map((kind) => (
                <label key={kind} className="t-puce t-press">
                  <input
                    type="radio"
                    name={kindName}
                    checked={editing.kind === kind}
                    onChange={() => setEditing({ ...editing, kind })}
                  />
                  {t(`questionKind.${kind}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="t-rx-feuille-bts">
            {editing.id ? (
              <button
                type="button"
                className="t-bt t-sec t-m t-press"
                onClick={() => {
                  setQuestions(questions.filter((item) => item.id !== editing.id));
                  setEditing(null);
                }}
              >
                {t("questionRemove")}
              </button>
            ) : (
              <button
                type="button"
                className="t-bt t-sec t-m t-press"
                onClick={() => setEditing(null)}
              >
                {t("questionCancel")}
              </button>
            )}
            <button type="button" className="t-bt t-p t-press" onClick={save}>
              {t("questionSave")}
            </button>
          </div>
        </div>
      ) : questions.length < max ? (
        <button
          type="button"
          className="t-ajout t-press"
          onClick={() => setEditing({ id: null, text: "", kind: "yesno" })}
        >
          <TalentIcon name="plus" size="s" />
          {t("questionAdd")}
        </button>
      ) : (
        <p className="t-aide">{t("questionMax", { count: max })}</p>
      )}
      {invalid && <p className="t-aide t-err">{t("error.forbidden")}</p>}
      {offered && questions.length < max && !questions.some((item) => item.text === offered) && (
        <div className="t-rx-orbi">
          <OrbiMark size={26} />
          <p className="t-t">{t("orbiQuestion", { question: offered })}</p>
          <button
            type="button"
            className="t-bt t-sec t-s t-press"
            onClick={() => {
              setQuestions([
                ...questions,
                { id: `q${Date.now().toString(36)}`, text: offered, kind: "yesno" },
              ]);
              setOffered(null);
            }}
          >
            {t("orbiQuestionAdd")}
          </button>
        </div>
      )}
      <input type="hidden" name={name} value={JSON.stringify(questions)} />
    </div>
  );
}

type Facts = { title: string; contract: string; workMode: string; city: string; country: string };
type Readiness = "ready" | "consent" | "locked" | "quota";

function openDialog(id: string) {
  const node = document.getElementById(id);
  if (node instanceof HTMLDialogElement && !node.open) node.showModal();
}

function errorKey(code: string) {
  return (["consent", "entitlement", "quota", "invalid"].includes(code) ? code : "unavailable") as
    "consent" | "entitlement" | "quota" | "invalid" | "unavailable";
}

/** One proposal of Orbi with « Refuser », « Modifier », « Appliquer » (planche CR_ORB). */
function Proposal({
  label,
  items,
  text,
  onApply,
}: {
  label: string;
  items?: string[];
  text?: string;
  onApply: (value: string) => void;
}) {
  const t = useTranslations("hireOffers.orbi");
  const [state, setState] = useState<"open" | "edit" | "applied" | "refused">("open");
  const initial = items ? items.join("\n") : (text ?? "");
  const [value, setValue] = useState(initial);
  const editId = useId();
  if (state === "applied" || state === "refused")
    return (
      <p role="status" className="t-gar t-ok">
        <TalentIcon name="valider" size="s" />
        <span>{state === "applied" ? t("applied") : t("refused")}</span>
      </p>
    );
  return (
    <div className="t-rx-sugg">
      <small className="t-ck-t">{label}</small>
      {state === "edit" ? (
        <>
          <label htmlFor={editId} className="sr-only">
            {t("editLabel")}
          </label>
          <textarea id={editId} value={value} onChange={(event) => setValue(event.target.value)} />
        </>
      ) : items ? (
        <ul>
          {value
            .split("\n")
            .filter(Boolean)
            .map((item) => (
              <li key={item}>{item}</li>
            ))}
        </ul>
      ) : (
        <p>{value}</p>
      )}
      <div className="t-acts">
        <button
          type="button"
          className="t-bt t-sec t-s t-press"
          onClick={() => setState("refused")}
        >
          {t("refuse")}
        </button>
        {state !== "edit" && (
          <button type="button" className="t-bt t-sec t-s t-press" onClick={() => setState("edit")}>
            {t("modify")}
          </button>
        )}
        <button
          type="button"
          className="t-bt t-p t-s t-press"
          onClick={() => {
            onApply(value);
            setState("applied");
          }}
        >
          <TalentIcon name="valider" size="xs" />
          {t("apply")}
        </button>
      </div>
    </div>
  );
}

/**
 * « Rédiger avec Orbi » and « Rendre les responsabilités plus claires » (planche CR2, CR_ORB):
 * Orbi proposes, the recruiter applies, changes or refuses each part. Nothing is saved before
 * « Continuer »; Orbi never proposes a salary, a benefit or a working condition.
 */
export function OrbiWriter({
  facts,
  readiness,
  descriptionId,
  requirementsId,
}: {
  facts: Facts;
  readiness: Readiness;
  descriptionId: string;
  requirementsId: string;
}) {
  const t = useTranslations("hireOffers");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<JobWriterResult | null>(null);
  const sheetId = "rx-orbi-ecrire";
  const valueOf = (id: string) =>
    (document.getElementById(id) as HTMLTextAreaElement | null)?.value ?? "";
  const responsibilities = () =>
    String(
      (document.querySelector('input[name="responsibilities"]') as HTMLInputElement | null)
        ?.value ?? "",
    )
      .split("\n")
      .filter(Boolean);
  const setValue = (id: string, value: string) => {
    const node = document.getElementById(id) as HTMLTextAreaElement | null;
    if (!node) return;
    node.value = value;
    node.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const request = (mode: "draft" | "improve") => {
    setResult(null);
    openDialog(sheetId);
    start(async () => {
      const answer = await jobWriterAction({
        mode,
        ...facts,
        description: valueOf(descriptionId),
        responsibilities: responsibilities(),
        requirements: valueOf(requirementsId).split("\n").map(clean).filter(Boolean),
      }).catch(() => ({ ok: false as const, error: "unavailable" as const }));
      setResult(answer);
    });
  };
  const blocked =
    readiness === "ready"
      ? null
      : readiness === "consent"
        ? "consent"
        : readiness === "quota"
          ? "quota"
          : "entitlement";
  const improvable = (result?.ok && result.mode === "improve" && result.suggestions) || [];
  return (
    <>
      <button
        type="button"
        className="t-verre t-carte t-sugg t-press w-full text-left"
        onClick={() => request("draft")}
        disabled={pending}
      >
        <OrbiMark size={30} state={pending ? "reflechit" : "repos"} />
        <span className="t-t">
          <b>{t("form.orbiWrite")}</b>
          <span>{t("form.orbiWriteText")}</span>
        </span>
        <TalentIcon name="suivant" size="s" />
      </button>
      <button
        type="button"
        className="t-pq t-press"
        onClick={() => request("improve")}
        disabled={pending}
      >
        <TalentIcon name="orbi" size="s" />
        {t("form.orbiImprove")}
      </button>
      {blocked && <p className="t-aide">{t(`orbi.error.${blocked}`)}</p>}
      <OrbiDialog id={sheetId} title={t("orbi.title")} close={t("orbi.close")}>
        {pending || !result ? (
          <p role="status" className="t-gar">
            <OrbiMark size={24} state="reflechit" />
            <span>{t("orbi.loading")}</span>
          </p>
        ) : !result.ok ? (
          <p role="status" className="t-gar t-err">
            <TalentIcon name="aide" size="s" />
            <span>{t(`orbi.error.${errorKey(result.error)}`)}</span>
          </p>
        ) : (
          <>
            {result.source === "template" && <p className="t-aide">{t("orbi.template")}</p>}
            {result.mode === "draft" ? (
              <>
                {result.draft.description && (
                  <Proposal
                    label={t("orbi.description")}
                    text={result.draft.description}
                    onApply={(value) => setValue(descriptionId, value)}
                  />
                )}
                {result.draft.responsibilities.length > 0 && (
                  <Proposal
                    label={t("orbi.responsibilities")}
                    items={result.draft.responsibilities}
                    onApply={(value) =>
                      window.dispatchEvent(
                        new CustomEvent(RESP_SET, {
                          detail: value.split("\n").map(clean).filter(Boolean),
                        }),
                      )
                    }
                  />
                )}
                {result.draft.requirements.length > 0 && (
                  <Proposal
                    label={t("orbi.requirements")}
                    items={result.draft.requirements}
                    onApply={(value) => setValue(requirementsId, value)}
                  />
                )}
                {!result.draft.description &&
                  result.draft.responsibilities.length === 0 &&
                  result.draft.requirements.length === 0 && (
                    <p className="t-aide">{t("orbi.empty")}</p>
                  )}
              </>
            ) : improvable.length === 0 ? (
              <p className="t-aide">{t("orbi.empty")}</p>
            ) : (
              improvable.map((suggestion: JobSuggestion) => (
                <Proposal
                  key={suggestion.before}
                  label={t("orbi.improve", { before: suggestion.before })}
                  text={suggestion.after}
                  onApply={(value) =>
                    window.dispatchEvent(
                      new CustomEvent(RESP_SWAP, {
                        detail: { before: suggestion.before, after: clean(value) },
                      }),
                    )
                  }
                />
              ))
            )}
          </>
        )}
        <p className="t-gar">
          <TalentIcon name="cadenas" size="s" />
          <span>{t("orbi.guard")}</span>
        </p>
        <details className="t-pq-d">
          <summary className="t-pq">
            <TalentIcon name="pourquoi" />
            {t("orbi.why")}
          </summary>
          <p className="t-aide">{t("orbi.whyText")}</p>
        </details>
      </OrbiDialog>
    </>
  );
}

/**
 * The sheet of Orbi's proposals, opened from a button of the form; on a computer or a tablet, the
 * panel on the right, the form readable beside it (planche web recruteur-1 § 3 « Rédiger avec Orbi »).
 */
function OrbiDialog({
  id,
  title,
  close,
  children,
}: {
  id: string;
  title: string;
  close: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <dialog
      ref={ref}
      id={id}
      className="t-sheet t-auto t-rx-op"
      aria-labelledby={`${id}-t`}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="t-poignee" aria-hidden />
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${id}-t`} className="flex items-center gap-2">
          <OrbiMark size={24} />
          {title}
        </h2>
        <button
          type="button"
          className="t-bi t-press"
          aria-label={close}
          onClick={() => ref.current?.close()}
        >
          <TalentIcon name="fermer" size="s" />
        </button>
      </div>
      <div className="t-flux t-serre mt-3">{children}</div>
    </dialog>
  );
}

/**
 * « Orbi a lu la fiche » (planche r1plus CR3): the missions of the job sheet the offer does not
 * have, to keep one by one; « Appliquer » adds the ones kept, « Refuser » closes.
 */
export function SheetOrbi({ jobId }: { jobId: string }) {
  const t = useTranslations("hireOffers");
  const [pending, start] = useTransition();
  const [items, setItems] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const sheetId = "rx-orbi-fiche";
  const editId = useId();
  const open = () => {
    setItems(null);
    setError(null);
    setEditing(false);
    openDialog(sheetId);
    start(async () => {
      const answer = await sheetProposalAction(jobId).catch(() => ({
        ok: false as const,
        error: "unavailable" as const,
      }));
      if (answer.ok) {
        setItems(answer.responsibilities);
        setText(answer.responsibilities.join("\n"));
      } else setError(errorKey(answer.error));
    });
  };
  const kept = editing ? text.split("\n").map(clean).filter(Boolean) : (items ?? []);
  return (
    <>
      <div className="t-rx-orbi">
        <OrbiMark size={26} />
        <p className="t-t">{t("form.sheetOrbi")}</p>
        <button type="button" className="t-bt t-sec t-s t-press" onClick={open} disabled={pending}>
          {t("form.sheetOrbiSee")}
        </button>
      </div>
      <OrbiDialog id={sheetId} title={t("orbi.title")} close={t("orbi.close")}>
        {pending || (!items && !error) ? (
          <p role="status" className="t-gar">
            <OrbiMark size={24} state="reflechit" />
            <span>{t("orbi.loading")}</span>
          </p>
        ) : error ? (
          <p role="status" className="t-gar t-err">
            <TalentIcon name="aide" size="s" />
            <span>{t(`orbi.error.${error as "unavailable"}`)}</span>
          </p>
        ) : items && items.length === 0 ? (
          <p className="t-aide">{t("orbi.empty")}</p>
        ) : (
          <form action={addResponsibilitiesAction} className="t-rx-sugg">
            <input type="hidden" name="id" value={jobId} />
            <small className="t-ck-t">{t("orbi.sheet")}</small>
            {editing ? (
              <>
                <label htmlFor={editId} className="sr-only">
                  {t("orbi.editLabel")}
                </label>
                <textarea
                  id={editId}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
                {kept.map((item) => (
                  <input key={item} type="hidden" name="item" value={item} />
                ))}
              </>
            ) : (
              <ul className="!list-none !pl-0">
                {(items ?? []).map((item) => (
                  <li key={item}>
                    <label>
                      <input type="checkbox" name="item" value={item} defaultChecked />
                      <span>{item}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div className="t-acts">
              <button
                type="button"
                className="t-bt t-sec t-s t-press"
                onClick={(event) => event.currentTarget.closest("dialog")?.close()}
              >
                {t("orbi.refuse")}
              </button>
              {!editing && (
                <button
                  type="button"
                  className="t-bt t-sec t-s t-press"
                  onClick={() => setEditing(true)}
                >
                  {t("orbi.modify")}
                </button>
              )}
              <button type="submit" className="t-bt t-p t-s t-press">
                <TalentIcon name="valider" size="xs" />
                {t("orbi.apply")}
              </button>
            </div>
          </form>
        )}
        <p className="t-gar">
          <TalentIcon name="cadenas" size="s" />
          <span>{t("orbi.guard")}</span>
        </p>
        <details>
          <summary className="t-pq">
            <TalentIcon name="pourquoi" />
            {t("orbi.why")}
          </summary>
          <p className="t-aide">{t("orbi.whySheet")}</p>
        </details>
      </OrbiDialog>
    </>
  );
}
