"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
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
}: {
  suggestions: string[];
  initial?: string[];
}) {
  const t = useTranslations("welcome.talent.skills");
  const [skills, setSkills] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
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
      <label htmlFor="welcome-skills" className="text-sapin text-label">
        {t("title")}
      </label>
      <input
        id="welcome-skills"
        list="welcome-skill-suggestions"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={t("placeholder")}
        aria-describedby="welcome-skills-hint"
        className={cx(inputClasses, "h-11")}
      />
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
            <span className="inline-flex h-8 items-center gap-1 rounded-pill bg-neon pr-1 pl-3 text-sm text-sapin">
              {skill}
              <button
                type="button"
                onClick={() => setSkills(skills.filter((item) => item !== skill))}
                aria-label={t("remove", { skill })}
                className="flex size-6 items-center justify-center rounded-full hover:bg-sapin/10"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
