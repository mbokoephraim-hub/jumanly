"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { CODE_DIGITS, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/password";

/**
 * Fields of the access screens (planche talent-4, `.champ` and `.saisie`): a label, a glass input
 * that rings when focused or wrong, and the error under it, tied to the input for screen readers.
 */
export function AccessField({
  id,
  label,
  labelEnd,
  error,
  help,
  icon,
  children,
}: {
  id: string;
  label: string;
  /** Link shown at the end of the label line (« Mot de passe oublié ? »). */
  labelEnd?: ReactNode;
  error?: string;
  help?: string;
  icon?: TalentIconName;
  children: ReactNode;
}) {
  return (
    <div className="t-champ">
      {labelEnd ? (
        <div className="t-lab-l">
          <label htmlFor={id}>{label}</label>
          {labelEnd}
        </div>
      ) : (
        <label htmlFor={id}>{label}</label>
      )}
      <div className={cx("t-verre t-saisie", error && "t-err")}>
        {icon && <TalentIcon name={icon} size="s" />}
        {children}
      </div>
      {error ? (
        <p id={`${id}-err`} className="t-aide t-err" role="alert">
          {error}
        </p>
      ) : (
        help && (
          <p id={`${id}-aide`} className="t-aide-c">
            {help}
          </p>
        )
      )}
    </div>
  );
}

/** aria attributes of an input inside `AccessField`. */
export function describedBy(id: string, error?: string, help?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-err` : help ? `${id}-aide` : undefined,
  } as const;
}

export function TextInput({
  id,
  label,
  error,
  help,
  icon,
  ...input
}: {
  id: string;
  label: string;
  error?: string;
  help?: string;
  icon?: TalentIconName;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id">) {
  return (
    <AccessField id={id} label={label} error={error} help={help} icon={icon}>
      <input id={id} {...describedBy(id, error, help)} {...input} />
    </AccessField>
  );
}

/** Four bars of the planche: length, a letter, a digit, a symbol. */
export function passwordScore(password: string) {
  return [
    password.length >= PASSWORD_MIN,
    /\p{L}/u.test(password),
    /\d/.test(password),
    /[^\p{L}\d\s]/u.test(password),
  ].filter(Boolean).length;
}

const levels = ["weak", "weak", "medium", "strong", "veryStrong"] as const;

/**
 * Password with « Afficher » and, for a new password, the strength bars and the rules of the
 * planche (10 caractères au moins, un chiffre, + un symbole).
 */
export function PasswordInput({
  id,
  name = "password",
  label,
  labelEnd,
  error,
  autoComplete = "current-password",
  strength = false,
  placeholder,
}: {
  id: string;
  name?: string;
  label: string;
  labelEnd?: ReactNode;
  error?: string;
  autoComplete?: "current-password" | "new-password";
  strength?: boolean;
  placeholder?: string;
}) {
  const t = useTranslations("access.password");
  const [shown, setShown] = useState(false);
  const [value, setValue] = useState("");
  const score = passwordScore(value);
  const rules = [
    {
      key: "length",
      ok: value.length >= PASSWORD_MIN,
      text: t("rule.length", { min: PASSWORD_MIN }),
    },
    { key: "digit", ok: /\d/.test(value), text: t("rule.digit") },
    { key: "symbol", ok: /[^\p{L}\d\s]/u.test(value), text: t("rule.symbol") },
  ];
  return (
    <>
      <AccessField id={id} label={label} labelEnd={labelEnd} error={error}>
        <input
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          maxLength={PASSWORD_MAX}
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
          {...describedBy(id, error)}
        />
        <button
          type="button"
          className="t-oeil t-press"
          aria-pressed={shown}
          aria-label={shown ? t("hide") : t("show")}
          onClick={() => setShown((current) => !current)}
        >
          <TalentIcon name="confidentialite" size="s" />
        </button>
      </AccessField>
      {strength && (
        <>
          <div className="t-force" aria-live="polite">
            {[0, 1, 2, 3].map((bar) => (
              <i key={bar} aria-hidden className={cx(bar < score && "t-ok")} />
            ))}
            <span>
              <span className="sr-only">{t("strengthLabel", { level: "" })}</span>
              {value ? t(`strength.${levels[score]}`) : ""}
            </span>
          </div>
          <ul className="t-regles-m">
            {rules.map((rule) => (
              <li key={rule.key} className={cx(rule.ok && "t-ok")}>
                <TalentIcon name={rule.ok ? "valider" : "plus"} size="xs" />
                {rule.text}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

/**
 * The 6-digit code (planche `.code6`): one real input over six drawn boxes, so pasting, the
 * keyboard and the autofill of one-time codes keep working.
 */
export function CodeInput({ label, error }: { label: string; error?: string }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className={cx("t-code6", error && "t-err")}>
        {Array.from({ length: CODE_DIGITS }, (_, index) => (
          <span
            key={index}
            aria-hidden
            className={cx(focused && index === Math.min(value.length, CODE_DIGITS - 1) && "t-f")}
          >
            {value[index] ?? ""}
          </span>
        ))}
        <input
          name="code"
          aria-label={label}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d*"
          maxLength={CODE_DIGITS}
          value={value}
          autoFocus
          onChange={(event) =>
            setValue(event.target.value.replace(/\D/g, "").slice(0, CODE_DIGITS))
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "code-err" : undefined}
        />
      </div>
      {error && (
        <p id="code-err" className="t-aide t-err text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** A consent line (planche `.coche`): a real checkbox drawn as the rounded square. */
export function CheckLine({
  name,
  children,
  error,
  defaultChecked,
}: {
  name: string;
  children: ReactNode;
  error?: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="t-coche-l">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-err` : undefined}
        />
        <span className="t-coche" aria-hidden>
          <TalentIcon name="valider" size="xs" />
        </span>
        <span>{children}</span>
      </label>
      {error && (
        <p id={`${name}-err`} className="t-aide t-err" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Seconds left before a code can be asked for again, written « 0:42 ». */
export function formatWait(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
