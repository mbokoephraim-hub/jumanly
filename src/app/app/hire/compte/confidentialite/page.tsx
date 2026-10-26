import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RhPrivacyScreen, RhCompteTexts } from "@/components/phone/recruteur/compte";
import { requireHire } from "@/server/hire-context";
import { isPhone } from "@/server/view";

const PAGE = "/app/hire/compte/confidentialite";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhCompte");
  return { title: t("privacy.title"), robots: { index: false } };
}

/** Compte of the recruiter's phone (Modèle B recruteur M8). A computer keeps its own page. */
export default async function Page({
  searchParams,
}: PageProps<"/app/hire/compte/confidentialite">) {
  const { ctx } = await requireHire(PAGE);
  if (!(await isPhone())) redirect("/app/parametres/confidentialite");
  return (
    <RhCompteTexts>
      <RhPrivacyScreen ctx={ctx} query={await searchParams} />
    </RhCompteTexts>
  );
}
