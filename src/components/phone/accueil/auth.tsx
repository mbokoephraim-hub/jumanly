"use client";

/* eslint-disable @next/next/no-img-element -- tiny static logos of the providers */
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useCountdown, useErrorText } from "@/components/access/forms";
import { formatWait } from "@/components/access/fields";
import { CODE_DIGITS, CODE_MINUTES, PASSWORD_MIN } from "@/lib/password";
import {
  requestPasswordCode,
  resendCode,
  resendPasswordCode,
  resetPasswordWithCode,
  signIn,
  verifyEmail,
  type AuthFormState,
} from "@/server/actions/auth";
import { phoneSignUp, rememberSignupEmail } from "@/server/actions/phone-access";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";

const idle: AuthFormState = { status: "idle" };

/** Head of an Accueil screen (planche `.barreh`): the arrow back, nothing else. */
export function AccessBack({ href, label }: { href: string; label: string }) {
  return (
    <div className="nb-barreh">
      <Link href={href} className="nb-retour" aria-label={label} data-retour="">
        <PhoneIcon name="retour" size={22} stroke={2} />
      </Link>
    </div>
  );
}

/** The error under a field (planche `.erreur`). */
function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="nb-erreur" role="alert">
      {children}
    </p>
  );
}

/** A message of the form, above the fields. */
export function AccessNotice({ tone, children }: { tone: "ok" | "err"; children: ReactNode }) {
  return (
    <p className="nb-avis" data-ton={tone} role={tone === "err" ? "alert" : "status"}>
      {children}
    </p>
  );
}

export type Provider = { id: string; label: string };

/**
 * « Continuer avec Google / Apple / LinkedIn » (planche `.bf`): only the providers configured on
 * this server; the account is chosen on the provider's own screen.
 */
export function ProviderList({
  providers,
  action,
  hidden,
}: {
  providers: Provider[];
  action: (provider: string, formData: FormData) => Promise<void>;
  hidden: Record<string, string | undefined>;
}) {
  if (providers.length === 0) return null;
  return (
    <form className="nb-fournisseurs">
      {Object.entries(hidden).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="submit"
          formAction={action.bind(null, provider.id)}
          formNoValidate
          className="nb-fourn"
        >
          <span className="nb-fourn-logo" data-fournisseur={provider.id}>
            <img src={`/marque/fournisseurs/${provider.id}.svg`} alt="" width={20} height={20} />
          </span>
          <b>{provider.label}</b>
        </button>
      ))}
    </form>
  );
}

/** « ou avec votre e-mail » between two lines. */
export function OrLine({ children }: { children: ReactNode }) {
  return (
    <div className="nb-ou">
      <span />
      <span className="nb-meta">{children}</span>
      <span />
    </div>
  );
}

export type LegalTexts = {
  sentence: { before: string; between: string; after: string };
  terms: { link: string; title: string; points: string[] };
  privacy: { link: string; title: string; points: string[] };
  subtitle: string;
  questions: string;
  full: string;
  ok: string;
  close: string;
};

/**
 * « En continuant, vous acceptez les Conditions et la Politique de confidentialité » : each link
 * opens « L'essentiel en trois points » in a sheet, with the full text one touch away.
 */
export function LegalLine({ texts }: { texts: LegalTexts }) {
  const [open, setOpen] = useState<"terms" | "privacy" | null>(null);
  const shown = open ? texts[open] : null;
  return (
    <>
      <p className="nb-legal">
        {texts.sentence.before}
        <button type="button" onClick={() => setOpen("terms")}>
          {texts.terms.link}
        </button>
        {texts.sentence.between}
        <button type="button" onClick={() => setOpen("privacy")}>
          {texts.privacy.link}
        </button>
        {texts.sentence.after}
      </p>
      <PhoneSheet
        open={open !== null}
        onClose={() => setOpen(null)}
        label={shown?.title ?? ""}
        closeLabel={texts.close}
      >
        {shown ? (
          <>
            <h2>{shown.title}</h2>
            <p className="nb-meta nb-legal-sous">{texts.subtitle}</p>
            <ul className="nb-points">
              {shown.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="nb-meta nb-legal-q">{texts.questions}</p>
            <Link
              href={open === "terms" ? "/conditions" : "/confidentialite"}
              className="nb-lien nb-legal-tout"
            >
              {texts.full}
            </Link>
            <button
              type="button"
              className="nb-annuler"
              data-plein=""
              onClick={() => setOpen(null)}
            >
              {texts.ok}
            </button>
          </>
        ) : null}
      </PhoneSheet>
    </>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** « Adresse e-mail » then « Continuer » (planche Inscription): the address is kept for the code. */
export function SignupEmailForm({
  defaultEmail,
  plan,
  next,
}: {
  defaultEmail?: string;
  plan?: string;
  next?: string;
}) {
  const t = useTranslations("phoneAccueil");
  const [state, action, pending] = useActionState(rememberSignupEmail, idle);
  const [email, setEmail] = useState(state.values?.email ?? defaultEmail ?? "");
  const [error, setError] = useState(false);
  const invalid = error || state.errors?.email !== undefined;
  return (
    <form
      action={action}
      noValidate
      className="nb-form"
      onSubmit={(event) => {
        if (!EMAIL.test(email.trim())) {
          event.preventDefault();
          setError(true);
        }
      }}
    >
      {plan ? <input type="hidden" name="forfait" value={plan} /> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label className="nb-lab" htmlFor="inscription-email">
        {t("signup.email")}
      </label>
      <input
        id="inscription-email"
        className="nb-in"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={t("signup.emailPlaceholder")}
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setError(false);
        }}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? "inscription-email-err" : undefined}
      />
      <FieldError id="inscription-email-err">{invalid ? t("signup.emailError") : null}</FieldError>
      <button
        type="submit"
        className="nb-bp nb-form-envoi"
        data-attente={EMAIL.test(email.trim()) ? undefined : ""}
        disabled={pending}
      >
        {t("signup.continue")}
      </button>
    </form>
  );
}

/** The three rules of the password, checked as the person types (spec partie 10 § 10.1). */
function rules(password: string) {
  return [
    { key: "length", ok: password.length >= PASSWORD_MIN },
    { key: "letter", ok: /\p{L}/u.test(password) },
    { key: "digit", ok: /\d/.test(password) },
  ] as const;
}

/** A strong password the person can keep: four groups of letters and digits. */
function suggestPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  const chars = [...bytes].map((value) => alphabet[value % alphabet.length]);
  const groups = [0, 4, 8, 12].map((start) => chars.slice(start, start + 4).join(""));
  // At least one digit and one letter, whatever the draw.
  return `${groups.join("-")}7a`;
}

/** « Choisissez un mot de passe » (planche Mot de passe): the rules tick as the person types. */
export function SignupPasswordForm({
  email,
  plan,
  next,
}: {
  email: string;
  plan?: string;
  next?: string;
}) {
  const t = useTranslations("phoneAccueil");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(phoneSignUp, idle);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const list = rules(password);
  const ok = list.every((rule) => rule.ok);
  const serverError = state.errors?.password ? errorText(state.errors.password) : undefined;
  return (
    <form
      action={action}
      noValidate
      className="nb-form"
      onSubmit={(event) => {
        if (!ok) {
          event.preventDefault();
          setError(true);
        }
      }}
    >
      {plan ? <input type="hidden" name="plan" value={plan} /> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {/* For the password manager of the phone: the account the password goes with. */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      {state.errors?.email === "emailTaken" ? (
        <AccessNotice tone="err">
          {errorText("emailTaken")} <Link href="/connexion">{t("login.submit")}</Link>
        </AccessNotice>
      ) : state.error ? (
        <AccessNotice tone="err">{errorText(state.error)}</AccessNotice>
      ) : null}
      <label className="nb-lab" htmlFor="inscription-mdp">
        {t("password.label")}
      </label>
      <span className="nb-mdp">
        <input
          id="inscription-mdp"
          className="nb-in"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(false);
            setSuggested(false);
          }}
          aria-invalid={error || serverError ? true : undefined}
          aria-describedby="inscription-mdp-regles"
        />
        <button type="button" onClick={() => setShow((value) => !value)} aria-pressed={show}>
          {show ? t("password.hide") : t("password.show")}
        </button>
      </span>
      <ul id="inscription-mdp-regles" className="nb-regles">
        {list.map((rule) => (
          <li key={rule.key} data-ok={rule.ok ? "" : undefined}>
            <span aria-hidden>{rule.ok ? <PhoneIcon name="coche" size={12} strong /> : null}</span>
            {rule.key === "length"
              ? t("password.ruleLength", { min: PASSWORD_MIN })
              : rule.key === "letter"
                ? t("password.ruleLetter")
                : t("password.ruleDigit")}
          </li>
        ))}
      </ul>
      <FieldError id="inscription-mdp-err">{error ? t("password.error") : serverError}</FieldError>
      <button
        type="button"
        className="nb-pilule"
        onClick={() => {
          setPassword(suggestPassword());
          setShow(true);
          setError(false);
          setSuggested(true);
        }}
      >
        {t("password.suggest")}
      </button>
      {suggested ? (
        <p className="nb-meta nb-aide" role="status">
          {t("password.suggested")}
        </p>
      ) : null}
      <button
        type="submit"
        className="nb-bp nb-form-envoi"
        data-attente={ok ? undefined : ""}
        disabled={pending}
      >
        {pending ? t("password.submitting") : t("password.submit")}
      </button>
    </form>
  );
}

/** Six boxes over one field (planche Code): the code can be pasted or filled by the phone. */
function CodeBoxes({
  value,
  onChange,
  label,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  invalid: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <label className="nb-cases">
      {Array.from({ length: CODE_DIGITS }, (_, index) => (
        <span
          key={index}
          aria-hidden
          data-etat={
            focused && index === value.length ? "actif" : value[index] ? "rempli" : undefined
          }
        >
          {value[index] ?? ""}
        </span>
      ))}
      <input
        name="code"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, CODE_DIGITS))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d*"
        maxLength={CODE_DIGITS}
        aria-label={label}
        aria-invalid={invalid || undefined}
        autoFocus
      />
    </label>
  );
}

/** « Vérifiez votre boîte mail » (planche Code): the 6 digits, « Renvoyer le code ». */
export function SignupCodeForm({ email }: { email: string }) {
  const t = useTranslations("phoneAccueil");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(verifyEmail, idle);
  const [resent, resend, resending] = useActionState(resendCode, idle);
  const [arrival] = useState(() => ({}));
  const wait = useCountdown(resent.status === "sent" ? resent : arrival);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const serverError = state.errors?.code ? errorText(state.errors.code) : undefined;
  return (
    <>
      {resent.status === "sent" ? <AccessNotice tone="ok">{t("code.resent")}</AccessNotice> : null}
      {(state.error ?? resent.error) ? (
        <AccessNotice tone="err">{errorText(state.error ?? resent.error)}</AccessNotice>
      ) : null}
      <form
        id="inscription-code"
        action={action}
        noValidate
        className="nb-form"
        onSubmit={(event) => {
          if (code.length < CODE_DIGITS) {
            event.preventDefault();
            setError(true);
          }
        }}
      >
        <input type="hidden" name="email" value={email} />
        <CodeBoxes
          value={code}
          onChange={(value) => {
            setCode(value);
            setError(false);
          }}
          label={t("code.label")}
          invalid={error || Boolean(serverError)}
        />
        <FieldError id="inscription-code-err">{error ? t("code.error") : serverError}</FieldError>
        <button
          type="submit"
          className="nb-bp nb-form-envoi"
          data-attente={code.length === CODE_DIGITS ? undefined : ""}
          disabled={pending}
        >
          {pending ? t("code.submitting") : t("code.submit")}
        </button>
      </form>
      <form action={resend} className="nb-liens">
        <button type="submit" className="nb-lien" disabled={wait > 0 || resending}>
          {wait > 0 ? t("code.resendIn", { time: formatWait(wait) }) : t("code.resend")}
        </button>
        <Link href="/inscription" className="nb-lien" data-creme="">
          {t("code.change")}
        </Link>
      </form>
      <p className="nb-meta nb-aide">{t("code.help", { minutes: CODE_MINUTES })}</p>
    </>
  );
}

/** « Bon retour » (planche Connexion): e-mail, password, « Mot de passe oublié ? ». */
export function PhoneLoginForm({ next }: { next?: string }) {
  const t = useTranslations("phoneAccueil");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(signIn, idle);
  const [email, setEmail] = useState(state.values?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const ready = EMAIL.test(email.trim()) && password.length > 0;
  return (
    <form
      action={action}
      noValidate
      className="nb-form"
      onSubmit={(event) => {
        if (!ready) {
          event.preventDefault();
          setError(true);
        }
      }}
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <input type="hidden" name="remember" value="on" />
      {state.error ? (
        <AccessNotice tone="err">
          {errorText(state.error)}{" "}
          {state.error === "invalidCredentials" ? (
            <Link href="/mot-de-passe-oublie">{t("login.forgot")}</Link>
          ) : null}
        </AccessNotice>
      ) : null}
      <label className="nb-lab" htmlFor="connexion-email">
        {t("login.email")}
      </label>
      <input
        id="connexion-email"
        className="nb-in"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setError(false);
        }}
      />
      <label className="nb-lab" htmlFor="connexion-mdp">
        {t("login.password")}
      </label>
      <input
        id="connexion-mdp"
        className="nb-in"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setError(false);
        }}
      />
      <FieldError id="connexion-err">{error ? t("login.error") : null}</FieldError>
      <button
        type="submit"
        className="nb-bp nb-form-envoi"
        data-attente={ready ? undefined : ""}
        disabled={pending}
      >
        {pending ? t("login.submitting") : t("login.submit")}
      </button>
    </form>
  );
}

/** « Mot de passe oublié » (planche Oubli): the address, then the code by e-mail. */
export function PhoneForgotForm() {
  const t = useTranslations("phoneAccueil");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(requestPasswordCode, idle);
  const [email, setEmail] = useState(state.values?.email ?? "");
  const [error, setError] = useState(false);
  const serverError = state.errors?.email ? errorText(state.errors.email) : undefined;
  return (
    <form
      id="mot-de-passe-oublie"
      action={action}
      noValidate
      className="nb-form"
      onSubmit={(event) => {
        if (!EMAIL.test(email.trim())) {
          event.preventDefault();
          setError(true);
        }
      }}
    >
      {state.error ? <AccessNotice tone="err">{errorText(state.error)}</AccessNotice> : null}
      <label className="nb-lab" htmlFor="oubli-email">
        {t("login.email")}
      </label>
      <input
        id="oubli-email"
        className="nb-in"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={t("signup.emailPlaceholder")}
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setError(false);
        }}
        autoFocus
      />
      <FieldError id="oubli-err">{error ? t("forgot.error") : serverError}</FieldError>
      <button type="submit" className="nb-bp nb-form-envoi" disabled={pending}>
        {pending ? t("forgot.submitting") : t("forgot.submit")}
      </button>
    </form>
  );
}

/** The code received and the new password (after « Mot de passe oublié »). */
export function PhoneResetForm() {
  const t = useTranslations("phoneAccueil");
  const ta = useTranslations("access");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(resetPasswordWithCode, idle);
  const [resent, resend, resending] = useActionState(resendPasswordCode, idle);
  const [arrival] = useState(() => ({}));
  const wait = useCountdown(resent.status === "sent" ? resent : arrival);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const done = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (state.status === "done") done.current?.focus();
  }, [state.status]);

  if (state.status === "done") {
    const signedIn = state.values?.signedIn === "1";
    return (
      <div className="nb-envoye" role="status">
        <span className="nb-rond-ok" aria-hidden>
          <PhoneIcon name="coche" size={34} strong />
        </span>
        <h1 className="nb-h1">{ta("reset.doneTitle")}</h1>
        <p className="nb-sous">{signedIn ? ta("reset.doneText") : ta("reset.doneLogin")}</p>
        <Link ref={done} href={signedIn ? "/app" : "/connexion"} className="nb-bp nb-form-envoi">
          {signedIn ? ta("reset.continue") : ta("reset.login")}
        </Link>
      </div>
    );
  }
  const list = rules(password);
  return (
    <>
      {resent.status === "sent" ? <AccessNotice tone="ok">{t("code.resent")}</AccessNotice> : null}
      {(state.error ?? resent.error) ? (
        <AccessNotice tone="err">{errorText(state.error ?? resent.error)}</AccessNotice>
      ) : null}
      <form id="reinitialiser" action={action} noValidate className="nb-form">
        <CodeBoxes
          value={code}
          onChange={setCode}
          label={t("code.label")}
          invalid={Boolean(state.errors?.code)}
        />
        <FieldError id="reinitialiser-code-err">
          {state.errors?.code ? errorText(state.errors.code) : null}
        </FieldError>
        <label className="nb-lab" htmlFor="reinitialiser-mdp">
          {ta("reset.password")}
        </label>
        <span className="nb-mdp">
          <input
            id="reinitialiser-mdp"
            className="nb-in"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby="reinitialiser-regles"
          />
          <button type="button" onClick={() => setShow((value) => !value)} aria-pressed={show}>
            {show ? t("password.hide") : t("password.show")}
          </button>
        </span>
        <ul id="reinitialiser-regles" className="nb-regles">
          {list.map((rule) => (
            <li key={rule.key} data-ok={rule.ok ? "" : undefined}>
              <span aria-hidden>
                {rule.ok ? <PhoneIcon name="coche" size={12} strong /> : null}
              </span>
              {rule.key === "length"
                ? t("password.ruleLength", { min: PASSWORD_MIN })
                : rule.key === "letter"
                  ? t("password.ruleLetter")
                  : t("password.ruleDigit")}
            </li>
          ))}
        </ul>
        <FieldError id="reinitialiser-mdp-err">
          {state.errors?.password ? errorText(state.errors.password) : null}
        </FieldError>
        <button type="submit" className="nb-bp nb-form-envoi" disabled={pending}>
          {pending ? ta("reset.submitting") : ta("reset.submit")}
        </button>
      </form>
      <form action={resend} className="nb-liens">
        <button type="submit" className="nb-lien" disabled={wait > 0 || resending}>
          {wait > 0 ? t("code.resendIn", { time: formatWait(wait) }) : t("code.resend")}
        </button>
      </form>
    </>
  );
}
