"use client";

import { useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/brand/icon";
import { useTranslations } from "next-intl";
import { inputClasses } from "@/components/ui/field";
import { cx } from "@/lib/cx";

/**
 * Skills as chips: type, press Enter. Suggestions come from the shared reference through a
 * native datalist. Each chip is sent as a `skills` form value.
 */
export function SkillsInput({
  suggestions,
  initial = [],
  quick = [],
  label,
}: {
  suggestions: string[];
  initial?: string[];
  /** A few skills offered as one-click chips (« Suggestions »). */
  quick?: string[];
  label?: string;
}) {
  const t = useTranslations("welcome.talent.skills");
  const [skills, setSkills] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  const proposed = quick
    .filter((name) => !skills.some((skill) => skill.toLowerCase() === name.toLowerCase()))
    .slice(0, 3);
  const add = () => {
    const value = draft.trim();
    if (value && !skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
      setSkills([...skills, value]);
    }
    setDraft("");
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add();
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="welcome-skills" className="text-[13px] font-semibold text-sapin">
        {label ?? t("title")}
      </label>
      <div className="relative">
        <Icon
          name="competence"
          className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ardoise"
        />
        <input
          id="welcome-skills"
          list="welcome-skill-suggestions"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
          placeholder={t("placeholder")}
          aria-describedby="welcome-skills-hint"
          className={cx(inputClasses, "h-12 pl-11")}
        />
      </div>
      <datalist id="welcome-skill-suggestions">
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <p id="welcome-skills-hint" className="text-ardoise text-caption">
        {t("help")}
      </p>
      <ul className="flex flex-wrap gap-2" aria-live="polite">
        {skills.map((skill) => (
          <li key={skill}>
            <input type="hidden" name="skills" value={skill} />
            <span className="jm-pop inline-flex h-9 items-center gap-1 rounded-pill bg-sapin pr-1.5 pl-3.5 text-[13px] font-semibold text-blanc">
              {skill}
              <button
                type="button"
                onClick={() => setSkills(skills.filter((item) => item !== skill))}
                aria-label={t("remove", { skill })}
                className="flex size-6 items-center justify-center rounded-full text-lime hover:bg-blanc/15"
              >
                <Icon name="fermer" className="size-3.5" />
              </button>
            </span>
          </li>
        ))}
      </ul>
      {proposed.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase">
            {t("suggestions")}
          </span>
          {proposed.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setSkills([...skills, name])}
              className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-blanc px-3.5 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40"
            >
              <Icon name="plus" className="size-3.5" />
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
