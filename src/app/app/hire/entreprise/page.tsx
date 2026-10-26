import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RhCompanyModeScreen, RhCompteTexts } from "@/components/phone/recruteur/compte";
import { requireHire } from "@/server/hire-context";
import { isOrgAdmin } from "@/server/services/hire-phone-account";
import { isPhone } from "@/server/view";

const PAGE = "/app/hire/entreprise";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhCompte");
  return { title: t("mode.line"), robots: { index: false } };
}

/** Compte of the recruiter's phone (Modèle B recruteur M8). A computer keeps its own page. */
export default async function Page({ searchParams }: PageProps<"/app/hire/entreprise">) {
  const { ctx } = await requireHire(PAGE);
  if (!(await isPhone())) redirect("/app/organisation");
  // « Agir au nom de l'entreprise » belongs to the page's administrators (planche 186).
  if (!isOrgAdmin(ctx.role)) redirect("/app/hire/compte");
  return (
    <RhCompteTexts>
      <RhCompanyModeScreen ctx={ctx} query={await searchParams} />
    </RhCompteTexts>
  );
}
