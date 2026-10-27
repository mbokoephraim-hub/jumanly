"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import {
  addSuggestedSkillsAction,
  saveCareerLanguagesAction,
  searchCareerSkillsAction,
} from "@/server/actions/career-phone";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import type { CareerView } from "./data";

type Skill = { id: string; name: string };

const TICK = "✓ ";

/**
 * « Ajouter des compétences » (planche Carrière-comp): a search in the reference list and Orbi's
 * suggestions, from what the open offers ask for, or a skill typed when the list has none. Ticked
 * skills are added at level 2, declared.
 */
export function SkillsSheet({
  open,
  onClose,
  suggestions,
}: {
  open: boolean;
  onClose: () => void;
  suggestions: Skill[];
}) {
  const t = useTranslations("phoneCareer.sheets");
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Skill[]>([]);
  const [picked, setPicked] = useState<Skill[]>([]);
  // Typed skills that the list does not have, added as they are written.
  const [custom, setCustom] = useState<string[]>([]);
  const [pending, start] = useTransition();

  useEffect(() => {
    const typed = query.trim();
    if (typed.length < 2) return;
    let live = true;
    const wait = setTimeout(() => {
      searchCareerSkillsAction(typed)
        .then((skills) => live && setFound(skills))
        .catch(() => {});
    }, 250);
    return () => {
      live = false;
      clearTimeout(wait);
    };
  }, [query]);

  const toggle = (skill: Skill) =>
    setPicked((before) =>
      before.some((item) => item.id === skill.id)
        ? before.filter((item) => item.id !== skill.id)
        : [...before, skill],
    );
  const close = () => {
    setQuery("");
    setFound([]);
    setPicked([]);
    setCustom([]);
    onClose();
  };
  const typed = query.trim().replace(/\s+/g, " ").slice(0, 80);
  const list = typed.length >= 2 ? found : suggestions;
  const shown = [...picked.filter((skill) => !list.some((item) => item.id === skill.id)), ...list];
  const same = (a: string, b: string) => a.localeCompare(b, "fr", { sensitivity: "base" }) === 0;
  const canType =
    typed.length >= 2 &&
    ![...found, ...picked].some((skill) => same(skill.name, typed)) &&
    !custom.some((name) => same(name, typed));
  const addTyped = () => {
    if (!canType) return;
    setCustom((before) => [...before, typed]);
    setQuery("");
    setFound([]);
  };
  const count = picked.length + custom.length;

  return (
    <PhoneSheet open={open} onClose={close} label={t("skillsTitle")} closeLabel={t("close")}>
      <div className="nb-ca-feuille">
        <b className="nb-ex-feuille-t">{t("skillsTitle")}</b>
        <label className="nb-ex-recherche nb-ca-feuille-champ">
          <PhoneIcon name="recherche" size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTyped();
              }
            }}
            aria-label={t("skillsSearch")}
            placeholder={t("skillsSearch")}
            maxLength={80}
          />
        </label>
        {custom.length > 0 ? (
          <div className="nb-ca-chips">
            {custom.map((name) => (
              <button
                key={name}
                type="button"
                className="nb-ex-chip"
                data-fort=""
                aria-pressed
                onClick={() => setCustom((before) => before.filter((item) => item !== name))}
              >
                {TICK}
                {name}
              </button>
            ))}
          </div>
        ) : null}
        {canType ? (
          <>
            <p className="nb-meta">{t("skillsCustomHint")}</p>
            <div className="nb-ca-chips">
              <button type="button" className="nb-ex-chip" data-fort="" onClick={addTyped}>
                {t("skillsCustom", { skill: typed })}
              </button>
            </div>
          </>
        ) : null}
        <p className="nb-meta">{typed.length >= 2 ? t("skillsFound") : t("skillsSuggested")}</p>
        {shown.length === 0 ? (
          <p className="nb-meta">{t("skillsNone")}</p>
        ) : (
          <div className="nb-ca-chips">
            {shown.map((skill) => {
              const on = picked.some((item) => item.id === skill.id);
              return (
                <button
                  key={skill.id}
                  type="button"
                  className="nb-ex-chip"
                  data-fort=""
                  aria-pressed={on}
                  onClick={() => toggle(skill)}
                >
                  {on ? "✓ " : "+ "}
                  {skill.name}
                </button>
              );
            })}
          </div>
        )}
        <button
          type="button"
          className="nb-bouton"
          data-plein=""
          data-large=""
          disabled={count === 0 || pending}
          onClick={() =>
            start(async () => {
              const result = await addSuggestedSkillsAction(
                picked.map((skill) => skill.id),
                custom,
              ).catch(() => null);
              if (!result?.ok) {
                showToast({
                  message: result?.error === "max" ? t("skillsMax") : t("error"),
                  tone: "error",
                });
                return;
              }
              showToast({ message: t("skillsAdded", { count: result.added }) });
              close();
            })
          }
        >
          {t("skillsAdd", { count })}
        </button>
      </div>
    </PhoneSheet>
  );
}

/** The levels offered for a language (an older « Courant » stays shown where it was chosen). */
const phoneLanguageLevels = ["basic", "intermediate", "professional", "native"] as const;
const levelKey = {
  basic: "languageLevelBasic",
  intermediate: "languageLevelIntermediate",
  professional: "languageLevelProfessional",
  fluent: "languageLevelFluent",
  native: "languageLevelNative",
} as const;

/**
 * « Langues et lieux » (planche Carrière-langues): the languages spoken and the places where the
 * person wants to work, ticked in place; each language ticked gets its level (none by default);
 * a place can be typed.
 */
export function LanguagesSheet({
  open,
  onClose,
  choices,
}: {
  open: boolean;
  onClose: () => void;
  choices: CareerView["sheets"];
}) {
  const t = useTranslations("phoneCareer.sheets");
  const [languages, setLanguages] = useState(choices.languages);
  const [missing, setMissing] = useState(false);
  const [places, setPlaces] = useState(choices.places);
  const [place, setPlace] = useState("");
  const [pending, start] = useTransition();

  const addPlace = () => {
    const name = place.trim().slice(0, 80);
    if (!name) return;
    setPlaces((before) =>
      before.some((item) => item.name === name)
        ? before.map((item) => (item.name === name ? { ...item, on: true } : item))
        : [...before, { name, on: true }],
    );
    setPlace("");
  };

  return (
    <PhoneSheet open={open} onClose={onClose} label={t("languagesTitle")} closeLabel={t("close")}>
      <div className="nb-ca-feuille">
        <b className="nb-ex-feuille-t">{t("languagesTitle")}</b>
        <p className="nb-meta" id="ca-langues">
          {t("languages")}
        </p>
        <div className="nb-ca-chips" role="group" aria-labelledby="ca-langues">
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              className="nb-ex-chip"
              data-fort=""
              aria-pressed={item.on}
              onClick={() =>
                setLanguages((before) =>
                  before.map((other) =>
                    other.code === item.code ? { ...other, on: !other.on } : other,
                  ),
                )
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        {languages
          .filter((item) => item.on)
          .map((item) => (
            <div key={item.code}>
              <p className="nb-meta" id={`ca-niveau-${item.code}`}>
                {t("languageLevel", { language: item.label })}
              </p>
              <div
                className="nb-ca-chips"
                role="radiogroup"
                aria-labelledby={`ca-niveau-${item.code}`}
              >
                {[
                  ...phoneLanguageLevels,
                  ...(item.level === "fluent" ? ["fluent" as const] : []),
                ].map((level) => (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    className="nb-ex-chip"
                    data-fort=""
                    aria-checked={item.level === level}
                    onClick={() => {
                      setMissing(false);
                      setLanguages((before) =>
                        before.map((other) =>
                          other.code === item.code ? { ...other, level } : other,
                        ),
                      );
                    }}
                  >
                    {t(levelKey[level])}
                  </button>
                ))}
              </div>
            </div>
          ))}
        {missing ? (
          <p className="nb-meta" role="alert">
            {t("languageLevelMissing")}
          </p>
        ) : null}
        <p className="nb-meta" id="ca-lieux">
          {t("places")}
        </p>
        <div className="nb-ca-chips" role="group" aria-labelledby="ca-lieux">
          {places.map((item) => (
            <button
              key={item.name}
              type="button"
              className="nb-ex-chip"
              data-fort=""
              aria-pressed={item.on}
              onClick={() =>
                setPlaces((before) =>
                  before.map((other) =>
                    other.name === item.name ? { ...other, on: !other.on } : other,
                  ),
                )
              }
            >
              {item.name}
            </button>
          ))}
        </div>
        <label className="nb-ex-recherche nb-ca-feuille-champ">
          <input
            value={place}
            onChange={(event) => setPlace(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addPlace();
              }
            }}
            aria-label={t("placeAdd")}
            placeholder={t("placeAdd")}
            maxLength={80}
          />
          {place.trim() ? (
            <button type="button" onClick={addPlace}>
              {t("add")}
            </button>
          ) : null}
        </label>
        <button
          type="button"
          className="nb-bouton"
          data-plein=""
          data-large=""
          disabled={pending}
          onClick={() =>
            start(async () => {
              const ticked = languages.filter((item) => item.on);
              if (ticked.some((item) => !item.level)) {
                setMissing(true);
                return;
              }
              const result = await saveCareerLanguagesAction({
                languages: ticked.map((item) => ({ code: item.code, level: item.level! })),
                places: places.filter((item) => item.on).map((item) => item.name),
              }).catch(() => null);
              if (!result?.ok) {
                showToast({ message: t("error"), tone: "error" });
                return;
              }
              showToast({ message: t("languagesSaved") });
              onClose();
            })
          }
        >
          {t("save")}
        </button>
      </div>
    </PhoneSheet>
  );
}
