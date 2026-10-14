"use client";

import { useState } from "react";
import { Icon } from "@/components/brand/icon";
import { useTranslations } from "next-intl";
import { Field, inputClasses } from "@/components/ui/field";
import { cx } from "@/lib/cx";
import { passwordStrength, PASSWORD_MAX } from "@/lib/password";

const levels = { weak: 0, medium: 1, strong: 2 } as const;

/** Password input with a show/hide button and, on creation, a strength indicator. */
export function PasswordField({
  id,
  name = "password",
  label,
  placeholder,
  hint,
  error,
  autoComplete = "current-password",
  showStrength = false,
}: {
  id: string;
  name?: string;
  label: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  autoComplete?: "current-password" | "new-password";
  showStrength?: boolean;
}) {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const strength = value ? passwordStrength(value) : null;
  return (
    <div className="flex flex-col gap-1.5">
      <Field id={id} label={label} hint={hint} error={error} required>
        {(aria) => (
          <div className="relative">
            <Icon
              name="lock"
              className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ardoise"
            />
            <input
              {...aria}
              name={name}
              type={visible ? "text" : "password"}
              autoComplete={autoComplete}
              maxLength={PASSWORD_MAX}
              placeholder={placeholder}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className={cx(inputClasses, "h-12 pr-12 pl-11")}
            />
            <button
              type="button"
              onClick={() => setVisible((shown) => !shown)}
              aria-label={visible ? t("auth.password.hide") : t("auth.password.show")}
              aria-pressed={visible}
              className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-ardoise hover:text-sapin"
            >
              <Icon name={visible ? "eye-off" : "eye"} className="size-5" />
            </button>
          </div>
        )}
      </Field>
      {showStrength && strength && (
        <div className="flex items-center gap-1.5" aria-live="polite">
          {[0, 1, 2].map((bar) => (
            <span
              key={bar}
              aria-hidden
              className={cx(
                "h-1 flex-1 rounded-pill bg-brume",
                bar <= levels[strength] &&
                  (strength === "weak"
                    ? "bg-corail"
                    : strength === "medium"
                      ? "bg-ambre"
                      : "bg-feuille"),
              )}
            />
          ))}
          <span
            className={cx(
              "ml-1.5 text-xs font-semibold",
              strength === "strong" ? "text-feuille-fonce" : "text-ardoise",
            )}
          >
            {t(`signup.account.password.strength.${strength}`)}
          </span>
        </div>
      )}
    </div>
  );
}
