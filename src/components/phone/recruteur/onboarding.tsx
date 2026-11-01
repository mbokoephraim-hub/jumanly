"use client";

/* eslint-disable @next/next/no-img-element -- the person's own photo and small logos */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { countrySections, foldPlace } from "@/lib/places";
import { removePhotoStep, saveNameStep, savePhotoStep } from "@/server/actions/phone-onboarding";
import {
  rhBecomeIndependent,
  rhCancelRequest,
  rhCreateCompany,
  rhEnter,
  rhFinish,
  rhRequestCompany,
  rhSaveContacts,
  rhSavePlace,
  rhSaveRecruits,
  rhSaveRole,
  rhSearchCompanies,
} from "@/server/actions/phone-rh-onboarding";
import type { CompanyCard, CompanyState } from "@/server/services/recruiter-onboarding";
import { Flag, shrink } from "../accueil/onboarding";
import { LOGO_SVG, OrbiDisc, PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";

type Country = { code: string; name: string; dial: string | null };
type Kind = "charge" | "rh" | "manager" | "dirigeant" | "cabinet" | "independant";
type Audience = "nobody" | "interview" | "connections";
type Hires = "few" | "some" | "many";

const KINDS: { key: Kind; icon: string }[] = [
  {
    key: "charge",
    icon: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.3M21.5 20a6.5 6.5 0 0 0-3.8-5.9",
  },
  { key: "rh", icon: "M4 20V9l8-5 8 5v11M9 20v-6h6v6" },
  {
    key: "manager",
    icon: "M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z",
  },
  { key: "dirigeant", icon: "M4 19h16M6 19V9l6-4 6 4v10M10 19v-5h4v5" },
  {
    key: "cabinet",
    icon: "M3.5 8.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7",
  },
  { key: "independant", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0" },
];
const AUDIENCES: Audience[] = ["nobody", "interview", "connections"];
const HIRES: Hires[] = ["few", "some", "many"];
const SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;
const SIZE_KEY = { "1-10": "s1", "11-50": "s2", "51-200": "s3", "201-1000": "s4", "1000+": "s5" };
const STEPS = 7;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FREE_MAIL =
  /@(gmail|googlemail|yahoo|ymail|outlook|hotmail|live|msn|icloud|me|aol|proton|protonmail)\./i;

export type RhOnboardingData = {
  firstName: string;
  lastName: string;
  provider: string | null;
  image: string | null;
  country: string;
  city: string;
  otherCities: string[];
  countries: Country[];
  cities: Record<string, string[]>;
  workEmail: string;
  phone: string;
  phoneCountry: string;
  whatsapp: boolean;
  linkedin: string;
  contactsFor: Audience;
  kind: Kind | null;
  jobTitle: string;
  company: CompanyState;
  near: CompanyCard[];
  domains: string[];
  levels: string[];
  hiresPerYear: Hires | null;
  headline: string;
  hiringNow: boolean;
  /** Back from « Rattachement accepté » or a finished profile: « Profil prêt » first. */
  ready: boolean;
};

const list = (text: string) =>
  text
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const toggle = <T,>(items: T[], item: T) =>
  items.includes(item) ? items.filter((value) => value !== item) : [...items, item];

/**
 * The recruiter's profile in seven steps, then the notifications and « Profil prêt » (Modèle B
 * recruteur, planches 014 à 030). Each step is saved when the person goes on; the company of
 * step 5 is saved at once (request, page, independent), since the administrators are told.
 */
export function PhoneRecruiterOnboarding({ data }: { data: RhOnboardingData }) {
  const t = useTranslations("phoneRhOnboarding");
  const [screen, setScreen] = useState<"profil" | "notifs" | "pret">(
    data.ready ? "pret" : "profil",
  );
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const scroller = useRef<HTMLDivElement>(null);

  const [firstName, setFirstName] = useState(data.firstName);
  const [lastName, setLastName] = useState(data.lastName);
  const [image, setImage] = useState(data.image);
  const [country, setCountry] = useState(data.country || "CD");
  const [city, setCity] = useState(data.city);
  const [freeCity, setFreeCity] = useState(
    Boolean(data.city) && !(data.cities[data.country] ?? []).includes(data.city),
  );
  const [otherCities, setOtherCities] = useState<string[]>(data.otherCities);
  const [workEmail, setWorkEmail] = useState(data.workEmail);
  const [phone, setPhone] = useState(data.phone);
  const [phoneCountry, setPhoneCountry] = useState(data.phoneCountry || data.country || "CD");
  const [whatsapp, setWhatsapp] = useState(data.whatsapp);
  const [linkedin, setLinkedin] = useState(data.linkedin);
  const [contactsFor, setContactsFor] = useState<Audience>(data.contactsFor);
  const [kind, setKind] = useState<Kind | null>(data.kind);
  const [jobTitle, setJobTitle] = useState(data.jobTitle);
  const [company, setCompany] = useState<CompanyState>(data.company);
  const [chosen, setChosen] = useState<CompanyCard | null>(null);
  const [domains, setDomains] = useState<string[]>(data.domains);
  const [levels, setLevels] = useState<string[]>(data.levels);
  const [hires, setHires] = useState<Hires | null>(data.hiresPerYear);
  const [headline, setHeadline] = useState(data.headline);
  const [hiringNow, setHiringNow] = useState(data.hiringNow);
  const [notifications, setNotifications] = useState<boolean | null>(null);
  const [sheet, setSheet] = useState<
    "photo" | "pays" | "indicatif" | "rejoindre" | "creer" | "orbi" | null
  >(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [step, screen]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const countryName = (code: string) =>
    data.countries.find((item) => item.code === code)?.name ?? code;
  const dial = data.countries.find((item) => item.code === phoneCountry)?.dial ?? "";
  const cities = data.cities[country] ?? [];
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneOk = phoneDigits.length === 0 || phoneDigits.length >= 8;
  const workOk = EMAIL.test(workEmail.trim());
  const domain = workOk ? workEmail.trim().split("@")[1]!.toLowerCase() : "";
  const companyCard =
    company.state === "none" || company.state === "independent" ? null : company.card;
  const companyName =
    companyCard?.name ?? (company.state === "independent" ? t("profile.independent") : "");
  const and = (items: string[]) =>
    items.length <= 1
      ? (items[0] ?? "")
      : t("profile.and", { a: items.slice(0, -1).join(", "), b: items[items.length - 1]! });
  const domainText = and(domains.slice(0, 2).map((item) => item.toLowerCase()));
  const what = domains.length
    ? t("profile.autoDomains", { domains: domainText })
    : t("profile.autoTalents");
  const autoHeadline = companyCard
    ? t("profile.autoFor", { what, org: companyCard.name })
    : t("profile.auto", { what });

  const ok = [
    firstName.trim() !== "" && lastName.trim() !== "",
    city.trim() !== "",
    workOk && phoneOk,
    kind !== null && jobTitle.trim().length >= 2,
    company.state !== "none",
    domains.length >= 1,
    true,
  ][step - 1];
  const messages = [
    t("you.error"),
    t("place.error"),
    !workOk ? t("contacts.errorEmail") : t("contacts.errorPhone"),
    t("role.error"),
    chosen ? t("company.errorSend") : t("company.errorChoose"),
    t("recruits.error"),
    t("failed"),
  ];

  const run = (action: () => Promise<{ ok: boolean }>, then: () => void) =>
    start(async () => {
      try {
        const done = await action();
        if (!done.ok) {
          setError(messages[step - 1] ?? t("failed"));
          return;
        }
        setError(null);
        then();
      } catch {
        setError(t("failed"));
      }
    });

  const next = () => {
    if (!ok) {
      setError(messages[step - 1] ?? null);
      return;
    }
    setError(null);
    const advance = () => setStep(step + 1);
    switch (step) {
      case 1:
        return run(() => saveNameStep({ firstName, lastName }), advance);
      case 2:
        return run(() => rhSavePlace({ country, city, otherCities }), advance);
      case 3:
        return run(
          () => rhSaveContacts({ workEmail, phone, phoneCountry, whatsapp, linkedin, contactsFor }),
          advance,
        );
      case 4:
        return run(() => rhSaveRole({ kind: kind!, jobTitle }), advance);
      case 5:
        return advance();
      case 6:
        return run(() => rhSaveRecruits({ domains, levels, hiresPerYear: hires }), advance);
      default: {
        const text = headline.trim() || autoHeadline;
        if (!headline.trim()) setHeadline(text);
        return run(
          () => rhFinish({ headline: text, hiringNow }),
          () => setScreen("notifs"),
        );
      }
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
      if (!done.ok) return;
      setImage(done.image ?? null);
    });
  };

  const percent =
    30 +
    (image ? 10 : 0) +
    (workOk ? 10 : 0) +
    (phoneDigits.length >= 8 ? 5 : 0) +
    (linkedin.trim() ? 5 : 0) +
    (company.state === "accepted" || company.state === "created"
      ? 15
      : company.state === "pending"
        ? 5
        : 0) +
    (domains.length ? 10 : 0) +
    (headline.trim() || autoHeadline ? 10 : 0);

  if (screen === "notifs")
    return (
      <Notifications
        onDone={(enabled) => {
          setNotifications(enabled);
          setScreen("pret");
        }}
      />
    );

  if (screen === "pret")
    return (
      <Ready
        name={firstName}
        image={image}
        initials={initials(`${firstName} ${lastName}`)}
        job={jobTitle}
        company={company}
        companyName={companyName}
        percent={percent}
        domains={domainText}
        notifications={notifications}
        onEdit={() => {
          setStep(1);
          setScreen("profil");
        }}
      />
    );

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

  const stepName = t(`steps.${step}` as "steps.1");

  return (
    <div className="nb-page nb-ecran nb-profil nb-rh-profil" data-ecran="">
      <div className="nb-barreh nb-profil-tete">
        {step > 1 ? (
          <button
            type="button"
            className="nb-retour"
            aria-label={t("previous")}
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
          aria-label={t("progress", { n: step })}
        >
          {Array.from({ length: STEPS }, (_, index) => (
            <span key={index} data-fait={index < step ? "" : undefined} />
          ))}
        </div>
      </div>
      <div className="nb-profil-corps" ref={scroller}>
        <p className="nb-meta">{t("step", { n: step, name: stepName })}</p>

        {step === 1 ? (
          <div className="nb-entre" key="e1">
            <div className="nb-rh-vous">
              <button
                type="button"
                className="nb-photo nb-rh-photo"
                data-vide={image ? undefined : ""}
                aria-label={image ? t("you.photoChange") : t("you.photoAdd")}
                onClick={() => setSheet("photo")}
              >
                {image ? (
                  <img src={image} alt="" />
                ) : (
                  <>
                    <span className="nb-photo-ini">{initials(`${firstName} ${lastName}`)}</span>
                    <span className="nb-photo-aj">{t("you.photo")}</span>
                  </>
                )}
              </button>
              <div>
                <h1 className="nb-h1">{t("you.title")}</h1>
                <p className="nb-sous">{t("you.text")}</p>
              </div>
            </div>
            {data.provider ? (
              <p className="nb-repris">{t("you.from", { provider: data.provider })}</p>
            ) : null}
            <div className="nb-rh-duo">
              <span>
                <label className="nb-lab" htmlFor="rh-prenom">
                  {t("you.first")}
                </label>
                <input
                  id="rh-prenom"
                  className="nb-in"
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                    setError(null);
                  }}
                  autoComplete="given-name"
                  maxLength={80}
                />
              </span>
              <span>
                <label className="nb-lab" htmlFor="rh-nom">
                  {t("you.last")}
                </label>
                <input
                  id="rh-nom"
                  className="nb-in"
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value);
                    setError(null);
                  }}
                  autoComplete="family-name"
                  maxLength={80}
                />
              </span>
            </div>
            {image ? (
              <div className="nb-orbi-note nb-rh-note">
                <OrbiDisc size={26} />
                <span>{t("you.saved")}</span>
                <button
                  type="button"
                  className="nb-lien"
                  data-corail=""
                  onClick={() =>
                    start(async () => {
                      const done = await removePhotoStep();
                      if (done.ok) setImage(null);
                    })
                  }
                >
                  {t("you.remove")}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="nb-entre" key="e2">
            <div className="nb-rh-pays">
              <img
                src={`/drapeaux/${country.toLowerCase()}.svg`}
                alt=""
                className="nb-rh-pays-drapeau"
              />
              <button
                type="button"
                className="nb-rh-pays-changer"
                aria-label={t("place.changeAria", { country: countryName(country) })}
                aria-haspopup="dialog"
                onClick={() => setSheet("pays")}
              >
                {t("place.change")}
              </button>
              <span className="nb-rh-pays-t">
                <span className="nb-meta">{t("place.based")}</span>
                <b>{countryName(country)}</b>
              </span>
            </div>
            <h2 className="nb-rh-h2">{t("place.city")}</h2>
            <div className="nb-chips" role="group" aria-label={t("place.city")}>
              {cities.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="nb-chip-c"
                  aria-pressed={city === name && !freeCity}
                  onClick={() => {
                    setCity(name);
                    setFreeCity(false);
                    setOtherCities(otherCities.filter((item) => item !== name));
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
                {t("place.otherCity")}
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
                aria-label={t("place.cityInput")}
                autoComplete="address-level2"
                maxLength={120}
                autoFocus
              />
            ) : null}
            {cities.filter((name) => name !== city).length > 0 ? (
              <>
                <p className="nb-meta nb-rh-sec">{t("place.also")}</p>
                <div className="nb-chips" role="group" aria-label={t("place.also")}>
                  {cities
                    .filter((name) => name !== city)
                    .map((name) => {
                      const on = otherCities.includes(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          className="nb-chip-c"
                          data-lime=""
                          aria-pressed={on}
                          onClick={() => setOtherCities(toggle(otherCities, name))}
                        >
                          <PhoneIcon name={on ? "coche" : "plus"} size={14} strong />
                          {name}
                        </button>
                      );
                    })}
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="nb-entre" key="e3">
            <h1 className="nb-h1">{t("contacts.title")}</h1>
            <p className="nb-sous">{t("contacts.text")}</p>
            <div className="nb-rh-ligne">
              <label className="nb-rh-champ-l" htmlFor="rh-email-pro">
                <PhoneIcon name="email" size={16} />
                {t("contacts.workEmail")}
              </label>
              <input
                id="rh-email-pro"
                className="nb-rh-champ-in"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={workEmail}
                placeholder={t("contacts.workEmailPlaceholder")}
                onChange={(event) => {
                  setWorkEmail(event.target.value);
                  setError(null);
                }}
                maxLength={200}
              />
              {workOk ? (
                <p
                  className="nb-rh-domaine"
                  data-perso={FREE_MAIL.test(workEmail) ? "" : undefined}
                >
                  {FREE_MAIL.test(workEmail)
                    ? t("contacts.personal")
                    : t("contacts.domain", { domain })}
                </p>
              ) : null}
            </div>
            <div className="nb-rh-ligne">
              <label className="nb-rh-champ-l" htmlFor="rh-tel">
                <PhoneIcon name="contact" size={16} />
                {t("contacts.phone")}
              </label>
              <div className="nb-rh-tel">
                <button
                  type="button"
                  className="nb-rh-indicatif"
                  aria-label={t("contacts.dialAria", {
                    code: dial,
                    country: countryName(phoneCountry),
                  })}
                  aria-haspopup="dialog"
                  onClick={() => setSheet("indicatif")}
                >
                  <Flag code={phoneCountry} />
                  <span>{dial}</span>
                  <PhoneIcon name="bas" size={14} />
                </button>
                <input
                  id="rh-tel"
                  className="nb-rh-champ-in"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value.replace(/[^\d ]/g, "").slice(0, 14));
                    setError(null);
                  }}
                  aria-invalid={!phoneOk || undefined}
                  aria-describedby={!phoneOk ? "rh-tel-err" : undefined}
                />
              </div>
              {!phoneOk ? (
                <p id="rh-tel-err" className="nb-erreur">
                  {t("contacts.phoneError")}
                </p>
              ) : null}
              {phoneDigits ? (
                <div className="nb-bascule nb-rh-wa">
                  <b id="rh-wa">{t("contacts.whatsapp")}</b>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={whatsapp}
                    aria-labelledby="rh-wa"
                    className="nb-switch"
                    onClick={() => setWhatsapp(!whatsapp)}
                  >
                    <span />
                  </button>
                </div>
              ) : null}
            </div>
            <div className="nb-rh-ligne">
              <label className="nb-rh-champ-l" htmlFor="rh-linkedin">
                <PhoneIcon name="lien" size={16} />
                {t("contacts.linkedin")}
              </label>
              <input
                id="rh-linkedin"
                className="nb-rh-champ-in"
                value={linkedin}
                placeholder={t("contacts.linkedinPlaceholder")}
                onChange={(event) => setLinkedin(event.target.value)}
                maxLength={200}
                autoComplete="url"
              />
            </div>
            <p className="nb-rh-question" id="rh-qui">
              {t("contacts.who")}
            </p>
            <div className="nb-choix" role="radiogroup" aria-labelledby="rh-qui">
              {AUDIENCES.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={contactsFor === key}
                  className="nb-choix-l nb-rh-radio"
                  onClick={() => setContactsFor(key)}
                >
                  <span className="nb-radio" aria-hidden>
                    {contactsFor === key ? <PhoneIcon name="coche" size={12} strong /> : null}
                  </span>
                  <span>
                    <b>{t(`contacts.${key}.title`)}</b>
                    <span className="nb-meta">{t(`contacts.${key}.text`)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="nb-entre" key="e4">
            <h1 className="nb-h1">{t("role.title")}</h1>
            <div className="nb-rh-roles" role="radiogroup" aria-label={t("role.title")}>
              {KINDS.map(({ key, icon }) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={kind === key}
                  className="nb-rh-role"
                  onClick={() => {
                    setKind(key);
                    if (!jobTitle.trim()) setJobTitle(list(t(`role.jobs.${key}`))[0] ?? "");
                    setError(null);
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d={icon} />
                  </svg>
                  <b>{t(`role.${key}.title`)}</b>
                  <span className="nb-meta">{t(`role.${key}.text`)}</span>
                </button>
              ))}
            </div>
            <label className="nb-lab" htmlFor="rh-poste">
              {t("role.job")}
            </label>
            <input
              id="rh-poste"
              className="nb-in"
              value={jobTitle}
              onChange={(event) => {
                setJobTitle(event.target.value);
                setError(null);
              }}
              maxLength={120}
            />
            {kind ? (
              <div className="nb-chips nb-rh-suggestions">
                {list(t(`role.jobs.${kind}`)).map((title) => (
                  <button
                    key={title}
                    type="button"
                    className="nb-chip-c"
                    aria-pressed={jobTitle === title}
                    onClick={() => setJobTitle(title)}
                  >
                    {title}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 5 ? (
          <CompanyStep
            key="e5"
            company={company}
            chosen={chosen}
            near={data.near}
            domain={FREE_MAIL.test(workEmail) ? "" : domain}
            pending={pending}
            onChoose={(card) => {
              setChosen(card);
              setError(null);
            }}
            onRequest={() => setSheet("rejoindre")}
            onCreate={() => setSheet("creer")}
            onIndependent={() =>
              start(async () => {
                setCompany(await rhBecomeIndependent());
                setChosen(null);
                setError(null);
              })
            }
            onReset={() =>
              start(async () => {
                setCompany(await rhCancelRequest());
                setChosen(null);
              })
            }
            onCancel={() =>
              start(async () => {
                setCompany(await rhCancelRequest());
                setToast(t("company.cancelled"));
              })
            }
          />
        ) : null}

        {step === 6 ? (
          <div className="nb-entre" key="e6">
            <h1 className="nb-h1">{t("recruits.title")}</h1>
            <p className="nb-sous">{t("recruits.text")}</p>
            <p className="nb-rh-compte" aria-live="polite">
              {t("recruits.count", { count: domains.length })}
            </p>
            <div className="nb-chips" role="group" aria-label={t("recruits.title")}>
              {list(t("recruits.domains")).map((name) => {
                const on = domains.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    className="nb-chip-c"
                    data-lime=""
                    aria-pressed={on}
                    onClick={() => {
                      setDomains(toggle(domains, name));
                      setError(null);
                    }}
                  >
                    <PhoneIcon name={on ? "coche" : "plus"} size={14} strong />
                    {name}
                  </button>
                );
              })}
            </div>
            <p className="nb-meta nb-rh-sec" id="rh-niveaux">
              {t("recruits.levels")}
            </p>
            <div className="nb-rh-segments" role="group" aria-labelledby="rh-niveaux">
              {list(t("recruits.levelList")).map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={levels.includes(name)}
                  onClick={() => setLevels(toggle(levels, name))}
                >
                  {name}
                </button>
              ))}
            </div>
            <p className="nb-meta nb-rh-sec" id="rh-volume">
              {t("recruits.hires")}
            </p>
            <div className="nb-rh-volumes" role="radiogroup" aria-labelledby="rh-volume">
              {HIRES.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={hires === key}
                  onClick={() => setHires(hires === key ? null : key)}
                >
                  {t(`recruits.hire.${key}`)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 7 ? (
          <div className="nb-entre" key="e7">
            <h1 className="nb-h1">{t("profile.title")}</h1>
            <p className="nb-sous">{t("profile.text")}</p>
            <div className="nb-rh-apercu">
              <div className="nb-rh-apercu-tete">
                <span className="nb-rh-apercu-photo">
                  {image ? (
                    <img src={image} alt="" />
                  ) : (
                    <span>{initials(`${firstName} ${lastName}`)}</span>
                  )}
                  <CompanyBadge company={company} />
                </span>
                <span>
                  <b>{`${firstName} ${lastName}`.trim()}</b>
                  <span className="nb-meta">
                    {[jobTitle, companyName].filter(Boolean).join(" · ")}
                  </span>
                  <span className="nb-meta">
                    {[city, countryName(country)].filter(Boolean).join(", ")}
                  </span>
                </span>
              </div>
              {hiringNow ? <span className="nb-rh-badge">{t("profile.hiringNow")}</span> : null}
              <p className="nb-rh-apercu-titre">{headline.trim() || autoHeadline}</p>
              <div className="nb-tags">
                {domains.map((name) => (
                  <span key={name} className="nb-tag">
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <label className="nb-lab" htmlFor="rh-accroche">
              {t("profile.headline")}
            </label>
            <input
              id="rh-accroche"
              className="nb-in"
              value={headline}
              placeholder={autoHeadline}
              onChange={(event) => setHeadline(event.target.value)}
              maxLength={160}
            />
            <button type="button" className="nb-rh-orbi-ligne" onClick={() => setSheet("orbi")}>
              <OrbiDisc size={26} />
              <span>{t("profile.orbi")}</span>
              <PhoneIcon name="chevron" size={18} />
            </button>
            <div className="nb-bascule nb-rh-bloc">
              <span>
                <b id="rh-badge">{t("profile.badge")}</b>
                <span className="nb-meta">{t("profile.badgeHint")}</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={hiringNow}
                aria-labelledby="rh-badge"
                className="nb-switch"
                onClick={() => setHiringNow(!hiringNow)}
              >
                <span />
              </button>
            </div>
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
          {pending ? t("saving") : step === STEPS ? t("finish") : t("next")}
        </button>
      </div>
      {toast ? (
        <p className="nb-rh-toast" role="status">
          {toast}
        </p>
      ) : null}

      <PhoneSheet
        open={sheet === "photo"}
        onClose={() => setSheet(null)}
        label={t("you.photo")}
        closeLabel={t("close")}
      >
        <PhotoSheetBody input={photoInput} onCancel={() => setSheet(null)} />
      </PhoneSheet>

      <CountrySheet
        open={sheet === "pays" || sheet === "indicatif"}
        dialMode={sheet === "indicatif"}
        onClose={() => setSheet(null)}
        countries={data.countries}
        selected={sheet === "indicatif" ? phoneCountry : country}
        onPick={(code) => {
          if (sheet === "indicatif") setPhoneCountry(code);
          else {
            setCountry(code);
            setPhoneCountry(code);
            setCity("");
            setOtherCities([]);
            setFreeCity((data.cities[code] ?? []).length === 0);
          }
          setSheet(null);
        }}
      />

      {chosen ? (
        <JoinSheet
          open={sheet === "rejoindre"}
          card={chosen}
          job={jobTitle}
          onClose={() => setSheet(null)}
          onSend={(message) =>
            start(async () => {
              const done = await rhRequestCompany(chosen.id, message);
              setSheet(null);
              if (!done.ok) {
                setError(t("company.unavailable"));
                return;
              }
              setCompany(done.state);
              setChosen(null);
              setError(null);
              setToast(done.sentTo ? t("join.sent", { name: done.sentTo }) : t("join.sentAdmin"));
            })
          }
          pending={pending}
        />
      ) : null}

      <CreateSheet
        open={sheet === "creer"}
        onClose={() => setSheet(null)}
        pending={pending}
        onCreate={(input) =>
          start(async () => {
            const done = await rhCreateCompany(input);
            if (!done.ok) {
              setError(t("create.nameError"));
              return;
            }
            setSheet(null);
            setCompany(done.state);
            setChosen(null);
            setError(null);
            setToast(t("create.done", { name: input.name.trim() }));
          })
        }
      />

      <PhoneSheet
        open={sheet === "orbi"}
        onClose={() => setSheet(null)}
        label={t("headline.title")}
        closeLabel={t("close")}
      >
        <div className="nb-orbi-tete">
          <OrbiDisc size={42} />
          <span className="nb-orbi-titre">
            <b>{t("headline.title")}</b>
            <span className="nb-meta">{t("headline.from")}</span>
          </span>
          <button
            type="button"
            className="nb-rond nb-fermer"
            aria-label={t("close")}
            onClick={() => setSheet(null)}
          >
            <PhoneIcon name="fermer" size={20} />
          </button>
        </div>
        <div className="nb-orbi-liste">
          {[
            autoHeadline,
            companyCard
              ? t("profile.join", {
                  org: companyCard.name,
                  domains:
                    and(domains.map((item) => item.toLowerCase())) || t("profile.autoTalents"),
                })
              : null,
            jobTitle ? t("profile.reply", { job: jobTitle }) : null,
          ]
            .filter((text): text is string => Boolean(text))
            .map((text) => (
              <button
                key={text}
                type="button"
                className="nb-q"
                onClick={() => {
                  setHeadline(text);
                  setSheet(null);
                }}
              >
                {text}
              </button>
            ))}
        </div>
      </PhoneSheet>
    </div>
  );
}

/** The company's logo beside the person once attached (« ? » while the request waits). */
function CompanyBadge({ company }: { company: CompanyState }) {
  if (company.state === "accepted" || company.state === "created")
    return (
      <span className="nb-rh-logo" aria-hidden>
        {company.card.logo ? <img src={company.card.logo} alt="" /> : initials(company.card.name)}
      </span>
    );
  if (company.state === "pending")
    return <span className="nb-rh-logo" data-attente="" aria-hidden />;
  return null;
}

function CompanyLogo({
  card,
  size = 44,
}: {
  card: { name: string; logo: string | null };
  size?: number;
}) {
  return (
    <span className="nb-rh-org-logo" style={{ width: size, height: size }} aria-hidden>
      {card.logo ? <img src={card.logo} alt="" /> : initials(card.name)}
    </span>
  );
}

function cardMeta(card: CompanyCard, people: (size: string) => string) {
  return [card.sector, card.city, card.size ? people(card.size) : null].filter(Boolean).join(" · ");
}

/** Step 5 (planches 020 à 024): search, the company chosen, the request waiting, or the page. */
function CompanyStep({
  company,
  chosen,
  near,
  domain,
  pending,
  onChoose,
  onRequest,
  onCreate,
  onIndependent,
  onReset,
  onCancel,
}: {
  company: CompanyState;
  chosen: CompanyCard | null;
  near: CompanyCard[];
  domain: string;
  pending: boolean;
  onChoose: (card: CompanyCard | null) => void;
  onRequest: () => void;
  onCreate: () => void;
  onIndependent: () => void;
  onReset: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("phoneRhOnboarding");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ query: string; rows: CompanyCard[] } | null>(null);
  const words = query.trim();
  const found = words && result?.query === words ? result.rows : null;
  const people = (size: string) =>
    t("company.people", {
      size: t(
        `create.sizes.${(SIZE_KEY as Record<string, string>)[size] ?? "s2"}` as "create.sizes.s1",
      ),
    });

  useEffect(() => {
    if (!words) return;
    let live = true;
    const timer = window.setTimeout(async () => {
      const rows = await rhSearchCompanies(words).catch(() => []);
      if (live) setResult({ query: words, rows });
    }, 150);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [words]);

  const card =
    company.state === "pending" || company.state === "accepted" || company.state === "created"
      ? company.card
      : chosen;
  const state =
    company.state === "none" || company.state === "independent" ? "chosen" : company.state;

  if (company.state === "independent")
    return (
      <div className="nb-entre">
        <h1 className="nb-h1">{t("company.title")}</h1>
        <div className="nb-rh-bloc nb-rh-indep">
          <b>{t("company.independentTitle")}</b>
          <p className="nb-meta">{t("company.independentText")}</p>
          <button type="button" className="nb-lien" disabled={pending} onClick={onReset}>
            {t("company.independentBack")}
          </button>
        </div>
      </div>
    );

  if (card)
    return (
      <div className="nb-entre">
        <h1 className="nb-h1">{t("company.title")}</h1>
        <div className="nb-rh-org">
          <span className="nb-rh-org-banniere" aria-hidden />
          <span className="nb-rh-org-l">
            <CompanyLogo card={card} size={52} />
          </span>
          <div className="nb-rh-org-corps">
            <p className="nb-rh-org-nom">
              <b>{card.name}</b>
              <span className="nb-rh-etat" data-etat={state}>
                {t(`company.state.${state}`)}
              </span>
            </p>
            <p className="nb-meta">{cardMeta(card, people)}</p>
            {card.manager || card.recruiters ? (
              <p className="nb-meta">
                {[
                  card.manager ? t("company.managedBy", { name: card.manager }) : null,
                  card.recruiters ? t("company.recruiters", { count: card.recruiters }) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
            {state === "chosen" ? (
              <>
                {card.domain ? (
                  <p className="nb-rh-domaine" data-perso={domain === card.domain ? undefined : ""}>
                    {domain === card.domain
                      ? t("company.domainMatch", { domain })
                      : t("company.domainOther", { domain: card.domain })}
                  </p>
                ) : null}
                <button type="button" className="nb-bp nb-rh-demander" onClick={onRequest}>
                  {t("company.request")}
                </button>
                <p className="nb-meta">{t("company.requestHint")}</p>
                <button
                  type="button"
                  className="nb-lien"
                  data-creme=""
                  onClick={() => onChoose(null)}
                >
                  {t("company.other")}
                </button>
              </>
            ) : null}
            {state === "pending" ? (
              <div className="nb-rh-attente">
                <b>{t("company.waitingTitle")}</b>
                <p>{t("company.waitingText")}</p>
                <button type="button" className="nb-lien" disabled={pending} onClick={onCancel}>
                  {t("company.cancel")}
                </button>
              </div>
            ) : null}
            {state === "created" ? <p className="nb-rh-domaine">{t("company.admin")}</p> : null}
            {state === "pending" ? (
              <button
                type="button"
                className="nb-lien"
                data-creme=""
                disabled={pending}
                onClick={onReset}
              >
                {t("company.other")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );

  const rows = found ?? near;
  return (
    <div className="nb-entre">
      <h1 className="nb-h1">{t("company.title")}</h1>
      <label className="nb-recherche nb-recherche-champ">
        <PhoneIcon name="recherche" size={20} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t("company.search")}
          placeholder={t("company.search")}
          enterKeyHint="search"
          maxLength={80}
        />
      </label>
      {!found && near.length > 0 ? <p className="nb-meta nb-rh-sec">{t("company.near")}</p> : null}
      <div className="nb-rh-orgs">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            className="nb-rh-org-ligne"
            onClick={() => onChoose(row)}
          >
            <CompanyLogo card={row} size={40} />
            <span>
              <b>{row.name}</b>
              <span className="nb-meta">{cardMeta(row, people)}</span>
            </span>
            <span className="nb-rh-sur">{t("company.on")}</span>
          </button>
        ))}
      </div>
      {found && found.length === 0 ? (
        <p className="nb-meta nb-rh-sec">{t("company.none", { query: query.trim() })}</p>
      ) : null}
      <button type="button" className="nb-rh-creer" onClick={onCreate}>
        <span className="nb-rh-creer-plus" aria-hidden>
          <PhoneIcon name="plus" size={18} />
        </span>
        <span>
          <b>{t("company.create")}</b>
          <span className="nb-meta">{t("company.createHint")}</span>
        </span>
      </button>
      <button
        type="button"
        className="nb-lien"
        data-creme=""
        disabled={pending}
        onClick={onIndependent}
      >
        {t("company.independent")}
      </button>
    </div>
  );
}

function JoinSheet({
  open,
  card,
  job,
  onClose,
  onSend,
  pending,
}: {
  open: boolean;
  card: CompanyCard;
  job: string;
  onClose: () => void;
  onSend: (message: string) => void;
  pending: boolean;
}) {
  const t = useTranslations("phoneRhOnboarding");
  const [message, setMessage] = useState(t("join.default", { org: card.name }));
  return (
    <PhoneSheet
      open={open}
      onClose={onClose}
      label={t("join.title", { org: card.name })}
      closeLabel={t("close")}
    >
      <div className="nb-rh-joindre-tete">
        <CompanyLogo card={card} size={40} />
        <span>
          <h2>{t("join.title", { org: card.name })}</h2>
          {card.manager ? (
            <span className="nb-meta">{t("company.managedBy", { name: card.manager })}</span>
          ) : null}
        </span>
      </div>
      <p className="nb-meta">{t("join.text", { job })}</p>
      <label className="nb-lab" htmlFor="rh-message">
        {t("join.message")}
      </label>
      <textarea
        id="rh-message"
        className="nb-in nb-rh-message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={500}
        rows={4}
      />
      <button
        type="button"
        className="nb-bp"
        aria-disabled={pending || undefined}
        onClick={() => {
          if (!pending) onSend(message);
        }}
      >
        {t("join.send")}
      </button>
      <button type="button" className="nb-annuler" onClick={onClose}>
        {t("join.cancel")}
      </button>
    </PhoneSheet>
  );
}

function CreateSheet({
  open,
  onClose,
  onCreate,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; sector: string; size: string }) => void;
  pending: boolean;
}) {
  const t = useTranslations("phoneRhOnboarding");
  const sectors = list(t("create.sectors"));
  const [name, setName] = useState("");
  const [sector, setSector] = useState(sectors[0] ?? "");
  const [size, setSize] = useState<(typeof SIZES)[number]>("11-50");
  const [invalid, setInvalid] = useState(false);
  return (
    <PhoneSheet
      open={open}
      onClose={onClose}
      label={t("create.title")}
      closeLabel={t("close")}
      className="nb-feuille-haute"
    >
      <h2>{t("create.title")}</h2>
      <div className="nb-rh-creer-tete">
        <span className="nb-rh-creer-logo" aria-hidden>
          {t("create.logo")}
        </span>
        <span>
          <label className="nb-lab" htmlFor="rh-entreprise">
            {t("create.name")}
          </label>
          <input
            id="rh-entreprise"
            className="nb-in"
            value={name}
            placeholder={t("create.namePlaceholder")}
            onChange={(event) => {
              setName(event.target.value);
              setInvalid(false);
            }}
            maxLength={120}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? "rh-entreprise-err" : "rh-entreprise-logo"}
          />
        </span>
      </div>
      <p id="rh-entreprise-logo" className="nb-meta">
        {t("create.logoLater")}
      </p>
      {invalid ? (
        <p id="rh-entreprise-err" className="nb-erreur" role="alert">
          {t("create.nameError")}
        </p>
      ) : null}
      <p className="nb-meta nb-rh-sec" id="rh-secteur">
        {t("create.sector")}
      </p>
      <div className="nb-chips" role="radiogroup" aria-labelledby="rh-secteur">
        {sectors.map((item) => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={sector === item}
            className="nb-chip-c"
            onClick={() => setSector(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="nb-meta nb-rh-sec" id="rh-taille">
        {t("create.size")}
      </p>
      <div className="nb-chips" role="radiogroup" aria-labelledby="rh-taille">
        {SIZES.map((item) => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={size === item}
            className="nb-chip-c"
            onClick={() => setSize(item)}
          >
            {t(`create.sizes.${SIZE_KEY[item]}` as "create.sizes.s1")}
          </button>
        ))}
      </div>
      <p className="nb-meta">{t("create.note")}</p>
      <button
        type="button"
        className="nb-bp"
        aria-disabled={pending || undefined}
        onClick={() => {
          if (pending) return;
          if (name.trim().length < 2) {
            setInvalid(true);
            return;
          }
          onCreate({ name: name.trim(), sector, size });
        }}
      >
        {t("create.submit")}
      </button>
      <button type="button" className="nb-annuler" onClick={onClose}>
        {t("create.cancel")}
      </button>
    </PhoneSheet>
  );
}

function PhotoSheetBody({
  input,
  onCancel,
}: {
  input: (capture: boolean) => React.ReactNode;
  onCancel: () => void;
}) {
  const t = useTranslations("phoneAccueil.profile.photo");
  return (
    <>
      <h2>{t("sheet")}</h2>
      <label className="nb-opt">
        <span>
          {t("camera")}
          <small>{t("cameraHint")}</small>
        </span>
        {input(true)}
      </label>
      <label className="nb-opt">
        <span>
          {t("gallery")}
          <small>{t("galleryHint")}</small>
        </span>
        {input(false)}
      </label>
      <button type="button" className="nb-annuler" onClick={onCancel}>
        {t("cancel")}
      </button>
    </>
  );
}

/** « Votre pays » or « Indicatif du numéro » (planches 016 et 018): the regions, the codes. */
function CountrySheet({
  open,
  dialMode,
  onClose,
  countries,
  selected,
  onPick,
}: {
  open: boolean;
  dialMode: boolean;
  onClose: () => void;
  countries: Country[];
  selected: string;
  onPick: (code: string) => void;
}) {
  const t = useTranslations("phoneAccueil.profile.place");
  const tr = useTranslations("phoneRhOnboarding");
  const [query, setQuery] = useState("");
  const shown = dialMode ? countries.filter((country) => country.dial) : countries;
  const folded = foldPlace(query);
  const sections = useMemo(() => countrySections(shown), [shown]);
  const found = folded ? shown.filter((country) => foldPlace(country.name).includes(folded)) : null;
  const title = dialMode ? tr("place.dialSheet") : t("sheet");
  const close = () => {
    setQuery("");
    onClose();
  };
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
      {country.dial ? <span className="nb-meta nb-rh-dial">{country.dial}</span> : null}
      {country.code === selected ? <PhoneIcon name="coche" size={18} strong /> : null}
    </button>
  );
  return (
    <PhoneSheet
      open={open}
      onClose={close}
      label={title}
      closeLabel={tr("close")}
      className="nb-feuille-haute"
    >
      <div className="nb-feuille-titre">
        <h2>{title}</h2>
        <button
          type="button"
          className="nb-rond nb-fermer"
          aria-label={tr("close")}
          onClick={close}
        >
          <PhoneIcon name="fermer" size={20} />
        </button>
      </div>
      <label className="nb-recherche nb-recherche-champ" data-nuit="">
        <PhoneIcon name="recherche" size={20} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t("search")}
          placeholder={t("search")}
        />
      </label>
      <div className="nb-pays-liste">
        {found ? (
          found.length > 0 ? (
            found.map(row)
          ) : (
            <p className="nb-vide">{t("none", { query: query.trim() })}</p>
          )
        ) : (
          sections.map((section) => (
            <section key={section.key} aria-label={t(`zone.${section.key}`)}>
              <p className="nb-meta nb-zone">{t(`zone.${section.key}`)}</p>
              {section.countries.map(row)}
            </section>
          ))
        )}
      </div>
    </PhoneSheet>
  );
}

/** « Ne laissez aucun candidat sans réponse » (planche 028): the phone's own permission. */
function Notifications({ onDone }: { onDone: (enabled: boolean) => void }) {
  const t = useTranslations("phoneRhOnboarding");
  const ta = useTranslations("phoneAccueil.notifications");
  const tb = useTranslations("common");
  return (
    <div className="nb-page nb-ecran nb-notifs" data-ecran="">
      <div className="nb-notifs-exemples" aria-hidden>
        {[
          { text: t("notifications.example1"), when: ta("now") },
          { text: t("notifications.example2"), when: ta("yesterday") },
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
      </div>
      <div className="nb-bas-fixe">
        <button
          type="button"
          className="nb-bp"
          onClick={async () => {
            if (typeof Notification === "undefined") {
              onDone(false);
              return;
            }
            const answer = await Notification.requestPermission().catch(() => "denied");
            onDone(answer === "granted");
          }}
        >
          {ta("enable")}
        </button>
        <button type="button" className="nb-bs" onClick={() => onDone(false)}>
          {ta("later")}
        </button>
      </div>
    </div>
  );
}

/** « Profil prêt » (planches 029 et 030): the ring, the logo waiting or shown, where to start. */
function Ready({
  name,
  image,
  initials: letters,
  job,
  company,
  companyName,
  percent,
  domains,
  notifications,
  onEdit,
}: {
  name: string;
  image: string | null;
  initials: string;
  job: string;
  company: CompanyState;
  companyName: string;
  percent: number;
  domains: string;
  notifications: boolean | null;
  onEdit: () => void;
}) {
  const t = useTranslations("phoneRhOnboarding");
  const circumference = 2 * Math.PI * 34;
  const owner = company.state === "created";
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
                strokeDasharray={`${(circumference * Math.min(percent, 100)) / 100} ${circumference}`}
              />
            </svg>
            {image ? <img src={image} alt="" /> : <span>{letters}</span>}
            <CompanyBadge company={company} />
          </span>
          <h1 className="nb-h1">{t("ready.title", { name })}</h1>
          <p className="nb-sous">{[job, companyName].filter(Boolean).join(" · ")}</p>
          <p className="nb-meta">
            {company.state === "pending"
              ? t("ready.logoPending", { org: company.card.name })
              : company.state === "accepted" || company.state === "created"
                ? t("ready.logoShown", { org: company.card.name })
                : t("ready.independent")}
          </p>
        </div>
        <div className="nb-orbi-note nb-pret-orbi">
          <OrbiDisc size={32} />
          <span>
            {t("ready.orbi")} <Link href="/app/hire/offres/nouvelle">{t("ready.orbiTry")}</Link>
          </span>
        </div>
        <p className="nb-meta nb-pret-sec">{t("ready.start")}</p>
        <div className="nb-pret-liens">
          <Link href="/app/hire/offres/nouvelle" className="nb-ligne-lien">
            <span>
              <b>{t("ready.publish")}</b>
              <span className="nb-meta">{t("ready.publishHint")}</span>
            </span>
            <PhoneIcon name="chevron" size={18} />
          </Link>
          {owner ? (
            <Link href="/app/hire/compte/equipe" className="nb-ligne-lien">
              <span>
                <b>{t("ready.invite")}</b>
                <span className="nb-meta">{t("ready.inviteHint")}</span>
              </span>
              <PhoneIcon name="chevron" size={18} />
            </Link>
          ) : null}
          <Link href="/app/hire/talents" className="nb-ligne-lien">
            <span>
              <b>{t("ready.talents")}</b>
              <span className="nb-meta">
                {domains ? t("ready.talentsHint", { domains }) : t("ready.talentsAll")}
              </span>
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
      <form action={rhEnter} className="nb-bas">
        <button type="submit" className="nb-bp">
          {t("ready.enter")}
        </button>
      </form>
    </div>
  );
}
