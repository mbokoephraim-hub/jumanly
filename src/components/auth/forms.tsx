"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { dynamic } from "@/i18n/dynamic";
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
        <Link href="/mot-de-passe-oublie" className="text-sm font-medium underline">
          {t("login.forgot")}
        </Link>
      </div>
      <Button type="submit" size="lg" loading={pending} fullWidth>
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
  if (state.status === "sent") {
    return (
      <Alert tone="success" title={t("forgot.sent.title")}>
        {t("forgot.sent.text", { email: state.email ?? "", minutes: 60 })}
      </Alert>
    );
  }
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <TextField
        id="forgot-email"
        name="email"
        type="email"
        autoComplete="email"
        label={t("forgot.email.label")}
        placeholder={t("forgot.email.placeholder")}
        required
        error={errorText(state.errors?.email)}
      />
      <Button type="submit" size="lg" loading={pending} fullWidth>
        {pending ? t("forgot.submitting") : t("forgot.submit")}
      </Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations();
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(resetPassword, idle);
  if (state.status === "done") {
    return (
      <Alert
        tone="success"
        title={t("reset.success.title")}
        action={
          <Link href="/connexion" className="font-medium underline">
            {t("reset.success.cta")}
          </Link>
        }
      >
        {t("reset.success.text")}
      </Alert>
    );
  }
  if (state.error === "resetLinkInvalid") {
    return (
      <Alert
        tone="error"
        title={t("reset.invalid.title")}
        action={
          <Link href="/mot-de-passe-oublie" className="font-medium underline">
            {t("reset.invalid.cta")}
          </Link>
        }
      >
        {t("reset.invalid.text")}
      </Alert>
    );
  }
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
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
      <Button type="submit" size="lg" loading={pending} fullWidth>
        {pending ? t("reset.submitting") : t("reset.submit")}
      </Button>
    </form>
  );
}

// ─── Sign-up, step 3 ───────────────────────────────────────────────

export function SignupAccountForm({
  profile,
  plan,
  next,
  countries,
  defaultCountry,
}: {
  profile: "talent" | "rh" | "company";
  plan?: string;
  next?: string;
  countries: { value: string; label: string }[];
  defaultCountry?: string;
}) {
  const t = useTranslations();
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(signUp, idle);
  const values = state.values ?? {};
  const errors = state.errors ?? {};
  const isOrg = profile !== "talent";
  const consent = (name: string, label: string, error?: string) => (
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
    <form action={action} noValidate className="flex flex-col gap-4">
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
        autoComplete="email"
        label={t("signup.account.email.label")}
        placeholder={t("signup.account.email.placeholder")}
        hint={isOrg ? t("signup.account.email.helpOrg") : t("signup.account.email.help")}
        required
        defaultValue={values.email}
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
          t("signup.account.consent.terms", {
            terms: t("signup.account.consent.termsLink"),
            privacy: t("signup.account.consent.privacyLink"),
          }),
          errors.terms,
        )}
        <p className="-mt-2 ml-8 flex gap-3 text-sm">
          <Link href="/conditions" className="underline" target="_blank">
            {t("signup.account.consent.termsLink")}
          </Link>
          <Link href="/confidentialite" className="underline" target="_blank">
            {t("signup.account.consent.privacyLink")}
          </Link>
        </p>
        {consent("ai", t("signup.account.consent.ai"), errors.ai)}
        {consent("age", t("signup.account.consent.age", { minAge: MIN_AGE }), errors.age)}
        {consent("newsletter", t("signup.account.consent.newsletter"))}
      </fieldset>
      <Button type="submit" size="lg" loading={pending} fullWidth>
        {pending ? t("signup.account.submitting") : t("signup.account.submit")}
      </Button>
    </form>
  );
}

// ─── Codes (step 4 and two-step sign-in) ───────────────────────────

function CodeField({ error, label, help }: { error?: string; label: string; help: string }) {
  return (
    <TextField
      id="code"
      name="code"
      label={label}
      hint={help}
      required
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d*"
      maxLength={CODE_DIGITS}
      className="text-center text-2xl tracking-[0.5em]"
      error={error}
    />
  );
}

export function VerifyEmailForm({ email }: { email: string }) {
  const t = useTranslations();
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(verifyEmail, idle);
  const [resent, resend, resending] = useActionState(resendCode, idle);
  return (
    <div className="flex flex-col gap-4">
      {resent.status === "sent" && (
        <Alert tone="success" title={t("signup.verify.resent", { email })} />
      )}
      {resent.error && <Alert tone="error" title={errorText(resent.error) ?? ""} />}
      <form action={action} noValidate className="flex flex-col gap-4">
        <CodeField
          label={t("signup.verify.code.label")}
          help={t("signup.verify.code.help", { minutes: CODE_MINUTES })}
          error={errorText(state.errors?.code)}
        />
        <Button type="submit" size="lg" loading={pending} fullWidth>
          {pending ? t("signup.verify.submitting") : t("signup.verify.submit")}
        </Button>
      </form>
      <form action={resend}>
        <Button type="submit" variant="tertiary" loading={resending}>
          {t("signup.verify.resend")}
        </Button>
      </form>
      <p className="text-sm text-ardoise">{t("signup.verify.spam")}</p>
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
