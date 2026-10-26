import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RhTeamScreen, RhCompteTexts } from "@/components/phone/recruteur/compte";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import { isPhone } from "@/server/view";

const PAGE = "/app/hire/compte/equipe";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhCompte");
  return { title: t("team.title"), robots: { index: false } };
}

/** Compte of the recruiter's phone (Modèle B recruteur M8). A computer keeps its own page. */
export default async function Page({ searchParams }: PageProps<"/app/hire/compte/equipe">) {
  const { ctx } = await requireHire(PAGE);
  // On a computer, Équipe is in the company's space, for the owner and the administrators.
  if (!(await isPhone()))
    redirect(
      hirePermissions(ctx.role).administer ? "/app/organisation/equipe" : "/app/hire/compte",
    );
  return (
    <RhCompteTexts>
      <RhTeamScreen ctx={ctx} query={await searchParams} />
    </RhCompteTexts>
  );
}
