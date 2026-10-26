"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import {
  BANNER_GRADIENTS,
  BANNER_THEMES,
  SIGNUP_SECTORS,
  SIGNUP_SIZES,
  type BannerThemeName,
} from "@/lib/entreprise";
import { interpolate, slot } from "@/lib/interpolate";
import {
  adminBannerAction,
  adminCompanyAction,
  adminDocumentAction,
  adminEnterAction,
  adminInviteAction,
  adminLogoAction,
  adminPaidAction,
  adminPaymentStatusAction,
  adminRoleAction,
  adminSignUpAction,
  adminSocialCompanyAction,
  adminStartFreeAction,
  adminStartPaymentAction,
  adminVerificationAction,
  adminVerifyAction,
  type AdminSignupState,
} from "@/server/actions/admin-signup";
import { resendCode } from "@/server/actions/auth";
import { signInWithProvider } from "@/server/actions/auth";

/**
 * Inscription de l'administrateur d'entreprise sur ordinateur (Modèle B, étape 3 A1, captures 020
 * à 029, Web-Acces.dc.html étapes a-*). À gauche la scène, puis l'aperçu en direct de la page
 * entreprise ; à droite l'étape. Chaque étape enregistre, puis la page passe à la suivante.
 */

export type SignupStep =
  | "forfait"
  | "compte"
  | "code"
  | "role"
  | "entreprise"
  | "logo"
  | "verification"
  | "paiement"
  | "equipe"
  | "pret";

const ORDER: SignupStep[] = [
  "forfait",
  "compte",
  "code",
  "role",
  "entreprise",
  "logo",
  "verification",
  "paiement",
  "equipe",
];
const SCENE: SignupStep[] = ["forfait", "compte", "code"];

const SECTORS = SIGNUP_SECTORS;
const SIZES = SIGNUP_SIZES;
const THEMES = BANNER_THEMES;
type Theme = BannerThemeName;
const BANNERS = BANNER_GRADIENTS;
const OPERATORS = ["mpesa", "orange", "airtel", "carte"] as const;
type Operator = (typeof OPERATORS)[number];
const ROLES = ["recruiter", "hiring_manager", "viewer"] as const;
type InviteRole = (typeof ROLES)[number];

export type PlanOption = {
  code: string;
  name: string;
  priceCents: number | null;
  users: number | null;
  jobs: number | null;
  recommended: boolean;
  /** What the plan adds, after the users and the jobs (`adminSignup.plan.extra.*`). */
  extra: string;
};

export type SignupOrg = {
  name: string;
  sector: string;
  size: string;
  city: string;
  website: string;
  description: string;
  logo: string | null;
  banner: string | null;
  bannerTheme: string;
  verification: "none" | "pending" | "verified";
  documents: number;
  jobTitle: string;
};

export type SignupData = {
  step: SignupStep;
  plan: string;
  plans: PlanOption[];
  providers: { id: string; label: string }[];
  social: { email: string } | null;
  email: string;
  domain: string | null;
  org: SignupOrg | null;
  current: {
    planName: string;
    paid: boolean;
    paidUntil: string | null;
    seatsMax: number;
    seatsUsed: number;
    pendingInvites: number;
  } | null;
  error?: string;
};

type Draft = {
  name: string;
  sector: string;
  size: string;
  city: string;
  about: string;
  theme: Theme;
  invites: number | null;
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((word) => word[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "E"
  );
}

const href = (step: SignupStep, plan?: string) =>
  `/inscription/entreprise?${new URLSearchParams(plan ? { etape: step, forfait: plan } : { etape: step })}`;

function Check({
  size = 14,
  color = "currentColor",
  width = 3,
}: {
  size?: number;
  color?: string;
  width?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function AdminSignup({ data }: { data: SignupData }) {
  const t = useTranslations("adminSignup");
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flash = (text: string) => {
    setToast(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3200);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const org = data.org;
  const [draft, setDraftState] = useState<Draft>(() => ({
    name: org?.name ?? "",
    sector: org?.sector ?? "",
    size: org?.size ?? "",
    city: org?.city ?? "",
    about: org?.description ?? "",
    theme: (THEMES as readonly string[]).includes(org?.bannerTheme ?? "")
      ? (org!.bannerTheme as Theme)
      : "sapin",
    invites: null,
  }));
  const setDraft = (patch: Partial<Draft>) => setDraftState((value) => ({ ...value, ...patch }));

  const step = data.step;
  const index = ORDER.indexOf(step);
  const scene = SCENE.includes(step);
  return (
    <div className="ae ae-large">
      <aside className="ae-gauche" aria-label={scene ? t("scene.label") : t("preview.title")}>
        <Link href="/" className="ae-marque" aria-label={t("home")}>
          {t("brand")}
          <i />
        </Link>
        {scene ? <Scene /> : <Preview data={data} draft={draft} />}
      </aside>
      <main id="content" className="ae-droite">
        <div className="ae-form">
          {index >= 0 && <StepHead data={data} index={index} />}
          {step === "forfait" && <PlanStep data={data} flash={flash} />}
          {step === "compte" &&
            (data.social ? <SocialStep data={data} /> : <AccountStep data={data} />)}
          {step === "code" && <CodeStep data={data} flash={flash} />}
          {step === "role" && <RoleStep data={data} />}
          {step === "entreprise" && <CompanyStep data={data} draft={draft} setDraft={setDraft} />}
          {step === "logo" && (
            <LogoStep data={data} draft={draft} setDraft={setDraft} flash={flash} />
          )}
          {step === "verification" && <VerifStep data={data} flash={flash} />}
          {step === "paiement" && <PaymentStep data={data} flash={flash} />}
          {step === "equipe" && <TeamStep data={data} setDraft={setDraft} flash={flash} />}
          {step === "pret" && <ReadyStep data={data} />}
        </div>
      </main>
      {toast && (
        <div className="ae-toast" role="status">
          <span>{toast}</span>
          <button
            type="button"
            className="ae-rond"
            onClick={() => setToast(null)}
            aria-label={t("close")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Partie gauche ───────────────────────────────────────────────────

const ORBIT_1 = [
  ["GM", "100%", "50%", "#DDF6EE", "#14745F"],
  ["BT", "25%", "93.2%", "#F9E3C8", "#8A4B12"],
  ["EK", "25%", "6.8%", "#FBE3EF", "#8A2D5C"],
] as const;
const ORBIT_2 = [
  ["MD", "100%", "50%", "#E3E8FB", "#2D3F8A"],
  ["NI", "25%", "93.3%", "#E8F0D8", "#4F6B12"],
  ["RK", "25%", "6.7%", "#EDE3FB", "#5A2D8A"],
] as const;

function Orbit({
  items,
  className,
}: {
  items: typeof ORBIT_1 | typeof ORBIT_2;
  className: string;
}) {
  return (
    <div className={`ae-orbite ${className}`} aria-hidden="true">
      <span className="ae-cercle" />
      {items.map(([mark, left, top, background, color]) => (
        <span
          key={mark}
          className="ae-av"
          style={{ left: `calc(${left} - 24px)`, top: `calc(${top} - 24px)`, background, color }}
        >
          {mark}
        </span>
      ))}
    </div>
  );
}

function Scene() {
  const t = useTranslations("adminSignup");
  return (
    <div className="ae-scene">
      <Orbit items={ORBIT_1} className="ae-orbite-1" />
      <Orbit items={ORBIT_2} className="ae-orbite-2" />
      <div className="ae-coeur" aria-hidden="true">
        {t("brand").charAt(0)}
        <i />
      </div>
      <div className="ae-flot" style={{ left: 60, top: 150, width: 230 }} aria-hidden="true">
        <span className="ae-flot-ligne" style={{ gap: 10 }}>
          <span
            className="ae-av"
            style={{ width: 36, height: 36, fontSize: 12, background: "#DDF6EE", color: "#14745F" }}
          >
            {t("scene.mark")}
          </span>
          <span style={{ flex: 1 }}>
            <b style={{ display: "block", fontSize: 13 }}>{t("scene.name")}</b>
            <span className="ae-meta" style={{ fontSize: 11, fontWeight: 400 }}>
              {t("scene.job")}
            </span>
          </span>
          <span className="ae-score">{t("scene.score")}</span>
        </span>
        <span style={{ display: "block", fontSize: 11.5, color: "#5FE0B8", marginTop: 8 }}>
          {t("scene.why")}
        </span>
      </div>
      <div
        className="ae-flot"
        style={{ right: 50, top: 300, animationDelay: "-2s" }}
        aria-hidden="true"
      >
        <span className="ae-flot-ligne">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4.5 6.5h15v13h-15zM4.5 10.5h15M8.5 4v4M15.5 4v4" />
          </svg>
          {t("scene.interview")}
        </span>
      </div>
      <div
        className="ae-flot"
        style={{ left: 90, bottom: 170, animationDelay: "-4s" }}
        aria-hidden="true"
      >
        <span className="ae-flot-ligne">
          <Check size={18} color="#A6F26B" width={2.6} />
          {t("scene.answer")}
        </span>
      </div>
      <div className="ae-accroche">
        <p>{t("accroche")}</p>
        <p className="ae-meta" style={{ marginTop: 12, fontSize: 14 }}>
          {t("tagline")}
        </p>
      </div>
    </div>
  );
}

function Preview({ data, draft }: { data: SignupData; draft: Draft }) {
  const t = useTranslations("adminSignup");
  const org = data.org;
  const name = draft.name || t("preview.name");
  const facts = [
    draft.sector ? t(`company.sectors.${draft.sector as "fintech"}`) : "",
    draft.city,
    draft.size ? t(`company.sizesLong.${draft.size as "s"}`) : "",
  ].filter(Boolean);
  const verification =
    org?.verification === "verified"
      ? t("preview.verified")
      : org?.verification === "pending" || (org?.documents ?? 0) > 0
        ? t("preview.pending")
        : t("preview.unverified");
  const invites = draft.invites ?? data.current?.pendingInvites ?? 0;
  const planName =
    data.plans.find((plan) => plan.code === data.plan)?.name ?? data.current?.planName ?? "";
  return (
    <div className="ae-apercu">
      <p className="ae-meta" style={{ fontWeight: 700, marginBottom: 14 }}>
        {t("preview.title")}
      </p>
      <div className="ae-carte" data-testid="apercu-entreprise">
        <div
          className="ae-banniere"
          style={{
            backgroundImage: org?.banner ? `url(${org.banner})` : BANNERS[draft.theme],
          }}
        />
        <div style={{ padding: "0 22px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: -36 }}>
            {org?.logo ? (
              <span className="ae-logo ae-logo-plein">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={org.logo} alt="" />
              </span>
            ) : (
              <span className="ae-logo ae-logo-vide">{initials(name)}</span>
            )}
          </div>
          <b style={{ display: "block", fontSize: 21, marginTop: 12 }}>{name}</b>
          {facts.length > 0 && (
            <p className="ae-meta" style={{ marginTop: 2 }}>
              {facts.join(" · ")}
            </p>
          )}
          <p style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 12, color: "#C9D6D2" }}>
            {draft.about || t("preview.about")}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <span className="ae-tag">{verification}</span>
            {planName && (
              <span className="ae-tag ae-tag-lime">{t("preview.plan", { plan: planName })}</span>
            )}
            <span className="ae-tag">{t("preview.invites", { count: invites })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── En-tête d'étape ─────────────────────────────────────────────────

const backOf = (step: SignupStep, plan: string): string | null => {
  switch (step) {
    case "forfait":
      return "/";
    case "compte":
      return href("forfait", plan);
    case "code":
      return href("compte", plan);
    // Le compte existe : on ne revient pas avant le rôle.
    case "role":
      return null;
    default: {
      const index = ORDER.indexOf(step);
      return index > 0 ? href(ORDER[index - 1]) : null;
    }
  }
};

function StepHead({ data, index }: { data: SignupData; index: number }) {
  const t = useTranslations("adminSignup");
  const step = ORDER[index];
  const back = backOf(step, data.plan);
  return (
    <div>
      <div className="ae-tete">
        {back && (
          <Link href={back} className="ae-rond" aria-label={t("back")}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 5 8 12l7 7" />
            </svg>
          </Link>
        )}
        <span className="ae-meta" style={{ fontWeight: 700 }}>
          {t("step", { n: index + 1, total: ORDER.length })}
        </span>
      </div>
      <span className="ae-barre" aria-hidden="true">
        <i style={{ width: `${Math.round(((index + 1) / ORDER.length) * 100)}%` }} />
      </span>
      <h1 className="ae-titre">{t(`steps.${step as "forfait"}.title`)}</h1>
      <p className="ae-meta ae-sous">{t(`steps.${step as "forfait"}.subtitle`)}</p>
    </div>
  );
}

function Submit({ children, pending }: { children: ReactNode; pending?: boolean }) {
  const t = useTranslations("adminSignup");
  return (
    <div className="ae-actions">
      <button type="submit" className="ae-btn" disabled={pending}>
        {pending ? t("saving") : children}
      </button>
    </div>
  );
}

function useErrorText() {
  const t = useTranslations();
  return (code?: string) => {
    if (!code) return undefined;
    if (code.startsWith("auth.error.")) return t(code as "auth.error.server");
    if (code === "termsRequired") return t("adminSignup.account.error.terms");
    if (code === "orgNameRequired") return t("adminSignup.account.error.org");
    if (
      [
        "required",
        "nameInvalid",
        "emailInvalid",
        "emailTaken",
        "passwordTooShort",
        "passwordWeak",
        "passwordCommon",
      ].includes(code)
    )
      return t(`auth.error.${code}` as "auth.error.required");
    return t(`adminSignup.${code}` as "adminSignup.code.error");
  };
}

function FieldError({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <p id={id} className="ae-erreur" role="alert">
      {text}
    </p>
  );
}

// ─── 1 · Formule ─────────────────────────────────────────────────────

function PlanStep({ data, flash }: { data: SignupData; flash: (text: string) => void }) {
  const t = useTranslations("adminSignup");
  const format = useFormatter();
  const router = useRouter();
  const [plan, setPlan] = useState(data.plan);
  const [quote, setQuote] = useState(false);
  const price = (cents: number) =>
    `${format.number(cents / 100, { maximumFractionDigits: 2 })} USD`;
  return (
    <div>
      <div
        role="radiogroup"
        aria-label={t("steps.forfait.title")}
        style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}
      >
        {data.plans.map((item) => {
          const premium = item.priceCents === null;
          const on = !premium && plan === item.code;
          const facts = [
            item.users !== null
              ? premium
                ? t("plan.usersMore", { count: item.users })
                : t("plan.users", { count: item.users })
              : "",
            item.jobs !== null && !premium ? t("plan.jobs", { count: item.jobs }) : "",
            item.extra,
          ].filter(Boolean);
          return (
            <button
              key={item.code}
              type="button"
              role="radio"
              aria-checked={on}
              className="ae-formule"
              onClick={() => {
                if (premium) {
                  setQuote(true);
                  flash(t("plan.quoteNote"));
                } else setPlan(item.code);
              }}
            >
              <span className={on ? "ae-case ae-case-on" : "ae-case"}>{on && <Check />}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <b style={{ fontSize: 16 }}>{item.name}</b>
                  <b className="ae-prix">
                    {premium
                      ? t("plan.quote")
                      : item.priceCents
                        ? t("plan.monthly", { price: price(item.priceCents) })
                        : t("plan.free")}
                  </b>
                </span>
                <span
                  className="ae-meta"
                  style={{ display: "block", fontSize: 12.5, marginTop: 4, lineHeight: 1.45 }}
                >
                  {facts.join(" · ")}
                </span>
                {item.recommended && (
                  <span className="ae-tag ae-tag-lime" style={{ marginTop: 8 }}>
                    {t("plan.recommended")}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {quote && (
        <p className="ae-meta" style={{ fontSize: 13, marginTop: 12 }} role="status">
          {t("plan.quoteNote")} <Link href="/contact?sujet=devis">{t("plan.quoteLink")}</Link>
        </p>
      )}
      <p className="ae-meta" style={{ fontSize: 12.5, marginTop: 6 }}>
        {t("plan.applyFree")}
      </p>
      <div className="ae-actions">
        <button type="button" className="ae-btn" onClick={() => router.push(href("compte", plan))}>
          {t("continue")}
        </button>
      </div>
    </div>
  );
}

// ─── 2 · Compte de l'entreprise ──────────────────────────────────────

const initial: AdminSignupState = { status: "idle" };

function Terms({ on, toggle, error }: { on: boolean; toggle: () => void; error?: string }) {
  const t = useTranslations("adminSignup.account");
  return (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 18 }}>
        <button
          type="button"
          role="checkbox"
          aria-checked={on}
          aria-labelledby="ae-conditions"
          aria-describedby={error ? "ae-conditions-erreur" : undefined}
          onClick={toggle}
          className={on ? "ae-case ae-case-on" : "ae-case"}
        >
          {on && <Check />}
        </button>
        <span id="ae-conditions" style={{ fontSize: 13.5, lineHeight: 1.5, color: "#C9D6D2" }}>
          {interpolate(t("terms", { terms: slot("terms"), privacy: slot("privacy") }), {
            terms: <Link href="/conditions">{t("termsLink")}</Link>,
            privacy: <Link href="/confidentialite">{t("privacyLink")}</Link>,
          })}
        </span>
      </div>
      <input type="hidden" name="terms" value={on ? "on" : ""} />
      <FieldError id="ae-conditions-erreur" text={error} />
    </>
  );
}

function AccountStep({ data }: { data: SignupData }) {
  const t = useTranslations("adminSignup");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(adminSignUpAction, initial);
  const [terms, setTerms] = useState(state.values?.terms === "on");
  const err = (field: string) => errorText(state.errors?.[field]);
  const field = (
    name: string,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <>
      <label className="ae-lab" htmlFor={`ae-${name}`}>
        {label}
      </label>
      <input
        id={`ae-${name}`}
        name={name}
        className="ae-in"
        defaultValue={state.values?.[name]}
        aria-invalid={err(name) ? true : undefined}
        aria-describedby={err(name) ? `ae-${name}-erreur` : undefined}
        {...props}
      />
      <FieldError id={`ae-${name}-erreur`} text={err(name)} />
    </>
  );
  return (
    <div>
      {data.providers.length > 0 && (
        <>
          <form className="ae-fournisseurs">
            <input type="hidden" name="profil" value="company" />
            <input type="hidden" name="forfait" value={data.plan} />
            {data.providers.map((provider) => (
              <button
                key={provider.id}
                type="submit"
                formAction={signInWithProvider.bind(null, provider.id)}
                formNoValidate
                className="ae-btn2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/marque/fournisseurs/${provider.id}.svg`}
                  alt=""
                  width={20}
                  height={20}
                />
                {provider.label}
              </button>
            ))}
          </form>
          <p className="ae-ou ae-meta">{t("account.or")}</p>
        </>
      )}
      <form
        action={action}
        noValidate
        key={state.status === "idle" ? "a" : JSON.stringify(state.values)}
      >
        <input type="hidden" name="plan" value={data.plan} />
        {field("name", t("account.name"), {
          autoComplete: "name",
          placeholder: t("account.name"),
          required: true,
        })}
        {field("orgName", t("account.org"), {
          autoComplete: "organization",
          placeholder: t("account.org"),
          required: true,
        })}
        {field("email", t("account.email"), {
          type: "email",
          autoComplete: "email",
          placeholder: t("account.email"),
          required: true,
        })}
        {field("password", t("account.password"), {
          type: "password",
          autoComplete: "new-password",
          placeholder: t("account.passwordPlaceholder"),
          required: true,
        })}
        <Terms on={terms} toggle={() => setTerms((value) => !value)} error={err("terms")} />
        <FieldError id="ae-compte-erreur" text={errorText(state.error)} />
        <Submit pending={pending}>{t("continue")}</Submit>
      </form>
    </div>
  );
}

function SocialStep({ data }: { data: SignupData }) {
  const t = useTranslations("adminSignup");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(adminSocialCompanyAction, initial);
  const [terms, setTerms] = useState(false);
  const err = errorText(state.errors?.orgName);
  return (
    <form action={action} noValidate>
      <p style={{ fontSize: 14.5, marginTop: 22 }}>
        {t("account.social", { email: data.social?.email ?? "" })}
      </p>
      <input type="hidden" name="plan" value={data.plan} />
      <label className="ae-lab" htmlFor="ae-orgName">
        {t("account.org")}
      </label>
      <input
        id="ae-orgName"
        name="orgName"
        className="ae-in"
        autoComplete="organization"
        placeholder={t("account.org")}
        defaultValue={state.values?.orgName}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? "ae-orgName-erreur" : undefined}
      />
      <FieldError id="ae-orgName-erreur" text={err} />
      <Terms
        on={terms}
        toggle={() => setTerms((value) => !value)}
        error={errorText(state.errors?.terms)}
      />
      <Submit pending={pending}>{t("continue")}</Submit>
    </form>
  );
}

// ─── 3 · Code ────────────────────────────────────────────────────────

function CodeStep({ data, flash }: { data: SignupData; flash: (text: string) => void }) {
  const t = useTranslations("adminSignup");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(adminVerifyAction, initial);
  const [sending, startSending] = useTransition();
  const err = errorText(state.errors?.code);
  return (
    <form action={action} noValidate>
      <p style={{ fontSize: 14.5, marginTop: 22 }}>
        {interpolate(t("code.sentTo", { email: slot("email") }), { email: <b>{data.email}</b> })}
      </p>
      <label className="ae-lab" htmlFor="ae-code">
        {t("code.label")}
      </label>
      <input
        id="ae-code"
        name="code"
        className="ae-in ae-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={7}
        aria-label={t("code.aria")}
        defaultValue={state.values?.code}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? "ae-code-erreur" : undefined}
      />
      <FieldError id="ae-code-erreur" text={err} />
      <button
        type="button"
        className="ae-lien"
        style={{ marginTop: 12 }}
        disabled={sending}
        onClick={() =>
          startSending(async () => {
            const result = await resendCode({ status: "idle" });
            flash(
              result.error
                ? (errorText(`auth.error.${result.error}`) ?? "")
                : t("code.resent", { email: data.email }),
            );
          })
        }
      >
        {t("code.resend")}
      </button>
      <Submit pending={pending}>{t("continue")}</Submit>
    </form>
  );
}

// ─── 4 · Rôle ────────────────────────────────────────────────────────

function RoleStep({ data }: { data: SignupData }) {
  const t = useTranslations("adminSignup");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(adminRoleAction, initial);
  const err = errorText(state.errors?.jobTitle);
  return (
    <form action={action} noValidate>
      <label className="ae-lab" htmlFor="ae-poste">
        {t("role.label")}
      </label>
      <input
        id="ae-poste"
        name="jobTitle"
        className="ae-in"
        autoComplete="organization-title"
        placeholder={t("role.placeholder")}
        defaultValue={state.values?.jobTitle ?? data.org?.jobTitle}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? "ae-poste-erreur" : undefined}
      />
      <FieldError id="ae-poste-erreur" text={err} />
      <div className="ae-encadre ae-encadre-lime">
        <b style={{ display: "block", fontSize: 15.5 }}>{t("role.card.title")}</b>
        {(["l1", "l2", "l3", "l4"] as const).map((key) => (
          <div key={key} className="ae-li">
            <i />
            <span>{t(`role.card.${key}`)}</span>
          </div>
        ))}
      </div>
      <p className="ae-meta" style={{ fontSize: 13, marginTop: 14 }}>
        {t("role.note")}
      </p>
      <Submit pending={pending}>{t("continue")}</Submit>
    </form>
  );
}

// ─── 5 · L'entreprise ────────────────────────────────────────────────

function Pills({
  label,
  name,
  items,
  value,
  onPick,
}: {
  label: string;
  name: string;
  items: { key: string; text: string }[];
  value: string;
  onPick: (key: string) => void;
}) {
  return (
    <>
      <span className="ae-lab" id={`ae-${name}-lab`}>
        {label}
      </span>
      <div className="ae-pills" role="radiogroup" aria-labelledby={`ae-${name}-lab`}>
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="radio"
            aria-checked={value === item.key}
            className="ae-pill"
            onClick={() => onPick(item.key)}
          >
            {item.text}
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={value} />
    </>
  );
}

function CompanyStep({
  data,
  draft,
  setDraft,
}: {
  data: SignupData;
  draft: Draft;
  setDraft: (patch: Partial<Draft>) => void;
}) {
  const t = useTranslations("adminSignup");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(adminCompanyAction, initial);
  return (
    <form action={action} noValidate>
      <Pills
        label={t("company.sector")}
        name="sector"
        items={SECTORS.map((key) => ({ key, text: t(`company.sectors.${key}`) }))}
        value={draft.sector}
        onPick={(sector) => setDraft({ sector })}
      />
      <Pills
        label={t("company.size")}
        name="size"
        items={SIZES.map((key) => ({ key, text: t(`company.sizes.${key}`) }))}
        value={draft.size}
        onPick={(size) => setDraft({ size })}
      />
      <label className="ae-lab" htmlFor="ae-ville">
        {t("company.city")}
      </label>
      <input
        id="ae-ville"
        name="city"
        className="ae-in"
        autoComplete="address-level2"
        placeholder={t("company.cityPlaceholder")}
        value={draft.city}
        onChange={(event) => setDraft({ city: event.target.value })}
      />
      <label className="ae-lab" htmlFor="ae-site">
        {t("company.website")}
      </label>
      <input
        id="ae-site"
        name="website"
        className="ae-in"
        inputMode="url"
        autoComplete="url"
        placeholder={t("company.websitePlaceholder")}
        defaultValue={state.values?.website ?? data.org?.website.replace(/^https?:\/\//, "")}
      />
      <label className="ae-lab" htmlFor="ae-apropos">
        {t("company.about")}
      </label>
      <textarea
        id="ae-apropos"
        name="description"
        className="ae-ta"
        maxLength={3000}
        placeholder={t("company.aboutPlaceholder")}
        value={draft.about}
        onChange={(event) => setDraft({ about: event.target.value })}
      />
      <FieldError id="ae-entreprise-erreur" text={errorText(state.error)} />
      <Submit pending={pending}>{t("continue")}</Submit>
    </form>
  );
}

// ─── 6 · Logo et bannière ────────────────────────────────────────────

function LogoStep({
  data,
  draft,
  setDraft,
  flash,
}: {
  data: SignupData;
  draft: Draft;
  setDraft: (patch: Partial<Draft>) => void;
  flash: (text: string) => void;
}) {
  const t = useTranslations("adminSignup");
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [saving, startSaving] = useTransition();
  const logo = data.org?.logo;
  return (
    <form action={(formData) => startSaving(() => adminBannerAction(formData))}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 24 }}>
        {logo ? (
          <span className="ae-mini" style={{ width: 96, height: 96, borderRadius: 26 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={t("logo.title")} />
          </span>
        ) : (
          <span
            className="ae-logo ae-logo-vide"
            style={{ width: 96, height: 96, borderRadius: 26, fontSize: 28 }}
            aria-hidden="true"
          >
            {initials(draft.name)}
          </span>
        )}
        <div>
          <b style={{ display: "block", fontSize: 15 }}>{t("logo.title")}</b>
          <p className="ae-meta" style={{ fontSize: 12.5, margin: "4px 0 10px" }}>
            {t("logo.hint")}
          </p>
          <button
            type="button"
            className="ae-btn2"
            style={{ height: 42 }}
            disabled={uploading}
            onClick={() => file.current?.click()}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 7.5h3l1.5-2h7l1.5 2h3v11H4zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            </svg>
            {uploading ? t("saving") : logo ? t("logo.change") : t("logo.import")}
          </button>
          <input
            ref={file}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="ae-sr"
            tabIndex={-1}
            aria-hidden="true"
            data-testid="logo-fichier"
            onChange={(event) => {
              const chosen = event.target.files?.[0];
              event.target.value = "";
              if (!chosen) return;
              const form = new FormData();
              form.set("image", chosen);
              startUpload(async () => {
                const result = await adminLogoAction(form);
                if (result.ok) {
                  flash(t("logo.added"));
                  router.refresh();
                } else flash(t(`logo.error.${result.code}`));
              });
            }}
          />
        </div>
      </div>
      <span className="ae-lab" id="ae-banniere-lab">
        {t("banner.title")}
      </span>
      <div style={{ display: "flex", gap: 10 }} role="radiogroup" aria-labelledby="ae-banniere-lab">
        {THEMES.map((theme) => (
          <button
            key={theme}
            type="button"
            role="radio"
            aria-checked={draft.theme === theme}
            aria-label={t("banner.aria", { name: t(`banner.themes.${theme}`) })}
            className="ae-swatch"
            style={{ background: BANNERS[theme] }}
            onClick={() => setDraft({ theme })}
          />
        ))}
      </div>
      <input type="hidden" name="theme" value={draft.theme} />
      <p className="ae-meta" style={{ fontSize: 12.5, marginTop: 10 }}>
        {t("banner.hint")}
      </p>
      <Submit pending={saving}>{t("continue")}</Submit>
    </form>
  );
}

// ─── 7 · Vérification ────────────────────────────────────────────────

function VerifStep({ data, flash }: { data: SignupData; flash: (text: string) => void }) {
  const t = useTranslations("adminSignup");
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [saving, startSaving] = useTransition();
  const added = (data.org?.documents ?? 0) > 0;
  return (
    <form action={() => startSaving(() => adminVerificationAction())}>
      <div className="ae-opt" style={{ marginTop: 24 }}>
        <Check size={22} color="#A6F26B" width={2.6} />
        <span style={{ flex: 1 }}>
          <b style={{ display: "block", fontSize: 15 }}>
            {data.domain
              ? t("verif.domain", { domain: data.domain })
              : t("verif.personal", { email: data.email })}
          </b>
          <span className="ae-meta" style={{ fontSize: 12.5 }}>
            {data.domain ? t("verif.domainHint") : t("verif.personalHint")}
          </span>
        </span>
      </div>
      <div className="ae-opt" style={{ marginTop: 10 }}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ flex: "none" }}
        >
          <path d="M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 13h6M9 16.5h4" />
        </svg>
        <span style={{ flex: 1 }}>
          <b style={{ display: "block", fontSize: 15 }}>{t("verif.registry")}</b>
          <span className="ae-meta" style={{ fontSize: 12.5 }}>
            {t("verif.registryHint")}
          </span>
        </span>
        {added ? (
          <span className="ae-tag">{t("verif.added")}</span>
        ) : (
          <button
            type="button"
            className="ae-btn2"
            style={{ height: 38 }}
            disabled={uploading}
            aria-label={t("verif.importAria")}
            onClick={() => file.current?.click()}
          >
            {uploading ? t("saving") : t("verif.import")}
          </button>
        )}
        <input
          ref={file}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="ae-sr"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="document-fichier"
          onChange={(event) => {
            const chosen = event.target.files?.[0];
            event.target.value = "";
            if (!chosen) return;
            const form = new FormData();
            form.set("document", chosen);
            startUpload(async () => {
              const result = await adminDocumentAction(form);
              if (result.ok) {
                flash(t("verif.addedToast"));
                router.refresh();
              } else flash(t(`verif.error.${result.code as "fileType"}`));
            });
          }}
        />
      </div>
      <p className="ae-meta" style={{ fontSize: 13, marginTop: 16, lineHeight: 1.5 }}>
        {t("verif.note")}
      </p>
      <Submit pending={saving}>{t("continue")}</Submit>
    </form>
  );
}

// ─── 8 · Paiement ────────────────────────────────────────────────────

function PaymentStep({ data, flash }: { data: SignupData; flash: (text: string) => void }) {
  const t = useTranslations("adminSignup");
  const format = useFormatter();
  const [pending, start] = useTransition();
  const plan = data.plans.find((item) => item.code === data.plan);
  const paid = !!plan?.priceCents;
  const [operator, setOperator] = useState<Operator>("mpesa");
  const [number, setNumber] = useState("");
  const [payment, setPayment] = useState<{ id: string; status: string } | null>(null);
  const [error, setError] = useState<string | undefined>(
    data.error === "unpaid" ? t("pay.error.unpaid") : undefined,
  );
  const amount = plan?.priceCents
    ? `${format.number(plan.priceCents / 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
    : "";
  const operatorName = t(`pay.operators.${operator}`);

  const settle = (id: string, status: string | null) => {
    if (!status || status === "pending") return false;
    if (status === "failed" || status === "expired") {
      setError(t(`pay.error.${status}`));
      setPayment(null);
    } else {
      if (status === "succeeded") flash(t("pay.okToast"));
      setPayment({ id, status });
    }
    return true;
  };
  // Attente : la réponse du prestataire est lue toutes les 3 secondes.
  useEffect(() => {
    if (payment?.status !== "pending") return;
    const timer = setInterval(async () => {
      settle(payment.id, await adminPaymentStatusAction(payment.id));
    }, 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment]);

  if (!paid) {
    return (
      <form action={() => start(() => adminPaidOrFree())}>
        <div className="ae-encadre" style={{ marginTop: 24 }}>
          <b style={{ display: "block", fontSize: 16 }}>{t("pay.free.title")}</b>
          <p className="ae-meta" style={{ marginTop: 6 }}>
            {t("pay.free.text")}
          </p>
        </div>
        <Submit pending={pending}>{t("continue")}</Submit>
      </form>
    );
  }

  const ok = data.current?.paid || payment?.status === "succeeded";
  const until = data.current?.paidUntil;
  return (
    <div>
      <div
        className="ae-encadre"
        style={{ marginTop: 22, padding: "16px 18px", display: "flex", alignItems: "center" }}
      >
        <span style={{ flex: 1 }}>
          <b style={{ display: "block", fontSize: 16 }}>{t("pay.plan", { plan: plan.name })}</b>
          <span className="ae-meta" style={{ fontSize: 12.5 }}>
            {t("pay.monthly")}
          </span>
        </span>
        <b style={{ fontSize: 20, color: "#A6F26B" }}>{amount}</b>
      </div>
      {ok ? (
        <form action={() => start(() => adminPaidAction())}>
          <div
            className="ae-encadre"
            style={{
              marginTop: 18,
              background: "rgba(166,242,107,.1)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
            role="status"
          >
            <Check size={26} color="#A6F26B" width={2.6} />
            <span>
              <b style={{ display: "block", fontSize: 16 }}>{t("pay.ok.title")}</b>
              {until && (
                <span className="ae-meta" style={{ fontSize: 12.5 }}>
                  {t("pay.ok.text", {
                    date: format.dateTime(new Date(until), { day: "numeric", month: "long" }),
                  })}
                </span>
              )}
            </span>
          </div>
          <Submit pending={pending}>{t("continue")}</Submit>
        </form>
      ) : payment?.status === "pending" ? (
        <div style={{ textAlign: "center", padding: "30px 0 0" }} role="status">
          <span className="ae-attente" aria-hidden="true" />
          <b style={{ display: "block", fontSize: 17, marginTop: 16 }}>
            {operator === "carte" ? t("pay.wait.cardTitle") : t("pay.wait.title")}
          </b>
          <p className="ae-meta" style={{ marginTop: 6, lineHeight: 1.5 }}>
            {operator === "carte"
              ? t("pay.wait.cardText")
              : t("pay.wait.text", { operator: operatorName })}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22 }}>
            <button type="button" className="ae-btn2" onClick={() => setPayment(null)}>
              {t("pay.retry")}
            </button>
            <button
              type="button"
              className="ae-btn"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  if (!settle(payment.id, await adminPaymentStatusAction(payment.id)))
                    flash(t("pay.stillPending"));
                })
              }
            >
              {t("pay.confirmed")}
            </button>
          </div>
        </div>
      ) : (
        <form
          noValidate
          action={() =>
            start(async () => {
              setError(undefined);
              const result = await adminStartPaymentAction(
                operator === "carte"
                  ? { method: "card" }
                  : { method: "mobile_money", operator, number },
              );
              if (!result.ok) setError(t(`pay.error.${result.error}`));
              else if (!settle(result.paymentId, result.status))
                setPayment({ id: result.paymentId, status: "pending" });
            })
          }
        >
          <span className="ae-lab" id="ae-moyen-lab">
            {t("pay.method")}
          </span>
          <div className="ae-pills" role="radiogroup" aria-labelledby="ae-moyen-lab">
            {OPERATORS.map((item) => (
              <button
                key={item}
                type="button"
                role="radio"
                aria-checked={operator === item}
                className="ae-pill"
                onClick={() => setOperator(item)}
              >
                {t(`pay.operators.${item}`)}
              </button>
            ))}
          </div>
          {operator === "carte" ? (
            <p className="ae-meta" style={{ fontSize: 13, marginTop: 16, lineHeight: 1.5 }}>
              {t("pay.cardNote")}
            </p>
          ) : (
            <>
              <label className="ae-lab" htmlFor="ae-numero">
                {t("pay.number", { operator: operatorName })}
              </label>
              <input
                id="ae-numero"
                className="ae-in"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t("pay.numberPlaceholder")}
                value={number}
                onChange={(event) => setNumber(event.target.value)}
              />
            </>
          )}
          <FieldError id="ae-paiement-erreur" text={error} />
          <button
            type="submit"
            className="ae-btn"
            style={{ width: "100%", marginTop: 24 }}
            disabled={pending}
          >
            {pending ? t("saving") : t("pay.pay", { amount })}
          </button>
          <button
            type="button"
            className="ae-lien"
            style={{ margin: "14px auto 0", textAlign: "center" }}
            onClick={() =>
              start(async () => {
                flash(t("pay.freeToast"));
                await adminStartFreeAction();
              })
            }
          >
            {t("pay.later")}
          </button>
        </form>
      )}
    </div>
  );
}

/** RH Free : rien à payer, l'étape suivante. */
async function adminPaidOrFree() {
  await adminStartFreeAction();
}

// ─── 9 · L'équipe ────────────────────────────────────────────────────

function TeamStep({
  data,
  setDraft,
  flash,
}: {
  data: SignupData;
  setDraft: (patch: Partial<Draft>) => void;
  flash: (text: string) => void;
}) {
  const t = useTranslations("adminSignup");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(adminInviteAction, initial);
  const [list, setListState] = useState<{ email: string; role: InviteRole }[]>([]);
  // L'aperçu compte les invitations de la liste.
  const setList = (value: { email: string; role: InviteRole }[]) => {
    setListState(value);
    setDraft({ invites: (data.current?.pendingInvites ?? 0) + value.length });
  };
  const [email, setEmail] = useState("");
  const max = data.current?.seatsMax ?? 1;
  const used = data.current?.seatsUsed ?? 1;
  const planName = data.current?.planName ?? "";
  const free = max >= 0 && max <= 1;
  const add = () => {
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return flash(t("team.error.email"));
    if (list.some((item) => item.email === value)) return flash(t("team.error.duplicate"));
    if (max >= 0 && used + list.length + 1 > max)
      return flash(free ? t("team.error.free") : t("team.error.full", { plan: planName }));
    setList([...list, { email: value, role: "recruiter" }]);
    setEmail("");
  };
  const error = state.error
    ? state.error === "team.error.full"
      ? t("team.error.full", { plan: planName })
      : state.error === "team.error.alreadyMember"
        ? t("team.error.alreadyMember", { email: state.values?.email ?? "" })
        : errorText(state.error)
    : undefined;
  return (
    <form action={action} noValidate>
      <input type="hidden" name="invites" value={JSON.stringify(list)} />
      {list.length > 0 && (
        <ul
          style={{
            marginTop: 22,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 0,
            listStyle: "none",
          }}
        >
          {list.map((item, position) => (
            <li key={item.email} className="ae-invite">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <b
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 14,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.email}
                </b>
                <button
                  type="button"
                  aria-label={t("team.remove", { email: item.email })}
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#8FA39E",
                  }}
                  onClick={() => setList(list.filter((_, other) => other !== position))}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
              <div
                style={{ display: "flex", gap: 6, marginTop: 8 }}
                role="radiogroup"
                aria-label={item.email}
              >
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    role="radio"
                    aria-checked={item.role === role}
                    className="ae-pill"
                    onClick={() =>
                      setList(
                        list.map((other, at) => (at === position ? { ...other, role } : other)),
                      )
                    }
                  >
                    {t(`team.roles.${role}`)}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <input
          className="ae-champ"
          type="email"
          aria-label={t("team.emailAria")}
          placeholder={t("team.placeholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="ae-btn2" style={{ height: 52 }} onClick={add}>
          {t("team.add")}
        </button>
      </div>
      <p className="ae-meta" style={{ fontSize: 13, marginTop: 12 }}>
        {max >= 0 ? t("team.seats", { max, plan: planName, count: used + list.length }) : null}
      </p>
      <FieldError id="ae-equipe-erreur" text={error} />
      <Submit pending={pending}>{list.length > 0 ? t("team.send") : t("team.none")}</Submit>
    </form>
  );
}

// ─── Prêt ────────────────────────────────────────────────────────────

function ReadyStep({ data }: { data: SignupData }) {
  const t = useTranslations("adminSignup");
  const [pending, start] = useTransition();
  const org = data.org;
  const name = org?.name ?? "";
  const pendingVerification = org?.verification === "pending";
  return (
    <form action={() => start(() => adminEnterAction())} style={{ paddingTop: 70 }}>
      <span className="ae-mini">
        {org?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={org.logo} alt="" />
        ) : (
          initials(name)
        )}
      </span>
      <h1 className="ae-titre" style={{ marginTop: 22 }}>
        {t("ready.title", { org: name })}
      </h1>
      <div style={{ marginTop: 20 }}>
        <div className="ae-li" style={{ padding: "7px 0" }}>
          <i />
          <span>{pendingVerification ? t("ready.pagePending") : t("ready.page")}</span>
        </div>
        <div className="ae-li" style={{ padding: "7px 0" }}>
          <i />
          <span>{t("ready.plan", { plan: data.current?.planName ?? "" })}</span>
        </div>
        <div className="ae-li" style={{ padding: "7px 0" }}>
          <i />
          <span>{t("ready.invites", { count: data.current?.pendingInvites ?? 0 })}</span>
        </div>
      </div>
      <button
        type="submit"
        className="ae-btn"
        style={{ width: "100%", marginTop: 28 }}
        disabled={pending}
      >
        {pending ? t("saving") : t("ready.enter")}
      </button>
    </form>
  );
}
