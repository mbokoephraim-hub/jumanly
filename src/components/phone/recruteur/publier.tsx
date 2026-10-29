"use client";

import "@/styles/rh-offre-etapes.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { searchCareerSkillsAction } from "@/server/actions/career-phone";
import { jobWriterAction } from "@/server/actions/hire";
import { uploadBrandImageAction } from "@/server/actions/organization";
import {
  rhAnalyzeOfferAction,
  rhAttachSheetAction,
  rhPublishOfferAction,
  rhRemoveSheetAction,
  rhSaveOfferWizardAction,
  rhSaveScreeningAction,
  type RhOfferResult,
} from "@/server/actions/phone-rh-offres";
import { FEED_BODY_MAX, FEED_TITLE_MAX } from "@/server/services/feed-limits";
import { PostTextFields } from "../fil/post-fields";
import { OrbiDisc, PhoneIcon } from "../icon";

const REMOTES = ["onsite", "hybrid", "remote"] as const;
const CONTRACTS = ["cdi", "cdd", "stage", "freelance", "alternance", "volontariat"] as const;
const DOCUMENTS = ["cv", "letter", "diploma", "portfolio"] as const;
const EDUCATION = ["none", "secondary", "vocational", "bachelor", "master", "doctorate"] as const;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const SOFT = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const OPENINGS_MAX = 50;
const POINTS_MAX = 12;
const HARD_MAX = 10;
const SOFT_MAX = 8;
/** The steps, in order (publication d'offre étape par étape, 29/10/2026). */
const STEPS = 10;
/** From this step on, the place is known: the draft can be saved. */
const PLACE_STEP = 3;

type Remote = (typeof REMOTES)[number];
type Contract = "cdi" | "cdd" | "stage" | "mission" | "freelance" | "alternance" | "volontariat";
type Document = (typeof DOCUMENTS)[number];
type Education = "" | (typeof EDUCATION)[number];
type Level = (typeof LEVELS)[number];
type Language = { code: string; level: Level };
type Analysis = NonNullable<Awaited<ReturnType<typeof rhAnalyzeOfferAction>>>;

export type RhOfferDraft = {
  id: string | null;
  slug: string | null;
  title: string;
  description: string;
  hardSkills: string[];
  softSkills: string[];
  languages: Language[];
  education: Education;
  city: string;
  country: string;
  remote: Remote;
  contract: Contract;
  openings: number;
  responsibilities: string[];
  experience: number;
  requirements: string[];
  salaryMin: string;
  salaryMax: string;
  companyAbout: string;
  feedTitle: string;
  feedText: string;
  questions: string[];
  documents: Document[];
  /** The PDF the recruiter joined, if any (talents download it instead of Jumanly's sheet). */
  sheetName: string | null;
};

export type RhPublishData = {
  draft: RhOfferDraft;
  /** The recruiter's cities, then the company's: the chips of « Ville ». */
  cities: string[];
  /** Questions proposed at step 8 (never a condition to apply). */
  suggestions: string[];
  /** The languages offered first: code and name. */
  languages: { code: string; name: string }[];
  org: {
    name: string;
    initials: string;
    logo: string | null;
    line: string;
    /** The company's « À propos », to take over. */
    about: string;
    /** Only an administrator changes the company's logo. */
    canEditLogo: boolean;
  };
  /** A company not verified yet sends its offer to review. */
  verified: boolean;
  /** « Brouillon », « Publier l'offre »: only the members who manage offers come here. */
  editing: boolean;
  /** The step reopened (a draft at `?etape=`). */
  step: number;
};

/** Points one by one (« Ajouter une responsabilité »): numbered, removable, in order. */
function PointList({
  id,
  items,
  onChange,
  placeholder,
  addLabel,
  removeLabel,
  onError,
}: {
  id: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
  removeLabel: (index: number) => string;
  onError: (error: "short" | "max" | null) => void;
}) {
  const [value, setValue] = useState("");
  const add = () => {
    const text = value.trim().replace(/\s+/g, " ");
    if (text.length < 3) return onError("short");
    if (items.length >= POINTS_MAX) return onError("max");
    if (!items.includes(text)) onChange([...items, text]);
    setValue("");
    onError(null);
  };
  return (
    <div className="nb-oe-points">
      {items.length > 0 ? (
        <ol aria-labelledby={id}>
          {items.map((item, index) => (
            <li key={item}>
              <span className="nb-oe-num" aria-hidden>
                {index + 1}
              </span>
              <span className="nb-oe-point">{item}</span>
              <button
                type="button"
                aria-label={removeLabel(index + 1)}
                onClick={() => onChange(items.filter((_, other) => other !== index))}
              >
                <PhoneIcon name="fermer" size={14} />
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      <div className="nb-champ nb-rh-champ nb-oe-ajout">
        <textarea
          value={value}
          rows={2}
          onChange={(event) => setValue(event.target.value.replace(/\n/g, " "))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          aria-label={placeholder}
          placeholder={placeholder}
          maxLength={300}
        />
        <button type="button" onClick={add}>
          <PhoneIcon name="plus" size={16} />
          {addLabel}
        </button>
      </div>
    </div>
  );
}

/**
 * « Ajouter une compétence »: the names of the reference list appear while typing; a name it does
 * not have is added as typed (kept for the next person who types it).
 */
function SkillAdder({
  id,
  items,
  onChange,
  max,
  suggestions,
  tone,
}: {
  id: string;
  items: string[];
  onChange: (items: string[]) => void;
  max: number;
  /** Shown while nothing is typed (behavioural skills). */
  suggestions: string[];
  tone: "hard" | "soft";
}) {
  const t = useTranslations("phoneRhOffres.wizard");
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<string[]>([]);
  const typed = query.trim().replace(/\s+/g, " ").slice(0, 80);
  useEffect(() => {
    if (typed.length < 2) return;
    let live = true;
    const wait = setTimeout(() => {
      searchCareerSkillsAction(typed)
        .then((skills) => live && setFound(skills.map((skill) => skill.name)))
        .catch(() => {});
    }, 250);
    return () => {
      live = false;
      clearTimeout(wait);
    };
  }, [typed]);
  const same = (a: string, b: string) => a.localeCompare(b, "fr", { sensitivity: "base" }) === 0;
  const has = (name: string) => items.some((item) => same(item, name));
  const add = (name: string) => {
    if (has(name) || items.length >= max) return;
    onChange([...items, name]);
    setQuery("");
    setFound([]);
  };
  const shown = (typed.length >= 2 ? found : suggestions).filter((name) => !has(name)).slice(0, 8);
  const canType = typed.length >= 2 && !has(typed) && !found.some((name) => same(name, typed));
  return (
    <div className="nb-oe-comp" data-ton={tone}>
      {items.length > 0 ? (
        <ul className="nb-rh-puces" aria-labelledby={id}>
          {items.map((name) => (
            <li key={name}>
              {name}
              <button
                type="button"
                aria-label={t("removeSkill", { skill: name })}
                onClick={() => onChange(items.filter((item) => item !== name))}
              >
                <PhoneIcon name="fermer" size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {items.length < max ? (
        <>
          <label className="nb-ex-recherche nb-oe-cherche">
            <PhoneIcon name="plus" size={18} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (shown[0] && typed.length >= 2 && same(shown[0], typed)) add(shown[0]);
                  else if (canType) add(typed);
                }
              }}
              aria-label={tone === "hard" ? t("addHard") : t("addSoft")}
              placeholder={tone === "hard" ? t("hardPlaceholder") : t("softPlaceholder")}
              maxLength={80}
            />
          </label>
          {shown.length > 0 || canType ? (
            <div className="nb-oe-sugg">
              {shown.map((name) => (
                <button key={name} type="button" className="nb-chip" onClick={() => add(name)}>
                  <PhoneIcon name="plus" size={14} />
                  {name}
                </button>
              ))}
              {canType ? (
                <button type="button" className="nb-chip nb-oe-libre" onClick={() => add(typed)}>
                  {t("addTyped", { skill: typed })}
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : (
        <p className="nb-meta">{t("skillsMax", { count: max })}</p>
      )}
    </div>
  );
}

/** A number with − and + (openings, years of experience). */
function Stepper({
  value,
  min,
  max,
  onChange,
  label,
  text,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  text: string;
}) {
  return (
    <div className="nb-oe-compteur" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`${label} −`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <span className="nb-oe-moins" aria-hidden />
      </button>
      <output aria-live="polite">{text}</output>
      <button
        type="button"
        aria-label={`${label} +`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <PhoneIcon name="plus" size={20} />
      </button>
    </div>
  );
}

/**
 * « Nouvelle offre » of the recruiter's phone, step by step (publication d'offre, 29/10/2026):
 * 1 the post, 2 the skills, 3 the requirements, 4 the responsibilities, 5 the profile, 6 the
 * salary, 7 the company, 8 the questions, 9 Orbi's reading, 10 the publication (Fil post, job
 * sheet drawn by Jumanly or joined). Each « Continuer » from step 3 saves the whole offer;
 * « Brouillon » keeps it for later.
 */
export function PhoneRecruiterPublish({ data }: { data: RhPublishData }) {
  const t = useTranslations("phoneRhOffres.publish");
  const w = useTranslations("phoneRhOffres.wizard");
  const router = useRouter();
  const d = data.draft;
  const [step, setStep] = useState(d.id ? data.step : 1);
  const [jobId, setJobId] = useState(d.id);
  const [slug, setSlug] = useState(d.slug);
  const [title, setTitle] = useState(d.title);
  const [description, setDescription] = useState(d.description);
  const [hardSkills, setHardSkills] = useState(d.hardSkills);
  const [softSkills, setSoftSkills] = useState(d.softSkills);
  const [languages, setLanguages] = useState<Language[]>(d.languages);
  const [language, setLanguage] = useState("");
  const [education, setEducation] = useState<Education>(d.education);
  const [city, setCity] = useState(d.city || data.cities[0] || "");
  const [otherCity, setOtherCity] = useState(d.city && !data.cities.includes(d.city) ? d.city : "");
  const [country, setCountry] = useState(d.country);
  const [remote, setRemote] = useState<Remote>(d.remote);
  const [contract, setContract] = useState<Contract>(d.contract);
  const [openings, setOpenings] = useState(d.openings);
  const [responsibilities, setResponsibilities] = useState(d.responsibilities);
  const [experience, setExperience] = useState(d.experience);
  const [requirements, setRequirements] = useState(d.requirements);
  const [salaryShown, setSalaryShown] = useState(Boolean(d.salaryMin) || !d.id);
  const [salaryMin, setSalaryMin] = useState(d.salaryMin);
  const [salaryMax, setSalaryMax] = useState(d.salaryMax);
  const [companyAbout, setCompanyAbout] = useState(d.companyAbout);
  const [logo, setLogo] = useState(data.org.logo);
  const [questions, setQuestions] = useState(d.questions);
  const [question, setQuestion] = useState("");
  const [documents, setDocuments] = useState<Document[]>(d.documents);
  const [toFil, setToFil] = useState(true);
  const [feedTitle, setFeedTitle] = useState(d.feedTitle);
  const [feedText, setFeedText] = useState(d.feedText);
  const [sheetName, setSheetName] = useState(d.sheetName);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orbiNote, setOrbiNote] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [writing, startWriting] = useTransition();
  const [uploading, startUpload] = useTransition();
  const sheetInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const place = otherCity.trim() || city;
  const offered = [...new Set([...data.suggestions, ...questions])];
  const softSuggestions = SOFT.map((index) => w(`softSuggestions.${index}` as "softSuggestions.1"));
  const contractLabel = (key: Contract) =>
    w(`contracts.${key === "mission" ? "freelance" : key}` as "contracts.cdi");
  const salaryLine =
    salaryShown && salaryMin && salaryMax
      ? t("salaryLine", { min: salaryMin, max: salaryMax })
      : null;

  const fail = (result: Extract<RhOfferResult, { ok: false }>) => {
    if (result.error === "forbidden") setError(t("errors.forbidden"));
    else if (result.field === "country") setError(t("errors.country"));
    else if (result.field === "city") setError(t("errors.city"));
    else if (result.field === "title") setError(t("errors.title"));
    else if (result.field === "salaryMax") setError(t("errors.salary"));
    else setError(t("errors.failed"));
  };

  const fields = () => ({
    jobId: jobId ?? undefined,
    title,
    description,
    hardSkills,
    softSkills,
    languages,
    education,
    city: place,
    country: country.trim(),
    remote,
    contract,
    openings,
    responsibilities,
    experience,
    requirements,
    salaryShown,
    salaryMin,
    salaryMax,
    companyAbout,
    feedTitle,
    feedText,
  });

  const save = async () => {
    const result = await rhSaveOfferWizardAction(fields());
    if (!result.ok) {
      fail(result);
      return null;
    }
    setJobId(result.jobId);
    if (result.slug) setSlug(result.slug);
    return result.jobId;
  };

  const goTo = (next: number, id = jobId) => {
    setError(null);
    setStep(next);
    if (id) window.history.replaceState(null, "", `/app/hire/offres/${id}/modifier?etape=${next}`);
    window.scrollTo({ top: 0 });
  };

  /** What a step needs before the next one; the message, or null. */
  const missing = (at: number): string | null => {
    if (at === 1) {
      if (title.trim().length < 3) return t("errors.title");
      if (!description.trim()) return t("errors.description");
    }
    if (at === 2 && hardSkills.length === 0) return w("errors.hard");
    if (at === 3) {
      if (!place) return t("errors.city");
      if (!country.trim()) return t("errors.country");
    }
    if (at === 4 && responsibilities.length === 0) return w("errors.responsibilities");
    if (
      at === 6 &&
      salaryShown &&
      (!salaryMin || !salaryMax || Number(salaryMax) < Number(salaryMin))
    )
      return t("errors.salary");
    if (at === 10 && toFil && !feedTitle.trim()) return w("errors.feedTitle");
    return null;
  };

  const next = () => {
    if (pending) return;
    const problem = missing(step);
    if (problem) return setError(problem);
    if (step < PLACE_STEP && !jobId) return goTo(step + 1);
    if (step === 7 && !feedTitle && !feedText) {
      // The Fil post is proposed from the offer; the recruiter rewrites it at step 10.
      setFeedTitle(w("feedTitleDefault", { title }).slice(0, FEED_TITLE_MAX));
      setFeedText(
        w("feedTextDefault", { org: data.org.name, count: openings, city: place }).slice(
          0,
          FEED_BODY_MAX,
        ),
      );
    }
    start(async () => {
      const id = await save();
      if (!id) return;
      if (step === 8) {
        const result = await rhSaveScreeningAction({ jobId: id, questions, documents });
        if (!result.ok) return fail(result);
      }
      if (step === 8 || step === 9) {
        const result = await rhAnalyzeOfferAction({
          title,
          description,
          hardSkills,
          softSkills,
          responsibilities,
          requirements,
          languages,
          salaryShown,
          companyAbout,
          feedTitle,
        });
        setAnalysis(result);
      }
      if (step < STEPS) return goTo(step + 1, id);
      const result = await rhPublishOfferAction(id, toFil);
      if (!result.ok) {
        setError(
          result.error === "limit"
            ? t("errors.limit")
            : result.error === "skills"
              ? w("errors.hard")
              : result.error === "description"
                ? t("errors.description")
                : t("errors.failed"),
        );
        return;
      }
      router.replace(`/app/hire/offres/${id}?publiee=${result.review ? "verification" : "1"}`);
    });
  };

  const keepDraft = () =>
    start(async () => {
      if (title.trim().length < 3) {
        setError(t("errors.title"));
        return;
      }
      if (!place || !country.trim()) {
        setError(!place ? t("errors.city") : t("errors.country"));
        return goTo(PLACE_STEP);
      }
      const id = await save();
      if (!id) return;
      if (step >= 8) {
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
        contract: contractLabel(contract),
        workMode: t(`remotes.${remote}`),
        city: place,
        country: country.trim(),
        description,
        responsibilities,
        requirements,
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
      // Orbi's missions and profile wait in steps 4 and 5, to read again there.
      if (responsibilities.length === 0) setResponsibilities(result.draft.responsibilities);
      if (requirements.length === 0) setRequirements(result.draft.requirements);
      if (result.draft.responsibilities.length || result.draft.requirements.length)
        setOrbiNote(w("orbiPoints"));
    });

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

  const addLanguage = (level: Level) => {
    if (!language || languages.some((item) => item.code === language)) return;
    setLanguages([...languages, { code: language, level }].slice(0, 5));
    setLanguage("");
  };
  const languageName = (code: string) =>
    data.languages.find((item) => item.code === code)?.name ?? code;

  const pointError = (kind: "short" | "max" | null) =>
    setError(kind === "short" ? w("errors.point") : kind === "max" ? w("errors.points") : null);

  const uploadLogo = (file: File) =>
    startUpload(async () => {
      const form = new FormData();
      form.set("kind", "logo");
      form.set("image", file);
      const result = await uploadBrandImageAction(form);
      if (!result.ok) return setError(w("errors.logo"));
      setLogo(URL.createObjectURL(file));
      setError(null);
    });

  const uploadSheet = (file: File) =>
    startUpload(async () => {
      const id = jobId ?? (await save());
      if (!id) return;
      const form = new FormData();
      form.set("jobId", id);
      form.set("sheet", file);
      const result = await rhAttachSheetAction(form);
      if (!result.ok) return setError(w(`sheetErrors.${result.error}` as "sheetErrors.type"));
      setSheetName(result.name);
      setError(null);
    });

  const useJumanlySheet = () =>
    startUpload(async () => {
      if (!jobId || !sheetName) return;
      const result = await rhRemoveSheetAction(jobId);
      if (result.ok) setSheetName(null);
    });

  // A draft reopened at « L'analyse d'Orbi »: Orbi reads it again.
  useEffect(() => {
    if (step !== 9 || analysis) return;
    let live = true;
    rhAnalyzeOfferAction({
      title,
      description,
      hardSkills,
      softSkills,
      responsibilities,
      requirements,
      languages,
      salaryShown,
      companyAbout,
      feedTitle,
    })
      .then((result) => live && setAnalysis(result))
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read once, when the step opens
  }, [step]);

  const checks = analysis?.checks ?? [];

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
        aria-valuemax={STEPS}
        aria-valuenow={step}
        aria-label={w("progress", { step, total: STEPS })}
      >
        <span style={{ width: `${(step / STEPS) * 100}%` }} />
      </div>
      <ol className="nb-oe-etapes" aria-hidden>
        {Array.from({ length: STEPS }, (_, index) => (
          <li
            key={index}
            data-etat={index + 1 < step ? "fait" : index + 1 === step ? "ici" : undefined}
          >
            {index + 1}
          </li>
        ))}
      </ol>
      <div className="nb-rh-pub-corps">
        <p className="nb-meta">
          {w("kicker", { step, total: STEPS, name: w(`steps.${step}.name` as "steps.1.name") })}
        </p>
        <h1>{w(`steps.${step}.title` as "steps.1.title")}</h1>
        <p className="nb-meta nb-oe-aide">{w(`steps.${step}.help` as "steps.1.help")}</p>

        {step === 1 ? (
          <>
            <p className="nb-rh-pub-label">{t("fields.title")}</p>
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
                {t("fields.description")}
              </p>
              <textarea
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setError(null);
                }}
                aria-label={t("fields.description")}
                placeholder={t("fields.descriptionPlaceholder")}
                rows={7}
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
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="nb-rh-pub-label" id="oe-hard">
              {w("hard", { count: hardSkills.length, max: HARD_MAX })}
            </p>
            <p className="nb-meta nb-oe-sous">{w("hardHelp")}</p>
            <SkillAdder
              id="oe-hard"
              items={hardSkills}
              onChange={(items) => {
                setHardSkills(items);
                setError(null);
              }}
              max={HARD_MAX}
              suggestions={[]}
              tone="hard"
            />
            <p className="nb-rh-pub-label" id="oe-soft">
              {w("soft", { count: softSkills.length, max: SOFT_MAX })}
            </p>
            <p className="nb-meta nb-oe-sous">{w("softHelp")}</p>
            <SkillAdder
              id="oe-soft"
              items={softSkills}
              onChange={setSoftSkills}
              max={SOFT_MAX}
              suggestions={softSuggestions}
              tone="soft"
            />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="nb-rh-pub-label" id="rh-off-ville">
              {t("fields.city")}
            </p>
            {data.cities.length > 0 ? (
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
            ) : null}
            <div className="nb-oe-deux">
              <div className="nb-champ nb-rh-champ">
                <input
                  value={otherCity}
                  onChange={(event) => setOtherCity(event.target.value)}
                  aria-label={t("fields.otherCity")}
                  placeholder={t("fields.otherCity")}
                  maxLength={120}
                />
              </div>
              <div className="nb-champ nb-rh-champ">
                <input
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  aria-label={t("fields.country")}
                  placeholder={t("fields.country")}
                  maxLength={80}
                />
              </div>
            </div>
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
              {w("contract")}
            </p>
            <div role="radiogroup" aria-labelledby="rh-off-contrat" className="nb-rh-pub-types">
              {CONTRACTS.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  className="nb-chip"
                  aria-checked={contract === key || (key === "freelance" && contract === "mission")}
                  onClick={() => setContract(key)}
                >
                  {contractLabel(key)}
                </button>
              ))}
            </div>
            <p className="nb-rh-pub-label">{w("openings")}</p>
            <Stepper
              value={openings}
              min={1}
              max={OPENINGS_MAX}
              onChange={setOpenings}
              label={w("openings")}
              text={w("openingsValue", { count: openings })}
            />
            <p className="nb-rh-pub-label" id="oe-etudes">
              {w("education")}
            </p>
            <div role="radiogroup" aria-labelledby="oe-etudes" className="nb-rh-pub-types">
              {EDUCATION.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  className="nb-chip"
                  aria-checked={education === key}
                  onClick={() => setEducation(education === key ? "" : key)}
                >
                  {w(`educationLevels.${key}`)}
                </button>
              ))}
            </div>
            <p className="nb-rh-pub-label" id="oe-langues">
              {w("languages")}
            </p>
            {languages.length > 0 ? (
              <ul className="nb-rh-puces" aria-labelledby="oe-langues">
                {languages.map((item) => (
                  <li key={item.code}>
                    {languageName(item.code)} · {item.level}
                    <button
                      type="button"
                      aria-label={w("removeLanguage", { language: languageName(item.code) })}
                      onClick={() =>
                        setLanguages(languages.filter((other) => other.code !== item.code))
                      }
                    >
                      <PhoneIcon name="fermer" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {languages.length < 5 ? (
              <div className="nb-oe-langue">
                <div className="nb-rh-pub-types" role="radiogroup" aria-label={w("languagePick")}>
                  {data.languages
                    .filter((item) => !languages.some((other) => other.code === item.code))
                    .map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        role="radio"
                        className="nb-chip"
                        aria-checked={language === item.code}
                        onClick={() => setLanguage(language === item.code ? "" : item.code)}
                      >
                        {item.name}
                      </button>
                    ))}
                </div>
                {language ? (
                  <div className="nb-oe-niveaux" role="group" aria-label={w("levelPick")}>
                    <span className="nb-meta">
                      {w("levelFor", { language: languageName(language) })}
                    </span>
                    <div className="nb-rh-pub-types">
                      {LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          className="nb-chip"
                          onClick={() => addLanguage(level)}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <p className="nb-rh-pub-label" id="oe-resp">
              {w("responsibilities", { count: responsibilities.length })}
            </p>
            <PointList
              id="oe-resp"
              items={responsibilities}
              onChange={(items) => {
                setResponsibilities(items);
                setError(null);
              }}
              placeholder={w("responsibilityPlaceholder", { number: responsibilities.length + 1 })}
              addLabel={w("addResponsibility")}
              removeLabel={(number) => w("removePoint", { number })}
              onError={pointError}
            />
          </>
        ) : null}

        {step === 5 ? (
          <>
            <p className="nb-rh-pub-label">{w("experience")}</p>
            <Stepper
              value={experience}
              min={0}
              max={40}
              onChange={setExperience}
              label={w("experience")}
              text={w("experienceValue", { years: experience })}
            />
            <p className="nb-rh-pub-label" id="oe-exig">
              {w("requirements", { count: requirements.length })}
            </p>
            <PointList
              id="oe-exig"
              items={requirements}
              onChange={setRequirements}
              placeholder={w("requirementPlaceholder")}
              addLabel={w("addRequirement")}
              removeLabel={(number) => w("removePoint", { number })}
              onError={pointError}
            />
            <p className="nb-meta nb-rh-pub-note">{w("requirementsNote")}</p>
          </>
        ) : null}

        {step === 6 ? (
          <>
            <div className="nb-oe-transparence">
              <PhoneIcon name="coche" size={18} />
              <span>{w("salaryWhy")}</span>
            </div>
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
            ) : (
              <p className="nb-meta nb-rh-pub-note">{w("salaryHiddenNote")}</p>
            )}
          </>
        ) : null}

        {step === 7 ? (
          <>
            <div className="nb-oe-ent">
              <span className="nb-rh-org-logo nb-oe-logo" aria-hidden>
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a 64 px logo
                  <img src={logo} alt="" />
                ) : (
                  data.org.initials
                )}
              </span>
              <span>
                <b>{data.org.name}</b>
                <span className="nb-meta">{logo ? w("logoReady") : w("logoNone")}</span>
              </span>
            </div>
            {data.org.canEditLogo ? (
              <>
                <input
                  ref={logoInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadLogo(file);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="nb-bs nb-oe-bouton"
                  onClick={() => logoInput.current?.click()}
                  aria-disabled={uploading || undefined}
                >
                  {uploading ? w("logoSending") : logo ? w("logoChange") : w("logoAdd")}
                </button>
                <p className="nb-meta nb-rh-pub-note">{w("logoHint")}</p>
              </>
            ) : logo ? null : (
              <p className="nb-meta nb-rh-pub-note">{w("logoAdmin")}</p>
            )}
            <p className="nb-rh-pub-label">{w("about")}</p>
            {data.org.about ? (
              <button
                type="button"
                className="nb-chip nb-oe-reprendre"
                onClick={() => setCompanyAbout(data.org.about.slice(0, 1500))}
              >
                {w("aboutImport")}
              </button>
            ) : (
              <p className="nb-meta nb-oe-sous">{w("aboutNone")}</p>
            )}
            <div className="nb-champ nb-rh-champ nb-oe-zone">
              <textarea
                value={companyAbout}
                onChange={(event) => setCompanyAbout(event.target.value)}
                aria-label={w("about")}
                placeholder={w("aboutPlaceholder")}
                rows={6}
                maxLength={1500}
              />
            </div>
            <p className="nb-meta nb-rh-pub-note">
              {w("aboutCount", { count: companyAbout.length, max: 1500 })}
            </p>
          </>
        ) : null}

        {step === 8 ? (
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

        {step === 9 ? (
          <>
            <div className="nb-oe-score">
              <OrbiDisc size={44} />
              <span>
                <b>{w("analysisScore", { score: analysis?.score ?? 0 })}</b>
                <span className="nb-meta">{w("analysisLine")}</span>
              </span>
            </div>
            <ul className="nb-oe-points-orbi">
              {checks.map((check) => (
                <li key={check.key} data-etat={check.state}>
                  <span className="nb-oe-marque" aria-hidden>
                    {check.state === "ok" ? <PhoneIcon name="coche" size={14} /> : "!"}
                  </span>
                  <span>
                    <b>{w(`checks.${check.key}.${check.state}` as "checks.description.ok")}</b>
                    {check.state !== "ok" ? (
                      <button type="button" className="nb-oe-lien" onClick={() => goTo(check.step)}>
                        {w("checkFix", { step: check.step })}
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            <p className="nb-meta nb-rh-pub-note">{w("analysisNote")}</p>
          </>
        ) : null}

        {step === 10 ? (
          <>
            <div className="nb-rh-bascule">
              <span>
                <b id="oe-fil">{w("toFil")}</b>
                <span className="nb-meta">{w("toFilLine")}</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={toFil}
                aria-labelledby="oe-fil"
                className="nb-switch"
                onClick={() => setToFil(!toFil)}
              >
                <span />
              </button>
            </div>
            {toFil ? (
              <>
                <p className="nb-meta nb-oe-sous">{w("feedHelp")}</p>
                <PostTextFields
                  id="oe-fil-pub"
                  title={feedTitle}
                  body={feedText}
                  onTitle={(value) => {
                    setFeedTitle(value);
                    setError(null);
                  }}
                  onBody={setFeedText}
                />
                <article className="nb-oe-carte" aria-label={w("feedPreview")}>
                  <div className="nb-oe-carte-h">
                    <span className="nb-rh-org-logo" aria-hidden>
                      {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- a 40 px logo
                        <img src={logo} alt="" />
                      ) : (
                        data.org.initials
                      )}
                    </span>
                    <span>
                      <b>{data.org.name}</b>
                      <span className="nb-meta">{w("feedNow")}</span>
                    </span>
                  </div>
                  {feedTitle ? <p className="nb-oe-carte-t">{feedTitle}</p> : null}
                  {feedText ? <p className="nb-oe-carte-x">{feedText}</p> : null}
                  <div className="nb-oe-affiche">
                    <span className="nb-oe-affiche-k">{w("posterKicker")}</span>
                    <b>{title}</b>
                    <span className="nb-oe-affiche-l">
                      {[place, contractLabel(contract), t(`remotes.${remote}`)].join(" · ")}
                    </span>
                    {salaryLine ? <span className="nb-oe-affiche-s">{salaryLine}</span> : null}
                    <span className="nb-oe-affiche-c">
                      {hardSkills.slice(0, 3).map((name) => (
                        <i key={name}>{name}</i>
                      ))}
                    </span>
                  </div>
                  <div className="nb-oe-carte-bt" aria-hidden>
                    <span data-p="">{w("posterApply")}</span>
                    <span>{w("posterSee")}</span>
                    <span>{w("posterPdf")}</span>
                  </div>
                </article>
              </>
            ) : null}

            <p className="nb-rh-pub-label" id="oe-fiche">
              {w("sheet")}
            </p>
            <div className="nb-oe-fiches" role="radiogroup" aria-labelledby="oe-fiche">
              <button
                type="button"
                role="radio"
                aria-checked={!sheetName}
                className="nb-rh-pub-carte"
                onClick={useJumanlySheet}
              >
                <span className="nb-rh-pub-point" aria-hidden />
                <span>
                  <b>{w("sheetJumanly")}</b>
                  <span className="nb-meta">{w("sheetJumanlyLine")}</span>
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={Boolean(sheetName)}
                className="nb-rh-pub-carte"
                onClick={() => sheetInput.current?.click()}
              >
                <span className="nb-rh-pub-point" aria-hidden />
                <span>
                  <b>{w("sheetOwn")}</b>
                  <span className="nb-meta">
                    {uploading ? w("sheetSending") : (sheetName ?? w("sheetOwnLine"))}
                  </span>
                </span>
              </button>
              <input
                ref={sheetInput}
                type="file"
                accept="application/pdf"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadSheet(file);
                  event.target.value = "";
                }}
              />
            </div>
            {slug ? (
              <a
                href={`/api/offres/${slug}/fiche${sheetName ? "" : "?jumanly=1"}`}
                className="nb-bs nb-oe-bouton"
                download
              >
                <PhoneIcon name="document" size={18} />
                {sheetName ? w("sheetOpenOwn") : w("sheetDownload")}
              </a>
            ) : null}
            <p className="nb-meta nb-rh-pub-note">{w("sheetNote")}</p>
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
          {step === 8
            ? w("analyze")
            : step < STEPS
              ? t("continue")
              : data.verified
                ? t("publish")
                : t("review")}
        </button>
      </div>
    </div>
  );
}
