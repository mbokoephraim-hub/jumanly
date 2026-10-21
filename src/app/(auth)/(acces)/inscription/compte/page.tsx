import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccessTop } from "@/components/access/frame";
import { SignupForm } from "@/components/access/forms";
import { countryOptions } from "@/config/countries";
import { pageMetadata } from "@/lib/seo";
import { readSignupParams, stepHref } from "@/lib/signup-params";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { readSignupFlow } from "@/server/signup-flow";
import { isPhone } from "@/server/view";
import { PhonePasswordPage } from "@/components/phone/accueil/pages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signup.account");
  return pageMetadata({
    path: "/inscription/compte",
    title: t("seo.title"),
    description: t("title"),
    noindex: true,
  });
}

export default function SignupAccountPage({ searchParams }: PageProps<"/inscription/compte">) {
  return (
    <Suspense fallback={null}>
      <AccountStep searchParams={searchParams} />
    </Suspense>
  );
}

/** « Créer un compte » (planche talent-4 § 1). A talent by default; a recruiter after its plan step. */
async function AccountStep({
  searchParams,
}: Pick<PageProps<"/inscription/compte">, "searchParams">) {
  const params = readSignupParams(await searchParams);
  if (params.profil === "partner") redirect("/partenaires#contact");
  if (await getSession()) redirect(params.suite ?? "/app");
  const profile = params.profil ?? "talent";
  const t = await getTranslations("access");
  // Only a plan of the person's family is kept (a talent plan here, an organization plan there).
  const plan = params.forfait
    ? await db.plan.findFirst({
        where: {
          code: params.forfait,
          family: profile === "talent" ? "talent" : { not: "talent" },
        },
        select: { code: true },
      })
    : null;
  // On a phone (Modèle B), a talent gives the e-mail first, then the password here.
  if (profile === "talent" && (await isPhone())) {
    const { email } = await readSignupFlow();
    if (!email) redirect(stepHref("/inscription", { forfait: plan?.code, suite: params.suite }));
    return <PhonePasswordPage email={email} plan={plan?.code} next={params.suite} />;
  }
  const back =
    profile === "talent"
      ? stepHref("/inscription", { forfait: plan?.code, suite: params.suite })
      : stepHref("/inscription/forfait", { ...params, forfait: plan?.code });
  return (
    <>
      <AccessTop back={back} backLabel={t("back")} title={t("account.head")} />
      {/* From the tablet on, the name of the screen is shown as the question (refonte-web talent-4). */}
      <div className="t-ob-q t-vu-large" aria-hidden>
        <h2>{t("account.head")}</h2>
        <p>{t("account.subtitle")}</p>
      </div>
      <SignupForm
        profile={profile}
        plan={plan?.code}
        next={params.suite}
        defaultEmail={(await readSignupFlow()).email}
        countries={profile === "talent" ? undefined : countryOptions("code")}
      />
    </>
  );
}
