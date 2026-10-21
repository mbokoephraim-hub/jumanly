import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CONTACT_EMAIL } from "@/components/recruiter/avatar-menu";
import { CODE_DIGITS } from "@/lib/password";
import { stepHref } from "@/lib/signup-params";
import { signInWithProvider } from "@/server/actions/auth";
import { enabledProviders } from "@/server/auth";
import {
  AccessBack,
  AccessNotice,
  LegalLine,
  OrLine,
  PhoneForgotForm,
  PhoneLoginForm,
  PhoneResetForm,
  ProviderList,
  SignupCodeForm,
  SignupEmailForm,
  SignupPasswordForm,
} from "./auth";
import { legalTexts } from "./legal-texts";

async function providers() {
  const t = await getTranslations("access");
  return enabledProviders().map((id) => ({ id, label: t(`provider.${id}`) }));
}

/** Title and line under it (planche `.h1` and `.sous`). */
function Head({ title, text }: { title: string; text?: React.ReactNode }) {
  return (
    <>
      <h1 className="nb-h1">{title}</h1>
      {text ? <p className="nb-sous">{text}</p> : null}
    </>
  );
}

/** « Bon retour » (Modèle B, planche Connexion). */
export async function PhoneLoginPage({
  next,
  notices,
}: {
  next?: string;
  notices: { tone: "ok" | "err"; text: string }[];
}) {
  const t = await getTranslations("phoneAccueil");
  const list = await providers();
  return (
    <div className="nb-page nb-ecran">
      <AccessBack href="/decouvrir" label={t("back")} />
      <div className="nb-corps">
        <Head title={t("login.title")} text={t("login.subtitle")} />
        {notices.map((notice) => (
          <AccessNotice key={notice.text} tone={notice.tone}>
            {notice.text}
          </AccessNotice>
        ))}
        <ProviderList
          providers={list}
          action={signInWithProvider}
          hidden={{ profil: "talent", next }}
        />
        {list.length > 0 ? <OrLine>{t("login.or")}</OrLine> : null}
        <PhoneLoginForm next={next} />
        <div className="nb-liens">
          <Link href="/mot-de-passe-oublie" className="nb-lien" data-creme="">
            {t("login.forgot")}
          </Link>
          <Link
            href={next ? `/inscription?${new URLSearchParams({ suite: next })}` : "/inscription"}
            className="nb-lien"
          >
            {t("login.signup")}
          </Link>
        </div>
        <p className="nb-pied">
          <Link href="/activer" className="nb-lien" data-creme="">
            {t("login.licence")}
          </Link>
        </p>
      </div>
    </div>
  );
}

/** « Créer votre compte » (Modèle B, planche Inscription): providers, or the e-mail. */
export async function PhoneSignupPage({
  plan,
  next,
  defaultEmail,
}: {
  plan?: { code: string; name: string };
  next?: string;
  defaultEmail?: string;
}) {
  const t = await getTranslations("phoneAccueil");
  const ta = await getTranslations("access");
  const list = await providers();
  return (
    <div className="nb-page nb-ecran">
      <AccessBack href="/decouvrir" label={t("back")} />
      <div className="nb-corps">
        <Head title={t("signup.title")} text={t("signup.subtitle")} />
        {plan ? (
          <AccessNotice tone="ok">{ta("signup.plan", { plan: plan.name })}</AccessNotice>
        ) : null}
        <ProviderList
          providers={list}
          action={signInWithProvider}
          hidden={{ profil: "talent", forfait: plan?.code, next }}
        />
        {list.length > 0 ? <OrLine>{t("signup.or")}</OrLine> : null}
        <SignupEmailForm defaultEmail={defaultEmail} plan={plan?.code} next={next} />
        <p className="nb-centre">
          {t("signup.hasAccount")}{" "}
          <Link href={stepHref("/connexion", { suite: next })} className="nb-lien">
            {t("signup.login")}
          </Link>
        </p>
        <LegalLine texts={await legalTexts()} />
        <p className="nb-pied">
          {t("signup.recruiter")}{" "}
          <Link href="/inscription/forfait?profil=rh" className="nb-lien" data-creme="">
            {t("signup.recruiterLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}

/** « Choisissez un mot de passe » (Modèle B, planche Mot de passe). */
export async function PhonePasswordPage({
  email,
  plan,
  next,
}: {
  email: string;
  plan?: string;
  next?: string;
}) {
  const t = await getTranslations("phoneAccueil");
  return (
    <div className="nb-page nb-ecran">
      <AccessBack
        href={stepHref("/inscription", { forfait: plan, suite: next })}
        label={t("back")}
      />
      <div className="nb-corps">
        <Head title={t("password.title")} text={t("password.subtitle", { email })} />
        <SignupPasswordForm email={email} plan={plan} next={next} />
      </div>
    </div>
  );
}

/** « Vérifiez votre boîte mail » (Modèle B, planche Code). */
export async function PhoneCodePage({ email }: { email: string }) {
  const t = await getTranslations("phoneAccueil");
  const [before = "", after = ""] = t("code.subtitle", { email: "\u0000" }).split("\u0000");
  return (
    <div className="nb-page nb-ecran">
      <AccessBack href="/inscription" label={t("back")} />
      <div className="nb-corps">
        <Head
          title={t("code.title")}
          text={
            <>
              {before}
              <b>{email}</b>
              {after}
            </>
          }
        />
        <SignupCodeForm email={email} />
      </div>
    </div>
  );
}

/** « Mot de passe oublié » (Modèle B, planche Oubli). */
export async function PhoneForgotPage() {
  const t = await getTranslations("phoneAccueil");
  const [before = "", after = ""] = t("forgot.help", { email: "\u0000" }).split("\u0000");
  return (
    <div className="nb-page nb-ecran">
      <AccessBack href="/connexion" label={t("back")} />
      <div className="nb-corps">
        <Head title={t("forgot.title")} text={t("forgot.subtitle", { digits: CODE_DIGITS })} />
        <PhoneForgotForm />
        <p className="nb-meta nb-aide">
          {before}
          <Link href={`mailto:${CONTACT_EMAIL}`} className="nb-lien">
            {CONTACT_EMAIL}
          </Link>
          {after}
        </p>
      </div>
    </div>
  );
}

/** The code and the new password, after « Mot de passe oublié ». */
export async function PhoneResetPage({ email }: { email: string }) {
  const t = await getTranslations("phoneAccueil");
  const ta = await getTranslations("access");
  return (
    <div className="nb-page nb-ecran">
      <AccessBack href="/mot-de-passe-oublie" label={t("back")} />
      <div className="nb-corps">
        <Head title={ta("reset.title")} text={t("code.subtitle", { email })} />
        <PhoneResetForm />
      </div>
    </div>
  );
}
