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
import { TalentIcon } from "@/components/talent/icon";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { interpolate, slot } from "@/lib/interpolate";
import { CODE_DIGITS, CODE_MINUTES, MIN_AGE, PASSWORD_MIN } from "@/lib/password";
import {
  requestPasswordCode,
  resendLink,
  resendPasswordCode,
  resetPassword,
  resetPasswordWithCode,
  sendMagicLinkAction,
  sendTwoFactorCode,
  signIn,
  signUp,
  verifyTwoFactor,
  type AuthFormState,
} from "@/server/actions/auth";
import { AccessBar } from "./frame";
import { CheckLine, CodeInput, PasswordInput, TextInput, formatWait } from "./fields";

const idle: AuthFormState = { status: "idle" };

/** Text of an error code from `auth.error.*`, with the values the texts expect. */
export function useErrorText() {
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

/** A message of the form (planche `.gar`): error, or confirmation. */
function Notice({ tone, children }: { tone: "ok" | "err"; children: ReactNode }) {
  return (
    <p role={tone === "err" ? "alert" : "status"} className={cx("t-gar", `t-${tone}`)}>
      <TalentIcon name={tone === "ok" ? "valider" : "aide"} size="s" />
      <span>{children}</span>
    </p>
  );
}

/** Seconds left before a new code can be asked for; restarts after each sending. */
export function useCountdown(sent: object | undefined, seconds = 60) {
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

const legalLinks = (terms: string, privacy: string) => ({
  terms: (
    <Link href="/conditions" target="_blank" className="underline">
      {terms}
    </Link>
  ),
  privacy: (
    <Link href="/confidentialite" target="_blank" className="underline">
      {privacy}
    </Link>
  ),
});

// ─── Se connecter ──────────────────────────────────────────────────

/**
 * « Bon retour » (planche talent-4, connexion): the providers, the e-mail and the password, and the
 * link by e-mail, which uses the address typed above.
 */
export function LoginForm({ next, providers }: { next?: string; providers?: ReactNode }) {
  const t = useTranslations("access");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(signIn, idle);
  const [magic, sendMagic, sending] = useActionState(sendMagicLinkAction, idle);
  const values = state.values ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-3.5">
      <Hidden fields={{ next, profil: "talent" }} />
      {providers}
      {providers && <div className="t-ou">{t("or")}</div>}
      {state.error && (
        <Notice tone="err">
          {errorText(state.error)}{" "}
          {state.error === "invalidCredentials" && (
            <Link href="/mot-de-passe-oublie" className="font-semibold underline">
              {t("login.forgot")}
            </Link>
          )}
        </Notice>
      )}
      {magic.status === "sent" && (
        <Notice tone="ok">
          {t("login.magicSent", { email: magic.email ?? "", minutes: CODE_MINUTES })}
        </Notice>
      )}
      <TextInput
        id="login-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        label={t("field.email")}
        placeholder={t("field.emailPlaceholder")}
        defaultValue={values.email}
        required
        error={errorText(state.errors?.email ?? magic.errors?.email)}
      />
      <PasswordInput
        id="login-password"
        label={t("field.password")}
        placeholder={t("field.passwordPlaceholder")}
        labelEnd={<Link href="/mot-de-passe-oublie">{t("login.forgot")}</Link>}
        error={errorText(state.errors?.password)}
      />
      <input type="hidden" name="remember" value="on" />
      <button type="submit" className="t-bt t-p t-pl t-press" disabled={pending}>
        {pending ? t("login.submitting") : t("login.submit")}
      </button>
      <button
        type="submit"
        formAction={sendMagic}
        formNoValidate
        disabled={sending}
        className="t-bt t-txt t-lien-m t-press"
      >
        <TalentIcon name="message" size="s" />
        {t("login.magic")}
      </button>
    </form>
  );
}

export function TwoFactorForm({ next }: { next?: string }) {
  const t = useTranslations("access");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(verifyTwoFactor, idle);
  const [sent, send, sending] = useActionState(sendTwoFactorCode, idle);
  const requested = useRef(false);
  const [arrival] = useState(() => ({}));
  const wait = useCountdown(sent.status === "sent" ? sent : arrival);
  useEffect(() => {
    // The code is sent as soon as the page opens; « Renvoyer le code » sends a new one.
    if (requested.current) return;
    requested.current = true;
    startTransition(() => send());
  }, [send]);
  return (
    <>
      {(state.error ?? sent.error) && (
        <Notice tone="err">
          {errorText(state.error ?? sent.error)}{" "}
          <Link href="/connexion" className="font-semibold underline">
            {t("login.submit")}
          </Link>
        </Notice>
      )}
      <form id="deux-etapes" action={action} noValidate className="flex flex-col gap-4">
        <Hidden fields={{ next }} />
        <CodeInput
          label={t("code.label", { digits: CODE_DIGITS })}
          error={errorText(state.errors?.code)}
        />
        <AccessBar>
          <button type="submit" className="t-bt t-p t-pl t-press" disabled={pending}>
            {pending ? t("twoFactor.submitting") : t("twoFactor.submit")}
          </button>
        </AccessBar>
      </form>
      <form action={send} className="t-mention">
        {t("code.notReceived")}{" "}
        <button type="submit" disabled={wait > 0 || sending}>
          {t("code.resend")}
        </button>
        {wait > 0 && ` ${t("code.resendIn", { time: formatWait(wait) })}`}
      </form>
    </>
  );
}

// ─── Mot de passe oublié ───────────────────────────────────────────

export function ForgotForm() {
  const t = useTranslations("access");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(requestPasswordCode, idle);
  return (
    <form id="mot-de-passe-oublie" action={action} noValidate className="flex flex-col gap-3.5">
      <TextInput
        id="forgot-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        label={t("field.email")}
        placeholder={t("field.emailPlaceholder")}
        defaultValue={state.values?.email}
        required
        autoFocus
        error={errorText(state.errors?.email)}
      />
      <p className="t-gar">
        <TalentIcon name="confidentialite" size="s" />
        {t("forgot.safe")}
      </p>
      <AccessBar>
        <button type="submit" className="t-bt t-p t-pl t-press" disabled={pending}>
          {pending ? t("forgot.submitting") : t("forgot.submit")}
        </button>
      </AccessBar>
    </form>
  );
}

/**
 * « Nouveau mot de passe »: the code received by e-mail and the new password. Once saved, the
 * person is signed in on this device and every other session is closed (« Mot de passe modifié »).
 */
export function ResetForm({ email }: { email: string }) {
  const t = useTranslations("access");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(resetPasswordWithCode, idle);
  const [resent, resend, resending] = useActionState(resendPasswordCode, idle);
  const [arrival] = useState(() => ({}));
  const wait = useCountdown(resent.status === "sent" ? resent : arrival);

  if (state.status === "done") {
    // Signed in at once, unless the account asks for its second step at each sign-in.
    const signedIn = state.values?.signedIn === "1";
    return (
      <div className="t-conf" role="status">
        <span className="t-rond-ok">
          <TalentIcon name="valider" />
        </span>
        <h1 className="t-h2s">{t("reset.doneTitle")}</h1>
        <p>{signedIn ? t("reset.doneText") : t("reset.doneLogin")}</p>
        <Link href={signedIn ? "/app" : "/connexion"} className="t-bt t-p t-pl t-press" autoFocus>
          {signedIn ? t("reset.continue") : t("reset.login")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="t-ob-q">
        <h1>{t("reset.title")}</h1>
        <p>{t("reset.sent", { email: maskEmail(email), minutes: CODE_MINUTES })}</p>
      </div>
      {resent.status === "sent" && <Notice tone="ok">{t("code.resent")}</Notice>}
      {(state.error ?? resent.error) && (
        <Notice tone="err">{errorText(state.error ?? resent.error)}</Notice>
      )}
      <form id="reinitialiser" action={action} noValidate className="flex flex-col gap-3.5">
        <CodeInput
          label={t("code.label", { digits: CODE_DIGITS })}
          error={errorText(state.errors?.code)}
        />
        <PasswordInput
          id="reset-password"
          label={t("reset.password")}
          autoComplete="new-password"
          strength
          error={errorText(state.errors?.password)}
        />
        <AccessBar>
          <button type="submit" className="t-bt t-p t-pl t-press" disabled={pending}>
            {pending ? t("reset.submitting") : t("reset.submit")}
          </button>
        </AccessBar>
      </form>
      <form action={resend} className="t-mention">
        {t("code.notReceived")}{" "}
        <button type="submit" disabled={wait > 0 || resending}>
          {t("code.resend")}
        </button>
        {wait > 0 && ` ${t("code.resendIn", { time: formatWait(wait) })}`}
      </form>
    </>
  );
}

/** A reset link sent before the codes: the new password only, then « Se connecter ». */
export function TokenResetForm({ token }: { token: string }) {
  const t = useTranslations("access");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(resetPassword, idle);
  if (state.status === "done") {
    return (
      <div className="t-conf" role="status">
        <span className="t-rond-ok">
          <TalentIcon name="valider" />
        </span>
        <h1 className="t-h2s">{t("reset.doneTitle")}</h1>
        <p>{t("reset.doneLogin")}</p>
        <Link href="/connexion" className="t-bt t-p t-pl t-press" autoFocus>
          {t("reset.login")}
        </Link>
      </div>
    );
  }
  return (
    <>
      <div className="t-ob-q">
        <h1>{t("reset.head")}</h1>
      </div>
      {state.error && (
        <Notice tone="err">
          {errorText(state.error)}{" "}
          <Link href="/mot-de-passe-oublie" className="font-semibold underline">
            {t("forgot.submit")}
          </Link>
        </Notice>
      )}
      <form id="reinitialiser-lien" action={action} noValidate className="flex flex-col gap-3.5">
        <input type="hidden" name="token" value={token} />
        <PasswordInput
          id="reset-link-password"
          label={t("reset.password")}
          autoComplete="new-password"
          strength
          error={errorText(state.errors?.password)}
        />
        <AccessBar>
          <button type="submit" className="t-bt t-p t-pl t-press" disabled={pending}>
            {pending ? t("reset.submitting") : t("reset.submit")}
          </button>
        </AccessBar>
      </form>
    </>
  );
}

/** « g•••••@exemple.cd »: enough to recognise the address on a shared screen. */
export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  return `${name[0]}${"•".repeat(Math.max(2, Math.min(5, name.length - 1)))}@${domain}`;
}

// ─── Inscription ───────────────────────────────────────────────────

/**
 * « Créer un compte » (planche talent-4): first and last name in one field, the e-mail, the
 * password with its strength, the consent and the newsletter. A recruiter also gives the name of
 * the organization, its country and its city (the talent gives them at the first connection).
 */
export function SignupForm({
  profile,
  plan,
  next,
  defaultEmail,
  countries,
}: {
  profile: "talent" | "rh" | "company";
  plan?: string;
  next?: string;
  defaultEmail?: string;
  countries?: { value: string; label: string }[];
}) {
  const t = useTranslations();
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(signUp, idle);
  const values = state.values ?? {};
  const errors = state.errors ?? {};
  const isOrg = profile !== "talent";
  const nameError = errors.name ?? errors.firstName ?? errors.lastName;
  return (
    <form id="inscription-compte" action={action} noValidate className="flex flex-col gap-3.5">
      <Hidden fields={{ profile, plan, next }} />
      {state.error && <Notice tone="err">{errorText(state.error)}</Notice>}
      {errors.email === "emailTaken" && (
        <Notice tone="err">
          {t("auth.error.emailTaken.text")}{" "}
          <Link href="/connexion" className="font-semibold underline">
            {t("auth.error.emailTaken.login")}
          </Link>{" "}
          <Link href="/mot-de-passe-oublie" className="font-semibold underline">
            {t("auth.error.emailTaken.forgot")}
          </Link>
        </Notice>
      )}
      <TextInput
        id="signup-name"
        name="name"
        autoComplete="name"
        label={t("access.account.name")}
        placeholder={t("access.account.namePlaceholder")}
        defaultValue={values.name}
        required
        autoFocus
        error={errorText(nameError)}
      />
      <TextInput
        id="signup-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        label={t("access.field.email")}
        placeholder={t("access.field.emailPlaceholder")}
        defaultValue={values.email ?? defaultEmail}
        required
        error={errors.email === "emailTaken" ? undefined : errorText(errors.email)}
      />
      <PasswordInput
        id="signup-password"
        label={t("access.field.password")}
        autoComplete="new-password"
        strength
        error={errorText(errors.password)}
      />
      {isOrg && (
        <>
          <TextInput
            id="signup-orgName"
            name="orgName"
            autoComplete="organization"
            label={t("signup.account.orgName.label")}
            placeholder={t("signup.account.orgName.placeholder")}
            defaultValue={values.orgName}
            required
            error={errorText(errors.orgName)}
          />
          <TextInput
            id="signup-orgRole"
            name="orgRole"
            autoComplete="organization-title"
            label={t("signup.account.orgRole.label")}
            placeholder={t("signup.account.orgRole.placeholder")}
            defaultValue={values.orgRole}
          />
          <div className="t-champ">
            <label htmlFor="signup-country">{t("signup.account.country.label")}</label>
            <div className={cx("t-verre t-saisie", errors.country && "t-err")}>
              <select
                id="signup-country"
                name="country"
                defaultValue={values.country ?? "CD"}
                required
                aria-invalid={errors.country ? true : undefined}
              >
                {countries?.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <TextInput
            id="signup-city"
            name="city"
            autoComplete="address-level2"
            label={t("signup.account.city.label")}
            placeholder={t("signup.account.city.placeholder")}
            defaultValue={values.city}
            required
            error={errorText(errors.city)}
          />
        </>
      )}
      <CheckLine
        name="terms"
        defaultChecked={values.terms === "on"}
        error={errorText(errors.terms)}
      >
        {interpolate(
          t("access.account.terms", { terms: slot("terms"), privacy: slot("privacy") }),
          legalLinks(t("access.signup.terms"), t("access.signup.privacy")),
        )}
      </CheckLine>
      <CheckLine name="newsletter" defaultChecked={values.newsletter === "on"}>
        {t("access.account.newsletter")}
      </CheckLine>
      <p className="t-aide-c">{t("access.account.termsNote", { minAge: MIN_AGE })}</p>
      <AccessBar>
        <button type="submit" className="t-bt t-p t-pl t-press" disabled={pending}>
          {pending ? t("access.account.submitting") : t("access.account.submit")}
        </button>
      </AccessBar>
    </form>
  );
}

/** « Ouvrez votre boîte mail »: the link of the e-mail confirms the address and opens the space. */
export function VerifyForm({ expired = false }: { expired?: boolean }) {
  const t = useTranslations("access");
  const errorText = useErrorText();
  const [resent, resend, resending] = useActionState(resendLink, idle);
  const [arrival] = useState(() => ({}));
  const wait = useCountdown(resent.status === "sent" ? resent : arrival);
  return (
    <>
      {resent.status === "sent" ? (
        <Notice tone="ok">{t("verify.resent")}</Notice>
      ) : expired ? (
        <Notice tone="err">{t("verify.expired")}</Notice>
      ) : null}
      {resent.error && <Notice tone="err">{errorText(resent.error)}</Notice>}
      <p className="t-aide-c">{t("verify.how")}</p>
      <form id="inscription-lien" action={resend} className="t-mention">
        {t("verify.notReceived")}{" "}
        <button type="submit" disabled={wait > 0 || resending}>
          {t("verify.resend")}
        </button>
        {wait > 0 && ` ${t("code.resendIn", { time: formatWait(wait) })}`}
        <br />
        <Link href="/inscription/compte">{t("verify.change")}</Link>
        <br />
        {t("verify.done")} <Link href="/connexion">{t("verify.login")}</Link>
      </form>
    </>
  );
}
