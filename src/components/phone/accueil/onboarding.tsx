"use client";

/* eslint-disable @next/next/no-img-element -- the person's own photo, already small */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { countrySections, foldPlace } from "@/lib/places";
import {
  phoneContracts,
  phoneSituations,
  phoneTastes,
  type PhoneContract,
  type PhoneSituation,
} from "@/lib/phone-onboarding";
import { finishWelcome, payWelcome } from "@/server/actions/welcome";
import {
  removePhotoStep,
  saveCapStep,
  saveNameStep,
  savePhotoStep,
  savePlaceStep,
  saveSituationStep,
  saveSkillsStep,
  type StepResult,
} from "@/server/actions/phone-onboarding";
import { LOGO_SVG, OrbiDisc, PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";

type Country = { code: string; name: string };

export type OnboardingData = {
  firstName: string;
  lastName: string;
  /** « Repris de votre compte Google » when the account was created with a provider. */
  provider: string | null;
  image: string | null;
  country: string;
  city: string;
  relocation: boolean;
  situation: PhoneSituation | null;
  cap: string;
  contracts: PhoneContract[];
  skills: string[];
  countries: Country[];
  /** The largest cities of each country, for the chips of step 3. */
  cities: Record<string, string[]>;
  /** Every skill of the reference, for the search of step 6. */
  allSkills: string[];
  /** The chips shown first at step 6. */
  firstSkills: string[];
  /** A plan chosen on /tarifs, to pay after the questions. */
  plan: boolean;
};

type Screen = "profil" | "notifs" | "pret";
const STEPS = 6;

/** Splits a « ; » list of the texts. */
const list = (text: string) =>
  text
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
const initials = (first: string, last: string) =>
  `${first.trim()[0] ?? ""}${last.trim()[0] ?? ""}`.toUpperCase();

/** A photo of the phone is often several megabytes: it is sent as a 720 px JPEG. */
export async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 720 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.86),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

/**
 * The details of the profile in six steps, then the notifications and « Profil prêt » (Modèle B,
 * planche Accueil, rangée 03). Each step is saved when the person goes on.
 */
export function PhoneOnboarding({ data }: { data: OnboardingData }) {
  const t = useTranslations("phoneAccueil");
  const [screen, setScreen] = useState<Screen>("profil");
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const scroller = useRef<HTMLDivElement>(null);

  const [firstName, setFirstName] = useState(data.firstName);
  const [lastName, setLastName] = useState(data.lastName);
  const [image, setImage] = useState(data.image);
  const [country, setCountry] = useState(data.country || "CD");
  const [city, setCity] = useState(data.city);
  const [freeCity, setFreeCity] = useState(false);
  const [relocation, setRelocation] = useState(data.relocation);
  const [situation, setSituation] = useState<PhoneSituation | null>(data.situation);
  const [cap, setCap] = useState(data.cap);
  const [jobQuery, setJobQuery] = useState("");
  const [contracts, setContracts] = useState<PhoneContract[]>(data.contracts);
  const [skills, setSkills] = useState<string[]>(data.skills);
  const [skillQuery, setSkillQuery] = useState("");
  const [sheet, setSheet] = useState<"photo" | "pays" | "orbi" | null>(null);
  const [notifications, setNotifications] = useState<boolean | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<{ percent: number; offers: number }>({
    percent: 0,
    offers: 0,
  });

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [step, screen]);

  const cities = data.cities[country] ?? [];
  const ok = [
    firstName.trim() !== "" && lastName.trim() !== "",
    true,
    city.trim() !== "",
    situation !== null,
    cap.trim() !== "",
    skills.length >= 3,
  ][step - 1];
  const messages = [
    t("profile.name.error"),
    null,
    t("profile.place.error"),
    t("profile.situation.error"),
    t("profile.cap.error"),
    t("profile.skills.error"),
  ];

  const save = (action: () => Promise<StepResult>, then: (done: StepResult) => void) =>
    start(async () => {
      const done = await action();
      if (!done.ok) {
        setError(messages[step - 1] ?? t("profile.name.error"));
        return;
      }
      then(done);
    });

  const next = () => {
    if (!ok) {
      setError(messages[step - 1]);
      return;
    }
    setError(null);
    const advance = () => setStep(step + 1);
    switch (step) {
      case 1:
        return save(() => saveNameStep({ firstName, lastName }), advance);
      case 2:
        return advance();
      case 3:
        return save(() => savePlaceStep({ country, city, relocation }), advance);
      case 4:
        return save(() => saveSituationStep(situation ?? ""), advance);
      case 5:
        return save(() => saveCapStep({ cap, contracts }), advance);
      default:
        return save(
          () => saveSkillsStep(skills),
          (done) => {
            if (done.ok) setResult({ percent: done.percent ?? 0, offers: done.offers ?? 0 });
            setScreen("notifs");
          },
        );
    }
  };

  const back = () => {
    setError(null);
    if (screen === "notifs") return setScreen("profil");
    if (step > 1) setStep(step - 1);
  };

  const pickPhoto = (file: File | undefined) => {
    setSheet(null);
    if (!file) return;
    start(async () => {
      const form = new FormData();
      form.set("photo", await shrink(file), "photo.jpg");
      const done = await savePhotoStep(form);
      if (!done.ok) {
        setError(
          done.error === "size" ? t("profile.photo.errorSize") : t("profile.photo.errorType"),
        );
        return;
      }
      setError(null);
      setImage(done.image ?? null);
    });
  };

  if (screen === "notifs") {
    return (
      <Notifications
        onDone={(enabled) => {
          setNotifications(enabled);
          setScreen("pret");
        }}
        notice={notice}
        setNotice={setNotice}
      />
    );
  }

  if (screen === "pret") {
    return (
      <Ready
        name={firstName}
        initials={initials(firstName, lastName)}
        image={image}
        cap={cap}
        city={city}
        skills={skills}
        percent={result.percent}
        offers={result.offers}
        notifications={notifications}
        plan={data.plan}
        onEdit={() => {
          setStep(1);
          setScreen("profil");
        }}
      />
    );
  }

  const photoInput = (capture: boolean) => (
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      {...(capture && { capture: "user" as const })}
      className="sr-only"
      tabIndex={-1}
      onChange={(event) => pickPhoto(event.target.files?.[0])}
    />
  );

  return (
    <div className="nb-page nb-ecran nb-profil" data-ecran="">
      <div className="nb-barreh nb-profil-tete">
        {step > 1 ? (
          <button
            type="button"
            className="nb-retour"
            aria-label={t("profile.previous")}
            data-retour=""
            onClick={back}
          >
            <PhoneIcon name="retour" size={22} stroke={2} />
          </button>
        ) : (
          <span className="nb-retour" aria-hidden />
        )}
        <div
          className="nb-barres"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS}
          aria-valuenow={step}
          aria-label={t("profile.step", { n: step })}
        >
          {Array.from({ length: STEPS }, (_, index) => (
            <span key={index} data-fait={index < step ? "" : undefined} />
          ))}
        </div>
        {step === 2 && !image ? (
          <button type="button" className="nb-passer" onClick={() => setStep(3)}>
            {t("profile.skip")}
          </button>
        ) : null}
      </div>
      <div className="nb-profil-corps" ref={scroller}>
        <p className="nb-meta">{t("profile.step", { n: step })}</p>

        {step === 1 ? (
          <div className="nb-entre" key="e1">
            <h1 className="nb-h1">{t("profile.name.title")}</h1>
            <p className="nb-sous">{t("profile.name.text")}</p>
            {data.provider ? (
              <p className="nb-repris">{t("profile.name.from", { provider: data.provider })}</p>
            ) : null}
            <label className="nb-lab" htmlFor="profil-prenom">
              {t("profile.name.first")}
            </label>
            <input
              id="profil-prenom"
              className="nb-in"
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value);
                setError(null);
              }}
              autoComplete="given-name"
              placeholder={t("profile.name.firstPlaceholder")}
              maxLength={80}
            />
            <label className="nb-lab" htmlFor="profil-nom">
              {t("profile.name.last")}
            </label>
            <input
              id="profil-nom"
              className="nb-in"
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value);
                setError(null);
              }}
              autoComplete="family-name"
              placeholder={t("profile.name.lastPlaceholder")}
              maxLength={80}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="nb-entre" key="e2">
            <h1 className="nb-h1">{t("profile.photo.title")}</h1>
            <p className="nb-sous">{t("profile.photo.text")}</p>
            <div className="nb-photo-zone">
              <button
                type="button"
                className="nb-photo"
                data-vide={image ? undefined : ""}
                aria-label={image ? t("profile.photo.changeAria") : t("profile.photo.addAria")}
                onClick={() => setSheet("photo")}
              >
                {image ? (
                  <img src={image} alt={t("profile.photo.alt")} />
                ) : (
                  <>
                    <span className="nb-photo-ini">{initials(firstName, lastName)}</span>
                    <span className="nb-photo-aj">{t("profile.photo.add")}</span>
                  </>
                )}
              </button>
            </div>
            {image ? (
              <>
                <div className="nb-orbi-note">
                  <OrbiDisc size={28} />
                  <span>{t("profile.photo.saved")}</span>
                </div>
                <div className="nb-duo">
                  <button type="button" className="nb-bs" onClick={() => setSheet("photo")}>
                    {t("profile.photo.change")}
                  </button>
                  <button
                    type="button"
                    className="nb-bs"
                    data-corail=""
                    onClick={() =>
                      start(async () => {
                        const done = await removePhotoStep();
                        if (done.ok) setImage(null);
                      })
                    }
                  >
                    {t("profile.photo.remove")}
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="nb-bs nb-photo-choisir"
                onClick={() => setSheet("photo")}
              >
                {t("profile.photo.pick")}
              </button>
            )}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="nb-entre" key="e3">
            <h1 className="nb-h1">{t("profile.place.title")}</h1>
            <p className="nb-sous">{t("profile.place.text")}</p>
            <span className="nb-lab" id="profil-pays-l">
              {t("profile.place.country")}
            </span>
            <button
              type="button"
              className="nb-in nb-pays"
              aria-labelledby="profil-pays-l profil-pays-v"
              aria-haspopup="dialog"
              onClick={() => setSheet("pays")}
            >
              <Flag code={country} />
              <span id="profil-pays-v">
                {data.countries.find((item) => item.code === country)?.name ?? country}
              </span>
              <PhoneIcon name="bas" size={18} />
            </button>
            <span className="nb-lab">{t("profile.place.city")}</span>
            <div className="nb-chips" role="group" aria-label={t("profile.place.city")}>
              {cities.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="nb-chip-c"
                  aria-pressed={city === name && !freeCity}
                  onClick={() => {
                    setCity(name);
                    setFreeCity(false);
                    setError(null);
                  }}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                className="nb-chip-c"
                data-pointille=""
                aria-pressed={freeCity}
                onClick={() => {
                  setFreeCity(true);
                  setCity("");
                }}
              >
                {t("profile.place.otherCity")}
              </button>
            </div>
            {freeCity ? (
              <input
                className="nb-in nb-ville"
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  setError(null);
                }}
                aria-label={t("profile.place.cityInput")}
                placeholder={t("profile.place.cityPlaceholder")}
                autoComplete="address-level2"
                maxLength={120}
                autoFocus
              />
            ) : null}
            <div className="nb-bascule">
              <span>
                <b id="profil-bouger">{t("profile.place.move")}</b>
                <span className="nb-meta">{t("profile.place.moveHint")}</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={relocation}
                aria-labelledby="profil-bouger"
                className="nb-switch"
                onClick={() => setRelocation(!relocation)}
              >
                <span />
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="nb-entre" key="e4">
            <h1 className="nb-h1">{t("profile.situation.title")}</h1>
            <p className="nb-sous">{t("profile.situation.text")}</p>
            <div className="nb-choix" role="radiogroup" aria-label={t("profile.situation.title")}>
              {phoneSituations.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={situation === key}
                  className="nb-choix-l"
                  onClick={() => {
                    setSituation(key);
                    setError(null);
                  }}
                >
                  <span>
                    <b>{t(`profile.situation.${key}.title`)}</b>
                    <span className="nb-meta">{t(`profile.situation.${key}.text`)}</span>
                  </span>
                  <span className="nb-radio" aria-hidden>
                    {situation === key ? <PhoneIcon name="coche" size={12} strong /> : null}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="nb-entre" key="e5">
            <h1 className="nb-h1">{t("profile.cap.title")}</h1>
            <p className="nb-sous">{t("profile.cap.text")}</p>
            {cap ? (
              <div className="nb-cap">
                <span className="nb-cap-ic" aria-hidden>
                  <PhoneIcon name="explorer" size={22} />
                </span>
                <span>
                  <span className="nb-meta">{t("profile.cap.yours")}</span>
                  <b>{cap}</b>
                </span>
                <button type="button" className="nb-lien" data-creme="" onClick={() => setCap("")}>
                  {t("profile.cap.change")}
                </button>
              </div>
            ) : (
              <CapSearch
                query={jobQuery}
                setQuery={setJobQuery}
                situation={situation ?? "graduate"}
                onPick={(job) => {
                  setCap(job);
                  setJobQuery("");
                  setError(null);
                }}
                onOrbi={() => setSheet("orbi")}
              />
            )}
            <span className="nb-lab">{t("profile.cap.contracts")}</span>
            <div className="nb-chips" role="group" aria-label={t("profile.cap.contracts")}>
              {phoneContracts.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="nb-chip-c"
                  aria-pressed={contracts.includes(key)}
                  onClick={() =>
                    setContracts(
                      contracts.includes(key)
                        ? contracts.filter((item) => item !== key)
                        : [...contracts, key],
                    )
                  }
                >
                  {t(`profile.cap.contract.${key}`)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="nb-entre" key="e6">
            <h1 className="nb-h1">{t("profile.skills.title")}</h1>
            <p className="nb-sous">{t("profile.skills.text")}</p>
            <Link href="/app/profil/import" className="nb-orbi-carte">
              <OrbiDisc size={32} />
              <span>
                <b>{t("profile.skills.import")}</b>
                <span>{t("profile.skills.importHint")}</span>
              </span>
              <PhoneIcon name="chevron" size={18} />
            </Link>
            <label className="nb-recherche nb-recherche-champ">
              <PhoneIcon name="recherche" size={20} />
              <input
                value={skillQuery}
                onChange={(event) => setSkillQuery(event.target.value)}
                aria-label={t("profile.skills.search")}
                placeholder={t("profile.skills.searchPlaceholder")}
                enterKeyHint="search"
              />
            </label>
            <p className="nb-compte" data-assez={skills.length >= 3 ? "" : undefined}>
              {t("profile.skills.count", { count: skills.length })}
            </p>
            <SkillChips
              all={data.allSkills}
              first={data.firstSkills}
              selected={skills}
              query={skillQuery}
              onToggle={(name) => {
                setError(null);
                setSkills(
                  skills.includes(name)
                    ? skills.filter((item) => item !== name)
                    : [...skills, name],
                );
              }}
              empty={t("profile.skills.none", { query: skillQuery.trim() })}
            />
          </div>
        ) : null}
      </div>
      <div className="nb-bas">
        {error ? (
          <p className="nb-erreur" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="nb-bp"
          data-attente={ok ? undefined : ""}
          aria-disabled={pending || undefined}
          onClick={() => {
            if (!pending) next();
          }}
        >
          {pending ? t("profile.saving") : step === STEPS ? t("profile.finish") : t("profile.next")}
        </button>
      </div>

      <PhoneSheet
        open={sheet === "photo"}
        onClose={() => setSheet(null)}
        label={t("profile.photo.sheet")}
        closeLabel={t("close")}
      >
        <h2>{t("profile.photo.sheet")}</h2>
        <label className="nb-opt">
          <span>
            {t("profile.photo.camera")}
            <small>{t("profile.photo.cameraHint")}</small>
          </span>
          {photoInput(true)}
        </label>
        <label className="nb-opt">
          <span>
            {t("profile.photo.gallery")}
            <small>{t("profile.photo.galleryHint")}</small>
          </span>
          {photoInput(false)}
        </label>
        <button type="button" className="nb-annuler" onClick={() => setSheet(null)}>
          {t("profile.photo.cancel")}
        </button>
      </PhoneSheet>

      <CountrySheet
        open={sheet === "pays"}
        onClose={() => setSheet(null)}
        countries={data.countries}
        selected={country}
        onPick={(code) => {
          setCountry(code);
          setCity("");
          setFreeCity((data.cities[code] ?? []).length === 0);
          setSheet(null);
        }}
      />

      <CapOrbiSheet
        open={sheet === "orbi"}
        onClose={() => setSheet(null)}
        onPick={(job) => {
          setCap(job);
          setError(null);
          setSheet(null);
        }}
      />
    </div>
  );
}

export function Flag({ code }: { code: string }) {
  return (
    <img
      src={`/drapeaux/${code.toLowerCase()}.svg`}
      alt=""
      width={30}
      height={21}
      className="nb-drapeau"
      loading="lazy"
    />
  );
}

/** Step 5 without a Cap: the search of a trade, suggestions for the situation, or Orbi. */
function CapSearch({
  query,
  setQuery,
  situation,
  onPick,
  onOrbi,
}: {
  query: string;
  setQuery: (value: string) => void;
  situation: PhoneSituation;
  onPick: (job: string) => void;
  onOrbi: () => void;
}) {
  const t = useTranslations("phoneAccueil");
  const jobs = list(t("profile.cap.jobs"));
  const folded = foldPlace(query);
  const found = folded ? jobs.filter((job) => foldPlace(job).includes(folded)) : [];
  return (
    <div>
      <label className="nb-recherche nb-recherche-champ">
        <PhoneIcon name="recherche" size={20} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t("profile.cap.search")}
          placeholder={t("profile.cap.search")}
          enterKeyHint="search"
          maxLength={120}
        />
      </label>
      {!folded ? (
        <>
          <p className="nb-meta nb-sugg">{t("profile.cap.suggestions")}</p>
          {list(t(`profile.cap.suggest.${situation}`)).map((job) => (
            <button key={job} type="button" className="nb-ligne-choix" onClick={() => onPick(job)}>
              <span>{job}</span>
              <span className="nb-choisir">{t("profile.cap.pick")}</span>
            </button>
          ))}
          <button type="button" className="nb-orbi-carte" onClick={onOrbi} data-orbi="">
            <OrbiDisc size={32} />
            <span>
              <b>{t("profile.cap.unsure")}</b>
              <span>{t("profile.cap.unsureHint")}</span>
            </span>
          </button>
        </>
      ) : (
        <div className="nb-resultats">
          {found.map((job) => (
            <button key={job} type="button" className="nb-ligne-choix" onClick={() => onPick(job)}>
              <span>{job}</span>
              <span className="nb-choisir">{t("profile.cap.pick")}</span>
            </button>
          ))}
          {found.length === 0 && query.trim().length >= 2 ? (
            <button type="button" className="nb-ligne-choix" onClick={() => onPick(query.trim())}>
              <span>{t("profile.cap.keep", { query: query.trim() })}</span>
              <span className="nb-choisir">{t("profile.cap.pick")}</span>
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** « Trouvons votre Cap »: Orbi proposes three trades after one question; the person chooses. */
function CapOrbiSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (job: string) => void;
}) {
  const t = useTranslations("phoneAccueil");
  const [taste, setTaste] = useState<(typeof phoneTastes)[number] | null>(null);
  return (
    <PhoneSheet
      open={open}
      onClose={() => {
        setTaste(null);
        onClose();
      }}
      label={t("profile.orbi.title")}
      closeLabel={t("close")}
    >
      <div className="nb-orbi-tete">
        {taste ? (
          <button
            type="button"
            className="nb-retour"
            aria-label={t("profile.orbi.back")}
            data-retour=""
            onClick={() => setTaste(null)}
          >
            <PhoneIcon name="retour" size={20} stroke={2} />
          </button>
        ) : null}
        <OrbiDisc size={42} />
        <span className="nb-orbi-titre">
          <b>{t("profile.orbi.title")}</b>
          <span className="nb-meta">{t("profile.orbi.from")}</span>
        </span>
        <button
          type="button"
          className="nb-rond nb-fermer"
          aria-label={t("close")}
          onClick={() => {
            setTaste(null);
            onClose();
          }}
        >
          <PhoneIcon name="fermer" size={20} />
        </button>
      </div>
      {taste ? (
        <div className="nb-orbi-rep" aria-live="polite">
          <p className="nb-meta">{t(`profile.orbi.${taste}`)}</p>
          <p className="nb-orbi-texte">{t(`profile.orbi.${taste}Answer`)}</p>
          <div className="nb-orbi-liste">
            {list(t(`profile.orbi.${taste}Jobs`)).map((job) => (
              <button
                key={job}
                type="button"
                className="nb-q nb-q-choix"
                onClick={() => {
                  setTaste(null);
                  onPick(job);
                }}
              >
                <span>{job}</span>
                <span className="nb-choisir">{t("profile.cap.pick")}</span>
              </button>
            ))}
          </div>
          <p className="nb-meta nb-orbi-decide">{t("profile.orbi.decide")}</p>
        </div>
      ) : (
        <div className="nb-orbi-rep">
          <p className="nb-orbi-texte">{t("profile.orbi.question")}</p>
          <div className="nb-orbi-liste">
            {phoneTastes.map((key) => (
              <button key={key} type="button" className="nb-q" onClick={() => setTaste(key)}>
                {t(`profile.orbi.${key}`)}
              </button>
            ))}
          </div>
        </div>
      )}
    </PhoneSheet>
  );
}

/** « Votre pays »: search, the regions in order, a check on the country chosen. */
function CountrySheet({
  open,
  onClose,
  countries,
  selected,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  countries: Country[];
  selected: string;
  onPick: (code: string) => void;
}) {
  const t = useTranslations("phoneAccueil");
  const [query, setQuery] = useState("");
  const folded = foldPlace(query);
  const sections = useMemo(() => countrySections(countries), [countries]);
  const found = folded
    ? countries.filter((country) => foldPlace(country.name).includes(folded))
    : null;
  const row = (country: Country) => (
    <button
      key={country.code}
      type="button"
      className="nb-opt nb-opt-pays"
      aria-pressed={country.code === selected}
      onClick={() => {
        setQuery("");
        onPick(country.code);
      }}
    >
      <Flag code={country.code} />
      <span>{country.name}</span>
      {country.code === selected ? <PhoneIcon name="coche" size={18} strong /> : null}
    </button>
  );
  return (
    <PhoneSheet
      open={open}
      onClose={() => {
        setQuery("");
        onClose();
      }}
      label={t("profile.place.sheet")}
      closeLabel={t("close")}
      className="nb-feuille-haute"
    >
      <div className="nb-feuille-titre">
        <h2>{t("profile.place.sheet")}</h2>
        <button
          type="button"
          className="nb-rond nb-fermer"
          aria-label={t("close")}
          onClick={() => {
            setQuery("");
            onClose();
          }}
        >
          <PhoneIcon name="fermer" size={20} />
        </button>
      </div>
      <label className="nb-recherche nb-recherche-champ" data-nuit="">
        <PhoneIcon name="recherche" size={20} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t("profile.place.search")}
          placeholder={t("profile.place.search")}
        />
      </label>
      <div className="nb-pays-liste">
        {found ? (
          found.length > 0 ? (
            found.map(row)
          ) : (
            <p className="nb-vide">{t("profile.place.none", { query: query.trim() })}</p>
          )
        ) : (
          sections.map((section) => (
            <section key={section.key} aria-label={t(`profile.place.zone.${section.key}`)}>
              <p className="nb-meta nb-zone">{t(`profile.place.zone.${section.key}`)}</p>
              {section.countries.map(row)}
            </section>
          ))
        )}
      </div>
    </PhoneSheet>
  );
}

/** Step 6: the chips of the reference, those chosen first, then those found by the search. */
function SkillChips({
  all,
  first,
  selected,
  query,
  onToggle,
  empty,
}: {
  all: string[];
  first: string[];
  selected: string[];
  query: string;
  onToggle: (name: string) => void;
  empty: string;
}) {
  const folded = foldPlace(query);
  const shown = folded
    ? all.filter((name) => foldPlace(name).includes(folded)).slice(0, 24)
    : [...new Set([...selected, ...first])];
  if (folded && shown.length === 0) return <p className="nb-vide">{empty}</p>;
  return (
    <div className="nb-chips">
      {shown.map((name) => {
        const on = selected.includes(name);
        return (
          <button
            key={name}
            type="button"
            className="nb-chip-c"
            data-lime=""
            aria-pressed={on}
            onClick={() => onToggle(name)}
          >
            {on ? <PhoneIcon name="coche" size={14} strong /> : null}
            {name}
          </button>
        );
      })}
    </div>
  );
}

/** « Ne ratez aucune offre pour vous »: the phone's own permission, asked on a touch only. */
function Notifications({
  onDone,
  notice,
  setNotice,
}: {
  onDone: (enabled: boolean) => void;
  notice: string | null;
  setNotice: (text: string | null) => void;
}) {
  const t = useTranslations("phoneAccueil");
  const tb = useTranslations("common");
  return (
    <div className="nb-page nb-ecran nb-notifs" data-ecran="">
      <div className="nb-notifs-exemples" aria-hidden>
        {[
          { text: t("notifications.example1"), when: t("notifications.now") },
          { text: t("notifications.example2"), when: t("notifications.yesterday") },
        ].map((item, index) => (
          <div key={item.text} className="nb-notif-ex" data-second={index === 1 ? "" : undefined}>
            <span className="nb-notif-logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
            <span>
              <span className="nb-notif-l">
                <b>{tb("brand")}</b>
                <span className="nb-meta">{item.when}</span>
              </span>
              <span className="nb-notif-t">{item.text}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="nb-notifs-texte">
        <h1 className="nb-h1">{t("notifications.title")}</h1>
        <p className="nb-sous">{t("notifications.text")}</p>
        {notice ? (
          <p className="nb-meta nb-aide" role="status">
            {notice}
          </p>
        ) : null}
      </div>
      <div className="nb-bas-fixe">
        <button
          type="button"
          className="nb-bp"
          onClick={async () => {
            if (typeof Notification === "undefined") {
              setNotice(t("notifications.denied"));
              onDone(false);
              return;
            }
            const answer = await Notification.requestPermission().catch(() => "denied");
            onDone(answer === "granted");
          }}
        >
          {t("notifications.enable")}
        </button>
        <button type="button" className="nb-bs" onClick={() => onDone(false)}>
          {t("notifications.later")}
        </button>
      </div>
    </div>
  );
}

/** « Profil prêt » (planche Accueil): the ring, the Cap and the city, then where to start. */
function Ready({
  name,
  initials: letters,
  image,
  cap,
  city,
  skills,
  percent,
  offers,
  notifications,
  plan,
  onEdit,
}: {
  name: string;
  initials: string;
  image: string | null;
  cap: string;
  city: string;
  skills: string[];
  percent: number;
  offers: number;
  notifications: boolean | null;
  plan: boolean;
  onEdit: () => void;
}) {
  const t = useTranslations("phoneAccueil");
  const circumference = 2 * Math.PI * 34;
  const [before = "", after = ""] = t("ready.orbi", { city: "\u0000" }).split("\u0000");
  return (
    <div className="nb-page nb-ecran nb-pret" data-ecran="">
      <div className="nb-pret-corps">
        <span className="nb-halo" aria-hidden />
        <div className="nb-pret-tete">
          <span className="nb-anneau" aria-hidden>
            <svg viewBox="0 0 76 76" width="124" height="124">
              <circle cx="38" cy="38" r="34" className="nb-anneau-fond" />
              <circle
                cx="38"
                cy="38"
                r="34"
                className="nb-anneau-plein"
                strokeDasharray={`${(circumference * percent) / 100} ${circumference}`}
              />
            </svg>
            {image ? <img src={image} alt="" /> : <span>{letters}</span>}
          </span>
          <h1 className="nb-h1">{name ? t("ready.title", { name }) : t("ready.titleAnon")}</h1>
          <p className="nb-sous">{[cap, city].filter(Boolean).join(" · ")}</p>
          <div className="nb-tags">
            {skills.slice(0, 4).map((skill) => (
              <span key={skill} className="nb-tag">
                {skill}
              </span>
            ))}
          </div>
        </div>
        {offers > 0 ? (
          <div className="nb-orbi-note nb-pret-orbi">
            <OrbiDisc size={32} />
            <span>
              {city ? (
                <>
                  {before}
                  {city}
                  {after}
                </>
              ) : (
                t("ready.orbiNoCity")
              )}{" "}
              <Link href="/app/jobs">{t("ready.orbiLink")}</Link>
            </span>
          </div>
        ) : null}
        <p className="nb-meta nb-pret-sec">{t("ready.start")}</p>
        <div className="nb-pret-liens">
          {plan ? (
            <form action={payWelcome}>
              <button type="submit" className="nb-ligne-lien">
                <span>
                  <b>{t("ready.plan")}</b>
                </span>
                <PhoneIcon name="chevron" size={18} />
              </button>
            </form>
          ) : null}
          <Link href="/app/career/cv" className="nb-ligne-lien">
            <span>
              <b>{t("ready.profile")}</b>
              <span className="nb-meta">{t("ready.profileHint")}</span>
            </span>
            <PhoneIcon name="chevron" size={18} />
          </Link>
          <Link href="/app/learn" className="nb-ligne-lien">
            <span>
              <b>{t("ready.course")}</b>
              <span className="nb-meta">{t("ready.courseHint")}</span>
            </span>
            <PhoneIcon name="chevron" size={18} />
          </Link>
          <Link href="/app/jobs" className="nb-ligne-lien">
            <span>
              <b>{t("ready.offers")}</b>
              <span className="nb-meta">{t("ready.offersHint")}</span>
            </span>
            <PhoneIcon name="chevron" size={18} />
          </Link>
          <button type="button" className="nb-ligne-lien" data-dernier="" onClick={onEdit}>
            <span>
              <b>{t("ready.edit")}</b>
              <span className="nb-meta">
                {notifications === false ? t("ready.notifOff") : t("ready.notifOn")}
              </span>
            </span>
            <PhoneIcon name="chevron" size={18} />
          </button>
        </div>
      </div>
      <form action={finishWelcome} className="nb-bas">
        <button type="submit" className="nb-bp">
          {t("ready.enter")}
        </button>
      </form>
    </div>
  );
}
