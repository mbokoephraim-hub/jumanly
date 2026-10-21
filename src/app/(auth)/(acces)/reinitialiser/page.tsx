import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccessTop } from "@/components/access/frame";
import { ResetForm, TokenResetForm } from "@/components/access/forms";
import { pageMetadata } from "@/lib/seo";
import { db } from "@/server/db";
import { resetLinkEmail } from "@/server/services/accounts";
import { readSignupFlow } from "@/server/signup-flow";
import { isPhone } from "@/server/view";
import { PhoneResetPage } from "@/components/phone/accueil/pages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reset");
  return pageMetadata({
    path: "/reinitialiser",
    title: t("seo.title"),
    description: t("title"),
    noindex: true,
  });
}

export default function ResetPage({ searchParams }: PageProps<"/reinitialiser">) {
  return (
    <Suspense fallback={null}>
      <Reset searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * « Nouveau mot de passe » (planche talent-4): the code sent to the address typed on « Mot de passe
 * oublié », and the new password. A link sent before the codes (`?token=`) still opens its form.
 */
async function Reset({ searchParams }: Pick<PageProps<"/reinitialiser">, "searchParams">) {
  const params = await searchParams;
  const t = await getTranslations("access");
  const top = (
    <AccessTop back="/mot-de-passe-oublie" backLabel={t("back")} title={t("reset.head")} />
  );
  if (typeof params.token === "string" || params.error) {
    const token = typeof params.token === "string" ? params.token.slice(0, 200) : "";
    const valid = token && !params.error ? await resetLinkEmail(db, token) : null;
    if (!valid) {
      const tr = await getTranslations("reset.invalid");
      return (
        <>
          {top}
          <div className="t-ob-q">
            <h1>{tr("title")}</h1>
            <p>{tr("text")}</p>
          </div>
          <Link href="/mot-de-passe-oublie" className="t-bt t-p t-pl t-press">
            {tr("cta")}
          </Link>
        </>
      );
    }
    return (
      <>
        {top}
        <TokenResetForm token={token} />
      </>
    );
  }
  const { resetEmail } = await readSignupFlow();
  if (!resetEmail) redirect("/mot-de-passe-oublie");
  if (await isPhone()) return <PhoneResetPage email={resetEmail} />;
  return (
    <>
      {top}
      <ResetForm email={resetEmail} />
    </>
  );
}
