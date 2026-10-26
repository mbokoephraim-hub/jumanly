import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RhLanguageScreen, RhCompteTexts } from "@/components/phone/recruteur/compte";
import { requireHire } from "@/server/hire-context";
import { isPhone } from "@/server/view";

const PAGE = "/app/hire/compte/langue";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhCompte");
  return { title: t("language.title"), robots: { index: false } };
}

/** Compte of the recruiter's phone (Modèle B recruteur M8). A computer keeps its own page. */
export default async function Page() {
  await requireHire(PAGE);
  if (!(await isPhone())) redirect("/app/parametres");
  return (
    <RhCompteTexts>
      <RhLanguageScreen />
    </RhCompteTexts>
  );
}
