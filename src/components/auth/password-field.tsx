"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Field, inputClasses } from "@/components/ui/field";
import { cx } from "@/lib/cx";
import { passwordStrength, PASSWORD_MAX } from "@/lib/password";

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
            <input
              {...aria}
              name={name}
              type={visible ? "text" : "password"}
              autoComplete={autoComplete}
              maxLength={PASSWORD_MAX}
              placeholder={placeholder}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className={cx(inputClasses, "h-11 pr-12")}
            />
            <button
              type="button"
              onClick={() => setVisible((shown) => !shown)}
              aria-label={visible ? t("auth.password.hide") : t("auth.password.show")}
              aria-pressed={visible}
              className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-ardoise hover:text-sapin"
            >
              {visible ? (
                <EyeOff aria-hidden className="size-5" />
              ) : (
                <Eye aria-hidden className="size-5" />
              )}
            </button>
          </div>
        )}
      </Field>
      {showStrength && strength && (
        <p className="text-ardoise text-caption" aria-live="polite">
          {t(`signup.account.password.strength.${strength}`)}
        </p>
      )}
    </div>
  );
}
