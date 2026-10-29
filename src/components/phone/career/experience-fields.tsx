"use client";

import "@/styles/phone-experience.css";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { ACHIEVEMENT_MAX, ACHIEVEMENTS_MAX } from "@/lib/achievements";
import { colorOf, PROFILE_PALETTE } from "@/lib/profile-colors";
import { showToast } from "@/components/motion/toaster";
import { suggestCompaniesAction, uploadExperienceLogoAction } from "@/server/actions/career-phone";
import type { CompanySuggestion } from "@/server/services/experience-company";
import { PhoneIcon } from "../icon";
import { initialsOf } from "../recruteur/compte-initials";

/** The company of an experience as the form holds it. */
export type CompanyValue = {
  company: string;
  /** The page chosen among the suggestions, with its logo. */
  organizationId: string | null;
  organizationLogo: string | null;
  /** The logo the person sent, for a company without a page. */
  logo: string | null;
};

/** The square of a company: its logo, or its initials on its colour. */
export function CompanyMark({
  name,
  logo,
  size = 44,
}: {
  name: string;
  logo: string | null;
  size?: number;
}) {
  if (logo)
    return (
      <span className="nb-xp-mark" data-logo="" style={{ width: size, height: size }} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- a 160 px logo */}
        <img src={logo} alt="" width={size} height={size} />
      </span>
    );
  return (
    <span
      className="nb-xp-mark"
      style={{ width: size, height: size, background: PROFILE_PALETTE[colorOf(name || "?")] }}
      aria-hidden
    >
      {initialsOf(name.trim()) || <PhoneIcon name="organisation" size={18} />}
    </span>
  );
}

/**
 * « Entreprise » (demande d'Ephraïm du 29/10/2026): while the name is typed, the companies with a
 * page on Jumanly are proposed with their logo. One chosen fills the name and the logo and links
 * the experience to its page; « Changer » lets the person type again. Without a page, the person
 * can send the company's logo.
 */
export function CompanyField({
  value,
  onChange,
  error,
}: {
  value: CompanyValue;
  onChange: (patch: Partial<CompanyValue>) => void;
  error: string | null;
}) {
  const t = useTranslations("phoneCareer.form");
  const id = useId();
  const listId = `${id}-liste`;
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const asked = useRef(0);
  const typed = value.company.trim();

  useEffect(() => {
    if (value.organizationId || typed.length < 2) return;
    const ask = ++asked.current;
    const timer = window.setTimeout(() => {
      suggestCompaniesAction(typed)
        .then((rows) => {
          if (ask === asked.current) setSuggestions(rows);
        })
        .catch(() => undefined);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [typed, value.organizationId]);

  const shown = open && !value.organizationId && typed.length >= 2 ? suggestions : [];

  if (value.organizationId)
    return (
      <div className="nb-ca-ch">
        <span>{t("company")}</span>
        <div className="nb-xp-choisie">
          <CompanyMark name={value.company} logo={value.organizationLogo} />
          <div>
            <strong>{value.company}</strong>
            <span>
              <PhoneIcon name="coche" size={13} strong />
              {t("companyPage")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange({ organizationId: null, organizationLogo: null });
              setOpen(true);
            }}
            aria-label={t("companyChangeLabel", { company: value.company })}
          >
            {t("companyChange")}
          </button>
        </div>
      </div>
    );

  return (
    <div className="nb-ca-ch nb-xp-entreprise">
      <label htmlFor={id}>{t("company")}</label>
      <input
        id={id}
        className="nb-ca-in"
        value={value.company}
        onChange={(event) => {
          onChange({ company: event.target.value });
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder={t("companyPlaceholder")}
        maxLength={120}
        autoComplete="off"
        role="combobox"
        aria-expanded={shown.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        required
      />
      {error ? (
        <p className="nb-ca-erreur" role="alert">
          {error}
        </p>
      ) : null}
      <div id={listId} className="nb-xp-sugg" hidden={shown.length === 0}>
        <p>{t("companySuggestions")}</p>
        <ul>
          {shown.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange({
                    company: item.name,
                    organizationId: item.id,
                    organizationLogo: item.logo,
                  });
                  setOpen(false);
                }}
              >
                <CompanyMark name={item.name} logo={item.logo} size={36} />
                <span>
                  <strong>{item.name}</strong>
                  {item.place ? <small>{item.place}</small> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <LogoPicker name={value.company} logo={value.logo} onChange={(logo) => onChange({ logo })} />
    </div>
  );
}

/** « Ajouter le logo » for a company without a page: a square image, its initials otherwise. */
function LogoPicker({
  name,
  logo,
  onChange,
}: {
  name: string;
  logo: string | null;
  onChange: (logo: string | null) => void;
}) {
  const t = useTranslations("phoneCareer.form");
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const send = (file: File) =>
    start(async () => {
      const form = new FormData();
      form.set("logo", file);
      const result = await uploadExperienceLogoAction(form).catch(() => null);
      if (result?.ok) onChange(result.logo);
      else
        showToast({
          message: t.has(`errors.${result?.error}` as "errors.logoType")
            ? t(`errors.${result?.error}` as "errors.logoType")
            : t("error"),
          tone: "error",
        });
    });
  return (
    <div className="nb-xp-logo">
      <CompanyMark name={name} logo={logo} />
      <div>
        <strong>{t("logo")}</strong>
        <span>{t("logoHint")}</span>
        <div>
          <button
            type="button"
            data-plein=""
            onClick={() => input.current?.click()}
            disabled={pending}
            aria-busy={pending}
          >
            <PhoneIcon name="photo" size={15} />
            {pending ? t("logoSending") : logo ? t("logoChange") : t("logoAdd")}
          </button>
          {logo ? (
            <button type="button" onClick={() => onChange(null)} disabled={pending}>
              {t("logoRemove")}
            </button>
          ) : null}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        aria-label={t("logoAdd")}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) send(file);
        }}
      />
    </div>
  );
}

/**
 * « Réalisations clés » (demande d'Ephraïm du 29/10/2026): one field per point, 3 to 4 advised,
 * each one can be moved up or down, removed, or a new one added below.
 */
export function AchievementsField({
  points,
  onChange,
  max = ACHIEVEMENTS_MAX,
  inCv = false,
}: {
  points: string[];
  onChange: (points: string[]) => void;
  max?: number;
  /** In the CV form (« Mes informations »): its field layout instead of the profile's. */
  inCv?: boolean;
}) {
  const t = useTranslations("phoneCareer.form");
  const id = useId();
  const list = useRef<HTMLOListElement>(null);
  // The field to focus once the list is drawn again (after « Ajouter », a move or a removal).
  const focusAt = useRef<number | null>(null);
  const setFocusAt = (at: number) => {
    focusAt.current = at;
  };

  useEffect(() => {
    if (focusAt.current === null) return;
    list.current?.querySelectorAll("textarea")[focusAt.current]?.focus();
    focusAt.current = null;
  });

  const move = (from: number, to: number) => {
    const next = [...points];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
    setFocusAt(to);
  };
  const filled = points.filter((point) => point.trim()).length;
  return (
    <div
      className={inCv ? "nb-cvf-champ nb-xp-pts" : "nb-ca-ch nb-xp-pts"}
      data-large={inCv ? "" : undefined}
    >
      <span id={`${id}-t`}>{t("achievements")}</span>
      <p className="nb-xp-aide" id={`${id}-a`}>
        {t("achievementsHint")}
      </p>
      <ol ref={list} aria-labelledby={`${id}-t`} aria-describedby={`${id}-a`}>
        {points.map((point, at) => {
          const n = at + 1;
          return (
            <li key={at}>
              <i aria-hidden />
              <textarea
                className="nb-ca-in"
                value={point}
                rows={2}
                maxLength={ACHIEVEMENT_MAX}
                aria-label={t("achievementLabel", { n })}
                placeholder={t("achievementPlaceholder", { n })}
                onChange={(event) => {
                  const next = [...points];
                  next[at] = event.target.value.replace(/\r?\n/g, " ");
                  onChange(next);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  if (points.length < max) {
                    const next = [...points];
                    next.splice(at + 1, 0, "");
                    onChange(next);
                    setFocusAt(at + 1);
                  }
                }}
              />
              <span className="nb-xp-outils">
                <button
                  type="button"
                  onClick={() => move(at, at - 1)}
                  disabled={at === 0}
                  aria-label={t("achievementUp", { n })}
                >
                  <PhoneIcon name="haut" size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => move(at, at + 1)}
                  disabled={at === points.length - 1}
                  aria-label={t("achievementDown", { n })}
                >
                  <PhoneIcon name="bas" size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(points.filter((_, index) => index !== at));
                    setFocusAt(Math.max(0, Math.min(at, points.length - 2)));
                  }}
                  aria-label={t("achievementRemove", { n })}
                >
                  <PhoneIcon name="corbeille" size={16} />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      {points.length < max ? (
        <button
          type="button"
          className="nb-xp-ajout"
          onClick={() => {
            onChange([...points, ""]);
            setFocusAt(points.length);
          }}
        >
          <PhoneIcon name="plus" size={16} strong />
          {t("achievementAdd")}
        </button>
      ) : (
        <p className="nb-xp-aide">{t("achievementsMax", { max })}</p>
      )}
      <p className="nb-meta nb-xp-compte" aria-live="polite">
        {t("achievementsCount", { count: filled })}
      </p>
    </div>
  );
}
