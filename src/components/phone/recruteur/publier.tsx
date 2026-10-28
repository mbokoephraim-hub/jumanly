"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { jobWriterAction } from "@/server/actions/hire";
import {
  rhPublishOfferAction,
  rhSaveOfferAction,
  rhSaveScreeningAction,
  type RhOfferResult,
} from "@/server/actions/phone-rh-offres";
import { OrbiDisc, PhoneIcon } from "../icon";

const REMOTES = ["onsite", "hybrid", "remote"] as const;
const CONTRACTS = ["cdi", "cdd", "stage", "freelance"] as const;
const DOCUMENTS = ["cv", "letter", "diploma", "portfolio"] as const;
type Remote = (typeof REMOTES)[number];
type Contract = "cdi" | "cdd" | "stage" | "mission" | "freelance" | "alternance" | "volontariat";
type Document = (typeof DOCUMENTS)[number];

export type RhOfferDraft = {
  id: string | null;
  title: string;
  description: string;
  skills: string[];
  city: string;
  country: string;
  remote: Remote;
  contract: Contract;
  salaryMin: string;
  salaryMax: string;
  questions: string[];
  documents: Document[];
};

export type RhPublishData = {
  draft: RhOfferDraft;
  /** The recruiter's cities, then the company's: the chips of « Ville ». */
  cities: string[];
  /** Questions proposed at step 3 (never a condition to apply). */
  suggestions: string[];
  org: { name: string; initials: string; logo: string | null; line: string };
  /** A company not verified yet sends its offer to review. */
  verified: boolean;
  /** « Brouillon », « Publier l'offre »: only the members who manage offers come here. */
  editing: boolean;
  /** The step reopened (« Modifier l'offre » from step 1, or a draft at `?etape=`). */
  step: number;
};

/**
 * « Nouvelle offre » of the recruiter's phone (Modèle B recruteur, M4, planches Recruteur-publier-1
 * to -4): the post and its text (Orbi may propose one, to read again), the details, the
 * pre-selection, then what talents will see. Each step is saved; « Brouillon » keeps it for later.
 */
export function PhoneRecruiterPublish({ data }: { data: RhPublishData }) {
  const t = useTranslations("phoneRhOffres.publish");
  const router = useRouter();
  const [step, setStep] = useState(data.draft.id ? data.step : 1);
  const [jobId, setJobId] = useState(data.draft.id);
  const [title, setTitle] = useState(data.draft.title);
  const [description, setDescription] = useState(data.draft.description);
  const [skills, setSkills] = useState(data.draft.skills);
  const [skill, setSkill] = useState("");
  const [city, setCity] = useState(data.draft.city || data.cities[0] || "");
  const [otherCity, setOtherCity] = useState(
    data.draft.city && !data.cities.includes(data.draft.city) ? data.draft.city : "",
  );
  const [remote, setRemote] = useState<Remote>(data.draft.remote);
  const [contract, setContract] = useState<Contract>(data.draft.contract);
  const [salaryShown, setSalaryShown] = useState(Boolean(data.draft.salaryMin));
  const [salaryMin, setSalaryMin] = useState(data.draft.salaryMin);
  const [salaryMax, setSalaryMax] = useState(data.draft.salaryMax);
  const [questions, setQuestions] = useState(data.draft.questions);
  const [question, setQuestion] = useState("");
  const [documents, setDocuments] = useState<Document[]>(data.draft.documents);
  const [error, setError] = useState<string | null>(null);
  const [orbiNote, setOrbiNote] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [writing, startWriting] = useTransition();

  const place = otherCity.trim() || city;
  const [country, setCountry] = useState(data.draft.country);
  const offered = [...new Set([...data.suggestions, ...questions])];

  const fail = (result: Extract<RhOfferResult, { ok: false }>) => {
    if (result.unknownSkills?.length)
      setError(t("errors.unknownSkills", { skills: result.unknownSkills.join(", ") }));
    else if (result.error === "forbidden") setError(t("errors.forbidden"));
    else if (result.field === "country") setError(t("errors.country"));
    else if (result.field === "city") setError(t("errors.city"));
    else if (result.field === "title") setError(t("errors.title"));
    else if (result.field === "salaryMax") setError(t("errors.salary"));
    else setError(t("errors.failed"));
  };

  const savePost = async () => {
    const result = await rhSaveOfferAction({
      jobId: jobId ?? undefined,
      title,
      description,
      skills,
      city: place,
      country: country.trim(),
      remote,
      contract,
      salaryShown,
      salaryMin,
      salaryMax,
    });
    if (!result.ok) {
      fail(result);
      return null;
    }
    if (!jobId) {
      setJobId(result.jobId);
      // The address follows the draft, without leaving the screen.
      window.history.replaceState(null, "", `/app/hire/offres/${result.jobId}/modifier?etape=3`);
    }
    return result.jobId;
  };

  const goTo = (next: number, id = jobId) => {
    setError(null);
    setStep(next);
    if (id) window.history.replaceState(null, "", `/app/hire/offres/${id}/modifier?etape=${next}`);
    window.scrollTo({ top: 0 });
  };

  const next = () => {
    if (pending) return;
    if (step === 1) {
      if (title.trim().length < 3) return setError(t("errors.title"));
      if (!description.trim()) return setError(t("errors.description"));
      if (skills.length === 0) return setError(t("errors.skills"));
      return goTo(2);
    }
    if (step === 2) {
      if (!place) return setError(t("errors.city"));
      if (!country.trim()) return setError(t("errors.country"));
      if (salaryShown && (!salaryMin || !salaryMax || Number(salaryMax) < Number(salaryMin)))
        return setError(t("errors.salary"));
      return start(async () => {
        const id = await savePost();
        if (id) goTo(3, id);
      });
    }
    if (step === 3)
      return start(async () => {
        if (!jobId) return;
        const result = await rhSaveScreeningAction({ jobId, questions, documents });
        if (!result.ok) return fail(result);
        goTo(4);
      });
    start(async () => {
      if (!jobId) return;
      const result = await rhPublishOfferAction(jobId);
      if (!result.ok) {
        setError(
          result.error === "limit"
            ? t("errors.limit")
            : result.error === "skills"
              ? t("errors.skills")
              : result.error === "description"
                ? t("errors.description")
                : t("errors.failed"),
        );
        return;
      }
      router.replace(`/app/hire/offres/${jobId}?publiee=${result.review ? "verification" : "1"}`);
    });
  };

  const keepDraft = () =>
    start(async () => {
      if (title.trim().length < 3) {
        setError(t("errors.title"));
        return;
      }
      const id = await savePost();
      if (!id) return;
      if (step >= 3) {
        const result = await rhSaveScreeningAction({ jobId: id, questions, documents });
        if (!result.ok) return fail(result);
      }
      router.replace("/app/hire/offres?ok=brouillon");
    });

  const propose = () =>
    startWriting(async () => {
      setOrbiNote(null);
      if (title.trim().length < 3) {
        setError(t("errors.title"));
        return;
      }
      const result = await jobWriterAction({
        mode: "draft",
        title,
        contract: t(
          `contracts.${contract === "mission" ? "freelance" : contract}` as "contracts.cdi",
        ),
        workMode: t(`remotes.${remote}`),
        city: place,
        country: country.trim(),
        description,
      });
      if (!result.ok || result.mode !== "draft") {
        setOrbiNote(
          !result.ok && (result.error === "consent" || result.error === "quota")
            ? t(`orbi.${result.error}`)
            : t("orbi.failed"),
        );
        return;
      }
      if (!result.draft.description.trim()) {
        setOrbiNote(t("orbi.nothing"));
        return;
      }
      setDescription(result.draft.description);
    });

  const addSkill = () => {
    const name = skill.trim();
    if (!name) return;
    if (!skills.includes(name)) setSkills([...skills, name].slice(0, 10));
    setSkill("");
    setError(null);
  };

  const addQuestion = () => {
    const text = question.trim();
    if (text.length < 5) return setError(t("errors.question"));
    if (questions.length >= 5) return setError(t("errors.questionsMax"));
    if (!questions.includes(text)) setQuestions([...questions, text]);
    setQuestion("");
    setError(null);
  };

  const toggleQuestion = (text: string) => {
    if (questions.includes(text)) setQuestions(questions.filter((item) => item !== text));
    else if (questions.length < 5) setQuestions([...questions, text]);
    else setError(t("errors.questionsMax"));
  };

  const salaryLine =
    salaryShown && salaryMin && salaryMax
      ? t("salaryLine", { min: salaryMin, max: salaryMax })
      : null;

  return (
    <div className="nb-page nb-rh-offre-pub">
      <header className="nb-rh-pub-tete">
        {step > 1 ? (
          <button type="button" className="nb-rh-retour" onClick={() => goTo(step - 1)}>
            <PhoneIcon name="retour" size={20} />
            {t("back")}
          </button>
        ) : (
          <Link
            href={jobId ? `/app/hire/offres/${jobId}` : "/app/hire/offres"}
            className="nb-rh-retour"
          >
            <PhoneIcon name="retour" size={20} />
            {t("back")}
          </Link>
        )}
        <p className="nb-rh-pub-titre">{data.editing ? t("editTitle") : t("title")}</p>
        <button
          type="button"
          className="nb-rh-brouillon"
          onClick={keepDraft}
          aria-disabled={pending || undefined}
        >
          {t("draft")}
        </button>
      </header>
      <div
        className="nb-rh-avance"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={step}
        aria-label={t("progress", { step })}
      >
        <span style={{ width: `${step * 25}%` }} />
      </div>
      <div className="nb-rh-pub-corps">
        <p className="nb-meta">{t(`steps.${step}.kicker` as "steps.1.kicker")}</p>
        <h1>{t(`steps.${step}.title` as "steps.1.title")}</h1>

        {step === 1 ? (
          <>
            <div className="nb-champ nb-rh-champ">
              <input
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setError(null);
                }}
                aria-label={t("fields.title")}
                placeholder={t("fields.titlePlaceholder")}
                maxLength={120}
              />
            </div>
            <div className="nb-rh-orbi-carte">
              <p className="nb-rh-orbi-carte-t">
                <OrbiDisc size={24} />
                {description ? t("orbi.proposed") : t("orbi.label")}
              </p>
              <textarea
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setError(null);
                }}
                aria-label={t("fields.description")}
                placeholder={t("fields.descriptionPlaceholder")}
                rows={6}
                maxLength={8000}
              />
              <button
                type="button"
                className="nb-rh-orbi-lien"
                data-orbi=""
                onClick={propose}
                aria-disabled={writing || undefined}
              >
                {writing ? t("orbi.writing") : description ? t("orbi.again") : t("orbi.propose")}
              </button>
              {orbiNote ? <p className="nb-meta">{orbiNote}</p> : null}
            </div>
            <p className="nb-rh-pub-label" id="rh-off-comp">
              {t("fields.skills")}
            </p>
            {skills.length > 0 ? (
              <ul className="nb-rh-puces" aria-labelledby="rh-off-comp">
                {skills.map((name) => (
                  <li key={name}>
                    {name}
                    <button
                      type="button"
                      aria-label={t("fields.removeSkill", { skill: name })}
                      onClick={() => setSkills(skills.filter((item) => item !== name))}
                    >
                      <PhoneIcon name="fermer" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="nb-champ nb-rh-champ nb-rh-ajout">
              <input
                value={skill}
                onChange={(event) => setSkill(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSkill();
                  }
                }}
                aria-label={t("fields.addSkill")}
                placeholder={t("fields.skillPlaceholder")}
                maxLength={80}
              />
              <button type="button" onClick={addSkill}>
                {t("fields.add")}
              </button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="nb-rh-pub-label" id="rh-off-ville">
              {t("fields.city")}
            </p>
            <div role="radiogroup" aria-labelledby="rh-off-ville" className="nb-rh-pub-types">
              {data.cities.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  className="nb-chip"
                  aria-checked={!otherCity.trim() && city === name}
                  onClick={() => {
                    setCity(name);
                    setOtherCity("");
                    setError(null);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="nb-champ nb-rh-champ nb-rh-autre">
              <input
                value={otherCity}
                onChange={(event) => setOtherCity(event.target.value)}
                aria-label={t("fields.otherCity")}
                placeholder={t("fields.otherCity")}
                maxLength={120}
              />
            </div>
            {data.draft.country ? null : (
              <div className="nb-champ nb-rh-champ nb-rh-autre">
                <input
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  aria-label={t("fields.country")}
                  placeholder={t("fields.country")}
                  maxLength={80}
                />
              </div>
            )}
            <p className="nb-rh-pub-label" id="rh-off-mode">
              {t("fields.remote")}
            </p>
            <div role="radiogroup" aria-labelledby="rh-off-mode" className="nb-rh-pub-types">
              {REMOTES.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  className="nb-chip"
                  aria-checked={remote === key}
                  onClick={() => setRemote(key)}
                >
                  {t(`remotes.${key}`)}
                </button>
              ))}
            </div>
            <p className="nb-rh-pub-label" id="rh-off-contrat">
              {t("fields.contract")}
            </p>
            <div role="radiogroup" aria-labelledby="rh-off-contrat" className="nb-rh-pub-types">
              {CONTRACTS.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  className="nb-chip"
                  aria-checked={contract === key}
                  onClick={() => setContract(key)}
                >
                  {t(`contracts.${key}`)}
                </button>
              ))}
            </div>
            <p className="nb-rh-pub-label">{t("fields.salary")}</p>
            <div className="nb-rh-bascule">
              <span>
                <b id="rh-off-sal">{t("fields.salaryShow")}</b>
                <span className="nb-meta">{salaryLine ?? t("fields.salaryHidden")}</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={salaryShown}
                aria-labelledby="rh-off-sal"
                className="nb-switch"
                onClick={() => setSalaryShown(!salaryShown)}
              >
                <span />
              </button>
            </div>
            {salaryShown ? (
              <div className="nb-rh-salaire">
                <div className="nb-champ nb-rh-champ">
                  <input
                    inputMode="numeric"
                    value={salaryMin}
                    onChange={(event) => setSalaryMin(event.target.value.replace(/\D/g, ""))}
                    aria-label={t("fields.salaryMin")}
                    placeholder={t("fields.salaryMin")}
                    maxLength={7}
                  />
                </div>
                <div className="nb-champ nb-rh-champ">
                  <input
                    inputMode="numeric"
                    value={salaryMax}
                    onChange={(event) => setSalaryMax(event.target.value.replace(/\D/g, ""))}
                    aria-label={t("fields.salaryMax")}
                    placeholder={t("fields.salaryMax")}
                    maxLength={7}
                  />
                </div>
              </div>
            ) : null}
            <p className="nb-meta nb-rh-pub-note">{t("fields.salaryHint")}</p>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="nb-rh-pub-label" id="rh-off-q">
              {t("fields.questions", { count: questions.length })}
            </p>
            <div className="nb-rh-questions" role="group" aria-labelledby="rh-off-q">
              {offered.map((text) => (
                <button
                  key={text}
                  type="button"
                  role="checkbox"
                  aria-checked={questions.includes(text)}
                  className="nb-rh-question"
                  onClick={() => toggleQuestion(text)}
                >
                  <span className="nb-rh-case" aria-hidden>
                    {questions.includes(text) ? <PhoneIcon name="coche" size={16} /> : null}
                  </span>
                  {text}
                </button>
              ))}
            </div>
            <div className="nb-champ nb-rh-champ nb-rh-ajout">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addQuestion();
                  }
                }}
                aria-label={t("fields.question")}
                placeholder={t("fields.questionPlaceholder")}
                maxLength={200}
              />
              <button type="button" onClick={addQuestion}>
                {t("fields.add")}
              </button>
            </div>
            <p className="nb-rh-pub-label" id="rh-off-docs">
              {t("fields.documents")}
            </p>
            <div className="nb-rh-pub-types" role="group" aria-labelledby="rh-off-docs">
              {DOCUMENTS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="nb-chip nb-rh-doc"
                  aria-pressed={documents.includes(key)}
                  onClick={() =>
                    setDocuments(
                      documents.includes(key)
                        ? documents.filter((item) => item !== key)
                        : [...documents, key],
                    )
                  }
                >
                  {t(`documents.${key}`)}
                </button>
              ))}
            </div>
            <p className="nb-meta nb-rh-pub-note">{t("fields.screeningNote")}</p>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <article className="nb-rh-apercu-offre" aria-label={t("previewLabel")}>
              <div className="nb-rh-apercu-org">
                <span className="nb-rh-org-logo" aria-hidden>
                  {data.org.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a 48 px logo
                    <img src={data.org.logo} alt="" />
                  ) : (
                    data.org.initials
                  )}
                </span>
                <span>
                  <b>{data.org.name}</b>
                  <span className="nb-meta">{data.org.line}</span>
                </span>
              </div>
              <h2>{title}</h2>
              <p className="nb-meta">
                {[
                  place,
                  t(
                    `contracts.${contract === "mission" ? "freelance" : contract}` as "contracts.cdi",
                  ),
                  t(`remotes.${remote}`),
                ].join(" · ")}
              </p>
              {salaryLine ? <p className="nb-rh-salaire-badge">{salaryLine}</p> : null}
              <p className="nb-rh-apercu-texte">{description}</p>
              <span className="nb-rh-apercu-bt" aria-hidden>
                {t("applyFree")}
              </span>
            </article>
            <p className="nb-meta nb-rh-pub-note">
              {t("previewLine", { count: questions.length })}
            </p>
          </>
        ) : null}
      </div>
      <div className="nb-bas">
        {error ? (
          <p className="nb-erreur" role="alert">
            {error}
          </p>
        ) : null}
        <button type="button" className="nb-bp" aria-disabled={pending || undefined} onClick={next}>
          {step < 4 ? t("continue") : data.verified ? t("publish") : t("review")}
        </button>
      </div>
    </div>
  );
}
