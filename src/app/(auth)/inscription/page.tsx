import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  AuthCard,
  AuthHeading,
  AuthNote,
  ChoiceDot,
  choiceCard,
  choiceRadio,
  SignupFooter,
  SignupStepper,
} from "@/components/auth/auth-card";
import { Icon, type IconName } from "@/components/brand/icon";
import { ButtonLink, Skeleton } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import { pageMetadata } from "@/lib/seo";
import {
  readSignupParams,
  signupProfileValues,
  type SignupProfileValue,
} from "@/lib/signup-params";
import { getSession } from "@/server/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signup.profile.seo");
  return pageMetadata({ path: "/inscription", title: t("title"), description: t("description") });
}

export default function SignupProfilePage({ searchParams }: PageProps<"/inscription">) {
  return (
    <Suspense fallback={<Skeleton className="h-[640px] w-full max-w-[560px] rounded-card" />}>
      <ProfileStep searchParams={searchParams} />
    </Suspense>
  );
}

const profileLook: Record<SignupProfileValue, { icon: IconName; tile: string; badge: string }> = {
  talent: { icon: "doc", tile: "bg-lime", badge: "bg-lime" },
  rh: { icon: "profil", tile: "bg-brume", badge: "bg-brume" },
  company: { icon: "entreprise", tile: "bg-lime-clair", badge: "bg-lime-clair" },
  partner: { icon: "certificat", tile: "bg-menthe-claire", badge: "bg-menthe-claire" },
};

/** Step 1 · « Vous êtes… » (mockup 02-04). A plain form (GET): it works without JavaScript. */
async function ProfileStep({ searchParams }: Pick<PageProps<"/inscription">, "searchParams">) {
  const params = readSignupParams(await searchParams);
  if (await getSession()) redirect(params.suite ?? "/app");
  const t = await getTranslations("signup");

  if (params.profil === "partner") {
    return (
      <AuthCard width="lg" className="jm-rise">
        <SignupStepper current="profile" paid={false} />
        <AuthHeading
          title={t("profile.partner.redirect.title")}
          subtitle={t("profile.partner.redirect.text")}
        />
        <ButtonLink href="/partenaires#contact" size="lg" fullWidth>
          {t("profile.partner.redirect.cta")}
        </ButtonLink>
        <SignupFooter back="/inscription" />
      </AuthCard>
    );
  }

  return (
    <AuthCard width="lg" className="jm-rise">
      <SignupStepper current="profile" paid={false} />
      <AuthHeading title={t("profile.title")} subtitle={t("profile.subtitle")} />
      <form action="/inscription/forfait" method="get" className="flex flex-col gap-5">
        {params.forfait && <input type="hidden" name="forfait" value={params.forfait} />}
        {params.suite && <input type="hidden" name="suite" value={params.suite} />}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase">
            {t("profile.groupLabel")}
          </legend>
          {signupProfileValues.map((profile) => {
            const look = profileLook[profile];
            return (
              <label key={profile} className={choiceCard}>
                <span
                  aria-hidden
                  className={cx(
                    "flex size-12 shrink-0 items-center justify-center rounded-[14px] text-sapin lg:size-[52px]",
                    look.tile,
                  )}
                >
                  <Icon name={look.icon} className="size-5" />
                </span>
                <span className="flex flex-1 flex-col gap-1.5">
                  <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-base font-bold">
                    {t(`profile.${profile}.title`)}
                    <span
                      className={cx(
                        "rounded-pill px-2.5 py-1 text-[11px] font-semibold",
                        look.badge,
                      )}
                    >
                      {t(`profile.${profile}.badge`)}
                    </span>
                  </span>
                  <span className="text-[13px] leading-[19px] text-ardoise">
                    {t(`profile.${profile}.text`)}
                  </span>
                </span>
                <span className="relative mt-0.5 flex size-[22px] shrink-0">
                  <input
                    type="radio"
                    name="profil"
                    value={profile}
                    required
                    defaultChecked={profile === (params.profil ?? "talent")}
                    className={choiceRadio}
                  />
                  <ChoiceDot />
                </span>
              </label>
            );
          })}
        </fieldset>
        <AuthNote icon="certificat">{t("profile.beneficiary")}</AuthNote>
        <button type="submit" className={buttonClasses({ size: "lg", fullWidth: true })}>
          {t("profile.cta")}
          <Icon name="chev-r" className="size-5" />
        </button>
      </form>
      <SignupFooter />
    </AuthCard>
  );
}
