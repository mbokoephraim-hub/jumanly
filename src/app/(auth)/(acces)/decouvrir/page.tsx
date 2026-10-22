import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PhoneDiscover } from "@/components/phone/accueil/discover";
import { DISCOVER_FLAG_SCRIPT } from "@/components/phone/accueil/discover-flag";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneAccueil.welcome");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/**
 * « Bienvenue » au téléphone (Modèle B, planche Accueil): the animated logo (long the first time on
 * this phone, short afterwards), then three screens and « Créer un compte » / « Se connecter ».
 * On a computer, the home page plays that part.
 */
export default async function DiscoverPage({ searchParams }: PageProps<"/decouvrir">) {
  const { profil } = await searchParams;
  // The recruiter's welcome (Modèle B recruteur, M2): publier, trier, recruter.
  const recruiter = profil === "rh";
  if (!(await isPhone())) redirect(recruiter ? "/recruteurs" : "/");
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DISCOVER_FLAG_SCRIPT }} />
      <PhoneDiscover recruiter={recruiter} />
    </>
  );
}
