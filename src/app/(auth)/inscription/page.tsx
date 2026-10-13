import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthCard, AuthHeading, SignupStepper } from "@/components/auth/auth-card";
import { Alert, Badge, Button, ButtonLink, Skeleton } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { readSignupParams, signupProfileValues } from "@/lib/signup-params";
import { getSession } from "@/server/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signup.profile.seo");
  return pageMetadata({ path: "/inscription", title: t("title"), description: t("description") });
}

export default function SignupProfilePage({ searchParams }: PageProps<"/inscription">) {
  return (
    <Suspense fallback={<Skeleton className="h-[640px] rounded-card" />}>
      <ProfileStep searchParams={searchParams} />
    </Suspense>
  );
}

/** Step 1 · « Vous êtes… ». A plain form (GET): it works without JavaScript. */
async function ProfileStep({ searchParams }: Pick<PageProps<"/inscription">, "searchParams">) {
  const params = readSignupParams(await searchParams);
  if (await getSession()) redirect(params.suite ?? "/app");
  const t = await getTranslations("signup");

  if (params.profil === "partner") {
    return (
      <AuthCard>
        <SignupStepper current="profile" paid={false} />
        <AuthHeading
          title={t("profile.partner.redirect.title")}
          subtitle={t("profile.partner.redirect.text")}
        />
        <ButtonLink href="/partenaires#contact" size="lg">
          {t("profile.partner.redirect.cta")}
        </ButtonLink>
        <Link href="/inscription" className="text-sm underline">
          {t("back")}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <SignupStepper current="profile" paid={false} />
      <AuthHeading title={t("profile.title")} subtitle={t("profile.subtitle")} />
      <form action="/inscription/forfait" method="get" className="flex flex-col gap-4">
        {params.forfait && <input type="hidden" name="forfait" value={params.forfait} />}
        {params.suite && <input type="hidden" name="suite" value={params.suite} />}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-semibold">{t("profile.groupLabel")}</legend>
          {signupProfileValues.map((profile) => (
            <label
              key={profile}
              className="flex cursor-pointer gap-4 rounded-card border-2 border-brume bg-blanc p-4 has-checked:border-sapin has-focus-visible:ring-3 has-focus-visible:ring-feuille/40"
            >
              <input
                type="radio"
                name="profil"
                value={profile}
                required
                defaultChecked={profile === (params.profil ?? "talent")}
                className="mt-1 size-5 shrink-0 accent-sapin"
              />
              <span className="flex flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2 font-semibold">
                  {t(`profile.${profile}.title`)}
                  <Badge tone={profile === "talent" ? "lime" : "neutral"}>
                    {t(`profile.${profile}.badge`)}
                  </Badge>
                </span>
                <span className="text-sm text-ardoise">{t(`profile.${profile}.text`)}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <Alert title={t("profile.beneficiary")} />
        <Button type="submit" size="lg" fullWidth>
          {t("profile.cta")}
        </Button>
      </form>
      <p className="text-sm">
        {t("hasAccount")}{" "}
        <Link href="/connexion" className="font-semibold underline">
          {t("loginLink")}
        </Link>
      </p>
    </AuthCard>
  );
}
