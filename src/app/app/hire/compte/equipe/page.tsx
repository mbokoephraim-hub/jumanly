import { isModelB } from "@/server/phone-routes";
import { HireV3Team } from "@/components/hire-v3/team";
import { isHireScope } from "@/lib/product-scope";
import { db } from "@/server/db";
import { consultationLog, teamV3 } from "@/server/services/hire-v3-team";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RhTeamScreen, RhCompteTexts } from "@/components/phone/recruteur/compte";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";

const PAGE = "/app/hire/compte/equipe";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhCompte");
  return { title: t("team.title"), robots: { index: false } };
}

/** Compte of the recruiter's phone (Modèle B recruteur M8). A computer keeps its own page. */
export default async function Page({ searchParams }: PageProps<"/app/hire/compte/equipe">) {
  const { ctx } = await requireHire(PAGE);
  if (isHireScope()) {
    const query = await searchParams;
    const perms = hirePermissions(ctx.role);
    const [data, log, org] = await Promise.all([
      teamV3(db, ctx),
      perms.manage ? consultationLog(db, ctx) : null,
      db.organization.findUniqueOrThrow({
        where: { id: ctx.organizationId },
        select: { name: true },
      }),
    ]);
    return (
      <HireV3Team
        data={data}
        log={log}
        tab={query.onglet === "journal" && log ? "journal" : "membres"}
        orgName={org.name}
        canAdminister={perms.administer}
      />
    );
  }
  // On a computer, Équipe is in the company's space, for the owner and the administrators.
  if (!(await isModelB()))
    redirect(
      hirePermissions(ctx.role).administer ? "/app/organisation/equipe" : "/app/hire/compte",
    );
  return (
    <RhCompteTexts>
      <RhTeamScreen ctx={ctx} query={await searchParams} />
    </RhCompteTexts>
  );
}
