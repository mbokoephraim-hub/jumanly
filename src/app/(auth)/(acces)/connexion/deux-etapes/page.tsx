import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AccessTop } from "@/components/access/frame";
import { TwoFactorForm } from "@/components/access/forms";
import { TalentIcon } from "@/components/talent/icon";
import { CODE_DIGITS, CODE_MINUTES } from "@/lib/password";
import { isSafeInternalPath } from "@/lib/signup";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login.twoFactor");
  return pageMetadata({
    path: "/connexion/deux-etapes",
    title: t("seo"),
    description: t("text", { digits: CODE_DIGITS }),
    noindex: true,
  });
}

export default function TwoFactorPage({ searchParams }: PageProps<"/connexion/deux-etapes">) {
  return (
    <Suspense fallback={null}>
      <TwoFactor searchParams={searchParams} />
    </Suspense>
  );
}

/** Second step of a sign-in: the code sent by e-mail, drawn like « Vérifier l'e-mail ». */
async function TwoFactor({
  searchParams,
}: Pick<PageProps<"/connexion/deux-etapes">, "searchParams">) {
  const params = await searchParams;
  const suite =
    typeof params.suite === "string" && isSafeInternalPath(params.suite) ? params.suite : undefined;
  const t = await getTranslations("access");
  return (
    <>
      <AccessTop back="/connexion" backLabel={t("back")} title={t("twoFactor.head")} />
      <div className="t-pret">
        <span className="t-env-r">
          <TalentIcon name="cadenas" />
        </span>
        <h2>{t("twoFactor.title")}</h2>
        <p>{t("twoFactor.text", { minutes: CODE_MINUTES })}</p>
      </div>
      <TwoFactorForm next={suite} />
    </>
  );
}
