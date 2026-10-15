import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthEntry, type EntryMode } from "@/components/auth/auth-entry";
import { AuthStage, Words } from "@/components/auth/auth-stage";
import { LoginForm, MagicLinkForm } from "@/components/auth/forms";
import { Logo } from "@/components/brand";
import { Icon } from "@/components/brand/icon";
import { Alert } from "@/components/ui";
import { ButtonLink } from "@/components/ui";
import { pickEntryRole } from "@/lib/auth-entry";
import { interpolate, slot } from "@/lib/interpolate";
import { DELETION_GRACE_DAYS } from "@/lib/password";
import { readSignupParams } from "@/lib/signup-params";
import { signInWithProvider } from "@/server/actions/auth";
import { enabledProviders } from "@/server/auth";
import { getSession } from "@/server/auth/session";

type Params = Record<string, string | string[] | undefined>;

/**
 * /connexion and /inscription: one entry screen, opened on its own tab
 * (docs/refonte-connexion/BRIEF-CONNEXION-V2.md). Alerts, `?suite=`, `?profil=` and `?forfait=`
 * keep their meaning; the forms are the existing ones, restyled.
 */
export async function EntryScreen({ mode, params }: { mode: EntryMode; params: Params }) {
  const { profil, forfait, suite } = readSignupParams(params);
  if (await getSession()) redirect(suite ?? "/app");
  const t = await getTranslations();
  const role = pickEntryRole(profil);
  const providers = enabledProviders().map((id) => ({ id, label: t(`auth.social.${id}`) }));

  const legal = (key: "auth.legal.text" | "signup.entry.legal") => (
    <p className="text-[11.5px] leading-normal text-ardoise">
      {interpolate(t(key, { terms: slot("terms"), privacy: slot("privacy") }), {
        terms: (
          <Link href="/conditions" className="underline">
            {t("auth.legal.terms")}
          </Link>
        ),
        privacy: (
          <Link href="/confidentialite" className="underline">
            {t("auth.legal.privacy")}
          </Link>
        ),
      })}
    </p>
  );

  const heading = (title: string, subtitle: string) => (
    <header>
      <h1 className="text-[26px] leading-[1.1] font-bold tracking-[-0.02em] min-[621px]:text-[32px]">
        {title}
      </h1>
      <p className="mt-2 text-[15px] text-ardoise">{subtitle}</p>
    </header>
  );

  return (
    <AuthEntry
      initialMode={mode}
      initialRole={role}
      roleFromQuery={profil === role}
      next={suite}
      providers={providers}
      socialAction={signInWithProvider}
      signupHidden={{ forfait }}
      labels={{
        rolesLabel: t("auth.stage.rolesLabel"),
        roles: {
          talent: t("auth.stage.roles.talent"),
          rh: t("auth.stage.roles.rh"),
          company: t("auth.stage.roles.company"),
        },
        tabs: {
          aria: t("auth.entry.aria"),
          login: t("auth.entry.loginTab"),
          signup: t("auth.entry.signupTab"),
        },
        social: {
          label: t("auth.social.label"),
          signupLabel: t("auth.social.signupLabel"),
          continue: t("auth.social.aria.continue", { provider: "{provider}" }),
          signup: t("auth.social.aria.signup", { provider: "{provider}" }),
        },
        orEmail: t("auth.orEmail"),
        who: t("signup.entry.who"),
        profiles: {
          talent: t("signup.entry.profiles.talent"),
          rh: t("signup.entry.profiles.rh"),
          company: t("signup.entry.profiles.company"),
        },
        email: {
          label: t("signup.account.email.label"),
          placeholder: t("login.email.placeholder"),
        },
        continue: t("signup.entry.continue"),
        free: t("signup.entry.free"),
        payment: t("signup.entry.payment"),
      }}
      logo={
        <Link href="/" aria-label={t("auth.layout.backHome")}>
          <Logo variant="negative" height={32} />
        </Link>
      }
      stage={<AuthStage />}
      stageFoot={
        <>
          <p className="jm-ae-slogan">
            <Words raw={t.raw("auth.stage.slogan") as string} />
          </p>
          <p>{t("auth.layout.signature")}</p>
        </>
      }
      sideTop={
        <>
          <Link href="/" className="flex items-center gap-1.5 font-semibold hover:underline">
            <Icon name="chev-l" className="size-4" />
            {t("auth.layout.backHome")}
          </Link>
          <span className="text-[12.5px] text-ardoise">{t("footer.language")}</span>
        </>
      }
      sideFoot={
        <>
          {t("auth.layout.signature")}
          <span aria-hidden>{" · "}</span>
          {t("footer.col.contact.pro")}
        </>
      }
      loginHead={
        <>
          {heading(t("login.title"), t("login.subtitle"))}
          {params.deconnecte && <Alert tone="success" title={t("auth.success.logout")} />}
          {params.suppression && (
            <Alert
              tone="warning"
              title={t("login.deletionScheduled", { days: DELETION_GRACE_DAYS })}
            />
          )}
          {params.erreur === "google" && (
            <Alert tone="error" title={t("auth.error.googleFailed")} />
          )}
          {params.erreur === "apple" && <Alert tone="error" title={t("auth.error.appleFailed")} />}
          {params.erreur === "linkedin" && (
            <Alert tone="error" title={t("auth.error.linkedinFailed")} />
          )}
          {suite && (
            <p className="flex items-start gap-3 rounded-[16px] bg-menthe-claire px-4 py-3.5 text-[13px] leading-[19px]">
              <Icon name="jobs" className="mt-px size-4 shrink-0" />
              {t("auth.resume.generic")}
            </p>
          )}
        </>
      }
      loginBody={
        <div className="jm-ae-form jm-ae-panel">
          <LoginForm next={suite} />
          <details className="group">
            <summary className="jm-ae-ghost group-open:mb-4">
              <Icon name="message" className="size-[17px]" />
              {t("login.magic.toggle")}
            </summary>
            <div className="rounded-[20px] bg-blanc p-5">
              <MagicLinkForm next={suite} />
            </div>
          </details>
          <div className="jm-ae-foot">
            <Link href="/activer" className="flex items-center gap-2 font-semibold hover:underline">
              <Icon name="certificat" className="size-4 text-feuille-fonce" />
              {t("login.partnerCode")}
            </Link>
            {legal("auth.legal.text")}
          </div>
        </div>
      }
      signupHead={
        <>
          {heading(t("signup.entry.title"), t("signup.entry.subtitle"))}
          {profil === "partner" && (
            <div className="flex flex-col items-start gap-3 rounded-[20px] bg-blanc p-5 text-sm">
              <p className="font-semibold">{t("signup.profile.partner.redirect.title")}</p>
              <p className="text-ardoise">{t("signup.profile.partner.redirect.text")}</p>
              <ButtonLink href="/partenaires#contact" size="md">
                {t("signup.profile.partner.redirect.cta")}
              </ButtonLink>
            </div>
          )}
        </>
      }
      signupLegal={legal("signup.entry.legal")}
    />
  );
}
