import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AccessTop } from "@/components/access/frame";
import { ForgotForm } from "@/components/access/forms";
import { interpolate, slot } from "@/lib/interpolate";
import { CODE_DIGITS } from "@/lib/password";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("forgot.seo");
  return pageMetadata({
    path: "/mot-de-passe-oublie",
    title: t("title"),
    description: t("description"),
    noindex: true,
  });
}

const SUPPORT = "assistant@jumanly.io";

/** « Mot de passe oublié » (planche talent-4): the address, then a 6-digit code by e-mail. */
export default async function ForgotPage() {
  const t = await getTranslations("access");
  return (
    <>
      <AccessTop back="/connexion" backLabel={t("back")} title={t("forgot.head")} />
      <div className="t-ob-q">
        <h2>{t("forgot.title")}</h2>
        <p>{t("forgot.text", { digits: CODE_DIGITS })}</p>
      </div>
      <ForgotForm />
      <p className="t-mention">
        {interpolate(t("forgot.help", { email: slot("email") }), {
          email: <Link href={`mailto:${SUPPORT}`}>{SUPPORT}</Link>,
        })}
      </p>
    </>
  );
}
