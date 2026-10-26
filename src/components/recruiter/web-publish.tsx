"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { OrbiDisc, PhoneIcon } from "@/components/phone/icon";
import { cx } from "@/lib/cx";
import { featuredStudyFields } from "@/lib/studies";
import { jobWriterAction } from "@/server/actions/hire";
import { rhPublishOfferAction } from "@/server/actions/phone-rh-offres";
import { webAssignOfferAction, webSaveOfferAction } from "@/server/actions/web-rh-offres";
import type { WebPublishData } from "./web-publish-data";

const STEPS = ["poste", "skills", "conditions", "questions", "team"] as const;
const CONTRACTS = ["cdi", "cdd", "stage", "mission"] as const;
const REMOTES = ["onsite", "hybrid", "remote"] as const;
const DOCUMENTS = ["cv", "letter", "diploma", "portfolio"] as const;
type Draft = WebPublishData["draft"];

/**
 * « Publier une offre » on a computer (Modèle B, lot N2, captures 038 to 042): the five steps on
 * the left, the step in the middle, what talents will see on the right, kept up to date while the
 * recruiter types. Each « Continuer » saves the draft; « Publier l'offre » publishes it (an
 * unverified company sends it to review). No skill rejects anyone: it only weighs in the score.
 */
export function RecruiterWebPublish({ data }: { data: WebPublishData }) {
  const t = useTranslations("rhWeb.publish");
  const format = useFormatter();
  const router = useRouter();
  const [step, setStep] = useState(data.editing ? data.step : 1);
  const [reached, setReached] = useState(data.editing ? 5 : 1);
  const [draft, setDraft] = useState<Draft>(data.draft);
  const [skill, setSkill] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [orbiNote, setOrbiNote] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((before) => ({ ...before, [key]: value }));

  const day = (iso: string) =>
    format.dateTime(new Date(`${iso}T12:00:00Z`), {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  const salary =
    draft.salaryShown && (draft.salaryMin || draft.salaryMax)
      ? t("salaryLine", {
          min: draft.salaryMin || draft.salaryMax,
          max: draft.salaryMax || draft.salaryMin,
        })
      : null;
  const suggested = (draft.domain ? data.suggestions[draft.domain] : data.suggestions.all)
    .filter((name) => !draft.required.includes(name) && !draft.preferred.includes(name))
    .slice(0, 3);

  const errorOf = (result: { error: string; field?: string; unknownSkills?: string[] }) => {
    if (result.unknownSkills?.length)
      return t("errors.unknownSkills", { skills: result.unknownSkills.join(", ") });
    if (result.error === "forbidden") return t("errors.forbidden");
    if (result.error === "tooMany") return t("errors.tooMany");
    if (result.field === "title") return t("errors.title");
    if (result.field === "city") return t("errors.city");
    if (result.field === "country") return t("errors.country");
    if (result.field === "salaryMax") return t("errors.salary");
    return t("errors.invalid");
  };

  /** Saves the whole draft; returns its id, or null with the error shown. */
  const save = async (): Promise<string | null> => {
    const result = await webSaveOfferAction({
      jobId: draft.id ?? undefined,
      title: draft.title,
      domain: draft.domain,
      openings: draft.openings,
      description: draft.description,
      required: draft.required,
      preferred: draft.preferred,
      city: draft.city,
      country: draft.country,
      remote: draft.remote,
      contract: draft.contract,
      salaryShown: draft.salaryShown,
      salaryMin: draft.salaryMin,
      salaryMax: draft.salaryMax,
      closesAt: draft.closesAt,
      questions: draft.questions,
      documents: draft.documents,
    });
    if (!result.ok) {
      setError(errorOf(result));
      return null;
    }
    if (!draft.id) {
      set("id", result.jobId);
      // A reload reopens the draft at the right step.
      window.history.replaceState(
        window.history.state,
        "",
        `/app/hire/offres/${result.jobId}/modifier`,
      );
    }
    return result.jobId;
  };

  const next = () => {
    setError(null);
    if (step === 1 && draft.title.trim().length < 3) {
      setError(t("errors.title"));
      return;
    }
    if (step === 3 && !draft.city.trim()) {
      setError(t("errors.city"));
      return;
    }
    start(async () => {
      // Before the place is known (step 3), a draft without a city cannot be saved yet.
      if (draft.city.trim() && !(await save())) return;
      const to = Math.min(5, step + 1);
      setStep(to);
      setReached((before) => Math.max(before, to));
    });
  };

  const publish = () => {
    setError(null);
    start(async () => {
      const id = await save();
      if (!id) return;
      if (data.owners || data.evaluators) {
        const team = await webAssignOfferAction({
          jobId: id,
          ownerId: data.owners ? draft.ownerId : "",
          evaluatorIds: data.evaluators ? draft.evaluatorIds : [],
        });
        if (!team.ok) {
          setError(t("errors.invalid"));
          return;
        }
      }
      const result = await rhPublishOfferAction(id);
      if (!result.ok) {
        setError(
          result.error === "limit"
            ? t("errors.limit")
            : result.error === "description"
              ? t("errors.description")
              : result.error === "skills"
                ? t("errors.skills")
                : t("errors.invalid"),
        );
        return;
      }
      router.push(`/app/hire/offres/${id}?publiee=${result.review ? "verification" : "1"}`);
    });
  };

  const draftLater = () => {
    setError(null);
    start(async () => {
      if (!draft.city.trim()) {
        setError(t("errors.city"));
        return;
      }
      const id = await save();
      if (!id) return;
      router.push("/app/hire/offres?ok=brouillon");
    });
  };

  const orbiWrite = () => {
    setOrbiNote(null);
    if (draft.title.trim().length < 3) {
      setError(t("errors.title"));
      return;
    }
    start(async () => {
      const result = await jobWriterAction({
        mode: "draft",
        title: draft.title,
        contract: t(
          `contracts.${draft.contract === "freelance" ? "mission" : draft.contract}` as "contracts.cdi",
        ),
        workMode: t(`remote.${draft.remote}`),
        city: draft.city,
        country: draft.country,
        description: draft.description,
      });
      if (!result.ok || result.mode !== "draft") {
        setOrbiNote(
          !result.ok && result.error === "consent"
            ? t("orbi.consent")
            : !result.ok && (result.error === "quota" || result.error === "entitlement")
              ? t("orbi.quota")
              : t("orbi.failed"),
        );
        return;
      }
      if (!result.draft.description.trim()) {
        setOrbiNote(t("orbi.nothing"));
        return;
      }
      set("description", result.draft.description);
      setOrbiNote(t("orbi.done"));
    });
  };

  const addSkill = (kind: "required" | "preferred", name = skill) => {
    const value = name.trim().slice(0, 80);
    if (!value) return;
    const other = kind === "required" ? "preferred" : "required";
    setDraft((before) => ({
      ...before,
      [kind]: before[kind].includes(value) ? before[kind] : [...before[kind], value].slice(0, 20),
      [other]: before[other].filter((item) => item !== value),
    }));
    if (name === skill) setSkill("");
  };

  const chip = (selected: boolean) => cx("rb-pill t-press", selected && "rb-on");

  const card = (
    <>
      <p className="rb-meta rb-etape">
        {t("stepLine", { step, count: STEPS.length, name: t(`steps.${STEPS[step - 1]!}`) })}
      </p>

      {step === 1 && (
        <>
          <label className="rb-champ">
            <span>{t("poste.title")}</span>
            <input
              value={draft.title}
              maxLength={120}
              placeholder={t("poste.titlePlaceholder")}
              onChange={(event) => set("title", event.target.value)}
            />
          </label>
          <fieldset className="rb-champ">
            <legend>{t("poste.domain")}</legend>
            <div className="rb-pills">
              {featuredStudyFields.map((domain) => (
                <button
                  key={domain}
                  type="button"
                  aria-pressed={draft.domain === domain}
                  className={chip(draft.domain === domain)}
                  onClick={() => set("domain", draft.domain === domain ? "" : domain)}
                >
                  {t(`domains.${domain}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="rb-champ rb-court">
            <span>{t("poste.openings")}</span>
            <input
              type="number"
              min={1}
              max={50}
              value={draft.openings}
              onChange={(event) =>
                set("openings", Math.min(50, Math.max(1, Number(event.target.value) || 1)))
              }
            />
          </label>
          <div className="rb-champ">
            <div className="rb-champ-h">
              <label htmlFor="rb-pub-desc">{t("poste.description")}</label>
              <button
                type="button"
                className="rb-orbi-l t-press"
                onClick={orbiWrite}
                disabled={pending}
              >
                <OrbiDisc size={22} />
                {t("poste.orbi")}
              </button>
            </div>
            <textarea
              id="rb-pub-desc"
              rows={5}
              maxLength={8000}
              value={draft.description}
              placeholder={t("poste.descriptionPlaceholder")}
              onChange={(event) => set("description", event.target.value)}
            />
            {orbiNote && (
              <p className="rb-meta" role="status">
                {orbiNote}
              </p>
            )}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          {(["required", "preferred"] as const).map((kind) => (
            <div key={kind} className="rb-champ">
              <p className="rb-champ-t">{t(`skills.${kind}`, { points: data.points[kind] })}</p>
              {draft[kind].length === 0 ? (
                <p className="rb-meta">{t("skills.none")}</p>
              ) : (
                <ul className="rb-chips">
                  {draft[kind].map((name) => (
                    <li key={name} className="rb-chip rb-chip-x">
                      {name}
                      <button
                        type="button"
                        aria-label={t("skills.remove", { name })}
                        onClick={() =>
                          set(
                            kind,
                            draft[kind].filter((item) => item !== name),
                          )
                        }
                      >
                        <PhoneIcon name="fermer" size={14} stroke={2} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <div className="rb-ajout">
            <input
              value={skill}
              maxLength={80}
              aria-label={t("skills.add")}
              placeholder={t("skills.add")}
              onChange={(event) => setSkill(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addSkill("required");
                }
              }}
            />
            <button type="button" className="rb-btn2 t-press" onClick={() => addSkill("required")}>
              {t("skills.asRequired")}
            </button>
            <button type="button" className="rb-btn2 t-press" onClick={() => addSkill("preferred")}>
              {t("skills.asPreferred")}
            </button>
          </div>
          {suggested.length > 0 && (
            <div className="rb-sugg">
              <span className="rb-meta">{t("skills.orbi")}</span>
              {suggested.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="rb-sugg-b t-press"
                  aria-label={t("skills.addSuggested", { name })}
                  onClick={() => addSkill("required", name)}
                >
                  {t("skills.plus", { name })}
                </button>
              ))}
            </div>
          )}
          <p className="rb-meta">{t("skills.fair")}</p>
        </>
      )}

      {step === 3 && (
        <>
          <fieldset className="rb-champ">
            <legend>{t("conditions.contract")}</legend>
            <div className="rb-pills">
              {CONTRACTS.map((contract) => (
                <button
                  key={contract}
                  type="button"
                  aria-pressed={draft.contract === contract}
                  className={chip(draft.contract === contract)}
                  onClick={() => set("contract", contract)}
                >
                  {t(`contracts.${contract}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="rb-champ">
            <legend>{t("conditions.remote")}</legend>
            <div className="rb-pills">
              {REMOTES.map((remote) => (
                <button
                  key={remote}
                  type="button"
                  aria-pressed={draft.remote === remote}
                  className={chip(draft.remote === remote)}
                  onClick={() => set("remote", remote)}
                >
                  {t(`remote.${remote}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="rb-champ">
            <legend>{t("conditions.city")}</legend>
            <div className="rb-pills">
              {data.cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  aria-pressed={draft.city === city}
                  className={chip(draft.city === city)}
                  onClick={() => set("city", city)}
                >
                  {city}
                </button>
              ))}
            </div>
            <input
              value={data.cities.includes(draft.city) ? "" : draft.city}
              maxLength={120}
              aria-label={t("conditions.otherCity")}
              placeholder={t("conditions.otherCity")}
              onChange={(event) => set("city", event.target.value)}
            />
            <input
              value={draft.country}
              maxLength={80}
              aria-label={t("conditions.country")}
              placeholder={t("conditions.country")}
              onChange={(event) => set("country", event.target.value)}
            />
          </fieldset>
          <div className="rb-champ">
            <div className="rb-interr">
              <span>
                <b id="rb-pub-sal">{t("conditions.salary")}</b>
                <span className="rb-meta">{t("conditions.salaryHint")}</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={draft.salaryShown}
                aria-labelledby="rb-pub-sal"
                className="rb-switch"
                onClick={() => set("salaryShown", !draft.salaryShown)}
              />
            </div>
            {draft.salaryShown && (
              <div className="rb-salaire">
                <input
                  inputMode="numeric"
                  value={draft.salaryMin}
                  maxLength={9}
                  aria-label={t("conditions.salaryMin")}
                  placeholder={t("conditions.salaryMin")}
                  onChange={(event) => set("salaryMin", event.target.value.replace(/\D/g, ""))}
                />
                <span aria-hidden>{t("conditions.to")}</span>
                <input
                  inputMode="numeric"
                  value={draft.salaryMax}
                  maxLength={9}
                  aria-label={t("conditions.salaryMax")}
                  placeholder={t("conditions.salaryMax")}
                  onChange={(event) => set("salaryMax", event.target.value.replace(/\D/g, ""))}
                />
                <span className="rb-meta">{t("conditions.perMonth")}</span>
              </div>
            )}
          </div>
          <fieldset className="rb-champ">
            <legend>{t("conditions.deadline")}</legend>
            <div className="rb-pills">
              {data.deadlines.map((iso) => (
                <button
                  key={iso}
                  type="button"
                  aria-pressed={draft.closesAt === iso}
                  className={chip(draft.closesAt === iso)}
                  onClick={() => set("closesAt", iso)}
                >
                  {day(iso)}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={draft.closesAt === ""}
                className={chip(draft.closesAt === "")}
                onClick={() => set("closesAt", "")}
              >
                {t("conditions.noDeadline")}
              </button>
            </div>
          </fieldset>
        </>
      )}

      {step === 4 && (
        <>
          <p className="rb-champ-t">{t("questions.title")}</p>
          <ul className="rb-liste-q">
            {draft.questions.map((text) => (
              <li key={text}>
                <span>{text}</span>
                <button
                  type="button"
                  className="rb-btn2 rb-s t-press"
                  aria-label={t("questions.removeAria", { text })}
                  onClick={() =>
                    set(
                      "questions",
                      draft.questions.filter((item) => item !== text),
                    )
                  }
                >
                  {t("questions.remove")}
                </button>
              </li>
            ))}
          </ul>
          {draft.questions.length < 5 && (
            <div className="rb-ajout">
              <input
                value={question}
                maxLength={200}
                aria-label={t("questions.add")}
                placeholder={t("questions.add")}
                onChange={(event) => setQuestion(event.target.value)}
              />
              <button
                type="button"
                className="rb-btn2 t-press"
                onClick={() => {
                  const value = question.trim();
                  if (value.length < 5) {
                    setError(t("errors.question"));
                    return;
                  }
                  setError(null);
                  if (!draft.questions.includes(value))
                    set("questions", [...draft.questions, value]);
                  setQuestion("");
                }}
              >
                {t("questions.addButton")}
              </button>
            </div>
          )}
          <p className="rb-champ-t">{t("questions.documents")}</p>
          <div className="rb-liste-i">
            {DOCUMENTS.map((kind) => {
              const on = draft.documents.includes(kind);
              return (
                <div key={kind} className="rb-interr">
                  <span id={`rb-doc-${kind}`}>{t(`documents.${kind}`)}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-labelledby={`rb-doc-${kind}`}
                    className="rb-switch"
                    onClick={() =>
                      set(
                        "documents",
                        on
                          ? draft.documents.filter((item) => item !== kind)
                          : [...draft.documents, kind],
                      )
                    }
                  />
                </div>
              );
            })}
          </div>
          <p className="rb-meta">{t("questions.fair")}</p>
        </>
      )}

      {step === 5 && (
        <>
          {data.owners ? (
            <fieldset className="rb-champ">
              <legend>{t("team.owner")}</legend>
              <div className="rb-pills">
                {data.owners.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    aria-pressed={draft.ownerId === person.id}
                    className={chip(draft.ownerId === person.id)}
                    onClick={() => set("ownerId", person.id)}
                  >
                    {person.name}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : (
            <p className="rb-meta">{t("team.ownerPlan")}</p>
          )}
          {data.evaluators ? (
            <div className="rb-champ">
              <p className="rb-champ-t">{t("team.evaluators")}</p>
              {data.evaluators.length === 0 ? (
                <p className="rb-meta">{t("team.noManagers")}</p>
              ) : (
                <div className="rb-liste-i">
                  {data.evaluators.map((person) => {
                    const on = draft.evaluatorIds.includes(person.id);
                    return (
                      <div key={person.id} className="rb-interr">
                        <span id={`rb-ev-${person.id}`}>
                          {t("team.manager", { name: person.name })}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={on}
                          aria-labelledby={`rb-ev-${person.id}`}
                          className="rb-switch"
                          onClick={() =>
                            set(
                              "evaluatorIds",
                              on
                                ? draft.evaluatorIds.filter((id) => id !== person.id)
                                : [...draft.evaluatorIds, person.id],
                            )
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="rb-meta">{t("team.evaluatorsPlan")}</p>
          )}
          <div className="rb-resume">
            <b>{draft.title}</b>
            <span className="rb-meta">
              {[
                t(
                  `contracts.${draft.contract === "freelance" ? "mission" : draft.contract}` as "contracts.cdi",
                ),
                t(`remote.${draft.remote}`),
                draft.closesAt ? t("team.deadline", { date: day(draft.closesAt) }) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <p>{draft.description || t("preview.noText")}</p>
          </div>
          <p className="rb-meta">{data.org.verified ? t("team.notice") : t("team.review")}</p>
        </>
      )}

      {error && (
        <p className="rb-err" role="alert">
          {error}
        </p>
      )}

      <div className="rb-pied">
        {step === 1 ? (
          <Link href="/app/hire/offres" className="rb-btn2 t-press">
            {t("cancel")}
          </Link>
        ) : (
          <button type="button" className="rb-btn2 t-press" onClick={() => setStep(step - 1)}>
            {t("back")}
          </button>
        )}
        <span className="rb-sp" />
        {step > 1 && (
          <button type="button" className="rb-lien" onClick={draftLater} disabled={pending}>
            {t("draft")}
          </button>
        )}
        {step < 5 ? (
          <button type="button" className="rb-btn t-press" onClick={next} disabled={pending}>
            {t("continue")}
          </button>
        ) : (
          <button type="button" className="rb-btn t-press" onClick={publish} disabled={pending}>
            {data.org.verified ? t("publish") : t("publishReview")}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="rb-page rb-pub">
      <h1 className="sr-only">{t("title")}</h1>
      <nav className="rb-pub-etapes" aria-label={t("stepsAria")}>
        <ol>
          {STEPS.map((key, index) => {
            const number = index + 1;
            const done = number < step || (number <= reached && number !== step);
            return (
              <li key={key}>
                <button
                  type="button"
                  className={cx("rb-pub-e t-press", number === step && "rb-on")}
                  aria-current={number === step ? "step" : undefined}
                  disabled={number > reached || pending}
                  onClick={() => setStep(number)}
                >
                  <span aria-hidden className={cx("rb-num", done && "rb-fait")}>
                    {done ? <PhoneIcon name="coche" size={14} stroke={2.6} /> : number}
                  </span>
                  {t(`steps.${key}`)}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="rb-meta">
          {data.places.max < 0
            ? t("placesUnlimited", { count: data.places.after })
            : t("places", { count: data.places.after, max: data.places.max })}
        </p>
      </nav>

      <section className="rb-carte rb-pub-c" aria-label={t(`steps.${STEPS[step - 1]!}`)}>
        {card}
      </section>

      <aside className="rb-pub-ap" aria-label={t("preview.title")}>
        <p className="rb-meta">{t("preview.title")}</p>
        <div className="rb-carte">
          <div className="rb-ap-org">
            <span aria-hidden className="rb-mini">
              {data.org.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- a 40 px logo, already small
                <img src={data.org.logo} alt="" />
              ) : (
                data.org.initials
              )}
            </span>
            <span>
              <b>{data.org.name}</b>
              <span className="rb-meta">
                {[data.org.city, data.org.verified ? t("preview.verified") : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
          </div>
          <h2>{draft.title || t("preview.noTitle")}</h2>
          <ul className="rb-chips">
            <li className="rb-chip">
              {t(
                `contracts.${draft.contract === "freelance" ? "mission" : draft.contract}` as "contracts.cdi",
              )}
            </li>
            <li className="rb-chip">{t(`remote.${draft.remote}`)}</li>
          </ul>
          {salary && <p className="rb-lime-t rb-fort">{salary}</p>}
          {draft.required.length > 0 && (
            <ul className="rb-chips">
              {draft.required.slice(0, 5).map((name) => (
                <li key={name} className="rb-chip rb-chip-v">
                  {name}
                </li>
              ))}
            </ul>
          )}
          <p className="rb-meta rb-ap-txt">{draft.description || t("preview.noText")}</p>
          <span className="rb-ap-free">{t("preview.free")}</span>
        </div>
      </aside>
    </div>
  );
}
