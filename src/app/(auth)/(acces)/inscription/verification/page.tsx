import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccessTop } from "@/components/access/frame";
import { VerifyForm } from "@/components/access/forms";
import { TalentIcon } from "@/components/talent/icon";
import { pageMetadata } from "@/lib/seo";
import { readSignupFlow } from "@/server/signup-flow";
import { isPhone } from "@/server/view";
import { PhoneCodePage } from "@/components/phone/accueil/pages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signup.verify");
  return pageMetadata({
    path: "/inscription/verification",
    title: t("seo.title"),
    description: t("title"),
    noindex: true,
  });
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyStep />
    </Suspense>
  );
}

/** « Vérifier l'e-mail » (planche talent-4 § 1): the 6-digit code, valid 15 minutes, 5 attempts. */
async function VerifyStep() {
  const flow = await readSignupFlow();
  if (!flow.email) redirect("/inscription");
  // Modèle B is the talent's phone: a recruiter keeps the code page of their own journey.
  if ((flow.profile ?? "talent") === "talent" && (await isPhone()))
    return <PhoneCodePage email={flow.email} />;
  const t = await getTranslations("access");
  return (
    <>
      <AccessTop back="/inscription/compte" backLabel={t("back")} title={t("verify.head")} />
      <div className="t-pret">
        <span className="t-env-r">
          <TalentIcon name="message" />
        </span>
        <h1>{t("verify.title")}</h1>
        <p>{t("verify.text", { email: flow.email })}</p>
      </div>
      <VerifyForm email={flow.email} />
    </>
  );
}
