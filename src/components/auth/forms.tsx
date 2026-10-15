"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui/alert";
import { Icon } from "@/components/brand/icon";
import { Button, buttonClasses } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { interpolate, slot } from "@/lib/interpolate";
import { CODE_DIGITS, CODE_MINUTES, MIN_AGE, PASSWORD_MIN } from "@/lib/password";
import {
  requestPasswordReset,
  resendCode,
  resetPassword,
  sendMagicLinkAction,
  sendTwoFactorCode,
  signIn,
  signUp,
  verifyEmail,
  verifyTwoFactor,
  type AuthFormState,
} from "@/server/actions/auth";
import { PasswordField } from "./password-field";

const idle: AuthFormState = { status: "idle" };

/** Text of an error code from `auth.error.*`, with the values the texts expect. */
function useErrorText() {
  const t = dynamic(useTranslations());
  return (code?: string) => {
    if (!code) return undefined;
    const key = t.has(`auth.error.${code}`) ? `auth.error.${code}` : `auth.error.${code}.text`;
    return t(key, {
      min: PASSWORD_MIN,
      minAge: MIN_AGE,
      digits: CODE_DIGITS,
      minutes: CODE_MINUTES,
      seconds: 60,
    });
  };
}

function Hidden({ fields }: { fields: Record<string, string | undefined> }) {
  return Object.entries(fields).map(([name, value]) =>
    value ? <input key={name} type="hidden" name={name} value={value} /> : null,
  );
}

// ─── Sign-in ───────────────────────────────────────────────────────

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations();
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(signIn, idle);
  const values = state.values ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.error && (
        <Alert tone="error" title={errorText(state.error) ?? ""}>
          {state.error === "invalidCredentials" && (
            <Link href="/mot-de-passe-oublie" className="underline">
              {t("login.forgot")}
            </Link>
          )}
        </Alert>
      )}
      <Hidden fields={{ next }} />
      <TextField
        id="login-email"
        name="email"
        type="email"
        icon="message"
        autoComplete="email"
        label={t("login.email.label")}
        placeholder={t("login.email.placeholder")}
        required
        defaultValue={values.email}
        error={errorText(state.errors?.email)}
      />
      <PasswordField
        id="login-password"
        label={t("login.password.label")}
        placeholder={t("login.password.placeholder")}
        error={errorText(state.errors?.password)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox id="login-remember" name="remember" label={t("login.remember")} defaultChecked />
        <Link
          href="/mot-de-passe-oublie"
          className="text-[13px] font-semibold text-feuille-fonce hover:underline"
        >
          {t("login.forgot")}
        </Link>
      </div>
      <Button
        type="submit"
        size="lg"
        loading={pending}
        fullWidth
        className="jm-ae-submit"
        iconAfter={
          pending ? undefined : (
            <span aria-hidden className="jm-ae-arrow">
              <Icon name="suivant" className="size-4" />
            </span>
          )
        }
      >
        {pending ? t("login.submitting") : t("login.submit")}
      </Button>
    </form>
  );
}

export function MagicLinkForm({ next }: { next?: string }) {
  const t = useTranslations();
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(sendMagicLinkAction, idle);
  if (state.status === "sent") {
    return (
      <Alert tone="success" title={t("login.magic.sent.title")}>
        {t("login.magic.sent.text", { email: state.email ?? "", minutes: CODE_MINUTES })}
      </Alert>
    );
  }
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <p className="text-[15px] text-ardoise">{t("login.magic.text")}</p>
      <Hidden fields={{ next }} />
      <TextField
        id="magic-email"
        name="email"
        type="email"
        icon="message"
        autoComplete="email"
        label={t("login.email.label")}
        placeholder={t("login.email.placeholder")}
        required
        error={errorText(state.errors?.email)}
      />
      <Button type="submit" variant="secondary" loading={pending}>
        {t("login.magic.submit")}
      </Button>
    </form>
  );
}

// ─── Password reset ────────────────────────────────────────────────

export function ForgotForm() {
  const t = useTranslations();
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(requestPasswordReset, idle);
  const wait = useCountdown(state.status === "sent" ? state : undefined);
  if (state.status === "sent") {
    return (
      <SentCard title={t("forgot.sent.title")}>
        <p>{t("forgot.sent.text", { email: state.email ?? "", minutes: 60 })}</p>
        <form action={action}>
          <input type="hidden" name="email" value={state.email ?? ""} />
          <button
            type="submit"
            disabled={wait > 0 || pending}
            className="flex h-9 items-center gap-1.5 rounded-pill px-3.5 text-[13px] font-semibold text-sapin ring-[1.5px] ring-brume ring-inset disabled:text-ardoise"
          >
            <Icon name="horloge" className="size-4" />
            {wait > 0 ? t("forgot.sent.resendIn", { seconds: wait }) : t("forgot.sent.resend")}
          </button>
        </form>
      </SentCard>
    );
  }
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <TextField
        id="forgot-email"
        name="email"
        type="email"
        icon="message"
        autoComplete="email"
        label={t("forgot.email.label")}
        placeholder={t("forgot.email.placeholder")}
        required
        error={errorText(state.errors?.email)}
      />
      <Button
        type="submit"
        size="lg"
        loading={pending}
        fullWidth
        iconAfter={<Icon name="send" className="size-[18px]" />}
      >
        {pending ? t("forgot.submitting") : t("forgot.submit")}
      </Button>
    </form>
  );
}

/** Seconds left before a new e-mail can be asked for; restarts after each sending. */
function useCountdown(sent: object | undefined, seconds = 60) {
  const [previous, setPrevious] = useState(sent);
  const [left, setLeft] = useState(sent ? seconds : 0);
  if (sent !== previous) {
    setPrevious(sent);
    setLeft(sent ? seconds : 0);
  }
  useEffect(() => {
    if (left <= 0) return;
    const timer = window.setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left]);
  return left;
}

/** White card with a Lime outline and a check, shown once an e-mail is sent or a step is done. */
function SentCard({
  title,
  tone = "success",
  children,
}: {
  title: string;
  tone?: "success" | "error";
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      className={cx(
        "jm-rise flex flex-col items-start gap-3 rounded-[24px] bg-blanc p-6 text-sm leading-[21px] text-ardoise ring-[1.5px] ring-inset",
        tone === "success" ? "ring-lime" : "ring-corail/60",
      )}
    >
      <p className="flex items-center gap-3 text-lg font-bold text-sapin">
        <span
          aria-hidden
          className={cx(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            tone === "success" ? "bg-lime" : "bg-down-fond text-down-texte",
          )}
        >
          <Icon name={tone === "success" ? "check" : "horloge"} className="size-5" />
        </span>
        {title}
      </p>
      {children}
    </div>
  );
}

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations();
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(resetPassword, idle);
  if (state.status === "done") {
    return (
      <SentCard title={t("reset.success.title")}>
        <p>{t("reset.success.text")}</p>
        <Link href="/connexion" className={buttonClasses({ size: "md" })}>
          {t("reset.success.cta")}
        </Link>
      </SentCard>
    );
  }
  if (state.error === "resetLinkInvalid") return <ResetLinkInvalid />;
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <PasswordField
        id="reset-password"
        label={t("reset.password.label")}
        placeholder={t("reset.password.placeholder", { min: PASSWORD_MIN })}
        hint={t("reset.password.help", { min: PASSWORD_MIN })}
        autoComplete="new-password"
        showStrength
        error={errorText(state.errors?.password)}
      />
      <PasswordField
        id="reset-confirm"
        name="confirm"
        label={t("reset.confirm.label")}
        placeholder={t("reset.confirm.placeholder")}
        autoComplete="new-password"
        error={errorText(state.errors?.confirm)}
      />
      {/* Every other session is closed after a reset (Better Auth configuration). */}
      <p className="flex items-center gap-2.5 text-sm">
        <span
          aria-hidden
          className="flex size-5 items-center justify-center rounded-[6px] bg-sapin text-blanc"
        >
          <Icon name="check" className="size-4" />
        </span>
        {t("reset.logoutOthers")}
      </p>
      <Button type="submit" size="lg" loading={pending} fullWidth>
        {pending ? t("reset.submitting") : t("reset.submit")}
      </Button>
    </form>
  );
}

/** « Ce lien n'est plus valable », with the way to ask for a new one. */
export function ResetLinkInvalid() {
  const t = useTranslations();
  return (
    <SentCard title={t("reset.invalid.title")} tone="error">
      <p>{t("reset.invalid.text")}</p>
      <Link href="/mot-de-passe-oublie" className={buttonClasses({ size: "md" })}>
        {t("reset.invalid.cta")}
      </Link>
    </SentCard>
  );
}

// ─── Sign-up, step 3 ───────────────────────────────────────────────

export function SignupAccountForm({
  profile,
  plan,
  next,
  countries,
  defaultCountry,
  defaultEmail,
}: {
  profile: "talent" | "rh" | "company";
  plan?: string;
  next?: string;
  countries: { value: string; label: string }[];
  defaultCountry?: string;
  /** E-mail typed on the entry screen (sign-up cookie). */
  defaultEmail?: string;
}) {
  const t = useTranslations();
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(signUp, idle);
  const values = state.values ?? {};
  const errors = state.errors ?? {};
  const isOrg = profile !== "talent";
  const consent = (name: string, label: ReactNode, error?: string) => (
    <div className="flex flex-col gap-1">
      <Checkbox
        id={`signup-${name}`}
        name={name}
        label={label}
        defaultChecked={values[name] === "on"}
        aria-invalid={error ? true : undefined}
      />
      {error && (
        <p className="ml-8 font-medium text-corail-fonce text-caption">{errorText(error)}</p>
      )}
    </div>
  );
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.error && <Alert tone="error" title={errorText(state.error) ?? ""} />}
      {errors.email === "emailTaken" && (
        <Alert tone="error" title={t("auth.error.emailTaken.text")}>
          <span className="flex gap-4">
            <Link href="/connexion" className="underline">
              {t("auth.error.emailTaken.login")}
            </Link>
            <Link href="/mot-de-passe-oublie" className="underline">
              {t("auth.error.emailTaken.forgot")}
            </Link>
          </span>
        </Alert>
      )}
      <Hidden fields={{ profile, plan, next }} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="signup-firstName"
          name="firstName"
          autoComplete="given-name"
          label={t("signup.account.firstName.label")}
          placeholder={t("signup.account.firstName.placeholder")}
          required
          defaultValue={values.firstName}
          error={errorText(errors.firstName)}
        />
        <TextField
          id="signup-lastName"
          name="lastName"
          autoComplete="family-name"
          label={t("signup.account.lastName.label")}
          placeholder={t("signup.account.lastName.placeholder")}
          required
          defaultValue={values.lastName}
          error={errorText(errors.lastName)}
        />
      </div>
      <TextField
        id="signup-email"
        name="email"
        type="email"
        icon="message"
        autoComplete="email"
        label={t("signup.account.email.label")}
        placeholder={t("signup.account.email.placeholder")}
        hint={isOrg ? t("signup.account.email.helpOrg") : t("signup.account.email.help")}
        required
        defaultValue={values.email ?? defaultEmail}
        error={errors.email === "emailTaken" ? undefined : errorText(errors.email)}
      />
      <PasswordField
        id="signup-password"
        label={t("signup.account.password.label")}
        placeholder={t("signup.account.password.placeholder", { min: PASSWORD_MIN })}
        hint={t("signup.account.password.help", { min: PASSWORD_MIN })}
        autoComplete="new-password"
        showStrength
        error={errorText(errors.password)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="signup-country"
          name="country"
          label={t("signup.account.country.label")}
          placeholder={t("signup.account.country.placeholder")}
          required
          defaultValue={values.country ?? defaultCountry ?? ""}
          options={countries}
          error={errorText(errors.country)}
        />
        <TextField
          id="signup-city"
          name="city"
          autoComplete="address-level2"
          label={t("signup.account.city.label")}
          placeholder={t("signup.account.city.placeholder")}
          hint={isOrg ? undefined : t("signup.account.city.help")}
          required
          defaultValue={values.city}
          error={errorText(errors.city)}
        />
      </div>
      {isOrg && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="signup-orgName"
            name="orgName"
            autoComplete="organization"
            label={t("signup.account.orgName.label")}
            placeholder={t("signup.account.orgName.placeholder")}
            hint={t("signup.account.orgName.help")}
            required
            defaultValue={values.orgName}
            error={errorText(errors.orgName)}
          />
          <TextField
            id="signup-orgRole"
            name="orgRole"
            autoComplete="organization-title"
            label={t("signup.account.orgRole.label")}
            placeholder={t("signup.account.orgRole.placeholder")}
            defaultValue={values.orgRole}
          />
        </div>
      )}
      <fieldset className="flex flex-col gap-3">
        {consent(
          "terms",
          interpolate(
            t("signup.account.consent.terms", { terms: slot("terms"), privacy: slot("privacy") }),
            {
              terms: (
                <Link href="/conditions" className="underline" target="_blank">
                  {t("signup.account.consent.termsLink")}
                </Link>
              ),
              privacy: (
                <Link href="/confidentialite" className="underline" target="_blank">
                  {t("signup.account.consent.privacyLink")}
                </Link>
              ),
            },
          ),
          errors.terms,
        )}
        {consent("ai", t("signup.account.consent.ai"), errors.ai)}
        {consent("newsletter", t("signup.account.consent.newsletter"))}
        {consent("age", t("signup.account.consent.age", { minAge: MIN_AGE }), errors.age)}
      </fieldset>
      <Button
        type="submit"
        size="lg"
        loading={pending}
        fullWidth
        iconAfter={<Icon name="chev-r" className="size-5" />}
      >
        {pending ? t("signup.account.submitting") : t("signup.account.submit")}
      </Button>
    </form>
  );
}

// ─── Codes (step 4 and two-step sign-in) ───────────────────────────

/**
 * The 6-digit code (mockup 02-07): one real input over six drawn boxes, so pasting, the keyboard
 * and autofill of one-time codes keep working.
 */
function CodeField({ error, label, help }: { error?: string; label: string; help: string }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  return (
    <Field id="code" label={label} hint={help} error={error} required>
      {(aria) => (
        <div className="relative">
          <div aria-hidden className="grid grid-cols-6 gap-2 lg:gap-3">
            {Array.from({ length: CODE_DIGITS }, (_, index) => {
              const active = focused && index === Math.min(value.length, CODE_DIGITS - 1);
              return (
                <span
                  key={index}
                  className={cx(
                    "flex h-14 items-center justify-center rounded-[14px] bg-blanc text-[26px] font-semibold ring-[1.5px] ring-inset lg:h-[70px] lg:text-[30px]",
                    error ? "ring-corail" : value[index] ? "ring-sapin/30" : "ring-brume",
                    active && "shadow-[0_0_0_5px_rgb(166_242_107/0.55)] ring-2 ring-sapin",
                  )}
                >
                  {value[index] ??
                    (active ? <span className="h-7 w-0.5 animate-pulse bg-sapin" /> : null)}
                </span>
              );
            })}
          </div>
          <input
            {...aria}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d*"
            maxLength={CODE_DIGITS}
            value={value}
            onChange={(event) =>
              setValue(event.target.value.replace(/\D/g, "").slice(0, CODE_DIGITS))
            }
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="absolute inset-0 h-full w-full cursor-text rounded-[14px] bg-transparent text-transparent caret-transparent opacity-[0.01] outline-none"
          />
        </div>
      )}
    </Field>
  );
}

export function VerifyEmailForm({ email }: { email: string }) {
  const t = useTranslations();
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(verifyEmail, idle);
  const [resent, resend, resending] = useActionState(resendCode, idle);
  const [arrival] = useState(() => ({}));
  const wait = useCountdown(resent.status === "sent" ? resent : arrival);
  return (
    <div className="flex flex-col gap-5">
      {resent.status === "sent" && (
        <Alert tone="success" title={t("signup.verify.resent", { email })} />
      )}
      {resent.error && <Alert tone="error" title={errorText(resent.error) ?? ""} />}
      <form action={action} noValidate className="flex flex-col gap-5">
        <CodeField
          label={t("signup.verify.code.label")}
          help={t("signup.verify.code.help", { minutes: CODE_MINUTES })}
          error={errorText(state.errors?.code)}
        />
        <Button type="submit" size="lg" loading={pending} fullWidth>
          {pending ? t("signup.verify.submitting") : t("signup.verify.submit")}
        </Button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <form action={resend}>
          <button
            type="submit"
            disabled={wait > 0 || resending}
            className="flex items-center gap-2 font-semibold text-sapin hover:underline disabled:font-normal disabled:text-ardoise disabled:no-underline"
          >
            <Icon name="horloge" className="size-4" />
            {wait > 0 ? t("signup.verify.resendIn", { seconds: wait }) : t("signup.verify.resend")}
          </button>
        </form>
        <Link href="/inscription" className="font-semibold text-feuille-fonce hover:underline">
          {t("signup.verify.changeEmail")}
        </Link>
      </div>
      <p className="flex items-start gap-3 rounded-[16px] bg-blanc px-4 py-3.5 text-[13px] leading-[19px]">
        <Icon name="notification" className="mt-px size-4 shrink-0" />
        {t("signup.verify.spam")}
      </p>
    </div>
  );
}

export function TwoFactorForm({ next }: { next?: string }) {
  const t = useTranslations();
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(verifyTwoFactor, idle);
  const [sent, send, sending] = useActionState(sendTwoFactorCode, idle);
  const requested = useRef(false);
  useEffect(() => {
    // The code is sent as soon as the page opens; the button below sends a new one.
    if (requested.current) return;
    requested.current = true;
    startTransition(() => send());
  }, [send]);
  return (
    <div className="flex flex-col gap-4">
      {(state.error ?? sent.error) && (
        <Alert tone="error" title={errorText(state.error ?? sent.error) ?? ""}>
          <Link href="/connexion" className="underline">
            {t("signup.loginLink")}
          </Link>
        </Alert>
      )}
      <form action={action} noValidate className="flex flex-col gap-4">
        <Hidden fields={{ next }} />
        <CodeField
          label={t("signup.verify.code.label")}
          help={t("signup.verify.code.help", { minutes: CODE_MINUTES })}
          error={errorText(state.errors?.code)}
        />
        <Button type="submit" size="lg" loading={pending} fullWidth>
          {pending ? t("signup.verify.submitting") : t("signup.verify.submit")}
        </Button>
      </form>
      <form action={send}>
        <Button type="submit" variant="tertiary" loading={sending}>
          {t("signup.verify.resend")}
        </Button>
      </form>
    </div>
  );
}
